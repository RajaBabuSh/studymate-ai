"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { Subject, Chapter, ChapterStatus, StudyStatus } from "@/types/database";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Circle,
  Search,
  Check,
  X,
} from "lucide-react";

export default function MySubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Modals state
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);

  // Subject Form State
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectColor, setSubjectColor] = useState("#6366f1");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Chapter Form State
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterHours, setChapterHours] = useState(2.5);

  // Inline Chapter Editing State
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState("");

  // Search filter
  const [chapterSearch, setChapterSearch] = useState("");

  const loadData = useCallback(() => {
    const userId = user?.id;
    const subs = StorageRepository.getSubjects(userId);
    const chaps = StorageRepository.getChapters(userId);
    setSubjects(subs);
    setChapters(chaps);

    if (subs.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subs[0].id);
    }
  }, [user?.id, selectedSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;

  // Filtered chapters for the active subject
  const activeSubjectChapters = chapters.filter(
    (c) =>
      c.subject_id === activeSubject?.id &&
      (chapterSearch ? c.title.toLowerCase().includes(chapterSearch.toLowerCase()) : true)
  );

  // ---------------------------------------------------------------------------
  // SUBJECT ACTIONS
  // ---------------------------------------------------------------------------
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      student_id: user?.id || "student-active",
      name: subjectName.trim(),
      code: subjectCode.trim() || undefined,
      color: subjectColor,
      total_chapters: 0,
      completed_chapters: 0,
      created_at: new Date().toISOString(),
    };

    const updated = [...subjects, newSubject];
    setSubjects(updated);
    StorageRepository.setSubjects(updated, user?.id);
    setSelectedSubjectId(newSubject.id);

    setSubjectName("");
    setSubjectCode("");
    setShowAddSubjectModal(false);
  };

  const handleEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !subjectName.trim()) return;

    const updated = subjects.map((s) => {
      if (s.id === editingSubject.id) {
        return {
          ...s,
          name: subjectName.trim(),
          code: subjectCode.trim() || undefined,
          color: subjectColor,
        };
      }
      return s;
    });

    setSubjects(updated);
    StorageRepository.setSubjects(updated, user?.id);
    setShowEditSubjectModal(false);
    setEditingSubject(null);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (!confirm("Are you sure you want to remove this subject and all its chapters?")) return;

    const updatedSubs = subjects.filter((s) => s.id !== subjectId);
    const updatedChaps = chapters.filter((c) => c.subject_id !== subjectId);

    setSubjects(updatedSubs);
    setChapters(updatedChaps);
    StorageRepository.setSubjects(updatedSubs, user?.id);
    StorageRepository.setChapters(updatedChaps, user?.id);

    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(updatedSubs[0]?.id || null);
    }
  };

  // ---------------------------------------------------------------------------
  // CHAPTER ACTIONS
  // ---------------------------------------------------------------------------
  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject || !chapterTitle.trim()) return;

    const newChapter: Chapter = {
      id: `chap-${Date.now()}`,
      subject_id: activeSubject.id,
      student_id: user?.id || "student-active",
      title: chapterTitle.trim(),
      chapter_number: chapters.filter((c) => c.subject_id === activeSubject.id).length + 1,
      estimated_hours: chapterHours,
      difficulty: "medium",
      status: "pending",
      study_status: "not_started",
      revision_status: "not_started",
      notes_count: 0,
      created_at: new Date().toISOString(),
    };

    const updatedChaps = [...chapters, newChapter];
    setChapters(updatedChaps);
    StorageRepository.setChapters(updatedChaps, user?.id);

    // Update subject total chapters count
    const updatedSubs = subjects.map((s) => {
      if (s.id === activeSubject.id) {
        return { ...s, total_chapters: s.total_chapters + 1 };
      }
      return s;
    });
    setSubjects(updatedSubs);
    StorageRepository.setSubjects(updatedSubs, user?.id);

    setChapterTitle("");
    setShowAddChapterModal(false);
  };

  const handleToggleChapterStatus = (chapterId: string) => {
    const updatedChaps: Chapter[] = chapters.map((c) => {
      if (c.id === chapterId) {
        const isDone = c.study_status === "completed" || c.status === "completed";
        const newStatus: ChapterStatus = isDone ? "pending" : "completed";
        const newStudyStatus: StudyStatus = isDone ? "not_started" : "completed";
        return {
          ...c,
          status: newStatus,
          study_status: newStudyStatus,
          study_completed_at: !isDone ? new Date().toISOString() : undefined,
        };
      }
      return c;
    });

    setChapters(updatedChaps);
    StorageRepository.setChapters(updatedChaps, user?.id);

    // Sync subject completed chapters count
    if (activeSubject) {
      const subCompleted = updatedChaps.filter(
        (c) => c.subject_id === activeSubject.id && (c.study_status === "completed" || c.status === "completed")
      ).length;
      const updatedSubs = subjects.map((s) => {
        if (s.id === activeSubject.id) {
          return { ...s, completed_chapters: subCompleted };
        }
        return s;
      });
      setSubjects(updatedSubs);
      StorageRepository.setSubjects(updatedSubs, user?.id);
    }
  };

  const handleSaveChapterTitle = (chapterId: string) => {
    if (!editingChapterTitle.trim()) return;

    const updated = chapters.map((c) => {
      if (c.id === chapterId) {
        return { ...c, title: editingChapterTitle.trim() };
      }
      return c;
    });

    setChapters(updated);
    StorageRepository.setChapters(updated, user?.id);
    setEditingChapterId(null);
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;

    const updatedChaps = chapters.filter((c) => c.id !== chapterId);
    setChapters(updatedChaps);
    StorageRepository.setChapters(updatedChaps, user?.id);

    if (activeSubject) {
      const subTotal = updatedChaps.filter((c) => c.subject_id === activeSubject.id).length;
      const subCompleted = updatedChaps.filter(
        (c) => c.subject_id === activeSubject.id && (c.study_status === "completed" || c.status === "completed")
      ).length;

      const updatedSubs = subjects.map((s) => {
        if (s.id === activeSubject.id) {
          return { ...s, total_chapters: subTotal, completed_chapters: subCompleted };
        }
        return s;
      });
      setSubjects(updatedSubs);
      StorageRepository.setSubjects(updatedSubs, user?.id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & ADD SUBJECT BUTTON                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              <span>My Subjects</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add subjects, organize chapters, and track your study completion.
            </p>
          </div>

          <button
            onClick={() => {
              setSubjectName("");
              setSubjectCode("");
              setSubjectColor("#6366f1");
              setShowAddSubjectModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Subject</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBJECT TABS BAR                                              */}
      {/* ------------------------------------------------------------- */}
      {subjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">No subjects added yet</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click the button above to add your first subject and start organizing your study syllabus.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {subjects.map((sub) => {
            const isSelected = sub.id === activeSubject?.id;
            const subChaps = chapters.filter((c) => c.subject_id === sub.id);
            const doneCount = subChaps.filter(
              (c) => c.study_status === "completed" || c.status === "completed"
            ).length;
            const pct = subChaps.length > 0 ? Math.round((doneCount / subChaps.length) * 100) : 0;

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/70"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color || "#6366f1" }}
                  />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {doneCount} / {subChaps.length} ch
                  </span>
                </div>

                <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {sub.name}
                </h3>
                {sub.code && (
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-mono">
                    {sub.code}
                  </p>
                )}

                <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ACTIVE SUBJECT CHAPTER MANAGEMENT                             */}
      {/* ------------------------------------------------------------- */}
      {activeSubject && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          {/* Active Subject Details & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: activeSubject.color || "#6366f1" }}
                />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeSubject.name}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeSubjectChapters.length} chapter(s) •{" "}
                {
                  activeSubjectChapters.filter(
                    (c) => c.study_status === "completed" || c.status === "completed"
                  ).length
                }{" "}
                completed
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingSubject(activeSubject);
                  setSubjectName(activeSubject.name);
                  setSubjectCode(activeSubject.code || "");
                  setSubjectColor(activeSubject.color || "#6366f1");
                  setShowEditSubjectModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Subject</span>
              </button>

              <button
                onClick={() => handleDeleteSubject(activeSubject.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => {
                  setChapterTitle("");
                  setShowAddChapterModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Chapter</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Chapters List */}
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {activeSubjectChapters.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No chapters found. Click &quot;Add Chapter&quot; to add one to this subject.
              </div>
            ) : (
              activeSubjectChapters.map((chap, index) => {
                const isCompleted = chap.study_status === "completed" || chap.status === "completed";
                const isEditing = editingChapterId === chap.id;

                return (
                  <div
                    key={chap.id}
                    className="flex items-center justify-between py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-3 rounded-xl transition-colors gap-3"
                  >
                    {/* Chapter status toggle and title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleChapterStatus(chap.id)}
                        className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                          isCompleted
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800"
                        }`}
                        title={isCompleted ? "Mark Pending" : "Mark Completed"}
                      >
                        {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 opacity-0" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingChapterTitle}
                              onChange={(e) => setEditingChapterTitle(e.target.value)}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white flex-1"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveChapterTitle(chap.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-500"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingChapterId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400 font-semibold">
                              {index + 1}.
                            </span>
                            <span
                              className={`text-xs font-medium truncate ${
                                isCompleted
                                  ? "line-through text-slate-400 dark:text-slate-500"
                                  : "text-slate-800 dark:text-slate-100"
                              }`}
                            >
                              {chap.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit Title & Delete */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingChapterId(chap.id);
                            setEditingChapterTitle(chap.title);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title="Rename Chapter"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chap.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete Chapter"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: ADD SUBJECT                                          */}
      {/* ------------------------------------------------------------- */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Subject</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter subject title and pick a display color.
            </p>

            <form onSubmit={handleAddSubject} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corporate Law"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. LAW-101"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSubjectColor(color)}
                        className={`h-6 w-6 rounded-full transition-transform ${
                          subjectColor === color ? "scale-125 ring-2 ring-indigo-500 ring-offset-2" : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: EDIT SUBJECT                                         */}
      {/* ------------------------------------------------------------- */}
      {showEditSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Subject</h3>

            <form onSubmit={handleEditSubject} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSubjectColor(color)}
                        className={`h-6 w-6 rounded-full transition-transform ${
                          subjectColor === color ? "scale-125 ring-2 ring-indigo-500 ring-offset-2" : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditSubjectModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: ADD CHAPTER                                          */}
      {/* ------------------------------------------------------------- */}
      {showAddChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add Chapter to {activeSubject?.name}
            </h3>

            <form onSubmit={handleAddChapter} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chapter Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1: Introduction to Contracts"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Study Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={chapterHours}
                  onChange={(e) => setChapterHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChapterModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Add Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
