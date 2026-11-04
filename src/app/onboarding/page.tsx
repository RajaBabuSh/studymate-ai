"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  COURSE_CATALOG,
  getCourseById,
  getCourseSyllabusInfo,
  CourseDefinition,
} from "@/lib/courseCatalog";
import { detectChapterNature } from "@/lib/chapterIntelligence";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Sliders,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";
import {
  Subject,
  Chapter,
  Examination,
  PreferredStudyTime,
} from "@/types/database";
import confetti from "canvas-confetti";

interface SelectedSubjectItem {
  id: string;
  name: string;
  code: string;
  color: string;
  defaultChapters: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, student, updateStudentProfile } = useAuth();
  const [step, setStep] = useState<number>(1);

  // Step 1: Profile
  const [fullName, setFullName] = useState("");
  const [educationLevel, setEducationLevel] = useState("Professional (CA, CS, CMA)");
  const [institution, setInstitution] = useState("");

  // Step 2: Course
  const [selectedCourseId, setSelectedCourseId] = useState("ca-intermediate");
  const [customCourseName, setCustomCourseName] = useState("");

  // Step 3: Subjects
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubjectItem[]>([]);
  const [newCustomSubjectName, setNewCustomSubjectName] = useState("");
  const [newCustomSubjectCode, setNewCustomSubjectCode] = useState("");

  // Step 4: Study Preferences
  const [dailyHours, setDailyHours] = useState<number>(4.5);
  const [preferredTime, setPreferredTime] = useState<PreferredStudyTime>("evening");
  const [breakDuration, setBreakDuration] = useState<number>(15);
  const [weeklyHoliday, setWeeklyHoliday] = useState<string>("Sunday");
  const [targetExamName, setTargetExamName] = useState("May 2027 Examination");
  const [upcomingExamDate, setUpcomingExamDate] = useState("2027-05-15");

  // Step 5: Generating state
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (student) {
      setFullName(student.full_name || "");
      if (student.education_level) setEducationLevel(student.education_level);
      if (student.institution) setInstitution(student.institution);
      if (student.daily_available_hours) setDailyHours(student.daily_available_hours);
    }
  }, [student]);

  // When course changes, update default subjects for Step 3
  useEffect(() => {
    const courseDef = getCourseById(selectedCourseId);
    if (courseDef) {
      const items: SelectedSubjectItem[] = courseDef.subjects.map((sub, idx) => ({
        id: `subj-template-${idx}-${Date.now()}`,
        name: sub.name,
        code: sub.code,
        color: sub.color,
        defaultChapters: sub.defaultChapters,
      }));
      setSelectedSubjects(items);
    }
  }, [selectedCourseId]);

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomSubjectName.trim()) return;

    const colors = ["#6366f1", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];
    const randomColor = colors[selectedSubjects.length % colors.length];

    const newSub: SelectedSubjectItem = {
      id: `custom-sub-${Date.now()}`,
      name: newCustomSubjectName.trim(),
      code: newCustomSubjectCode.trim() || `SUB-${selectedSubjects.length + 1}`,
      color: randomColor,
      defaultChapters: ["Core Fundamentals", "Applied Topics", "Problem Sets & Revision"],
    };

    setSelectedSubjects([...selectedSubjects, newSub]);
    setNewCustomSubjectName("");
    setNewCustomSubjectCode("");
  };

  const handleRemoveSubject = (id: string) => {
    if (selectedSubjects.length <= 1) return;
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== id));
  };

  // Step 5: Finalize Onboarding & Generate Fresh Dashboard
  const handleCompleteOnboarding = async () => {
    if (!user) return;
    setIsFinishing(true);

    const activeCourseName =
      selectedCourseId === "other"
        ? customCourseName || "Custom Academic Curriculum"
        : getCourseById(selectedCourseId)?.name || "Professional Course";

    const userId = user.id;

    // 1. Generate real fresh Subject entities
    const createdSubjects: Subject[] = selectedSubjects.map((subItem) => ({
      id: `sub_${userId}_${Math.random().toString(36).substring(2, 9)}`,
      student_id: userId,
      course: activeCourseName,
      name: subItem.name,
      code: subItem.code,
      color: subItem.color,
      icon: "BookOpen",
      total_chapters: subItem.defaultChapters.length,
      completed_chapters: 0,
      target_date: upcomingExamDate,
      created_at: new Date().toISOString(),
    }));

    // 2. Generate real fresh Chapter entities linked to each subject with official metadata
    const syllabusInfo = getCourseSyllabusInfo(activeCourseName);
    const createdChapters: Chapter[] = [];
    createdSubjects.forEach((sub, sIdx) => {
      const template = selectedSubjects[sIdx];
      template.defaultChapters.forEach((chTitle, chIdx) => {
        const nature = detectChapterNature(sub.name, chTitle);
        createdChapters.push({
          id: `chap_${userId}_${Math.random().toString(36).substring(2, 9)}`,
          subject_id: sub.id,
          student_id: userId,
          title: chTitle,
          chapter_number: chIdx + 1,
          difficulty: chIdx % 3 === 0 ? "hard" : chIdx % 3 === 1 ? "medium" : "easy",
          estimated_hours: nature === "numerical" ? 4.5 : nature === "mixed" ? 4.0 : 3.5,
          status: "pending",
          study_status: "not_started",
          revision_status: "not_started",
          revision_history: [],
          test_status: "not_attempted",
          test_history: [],
          nature,
          is_custom: false,
          is_verified: syllabusInfo.isVerified,
          official_source: syllabusInfo.examBody,
          syllabus_version: syllabusInfo.syllabusVersion,
          notes_count: 0,
          created_at: new Date().toISOString(),
        });
      });
    });

    // 3. Generate initial upcoming Examinations for each subject
    const createdExams: Examination[] = createdSubjects.map((sub, idx) => {
      const examDateObj = new Date(upcomingExamDate);
      examDateObj.setDate(examDateObj.getDate() + idx * 3);

      return {
        id: `exam_${userId}_${idx}`,
        student_id: userId,
        subject_id: sub.id,
        subject_name: sub.name,
        exam_name: `${sub.name} Final Exam`,
        exam_date: examDateObj.toISOString().split("T")[0],
        start_time: "14:00",
        end_time: "17:00",
        room_location: "Main Exam Hall",
        weightage_percentage: 100,
        preparation_level: "medium",
        notes: `Comprehensive exam on ${sub.name} syllabus.`,
        created_at: new Date().toISOString(),
      };
    });

    // 4. Save to isolated storage
    StorageRepository.setSubjects(createdSubjects, userId);
    StorageRepository.setChapters(createdChapters, userId);
    StorageRepository.setExaminations(createdExams, userId);

    // 5. Update student profile
    await updateStudentProfile({
      full_name: fullName || student?.full_name || "Student",
      course: activeCourseName,
      education_level: educationLevel,
      institution: institution || undefined,
      grade_or_year: activeCourseName,
      target_exam: targetExamName,
      upcoming_exam_date: upcomingExamDate,
      daily_available_hours: dailyHours,
      preferred_study_time: preferredTime,
      break_duration_minutes: breakDuration,
      weekly_holiday: weeklyHoliday,
      onboarding_completed: true, // Mark finished!
    });

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden transition-colors">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 mx-auto w-full max-w-4xl flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">StudyMate AI</span>
            <span className="ml-1.5 rounded bg-indigo-50 dark:bg-indigo-500/30 border border-indigo-100 dark:border-transparent px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300">
              Personalized Setup
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Step {step}</span> of 5
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="relative z-10 mx-auto w-full max-w-4xl py-6">
        <div className="grid grid-cols-5 gap-2">
          {[
            { s: 1, title: "Profile" },
            { s: 2, title: "Course" },
            { s: 3, title: "Subjects" },
            { s: 4, title: "Preferences" },
            { s: 5, title: "Dashboard" },
          ].map((item) => (
            <div key={item.s} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                  step >= item.s
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  step === item.s ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Step Cards */}
      <div className="relative z-10 mx-auto w-full max-w-3xl flex-1 flex flex-col justify-center py-4">
        {/* ======================================================= */}
        {/* STEP 1: Student Profile */}
        {/* ======================================================= */}
        {step === 1 && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 mb-2">
                <Sparkles className="h-3 w-3" />
                <span>Step 1: Student Information</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Let&apos;s set up your profile</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tell us about your educational background so StudyMate can tailor difficulty levels.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-800 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:bg-slate-800 focus:outline-none transition-all"
                >
                  <option value="Professional (CA, CS, CMA)">Professional (CA, CS, CMA)</option>
                  <option value="Undergraduate (B.Com, BBA, BCA, BA, B.Sc)">
                    Undergraduate (B.Com, BBA, BCA, BA, B.Sc)
                  </option>
                  <option value="Senior Secondary (Class 11-12)">Senior Secondary (Class 11-12)</option>
                  <option value="School (Class 9-10)">School (Class 9-10)</option>
                  <option value="Postgraduate (M.Com, MBA, MCA, MA)">
                    Postgraduate (M.Com, MBA, MCA, MA)
                  </option>
                  <option value="Competitive Examinations">Competitive Examinations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  College, School, or Institute (Optional)
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. ICAI, Delhi University, St. Xavier's, CBSE"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-800 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition cursor-pointer"
              >
                <span>Continue to Course Selection</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STEP 2: Course Selection */}
        {/* ======================================================= */}
        {step === 2 && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 mb-2">
                <BookOpen className="h-3 w-3" />
                <span>Step 2: Course Selection</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Select your primary course</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose from chartered professional programs, university degrees, or high school board curriculums.
              </p>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {COURSE_CATALOG.map((course: CourseDefinition) => {
                const isSelected = selectedCourseId === course.id;
                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`group cursor-pointer rounded-2xl border p-3.5 transition flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-glow ring-2 ring-indigo-500/20"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {course.category}
                        </span>
                        {isSelected && (
                          <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      {course.subjects.length} Subjects included
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedCourseId === "other" && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter Your Custom Course Name
                </label>
                <input
                  type="text"
                  required
                  value={customCourseName}
                  onChange={(e) => setCustomCourseName(e.target.value)}
                  placeholder="e.g. Master of Business Administration (Finance)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition cursor-pointer"
              >
                <span>Continue to Subject Selection</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STEP 3: Dynamic Subject Selection */}
        {/* ======================================================= */}
        {step === 3 && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 mb-2">
                  <Layers className="h-3 w-3" />
                  <span>Step 3: Curriculum Subjects</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Subjects for {getCourseById(selectedCourseId)?.name || customCourseName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Check the subjects you are appearing for. You can add custom subjects or remove any.
                </p>
              </div>

              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 px-3 py-1 rounded-xl self-start sm:self-auto">
                {selectedSubjects.length} Selected
              </span>
            </div>

            {/* Active Selected Subjects List */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {selectedSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{sub.name}</span>
                        {sub.code && (
                          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                            {sub.code}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {sub.defaultChapters.length} Syllabus Chapters included
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub.id)}
                    title="Remove subject"
                    className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:text-rose-400 dark:hover:border-rose-500/40 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Subject Form */}
            <form
              onSubmit={handleAddCustomSubject}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/60 p-4 space-y-3"
            >
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Add an additional custom subject</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newCustomSubjectName}
                    onChange={(e) => setNewCustomSubjectName(e.target.value)}
                    placeholder="Subject Name (e.g. Environmental Studies)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomSubjectCode}
                    onChange={(e) => setNewCustomSubjectCode(e.target.value)}
                    placeholder="Code (e.g. EVS-101)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={selectedSubjects.length === 0}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                <span>Continue to Study Routine</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STEP 4: Study Preferences & Exam Date */}
        {/* ======================================================= */}
        {step === 4 && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 mb-2">
                <Sliders className="h-3 w-3" />
                <span>Step 4: Routine & Exam Deadlines</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Your study rhythm & targets</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tell us your available daily hours and when your exams commence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Daily Hours Slider */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Study Hours</label>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{dailyHours}h / Day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="9"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>2h</span>
                  <span>4.5h (Standard)</span>
                  <span>9h (Intensive)</span>
                </div>
              </div>

              {/* Preferred Study Slot */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/60 p-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Preferred Time Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "morning", label: "Morning", sub: "8am - 12pm" },
                    { id: "afternoon", label: "Afternoon", sub: "1pm - 5pm" },
                    { id: "evening", label: "Evening", sub: "5:30pm - 9:30pm" },
                    { id: "night", label: "Night Owl", sub: "8pm - 12am" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreferredTime(item.id as PreferredStudyTime)}
                      className={`rounded-xl p-2 text-left border transition cursor-pointer ${
                        preferredTime === item.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-white font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700"
                      }`}
                    >
                      <p className="text-xs">{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Exam Name & Date */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/60 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Examination Name
                  </label>
                  <input
                    type="text"
                    required
                    value={targetExamName}
                    onChange={(e) => setTargetExamName(e.target.value)}
                    placeholder="e.g. May 2027 CA Inter Exams"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Upcoming Exam Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="date"
                      required
                      value={upcomingExamDate}
                      onChange={(e) => setUpcomingExamDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Breaks and Holiday */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/60 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Break Duration Between Sessions
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 15, 20].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setBreakDuration(mins)}
                        className={`rounded-xl py-2 text-center border text-xs font-bold transition cursor-pointer ${
                          breakDuration === mins
                            ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700"
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Weekly Rest / Light Revision Day
                  </label>
                  <select
                    value={weeklyHoliday}
                    onChange={(e) => setWeeklyHoliday(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Sunday">Sunday (Recommended)</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Friday">Friday</option>
                    <option value="None">None (Continuous daily prep)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition cursor-pointer"
              >
                <span>Review & Build Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STEP 5: Final Review & Generation */}
        {/* ======================================================= */}
        {step === 5 && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 mb-3">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Ready to activate your companion!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Here is a summary of your personalized setup. Clicking below will generate your customized student dashboard and course modules.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/70 p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Student Name</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{fullName || student?.full_name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Selected Course</span>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {getCourseById(selectedCourseId)?.name || customCourseName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Education Level</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{educationLevel}</p>
                </div>
                <div>
                  <span className="text-slate-500">Daily Study Target</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{dailyHours} Hours / Day</p>
                </div>
                <div>
                  <span className="text-slate-500">Preferred Slot</span>
                  <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">{preferredTime}</p>
                </div>
                <div>
                  <span className="text-slate-500">Target Exam</span>
                  <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">{targetExamName}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Enrolled Subjects ({selectedSubjects.length}):
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedSubjects.map((sub) => (
                    <span
                      key={sub.id}
                      className="rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span>{sub.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                disabled={isFinishing}
                onClick={() => setStep(4)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                disabled={isFinishing}
                onClick={handleCompleteOnboarding}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-7 py-3 text-xs font-bold text-white shadow-xl hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                {isFinishing ? (
                  <span>Building Personalized Dashboard...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Launch My Personalized Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-center text-[11px] text-slate-500 pt-6">
        StudyMate AI • Course structures, subjects, and study preferences can be adjusted anytime from Settings.
      </div>
    </div>
  );
}
