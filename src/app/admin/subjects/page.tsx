"use client";

import React, { useState, useEffect } from "react";
import AdminAppShell from "@/components/admin/AdminAppShell";
import { StorageRepository } from "@/lib/storage";
import { Subject, CourseCatalogItem } from "@/types/database";
import {
  BookOpen,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  Layers,
} from "lucide-react";

export default function AdminSubjectsPage() {
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("CS Executive");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState("#7c3aed");
  const [totalChapters, setTotalChapters] = useState(8);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    const catalog = StorageRepository.getCoursesCatalog();
    setCourses(catalog);
    const allSubs = StorageRepository.getSubjects();
    setSubjects(allSubs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubjects = subjects.filter(
    (s) => !selectedCourse || s.course === selectedCourse || !s.course
  );

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newSub: Subject = {
      id: `sub-${Date.now().toString(36)}`,
      student_id: "system-curriculum",
      course: selectedCourse,
      name,
      code: code || `PAPER-${subjects.length + 1}`,
      color,
      total_chapters: Number(totalChapters),
      completed_chapters: 0,
      created_at: new Date().toISOString(),
    };

    const updated = [newSub, ...subjects];
    StorageRepository.setSubjects(updated);
    StorageRepository.addAuditLog(
      "subject_created",
      `Subject added: ${name} (${code}) to ${selectedCourse}`,
      newSub.id
    );

    setSubjects(updated);
    setShowAddModal(false);
    setName("");
    setCode("");
    setNotification(`Subject "${name}" added to ${selectedCourse}.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteSubject = (id: string, subName: string) => {
    if (confirm(`Remove "${subName}" from the curriculum?`)) {
      const updated = subjects.filter((s) => s.id !== id);
      StorageRepository.setSubjects(updated);
      StorageRepository.addAuditLog("subject_deleted", `Removed subject: ${subName}`, id);
      setSubjects(updated);
      setNotification(`Subject "${subName}" removed.`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <AdminAppShell pageTitle="Curriculum Subjects Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Manage subject syllabi, official codes, and chapter divisions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mapped directly into the student timetable engine and chapter intelligence system
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Subject</span>
          </button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Course Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
            <Filter className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">Select Course:</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.name} className="dark:bg-slate-800">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing {filteredSubjects.length} subjects in {selectedCourse}
          </span>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-xs hover:shadow-sm relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: sub.color || "#7c3aed" }}
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 shadow-xs"
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{sub.name}</h3>
                    <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">{sub.code || "PAPER"}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSubject(sub.id, sub.name)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                  title="Remove subject"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span><strong className="text-slate-800 dark:text-slate-200">{sub.total_chapters}</strong> Chapters</span>
                </div>
                <span className="rounded-md bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                  {sub.course || selectedCourse}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Subject Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Curriculum Subject</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Strategic Management & Business Ethics"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Paper Code</label>
                    <input
                      type="text"
                      placeholder="e.g. PAPER-5"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Chapters</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={40}
                      value={totalChapters}
                      onChange={(e) => setTotalChapters(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-12 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                    />
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">{color}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-500 transition shadow-xs cursor-pointer"
                  >
                    Save Subject
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
