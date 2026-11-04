"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { Subject } from "@/types/database";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";

interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialChapter?: string;
}

export default function StudyTimerModal({
  isOpen,
  onClose,
  initialSubject = "",
  initialChapter = "",
}: StudyTimerModalProps) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [sessionTopic, setSessionTopic] = useState(initialChapter || "Deep Focus Session");

  // Timer Modes
  const [timerMode, setTimerMode] = useState<"pomodoro_25" | "pomodoro_50" | "custom" | "stopwatch">("pomodoro_25");
  const [customMinutes] = useState(45);
  const [isBreak, setIsBreak] = useState(false);

  // Time tracking
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [quietMode, setQuietMode] = useState(true); // Default to peaceful quiet mode
  const [isCompleted, setIsCompleted] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user?.id) {
      const subs = StorageRepository.getSubjects(user.id);
      setSubjects(subs);
      if (!selectedSubject && subs.length > 0) {
        setSelectedSubject(subs[0].name);
      }
    }
  }, [user?.id, selectedSubject]);

  // Mode changes
  const setMode = (mode: "pomodoro_25" | "pomodoro_50" | "custom" | "stopwatch") => {
    setTimerMode(mode);
    setIsActive(false);
    setIsBreak(false);
    setIsCompleted(false);

    if (mode === "pomodoro_25") {
      setTotalSeconds(25 * 60);
      setRemainingSeconds(25 * 60);
    } else if (mode === "pomodoro_50") {
      setTotalSeconds(50 * 60);
      setRemainingSeconds(50 * 60);
    } else if (mode === "custom") {
      setTotalSeconds(customMinutes * 60);
      setRemainingSeconds(customMinutes * 60);
    } else if (mode === "stopwatch") {
      setTotalSeconds(0);
      setRemainingSeconds(0);
    }
  };

  const handleSessionComplete = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);

    const minutesLearned = Math.round(totalSeconds / 60);
    if (!isBreak && minutesLearned > 0) {
      StorageRepository.recordTimerSession(
        minutesLearned,
        sessionTopic || "Focused Session",
        selectedSubject || "General Study",
        user?.id
      );

      try {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      } catch {
        // no-op
      }
    }
  }, [totalSeconds, isBreak, sessionTopic, selectedSubject, user?.id]);

  // Timer Tick
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (timerMode === "stopwatch") {
          setRemainingSeconds((prev) => prev + 1);
        } else {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(intervalRef.current as NodeJS.Timeout);
              handleSessionComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timerMode, handleSessionComplete]);

  const handleStopAndSave = () => {
    setIsActive(false);
    const elapsedSeconds = timerMode === "stopwatch" ? remainingSeconds : totalSeconds - remainingSeconds;
    const minutesLearned = Math.floor(elapsedSeconds / 60);

    if (!isBreak && minutesLearned >= 1) {
      StorageRepository.recordTimerSession(
        minutesLearned,
        sessionTopic || "Focused Session",
        selectedSubject || "General Study",
        user?.id
      );
    }
    onClose();
  };

  const handleReset = () => {
    setIsActive(false);
    setIsCompleted(false);
    if (timerMode === "pomodoro_25") setRemainingSeconds(25 * 60);
    else if (timerMode === "pomodoro_50") setRemainingSeconds(50 * 60);
    else if (timerMode === "custom") setRemainingSeconds(customMinutes * 60);
    else setRemainingSeconds(0);
  };

  const formatDisplayTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercentage =
    timerMode === "stopwatch"
      ? 100
      : Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Peaceful Study Timer</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Distraction-free learning environment</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuietMode(!quietMode)}
              title={quietMode ? "Quiet Mode (No audio/popups)" : "Standard Mode"}
              className={`p-1.5 rounded-lg border text-xs transition ${
                quietMode
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-slate-200 text-slate-500 dark:border-slate-800"
              }`}
            >
              {quietMode ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/60">
          <button
            onClick={() => setMode("pomodoro_25")}
            className={`rounded-xl py-1.5 text-xs font-semibold transition ${
              timerMode === "pomodoro_25"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            25m Focus
          </button>
          <button
            onClick={() => setMode("pomodoro_50")}
            className={`rounded-xl py-1.5 text-xs font-semibold transition ${
              timerMode === "pomodoro_50"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            50m Deep
          </button>
          <button
            onClick={() => setMode("custom")}
            className={`rounded-xl py-1.5 text-xs font-semibold transition ${
              timerMode === "custom"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => setMode("stopwatch")}
            className={`rounded-xl py-1.5 text-xs font-semibold transition ${
              timerMode === "stopwatch"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            Stopwatch
          </button>
        </div>

        {/* Circular Display */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-slate-100 bg-gradient-to-b from-indigo-50/50 to-purple-50/30 dark:border-slate-800 dark:from-indigo-950/20 dark:to-purple-950/10">
            <div className="text-center">
              <span className="font-mono text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {formatDisplayTime(remainingSeconds)}
              </span>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {isBreak
                  ? "Gentle Rest Interval"
                  : isActive
                  ? "Deep Concentration"
                  : isCompleted
                  ? "Completed!"
                  : "Ready to Begin"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {timerMode !== "stopwatch" && (
            <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Subject & Topic Selector */}
        <div className="space-y-2 mb-5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Session Goal</label>
              <input
                type="text"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                placeholder="e.g. Chapter 4 Numerical Drill"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all ${
              isActive
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25"
            }`}
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isActive ? "Pause Focus" : "Start Focus"}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleStopAndSave}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Finish & Log</span>
          </button>
        </div>

        {/* Quiet Mode Note */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {quietMode
              ? "Quiet Mode active: Completed study time will automatically sync to your progress stats."
              : "Standard Mode active."}
          </p>
        </div>
      </div>
    </div>
  );
}
