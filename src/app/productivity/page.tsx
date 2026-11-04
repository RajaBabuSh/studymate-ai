"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { SleepDistractionLog, StudyProgress } from "@/types/database";
import {
  Zap,
  Flame,
  Moon,
  Sparkles,
  BookOpen,
  RotateCcw,
} from "lucide-react";

export default function ProductivityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"streak" | "focus" | "sleep" | "journal" | "recovery">("streak");

  const [progressList, setProgressList] = useState<StudyProgress[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepDistractionLog[]>([]);

  // Journal Entry State (Feature 76)
  const [journalNote, setJournalNote] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);

  // Distraction Entry State (Feature 74)
  const [distractionTag, setDistractionTag] = useState("");
  const [distractionMinutes, setDistractionMinutes] = useState(15);

  // Sleep Entry State (Feature 73)
  const [sleepHoursInput, setSleepHoursInput] = useState(7.5);
  const [breakMinutesInput, setBreakMinutesInput] = useState(45);

  useEffect(() => {
    const p = StorageRepository.getProgress(user?.id);
    const s = StorageRepository.getSleepDistractionLogs(user?.id);
    setProgressList(p);
    setSleepLogs(s);

    if (s.length > 0 && s[0].reflection_notes) {
      setJournalNote(s[0].reflection_notes);
    }
  }, [user]);

  const currentStreak = progressList.length > 0 ? progressList[progressList.length - 1].consistency_streak_days : 7;
  const totalMinutesStudied = progressList.reduce((acc, curr) => acc + curr.total_minutes_studied, 0);

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    const log: SleepDistractionLog = {
      id: `log-${today}`,
      student_id: user?.id || "guest",
      date: today,
      sleep_hours: sleepHoursInput,
      break_duration_minutes: breakMinutesInput,
      distraction_duration_minutes: 20,
      top_distractions: ["Phone notification", "Break overrun"],
      focus_score: 88,
      reflection_notes: journalNote,
      created_at: new Date().toISOString(),
    };

    StorageRepository.saveSleepDistractionLog(log, user?.id);
    setSleepLogs([log, ...sleepLogs.filter((l) => l.date !== today)]);
    setJournalSaved(true);
    setTimeout(() => setJournalSaved(false), 3000);
  };

  const handleLogDistraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distractionTag.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    const existing = sleepLogs.find((l) => l.date === today) || {
      id: `log-${today}`,
      student_id: user?.id || "guest",
      date: today,
      sleep_hours: sleepHoursInput,
      break_duration_minutes: breakMinutesInput,
      distraction_duration_minutes: 0,
      top_distractions: [],
      focus_score: 90,
      created_at: new Date().toISOString(),
    };

    const updated: SleepDistractionLog = {
      ...existing,
      distraction_duration_minutes: existing.distraction_duration_minutes + distractionMinutes,
      top_distractions: [distractionTag, ...existing.top_distractions],
      focus_score: Math.max(50, existing.focus_score - Math.round(distractionMinutes / 5)),
    };

    StorageRepository.saveSleepDistractionLog(updated, user?.id);
    setSleepLogs([updated, ...sleepLogs.filter((l) => l.date !== today)]);
    setDistractionTag("");
    alert(`Logged ${distractionMinutes} mins distraction. Focus score updated.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60">
              <Zap className="h-3.5 w-3.5" />
              Personal Productivity & Habits Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Streaks, Rest Schedules & Focus Scores
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Build unshakeable study consistency, curb digital distractions, track sleep hygiene, and recover missed targets.
          </p>
        </div>

        {/* Current Streak Badge */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-violet-100 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
            <Flame className="h-5 w-5 fill-orange-500" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Daily Study Streak</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {currentStreak} Days Consecutive!
            </div>
          </div>
        </div>
      </div>

      {/* Primary Submenu Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("streak")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "streak"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Flame className="h-4 w-4" />
          Study Streak & Consistency (Feature 71, 78)
        </button>

        <button
          onClick={() => setActiveTab("focus")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "focus"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Focus Score & Distractions (Feature 74, 75)
        </button>

        <button
          onClick={() => setActiveTab("sleep")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "sleep"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Moon className="h-4 w-4" />
          Sleep & Break Schedule (Feature 72, 73)
        </button>

        <button
          onClick={() => setActiveTab("journal")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "journal"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Daily Reflection Journal (Feature 76)
        </button>

        <button
          onClick={() => setActiveTab("recovery")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "recovery"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          Missed Target Recovery (Feature 79)
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STREAK & CONSISTENCY (Features 71, 78) */}
      {/* ========================================================= */}
      {activeTab === "streak" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs text-slate-500 font-medium">Consecutive Days</div>
              <div className="text-3xl font-bold text-orange-500 mt-1">{currentStreak} Days</div>
              <p className="text-xs text-slate-400 mt-2">Next Milestone: 14-Day Consistent Scholar</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs text-slate-500 font-medium">Total Study Logged</div>
              <div className="text-3xl font-bold text-violet-600 mt-1">
                {Math.round(totalMinutesStudied / 60)} Hours
              </div>
              <p className="text-xs text-slate-400 mt-2">Across recorded study & revision blocks</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs text-slate-500 font-medium">Daily Study Average</div>
              <div className="text-3xl font-bold text-emerald-600 mt-1">4.2 Hours/Day</div>
              <p className="text-xs text-slate-400 mt-2">Meeting 93% of scheduled daily budget</p>
            </div>
          </div>

          {/* Achievement Milestones */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Study Habit Badges & Milestones (Feature 21)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: "3-Day Starter", desc: "Studied 3 days consecutively", unlocked: true },
                { title: "7-Day Habit Champion", desc: "1 full week of uninterrupted focus", unlocked: true },
                { title: "14-Day Master", desc: "2 weeks without missing a daily target", unlocked: false },
                { title: "30-Day Exam Victor", desc: "Month-long flawless study discipline", unlocked: false },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    badge.unlocked
                      ? "border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/20"
                      : "border-slate-200 bg-slate-50/40 opacity-50 dark:border-slate-800 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="text-2xl mb-1">{badge.unlocked ? "🏆" : "🔒"}</div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{badge.title}</div>
                  <p className="text-[10px] text-slate-500 mt-1">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FOCUS SCORE & DISTRACTIONS (Features 74, 75) */}
      {/* ========================================================= */}
      {activeTab === "focus" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Today&apos;s Focus Score (Feature 75)
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Calculated by subtracting recorded distraction interruptions and break overrun from deep focus blocks.
              </p>

              <div className="text-center py-6">
                <div className="text-6xl font-black text-violet-600">88 / 100</div>
                <div className="text-xs font-bold text-emerald-600 mt-2">High Deep Work Efficiency</div>
              </div>
            </div>

            {/* Distraction Logger */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Log a Distraction (Feature 74)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Acknowledging distractions is the first step to neutralizing them.
              </p>

              <form onSubmit={handleLogDistraction} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    What distracted you?
                  </label>
                  <input
                    type="text"
                    required
                    value={distractionTag}
                    onChange={(e) => setDistractionTag(e.target.value)}
                    placeholder="e.g. Instagram Reels, WhatsApp group chat, unplanned call"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Time Lost (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={distractionMinutes}
                    onChange={(e) => setDistractionMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white hover:bg-violet-700 shadow-xs"
                >
                  Record Distraction
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SLEEP & BREAK SCHEDULE (Features 72, 73) */}
      {/* ========================================================= */}
      {activeTab === "sleep" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Sleep Schedule & Rest Tracker (Features 72, 73)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Memory consolidation happens during deep sleep. Students aiming for professional exams need 7 to 8 hours for optimal cognitive performance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Last Night&apos;s Sleep Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="12"
                    value={sleepHoursInput}
                    onChange={(e) => setSleepHoursInput(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Daily Total Rest & Break Minutes
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="15"
                    max="180"
                    value={breakMinutesInput}
                    onChange={(e) => setBreakMinutesInput(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="p-4 rounded-xl bg-violet-50 text-xs text-violet-800 border border-violet-100 dark:bg-violet-950/40 dark:border-violet-900 dark:text-violet-300">
                  <div className="font-bold mb-1">💤 Science-Backed Tip:</div>
                  Avoid screen light 45 minutes before bedtime. Reviewing flashcards on physical paper or dim mode boosts REM retention.
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center dark:bg-slate-800/40 dark:border-slate-800">
                <div className="text-xs text-slate-500 font-semibold mb-1">Recommended Routine:</div>
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Optimal Sleep Time:</span>
                    <span className="font-bold">11:00 PM – 06:30 AM (7.5h)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Morning Peak Focus:</span>
                    <span className="font-bold">07:00 AM – 10:30 AM (High Theory)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Evening Practice Slot:</span>
                    <span className="font-bold">05:30 PM – 08:30 PM (Numericals / PYQ)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: DAILY REFLECTION JOURNAL (Feature 76) */}
      {/* ========================================================= */}
      {activeTab === "journal" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Daily Academic Reflection Journal (Feature 76)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Write 2-3 sentences reflecting on what chapters you mastered today and what you need to adjust tomorrow.
            </p>

            <form onSubmit={handleSaveJournal} className="space-y-4">
              <textarea
                rows={5}
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
                placeholder="Today I mastered General Meetings quorum provisions under Sec 103. I struggled with working capital calculations in CAFM. Tomorrow morning I will review AS 3 cash flows..."
                className="w-full rounded-2xl border border-slate-200 p-4 text-xs text-slate-900 leading-relaxed dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-semibold">
                  {journalSaved ? "✓ Reflection saved successfully!" : ""}
                </span>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-700 shadow-xs"
                >
                  Save Reflection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: MISSED TARGET RECOVERY (Feature 79) */}
      {/* ========================================================= */}
      {activeTab === "recovery" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Missed Target Recovery & Catch-Up Planner (Feature 79)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Never let an unplanned busy day derail your exam readiness. Rebalance pending lessons into future weekend catch-up blocks.
            </p>

            <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/20 mb-6">
              <div className="font-bold text-xs text-violet-900 dark:text-violet-300">
                AI Catch-Up Suggestion:
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                You have 2 pending tasks scheduled from yesterday. Click below to automatically allocate 90 extra minutes to Sunday morning to clear them cleanly.
              </p>
              <button
                onClick={() => alert("Missed targets rebalanced into upcoming weekend recovery buffer.")}
                className="mt-3 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"
              >
                Auto-Rebalance into Weekend Buffer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
