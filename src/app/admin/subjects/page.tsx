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
  const [selectedCourse, setSelectedCourse] = useState<string>("CA Intermediate");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState("#6366f1");
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
            <h2 className="text-sm font-semibold text-slate-300">
              Manage subject syllabi, official codes, and chapter divisions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mapped directly into the student timetable engine and chapter intelligence system
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Subject</span>
          </button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Course Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0b0f19] px-3.5 py-2 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5 text-violet-400" />
            <span>Select Course Syllabus:</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.name} className="bg-[#0b0f19] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-500">
            Showing {filteredSubjects.length} subjects in {selectedCourse}
          </span>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="rounded-2xl border border-slate-800 bg-[#0b0f19] p-5 hover:border-slate-700 transition-all shadow-md relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: sub.color || "#6366f1" }}
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold"
                    style={{ backgroundColor: `${sub.color || "#6366f1"}20`, color: sub.color || "#818cf8" }}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{sub.name}</h3>
                    <span className="font-mono text-[11px] text-slate-400">{sub.code || "PAPER"}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSubject(sub.id, sub.name)}
                  className="text-slate-500 hover:text-rose-400 transition"
                  title="Remove subject"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                  <span><strong>{sub.total_chapters}</strong> Chapters</span>
                </div>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  {sub.course || selectedCourse}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Subject Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b0f19] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white">Add Curriculum Subject</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Strategic Management & Business Ethics"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Paper Code</label>
                    <input
                      type="text"
                      placeholder="e.g. PAPER-5"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Total Chapters</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={40}
                      value={totalChapters}
                      onChange={(e) => setTotalChapters(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-12 rounded cursor-pointer border border-slate-700 bg-transparent"
                    />
                    <span className="font-mono text-slate-400 text-xs">{color}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-violet-600 px-5 py-2 font-bold text-white hover:bg-violet-500 transition"
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
