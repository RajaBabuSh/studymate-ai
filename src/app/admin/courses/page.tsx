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
            <h2 className="text-sm font-bold text-slate-900">
              Manage supported qualification levels and degree curricula
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Available to students during registration onboarding and personalized timetable generation
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Course</span>
          </button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
                  ? "border-slate-200/80 bg-white hover:border-purple-200 shadow-xs hover:shadow-sm"
                  : "border-slate-200 bg-slate-50/70 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 shadow-xs">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{course.name}</h3>
                    <span className="font-mono text-[11px] text-purple-600 font-semibold">{course.code}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(course)}
                  className="text-slate-400 hover:text-purple-600 transition"
                  title={course.is_active ? "Deactivate course" : "Activate course"}
                >
                  {course.is_active ? (
                    <ToggleRight className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-slate-400" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {course.description || "Official curriculum syllabus mapping with full chapter intelligence."}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-100">
                  {course.category}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500">
                    <strong className="text-slate-800">{course.total_subjects}</strong> Subjects
                  </span>
                  <button
                    onClick={() => handleDelete(course.id, course.name)}
                    className="text-slate-400 hover:text-rose-600 transition"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Add Curriculum Course</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCourse} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CMA Intermediate"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Code / Abbr</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CMA-INT"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Subjects</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={totalSubjects}
                      onChange={(e) => setTotalSubjects(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Professional">Professional (CA, CS, CMA)</option>
                    <option value="Undergraduate">Undergraduate (B.Com, BBA, BCA, BA)</option>
                    <option value="Postgraduate">Postgraduate (M.Com, MBA, MCA)</option>
                    <option value="School">School (Class 9 - 12)</option>
                    <option value="Competitive">Competitive Examinations</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Curriculum Notes / Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the examination pattern..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none resize-none"
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
