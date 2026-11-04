"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import {
  Subject,
  Chapter,
  ExamTargetPlan,
  PlanValidationError,
} from "@/types/database";
import { generateExamTargetPlan, validatePlan } from "@/lib/examPlannerEngine";
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Award,
  ShieldAlert,
  RefreshCw,
  Sliders,
  Check,
  Compass,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ExamPlannerPage() {
  const { user, student, updateStudentProfile } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [examPlan, setExamPlan] = useState<ExamTargetPlan | null>(null);

  // Form inputs
  const [examName, setExamName] = useState(student?.target_exam || "CA Intermediate Examination");
  const [examDate, setExamDate] = useState(student?.upcoming_exam_date || "2027-05-15");
  const [dailyHours, setDailyHours] = useState(student?.daily_available_hours || 4.5);
  const [prepPercentage, setPrepPercentage] = useState(student?.preparation_percentage || 35);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);

  // Validation & Error Warning State
  const [validationErrors, setValidationErrors] = useState<PlanValidationError[]>([]);
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "kept_existing">>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "allocations" | "revisions" | "mocks" | "warnings">("overview");

  // Load Initial Data
  const loadInitialData = useCallback(() => {
    const userId = user?.id;
    const subs = StorageRepository.getSubjects(userId);
    const chaps = StorageRepository.getChapters(userId);
    const savedPlan = StorageRepository.getExamPlan(userId);
    const savedDecisions = StorageRepository.getPlanDecisions(userId);

    setSubjects(subs);
    setChapters(chaps);
    setDecisions(savedDecisions);

    if (savedPlan) {
      setExamPlan(savedPlan);
      setExamName(savedPlan.exam_name);
      setExamDate(savedPlan.exam_date);
      setDailyHours(savedPlan.daily_study_target_hours);
      setPrepPercentage(savedPlan.current_prep_percentage);
      setWeakSubjects(savedPlan.weak_subjects || []);
      setStrongSubjects(savedPlan.strong_subjects || []);

      const errs = validatePlan(savedPlan, chaps, savedPlan.daily_study_target_hours);
      setValidationErrors(errs);
    } else if (subs.length > 0) {
      // Auto-generate initial plan
      const initPlan = generateExamTargetPlan({
        studentId: userId || "guest",
        examName: student?.target_exam || "Upcoming Examination",
        examDate: student?.upcoming_exam_date || "2027-05-15",
        course: student?.course || "CA Intermediate",
        dailyHours: student?.daily_available_hours || 4.5,
        currentPrepPercentage: 35,
        weakSubjects: [subs[0].name],
        strongSubjects: subs.length > 1 ? [subs[1].name] : [],
        subjects: subs,
        chapters: chaps,
      });
      setExamPlan(initPlan);
      StorageRepository.setExamPlan(initPlan, userId);
      const errs = validatePlan(initPlan, chaps, initPlan.daily_study_target_hours);
      setValidationErrors(errs);
    }
  }, [user?.id, student?.target_exam, student?.upcoming_exam_date, student?.course, student?.daily_available_hours]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Generate / Recalculate
  const handleGeneratePlan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const newPlan = generateExamTargetPlan({
        studentId: user?.id || "guest",
        examName,
        examDate,
        course: student?.course || "Academic Course",
        dailyHours: Number(dailyHours),
        currentPrepPercentage: Number(prepPercentage),
        weakSubjects,
        strongSubjects,
        subjects,
        chapters,
      });

      setExamPlan(newPlan);
      StorageRepository.setExamPlan(newPlan, user?.id);

      // Validate plan
      const errs = validatePlan(newPlan, chapters, Number(dailyHours));
      setValidationErrors(errs);

      // Update student profile with new exam date and target
      updateStudentProfile({
        target_exam: examName,
        upcoming_exam_date: examDate,
        daily_available_hours: Number(dailyHours),
        weak_subjects: weakSubjects,
        strong_subjects: strongSubjects,
        preparation_percentage: Number(prepPercentage),
      });

      setIsGenerating(false);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {
        // no-op
      }
    }, 400);
  };

  // Toggle Weak / Strong Subject Tag
  const toggleSubjectStatus = (subName: string, type: "weak" | "strong") => {
    if (type === "weak") {
      setWeakSubjects((prev) =>
        prev.includes(subName) ? prev.filter((s) => s !== subName) : [...prev, subName]
      );
      setStrongSubjects((prev) => prev.filter((s) => s !== subName));
    } else {
      setStrongSubjects((prev) =>
        prev.includes(subName) ? prev.filter((s) => s !== subName) : [...prev, subName]
      );
      setWeakSubjects((prev) => prev.filter((s) => s !== subName));
    }
  };

  // Handle Student Decision on Validation Errors
  const handleDecision = (errorId: string, decision: "accepted" | "kept_existing", err: PlanValidationError) => {
    const updated = { ...decisions, [errorId]: decision };
    setDecisions(updated);
    StorageRepository.savePlanDecision(errorId, decision, user?.id);

    if (decision === "accepted") {
      // Execute correction
      if (err.issue_type === "unrealistic_duration" || err.issue_type === "excessive_workload") {
        setDailyHours(6.5);
      }
      setTimeout(() => {
        handleGeneratePlan();
      }, 300);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Experienced Teacher Planning Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            AI Exam Target Planner & Validation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sound pedagogical schedule considering official weightage, numerical alert slots, spaced revisions, and realistic capacities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/roadmap"
            className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md hover:from-violet-500 hover:to-indigo-500 transition active:scale-95"
          >
            <Compass className="h-4 w-4 text-white" />
            <span>Open Smart Roadmap</span>
          </Link>

          {/* Quick KPI badge */}
          {examPlan && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Exam Countdown</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {examPlan.remaining_days} Days Left
                </p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Daily Target</span>
                <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                  {examPlan.daily_study_target_hours}h / day
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODULE 4: RED VALIDATION WARNINGS SECTION (If Any Issues Detected) */}
      {validationErrors.length > 0 && (
        <div className="space-y-3">
          {validationErrors.map((err) => {
            const currentDecision = decisions[err.id];
            const isResolved = currentDecision === "accepted";

            return (
              <div
                key={err.id}
                className={`rounded-3xl border-2 p-4 transition-all ${
                  isResolved
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    : "border-rose-500 bg-rose-50/80 dark:border-rose-900/80 dark:bg-rose-950/30 shadow-lg shadow-rose-500/5 animate-slide-up"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                      isResolved
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : "bg-rose-500 text-white animate-pulse"
                    }`}
                  >
                    {isResolved ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            isResolved
                              ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          {isResolved ? "Correction Accepted" : "AI Validation Warning"}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {err.title}
                        </h4>
                      </div>

                      {currentDecision && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          Decision: {currentDecision === "accepted" ? "Accepted" : "Kept Existing"}
                        </span>
                      )}
                    </div>

                    {/* 3-Part Card Structure */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* 1. What is wrong? */}
                      <div className="rounded-2xl border border-rose-200/60 bg-white/80 p-3 dark:border-rose-900/40 dark:bg-slate-900/60">
                        <p className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1 mb-1">
                          <span>1. What is wrong?</span>
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          {err.what_is_wrong}
                        </p>
                      </div>

                      {/* 2. Why is it a problem? */}
                      <div className="rounded-2xl border border-rose-200/60 bg-white/80 p-3 dark:border-rose-900/40 dark:bg-slate-900/60">
                        <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
                          <span>2. Why is it a problem?</span>
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          {err.why_is_it_a_problem}
                        </p>
                      </div>

                      {/* 3. What does AI recommend? */}
                      <div className="rounded-2xl border border-rose-200/60 bg-white/80 p-3 dark:border-rose-900/40 dark:bg-slate-900/60">
                        <p className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1 mb-1">
                          <span>3. What does AI recommend?</span>
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          {err.ai_recommendation}
                        </p>
                      </div>
                    </div>

                    {/* Student Decision Action Buttons */}
                    <div className="mt-3.5 flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleDecision(err.id, "kept_existing", err)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition ${
                          currentDecision === "kept_existing"
                            ? "border-slate-400 bg-slate-200 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        }`}
                      >
                        Keep My Existing Plan
                      </button>

                      <button
                        onClick={() => handleDecision(err.id, "accepted", err)}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-md transition ${
                          currentDecision === "accepted"
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept AI Correction</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid: Form Left, Plan Content Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Inputs & Subject Configuration */}
        <div className="lg:col-span-4 space-y-4">
          <form
            onSubmit={handleGeneratePlan}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Sliders className="h-4 w-4 text-indigo-500" />
              <span>Target Exam Parameters</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Examination Name */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Examination Name</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. CA Intermediate May Term"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Examination Date */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Target Examination Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Daily Available Hours */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Daily Study Capacity</label>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{dailyHours} hrs / day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="mt-1.5 w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>2 hrs (Light)</span>
                  <span>6 hrs (Optimal)</span>
                  <span>12 hrs (Intense)</span>
                </div>
              </div>

              {/* Current Preparation Level */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Current Preparation Level</label>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{prepPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  step="5"
                  value={prepPercentage}
                  onChange={(e) => setPrepPercentage(parseInt(e.target.value))}
                  className="mt-1.5 w-full accent-purple-600"
                />
              </div>

              {/* Weak & Strong Subjects Selector */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tag Weak & Strong Subjects
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  AI gives weak subjects 40% more numerical drill hours and revision checkpoints.
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {subjects.map((sub) => {
                    const isWeak = weakSubjects.includes(sub.name);
                    const isStrong = strongSubjects.includes(sub.name);

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 text-[11px]"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {sub.name}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => toggleSubjectStatus(sub.name, "weak")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              isWeak
                                ? "bg-rose-500 text-white"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            Weak
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSubjectStatus(sub.name, "strong")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              isStrong
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            Strong
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit / Recalculate button */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{isGenerating ? "Calculating Plan..." : "Generate & Validate Plan"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Generated Plan Details & Navigation Tabs */}
        <div className="lg:col-span-8 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "overview"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Overview & Strategy
            </button>
            <button
              onClick={() => setActiveTab("allocations")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "allocations"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Subject Allocations
            </button>
            <button
              onClick={() => setActiveTab("revisions")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "revisions"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Spaced Revisions
            </button>
            <button
              onClick={() => setActiveTab("mocks")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "mocks"
                  ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Mock Exam Dates
            </button>
          </div>

          {examPlan && activeTab === "overview" && (
            <div className="space-y-4 animate-slide-up">
              {/* Target Plan Summary Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {examPlan.exam_name}
                  </h3>
                  <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-900 dark:text-indigo-300">
                    Target: {examPlan.exam_date}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Preparation Days</p>
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {examPlan.remaining_days}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Study Hours</p>
                    <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                      {Math.round(examPlan.remaining_days * examPlan.daily_study_target_hours)}h
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Pending Chapters</p>
                    <p className="text-xl font-black text-amber-500 mt-0.5">{examPlan.pending_chapters}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Current Readiness</p>
                    <p className="text-xl font-black text-emerald-500 mt-0.5">{examPlan.current_prep_percentage}%</p>
                  </div>
                </div>

                {/* Progress Bar towards exam */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Curriculum Coverage Target</span>
                    <span>100% Complete by {examPlan.exam_date}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                      style={{ width: `${Math.max(15, examPlan.current_prep_percentage)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* MODULE 3: Verified Teacher Recommendations with Badges */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-indigo-500" />
                  <span>Verified Teacher Strategic Guidance</span>
                </h3>

                <div className="space-y-3">
                  {examPlan.recommendations.map((rec) => {
                    const badgeClass =
                      rec.category === "official_pattern"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200"
                        : rec.category === "past_paper_observation"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200";

                    const categoryLabel =
                      rec.category === "official_pattern"
                        ? "Official Examination Pattern"
                        : rec.category === "past_paper_observation"
                        ? "Past-Paper Observation"
                        : "AI Teacher Strategy";

                    return (
                      <div
                        key={rec.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/30"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${badgeClass}`}>
                            {categoryLabel}
                          </span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{rec.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {rec.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Subject Allocations Tab */}
          {examPlan && activeTab === "allocations" && (
            <div className="space-y-4 animate-slide-up">
              {examPlan.subject_allocations.map((alloc, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{alloc.subject_name}</h4>
                        {alloc.is_weak && (
                          <span className="rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-extrabold px-1.5 py-0.5">
                            Priority Focus
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{alloc.reasoning}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 text-base">
                        {alloc.allocated_hours} hrs
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold">{alloc.share_percentage}% share</p>
                    </div>
                  </div>

                  {/* Chapter Milestones Deadlines */}
                  <div className="mt-3.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sequential Chapter Completion Deadlines
                    </p>
                    <div className="space-y-1.5">
                      {alloc.chapter_deadlines.map((cd, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/60 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                cd.nature === "numerical"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : cd.nature === "practical"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {cd.nature}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {cd.chapter_title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-mono">{cd.estimated_hours}h</span>
                            <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Deadline: {cd.deadline_date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Revisions Tab */}
          {examPlan && activeTab === "revisions" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3 animate-slide-up">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-indigo-500" />
                <span>Spaced Repetition & Milestone Checkpoints</span>
              </h3>

              {examPlan.revision_schedule.map((rev, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{rev.chapter_title}</span>
                      <span className="rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 text-[10px] font-bold">
                        {rev.revision_type.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{rev.focus}</p>
                  </div>
                  <span className="rounded-xl bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300 shrink-0">
                    {rev.date}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Mock Exam Dates Tab */}
          {examPlan && activeTab === "mocks" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3 animate-slide-up">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-purple-500" />
                <span>Strategic Mock Examination Schedule</span>
              </h3>

              {examPlan.mock_exam_dates.map((mock, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 text-xs dark:border-purple-900/40 dark:bg-purple-950/20 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{mock.exam_name}</span>
                      <span className="rounded-md bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 text-[10px] font-bold">
                        {mock.duration_minutes} Mins
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{mock.purpose}</p>
                  </div>

                  <span className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shrink-0">
                    {mock.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
