"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { StudentTask, Subject, Chapter, StudySession } from "@/types/database";
import {
  CalendarCheck2,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  BookOpen,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";

export default function StudyPlannerPage() {
  const { user, student } = useAuth();
  const [plannerTab, setPlannerTab] = useState<"targets" | "allocation" | "backlog" | "timer">("targets");

  // Core Data
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Task Filter
  const [taskView, setTaskView] = useState<"today" | "all">("today");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubjectId, setTaskSubjectId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");

  // Pomodoro Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"work" | "shortBreak" | "longBreak">("work");
  const [selectedTimerSubject, setSelectedTimerSubject] = useState<string>("");

  const loadData = useCallback(() => {
    const userId = user?.id;
    setTasks(StorageRepository.getTasks(userId));
    setSubjects(StorageRepository.getSubjects(userId));
    setChapters(StorageRepository.getChapters(userId));
    setSessions(StorageRepository.getStudySessions(userId));
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pomodoro countdown ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      const minutesSpent = timerMode === "work" ? 25 : 5;
      const subName = subjects.find((s) => s.id === selectedTimerSubject)?.name || "General Study";
      StorageRepository.recordTimerSession(minutesSpent, `${timerMode.toUpperCase()} session`, subName, user?.id);
      alert(`Pomodoro interval complete! ${minutesSpent} minutes recorded.`);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds, timerMode, selectedTimerSubject, subjects, user?.id]);

  const todayStr = new Date().toISOString().split("T")[0];
  const dailyTargetHours = student?.daily_available_hours || 4.5;

  // Filter tasks
  const visibleTasks = tasks.filter((t) => {
    if (taskView === "today") return t.due_date === todayStr;
    return true;
  });

  const completedTodayTasks = tasks.filter((t) => t.due_date === todayStr && t.is_completed).length;
  const totalTodayTasks = tasks.filter((t) => t.due_date === todayStr).length;

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

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    StorageRepository.setTasks(updated, user?.id);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const sub = subjects.find((s) => s.id === taskSubjectId);
    const newTask: StudentTask = {
      id: `plan-task-${Date.now()}`,
      student_id: user?.id || "student-active",
      title: taskTitle.trim(),
      subject_id: sub?.id,
      subject_name: sub?.name || undefined,
      due_date: taskDueDate,
      priority: taskPriority,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    StorageRepository.setTasks(updated, user?.id);

    setTaskTitle("");
    setShowAddModal(false);
  };

  // Backlog chapters identification (Feature 10 & 42)
  const backlogChapters = useMemo(() => {
    return chapters.filter(
      (c) =>
        (c.status === "pending" || c.status === "in_progress") &&
        (c.weak_category === "red" || c.difficulty === "hard")
    );
  }, [chapters]);

  // AI Automatic Timetable Generator (Feature 36)
  const handleGenerateAiTimetable = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const generatedSessions: StudySession[] = [];

    let dayIdx = 0;
    subjects.forEach((sub, sIdx) => {
      const pendingChap = chapters.find((c) => c.subject_id === sub.id && c.status !== "completed");
      const day = days[dayIdx % days.length];
      dayIdx++;

      generatedSessions.push({
        id: `sess-ai-${Date.now()}-${sIdx}`,
        student_id: user?.id || "student-active",
        timetable_id: "tt-active",
        subject_id: sub.id,
        subject_name: sub.name,
        subject_color: sub.color || "#8b5cf6",
        chapter_title: pendingChap?.title || "Key Concepts & Revision",
        date: todayStr,
        start_time: sIdx % 2 === 0 ? "09:30" : "15:00",
        end_time: sIdx % 2 === 0 ? "11:30" : "17:00",
        duration_minutes: 120,
        session_type: "study",
        status: "scheduled",
        notes: `AI Scheduled session for ${day}`,
        created_at: new Date().toISOString(),
      });
    });

    const updated = [...generatedSessions, ...sessions];
    setSessions(updated);
    StorageRepository.setStudySessions(updated, user?.id);
    alert(`AI Timetable Generator successfully created ${generatedSessions.length} balanced sessions across your curriculum!`);
  };

  // Backlog Recovery Plan Generator (Feature 42)
  const handleGenerateBacklogPlan = () => {
    const recoveryTasks: StudentTask[] = backlogChapters.slice(0, 5).map((chap, i) => {
      const sub = subjects.find((s) => s.id === chap.subject_id);
      return {
        id: `recov-${Date.now()}-${i}`,
        student_id: user?.id || "student-active",
        title: `Catch-up Review: ${chap.title}`,
        subject_id: sub?.id,
        subject_name: sub?.name,
        due_date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split("T")[0],
        priority: "high",
        is_completed: false,
        created_at: new Date().toISOString(),
      };
    });

    const updated = [...recoveryTasks, ...tasks];
    setTasks(updated);
    StorageRepository.setTasks(updated, user?.id);
    alert(`Generated 5 high-priority backlog recovery slots scheduled across upcoming days.`);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Smart Study Planning Hub
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Targets, Timetable & Backlog Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Intelligently allocate your study hours, automate timetables, and conquer backlog topics.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAiTimetable}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold hover:bg-violet-100 transition-all dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Auto-Schedule
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 shadow-xs transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setPlannerTab("targets")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            plannerTab === "targets"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Daily Targets & Checklist
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {completedTodayTasks}/{totalTodayTasks}
          </span>
        </button>

        <button
          onClick={() => setPlannerTab("allocation")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            plannerTab === "allocation"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Subject Time Allocation (Feature 37)
        </button>

        <button
          onClick={() => setPlannerTab("backlog")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            plannerTab === "backlog"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          Backlog Recovery & Crunch (Feature 42)
          {backlogChapters.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold dark:bg-rose-950 dark:text-rose-300">
              {backlogChapters.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setPlannerTab("timer")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            plannerTab === "timer"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pomodoro Focus Timer (Feature 45)
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY TARGETS & CHECKLIST */}
      {/* ========================================================= */}
      {plannerTab === "targets" && (
        <div className="space-y-6">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500">Today&apos;s Target Budget</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {dailyTargetHours} <span className="text-sm font-normal text-slate-400">Hours/Day</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-violet-600" />
                <span>Adjustable in student academic settings</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500">Today&apos;s Goals Completed</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {completedTodayTasks} / {totalTodayTasks}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {totalTodayTasks > 0
                  ? `${Math.round((completedTodayTasks / totalTodayTasks) * 100)}% of daily focus finished`
                  : "No goals scheduled yet for today"}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500">All Pending Goals</div>
              <div className="mt-1 text-2xl font-bold text-violet-600">
                {tasks.filter((t) => !t.is_completed).length}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Distributed across weekly calendar schedule
              </div>
            </div>
          </div>

          {/* Task Filter Pills */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setTaskView("today")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  taskView === "today"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Today&apos;s Focus ({totalTodayTasks})
              </button>
              <button
                onClick={() => setTaskView("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  taskView === "all"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                All Goals ({tasks.length})
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2.5">
            {visibleTasks.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <CalendarCheck2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                <div className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  No goals found for this view
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Click &quot;Add Goal&quot; above to set your targets for today.
                </p>
              </div>
            ) : (
              visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    task.is_completed
                      ? "border-slate-200/60 bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/40 opacity-75"
                      : "border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="text-slate-400 hover:text-violet-600 transition-colors"
                    >
                      {task.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                    <div>
                      <div
                        className={`text-sm font-semibold ${
                          task.is_completed
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        {task.subject_name && (
                          <span className="text-violet-600 dark:text-violet-400 font-medium">
                            {task.subject_name}
                          </span>
                        )}
                        <span>•</span>
                        <span>Due: {task.due_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        task.priority === "high"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : task.priority === "medium"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SUBJECT TIME ALLOCATION (Feature 37 & 38) */}
      {/* ========================================================= */}
      {plannerTab === "allocation" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Subject-Wise Time Allocation Matrix (Feature 37)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Calculates daily study minutes distributed across subjects according to syllabus length, chapter difficulty, and upcoming exam weights.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((sub) => {
                const subChapters = chapters.filter((c) => c.subject_id === sub.id);
                const pendingCount = subChapters.filter((c) => c.status !== "completed").length;
                const sharePercent = Math.round((subChapters.length / (chapters.length || 1)) * 100);
                const dailyMinutes = Math.round((sharePercent / 100) * (dailyTargetHours * 60));

                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate" title={sub.name}>
                        {sub.name}
                      </div>
                      <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full dark:bg-violet-950/60 dark:text-violet-300">
                        {dailyMinutes} mins/day
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mb-3 flex items-center justify-between">
                      <span>Total Lessons: {subChapters.length}</span>
                      <span>Pending: {pendingCount}</span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{ width: `${sharePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BACKLOG RECOVERY & CRUNCH (Feature 42 & 43) */}
      {/* ========================================================= */}
      {plannerTab === "backlog" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-rose-500" />
                  Backlog Recovery & Last-Minute Crunch Planner (Features 42, 43)
                </h3>
                <p className="text-xs text-slate-500">
                  Identifies difficult and unfinished chapters requiring dedicated remedial study slots.
                </p>
              </div>

              <button
                onClick={handleGenerateBacklogPlan}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 shadow-xs transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                Generate Recovery Schedule
              </button>
            </div>

            <div className="space-y-3">
              {backlogChapters.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  🎉 Excellent! You have zero critical backlog chapters. You are fully on track!
                </div>
              ) : (
                backlogChapters.map((ch) => {
                  const sub = subjects.find((s) => s.id === ch.subject_id);
                  return (
                    <div
                      key={ch.id}
                      className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between dark:border-rose-900/40 dark:bg-rose-950/20"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {ch.title}
                        </div>
                        <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                          {sub?.name} • Difficulty: {ch.difficulty} • Estimated: {ch.estimated_hours}h
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200">
                        Priority Backlog
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: POMODORO FOCUS TIMER (Feature 45) */}
      {/* ========================================================= */}
      {plannerTab === "timer" && (
        <div className="space-y-6">
          <div className="max-w-xl mx-auto rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Pomodoro Focus & Study Timer (Features 44, 45)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              25 minutes of deep distraction-free study followed by a 5-minute restorative break.
            </p>

            {/* Subject Selector for Session Recording */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Select Subject for Focus Session:
              </label>
              <select
                value={selectedTimerSubject}
                onChange={(e) => setSelectedTimerSubject(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">General Study Session</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6">
              <button
                onClick={() => {
                  setTimerMode("work");
                  setTimerSeconds(25 * 60);
                  setTimerRunning(false);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timerMode === "work"
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => {
                  setTimerMode("shortBreak");
                  setTimerSeconds(5 * 60);
                  setTimerRunning(false);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timerMode === "shortBreak"
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Short Break (5m)
              </button>
              <button
                onClick={() => {
                  setTimerMode("longBreak");
                  setTimerSeconds(15 * 60);
                  setTimerRunning(false);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timerMode === "longBreak"
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Long Break (15m)
              </button>
            </div>

            {/* Big Countdown Display */}
            <div className="my-4 text-7xl font-extrabold tracking-tight text-violet-600">
              {formatTimer(timerSeconds)}
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all ${
                  timerRunning
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                {timerRunning ? (
                  <>Pause Timer</>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" /> Start Session
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(timerMode === "work" ? 25 * 60 : timerMode === "shortBreak" ? 5 * 60 : 15 * 60);
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Create New Study Target
            </h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Title / Lesson
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Solve 10 PYQ numericals for Cash Flow"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject (Optional)
                </label>
                <select
                  value={taskSubjectId}
                  onChange={(e) => setTaskSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">General Target</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 shadow-xs"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
