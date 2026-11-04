"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminAppShell from "@/components/admin/AdminAppShell";
import { StorageRepository } from "@/lib/storage";
import { Chapter, Subject, ChapterNature, ExamImportance } from "@/types/database";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";

export default function AdminChaptersPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [nature, setNature] = useState<ChapterNature>("numerical");
  const [importance, setImportance] = useState<ExamImportance>("high");
  const [hours, setHours] = useState(4.0);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const subs = StorageRepository.getSubjects();
    setSubjects(subs);
    if (subs.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subs[0].id);
    }
    const chaps = StorageRepository.getChapters();
    setChapters(chaps);
  }, [selectedSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredChapters = chapters.filter(
    (c) => !selectedSubjectId || c.subject_id === selectedSubjectId
  );

  const handleUpdateNature = (chapterId: string, newNature: ChapterNature) => {
    const updated = chapters.map((c) =>
      c.id === chapterId ? { ...c, nature: newNature } : c
    );
    setChapters(updated);
    StorageRepository.setChapters(updated);
    StorageRepository.addAuditLog(
      "chapter_updated",
      `Chapter (${chapterId}) nature updated to: ${newNature}`,
      chapterId
    );
  };

  const handleUpdateImportance = (chapterId: string, newImp: ExamImportance) => {
    const updated = chapters.map((c) =>
      c.id === chapterId ? { ...c, exam_importance: newImp } : c
    );
    setChapters(updated);
    StorageRepository.setChapters(updated);
    StorageRepository.addAuditLog(
      "chapter_updated",
      `Chapter (${chapterId}) exam importance updated to: ${newImp}`,
      chapterId
    );
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedSubjectId) return;

    const newChap: Chapter = {
      id: `chap-${Date.now().toString(36)}`,
      subject_id: selectedSubjectId,
      student_id: "system-curriculum",
      title,
      chapter_number: filteredChapters.length + 1,
      difficulty: "medium",
      estimated_hours: Number(hours),
      status: "pending",
      revision_status: "not_started",
      notes_count: 0,
      nature,
      exam_importance: importance,
      created_at: new Date().toISOString(),
    };

    const updated = [...chapters, newChap];
    setChapters(updated);
    StorageRepository.setChapters(updated);
    StorageRepository.addAuditLog(
      "chapter_created",
      `Chapter added: "${title}" (${nature})`,
      newChap.id
    );

    setShowAddModal(false);
    setTitle("");
    setNotification(`Chapter "${title}" added to curriculum intelligence.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDelete = (id: string, chapTitle: string) => {
    if (confirm(`Remove chapter "${chapTitle}"?`)) {
      const updated = chapters.filter((c) => c.id !== id);
      setChapters(updated);
      StorageRepository.setChapters(updated);
      StorageRepository.addAuditLog("chapter_deleted", `Chapter removed: ${chapTitle}`, id);
      setNotification(`Chapter "${chapTitle}" removed.`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <AdminAppShell pageTitle="Chapter Intelligence & Nature Tuning">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Configure pedagogical nature, length, and exam weightage weights
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Numerical chapters are auto-scheduled in morning peak alert slots; theory chapters receive spaced recall
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Chapter</span>
          </button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Subject Tab Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-xs font-bold"
                    : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: sub.color || "#7c3aed" }}
                />
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chapters Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Chapter Title</th>
                  <th className="px-6 py-4">Pedagogical Nature</th>
                  <th className="px-6 py-4">Exam Weighting</th>
                  <th className="px-6 py-4">Study Hours</th>
                  <th className="px-6 py-4">Circadian Slot</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChapters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No chapters found for selected subject. Click &quot;Add Chapter&quot; above to create one.
                    </td>
                  </tr>
                ) : (
                  filteredChapters.map((chap, idx) => {
                    const nat = chap.nature || "numerical";
                    const isMorning = nat === "numerical" || nat === "practical";

                    return (
                      <tr key={chap.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-xs">{chap.title}</p>
                          <span className="text-[10px] text-slate-400">
                            Difficulty: {chap.difficulty}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={nat}
                            onChange={(e) =>
                              handleUpdateNature(chap.id, e.target.value as ChapterNature)
                            }
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-800 focus:bg-white focus:outline-none"
                          >
                            <option value="numerical">Numerical Practice</option>
                            <option value="theory">Theory & Concepts</option>
                            <option value="practical">Practical Application</option>
                            <option value="mixed">Mixed Hybrid</option>
                          </select>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={chap.exam_importance || "high"}
                            onChange={(e) =>
                              handleUpdateImportance(chap.id, e.target.value as ExamImportance)
                            }
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-800 focus:bg-white focus:outline-none"
                          >
                            <option value="high">High Weightage (Priority 1)</option>
                            <option value="medium">Medium Weightage (Priority 2)</option>
                            <option value="normal">Normal / Foundation</option>
                          </select>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-slate-800 font-semibold">{chap.estimated_hours} hrs</span>
                        </td>

                        <td className="px-6 py-4">
                          {isMorning ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                              <Sun className="h-3 w-3 text-amber-600" />
                              Morning Alert Peak
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-200">
                              <Moon className="h-3 w-3 text-blue-600" />
                              Afternoon / Evening
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(chap.id, chap.title)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Remove chapter"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Chapter Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Add Curriculum Chapter</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddChapter} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.course})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chapter Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schedule III Financial Statements Analysis"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pedagogical Nature</label>
                    <select
                      value={nature}
                      onChange={(e) => setNature(e.target.value as ChapterNature)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none"
                    >
                      <option value="numerical">Numerical Practice</option>
                      <option value="theory">Theory & Concepts</option>
                      <option value="practical">Practical Application</option>
                      <option value="mixed">Mixed Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Exam Weightage</label>
                    <select
                      value={importance}
                      onChange={(e) => setImportance(e.target.value as ExamImportance)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none"
                    >
                      <option value="high">High Weightage</option>
                      <option value="medium">Medium Weightage</option>
                      <option value="normal">Normal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recommended Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="20"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-500 transition shadow-xs"
                  >
                    Save Chapter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminAppShell>
  );
}
