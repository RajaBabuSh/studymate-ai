"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Upload,
  FileText,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Check,
  CalendarDays,
  AlertTriangle,
  Layers,
  BarChart3,
  RotateCcw,
  ShieldAlert,
  Clock,
  Zap,
  AlertCircle,
  FileUp,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import {
  StudySession,
  Difficulty,
  PreferredStudyTime,
  ExamPreparationLevel,
  PlanValidationError,
} from "@/types/database";
import { formatDate } from "@/lib/utils";
import confetti from "canvas-confetti";

interface ExtractedSubject {
  name: string;
  code?: string;
  is_weak?: boolean;
  exam_date?: string;
  exam_time?: string;
  chapters: Array<{
    title: string;
    difficulty: Difficulty;
    estimated_hours: number;
    nature?: "numerical" | "theory" | "practical" | "mixed";
  }>;
}

interface ExtractedExam {
  subject_name: string;
  exam_name: string;
  exam_date: string;
  start_time?: string;
  end_time?: string;
}

interface DateConflictItem {
  subjectName: string;
  extractedDate: string;
  targetDate: string;
  reason: string;
}

interface WeeklyScheduleItem {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalPlannedHours: number;
  subjectHours: Array<{
    subjectName: string;
    allocatedHours: number;
    percentage: number;
  }>;
}

interface AllocationExplanationItem {
  subjectName: string;
  allocatedHours: number;
  isWeak: boolean;
  rationale: string;
}

interface RevisionScheduleItem {
  subjectName: string;
  chapterTitle: string;
  date: string;
  revisionType?: string;
}

interface TestScheduleItem {
  subjectName: string;
  testTitle: string;
  date: string;
  durationHours: number;
}

export default function TimetableGeneratorPage() {
  const { user, student } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string>("");
  const [extractionErrorMessage, setExtractionErrorMessage] = useState<string>("");

  // Step 1: Syllabus Files
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [syllabusFileName, setSyllabusFileName] = useState<string>("");

  // Step 2: Date Sheet Files
  const [dateSheetFile, setDateSheetFile] = useState<File | null>(null);
  const [dateSheetFileName, setDateSheetFileName] = useState<string>("");

  // Step 3: Student Study Preferences & Target Exam Date
  const [targetExamDate, setTargetExamDate] = useState<string>("");
  const [dailyHours, setDailyHours] = useState<number>(4.5);
  const [preferredTime, setPreferredTime] = useState<PreferredStudyTime>("evening");
  const [breakDuration, setBreakDuration] = useState<number>(15);
  const [weeklyHoliday, setWeeklyHoliday] = useState<string>("Sunday");
  const [prepLevel, setPrepLevel] = useState<ExamPreparationLevel>("intermediate");
  const [keepExistingSessions, setKeepExistingSessions] = useState<boolean>(true);

  // Step 4: Extracted & Verified Data
  const [verifiedSubjects, setVerifiedSubjects] = useState<ExtractedSubject[]>([]);
  const [verifiedExams, setVerifiedExams] = useState<ExtractedExam[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.94);
  const [originalDocumentName, setOriginalDocumentName] = useState<string>("");
  const [extractedExamTitle, setExtractedExamTitle] = useState<string>("");
  const [dateConflicts, setDateConflicts] = useState<DateConflictItem[]>([]);
  const [isConfirmedByUser, setIsConfirmedByUser] = useState<boolean>(false);

  // Add Missing Subject Modal State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [newSubName, setNewSubName] = useState<string>("");
  const [newSubCode, setNewSubCode] = useState<string>("");
  const [newSubExamDate, setNewSubExamDate] = useState<string>("");

  // Step 5: Multi-Dimensional Timetable Output
  const [generatedSessions, setGeneratedSessions] = useState<StudySession[]>([]);
  const [, setDailySchedule] = useState<unknown[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([]);
  const [allocationExplanations, setAllocationExplanations] = useState<AllocationExplanationItem[]>([]);
  const [revisionSchedule, setRevisionSchedule] = useState<RevisionScheduleItem[]>([]);
  const [testSchedule, setTestSchedule] = useState<TestScheduleItem[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<PlanValidationError[]>([]);
  const [dismissedWarningIds, setDismissedWarningIds] = useState<string[]>([]);

  // View switchers & state
  const [activeViewTab, setActiveViewTab] = useState<
    "daily" | "weekly" | "allocation" | "revisions" | "mocks"
  >("daily");
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("all");

  // Safe Overwrite confirmation modal
  const [showConfirmOverwriteModal, setShowConfirmOverwriteModal] = useState<boolean>(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState<boolean>(false);

  // Initialize student preferences
  useEffect(() => {
    if (student) {
      if (student.daily_available_hours) setDailyHours(student.daily_available_hours);
      if (student.preferred_study_time) setPreferredTime(student.preferred_study_time);
      if (student.break_duration_minutes) setBreakDuration(student.break_duration_minutes);
      if (student.weekly_holiday) setWeeklyHoliday(student.weekly_holiday);
      if (student.upcoming_exam_date) setTargetExamDate(student.upcoming_exam_date);
    }
  }, [student]);

  // Load sample demo for student's specific enrolled course (CA / CS / B.Com / Class 12)
  const handleLoadCourseDemo = async () => {
    setIsProcessingAI(true);
    setExtractionErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("isDemo", "true");
      formData.append("studentCourse", student?.course || "ca-inter");
      formData.append("targetExamDate", targetExamDate || "");
      formData.append("studentId", user?.id || "student-active");

      const res = await fetch("/api/ai/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.data) {
        setVerifiedSubjects(data.data.subjects || []);
        setVerifiedExams(data.data.examinations || []);
        setConfidenceScore(data.data.confidence_score || 0.98);
        setAiSource("Verified Curriculum Demo Template");
        setOriginalDocumentName(data.data.file_name || "Official_Curriculum_Demo.pdf");
        setExtractedExamTitle(data.data.exam_name || "Official Examination Schedule");
        setDateConflicts(data.data.date_conflicts || []);
        setCurrentStep(4);
      }
    } catch (err) {
      console.error("Demo load error", err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Trigger Step 4 extraction from AI API using uploaded documents
  const handleProceedToVerification = async () => {
    setIsProcessingAI(true);
    setExtractionErrorMessage("");

    const uploadedDocNames: string[] = [];
    if (dateSheetFile) uploadedDocNames.push(dateSheetFile.name);
    if (syllabusFile) uploadedDocNames.push(syllabusFile.name);
    setOriginalDocumentName(uploadedDocNames.join(" & ") || "Uploaded Academic Document");

    try {
      let extractedSubs: ExtractedSubject[] = [];
      let extractedExs: ExtractedExam[] = [];
      let detectedExamName = "";
      let sourceName = "";
      let confidence = 0.92;
      let conflicts: DateConflictItem[] = [];

      // 1. If Date Sheet uploaded, extract examination dates & subjects
      if (dateSheetFile) {
        const formDataDatesheet = new FormData();
        formDataDatesheet.append("documentType", "datesheet");
        formDataDatesheet.append("file", dateSheetFile);
        formDataDatesheet.append("studentCourse", student?.course || "");
        formDataDatesheet.append("targetExamDate", targetExamDate || "");
        formDataDatesheet.append("studentId", user?.id || "student-active");

        const resDatesheet = await fetch("/api/ai/extract", {
          method: "POST",
          body: formDataDatesheet,
        });
        const dataDatesheet = await resDatesheet.json();

        if (dataDatesheet.success && dataDatesheet.data) {
          extractedSubs = dataDatesheet.data.subjects || [];
          extractedExs = dataDatesheet.data.examinations || [];
          detectedExamName = dataDatesheet.data.exam_name || "";
          sourceName = dataDatesheet.source || "PDF Native Text Parser";
          confidence = dataDatesheet.data.confidence_score || 0.94;
          conflicts = dataDatesheet.data.date_conflicts || [];
        } else if (!dataDatesheet.success) {
          setExtractionErrorMessage(dataDatesheet.error || "Unable to parse datesheet PDF.");
        }
      }

      // 2. If Syllabus uploaded, extract chapters and syllabus structure
      if (syllabusFile) {
        const formDataSyllabus = new FormData();
        formDataSyllabus.append("documentType", "syllabus");
        formDataSyllabus.append("file", syllabusFile);
        formDataSyllabus.append("studentCourse", student?.course || "");
        formDataSyllabus.append("targetExamDate", targetExamDate || "");
        formDataSyllabus.append("studentId", user?.id || "student-active");

        const resSyllabus = await fetch("/api/ai/extract", {
          method: "POST",
          body: formDataSyllabus,
        });
        const dataSyllabus = await resSyllabus.json();

        if (dataSyllabus.success && dataSyllabus.data?.subjects) {
          if (extractedSubs.length === 0) {
            extractedSubs = dataSyllabus.data.subjects;
          } else {
            // Merge chapters into matching extracted subjects
            extractedSubs = extractedSubs.map((sub) => {
              const matchedSyllabus = dataSyllabus.data.subjects.find(
                (s: ExtractedSubject) =>
                  s.name.toLowerCase().includes(sub.name.toLowerCase()) ||
                  sub.name.toLowerCase().includes(s.name.toLowerCase())
              );
              return matchedSyllabus && matchedSyllabus.chapters.length > 0
                ? { ...sub, chapters: matchedSyllabus.chapters }
                : sub;
            });
          }
          if (!detectedExamName) detectedExamName = dataSyllabus.data.exam_name || "";
          if (!sourceName) sourceName = dataSyllabus.source || "PDF Native Text Parser";
        }
      }

      // 3. If NO files were uploaded, load student's existing enrolled curriculum
      if (!dateSheetFile && !syllabusFile) {
        const existingSubjects = StorageRepository.getSubjects(user?.id);
        const existingChapters = StorageRepository.getChapters(user?.id);

        if (existingSubjects.length > 0) {
          extractedSubs = existingSubjects.map((s) => ({
            name: s.name,
            code: s.code,
            is_weak: Boolean(s.is_weak),
            exam_date: s.target_date,
            chapters: existingChapters
              .filter((c) => c.subject_id === s.id)
              .map((c) => ({
                title: c.title,
                difficulty: c.difficulty,
                estimated_hours: c.estimated_hours,
                nature: c.nature,
              })),
          }));
          sourceName = "Enrolled Student Curriculum";
          detectedExamName = `${student?.course?.toUpperCase() || "Academic"} Examination Schedule`;
          confidence = 0.99;
          setOriginalDocumentName("Enrolled Course Subjects");
        }
      }

      setVerifiedSubjects(extractedSubs);
      setVerifiedExams(extractedExs);
      setExtractedExamTitle(detectedExamName || "Official Examination Schedule");
      setAiSource(sourceName || "AI Document Engine");
      setConfidenceScore(confidence);
      setDateConflicts(conflicts);
      setIsConfirmedByUser(false);
      setCurrentStep(4);
    } catch (err) {
      console.error("AI extraction error", err);
      setExtractionErrorMessage("Failed to extract data. Please verify your document or enter subjects manually.");
      setCurrentStep(4);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Step 4 Handlers for Student Verification
  const updateSubjectName = (subjIdx: number, newName: string) => {
    const updated = [...verifiedSubjects];
    updated[subjIdx].name = newName;
    setVerifiedSubjects(updated);
  };

  const updateSubjectCode = (subjIdx: number, newCode: string) => {
    const updated = [...verifiedSubjects];
    updated[subjIdx].code = newCode;
    setVerifiedSubjects(updated);
  };

  const updateSubjectExamDate = (subjIdx: number, newDate: string) => {
    const updated = [...verifiedSubjects];
    updated[subjIdx].exam_date = newDate;
    setVerifiedSubjects(updated);

    // Also update matching in verifiedExams
    const subName = updated[subjIdx].name;
    const exIdx = verifiedExams.findIndex((e) => e.subject_name.toLowerCase() === subName.toLowerCase());
    if (exIdx >= 0) {
      const updatedEx = [...verifiedExams];
      updatedEx[exIdx].exam_date = newDate;
      setVerifiedExams(updatedEx);
    } else if (newDate) {
      setVerifiedExams((prev) => [
        ...prev,
        {
          subject_name: subName,
          exam_name: `${subName} Examination`,
          exam_date: newDate,
          start_time: "02:00 PM",
          end_time: "05:00 PM",
        },
      ]);
    }
  };

  const deleteSubject = (subjIdx: number) => {
    const subName = verifiedSubjects[subjIdx]?.name;
    const updated = [...verifiedSubjects];
    updated.splice(subjIdx, 1);
    setVerifiedSubjects(updated);

    if (subName) {
      setVerifiedExams((prev) => prev.filter((e) => e.subject_name.toLowerCase() !== subName.toLowerCase()));
    }
  };

  const toggleSubjectWeakness = (subjIdx: number) => {
    const updated = [...verifiedSubjects];
    updated[subjIdx].is_weak = !updated[subjIdx].is_weak;
    setVerifiedSubjects(updated);
  };

  const addChapter = (subjIdx: number) => {
    const updated = [...verifiedSubjects];
    updated[subjIdx].chapters.push({
      title: "New Chapter Topic",
      difficulty: "medium",
      estimated_hours: 3.5,
      nature: "theory",
    });
    setVerifiedSubjects(updated);
  };

  const updateChapterTitle = (subjIdx: number, chapIdx: number, newTitle: string) => {
    const updated = [...verifiedSubjects];
    updated[subjIdx].chapters[chapIdx].title = newTitle;
    setVerifiedSubjects(updated);
  };

  const updateChapterDifficulty = (subjIdx: number, chapIdx: number, diff: Difficulty) => {
    const updated = [...verifiedSubjects];
    updated[subjIdx].chapters[chapIdx].difficulty = diff;
    setVerifiedSubjects(updated);
  };

  const deleteChapter = (subjIdx: number, chapIdx: number) => {
    const updated = [...verifiedSubjects];
    updated[subjIdx].chapters.splice(chapIdx, 1);
    setVerifiedSubjects(updated);
  };

  const handleAddMissingSubject = () => {
    if (!newSubName.trim()) return;
    const newSub: ExtractedSubject = {
      name: newSubName.trim(),
      code: newSubCode.trim() || `PAPER-${verifiedSubjects.length + 1}`,
      exam_date: newSubExamDate || targetExamDate || "",
      is_weak: false,
      chapters: [
        {
          title: "Foundations & Core Principles",
          difficulty: "easy",
          estimated_hours: 3.0,
          nature: "theory",
        },
        {
          title: "Applied Concepts & Practical Exercises",
          difficulty: "hard",
          estimated_hours: 5.0,
          nature: "numerical",
        },
        {
          title: "Past Examination Questions & Revision",
          difficulty: "medium",
          estimated_hours: 4.0,
          nature: "practical",
        },
      ],
    };

    setVerifiedSubjects((prev) => [...prev, newSub]);
    if (newSubExamDate) {
      setVerifiedExams((prev) => [
        ...prev,
        {
          subject_name: newSub.name,
          exam_name: `${newSub.name} Examination`,
          exam_date: newSubExamDate,
          start_time: "02:00 PM",
          end_time: "05:00 PM",
        },
      ]);
    }

    setNewSubName("");
    setNewSubCode("");
    setNewSubExamDate("");
    setShowAddSubjectModal(false);
  };

  const handleReuploadDocument = () => {
    setSyllabusFile(null);
    setSyllabusFileName("");
    setDateSheetFile(null);
    setDateSheetFileName("");
    setCurrentStep(1);
  };

  // Step 4: Confirm Data & Proceed to Generate Timetable
  const handleConfirmAndGenerateTimetable = async () => {
    if (verifiedSubjects.length === 0) {
      alert("At least one subject is required. Please add a subject or re-upload your document.");
      return;
    }

    setIsConfirmedByUser(true);
    setIsProcessingAI(true);

    // Save confirmed subjects to student's account
    try {
      const existingSubs = StorageRepository.getSubjects(user?.id);
      const updatedSubs = verifiedSubjects.map((s, idx) => {
        const existing = existingSubs.find((es) => es.name.toLowerCase() === s.name.toLowerCase());
        return {
          id: existing?.id || `sub-confirmed-${idx + 1}-${Date.now()}`,
          student_id: user?.id || "student-active",
          name: s.name,
          code: s.code || `PAPER-${idx + 1}`,
          color: existing?.color || "#6366f1",
          total_chapters: s.chapters.length,
          completed_chapters: existing?.completed_chapters || 0,
          target_date: s.exam_date || targetExamDate,
          is_weak: Boolean(s.is_weak),
          created_at: existing?.created_at || new Date().toISOString(),
        };
      });

      StorageRepository.setSubjects(updatedSubs, user?.id);

      // Save confirmed chapters
      const allChapters = updatedSubs.flatMap((sub, sIdx) => {
        const vSub = verifiedSubjects[sIdx];
        return vSub.chapters.map((chap, cIdx) => ({
          id: `chap-${sub.id}-${cIdx + 1}`,
          subject_id: sub.id,
          student_id: user?.id || "student-active",
          title: chap.title,
          chapter_number: cIdx + 1,
          difficulty: chap.difficulty,
          estimated_hours: chap.estimated_hours,
          status: "pending" as const,
          study_status: "not_started" as const,
          revision_status: "not_started" as const,
          notes_count: 0,
          nature: chap.nature || "theory",
          created_at: new Date().toISOString(),
        }));
      });
      StorageRepository.setChapters(allChapters, user?.id);
    } catch (saveErr) {
      console.warn("Storage save error", saveErr);
    }

    // Call Timetable Generation API
    const existingSessions = StorageRepository.getStudySessions(user?.id);
    try {
      const res = await fetch("/api/ai/generate-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user?.id || "student-active",
          subjects: verifiedSubjects,
          examinations: verifiedExams,
          preferences: {
            daily_available_hours: dailyHours,
            preferred_study_time: preferredTime,
            break_duration_minutes: breakDuration,
            weekly_holiday: weeklyHoliday,
            preparation_level: prepLevel,
          },
          keepExistingSessions,
          existingSessions,
        }),
      });

      const result = await res.json();
      if (result.success && result.data?.sessions) {
        setGeneratedSessions(result.data.sessions);
        setDailySchedule(result.data.dailySchedule || []);
        setWeeklySchedule(result.data.weeklySchedule || []);
        setAllocationExplanations(result.data.allocationExplanations || []);
        setRevisionSchedule(result.data.revisionSchedule || []);
        setTestSchedule(result.data.testSchedule || []);
        setValidationWarnings(result.data.validationWarnings || []);
        setDismissedWarningIds([]);
        setCurrentStep(5);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else {
        alert(result.error || "Timetable generation failed. Please review your subjects.");
      }
    } catch (err) {
      console.error("Timetable generation failed", err);
      alert("Timetable generation error. Please try again.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Accept AI Correction for RED WARNING
  const handleAcceptCorrection = (warning: PlanValidationError) => {
    if (warning.issue_type === "excessive_workload" || warning.issue_type === "unrealistic_duration") {
      setDailyHours((prev) => Math.min(8, prev + 1.5));
    }
    setDismissedWarningIds((prev) => [...prev, warning.id]);
    handleConfirmAndGenerateTimetable();
  };

  const handleDismissWarning = (warningId: string) => {
    setDismissedWarningIds((prev) => [...prev, warningId]);
  };

  const handleRequestApplyToDashboard = () => {
    const existing = StorageRepository.getStudySessions(user?.id);
    if (existing.length > 0 && !keepExistingSessions) {
      setShowConfirmOverwriteModal(true);
    } else {
      executeApplyToDashboard();
    }
  };

  const executeApplyToDashboard = () => {
    StorageRepository.setStudySessions(generatedSessions, user?.id);
    setShowConfirmOverwriteModal(false);
    setIsSavedSuccessfully(true);
    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => setIsSavedSuccessfully(false), 3000);
  };

  const uniqueDates = Array.from(new Set(generatedSessions.map((s) => s.date))).sort();
  const filteredSessions =
    selectedDayFilter === "all"
      ? generatedSessions
      : generatedSessions.filter((s) => s.date === selectedDayFilter);

  const activeWarnings = validationWarnings.filter((w) => !dismissedWarningIds.includes(w.id));

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AI Examination Timetable Generator
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Extracts your uploaded syllabus and examination schedule directly into a personalized study timetable.
          </p>
        </div>

        {currentStep === 5 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Modify Confirmed Subjects</span>
            </button>
            <button
              onClick={handleRequestApplyToDashboard}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSavedSuccessfully ? "Saved to Dashboard!" : "Apply to Dashboard"}</span>
            </button>
          </div>
        )}
      </div>

      {/* 5-Step Stepper Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {[
            { step: 1, title: "Syllabus Upload", icon: Upload },
            { step: 2, title: "Exam Date Sheet", icon: Calendar },
            { step: 3, title: "Preferences", icon: Sliders },
            { step: 4, title: "Verify & Confirm", icon: CheckCircle2 },
            { step: 5, title: "Final Timetable", icon: CalendarDays },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                onClick={() => {
                  if (item.step < currentStep) setCurrentStep(item.step);
                }}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition ${
                  item.step < currentStep ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isCurrent
                      ? "bg-indigo-600 text-white shadow-glow"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`mt-1.5 text-[10px] sm:text-xs font-bold truncate max-w-full ${
                    isCurrent
                      ? "text-indigo-600 dark:text-indigo-400"
                      : isDone
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400"
                  }`}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* STEP 1: Upload Syllabus */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 1: Upload Subject Syllabus or Chapter Lists
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload your course syllabus PDF to automatically extract your subjects, chapters, and topics.
              </p>
            </div>
            <button
              onClick={handleLoadCourseDemo}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Use Enrolled Course Demo ({student?.course?.toUpperCase() || "CA Inter"})</span>
            </button>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 p-8 text-center bg-slate-50/50 dark:bg-slate-800/20 transition group">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Upload className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
              Drag and drop syllabus PDF or document here
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports PDF, PNG, JPG, and Plain Text</p>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-500 transition">
              <FileText className="h-4 w-4" />
              <span>Browse Syllabus File</span>
              <input
                type="file"
                accept="application/pdf,image/*,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSyllabusFile(file);
                    setSyllabusFileName(file.name);
                  }
                }}
              />
            </label>

            {syllabusFileName && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Selected: {syllabusFileName}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
            <p className="text-xs text-slate-400">
              {syllabusFileName ? "PDF ready for AI extraction." : "No file yet? You can skip to date sheet or use enrolled subjects."}
            </p>
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition active:scale-95"
            >
              <span>Continue to Exam Date Sheet</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: Upload Date Sheet */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 2: Upload Examination Date Sheet
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload your official exam routine, schedule, or timetable notice.
              </p>
            </div>
            <button
              onClick={handleLoadCourseDemo}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Use Enrolled Course Demo</span>
            </button>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 p-8 text-center bg-slate-50/50 dark:bg-slate-800/20 transition group">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Calendar className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
              Upload Exam Date Sheet PDF or Image
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports official date sheet PDFs from ICAI, ICSI, CBSE, UGC, State Universities
            </p>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-500 transition">
              <FileUp className="h-4 w-4" />
              <span>Browse Date Sheet PDF</span>
              <input
                type="file"
                accept="application/pdf,image/*,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDateSheetFile(file);
                    setDateSheetFileName(file.name);
                  }
                }}
              />
            </label>

            {dateSheetFileName && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Selected: {dateSheetFileName}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition active:scale-95"
            >
              <span>Continue to Preferences</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: Student Study Preferences */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 3: Personal Study Availability & Target Exam
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure your daily study capacity, peak time, and target examination deadline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Target Exam Date */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                <span>Overall Target Examination Date</span>
              </label>
              <input
                type="date"
                value={targetExamDate}
                onChange={(e) => setTargetExamDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1.5">
                This will be cross-referenced with your uploaded date sheet to flag any scheduling conflicts.
              </p>
            </div>

            {/* Daily Hours */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Daily Available Study Hours
                </label>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                  {dailyHours} Hours / day
                </span>
              </div>
              <input
                type="range"
                min="1.5"
                max="10.0"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 mt-2">
                Recommended: 4.5h to 6.0h for deep retention.
              </p>
            </div>

            {/* Preferred Study Time */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Preferred Peak Study Time
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["early_morning", "morning", "afternoon", "evening"] as PreferredStudyTime[]).map(
                  (time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setPreferredTime(time)}
                      className={`rounded-xl py-2 px-1 text-[11px] font-bold capitalize transition ${
                        preferredTime === time
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {time.replace("_", " ")}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Preparation Level */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Preparation Pacing Level
              </label>
              <select
                value={prepLevel}
                onChange={(e) => setPrepLevel(e.target.value as ExamPreparationLevel)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="beginner">Beginner (Concept foundations + more time)</option>
                <option value="intermediate">Intermediate (Standard syllabus pacing)</option>
                <option value="advanced">Advanced (Spaced revisions + mock tests emphasis)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Adjusts weightage formulas and spaced revision frequencies.
              </p>
            </div>

            {/* Safe Preservation Toggle */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-emerald-500" />
                  <span>Preserve Approved Sessions</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  When enabled, previously scheduled or completed study sessions on your dashboard will not be wiped.
                </p>
              </div>
              <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepExistingSessions}
                  onChange={(e) => setKeepExistingSessions(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Keep existing approved study sessions
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleProceedToVerification}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-95 transition active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Run AI Document Extraction & Verify</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 4: Student Verification & Strict Subject Confirmation */}
      {/* ============================================================== */}
      {currentStep === 4 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-6">
          {/* Top Verification Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-lg bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {aiSource || "PDF Native Parser"}
                </span>
                <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Confidence: {Math.round(confidenceScore * 100)}%
                </span>
                {originalDocumentName && (
                  <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate max-w-xs">
                    Source: {originalDocumentName}
                  </span>
                )}
                {isConfirmedByUser && (
                  <span className="rounded-lg bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-bold">
                    ✓ Confirmed by Student
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 4: Student Verification & Subject Confirmation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review and edit your extracted subjects, examination dates, and chapters. No timetable is generated until you confirm this data.
              </p>
            </div>

            {/* Actions: Reupload and Confirm */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReuploadDocument}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reupload Document</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddSubjectModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Missing Subject</span>
              </button>

              <button
                disabled={isProcessingAI || verifiedSubjects.length === 0}
                onClick={handleConfirmAndGenerateTimetable}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 transition active:scale-95 disabled:opacity-50"
              >
                {isProcessingAI ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Timetable...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>CONFIRM EXTRACTED DATA</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extraction Error Alert if Any */}
          {extractionErrorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  Document Extraction Warning
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
                  {extractionErrorMessage} You can add missing subjects using the &quot;+ Add Missing Subject&quot; button above.
                </p>
              </div>
            </div>
          )}

          {/* Date Conflict Warnings (Requirement 4) */}
          {dateConflicts.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Examination Date Schedule Conflict Detected</span>
              </div>
              <div className="space-y-1.5 pl-6">
                {dateConflicts.map((dc, idx) => (
                  <p key={idx} className="text-xs text-amber-700 dark:text-amber-300">
                    • <strong>{dc.subjectName}</strong>: {dc.reason}
                  </p>
                ))}
              </div>
              <div className="pt-1 pl-6">
                <button
                  type="button"
                  onClick={() => {
                    if (verifiedExams[0]?.exam_date) {
                      setTargetExamDate(verifiedExams[0].exam_date);
                      setDateConflicts([]);
                    }
                  }}
                  className="rounded-lg bg-amber-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-amber-500 transition"
                >
                  Sync Target Date with Date Sheet ({verifiedExams[0]?.exam_date || "First Exam"})
                </button>
              </div>
            </div>
          )}

          {/* Extracted Examination Name (Editable) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Extracted Examination Name
            </label>
            <input
              type="text"
              value={extractedExamTitle}
              onChange={(e) => setExtractedExamTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          {/* Confirmed Subjects Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Extracted Subjects & Examination Dates ({verifiedSubjects.length} Confirmed)
              </h3>
              <span className="text-[11px] text-slate-400">
                Edit subject names, individual exam dates, or mark weak subjects below.
              </span>
            </div>

            {verifiedSubjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500">No subjects currently in list.</p>
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Subject</span>
                </button>
              </div>
            ) : (
              verifiedSubjects.map((subject, sIdx) => (
                <div
                  key={sIdx}
                  className={`rounded-2xl border p-4 shadow-xs transition ${
                    subject.is_weak
                      ? "border-amber-400 bg-amber-50/20 dark:border-amber-600/40 dark:bg-amber-950/20"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {/* Subject Name Input */}
                      <input
                        type="text"
                        value={subject.name}
                        onChange={(e) => updateSubjectName(sIdx, e.target.value)}
                        placeholder="Subject Name"
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none flex-1 min-w-[200px]"
                      />

                      {/* Paper Code Input */}
                      <input
                        type="text"
                        value={subject.code || ""}
                        onChange={(e) => updateSubjectCode(sIdx, e.target.value)}
                        placeholder="Code"
                        className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 focus:outline-none"
                      />

                      {/* Individual Exam Date Input */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-rose-500" />
                          <span>Exam:</span>
                        </label>
                        <input
                          type="date"
                          value={subject.exam_date || ""}
                          onChange={(e) => updateSubjectExamDate(sIdx, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Weak Subject Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleSubjectWeakness(sIdx)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold border transition ${
                          subject.is_weak
                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>{subject.is_weak ? "Weak (+40% Buffer Active)" : "Mark Weak"}</span>
                      </button>

                      {/* Add Chapter Button */}
                      <button
                        type="button"
                        onClick={() => addChapter(sIdx)}
                        className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Chapter</span>
                      </button>

                      {/* Delete Subject Button */}
                      <button
                        type="button"
                        onClick={() => deleteSubject(sIdx)}
                        className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/40"
                        title="Remove Subject"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Chapters List */}
                  <div className="mt-3 space-y-2">
                    {subject.chapters.map((chap, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2.5"
                      >
                        <input
                          type="text"
                          value={chap.title}
                          onChange={(e) => updateChapterTitle(sIdx, cIdx, e.target.value)}
                          className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {chap.nature || "theory"}
                          </span>
                          <select
                            value={chap.difficulty}
                            onChange={(e) =>
                              updateChapterDifficulty(sIdx, cIdx, e.target.value as Difficulty)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <option value="easy">Easy (1.0x)</option>
                            <option value="medium">Medium (1.5x)</option>
                            <option value="hard">Hard (2.5x)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => deleteChapter(sIdx, cIdx)}
                            className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:border-slate-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReuploadDocument}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Wrong file uploaded? Reupload Document</span>
            </button>

            <button
              disabled={isProcessingAI || verifiedSubjects.length === 0}
              onClick={handleConfirmAndGenerateTimetable}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-8 py-3 text-xs font-bold text-white shadow-xl hover:opacity-95 transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>CONFIRM EXTRACTED DATA & GENERATE TIMETABLE</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 5: Interactive Multi-Dimensional Timetable & RED WARNING System */}
      {/* ============================================================== */}
      {currentStep === 5 && (
        <div className="space-y-6">
          {/* Phase 8: RED WARNING System Alert Cards */}
          {activeWarnings.length > 0 && (
            <div className="space-y-3">
              {activeWarnings.map((warning) => (
                <div
                  key={warning.id}
                  className="rounded-2xl border border-rose-300 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/40 p-4 sm:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-200/60 dark:bg-rose-900/40 px-2 py-0.5 rounded">
                          AI Plan Validation Conflict
                        </span>
                        <span className="text-xs font-extrabold text-rose-900 dark:text-rose-200">
                          {warning.title}
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">
                        {warning.what_is_wrong}
                      </p>
                      <p className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-0.5">
                        <strong>Why it matters:</strong> {warning.why_is_it_a_problem}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAcceptCorrection(warning)}
                      className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 transition active:scale-95"
                    >
                      ✓ Accept AI Correction
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissWarning(warning.id)}
                      className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/50 dark:text-rose-200 transition"
                    >
                      Keep My Existing Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timetable Sub-Views Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              {[
                { id: "daily", label: "Daily Schedule", icon: CalendarDays },
                { id: "weekly", label: "Weekly Overview", icon: Layers },
                { id: "allocation", label: "Subject Allocation", icon: BarChart3 },
                { id: "revisions", label: "Spaced Revisions", icon: RotateCcw },
                { id: "mocks", label: "Mock & Exam Sprints", icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeViewTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveViewTab(tab.id as typeof activeViewTab)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick date filter for daily view */}
            {activeViewTab === "daily" && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">Filter Day:</span>
                <select
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Plan Days ({uniqueDates.length} Days)</option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d}>
                      {formatDate(d)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* VIEW 1: Daily Timeline */}
          {activeViewTab === "daily" && (
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500">No study sessions for this date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSessions.map((session) => {
                    const isNumerical = session.notes?.includes("Numerical");
                    return (
                      <div
                        key={session.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hover:border-indigo-400 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                              {session.session_type.toUpperCase().replace("_", " ")}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {formatDate(session.date)}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {session.subject_name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                            {session.chapter_title}
                          </p>

                          <div className="mt-3 flex items-center gap-2">
                            <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                              {session.start_time} - {session.end_time} ({session.duration_minutes}m)
                            </span>
                            {isNumerical && (
                              <span className="rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                Morning Peak
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
                          {session.notes || "Pomodoro focus block with active recall"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: Weekly Overview */}
          {activeViewTab === "weekly" && (
            <div className="space-y-4">
              {weeklySchedule.map((week) => (
                <div
                  key={week.weekNumber}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Week {week.weekNumber} ({formatDate(week.startDate)} - {formatDate(week.endDate)})
                      </h3>
                      <p className="text-xs text-slate-400">Total Planned Volume: {week.totalPlannedHours} Hours</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {week.subjectHours.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {sub.subjectName}
                        </p>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                            {sub.allocatedHours}h
                          </span>
                          <span className="text-xs font-semibold text-slate-400">{sub.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 3: Subject Allocation Explanations */}
          {activeViewTab === "allocation" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                AI Subject Allocation Reasoning (+40% Weak Buffer System)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allocationExplanations.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 space-y-2 ${
                      item.isWeak
                        ? "border-amber-300 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20"
                        : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{item.subjectName}</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {item.allocatedHours} Hours
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{item.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: Spaced Revisions */}
          {activeViewTab === "revisions" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Spaced Revision Checkpoints (Ebbinghaus Recall Milestones)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {revisionSchedule.map((rev, rIdx) => (
                  <div
                    key={rIdx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <span className="rounded bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                      {formatDate(rev.date)}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-2 truncate">
                      {rev.subjectName}
                    </h5>
                    <p className="text-xs text-slate-500 line-clamp-1">{rev.chapterTitle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 5: Mock & Exam Sprints */}
          {activeViewTab === "mocks" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Timed Practice Tests & Pre-Exam Simulation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testSchedule.map((test, tIdx) => (
                  <div
                    key={tIdx}
                    className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        {test.subjectName}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        {formatDate(test.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{test.testTitle}</p>
                    <span className="mt-2 inline-block rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Duration: {test.durationHours} Hours Timed Simulation
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Add Missing Subject */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add Missing Subject from Date Sheet
            </h3>
            <p className="text-xs text-slate-500">
              Enter any subject present on your official schedule that was missed by automated OCR.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auditing and Ethics"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paper Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PAPER-5"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Examination Date
                </label>
                <input
                  type="date"
                  value={newSubExamDate}
                  onChange={(e) => setNewSubExamDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMissingSubject}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Overwrite Confirmation Modal */}
      {showConfirmOverwriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Timetable Overwrite
                </h3>
                <p className="text-xs text-slate-500">
                  You already have existing study sessions on your dashboard.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Applying this new timetable will replace your active dashboard study routine with these newly synthesized {generatedSessions.length} sessions.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmOverwriteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeApplyToDashboard}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500"
              >
                Yes, Apply to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
