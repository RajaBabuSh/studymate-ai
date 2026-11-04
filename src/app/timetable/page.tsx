"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { Subject, Chapter, StudySession, SessionStatus } from "@/types/database";
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  BookOpen,
} from "lucide-react";

export default function TimetablePage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Selected date for viewing / adding sessions (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Modals state
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  // Add / Edit form state
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formChapterId, setFormChapterId] = useState("");
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState("09:00 AM");
  const [formDurationMinutes, setFormDurationMinutes] = useState(90);

  // Notification message
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const userId = user?.id;
    const subs = StorageRepository.getSubjects(userId);
    const chaps = StorageRepository.getChapters(userId);
    const sess = StorageRepository.getStudySessions(userId);

    setSubjects(subs);
    setChapters(chaps);
    setSessions(sess);

    if (subs.length > 0 && !formSubjectId) {
      setFormSubjectId(subs[0].id);
    }
  }, [user?.id, formSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Week calculation (Monday through Sunday)
  const currentWeekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const firstDay = curr.getDate() - (curr.getDay() === 0 ? 6 : curr.getDay() - 1); // Monday
    const week = [];

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(curr.setDate(firstDay + i));
      week.push(nextDay.toISOString().split("T")[0]);
    }
    return week;
  }, [selectedDate]);

  // Navigate weeks
  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Filter sessions for the active date
  const activeDateSessions = sessions.filter((s) => s.date === selectedDate);

  // Chapters available for selected subject in form
  const availableChapters = chapters.filter((c) => c.subject_id === formSubjectId);

  // ---------------------------------------------------------------------------
  // ADD & EDIT STUDY SESSIONS
  // ---------------------------------------------------------------------------
  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find((s) => s.id === formSubjectId);
    if (!sub) return;

    const chap = chapters.find((c) => c.id === formChapterId);
    const chapterTitle = chap?.title || "General Subject Revision";

    const newSession: StudySession = {
      id: `session-${Date.now()}`,
      student_id: user?.id || "student-active",
      timetable_id: "tt-active",
      subject_id: sub.id,
      subject_name: sub.name,
      subject_color: sub.color || "#6366f1",
      chapter_id: chap?.id || undefined,
      chapter_title: chapterTitle,
      date: formDate,
      start_time: formStartTime,
      end_time: calculateEndTime(formStartTime, formDurationMinutes),
      duration_minutes: formDurationMinutes,
      session_type: "study",
      status: "scheduled",
      created_at: new Date().toISOString(),
    };

    const updated = [...sessions, newSession];
    setSessions(updated);
    StorageRepository.setStudySessions(updated, user?.id);

    setShowAddSessionModal(false);
    setSelectedDate(formDate);
    setNotification("Study session scheduled successfully!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    const sub = subjects.find((s) => s.id === formSubjectId);
    const chap = chapters.find((c) => c.id === formChapterId);

    const updated = sessions.map((s) => {
      if (s.id === editingSession.id) {
        return {
          ...s,
          subject_id: sub?.id || s.subject_id,
          subject_name: sub?.name || s.subject_name,
          subject_color: sub?.color || s.subject_color,
          chapter_id: chap?.id || s.chapter_id,
          chapter_title: chap?.title || s.chapter_title,
          date: formDate,
          start_time: formStartTime,
          end_time: calculateEndTime(formStartTime, formDurationMinutes),
          duration_minutes: formDurationMinutes,
        };
      }
      return s;
    });

    setSessions(updated);
    StorageRepository.setStudySessions(updated, user?.id);

    setShowEditSessionModal(false);
    setEditingSession(null);
    setSelectedDate(formDate);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    StorageRepository.setStudySessions(updated, user?.id);
  };

  const handleToggleSessionStatus = (sessionId: string) => {
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        const nextStatus: SessionStatus = s.status === "completed" ? "scheduled" : "completed";
        return {
          ...s,
          status: nextStatus,
          completed_at: nextStatus === "completed" ? new Date().toISOString() : undefined,
        };
      }
      return s;
    });

    setSessions(updated);
    StorageRepository.setStudySessions(updated, user?.id);
  };

  // ---------------------------------------------------------------------------
  // SIMPLE AI SUGGESTION FEATURE (NON-INTRUSIVE)
  // ---------------------------------------------------------------------------
  const handleGenerateAiSuggestions = () => {
    if (subjects.length === 0) {
      alert("Please add at least one subject before generating suggestions.");
      return;
    }

    if (!confirm("Generate a balanced weekly study timetable suggestion for your subjects?")) {
      return;
    }

    const newGeneratedSessions: StudySession[] = [];
    const timeSlots = [
      { start: "08:30 AM", duration: 90 },
      { start: "06:00 PM", duration: 90 },
    ];

    currentWeekDays.forEach((dateStr, dayIdx) => {
      timeSlots.forEach((slot, slotIdx) => {
        // Pick rotating subject
        const subIdx = (dayIdx * 2 + slotIdx) % subjects.length;
        const sub = subjects[subIdx];

        // Pick uncompleted chapter or first chapter
        const subChaps = chapters.filter((c) => c.subject_id === sub.id);
        const pendingChap = subChaps.find((c) => c.study_status !== "completed") || subChaps[0];

        newGeneratedSessions.push({
          id: `session-ai-${dateStr}-${slotIdx}-${Date.now()}`,
          student_id: user?.id || "student-active",
          timetable_id: "tt-active",
          subject_id: sub.id,
          subject_name: sub.name,
          subject_color: sub.color || "#6366f1",
          chapter_id: pendingChap?.id,
          chapter_title: pendingChap?.title || `${sub.name} Core Review`,
          date: dateStr,
          start_time: slot.start,
          end_time: calculateEndTime(slot.start, slot.duration),
          duration_minutes: slot.duration,
          session_type: "study",
          status: "scheduled",
          created_at: new Date().toISOString(),
        });
      });
    });

    // Merge without wiping existing sessions on other weeks
    const existingOtherDates = sessions.filter((s) => !currentWeekDays.includes(s.date));
    const combined = [...existingOtherDates, ...newGeneratedSessions];

    setSessions(combined);
    StorageRepository.setStudySessions(combined, user?.id);

    setNotification("✨ AI study timetable suggestions added for this week! You can edit or adjust any session.");
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to calculate end time string
  function calculateEndTime(start: string, durationMin: number) {
    try {
      const parts = start.split(" ");
      const [hStr, mStr] = parts[0].split(":");
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const isPM = parts[1]?.toUpperCase() === "PM";

      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;

      const totalM = h * 60 + m + durationMin;
      let endH = Math.floor(totalM / 60) % 24;
      const endM = totalM % 60;
      const endPeriod = endH >= 12 ? "PM" : "AM";

      if (endH > 12) endH -= 12;
      if (endH === 0) endH = 12;

      return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")} ${endPeriod}`;
    } catch {
      return "10:30 AM";
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & ACTIONS                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-indigo-600" />
              <span>My Timetable</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Plan and customize your daily and weekly study hours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateAiSuggestions}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Suggestion</span>
            </button>

            <button
              onClick={() => {
                setFormDate(selectedDate);
                setFormStartTime("09:00 AM");
                setFormDurationMinutes(90);
                if (subjects.length > 0) setFormSubjectId(subjects[0].id);
                setShowAddSessionModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Study Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white shadow-md animate-fade-in flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-indigo-200 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* WEEK CALENDAR NAVIGATION BAR                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Today
            </button>
          </div>

          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {new Date(currentWeekDays[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
            {new Date(currentWeekDays[6]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Day Pills Bar */}
        <div className="grid grid-cols-7 gap-1.5">
          {currentWeekDays.map((dateStr) => {
            const d = new Date(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const daySessionCount = sessions.filter((s) => s.date === dateStr).length;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl border text-center transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                    : isToday
                    ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
                <span className="text-sm font-extrabold mt-0.5">{d.getDate()}</span>
                {daySessionCount > 0 && (
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-indigo-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SESSIONS LIST FOR ACTIVE DAY                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span>
                Schedule for{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeDateSessions.length} session(s) planned
            </p>
          </div>

          <button
            onClick={() => {
              setFormDate(selectedDate);
              setFormStartTime("09:00 AM");
              setFormDurationMinutes(90);
              if (subjects.length > 0) setFormSubjectId(subjects[0].id);
              setShowAddSessionModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Session</span>
          </button>
        </div>

        {activeDateSessions.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No sessions scheduled for this date
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a study session or use the &quot;AI Suggestion&quot; button to auto-populate your week.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDateSessions.map((s) => {
              const isDone = s.status === "completed";

              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isDone
                      ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 opacity-75"
                      : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700/80 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Toggle Done Button */}
                    <button
                      onClick={() => handleToggleSessionStatus(s.id)}
                      className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800"
                      }`}
                      title={isDone ? "Mark Pending" : "Mark Completed"}
                    >
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 opacity-0" />}
                    </button>

                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.subject_color || "#6366f1" }}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold truncate ${
                          isDone
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {s.chapter_title || s.title || "Study Session"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <BookOpen className="h-3 w-3" />
                        <span>{s.subject_name}</span>
                        <span>•</span>
                        <span>{s.duration_minutes} mins</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {s.start_time} - {s.end_time}
                    </span>

                    <button
                      onClick={() => {
                        setEditingSession(s);
                        setFormSubjectId(s.subject_id);
                        setFormChapterId(s.chapter_id || "");
                        setFormDate(s.date);
                        setFormStartTime(s.start_time);
                        setFormDurationMinutes(s.duration_minutes);
                        setShowEditSessionModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Edit Session"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: ADD SESSION                                          */}
      {/* ------------------------------------------------------------- */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Study Session</h3>

            <form onSubmit={handleAddSession} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={formSubjectId}
                  onChange={(e) => {
                    setFormSubjectId(e.target.value);
                    setFormChapterId("");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chapter (Optional)
                </label>
                <select
                  value={formChapterId}
                  onChange={(e) => setFormChapterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">General Subject Study / Revision</option>
                  {availableChapters.map((chap) => (
                    <option key={chap.id} value={chap.id}>
                      {chap.title}
                    </option>
                  ))}
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
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <select
                  value={formDurationMinutes}
                  onChange={(e) => setFormDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour (60 mins)</option>
                  <option value={90}>1.5 hours (90 mins)</option>
                  <option value={120}>2 hours (120 mins)</option>
                  <option value={180}>3 hours (180 mins)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: EDIT SESSION                                         */}
      {/* ------------------------------------------------------------- */}
      {showEditSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Study Session</h3>

            <form onSubmit={handleEditSession} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={formSubjectId}
                  onChange={(e) => {
                    setFormSubjectId(e.target.value);
                    setFormChapterId("");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chapter
                </label>
                <select
                  value={formChapterId}
                  onChange={(e) => setFormChapterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">General Subject Study / Revision</option>
                  {availableChapters.map((chap) => (
                    <option key={chap.id} value={chap.id}>
                      {chap.title}
                    </option>
                  ))}
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
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <select
                  value={formDurationMinutes}
                  onChange={(e) => setFormDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour (60 mins)</option>
                  <option value={90}>1.5 hours (90 mins)</option>
                  <option value={120}>2 hours (120 mins)</option>
                  <option value={180}>3 hours (180 mins)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditSessionModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Update Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
