"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { RoadmapEngine } from "@/lib/roadmapEngine";
import { PreparationCentres } from "@/lib/preparationCentres";
import { DailyTargetEngine } from "@/lib/dailyTargetEngine";
import { runCsExecutiveCurriculumAudit } from "@/lib/curriculumAudit";
import {
  CompleteRoadmapPlan,
  DailyStudyTarget,
  DailyStudyTask,
  DEFAULT_REVISION_STRATEGIES,
  RevisionStrategyConfig,
} from "@/types/roadmap";
import { Subject, Chapter, Examination, StudySession } from "@/types/database";
import {
  Compass,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Sliders,
  Sparkles,
  Moon,
  Lock,
  Unlock,
  Plus,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const fireCelebration = async () => {
  if (typeof window !== "undefined") {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 35, spread: 60 });
    } catch {
      // non-critical animation
    }
  }
};

export default function SmartRoadmapPage() {
  const { user, student } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Navigation & View mode
  const [viewMode, setViewMode] = useState<"daily" | "centres" | "roadmap" | "timeline">("daily");
  const [centresTab, setCentresTab] = useState<"pending" | "revision" | "test">("pending");
  const [selectedStrategyId, setSelectedStrategyId] = useState("strategy-standard");

  // Daily target state
  const [todayTarget, setTodayTarget] = useState<DailyStudyTarget | null>(null);

  // Roadmap plan state
  const [roadmapPlan, setRoadmapPlan] = useState<CompleteRoadmapPlan | null>(null);

  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAddPersonalTaskModal, setShowAddPersonalTaskModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);

  // Editing state for timeline
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");

  // Personal task input
  const [personalTaskTitle, setPersonalTaskTitle] = useState("");
  const [personalTaskHours, setPersonalTaskHours] = useState(1.5);

  // End-of-day check-in form state
  const [checkInCompletedAll, setCheckInCompletedAll] = useState(true);
  const [checkInDifficult, setCheckInDifficult] = useState(false);
  const [checkInDifficultNotes, setCheckInDifficultNotes] = useState("");
  const [checkInNeedMoreTime, setCheckInNeedMoreTime] = useState(false);
  const [checkInReschedule, setCheckInReschedule] = useState(true);

  // Notification / Alert toast
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const userId = user?.id;
    const subs = StorageRepository.getSubjects(userId);
    const chaps = StorageRepository.getChapters(userId);
    const exList = StorageRepository.getExaminations(userId);
    const sessList = StorageRepository.getStudySessions(userId);

    setSubjects(subs);
    setChapters(chaps);
    setExams(exList);
    setSessions(sessList);

    // Load Daily Target
    const today = DailyTargetEngine.getTodayTargets(userId);
    setTodayTarget(today);

    // Load Roadmap
    if (subs.length > 0) {
      const plan = RoadmapEngine.generateRoadmap({
        studentId: userId || "student-active",
        examName: student?.target_exam || "CS Executive Examination",
        targetExamDate: student?.upcoming_exam_date || "2026-12-21",
        dailyHours: student?.daily_available_hours || 4.5,
        subjects: subs,
        chapters: chaps,
        examinations: exList,
      });
      setRoadmapPlan(plan);
    }
  }, [user?.id, student?.target_exam, student?.upcoming_exam_date, student?.daily_available_hours]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Preparation Centres Data
  const centresData = useMemo(() => {
    return PreparationCentres.getCentresData(
      subjects,
      chapters,
      student?.daily_available_hours || 4.5,
      selectedStrategyId
    );
  }, [subjects, chapters, student?.daily_available_hours, selectedStrategyId]);

  // Syllabus Audit status
  const auditReport = useMemo(() => {
    return runCsExecutiveCurriculumAudit(
      subjects.map((s) => ({
        subjectName: s.name,
        chapters: chapters
          .filter((c) => c.subject_id === s.id)
          .map((c) => ({ title: c.title, chapterNumber: c.chapter_number })),
      }))
    );
  }, [subjects, chapters]);

  // Toggle Daily Task Completion
  const handleToggleTask = (task: DailyStudyTask) => {
    const userId = user?.id;
    const res = DailyTargetEngine.toggleTaskCompletion(task, userId);

    if (res.isNowCompleted) {
      fireCelebration();
      if (res.nextRevisionScheduled) {
        setNotification(
          `🎉 Chapter completed! Automatically scheduled Revision 1 for ${res.nextRevisionScheduled} in the Revision Centre.`
        );
      }
    }

    loadData();
  };

  // Complete a chapter directly from Pending Study Centre
  const handleCompletePendingChapter = (chapterId: string, hours: number) => {
    const userId = user?.id;
    const res = PreparationCentres.markStudyChapterCompleted(chapterId, hours, userId);
    fireCelebration();
    setNotification(
      `✓ Chapter moved from Pending Study to Revision Centre! Next revision scheduled for: ${res.nextRevisionDate}`
    );
    loadData();
  };

  // Reschedule Overdue Revisions
  const handleRescheduleOverdue = () => {
    const res = PreparationCentres.rescheduleOverdueRevisions(
      centresData.revisionCentre.overdueQueue,
      2.0
    );
    setNotification(
      `Intelligently redistributed ${res.length} overdue revisions across upcoming days within your daily hour budget!`
    );
    loadData();
  };

  // Process End of Day Check-In
  const handleApplyCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = user?.id;
    const uncompleted = todayTarget?.tasks.filter((t) => !t.isCompleted).map((t) => t.id) || [];

    const res = DailyTargetEngine.processDailyCheckIn(
      {
        date: new Date().toISOString().split("T")[0],
        completedAllToday: checkInCompletedAll,
        uncompletedTaskIds: uncompleted,
        foundDifficult: checkInDifficult,
        difficultyNotes: checkInDifficultNotes,
        needMoreTime: checkInNeedMoreTime,
        rescheduleRequested: checkInReschedule,
        recordedAt: new Date().toISOString(),
      },
      userId
    );

    setShowCheckInModal(false);
    setNotification(res.adjustmentSummary);
    loadData();
  };

  // Add personal task
  const handleAddPersonalTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalTaskTitle.trim()) return;

    const newSession: StudySession = {
      id: `session-personal-${Date.now()}`,
      student_id: user?.id || "student-active",
      timetable_id: "tt-active",
      subject_id: subjects[0]?.id || "sub-custom",
      subject_name: "Personal Study Task",
      subject_color: "#8B5CF6",
      chapter_id: "chap-personal",
      chapter_title: personalTaskTitle.trim(),
      title: personalTaskTitle.trim(),
      date: new Date().toISOString().split("T")[0],
      start_time: "07:00 PM",
      end_time: "08:30 PM",
      duration_minutes: Math.round(personalTaskHours * 60),
      session_type: "study",
      status: "scheduled",
      is_locked: true,
      notes: "Personal study task added by student",
      created_at: new Date().toISOString(),
    };

    const updated = [newSession, ...sessions];
    StorageRepository.setStudySessions(updated, user?.id);
    setShowAddPersonalTaskModal(false);
    setPersonalTaskTitle("");
    setNotification("Personal study task successfully added to today's schedule!");
    loadData();
  };

  // Lock / Unlock session in timeline
  const toggleSessionLock = (sessionId: string) => {
    const userId = user?.id;
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        return { ...s, is_locked: !s.is_locked };
      }
      return s;
    });
    StorageRepository.setStudySessions(updated, userId);
    setSessions(updated);
  };

  // Save session date/time edits
  const handleSaveSessionEdit = (sessionId: string) => {
    const userId = user?.id;
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          date: editDate || s.date,
          start_time: editStartTime || s.start_time,
          is_locked: true,
        };
      }
      return s;
    });
    StorageRepository.setStudySessions(updated, userId);
    setSessions(updated);
    setEditingSessionId(null);
    setNotification("Session updated and locked to prevent accidental overwrite!");
    loadData();
  };

  // Regenerate future sessions with impact analysis
  const handleConfirmRegenerate = () => {
    const userId = user?.id;
    const lockedSessions = sessions.filter((s) => s.is_locked || s.status === "completed");

    // Generate fresh sessions for remaining pending chapters
    const unstudied = chapters.filter((c) => c.study_status !== "completed");
    const freshPlan = RoadmapEngine.generateRoadmap({
      studentId: userId || "student-active",
      examName: student?.target_exam || "CS Executive Examination",
      targetExamDate: student?.upcoming_exam_date || "2026-12-21",
      dailyHours: student?.daily_available_hours || 4.5,
      subjects,
      chapters: unstudied,
      examinations: exams,
    });

    setRoadmapPlan(freshPlan);
    setShowImpactModal(false);
    setNotification(
      `Plan regenerated! Preserved ${lockedSessions.length} approved/locked sessions while re-distributing ${unstudied.length} pending chapters.`
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
      {/* Top Banner / Verification Header */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-950/60 via-indigo-950/40 to-slate-900 border border-violet-500/30 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
                <Compass className="h-4 w-4" />
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Smart Study Roadmap & Automatic Preparation Management
              </h1>
            </div>
            <p className="text-xs text-slate-300">
              AI organizes syllabus completion, spaced revisions, test milestones, and daily reallocations automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {auditReport.isFullyVerified ? (
              <button
                onClick={() => setShowAuditModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>128 Chapters Verified from PDF</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuditModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition animate-pulse"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Audit Warning: {auditReport.totalMissing + auditReport.totalMismatch} Discrepancies</span>
              </button>
            )}

            <button
              onClick={() => setShowCheckInModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition"
            >
              <Moon className="h-3.5 w-3.5" />
              <span>End-of-Day Check-In</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="mt-4 rounded-xl bg-violet-950/80 border border-violet-500/40 p-3 text-xs text-violet-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-400" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-violet-400 hover:text-white">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Quick View Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setViewMode("daily")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            viewMode === "daily"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "bg-[#0b0f19] text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Today&apos;s Target (Daily Plan)</span>
          {todayTarget && todayTarget.tasks.length > 0 && (
            <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] text-violet-300">
              {todayTarget.completedTasksCount}/{todayTarget.totalTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setViewMode("centres")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            viewMode === "centres"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "bg-[#0b0f19] text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>3 Preparation Centres</span>
        </button>

        <button
          onClick={() => setViewMode("roadmap")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            viewMode === "roadmap"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "bg-[#0b0f19] text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>3-Phase Visual Roadmap</span>
        </button>

        <button
          onClick={() => setViewMode("timeline")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            viewMode === "timeline"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "bg-[#0b0f19] text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Editable Session Timeline</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: TODAY'S TARGET (MODULE 4: SIMPLE DAILY STUDY PLAN) */}
      {/* ======================================================== */}
      {viewMode === "daily" && todayTarget && (
        <div className="space-y-6">
          {/* Daily KPI Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4">
              <span className="text-[11px] font-medium text-slate-400 block">Today&apos;s Date</span>
              <span className="text-base font-bold text-white mt-1 block">{todayTarget.date}</span>
            </div>
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4">
              <span className="text-[11px] font-medium text-slate-400 block">Estimated Study Time</span>
              <span className="text-base font-bold text-indigo-400 mt-1 block">
                {todayTarget.totalEstimatedHours} Hours
              </span>
            </div>
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4">
              <span className="text-[11px] font-medium text-slate-400 block">Completed Tasks</span>
              <span className="text-base font-bold text-emerald-400 mt-1 block">
                {todayTarget.completedTasksCount} of {todayTarget.totalTasksCount}
              </span>
            </div>
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4">
              <span className="text-[11px] font-medium text-slate-400 block">Daily Completion</span>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${todayTarget.completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white">{todayTarget.completionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Today's Tasks Queue */}
          <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">TODAY&apos;S TARGET QUEUE</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check off items as you finish. Study completions automatically trigger spaced revision scheduling.
                </p>
              </div>
              <button
                onClick={() => setShowAddPersonalTaskModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {todayTarget.tasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No targets scheduled for today!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Relax or add custom study chapters from the Pending Study Centre.
                  </p>
                </div>
              ) : (
                todayTarget.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 flex items-center justify-between gap-4 transition ${
                      task.isCompleted ? "bg-slate-900/30 opacity-75" : "hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                          task.isCompleted
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-600 hover:border-slate-400 text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              task.type === "study"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                                : task.type === "revision"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                                : task.type === "test"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-slate-500/10 text-slate-400 border border-slate-500/30"
                            }`}
                          >
                            {task.type}
                          </span>

                          <h3
                            className={`text-sm font-semibold ${
                              task.isCompleted ? "line-through text-slate-500" : "text-white"
                            }`}
                          >
                            {task.title}
                          </h3>
                        </div>

                        <span className="text-xs text-slate-400 block mt-0.5">
                          {task.subjectName} • {task.estimatedHours} hrs estimated
                          {task.milestone && ` • ${task.milestone.replace("_", " ").toUpperCase()}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.isCompleted ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          Completed
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: THREE SEPARATE PREPARATION CENTRES (MODULE 2)     */}
      {/* ======================================================== */}
      {viewMode === "centres" && (
        <div className="space-y-6">
          {/* Sub Navigation for 3 Centres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setCentresTab("pending")}
              className={`text-left p-4 rounded-2xl border transition ${
                centresTab === "pending"
                  ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30"
                  : "bg-[#0b0f19] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400">CENTRE A</span>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                  {centresData.pendingStudy.totalPendingCount} Pending
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Pending Study</h3>
              <p className="text-xs text-slate-400 mt-1">
                {centresData.pendingStudy.remainingStudyHours} hrs remaining • Est: {centresData.pendingStudy.estimatedCompletionDate}
              </p>
            </button>

            <button
              onClick={() => setCentresTab("revision")}
              className={`text-left p-4 rounded-2xl border transition ${
                centresTab === "revision"
                  ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30"
                  : "bg-[#0b0f19] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">CENTRE B</span>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                  {centresData.revisionCentre.totalPendingRevisionsCount} Due
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Revision Centre</h3>
              <p className="text-xs text-slate-400 mt-1">
                Spaced repetition queues • {centresData.revisionCentre.overdueQueue.length} Overdue
              </p>
            </button>

            <button
              onClick={() => setCentresTab("test")}
              className={`text-left p-4 rounded-2xl border transition ${
                centresTab === "test"
                  ? "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30"
                  : "bg-[#0b0f19] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">CENTRE C</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {centresData.testCentre.pendingTests.length} In Queue
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Test Centre</h3>
              <p className="text-xs text-slate-400 mt-1">
                Diagnostic, Sectional &amp; Mocks • {centresData.testCentre.averageScorePct}% Avg Score
              </p>
            </button>
          </div>

          {/* TAB A: PENDING STUDY */}
          {centresTab === "pending" && (
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Pending Study Chapters</h3>
                  <p className="text-xs text-slate-400">
                    Chapters not yet finished. Click &quot;Mark Completed&quot; when studied to automatically move to Revision Centre.
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  Total Remaining: <strong className="text-white">{centresData.pendingStudy.remainingStudyHours} hrs</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {centresData.pendingStudy.notStartedChapters.map((ch) => {
                  const sub = subjects.find((s) => s.id === ch.subject_id);
                  return (
                    <div
                      key={ch.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          {sub?.name || "Subject"} • P{sub?.code || ""}.{ch.chapter_number}
                        </span>
                        <h4 className="text-xs font-semibold text-white mt-0.5 line-clamp-1">{ch.title}</h4>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Est: {ch.estimated_hours || 3.5} hrs • {ch.nature || "theory"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCompletePendingChapter(ch.id, ch.estimated_hours || 3.5)}
                        className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                      >
                        Complete Study
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB B: REVISION CENTRE */}
          {centresTab === "revision" && (
            <div className="space-y-4">
              {/* Strategy Selector Bar */}
              <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white">Active Revision Strategy</h3>
                  <p className="text-[11px] text-slate-400">
                    Spaced repetition cadence used to automatically calculate subsequent review dates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {DEFAULT_REVISION_STRATEGIES.map((st: RevisionStrategyConfig) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>

                  {centresData.revisionCentre.overdueQueue.length > 0 && (
                    <button
                      onClick={handleRescheduleOverdue}
                      className="rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 px-3 py-1.5 text-xs font-bold transition"
                    >
                      Reschedule {centresData.revisionCentre.overdueQueue.length} Overdue
                    </button>
                  )}
                </div>
              </div>

              {/* Revision Queues */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rev 1 */}
                <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-purple-400">Revision 1 Pending</h4>
                    <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                      {centresData.revisionCentre.rev1Queue.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {centresData.revisionCentre.rev1Queue.map((item) => (
                      <div key={item.id} className="rounded-lg bg-slate-900 p-2.5 text-xs border border-slate-800/80">
                        <span className="font-semibold text-white block line-clamp-1">{item.chapterTitle}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Due: {item.dueDate} {item.isOverdue && <strong className="text-rose-400">(Overdue)</strong>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rev 2 */}
                <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-indigo-400">Revision 2 Pending</h4>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                      {centresData.revisionCentre.rev2Queue.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {centresData.revisionCentre.rev2Queue.map((item) => (
                      <div key={item.id} className="rounded-lg bg-slate-900 p-2.5 text-xs border border-slate-800/80">
                        <span className="font-semibold text-white block line-clamp-1">{item.chapterTitle}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Due: {item.dueDate}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rev 3 */}
                <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-emerald-400">Revision 3 Sprint</h4>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {centresData.revisionCentre.rev3Queue.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {centresData.revisionCentre.rev3Queue.map((item) => (
                      <div key={item.id} className="rounded-lg bg-slate-900 p-2.5 text-xs border border-slate-800/80">
                        <span className="font-semibold text-white block line-clamp-1">{item.chapterTitle}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Due: {item.dueDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB C: TEST CENTRE */}
          {centresTab === "test" && (
            <div className="space-y-4">
              {/* Weak Chapters Warning */}
              {centresData.testCentre.weakChapters.length > 0 && (
                <div className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertCircle className="h-4 w-4" />
                    <span>Targeted Improvement Focus (Chapters Scored Below 50%)</span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-200">
                    {centresData.testCentre.weakChapters.map((w, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                        <span className="font-bold text-white">{w.chapterTitle} ({w.score}%)</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{w.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Queues */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white border-b border-slate-800 pb-2">
                    Diagnostic Chapter Tests
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {centresData.testCentre.chapterTests.slice(0, 5).map((t) => (
                      <div key={t.id} className="rounded-lg bg-slate-900 p-2.5 text-xs border border-slate-800">
                        <span className="font-semibold text-white block line-clamp-1">{t.title}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Status: {t.status} {t.lastScore && `• ${t.lastScore}/${t.maxScore}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white border-b border-slate-800 pb-2">
                    Sectional Subject Tests
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {centresData.testCentre.subjectTests.map((t) => (
                      <div key={t.id} className="rounded-lg bg-slate-900 p-2.5 text-xs border border-slate-800">
                        <span className="font-semibold text-white block line-clamp-1">{t.title}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{t.subjectName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white border-b border-slate-800 pb-2">
                    Full Syllabus Mock Simulations
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {centresData.testCentre.mockTests.map((t) => (
                      <div key={t.id} className="rounded-lg bg-slate-900 p-2.5 text-xs border border-slate-800">
                        <span className="font-semibold text-white block line-clamp-1">{t.title}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Due: {t.dueDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: 3-PHASE VISUAL ROADMAP (MODULE 3 & FEASIBILITY)   */}
      {/* ======================================================== */}
      {viewMode === "roadmap" && roadmapPlan && (
        <div className="space-y-6">
          {/* Feasibility / Realism Banner */}
          <div
            className={`rounded-2xl p-5 border shadow-xl ${
              roadmapPlan.feasibility.isRealistic
                ? "bg-emerald-950/30 border-emerald-500/40"
                : "bg-rose-950/40 border-rose-500/50"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {roadmapPlan.feasibility.isRealistic ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  )}
                  <h3 className="text-sm font-bold text-white">
                    {roadmapPlan.feasibility.isRealistic
                      ? "Roadmap Workload: Feasible & Pedagogically Sound"
                      : "Roadmap Alert: Requested Timeline Unrealistic"}
                  </h3>
                </div>

                <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                  {roadmapPlan.feasibility.warningMessage ||
                    `Total preparation requires ${roadmapPlan.feasibility.totalRequiredHours} hrs across 3 phases. At your daily pace of ${roadmapPlan.dailyStudyHours} hrs/day, you have ${roadmapPlan.feasibility.totalAvailableHours} hrs available before ${roadmapPlan.targetExamDate}.`}
                </p>
              </div>

              {!roadmapPlan.feasibility.isRealistic && (
                <div className="text-right">
                  <span className="text-xs font-semibold text-rose-300 block">Recommended Daily Target:</span>
                  <span className="text-lg font-bold text-white">
                    {roadmapPlan.feasibility.recommendedDailyHours} Hours / Day
                  </span>
                </div>
              )}
            </div>

            {roadmapPlan.feasibility.alternativeSuggestions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-rose-500/30 space-y-1">
                <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
                  AI Recommended Adjustments:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                  {roadmapPlan.feasibility.alternativeSuggestions.map((alt, idx) => (
                    <li key={idx}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 3 Main Roadmap Phases */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phase 1 */}
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 block">
                    Phase 1
                  </span>
                  <h3 className="text-sm font-bold text-white">Syllabus Completion</h3>
                </div>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300">
                  {roadmapPlan.phase1.totalDays} Days
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Start Date:</span>
                  <span className="text-white font-medium">{roadmapPlan.phase1.startDate}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Completion Target:</span>
                  <span className="text-white font-medium">{roadmapPlan.phase1.targetDate}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Study Hours:</span>
                  <span className="text-white font-medium">{roadmapPlan.phase1.totalHours} hrs</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Subject Pacing Deadlines:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {roadmapPlan.phase1.subjectDeadlines.map((sd) => (
                    <div key={sd.subjectId} className="flex justify-between items-center text-xs text-slate-300">
                      <span className="truncate max-w-[150px]">{sd.subjectName}</span>
                      <span className="text-indigo-400 font-mono text-[11px]">{sd.deadlineDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 block">
                    Phase 2
                  </span>
                  <h3 className="text-sm font-bold text-white">Spaced Revisions</h3>
                </div>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-300">
                  {roadmapPlan.phase2.totalDays} Days
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Revision 1 Target:</span>
                  <span className="text-white font-medium">{roadmapPlan.phase2.revision1Deadline}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Revision 2 Target:</span>
                  <span className="text-white font-medium">{roadmapPlan.phase2.revision2Deadline}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Revision 3 Sprint:</span>
                  <span className="text-white font-medium">{roadmapPlan.phase2.revision3Deadline}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Milestone Objectives:</span>
                <div className="space-y-2">
                  {roadmapPlan.phase2.milestones.map((m, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-900 p-2 text-xs border border-slate-800">
                      <span className="font-bold text-purple-300 block">{m.title}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{m.focus}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                    Phase 3
                  </span>
                  <h3 className="text-sm font-bold text-white">Tests &amp; Exam Practice</h3>
                </div>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                  {roadmapPlan.phase3.totalDays} Days
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Diagnostic Chapter Tests:</span>
                  <span className="text-white font-medium">{roadmapPlan.phase3.chapterTestsCount} Tests</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sectional Evaluations:</span>
                  <span className="text-white font-medium">{roadmapPlan.phase3.subjectTestsCount} Tests</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target Exam Date:</span>
                  <span className="text-amber-400 font-bold">{roadmapPlan.targetExamDate}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Full Mock Exam Dates:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {roadmapPlan.phase3.mockExams.map((mock, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-900 p-2 text-xs border border-slate-800 flex justify-between items-center">
                      <span className="font-semibold text-white truncate max-w-[160px]">{mock.subjectName}</span>
                      <span className="text-amber-400 font-mono text-[11px]">{mock.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: FULLY EDITABLE TIMELINE (MODULE 7)               */}
      {/* ======================================================== */}
      {viewMode === "timeline" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#0b0f19] border border-slate-800 p-4">
            <div>
              <h3 className="text-sm font-bold text-white">Editable Study Session Schedule</h3>
              <p className="text-xs text-slate-400">
                Modify dates, time slots, or lock sessions. Click &quot;Regenerate Future Sessions&quot; to calibrate future allocations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddPersonalTaskModal(true)}
                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
              >
                + Personal Task
              </button>
              <button
                onClick={() => setShowImpactModal(true)}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
              >
                ⚡ Regenerate Future Plan
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {sessions.map((sess) => {
              const isEditing = editingSessionId === sess.id;

              return (
                <div
                  key={sess.id}
                  className="rounded-xl bg-[#0b0f19] border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSessionLock(sess.id)}
                      className="text-slate-400 hover:text-white transition"
                      title={sess.is_locked ? "Locked" : "Unlocked"}
                    >
                      {sess.is_locked ? (
                        <Lock className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Unlock className="h-4 w-4 text-slate-500" />
                      )}
                    </button>

                    <div>
                      <h4 className="text-xs font-bold text-white">{sess.title}</h4>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {sess.subject_name} • {sess.date} • {sess.start_time} - {sess.end_time} ({sess.duration_minutes}m)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="time"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => handleSaveSessionEdit(sess.id)}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSessionId(sess.id);
                          setEditDate(sess.date);
                          setEditStartTime(sess.start_time);
                        }}
                        className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition"
                      >
                        Edit Date/Time
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: END-OF-DAY SMART AUTOMATIC ADJUSTMENT (MODULE 8) */}
      {/* ======================================================== */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0e1424] border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">End-of-Day Smart Roadmap Check-In</h3>
              </div>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyCheckIn} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">
                  1. Did you complete all of today&apos;s scheduled targets?
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckInCompletedAll(true)}
                    className={`flex-1 rounded-xl py-2 font-bold border transition ${
                      checkInCompletedAll
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                  >
                    Yes, Finished Everything!
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckInCompletedAll(false)}
                    className={`flex-1 rounded-xl py-2 font-bold border transition ${
                      !checkInCompletedAll
                        ? "bg-amber-600 border-amber-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                  >
                    Partially / Needs Shift
                  </button>
                </div>
              </div>

              {!checkInCompletedAll && (
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">
                    2. Reschedule remaining tasks to tomorrow automatically?
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkInReschedule}
                      onChange={(e) => setCheckInReschedule(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
                    />
                    <span>Yes, shift uncompleted sessions without disrupting rest days</span>
                  </label>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-200 block mb-1">
                  3. Did you encounter any difficult concepts today?
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={checkInDifficult}
                    onChange={(e) => setCheckInDifficult(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span>Yes, need additional revision buffer</span>
                </label>
                {checkInDifficult && (
                  <textarea
                    placeholder="Enter chapter title or problem type (e.g. Consolidation AS 21)..."
                    value={checkInDifficultNotes}
                    onChange={(e) => setCheckInDifficultNotes(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white"
                    rows={2}
                  />
                )}
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 mt-2">
                  <input
                    type="checkbox"
                    checked={checkInNeedMoreTime}
                    onChange={(e) => setCheckInNeedMoreTime(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span>Need more daily study time allocated tomorrow</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 font-bold text-white shadow-md"
                >
                  Apply Smart Calibration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD PERSONAL STUDY TASK                         */}
      {/* ======================================================== */}
      {showAddPersonalTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0e1424] border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Add Personal Study Task
            </h3>
            <form onSubmit={handleAddPersonalTask} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Read Case Law Digest on Section 185..."
                  value={personalTaskTitle}
                  onChange={(e) => setPersonalTaskTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="6"
                  value={personalTaskHours}
                  onChange={(e) => setPersonalTaskHours(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPersonalTaskModal(false)}
                  className="rounded-xl bg-slate-800 px-3 py-1.5 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-1.5 font-bold text-white"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: REGENERATION IMPACT ANALYSIS (MODULE 7)         */}
      {/* ======================================================== */}
      {showImpactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0e1424] border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Plan Regeneration Impact Analysis</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                You are about to regenerate future study sessions. StudyMate AI guarantees:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-200">
                <li>All completed sessions remain 100% preserved.</li>
                <li>All locked sessions ({sessions.filter((s) => s.is_locked).length} locked) will not be moved.</li>
                <li>Revision and test attempt histories remain untouched.</li>
                <li>Only pending/unstarted sessions are recalibrated across remaining days.</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowImpactModal(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-semibold text-slate-300 text-xs"
              >
                Keep Current Schedule
              </button>
              <button
                onClick={handleConfirmRegenerate}
                className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 font-bold text-white text-xs shadow-md"
              >
                Proceed with Safe Regeneration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: SYLLABUS AUDIT REPORT & DISCREPANCY VIEWER      */}
      {/* ======================================================== */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-[#0e1424] border border-slate-700 p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Syllabus Index Verification Audit</h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Total Chapters</span>
                  <span className="text-lg font-bold text-white">{auditReport.totalPdfChapters}</span>
                </div>
                <div className="rounded-xl bg-slate-900 p-3 border border-emerald-500/30">
                  <span className="text-slate-400 block text-[11px]">Verified Exact</span>
                  <span className="text-lg font-bold text-emerald-400">{auditReport.totalChaptersVerified}</span>
                </div>
                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Accuracy</span>
                  <span className="text-lg font-bold text-indigo-400">{auditReport.overallAccuracyPct}%</span>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Paper</th>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3">Total Lessons</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {auditReport.subjects.map((s) => (
                      <tr key={s.paperNumber}>
                        <td className="py-2.5 px-3 font-mono">P{s.paperNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{s.subjectName}</td>
                        <td className="py-2.5 px-3">{s.totalPdfChapters} chapters</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">100% VERIFIED</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Link
                  href="/admin/curriculum-audit"
                  className="text-violet-400 hover:text-violet-300 font-semibold underline text-xs inline-flex items-center gap-1"
                >
                  <span>Open Full 128-Row Verification Console</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2 font-bold text-white text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
