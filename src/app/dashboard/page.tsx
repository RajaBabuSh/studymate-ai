"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import {
  Subject,
  Chapter,
  Examination,
  StudySession,
  SessionStatus,
  Reminder,
  StudyProgress,
  Announcement,
  ExamReadinessAnalysis,
} from "@/types/database";
import {
  Sparkles,
  BookOpen,
  Calendar,
  Play,
  Check,
  ChevronRight,
  TrendingUp,
  Award,
  Moon,
  Timer,
  ShieldAlert,
  Megaphone,
  Target,
  RotateCcw,
  ShieldCheck,
  X,
  HelpCircle,
  Layers,
  Compass,
} from "lucide-react";
import { formatTime, getDaysRemaining } from "@/lib/utils";
import { detectChapterNature } from "@/lib/chapterIntelligence";
import { ReadinessEngine } from "@/lib/readinessEngine";
import { getCourseSyllabusInfo } from "@/lib/courseCatalog";
import StudyTimerModal from "@/components/timer/StudyTimerModal";
import DailyAdjustmentModal from "@/components/dashboard/DailyAdjustmentModal";
import confetti from "canvas-confetti";

export default function DashboardPage() {
  const { user, student } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [progress, setProgress] = useState<StudyProgress[]>([]);

  // Modals & Selected Subject
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showDailyAdjustmentModal, setShowDailyAdjustmentModal] = useState(false);
  const [selectedDetailSubject, setSelectedDetailSubject] = useState<Subject | null>(null);
  const [todaySessionFilter, setTodaySessionFilter] = useState<"all" | "numerical" | "theory">("all");
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const loadDashboardData = useCallback(() => {
    const userId = user?.id;
    setSubjects(StorageRepository.getSubjects(userId));
    setChapters(StorageRepository.getChapters(userId));
    setExams(StorageRepository.getExaminations(userId));
    setSessions(StorageRepository.getStudySessions(userId));
    setReminders(StorageRepository.getReminders(userId));
    setProgress(StorageRepository.getProgress(userId));

    const allAnnouncements = StorageRepository.getAnnouncements();
    const relevant = allAnnouncements.filter(
      (a) => a.is_active && (a.target_course === "all" || a.target_course === student?.course)
    );
    setActiveAnnouncements(relevant);
  }, [user?.id, student?.course]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Exam Readiness Calculation (Phases 4, 5 & 10)
  const readinessAnalysis: ExamReadinessAnalysis = useMemo(() => {
    return ReadinessEngine.calculateExamReadiness(
      subjects,
      chapters,
      exams,
      student?.daily_available_hours || 4.5
    );
  }, [subjects, chapters, exams, student?.daily_available_hours]);

  const testStats = useMemo(() => {
    return ReadinessEngine.calculateTestPerformance(chapters);
  }, [chapters]);

  const revObj = useMemo(() => {
    return ReadinessEngine.calculateRevisionCompletion(chapters, 2);
  }, [chapters]);

  const testCoveragePct = useMemo(() => {
    return ReadinessEngine.calculateTestCoverage(chapters);
  }, [chapters]);

  // Course Syllabus Info
  const syllabusInfo = useMemo(() => {
    return getCourseSyllabusInfo(student?.course || "");
  }, [student?.course]);

  // Toggle session completion
  const toggleSessionStatus = (sessionId: string) => {
    const userId = user?.id;
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        const nextStatus = s.status === "completed" ? "scheduled" : "completed";
        if (nextStatus === "completed") {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
            });
          } catch {
            // fallback
          }
        }
        return { ...s, status: nextStatus as SessionStatus };
      }
      return s;
    });
    setSessions(updated);
    StorageRepository.setStudySessions(updated, userId);
  };

  // Toggle reminder completion
  const toggleReminder = (remId: string) => {
    const userId = user?.id;
    const updated = reminders.map((r) =>
      r.id === remId ? { ...r, is_completed: !r.is_completed } : r
    );
    setReminders(updated);
    StorageRepository.setReminders(updated, userId);
  };

  // Sessions Metrics
  const todaySessions = sessions;
  const todayMinutesPlanned = todaySessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const todayMinutesCompleted = todaySessions
    .filter((s) => s.status === "completed")
    .reduce((acc, s) => acc + s.duration_minutes, 0);

  const numericalSessionsCount = todaySessions.filter((s) => {
    const nat = detectChapterNature(s.subject_name, s.chapter_title);
    return nat === "numerical" || nat === "practical";
  }).length;

  const theorySessionsCount = todaySessions.filter((s) => {
    const nat = detectChapterNature(s.subject_name, s.chapter_title);
    return nat === "theory" || nat === "mixed";
  }).length;

  const displayedSessions = todaySessions.filter((s) => {
    const nat = detectChapterNature(s.subject_name, s.chapter_title);
    if (todaySessionFilter === "numerical") return nat === "numerical" || nat === "practical";
    if (todaySessionFilter === "theory") return nat === "theory" || nat === "mixed";
    return true;
  });

  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
  );

  const nearestExam = sortedExams[0];
  const daysToNearestExam = nearestExam ? getDaysRemaining(nearestExam.exam_date) : null;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Platform Announcements Banner */}
      {activeAnnouncements.length > 0 && (
        <div className="space-y-2">
          {activeAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`rounded-2xl border p-4 backdrop-blur-md flex items-start justify-between gap-3 ${
                ann.priority === "urgent"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                  : ann.priority === "important"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                    ann.priority === "urgent"
                      ? "bg-rose-500 text-white"
                      : ann.priority === "important"
                      ? "bg-amber-500 text-white"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{ann.title}</span>
                    <span className="rounded bg-black/30 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                      {ann.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">{ann.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Welcome Greeting Header with Course, Level & Countdown */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-indigo-300" />
                <span>{student?.course || "Professional Course"}</span>
              </span>

              {syllabusInfo.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{syllabusInfo.syllabusVersion}</span>
                </span>
              )}

              {daysToNearestExam !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-500/30">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {daysToNearestExam > 0
                      ? `${daysToNearestExam} Days to ${nearestExam.subject_name}`
                      : "Exam Today!"}
                  </span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {student?.full_name?.split(" ")[0] || "Student"}! 🎓
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-indigo-200 max-w-xl">
              Target: <strong className="text-white">{student?.target_exam || "Upcoming Finals"}</strong> •{" "}
              {todaySessions.length} sessions scheduled today ({(todayMinutesPlanned / 60).toFixed(1)}h planned, {(todayMinutesCompleted / 60).toFixed(1)}h finished).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/roadmap"
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-violet-500 hover:to-indigo-500 transition active:scale-95"
            >
              <Compass className="h-3.5 w-3.5 text-white" />
              <span>Smart Roadmap</span>
            </Link>

            <Link
              href="/timetable"
              className="flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-bold text-indigo-950 shadow-md hover:bg-indigo-50 transition active:scale-95"
            >
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              <span>AI Timetable</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowTimerModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition active:scale-95"
            >
              <Timer className="h-3.5 w-3.5 text-indigo-200" />
              <span>Focus Timer</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDailyAdjustmentModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-purple-500/20 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-purple-200 border border-purple-400/30 hover:bg-purple-500/30 transition active:scale-95"
            >
              <Moon className="h-3.5 w-3.5 text-purple-200" />
              <span>Evening Check-In</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXAM READINESS ENGINE HERO CARD (Phase 5 & 10) */}
      <div className="rounded-3xl border border-indigo-200/80 bg-white p-6 shadow-subtle dark:border-indigo-950/60 dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Target className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                AI Examination Readiness Intelligence
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                  readinessAnalysis.grade === "Exemplary"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : readinessAnalysis.grade === "Ready"
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                    : readinessAnalysis.grade === "Moderate Risk"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                Grade: {readinessAnalysis.grade}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Multi-factor transparent readiness assessment based on syllabus mastery, spaced revisions, and tested accuracy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {readinessAnalysis.overall_score}%
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Readiness Score</span>
            </div>
            <button
              onClick={() => setShowFormulaModal(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="View transparent formula explanation"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 5-Factor Weighted Progress Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Factor 1: Syllabus Coverage (30%) */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
              <span>Syllabus (30%)</span>
              <span>{readinessAnalysis.breakdown.syllabus_completion_rate}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${readinessAnalysis.breakdown.syllabus_completion_rate}%` }}
              />
            </div>
          </div>

          {/* Factor 2: Revision Completion (25%) */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
              <span>Revisions (25%)</span>
              <span>{readinessAnalysis.breakdown.revision_completion_rate}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${readinessAnalysis.breakdown.revision_completion_rate}%` }}
              />
            </div>
          </div>

          {/* Factor 3: Test Performance (25%) */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
              <span>Test Marks (25%)</span>
              <span>{readinessAnalysis.breakdown.test_performance_rate}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${readinessAnalysis.breakdown.test_performance_rate}%` }}
              />
            </div>
          </div>

          {/* Factor 4: Test Coverage (10%) */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
              <span>Coverage (10%)</span>
              <span>{readinessAnalysis.breakdown.test_coverage_rate}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${readinessAnalysis.breakdown.test_coverage_rate}%` }}
              />
            </div>
          </div>

          {/* Factor 5: Timeline Consistency (10%) */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3">
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
              <span>Timeline (10%)</span>
              <span>{readinessAnalysis.breakdown.consistency_and_timeline_factor}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${readinessAnalysis.breakdown.consistency_and_timeline_factor}%` }}
              />
            </div>
          </div>
        </div>

        {/* Risk Warnings & Recommendations Banner */}
        {readinessAnalysis.risk_warnings && readinessAnalysis.risk_warnings.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 text-xs font-bold">
              <ShieldAlert className="h-4 w-4" />
              <span>Exam Preparation Risk Alert:</span>
            </div>
            {readinessAnalysis.risk_warnings.map((w, idx) => (
              <p key={idx} className="text-xs text-rose-700 dark:text-rose-300/90 pl-5">
                • {w}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 3. 4 Separate KPI Cards (Phase 4 & 10) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Syllabus Covered % */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Syllabus Covered</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {readinessAnalysis.breakdown.syllabus_completion_rate}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({chapters.filter((c) => c.study_status === "completed" || c.status === "completed").length}/{chapters.length})
              </span>
            </div>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              Across all enrolled subjects
            </p>
          </div>
        </div>

        {/* KPI 2: Revision Milestones % */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Revision Milestones</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {revObj.rate}%
            </span>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
              {revObj.completedCount} of {revObj.totalPlanned} planned (Rev 1-2)
            </p>
          </div>
        </div>

        {/* KPI 3: Test Marks (Average & Range) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Test Marks %</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {testStats.performanceRate}%
              </span>
              <span className="text-[10px] text-slate-400">avg</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              High: {testStats.highestScore}% • Low: {testStats.lowestScore}%
            </p>
          </div>
        </div>

        {/* KPI 4: Test Coverage % */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Test Coverage</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {testCoveragePct}%
            </span>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              {chapters.filter((c) => c.test_history && c.test_history.length > 0).length} of {chapters.length} chapters tested
            </p>
          </div>
        </div>
      </div>

      {/* 4. Enrolled Subjects Grid with Click-to-View Detail Modal */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" />
            <span>Enrolled Subjects ({subjects.length})</span>
          </h2>
          <Link
            href="/subjects"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Manage All Subjects →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((sub) => {
            const subChaps = chapters.filter((c) => c.subject_id === sub.id);
            const doneCount = subChaps.filter(
              (c) => c.study_status === "completed" || c.status === "completed"
            ).length;
            const pct = subChaps.length > 0 ? Math.round((doneCount / subChaps.length) * 100) : 0;

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedDetailSubject(sub)}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle hover:border-indigo-400 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || "#6366f1" }}
                    />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition">
                      {sub.name}
                    </h3>
                  </div>
                  {sub.code && (
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {sub.code}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>{pct}% Studied</span>
                    <span>
                      {doneCount} / {subChaps.length} Chapters
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: sub.color || "#6366f1",
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Click to view chapter list</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Main Dashboard Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Today's Schedule & Weekly Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Study Schedule */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Today&apos;s Study Schedule</span>
                  <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5">
                    {todaySessions.filter((s) => s.status === "completed").length}/
                    {todaySessions.length} Done
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Check off sessions as you finish to update your study analytics
                </p>
              </div>

              <Link
                href="/timetable"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                <span>Timetable Hub</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Numerical Practice vs Theory Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTodaySessionFilter("all")}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                  todaySessionFilter === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                All Sessions ({todaySessions.length})
              </button>

              <button
                type="button"
                onClick={() => setTodaySessionFilter("numerical")}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                  todaySessionFilter === "numerical"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                ⚡ Numerical Sessions ({numericalSessionsCount})
              </button>

              <button
                type="button"
                onClick={() => setTodaySessionFilter("theory")}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                  todaySessionFilter === "theory"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                📖 Theory Sessions ({theorySessionsCount})
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {displayedSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No study sessions matching the selected filter.
                </div>
              ) : (
                displayedSessions.map((session) => {
                  const isDone = session.status === "completed";
                  const nature = detectChapterNature(session.subject_name, session.chapter_title);
                  const isNumerical = nature === "numerical" || nature === "practical";

                  return (
                    <div
                      key={session.id}
                      onClick={() => toggleSessionStatus(session.id)}
                      className={`group cursor-pointer flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all ${
                        isDone
                          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 opacity-80"
                          : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/20 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-900"
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        aria-label="Toggle completed"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                          isDone
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white group-hover:border-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : null}
                      </button>

                      {/* Time slot */}
                      <div className="shrink-0 text-left w-24">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {formatTime(session.start_time)}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {session.duration_minutes} mins
                        </p>
                      </div>

                      {/* Session details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: session.subject_color || "#6366f1" }}
                          />
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {session.subject_name}
                          </span>

                          <span
                            className={`rounded-md px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider ${
                              isNumerical
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {nature}
                          </span>

                          <span
                            className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                              session.session_type === "revision"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                : session.session_type === "mock_test"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            }`}
                          >
                            {session.session_type}
                          </span>
                        </div>
                        <h3
                          className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${
                            isDone
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-800 dark:text-slate-100"
                          }`}
                        >
                          {session.chapter_title}
                        </h3>
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0 text-right hidden sm:block">
                        <span
                          className={`text-xs font-medium ${
                            isDone
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-slate-400"
                          }`}
                        >
                          {isDone ? "Completed" : "Scheduled"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <span>Weekly Study Consistency</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daily study minutes logged over the past 7 days
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-4 items-end h-40 pt-4">
              {progress.map((p, idx) => {
                const dateObj = new Date(p.date);
                const dayName = isNaN(dateObj.getTime())
                  ? `Day ${idx + 1}`
                  : dateObj.toLocaleDateString("en-US", { weekday: "short" });
                const maxMins = 360;
                const heightPct = Math.min(100, Math.round((p.total_minutes_studied / maxMins) * 100));
                const hours = (p.total_minutes_studied / 60).toFixed(1);

                return (
                  <div key={p.id} className="flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hours}h
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl h-28 flex items-end p-1">
                      <div
                        className="w-full rounded-lg bg-gradient-to-t from-indigo-600 to-purple-500 transition-all duration-500 group-hover:from-indigo-500 group-hover:to-purple-400"
                        style={{ height: `${Math.max(10, heightPct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Exams & Video Learning (On Hold Badge) */}
        <div className="space-y-6">
          {/* Upcoming Examinations Countdown */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-rose-500" />
                <span>Upcoming Examinations</span>
              </h2>
              <span className="text-[10px] font-bold rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {exams.length} scheduled
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {sortedExams.slice(0, 3).map((exam) => {
                const days = getDaysRemaining(exam.exam_date);
                const isUrgent = days <= 14;
                return (
                  <div
                    key={exam.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800/80 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                          {exam.exam_name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {exam.subject_name}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold ${
                          isUrgent
                            ? "bg-rose-500 text-white"
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        }`}
                      >
                        {days > 0 ? `${days}d left` : "Today"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/50 pt-1.5 dark:border-slate-700/50">
                      <span>{exam.exam_date}</span>
                      <span>Weightage: {exam.weightage_percentage || 100}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video Learning ON HOLD (Phase 11 Compliance) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="h-4 w-4 text-purple-600" />
                <span>Video Learning Hub</span>
              </h2>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Coming Soon • On Hold
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Our curated video faculty integration is in active development for the next release.
            </p>
            <div className="mt-3">
              <Link
                href="/videos"
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>Preview Saved Video Catalog</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span>Study Reminders</span>
              </h2>
              <Link
                href="/reminders"
                className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Manage
              </Link>
            </div>

            <div className="mt-3 space-y-2">
              {reminders.slice(0, 3).map((rem) => (
                <div
                  key={rem.id}
                  onClick={() => toggleReminder(rem.id)}
                  className={`cursor-pointer flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                    rem.is_completed
                      ? "border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/20 line-through"
                      : "border-slate-200 bg-slate-50/60 text-slate-800 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    className={`h-4 w-4 shrink-0 rounded border mt-0.5 flex items-center justify-center ${
                      rem.is_completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {rem.is_completed && <Check className="h-3 w-3" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{rem.title}</p>
                    {rem.description && (
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {rem.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Subject Detail Modal (Requirement 5 in Phase 10) */}
      {selectedDetailSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedDetailSubject.color || "#6366f1" }}
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedDetailSubject.name}
                    </h3>
                    {selectedDetailSubject.code && (
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                        {selectedDetailSubject.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Syllabus: {syllabusInfo.syllabusVersion} • Exam Authority: {syllabusInfo.examBody}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailSubject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Chapter Breakdown
              </h4>
              {chapters
                .filter((c) => c.subject_id === selectedDetailSubject.id)
                .map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">CH {idx + 1}</span>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {ch.title}
                        </h5>
                        {ch.is_custom && (
                          <span className="rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-bold px-1.5 py-0.2">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="capitalize">{ch.difficulty}</span>
                        <span>•</span>
                        <span>~{ch.estimated_hours} hrs</span>
                        <span>•</span>
                        <span>
                          {ch.study_status === "completed"
                            ? "✓ Studied"
                            : ch.study_status === "in_progress"
                            ? "In Progress"
                            : "Not Started"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ch.study_status === "completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {ch.study_status === "completed" ? "Done" : "Pending"}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <Link
                href="/subjects"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Go to Curriculum Hub →
              </Link>
              <button
                onClick={() => setSelectedDetailSubject(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Transparent Formula Explanation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-500" />
                <span>Exam Readiness Formula Explanation</span>
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                StudyMate calculates your overall Exam Readiness using a transparent 5-factor weighted formula designed with pedagogical standards:
              </p>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 font-mono text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed">
                Readiness Score = (0.30 × Syllabus Completion) + (0.25 × Revision Completion) + (0.25 × Test Performance) + (0.10 × Test Coverage) + (0.10 × Timeline Consistency)
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li><strong>Syllabus Completion (30%):</strong> Completed chapters divided by total chapters in curriculum.</li>
                <li><strong>Revision Completion (25%):</strong> Logged spaced revision milestones (Rev 1 and Rev 2).</li>
                <li><strong>Test Performance (25%):</strong> Percentage of marks scored on chapter quizzes and subjective tests.</li>
                <li><strong>Test Coverage (10%):</strong> Proportion of total chapters where at least 1 test was attempted.</li>
                <li><strong>Timeline Consistency (10%):</strong> Remaining study days relative to pending chapter hours.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Peaceful Study Timer Modal */}
      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => {
          setShowTimerModal(false);
          loadDashboardData();
        }}
      />

      {/* Daily Evening Adjustment Modal */}
      <DailyAdjustmentModal
        isOpen={showDailyAdjustmentModal}
        onClose={() => {
          setShowDailyAdjustmentModal(false);
          loadDashboardData();
        }}
        todaySessions={todaySessions}
        subjects={subjects}
      />
    </div>
  );
}
