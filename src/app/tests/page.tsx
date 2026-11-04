"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import {
  Subject,
  PracticeTest,
  TestAttempt,
} from "@/types/database";
import { generatePracticeTest, evaluateTestAttempt } from "@/lib/testEngine";
import {
  FileQuestion,
  Sparkles,
  Clock,
  Play,
  BookOpen,
  Upload,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function SmartTestsPage() {
  const { user, student } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [testType, setTestType] = useState<PracticeTest["test_type"]>("mcq");
  const sourceMaterialName = "ICAI / Taxmann Study Material";

  // Tests & Active Test Runner State
  const [savedTests, setSavedTests] = useState<PracticeTest[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [currentTest, setCurrentTest] = useState<PracticeTest | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<TestAttempt | null>(null);

  // File upload state for custom material
  const [customMaterialFile, setCustomMaterialFile] = useState<File | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmitTest = useCallback(() => {
    if (!currentTest) return;
    setIsTestActive(false);

    const timeSpent = currentTest.duration_minutes * 60 - timerSecondsRemaining;
    const attempt = evaluateTestAttempt(currentTest, userAnswers, Math.max(10, timeSpent));

    setCompletedAttempt(attempt);
    StorageRepository.saveTestAttempt(attempt, user?.id);
    setTestAttempts((prev) => [attempt, ...prev]);

    if (attempt.passed) {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch {
        // no-op
      }
    }
  }, [currentTest, timerSecondsRemaining, userAnswers, user?.id]);

  useEffect(() => {
    const userId = user?.id;
    const subs = StorageRepository.getSubjects(userId);
    setSubjects(subs);
    if (subs.length > 0 && !selectedSubject) {
      setSelectedSubject(subs[0].name);
    }
    const tests = StorageRepository.getPracticeTests(userId);
    setSavedTests(tests);
    const attempts = StorageRepository.getTestAttempts(userId);
    setTestAttempts(attempts);
  }, [user?.id, selectedSubject]);

  // Timer Tick
  useEffect(() => {
    if (isTestActive && timerSecondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestActive, timerSecondsRemaining, handleSubmitTest]);

  const handleGenerateNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    const test = generatePracticeTest({
      studentId: user?.id || "guest",
      course: student?.course || "CA Intermediate",
      subjectName: selectedSubject || "Core Subject",
      chapterTitle: selectedChapter || undefined,
      testType: testType,
      sourceMaterialName: customMaterialFile ? customMaterialFile.name : sourceMaterialName,
    });

    StorageRepository.savePracticeTest(test, user?.id);
    setSavedTests((prev) => [test, ...prev]);
    startTest(test);
  };

  const startTest = (test: PracticeTest) => {
    setCurrentTest(test);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setCompletedAttempt(null);
    setTimerSecondsRemaining(test.duration_minutes * 60);
    setIsTestActive(true);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span>Original Examination Test Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Smart Exam Test Generator & Practice
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate authentic MCQs, numerical calculation drills, statutory theory cases, and timed mock tests.
          </p>
        </div>

        {/* Test stats pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Tests Attempted</p>
            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{testAttempts.length}</p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Avg Accuracy</p>
            <p className="text-lg font-black text-purple-600 dark:text-purple-400">
              {testAttempts.length > 0
                ? `${Math.round(testAttempts.reduce((acc, a) => acc + a.percentage, 0) / testAttempts.length)}%`
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVE TEST RUNNER MODAL / VIEW */}
      {currentTest && isTestActive && (
        <div className="rounded-3xl border-2 border-indigo-500 bg-white p-6 shadow-2xl dark:border-indigo-600 dark:bg-slate-900 animate-slide-up">
          {/* Test Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {currentTest.course} • {currentTest.subject_name}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {currentTest.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Live Countdown Timer */}
              <div className="flex items-center gap-1.5 rounded-2xl bg-indigo-50 px-3.5 py-1.5 font-mono text-sm font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                <Clock className="h-4 w-4 text-indigo-500 animate-pulse" />
                <span>{formatTimer(timerSecondsRemaining)}</span>
              </div>

              <button
                onClick={handleSubmitTest}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Question View */}
          {currentTest.questions.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Question {currentQuestionIndex + 1} of {currentTest.questions.length}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {currentTest.questions[currentQuestionIndex].marks} Marks
                </span>
              </div>

              {/* Prompt */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-100 leading-relaxed">
                {currentTest.questions[currentQuestionIndex].prompt}
              </div>

              {/* MCQ Options or Text Input */}
              {currentTest.questions[currentQuestionIndex].type === "mcq" &&
              currentTest.questions[currentQuestionIndex].options ? (
                <div className="space-y-2 mt-4">
                  {currentTest.questions[currentQuestionIndex].options!.map((opt, oIdx) => {
                    const currentQ = currentTest.questions[currentQuestionIndex];
                    const isSelected = userAnswers[currentQ.id] === opt;
                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleAnswerChange(currentQ.id, opt)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer text-xs font-semibold transition ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200"
                            : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 mt-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Write your step-by-step solution / final numerical answer:
                  </label>
                  <textarea
                    rows={6}
                    value={userAnswers[currentTest.questions[currentQuestionIndex].id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentTest.questions[currentQuestionIndex].id, e.target.value)
                    }
                    placeholder="Provide your working notes, formula step, and final computed answer..."
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {/* Navigation Between Questions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 disabled:opacity-40"
                >
                  Previous Question
                </button>

                <div className="flex gap-1.5">
                  {currentTest.questions.map((_, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(qIdx)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                        currentQuestionIndex === qIdx
                          ? "bg-indigo-600 text-white"
                          : userAnswers[currentTest.questions[qIdx].id]
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {qIdx + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIndex < currentTest.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitTest}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
                  >
                    Finish Test
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPLETED ATTEMPT PERFORMANCE ANALYSIS REPORT */}
      {completedAttempt && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-slide-up space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Examination Performance Analysis
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Score: {completedAttempt.score} / {completedAttempt.total_marks} ({completedAttempt.percentage}%)
              </h3>
            </div>
            <span
              className={`rounded-xl px-3 py-1 text-xs font-extrabold ${
                completedAttempt.passed
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              {completedAttempt.passed ? "PASSED (Qualified)" : "REVISION REQUIRED"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Teacher Advice */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20 md:col-span-3">
              <p className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="h-4 w-4" />
                <span>Teacher&apos;s Diagnostic Feedback</span>
              </p>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                {completedAttempt.analysis.teacher_advice}
              </p>
            </div>

            {/* Weak Areas */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
              <p className="font-bold text-rose-700 dark:text-rose-400 mb-1.5">Identified Topic Gaps</p>
              {completedAttempt.analysis.weak_topics.length > 0 ? (
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {completedAttempt.analysis.weak_topics.map((w, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-emerald-600">No major gaps detected!</p>
              )}
            </div>

            {/* Strong Areas */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20 md:col-span-2">
              <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">Demonstrated Masteries</p>
              {completedAttempt.analysis.strong_topics.length > 0 ? (
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {completedAttempt.analysis.strong_topics.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-500">Practice more to unlock masteries.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCompletedAttempt(null)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white dark:bg-slate-700 hover:bg-slate-900"
            >
              Close Analysis & Return to Hub
            </button>
          </div>
        </div>
      )}

      {/* Test Generator Form & Recent Practice Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Generator Form */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleGenerateNewTest}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3.5 text-xs"
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-purple-500" />
              <span>Configure Practice Test</span>
            </h3>

            {/* Subject Selector */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Enrolled Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Input */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Chapter Title (Optional)</label>
              <input
                type="text"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                placeholder="e.g. Valuation of Inventories or Full Syllabus"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Test Type */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Practice Test Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestType("mcq")}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                    testType === "mcq"
                      ? "border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                      : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                  }`}
                >
                  <p className="font-bold">MCQ Test</p>
                  <p className="text-[10px] text-slate-400">Objective Instant Scoring</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType("numerical")}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                    testType === "numerical"
                      ? "border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                      : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                  }`}
                >
                  <p className="font-bold">Numerical Drill</p>
                  <p className="text-[10px] text-slate-400">Step-by-Step Calculation</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType("theory")}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                    testType === "theory"
                      ? "border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                      : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                  }`}
                >
                  <p className="font-bold">Theory Questions</p>
                  <p className="text-[10px] text-slate-400">Model Answers & Points</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTestType("case_study")}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                    testType === "case_study"
                      ? "border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                      : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                  }`}
                >
                  <p className="font-bold">Case Study</p>
                  <p className="text-[10px] text-slate-400">Practical Application</p>
                </button>
              </div>
            </div>

            {/* Upload Custom Textbook / Material */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Upload Custom Study Material or Notes (Optional)
              </label>
              <label className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <Upload className="h-5 w-5 text-purple-500 mb-1" />
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  {customMaterialFile ? customMaterialFile.name : "Attach PDF, Taxmann excerpts, or PYQ papers"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCustomMaterialFile(e.target.files[0]);
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:from-purple-500 hover:to-indigo-500 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate & Launch Test</span>
            </button>
          </form>
        </div>

        {/* Right: Available Tests & Previous Attempts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <span>Available Practice Tests for {student?.course || "Your Curriculum"}</span>
            </h3>

            {savedTests.length === 0 ? (
              <div className="text-center py-8">
                <FileQuestion className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No custom tests generated yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Use the left form to generate an original practice test from your enrolled subjects!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/40 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {test.title}
                        </span>
                        <span className="rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 text-[9px] font-bold uppercase">
                          {test.test_type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {test.questions.length} Questions • {test.total_marks} Marks • {test.duration_minutes} Mins
                      </p>
                    </div>

                    <button
                      onClick={() => startTest(test)}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Start</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
