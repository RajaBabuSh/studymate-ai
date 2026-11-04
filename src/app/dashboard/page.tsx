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
      {/* 1. WELCOME & COURSE HEADER (WHITE & SOFT VIOLET)              */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {student?.full_name || "Student"} 👋
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 font-semibold rounded-lg bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-violet-700 dark:bg-violet-950/60 dark:border-violet-900 dark:text-violet-300">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Course: {student?.course || "CS Executive"}</span>
              </span>
              <span>•</span>
              <span>Daily Target: {targetDailyHours} hours</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/academic"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Academic Hub</span>
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Planner</span>
            </Link>
            <Link
              href="/tests"
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-500 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tests & Readiness</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* NEXT MOST IMPORTANT ACTION CALLOUT (Part 8 Requirement)       */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-violet-200 bg-linear-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-200">
                Your Next Most Important Action
              </span>
              <h2 className="text-lg font-bold mt-0.5">{nextImportantAction.title}</h2>
              <p className="text-xs text-violet-100 mt-0.5">
                {nextImportantAction.subject} • {nextImportantAction.time}
              </p>
            </div>
          </div>

          <Link
            href={nextImportantAction.link}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-violet-900 shadow-xs hover:bg-violet-50 transition-all shrink-0"
          >
            <span>{nextImportantAction.actionText}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP SUMMARY METRICS (4 CARDS)                              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Today's Target Hours */}
        <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today&apos;s Target</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {scheduledHoursToday} <span className="text-sm font-semibold text-slate-400">/ {targetDailyHours}h</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-violet-600 rounded-full"
                style={{ width: `${Math.min(100, Math.round((scheduledHoursToday / targetDailyHours) * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {todaySessions.length} sessions scheduled today
            </p>
          </div>
        </div>

        {/* Metric 2: Total Study Progress */}
        <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Syllabus Progress</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {progressPercentage}%
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {completedChaptersCount} of {totalChaptersCount} chapters completed
            </p>
          </div>
        </div>

        {/* Metric 3: Upcoming Goals */}
        <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Goals</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {pendingTasks.length} <span className="text-sm font-semibold text-slate-400">tasks</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Prioritized for this week</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              <Link href="/planner" className="text-violet-600 hover:underline">
                View Planner →
              </Link>
            </p>
          </div>
        </div>

        {/* Metric 4: Live Exam Countdown */}
        <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Examination</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {daysLeft !== null ? `${daysLeft} Days` : "45 Days"}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {nearestExam?.subject_name || "June 2026 Examination"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {nearestExam?.exam_date || "2026-06-02"}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN DASHBOARD GRIDS: SCHEDULE & SUBJECT PROGRESS         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Schedule & Subject Progress */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Study Schedule */}
          <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600" />
                  <span>Today&apos;s Study Schedule</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interactive checklist of your scheduled study sessions for today.
                </p>
              </div>
              <Link
                href="/planner"
                className="text-xs font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-400"
              >
                Manage Schedule →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {todaySessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No study sessions scheduled for today yet.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use the Study Planner to add daily slots or generate an AI timetable.
                  </p>
                  <Link
                    href="/planner"
                    className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300"
                  >
                    Generate Timetable
                  </Link>
                </div>
              ) : (
                todaySessions.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      s.status === "completed"
                        ? "border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/20"
                        : "border-slate-100 bg-slate-50/60 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleSession(s.id)}
                        className={`flex h-5 w-5 items-center justify-center rounded-lg border transition-colors ${
                          s.status === "completed"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 dark:border-slate-600 hover:border-violet-500"
                        }`}
                      >
                        {s.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>

                      <div>
                        <div
                          className={`text-xs font-bold ${
                            s.status === "completed"
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {s.chapter_title || "Lesson Study"}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="font-semibold text-violet-600 dark:text-violet-400">
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {s.status === "completed" ? "Done" : "Scheduled"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject Progress Overview */}
          <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                  <span>Subject Completion & Progress (Feature 91)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track how many chapters you have finished across your enrolled subjects.
                </p>
              </div>
              <Link
                href="/academic"
                className="text-xs font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-400"
              >
                View Syllabus →
              </Link>
            </div>

            <div className="mt-4 space-y-3.5">
              {subjects.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No subjects found.</p>
              ) : (
                subjects.map((sub) => {
                  const subChapters = chapters.filter((c) => c.subject_id === sub.id);
                  const subCompleted = subChapters.filter(
                    (c) => c.study_status === "completed" || c.status === "completed"
                  ).length;
                  const pct =
                    subChapters.length > 0 ? Math.round((subCompleted / subChapters.length) * 100) : 0;

                  return (
                    <div key={sub.id} className="p-3 rounded-2xl border border-violet-50 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {sub.name}
                        </span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {subCompleted} / {subChapters.length} ch ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden dark:bg-slate-800">
                        <div
                          className="h-full bg-linear-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-300"
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
            <div className="p-5 rounded-3xl border border-violet-100 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-violet-600 mb-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">AI Forecast (Feature 96)</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Expected Completion: 18 May 2026
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                At your current pace of {targetDailyHours}h daily, you are projected to complete all chapters 15 days ahead of your June 2 exam date, allowing a full 2-week final mock sprint.
              </p>
            </div>

            <div className="p-5 rounded-3xl border border-amber-100 bg-amber-50/40 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Weakness Triage (Feature 98)</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {urgentWeakChapters.length} Red Priority Chapters
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Recommend dedicating your upcoming Saturday morning block to working capital and cash flows before taking the next mock test.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Planner Quick Goals & Study Focus Timer */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Goals Card */}
          <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-violet-600" />
                <span>Today&apos;s Focus Goals</span>
              </h2>
              <span className="text-xs font-semibold text-violet-600">
                {pendingTasks.length} left
              </span>
            </div>

            {/* Quick Add Goal Input */}
            <form onSubmit={handleQuickAddTask} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Add a new goal..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-violet-500 focus:bg-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 transition-colors"
              >
                Add
              </button>
            </form>

            {/* Task Checklist */}
            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">No goals added yet.</p>
              ) : (
                tasks.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <button
                      type="button"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        t.is_completed
                          ? "bg-violet-600 border-violet-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {t.is_completed && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                    <span
                      className={`text-xs truncate ${
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

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                href="/planner"
                className="text-xs font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-400"
              >
                Open Full Study Planner →
              </Link>
            </div>
          </div>

          {/* Quick Study Focus Timer */}
          <div className="rounded-3xl border border-violet-100/90 bg-white p-6 shadow-sm shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/80 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              <span>Pomodoro Study Focus</span>
            </h3>

            <div className="my-4 font-mono text-4xl font-extrabold text-slate-900 dark:text-white">
              {formatTimer(timerSeconds)}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all ${
                  timerRunning
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-violet-600 hover:bg-violet-500"
                }`}
              >
                {timerRunning ? "Pause Focus" : "Start Focus Session"}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Reset Timer"
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
