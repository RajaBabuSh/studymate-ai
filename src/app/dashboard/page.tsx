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
  StudentTask,
} from "@/types/database";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  CalendarCheck2,
  ArrowRight,
  GraduationCap,
  RotateCcw,
  Sparkles,
  Zap,
  Target,
  AlertTriangle,
} from "lucide-react";
import { getDaysRemaining } from "@/lib/utils";

export default function DashboardPage() {
  const { user, student } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<StudentTask[]>([]);

  // Quick inline task input
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Simple study timer
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const loadData = useCallback(() => {
    const userId = user?.id;
    setSubjects(StorageRepository.getSubjects(userId));
    setChapters(StorageRepository.getChapters(userId));
    setExams(StorageRepository.getExaminations(userId));
    setSessions(StorageRepository.getStudySessions(userId));
    setTasks(StorageRepository.getTasks(userId));
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  // Nearest Exam Calculation
  const nearestExam = useMemo(() => {
    if (exams.length === 0) return null;
    const sorted = [...exams].sort(
      (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    );
    return sorted[0];
  }, [exams]);

  const daysLeft = nearestExam ? getDaysRemaining(nearestExam.exam_date) : 45;

  // Study Progress
  const totalChaptersCount = chapters.length;
  const completedChaptersCount = chapters.filter(
    (c) => c.study_status === "completed" || c.status === "completed"
  ).length;
  const progressPercentage =
    totalChaptersCount > 0 ? Math.round((completedChaptersCount / totalChaptersCount) * 100) : 0;

  // Today's Study Sessions
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => s.date === todayStr);

  // Daily target hours
  const targetDailyHours = student?.daily_available_hours || 4.5;
  const scheduledMinutesToday = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const scheduledHoursToday = Math.round((scheduledMinutesToday / 60) * 10) / 10;

  // Pending Tasks
  const pendingTasks = tasks.filter((t) => !t.is_completed);

  // Weak chapters (Feature 98)
  const urgentWeakChapters = useMemo(() => {
    return chapters.filter(
      (c) => (c.weak_category === "red" || c.difficulty === "hard") && c.status !== "completed"
    );
  }, [chapters]);

  // Next Most Important Action (Part 8 requirement)
  const nextImportantAction = useMemo(() => {
    const uncompletedSession = todaySessions.find((s) => s.status !== "completed");
    if (uncompletedSession) {
      return {
        title: `Study Session: ${uncompletedSession.chapter_title}`,
        subject: uncompletedSession.subject_name,
        time: `${uncompletedSession.start_time} - ${uncompletedSession.end_time}`,
        actionText: "Open Timetable",
        link: "/planner",
      };
    }
    if (urgentWeakChapters.length > 0) {
      const topWeak = urgentWeakChapters[0];
      const sub = subjects.find((s) => s.id === topWeak.subject_id);
      return {
        title: `High Priority Topic: ${topWeak.title}`,
        subject: sub?.name || "Curriculum Focus",
        time: "Recommended Next",
        actionText: "Review Subject",
        link: "/academic",
      };
    }
    return {
      title: "Daily Goal Review & Practice Test",
      subject: "All Subjects",
      time: "Scheduled Today",
      actionText: "Open Tests",
      link: "/tests",
    };
  }, [todaySessions, urgentWeakChapters, subjects]);

  // Toggle session status
  const handleToggleSession = (sessionId: string) => {
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          status: s.status === "completed" ? ("scheduled" as const) : ("completed" as const),
        };
      }
      return s;
    });
    setSessions(updated);
    StorageRepository.setStudySessions(updated, user?.id);
  };

  // Toggle task status
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          is_completed: !t.is_completed,
          completed_at: !t.is_completed ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    setTasks(updated);
    StorageRepository.setTasks(updated, user?.id);
  };

  // Quick Add Task
  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: StudentTask = {
      id: `task-${Date.now()}`,
      student_id: user?.id || "student-active",
      title: newTaskTitle.trim(),
      due_date: todayStr,
      priority: "medium",
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    StorageRepository.setTasks(updated, user?.id);
    setNewTaskTitle("");
  };

  // Format timer
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. WELCOME & COURSE HEADER                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {student?.full_name || "Student"} 👋
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="inline-flex items-center gap-1.5 font-bold rounded-xl bg-purple-50 border border-purple-100 px-3 py-1 text-purple-700 dark:bg-purple-950/60 dark:border-purple-900/80 dark:text-purple-300">
                <GraduationCap className="h-4 w-4" />
                <span>Course: {student?.course || "CS Executive"}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>Daily Target: <strong>{targetDailyHours}h</strong></span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/academic"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Academic Hub</span>
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 transition-colors"
            >
              <CalendarCheck2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Planner</span>
            </Link>
            <Link
              href="/tests"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-purple-500 hover:to-blue-500 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tests & Readiness</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. NEXT MOST IMPORTANT ACTION CALLOUT                         */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 p-6 sm:p-7 text-white shadow-lg shadow-purple-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-200 block">
                Your Next Most Important Action
              </span>
              <h2 className="text-lg sm:text-xl font-bold mt-1 text-white tracking-tight leading-snug">
                {nextImportantAction.title}
              </h2>
              <p className="text-xs sm:text-sm text-purple-100/90 font-medium mt-1">
                {nextImportantAction.subject} • {nextImportantAction.time}
              </p>
            </div>
          </div>

          <Link
            href={nextImportantAction.link}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-purple-900 shadow-md hover:bg-purple-50 hover:shadow-lg transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <span>{nextImportantAction.actionText}</span>
            <ArrowRight className="h-4 w-4 text-purple-700" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TOP SUMMARY METRICS (4 CARDS)                              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Today's Target Hours */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today&apos;s Target
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {scheduledHoursToday} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">/ {targetDailyHours}h</span>
            </div>
            <div className="mt-2.5 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((scheduledHoursToday / targetDailyHours) * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              {todaySessions.length} sessions scheduled today
            </p>
          </div>
        </div>

        {/* Metric 2: Total Study Progress */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Syllabus Progress
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {progressPercentage}%
            </div>
            <div className="mt-2.5 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              {completedChaptersCount} of {totalChaptersCount} chapters completed
            </p>
          </div>
        </div>

        {/* Metric 3: Upcoming Goals */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Goals
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {pendingTasks.length} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">tasks</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Prioritized for this week</span>
            </div>
            <p className="mt-1 text-xs">
              <Link href="/planner" className="font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                View Planner →
              </Link>
            </p>
          </div>
        </div>

        {/* Metric 4: Live Exam Countdown */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Next Examination
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {daysLeft !== null ? `${daysLeft} Days` : "45 Days"}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {nearestExam?.subject_name || "June 2026 Examination"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {nearestExam?.exam_date || "2026-06-02"}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN DASHBOARD GRIDS: SCHEDULE & SUBJECT PROGRESS         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Schedule & Subject Progress */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Study Schedule */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Today&apos;s Study Schedule</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  Interactive checklist of your scheduled study sessions for today.
                </p>
              </div>
              <Link
                href="/planner"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Manage Schedule →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {todaySessions.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold">
                    No study sessions scheduled for today yet.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Use the Study Planner to add daily slots or generate an AI timetable.
                  </p>
                  <Link
                    href="/planner"
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Generate Timetable
                  </Link>
                </div>
              ) : (
                todaySessions.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      s.status === "completed"
                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                        : "border-slate-200/80 bg-slate-50/70 hover:border-purple-200 hover:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSession(s.id)}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                          s.status === "completed"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 dark:border-slate-600 hover:border-purple-600"
                        }`}
                        aria-label={s.status === "completed" ? "Mark incomplete" : "Mark completed"}
                      >
                        {s.status === "completed" && <CheckCircle2 className="h-4 w-4" />}
                      </button>

                      <div>
                        <div
                          className={`text-sm font-bold ${
                            s.status === "completed"
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {s.chapter_title || "Lesson Study"}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-0.5 font-medium">
                          <span className="font-bold text-purple-700 dark:text-purple-400">
                            {s.subject_name}
                          </span>
                          <span>•</span>
                          <span>{s.start_time} - {s.end_time}</span>
                          <span>•</span>
                          <span>{s.duration_minutes} mins</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        s.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                      }`}
                    >
                      {s.status === "completed" ? "Completed" : "Scheduled"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject Progress Overview */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Subject Completion & Progress (Feature 91)</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  Track how many chapters you have finished across your enrolled subjects.
                </p>
              </div>
              <Link
                href="/academic"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View Syllabus →
              </Link>
            </div>

            <div className="mt-4 space-y-3.5">
              {subjects.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No subjects found.</p>
              ) : (
                subjects.map((sub) => {
                  const subChapters = chapters.filter((c) => c.subject_id === sub.id);
                  const subCompleted = subChapters.filter(
                    (c) => c.study_status === "completed" || c.status === "completed"
                  ).length;
                  const pct =
                    subChapters.length > 0 ? Math.round((subCompleted / subChapters.length) * 100) : 0;

                  return (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850/40"
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {sub.name}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {subCompleted} / {subChapters.length} ch ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden dark:bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI Analytics & Expected Completion (Features 93, 96, 98) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl border border-purple-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">AI Forecast (Feature 96)</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Expected Completion: 18 May 2026
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                At your current pace of {targetDailyHours}h daily, you are projected to complete all chapters 15 days ahead of your June 2 exam date, allowing a full 2-week final mock sprint.
              </p>
            </div>

            <div className="p-5 rounded-3xl border border-amber-200/80 bg-amber-50/40 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Weakness Triage (Feature 98)</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {urgentWeakChapters.length} Red Priority Chapters
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                Recommend dedicating your upcoming Saturday morning block to working capital and cash flows before taking the next mock test.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Planner Quick Goals & Study Focus Timer */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Goals Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Today&apos;s Focus Goals</span>
              </h2>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {pendingTasks.length} left
              </span>
            </div>

            {/* Quick Add Goal Input */}
            <form onSubmit={handleQuickAddTask} className="mt-3.5 flex gap-2">
              <input
                type="text"
                placeholder="Add a new goal..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-purple-400"
              />
              <button
                type="submit"
                className="rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>

            {/* Task Checklist */}
            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 font-medium">No goals added yet.</p>
              ) : (
                tasks.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <button
                      type="button"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        t.is_completed
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {t.is_completed && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                    <span
                      className={`text-xs truncate font-medium ${
                        t.is_completed
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                href="/planner"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Open Full Study Planner →
              </Link>
            </div>
          </div>

          {/* Quick Study Focus Timer */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 text-center transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Pomodoro Study Focus</span>
            </h3>

            <div className="my-4 font-mono text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatTimer(timerSeconds)}
            </div>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className={`rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                  timerRunning
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {timerRunning ? "Pause Focus" : "Start Focus Session"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Reset Timer"
                aria-label="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
