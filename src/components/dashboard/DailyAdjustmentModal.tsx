"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { Subject, StudySession, DailyAdjustment } from "@/types/database";
import {
  Moon,
  CheckCircle2,
  Sparkles,
  X,
  ThumbsUp,
} from "lucide-react";
import confetti from "canvas-confetti";

interface DailyAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  todaySessions: StudySession[];
  subjects: Subject[];
}

export default function DailyAdjustmentModal({
  isOpen,
  onClose,
  todaySessions,
  subjects,
}: DailyAdjustmentModalProps) {
  const { user } = useAuth();

  const [completedIds, setCompletedIds] = useState<string[]>(
    todaySessions.filter((s) => s.status === "completed").map((s) => s.id)
  );
  const [missedTaskNotes, setMissedTaskNotes] = useState("");
  const [difficultChapter, setDifficultChapter] = useState(
    subjects.length > 0 ? subjects[0].name : "General"
  );
  const [needsExtraRevision, setNeedsExtraRevision] = useState(true);

  // Suggested Adjustments State
  const [generatedAdjustment, setGeneratedAdjustment] = useState<DailyAdjustment | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  if (!isOpen) return null;

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerateSuggestion = () => {
    const today = new Date().toISOString().split("T")[0];

    const completedSessionTitles = todaySessions
      .filter((s) => completedIds.includes(s.id))
      .map((s) => s.chapter_title);

    const missedSessionTitles = todaySessions
      .filter((s) => !completedIds.includes(s.id))
      .map((s) => s.chapter_title);

    const suggestions: DailyAdjustment["suggested_adjustments"] = [];

    // Missed tasks adjustment
    if (missedSessionTitles.length > 0) {
      suggestions.push({
        id: "sug-1",
        action: `Reschedule ${missedSessionTitles[0]} to Tomorrow Morning (Peak Alert Slot)`,
        reason: "Tackling carried-over material during your first 90-minute block prevents topic pile-up and stress.",
        recommended_time_slot: "08:30 AM - 10:00 AM",
      });
    }

    // Difficult chapter adjustment
    if (difficultChapter) {
      suggestions.push({
        id: "sug-2",
        action: `Insert 45m Foundation Re-visit for ${difficultChapter}`,
        reason: "Consolidate core principles with institution textbook illustrations before tackling advanced past-paper problems.",
        recommended_time_slot: "02:30 PM - 03:15 PM",
      });
    }

    // Extra revision adjustment
    if (needsExtraRevision) {
      suggestions.push({
        id: "sug-3",
        action: "Spaced Active Recall Session: 20 Flashcards & Formula Writing",
        reason: "Strengthens retrieval pathways according to spaced repetition learning principles.",
        recommended_time_slot: "07:30 PM - 08:00 PM",
      });
    }

    const adj: DailyAdjustment = {
      id: `adj-${Date.now()}`,
      student_id: user?.id || "guest",
      date: today,
      completed_tasks: completedSessionTitles,
      missed_tasks: missedSessionTitles,
      difficult_chapters: [difficultChapter],
      needs_extra_revision: needsExtraRevision,
      suggested_adjustments: suggestions,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    setGeneratedAdjustment(adj);
    StorageRepository.saveDailyAdjustment(adj, user?.id);
  };

  const handleApplyAdjustment = () => {
    if (generatedAdjustment) {
      StorageRepository.updateDailyAdjustmentStatus(generatedAdjustment.id, "applied", user?.id);
      setHasApplied(true);
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch {
        // no-op
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleKeepPlan = () => {
    if (generatedAdjustment) {
      StorageRepository.updateDailyAdjustmentStatus(generatedAdjustment.id, "kept_existing", user?.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Evening Reflection & Daily AI Adjustments
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Calibrate tomorrow&apos;s plan based on your actual progress today
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!generatedAdjustment ? (
          <div className="space-y-4 mt-4 text-xs">
            {/* Question 1: What did you complete? */}
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                1. What sessions did you complete today?
              </label>
              {todaySessions.length === 0 ? (
                <p className="text-slate-400 italic py-2">No fixed schedule for today. Mark self-study below.</p>
              ) : (
                <div className="space-y-1.5">
                  {todaySessions.map((s) => {
                    const isChecked = completedIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleCompleted(s.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`h-4 w-4 ${isChecked ? "text-emerald-600" : "text-slate-400"}`}
                          />
                          <span className="font-semibold">{s.chapter_title}</span>
                          <span className="text-[10px] text-slate-400">({s.subject_name})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{s.duration_minutes}m</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Question 2: What was missed or challenging? */}
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                2. What did you miss or struggle with? (Optional notes)
              </label>
              <textarea
                value={missedTaskNotes}
                onChange={(e) => setMissedTaskNotes(e.target.value)}
                placeholder="e.g. Could not finish 3 numerical questions in Standard Costing; got stuck on Overhead adjustments."
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Question 3: Which chapter was difficult? */}
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                3. Which subject or chapter felt most difficult today?
              </label>
              <select
                value={difficultChapter}
                onChange={(e) => setDifficultChapter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Question 4: Need extra revision? */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-indigo-50/40 dark:border-slate-800 dark:bg-indigo-950/20">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  4. Do you need extra revision before moving forward?
                </p>
                <p className="text-[11px] text-slate-500">
                  AI will insert spaced repetition recall blocks into tomorrow&apos;s plan
                </p>
              </div>
              <input
                type="checkbox"
                checked={needsExtraRevision}
                onChange={(e) => setNeedsExtraRevision(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                onClick={handleGenerateSuggestion}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>Analyze & Suggest Tomorrow&apos;s Plan</span>
              </button>
            </div>
          </div>
        ) : (
          /* Suggestion Display */
          <div className="space-y-4 mt-4 text-xs animate-slide-up">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3.5 dark:border-indigo-900 dark:bg-indigo-950/40">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                <Sparkles className="h-4 w-4" />
                <span>AI Teacher Recommended Adjustments for Tomorrow</span>
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                Calculated based on your completed topics and identified difficulty areas:
              </p>
            </div>

            <div className="space-y-2.5">
              {generatedAdjustment.suggested_adjustments.map((sug) => (
                <div
                  key={sug.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sug.action}</span>
                    <span className="rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 font-mono text-[10px]">
                      {sug.recommended_time_slot}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{sug.reason}</p>
                </div>
              ))}
            </div>

            {hasApplied ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Adjustments successfully scheduled for tomorrow!</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleKeepPlan}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Keep My Existing Plan
                </button>

                <button
                  onClick={handleApplyAdjustment}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Apply AI Adjustments</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
