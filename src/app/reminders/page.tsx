"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Check,
  Trash2,
  Filter,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { Reminder, ReminderType } from "@/types/database";
import { formatTime, formatDate } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Reminder Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<ReminderType>("study_session");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    setReminders(StorageRepository.getReminders(user?.id));

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    // Set default newDate to today and newTime to 1 hour ahead
    const now = new Date();
    setNewDate(now.toISOString().split("T")[0]);
    const futureH = (now.getHours() + 1) % 24;
    setNewTime(`${futureH.toString().padStart(2, "0")}:00`);
  }, [user?.id]);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          new Notification("StudyMate AI Reminders Activated! 🎓", {
            body: "You will now receive timely study session and revision alerts.",
            icon: "/favicon.ico",
          });
        }
      } catch (err) {
        console.error("Notification permission error", err);
      }
    }
  };

  const testTriggerNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("⏰ Study Alert: Algorithms Practice", {
          body: "Your session on Graph Traversals begins in 15 minutes.",
          icon: "/favicon.ico",
        });
      } else {
        requestNotificationPermission();
      }
    }
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        const next = !r.is_completed;
        if (next) {
          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.7 },
            });
          } catch {
            // ignore
          }
        }
        return { ...r, is_completed: next };
      }
      return r;
    });
    setReminders(updated);
    StorageRepository.setReminders(updated, user?.id);
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    StorageRepository.setReminders(updated, user?.id);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const reminderDateTime = new Date(`${newDate}T${newTime}:00`);

    const item: Reminder = {
      id: `rem_${user?.id || "guest"}_${Date.now()}`,
      student_id: user?.id || "guest",
      title: newTitle,
      description: newDesc,
      reminder_time: reminderDateTime.toISOString(),
      reminder_type: newType,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    const updated = [item, ...reminders];
    setReminders(updated);
    StorageRepository.setReminders(updated, user?.id);

    setShowAddModal(false);
    setNewTitle("");
    setNewDesc("");

    try {
      confetti({ particleCount: 30, spread: 50 });
    } catch {
      // ignore
    }
  };

  // Filter reminders
  const filtered = reminders.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return !r.is_completed;
    if (activeFilter === "completed") return r.is_completed;
    return r.reminder_type === activeFilter;
  });

  const pendingCount = reminders.filter((r) => !r.is_completed).length;
  const completedCount = reminders.filter((r) => r.is_completed).length;

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BellRing className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Smart Reminder System
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated alerts for study sessions, chapter milestones, spaced repetition revision, and exam countdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notificationPermission !== "granted" ? (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 transition"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Enable Browser Alerts</span>
            </button>
          ) : (
            <button
              onClick={testTriggerNotification}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Test Notification</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-purple-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Reminder</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400">Total Reminders</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {reminders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-amber-500 font-medium">Pending Action</span>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-emerald-500 font-medium">Completed</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {completedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-rose-500 font-medium">Exam Countdowns</span>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {reminders.filter((r) => r.reminder_type === "exam_countdown").length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <Filter className="h-4 w-4 text-slate-400 mr-1" />
        {[
          { id: "all", label: "All Reminders" },
          { id: "pending", label: "Pending" },
          { id: "completed", label: "Completed" },
          { id: "study_session", label: "Study Sessions" },
          { id: "revision", label: "Revision Checkpoints" },
          { id: "exam_countdown", label: "Exam Countdowns" },
          { id: "custom", label: "Custom" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeFilter === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              No reminders found for this filter
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;New Reminder&quot; above to schedule an alert.
            </p>
          </div>
        ) : (
          filtered.map((rem) => {
            const isDone = rem.is_completed;
            const remDate = new Date(rem.reminder_time);
            const isExam = rem.reminder_type === "exam_countdown";
            const isRev = rem.reminder_type === "revision";

            return (
              <div
                key={rem.id}
                className={`group rounded-2xl border p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? "border-slate-200 bg-slate-50/70 opacity-60 dark:border-slate-800 dark:bg-slate-900/40"
                    : "border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleReminder(rem.id)}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                      isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 hover:border-indigo-500 bg-white dark:border-slate-600 dark:bg-slate-800"
                    }`}
                  >
                    {isDone && <Check className="h-4 w-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                          isExam
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : isRev
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        }`}
                      >
                        {rem.reminder_type.replace("_", " ")}
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-bold mt-1 truncate ${
                        isDone
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {rem.title}
                    </h3>
                    {rem.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {rem.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right text-xs text-slate-400">
                    <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{formatTime(remDate.toTimeString().slice(0, 5))}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(rem.reminder_time)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteReminder(rem.id)}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-500" />
              <span>Create New Study Reminder</span>
            </h3>

            <form onSubmit={handleAddReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Graph Algorithms Practice Session"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Study Goal (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Solve 3 Dijkstra graph problems and review heap min-weights."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reminder Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ReminderType)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="study_session">Study Session</option>
                  <option value="revision">Revision Checkpoint</option>
                  <option value="chapter_deadline">Chapter Completion Deadline</option>
                  <option value="exam_countdown">Exam Countdown</option>
                  <option value="custom">Custom Task</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow"
                >
                  Schedule Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
