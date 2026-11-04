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
  CheckSquare,
  Plus,
  ArrowRight,
  GraduationCap,
  RotateCcw,
  Sparkles,
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

  const daysLeft = nearestExam ? getDaysRemaining(nearestExam.exam_date) : null;

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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back, {student?.full_name || "Student"} 👋
              </h1>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 font-semibold rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-900 dark:text-indigo-300">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Course: {student?.course || "General Studies"}</span>
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
              href="/subjects"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Subjects</span>
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Tasks</span>
            </Link>
            <Link
              href="/timetable"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Timetable</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP METRICS ROW (4 CLEAN CARDS)                            */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Study Target */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Today&apos;s Target</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {scheduledHoursToday} <span className="text-sm font-normal text-slate-400">/ {targetDailyHours}h</span>
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{
                width: `${Math.min(100, Math.round((scheduledHoursToday / targetDailyHours) * 100))}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {todaySessions.length} session(s) scheduled for today
          </p>
        </div>

        {/* Card 2: Study Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Study Progress</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {progressPercentage}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {completedChaptersCount} of {totalChaptersCount} chapters completed
          </p>
        </div>

        {/* Card 3: Upcoming Tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Upcoming Tasks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {pendingTasks.length} <span className="text-sm font-normal text-slate-400">Pending</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>{tasks.filter((t) => t.is_completed).length} tasks completed</span>
          </div>
          <Link
            href="/tasks"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            <span>View all tasks</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Card 4: Upcoming Examination */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Next Examination</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900 dark:text-white truncate block">
              {nearestExam ? nearestExam.subject_name : "No Exam Set"}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
            {nearestExam
              ? daysLeft !== null
                ? daysLeft > 0
                  ? `⏳ ${daysLeft} days remaining`
                  : "Exam is today!"
                : "Scheduled"
              : "Set exam dates in settings"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 truncate">
            {nearestExam ? new Date(nearestExam.exam_date).toLocaleDateString() : "Stay tuned"}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN CONTENT: TODAY'S SCHEDULE & SUBJECT PROGRESS          */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Today's Schedule + Subject Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Study Sessions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <span>Today&apos;s Study Schedule</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mark sessions complete as you finish studying
                </p>
              </div>
              <Link
                href="/timetable"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 inline-flex items-center gap-1"
              >
                <span>Edit Schedule</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {todaySessions.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Calendar className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    No sessions scheduled for today
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Plan your study hours in the timetable to stay consistent
                  </p>
                  <Link
                    href="/timetable"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:border-indigo-900 dark:text-indigo-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Today&apos;s Sessions</span>
                  </Link>
                </div>
              ) : (
                todaySessions.map((session) => {
                  const isDone = session.status === "completed";
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleToggleSession(session.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 opacity-75"
                          : "bg-slate-50/70 border-slate-200 hover:border-indigo-300 dark:bg-slate-800/40 dark:border-slate-700/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isDone
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                          }`}
                        >
                          {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isDone
                                ? "line-through text-slate-400 dark:text-slate-500"
                                : "text-slate-800 dark:text-slate-100"
                            }`}
                          >
                            {session.chapter_title || session.title || "Study Session"}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {session.subject_name} • {session.duration_minutes} mins
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
                          {session.start_time} - {session.end_time}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Subject Progress Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  <span>Subject Progress</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track your completion percentage across all subjects
                </p>
              </div>
              <Link
                href="/subjects"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 inline-flex items-center gap-1"
              >
                <span>Manage Subjects</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {subjects.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No subjects added yet. <Link href="/subjects" className="text-indigo-500 font-semibold underline">Add your first subject</Link> to start.
                </div>
              ) : (
                subjects.map((sub) => {
                  const subChapters = chapters.filter((c) => c.subject_id === sub.id);
                  const subCompleted = subChapters.filter(
                    (c) => c.study_status === "completed" || c.status === "completed"
                  ).length;
                  const pct =
                    subChapters.length > 0 ? Math.round((subCompleted / subChapters.length) * 100) : 0;

                  return (
                    <div key={sub.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {sub.name}
                        </span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {subCompleted} / {subChapters.length} ch ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden dark:bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tasks Checklist & Study Focus Timer */}
        <div className="space-y-6">
          {/* Quick Tasks Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-amber-500" />
                <span>Today&apos;s Tasks</span>
              </h2>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {pendingTasks.length} left
              </span>
            </div>

            {/* Quick Add Task Input */}
            <form onSubmit={handleQuickAddTask} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Add a new quick task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
              >
                Add
              </button>
            </form>

            {/* Task Checklist */}
            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">No tasks added yet.</p>
              ) : (
                tasks.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <button
                      type="button"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        t.is_completed
                          ? "bg-indigo-600 border-indigo-600 text-white"
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
                href="/tasks"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Go to Full Task Planner →
              </Link>
            </div>
          </div>

          {/* Quick Study Focus Timer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/70 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Pomodoro Study Focus</span>
            </h3>

            <div className="my-4 font-mono text-4xl font-extrabold text-slate-900 dark:text-white">
              {formatTimer(timerSeconds)}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all ${
                  timerRunning
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {timerRunning ? "Pause Focus" : "Start Focus Session"}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
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
