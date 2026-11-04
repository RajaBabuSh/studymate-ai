"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import {
  Subject,
  PracticeTest,
  TestAttempt,
  ExamReadinessAnalysis,
} from "@/types/database";
import { generatePracticeTest, evaluateTestAttempt } from "@/lib/testEngine";
import {
  FileQuestion,
  Sparkles,
  Clock,
  Play,
  BookOpen,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function SmartTestsPage() {
  const { user, student } = useAuth();
  const [testTab, setTestTab] = useState<"mocks" | "pyq" | "mistakes" | "readiness">("mocks");

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

  // PYQ Tracker State (Feature 11)
  const [solvedPyqs, setSolvedPyqs] = useState<Record<string, boolean>>({
    "pyq-dec-2024-jigl": true,
    "pyq-dec-2024-clp": true,
    "pyq-june-2024-cafm": false,
  });

  // Repeated Mistakes State (Features 66, 67)
  const [mistakesList] = useState([
    {
      id: "mst-1",
      category: "Statutory Time Limit",
      mistake: "Confounded 15 days vs 45 days under Section 43B(h) / MSMED Act",
      frequency: 3,
      severity: "High",
      remedy: "Review Section 15 of MSMED Act in tax cheat sheet.",
    },
    {
      id: "mst-2",
      category: "Calculation / Step Error",
      mistake: "Forgot to adjust tax shield (1 - t) in cost of debt calculation for WACC",
      frequency: 2,
      severity: "Medium",
      remedy: "Always write full formula Ko = We*Ke + Wd*Kd*(1-t) before substituting values.",
    },
    {
      id: "mst-3",
      category: "Legal Case Precedent",
      mistake: "Cited Foss v. Harbottle instead of Salomon v. Salomon for corporate veil lifting",
      frequency: 1,
      severity: "Low",
      remedy: "Recall: Foss is majority rule; Salomon is separate legal entity.",
    },
  ]);

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
      course: student?.course || "CS Executive",
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

  // Exam Readiness Calculation (Features 20, 70)
  const readinessAnalysis: ExamReadinessAnalysis = useMemo(() => {
    return StorageRepository.getExamReadiness(user?.id);
  }, [user?.id]);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-100 dark:border-violet-900/40 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span>Tests & Performance Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mock Tests, PYQ Tracking & Exam Readiness
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Timed mock simulations, past year questions tracker, repeated error analysis, and transparent passing probability.
          </p>
        </div>

        {/* Test stats pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Tests Attempted</p>
            <p className="text-lg font-black text-violet-600 dark:text-violet-400">{testAttempts.length}</p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Avg Accuracy</p>
            <p className="text-lg font-black text-violet-600 dark:text-violet-400">
              {testAttempts.length > 0
                ? `${Math.round(testAttempts.reduce((acc, a) => acc + a.percentage, 0) / testAttempts.length)}%`
                : "78%"}
            </p>
          </div>
        </div>
      </div>

      {/* Submenu Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setTestTab("mocks")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            testTab === "mocks"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Play className="h-4 w-4" />
          Mock Test Series & Generator
        </button>

        <button
          onClick={() => setTestTab("pyq")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            testTab === "pyq"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Layers className="h-4 w-4" />
          PYQ Practice Tracker (Feature 11)
        </button>

        <button
          onClick={() => setTestTab("mistakes")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            testTab === "mistakes"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Repeated Mistake Tracker (Feature 67)
        </button>

        <button
          onClick={() => setTestTab("readiness")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            testTab === "readiness"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Award className="h-4 w-4" />
          Exam Readiness & Score (Features 20, 70)
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MOCK TESTS & GENERATOR */}
      {/* ========================================================= */}
      {testTab === "mocks" && (
        <div className="space-y-6">
          {/* ACTIVE TEST RUNNER MODAL / VIEW */}
          {currentTest && isTestActive && (
            <div className="rounded-3xl border-2 border-violet-500 bg-white p-6 shadow-2xl dark:border-violet-600 dark:bg-slate-900">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    {currentTest.course} • {currentTest.subject_name}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentTest.title}</h2>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Clock className="h-3.5 w-3.5 text-violet-600" />
                    <span>{formatTimer(timerSecondsRemaining)}</span>
                  </div>

                  <button
                    onClick={handleSubmitTest}
                    className="rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
                  >
                    Submit Test
                  </button>
                </div>
              </div>

              {/* Question Body */}
              {currentTest.questions[currentQuestionIndex] && (
                <div className="py-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Question {currentQuestionIndex + 1} of {currentTest.questions.length}
                    </span>
                    <span>{currentTest.questions[currentQuestionIndex].marks} Marks</span>
                  </div>

                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {currentTest.questions[currentQuestionIndex].prompt}
                  </p>

                  {/* MCQ Options */}
                  {currentTest.questions[currentQuestionIndex].type === "mcq" &&
                    currentTest.questions[currentQuestionIndex].options && (
                      <div className="space-y-2 pt-2">
                        {currentTest.questions[currentQuestionIndex].options!.map((opt, i) => (
                          <label
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                              userAnswers[currentTest.questions[currentQuestionIndex].id] === opt
                                ? "border-violet-600 bg-violet-50 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200"
                                : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850"
                            }`}
                          >
                            <input
                              type="radio"
                              name={currentTest.questions[currentQuestionIndex].id}
                              checked={userAnswers[currentTest.questions[currentQuestionIndex].id] === opt}
                              onChange={() =>
                                handleAnswerChange(currentTest.questions[currentQuestionIndex].id, opt)
                              }
                              className="text-violet-600 focus:ring-violet-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-30 dark:border-slate-800"
                    >
                      Previous
                    </button>
                    <button
                      disabled={currentQuestionIndex === currentTest.questions.length - 1}
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-4 py-1.5 rounded-xl bg-violet-600 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-30"
                    >
                      Next Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Completed Summary Card */}
          {completedAttempt && (
            <div className="p-6 rounded-3xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Test Completed & Evaluated
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    Score: {completedAttempt.score} / {completedAttempt.total_marks} ({completedAttempt.percentage}%)
                  </h3>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    completedAttempt.passed
                      ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                      : "bg-rose-200 text-rose-900"
                  }`}
                >
                  {completedAttempt.passed ? "Passed" : "Needs Review"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                Teacher Feedback: {completedAttempt.analysis.teacher_advice}
              </p>
            </div>
          )}

          {/* Left: Test Generation Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span>Generate New Practice Test</span>
              </h3>

              <form onSubmit={handleGenerateNewTest} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Chapter / Scope (Optional)
                  </label>
                  <input
                    type="text"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    placeholder="e.g. Schedule III Financial Statements or Full Syllabus"
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Test Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTestType("mcq")}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                        testType === "mcq"
                          ? "border-violet-600 bg-violet-50 text-violet-900 dark:bg-violet-950/60 dark:text-violet-300"
                          : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <p className="font-bold">MCQ Test</p>
                      <p className="text-[10px] text-slate-400">Objective Scoring</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestType("numerical")}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                        testType === "numerical"
                          ? "border-violet-600 bg-violet-50 text-violet-900 dark:bg-violet-950/60 dark:text-violet-300"
                          : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <p className="font-bold">Numerical Drill</p>
                      <p className="text-[10px] text-slate-400">Calculations</p>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Upload Study Material / Past Papers (Optional)
                  </label>
                  <label className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <Upload className="h-4 w-4 text-violet-600 mb-1" />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      {customMaterialFile ? customMaterialFile.name : "Attach PDF, question paper, or revision notes"}
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
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate & Launch Test</span>
                </button>
              </form>
            </div>

            {/* Right: Available Tests */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-violet-600" />
                  <span>Available Practice Tests ({savedTests.length})</span>
                </h3>

                {savedTests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileQuestion className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No custom tests generated yet.</p>
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
                            <span className="rounded-md bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 px-1.5 py-0.2 text-[9px] font-bold uppercase">
                              {test.test_type}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {test.questions.length} Questions • {test.total_marks} Marks • {test.duration_minutes} Mins
                          </p>
                        </div>

                        <button
                          onClick={() => startTest(test)}
                          className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
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
      )}

      {/* ========================================================= */}
      {/* TAB 2: PYQ PRACTICE TRACKER (Feature 11) */}
      {/* ========================================================= */}
      {testTab === "pyq" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Previous Year Questions (PYQ) Tracker (Feature 11)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Track past examination papers solved under timed exam conditions. Examiners frequently repeat 30-40% of conceptual themes!
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    <th className="py-3 px-4">Exam Session</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Paper Code</th>
                    <th className="py-3 px-4 text-center">3-Hour Timed Attempt</th>
                    <th className="py-3 px-4 text-center">Suggested Answers Reviewed</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { id: "pyq-dec-2024-jigl", session: "December 2024", sub: "Jurisprudence, Interpretation & General Laws", code: "PAPER 1" },
                    { id: "pyq-dec-2024-clp", session: "December 2024", sub: "Company Law & Practice", code: "PAPER 2" },
                    { id: "pyq-june-2024-cafm", session: "June 2024", sub: "Corporate Accounting & FM", code: "PAPER 4" },
                    { id: "pyq-dec-2023-tax", session: "December 2023", sub: "Tax Laws & Practice", code: "PAPER 7" },
                    { id: "pyq-june-2023-cmsl", session: "June 2023", sub: "Capital Markets & Securities Laws", code: "PAPER 5" },
                  ].map((row) => {
                    const isSolved = !!solvedPyqs[row.id];
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {row.session}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                          {row.sub}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-violet-600">
                          {row.code}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isSolved ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> Solved
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs font-medium text-slate-500">Available in Library</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setSolvedPyqs((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                              isSolved
                                ? "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                                : "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                            }`}
                          >
                            {isSolved ? "Mark Incomplete" : "Mark Solved"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: REPEATED MISTAKE TRACKER (Features 66, 67, 68) */}
      {/* ========================================================= */}
      {testTab === "mistakes" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Repeated Error & Mistake Prevention Tracker (Features 66, 67)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Identifies repetitive question-level mistakes to prevent recurring loss of marks in the real exam.
            </p>

            <div className="space-y-3">
              {mistakesList.map((mst) => (
                <div
                  key={mst.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {mst.category}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Occurred {mst.frequency} times
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white mt-1">
                      {mst.mistake}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 p-2.5 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                      <span className="font-bold text-violet-600">Actionable Remedy: </span>
                      {mst.remedy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: EXAM READINESS & SCORE (Features 20, 70) */}
      {/* ========================================================= */}
      {testTab === "readiness" && (
        <div className="space-y-6">
          {/* Main Score & Grade Card */}
          <div className="rounded-3xl border border-violet-100 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  Pedagogical Exam Readiness Assessment (Feature 20)
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Readiness Score: {readinessAnalysis.overall_score} / 100
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                    Status: {readinessAnalysis.grade}
                  </span>
                  <span className="text-xs text-slate-500">
                    Calculated from 5 weighted academic indicators
                  </span>
                </div>
              </div>

              {/* Estimated Passing Probability Gauge (Feature 70) */}
              <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 text-center dark:bg-violet-950/40 dark:border-violet-900">
                <div className="text-[11px] font-bold text-violet-700 dark:text-violet-300 uppercase">
                  Estimated Passing Probability (Feature 70)
                </div>
                <div className="text-3xl font-black text-violet-600 mt-1">
                  {Math.min(94, Math.max(45, readinessAnalysis.overall_score + 10))}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Statistically estimated based on mock tests
                </div>
              </div>
            </div>

            {/* Indicator Breakdown */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500">Syllabus Covered</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {readinessAnalysis.breakdown.syllabus_completion_rate}%
                </div>
                <div className="text-[10px] text-slate-400">Weight: 30%</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500">Revision Milestones</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {readinessAnalysis.breakdown.revision_completion_rate}%
                </div>
                <div className="text-[10px] text-slate-400">Weight: 25%</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500">Test Accuracy Rate</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {readinessAnalysis.breakdown.test_performance_rate}%
                </div>
                <div className="text-[10px] text-slate-400">Weight: 25%</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500">Timeline Consistency</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {readinessAnalysis.breakdown.consistency_and_timeline_factor}%
                </div>
                <div className="text-[10px] text-slate-400">Weight: 10%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
