"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { StorageRepository } from "@/lib/storage";
import {
  Settings,
  User,
  BookOpen,
  Clock,
  Calendar,
  LogOut,
  Save,
  CheckCircle2,
  Sparkles,
  Palette,
} from "lucide-react";

const STANDARD_COURSES = [
  "CS Executive",
  "CSEET",
  "CS Professional",
  "CA Foundation",
  "CA Intermediate",
  "CA Final",
  "B.Com",
  "BBA",
  "BCA",
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, student, isGuest, signOut } = useAuth();
  const { theme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("CS Executive");
  const [customCourse, setCustomCourse] = useState("");
  const [semester, setSemester] = useState("Both Groups");
  const [dailyHours, setDailyHours] = useState(4.5);
  const [examDate, setExamDate] = useState("");
  const [targetExam, setTargetExam] = useState("");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setFullName(student.full_name || "");
      setEmail(student.email || "");

      const existingCourse = student.course || "CS Executive";
      if (STANDARD_COURSES.includes(existingCourse)) {
        setCourse(existingCourse);
      } else {
        setCourse("Other");
        setCustomCourse(existingCourse);
      }

      setSemester(student.semester || "Both Groups");
      setDailyHours(student.daily_available_hours || 4.5);
      setExamDate(student.upcoming_exam_date || "");
      setTargetExam(student.target_exam || "");
    }
  }, [student]);

  const effectiveCourse = course === "Other" ? (customCourse.trim() || "General Studies") : course;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    // 1. Sync the curriculum dynamically if course or semester changed
    const curriculumRes = StorageRepository.setStudentCourse(effectiveCourse, semester, user?.id);

    // 2. Persist updated student profile
    const updated = {
      ...student,
      full_name: fullName.trim(),
      course: effectiveCourse,
      semester: semester,
      daily_available_hours: dailyHours,
      upcoming_exam_date: examDate,
      target_exam: targetExam.trim() || `${effectiveCourse} Examination`,
      updated_at: new Date().toISOString(),
    };

    StorageRepository.setStudent(updated, user?.id);
    setSyncStatus(`Curriculum updated: ${curriculumRes.subjectsCount} subjects and ${curriculumRes.chaptersCount} chapters active.`);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setSyncStatus(null);
    }, 4000);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* HEADER                                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 dark:border-purple-900/60 dark:bg-purple-950/60 dark:text-purple-300">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Student Profile & Academic Settings
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Configure your enrolled degree, target examination, daily hours, and platform theme.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Profile and academic curriculum preferences saved successfully!</span>
          </div>
          {syncStatus && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/60 dark:bg-emerald-900/50 dark:text-emerald-300 px-2.5 py-1 rounded-xl">
              {syncStatus}
            </span>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* THEME & APPEARANCE ARCHITECTURE                               */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1.5">
          <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span>Interface Appearance</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          StudyMate AI supports seamless Light and Dark modes. Toggle instantly anytime using the theme switch button in the top navigation bar. Active mode: <strong className="text-purple-600 dark:text-purple-400 capitalize">{theme} Mode</strong>.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PROFILE FORM                                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span>Academic Profile & Course Configuration</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:border-purple-400 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-850 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-3">
              Course & Academic Stage
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enrolled Course
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    value={course}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCourse(val);
                      if (val.startsWith("B.")) setSemester("Semester 1");
                      else if (val.startsWith("CA") || val.startsWith("CS")) setSemester("Both Groups");
                      else setSemester("Stage 1");
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:border-purple-400 focus:outline-none transition-all"
                  >
                    <optgroup label="Professional Courses - CS">
                      <option value="CS Executive">CS Executive (Official 7-Subject Syllabus)</option>
                      <option value="CSEET">CSEET (CS Executive Entrance Test)</option>
                      <option value="CS Professional">CS Professional</option>
                    </optgroup>
                    <optgroup label="Professional Courses - CA">
                      <option value="CA Foundation">CA Foundation</option>
                      <option value="CA Intermediate">CA Intermediate</option>
                      <option value="CA Final">CA Final</option>
                    </optgroup>
                    <optgroup label="Undergraduate Degree Programmes">
                      <option value="B.Com">B.Com (Bachelor of Commerce)</option>
                      <option value="BBA">BBA (Bachelor of Business Administration)</option>
                      <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                    </optgroup>
                    <optgroup label="Other Programmes">
                      <option value="Other">Other Course / Custom Syllabus</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Semester / Group / Stage
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:border-purple-400 focus:outline-none transition-all"
                >
                  {course.startsWith("B.") ? (
                    <>
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                    </>
                  ) : course === "Other" ? (
                    <>
                      <option value="Year 1">Year 1</option>
                      <option value="Year 2">Year 2</option>
                      <option value="Year 3">Year 3</option>
                      <option value="All Subjects">All Subjects</option>
                    </>
                  ) : (
                    <>
                      <option value="Both Groups">Both Groups (Full Curriculum)</option>
                      <option value="Group 1">Group 1</option>
                      <option value="Group 2">Group 2</option>
                      <option value="All Papers">All Papers</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {course === "Other" && (
              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Custom Course Title</label>
                <input
                  type="text"
                  required
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  placeholder="e.g. Master of Commerce (M.Com)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:border-purple-400 focus:outline-none transition-all"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-3">
              Preparation Schedule & Examination Target
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Daily Study Target
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:border-purple-400 focus:outline-none transition-all"
                  >
                    <option value={2}>2.0 hours / day</option>
                    <option value={3}>3.0 hours / day</option>
                    <option value={4}>4.0 hours / day</option>
                    <option value={4.5}>4.5 hours / day</option>
                    <option value={6}>6.0 hours / day</option>
                    <option value={8}>8.0 hours / day</option>
                    <option value={10}>10.0 hours / day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Examination
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. December 2026 Examination"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:border-purple-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Exam Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:border-purple-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Saving will re-index your study hub and load course-specific subjects.
            </p>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:from-purple-500 hover:to-blue-500 transition-all cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save & Sync Academic Hub</span>
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESIGN SYSTEM NOTICE                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-purple-100 bg-purple-50/50 dark:border-slate-800 dark:bg-slate-900/90 p-6 shadow-xs transition-colors">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs border border-purple-100 dark:border-slate-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>StudyMate AI Adaptive Theme Architecture</span>
              <span className="rounded-md bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                Active
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
              StudyMate AI supports seamless switching between Premium Light Mode (clean white cards, purple and blue accents) and Dark Mode (deep slate surfaces with high-contrast text and accents).
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACCOUNT & LOGOUT                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Account Actions</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-medium">
          Signed in as <strong>{student?.email || "Guest Student"}</strong> ({isGuest ? "Guest Preview" : "Registered Student Account"}).
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
