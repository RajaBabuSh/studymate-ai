"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Flame,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  Zap,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { Subject, Chapter, StudyProgress, StudySession } from "@/types/database";

export default function ProgressTrackerPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<StudyProgress[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    const userId = user?.id;
    setSubjects(StorageRepository.getSubjects(userId));
    setChapters(StorageRepository.getChapters(userId));
    setProgress(StorageRepository.getProgress(userId));
    setSessions(StorageRepository.getStudySessions(userId));
  }, [user?.id]);

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === "completed").length;
  const inProgressChapters = chapters.filter((c) => c.status === "in_progress").length;
  const pendingChapters = chapters.filter((c) => c.status === "pending").length;

  const masteredChapters = chapters.filter((c) => c.revision_status === "mastered").length;
  const revisedOnceChapters = chapters.filter((c) => c.revision_status === "revised_once").length;

  const totalMinutesPastWeek = progress.reduce((acc, p) => acc + p.total_minutes_studied, 0);
  const totalHoursPastWeek = (totalMinutesPastWeek / 60).toFixed(1);

  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const overallCompletionRate =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Study Progress & Consistency Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual statistics covering daily hours, weekly consistency streak, chapter completion, and revision retention.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:border-amber-900 dark:text-amber-300">
          <Flame className="h-4 w-4 text-amber-500 animate-bounce" />
          <span>7-Day Active Streak</span>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Weekly Study Time</span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalHoursPastWeek}h
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              +18% vs previous week
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Overall Syllabus</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {overallCompletionRate}%
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {completedChapters} of {totalChapters} chapters done
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Revision Mastery</span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {masteredChapters} Chaps
            </span>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
              Mastered (3x spaced repetition)
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Completed Sessions</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {completedSessions}
            </span>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Across active timetables
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 7-Day Consistency Bars & Chapter Status Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Study Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <span>Daily Study Time Consistency (Past 7 Days)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily goal: 4.5 hours • Daily average: {(totalMinutesPastWeek / 7 / 60).toFixed(1)} hrs
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              100% Target Met
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6">
            {progress.map((p, idx) => {
              const d = new Date(p.date);
              const dayLabel = isNaN(d.getTime())
                ? `Day ${idx + 1}`
                : d.toLocaleDateString("en-US", { weekday: "short" });
              const hrs = (p.total_minutes_studied / 60).toFixed(1);
              const pct = Math.min(100, Math.round((p.total_minutes_studied / 360) * 100));

              return (
                <div key={p.id} className="flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {hrs}h
                  </span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl h-36 flex items-end p-1.5">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-indigo-600 via-purple-600 to-indigo-500 transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${Math.max(12, pct)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Chapter Status Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <BookOpen className="h-4 w-4 text-purple-500" />
            <span>Chapter Completion</span>
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  {completedChapters} Chapters ({overallCompletionRate}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${overallCompletionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> In Progress
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  {inProgressChapters} Chapters
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${
                      totalChapters > 0
                        ? Math.round((inProgressChapters / totalChapters) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
                </span>
                <span className="text-slate-800 dark:text-slate-200">{pendingChapters} Chapters</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${
                      totalChapters > 0 ? Math.round((pendingChapters / totalChapters) * 100) : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 p-3.5 text-xs text-indigo-900 dark:text-indigo-200">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Spaced Repetition Status
            </p>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
              {masteredChapters} chapters fully mastered, {revisedOnceChapters} revised once.
            </p>
          </div>
        </div>
      </div>

      {/* Subject-Wise Mastery Progress */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
          Subject-Wise Syllabus Coverage
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => {
            const subChaps = chapters.filter((c) => c.subject_id === sub.id);
            const done = subChaps.filter((c) => c.status === "completed").length;
            const pct = subChaps.length > 0 ? Math.round((done / subChaps.length) * 100) : 0;

            return (
              <div
                key={sub.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || "#6366f1" }}
                    />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {sub.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {pct}%
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: sub.color || "#6366f1",
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{done} of {subChaps.length} Chapters Complete</span>
                  <span>{subChaps.filter((c) => c.difficulty === "hard").length} Hard Modules</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Academic Milestone Badges */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          <span>Academic Milestones & Badges</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              title: "7-Day Consistency",
              desc: "Studied consecutive 7 days without missing a slot",
              status: "Unlocked ★",
              color: "text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
            },
            {
              title: "Algorithms Ace",
              desc: "Completed 4 Graph & DP chapter problem sets",
              status: "Unlocked ★",
              color: "text-indigo-500 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900",
            },
            {
              title: "Spaced Revisionist",
              desc: "Completed 3 spaced review milestones",
              status: "Unlocked ★",
              color: "text-purple-500 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900",
            },
            {
              title: "Exam Ready",
              desc: "Achieve 90% syllabus completion on all subjects",
              status: "In Progress (68%)",
              color: "text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700",
            },
          ].map((badge) => (
            <div
              key={badge.title}
              className={`rounded-2xl border p-4 text-center flex flex-col items-center justify-between ${badge.color}`}
            >
              <Award className="h-8 w-8 mb-2" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">{badge.title}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {badge.desc}
              </p>
              <span className="mt-2.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-white/80 dark:bg-slate-900/80 shadow-xs">
                {badge.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
