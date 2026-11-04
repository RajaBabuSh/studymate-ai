"use client";

import React, { useState, useEffect } from "react";
import AdminAppShell from "@/components/admin/AdminAppShell";
import { StorageRepository } from "@/lib/storage";
import { CourseCatalogItem } from "@/types/database";
import {
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("Professional");
  const [totalSubjects, setTotalSubjects] = useState(6);
  const [description, setDescription] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const loadCourses = () => {
    setCourses(StorageRepository.getCoursesCatalog());
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newCourse: CourseCatalogItem = {
      id: `course-${code.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`,
      name,
      code,
      category,
      total_subjects: Number(totalSubjects),
      is_active: true,
      description,
    };

    StorageRepository.saveCourseCatalogItem(newCourse);
    loadCourses();
    setShowAddModal(false);
    setName("");
    setCode("");
    setDescription("");
    setNotification(`Course "${name}" added to curriculum catalog.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleActive = (course: CourseCatalogItem) => {
    const updated = { ...course, is_active: !course.is_active };
    StorageRepository.saveCourseCatalogItem(updated);
    loadCourses();
  };

  const handleDelete = (id: string, courseName: string) => {
    if (confirm(`Are you sure you want to remove "${courseName}" from the curriculum catalog?`)) {
      StorageRepository.deleteCourseCatalogItem(id);
      loadCourses();
      setNotification(`Course "${courseName}" removed.`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <AdminAppShell pageTitle="Curriculum Courses Catalog">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">
              Manage supported qualification levels and degree curricula
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Available to students during registration onboarding and timetable generation
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Course</span>
          </button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`rounded-2xl border p-5 transition-all ${
                course.is_active
                  ? "border-slate-800 bg-[#0b0f19] hover:border-slate-700"
                  : "border-slate-800/50 bg-[#0b0f19]/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{course.name}</h3>
                    <span className="font-mono text-[11px] text-violet-400">{course.code}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(course)}
                  className="text-slate-400 hover:text-white transition"
                  title={course.is_active ? "Deactivate course" : "Activate course"}
                >
                  {course.is_active ? (
                    <ToggleRight className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-slate-600" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {course.description || "Official curriculum syllabus mapping with full chapter intelligence."}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  {course.category}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">
                    <strong>{course.total_subjects}</strong> Subjects
                  </span>
                  <button
                    onClick={() => handleDelete(course.id, course.name)}
                    className="text-slate-500 hover:text-rose-400 transition"
                    title="Delete course"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Course Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b0f19] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white">Add Curriculum Course</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCourse} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CMA Intermediate"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Code / Abbr</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CMA-INT"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Total Subjects</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={totalSubjects}
                      onChange={(e) => setTotalSubjects(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Academic Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="Professional">Professional (CA, CS, CMA)</option>
                    <option value="Undergraduate">Undergraduate (B.Com, BBA, BCA, BA)</option>
                    <option value="Postgraduate">Postgraduate (M.Com, MBA, MCA)</option>
                    <option value="School">School (Class 9 - 12)</option>
                    <option value="Competitive">Competitive Examinations</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Curriculum Notes / Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the examination pattern..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-violet-500 focus:outline-none resize-none"
                  />
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
                    Save Course
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
