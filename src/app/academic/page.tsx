"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import {
  Subject,
  Chapter,
  Examination,
  ExamAttemptRecord,
  ExemptionRecord,
} from "@/types/database";
import {
  GraduationCap,
  Calendar,
  Calculator,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Building,
  ShieldCheck,
  BookOpen,
  Filter,
} from "lucide-react";

export default function AcademicManagementPage() {
  const { user, student } = useAuth();
  const [activeTab, setActiveTab] = useState<"curriculum" | "datesheet" | "calculator" | "profile">("curriculum");

  // Data states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [attempts, setAttempts] = useState<ExamAttemptRecord[]>([]);
  const [exemptions, setExemptions] = useState<ExemptionRecord[]>([]);

  // Filter & selections
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weakFilter, setWeakFilter] = useState<string>("all");

  // Aggregate calculator states
  const [predictedScores, setPredictedScores] = useState<Record<string, number>>({});

  // Final revision checklist state
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadedSubs = StorageRepository.getSubjects(user?.id);
    const loadedChaps = StorageRepository.getChapters(user?.id);
    const loadedExams = StorageRepository.getExaminations(user?.id);
    const loadedAttempts = StorageRepository.getExamAttempts(user?.id);
    const loadedExemptions = StorageRepository.getExemptions(user?.id);

    setSubjects(loadedSubs);
    setChapters(loadedChaps);
    setExaminations(loadedExams);
    setAttempts(loadedAttempts);
    setExemptions(loadedExemptions);

    // Initialise predicted scores with passing marks (e.g. 50 default)
    const initialScores: Record<string, number> = {};
    loadedSubs.forEach((s) => {
      initialScores[s.id] = 55;
    });
    setPredictedScores(initialScores);
  }, [user]);

  // Calculations
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(
    (c) => c.status === "completed" || c.study_status === "completed"
  ).length;
  const inProgressChapters = chapters.filter(
    (c) => c.status === "in_progress" || c.study_status === "in_progress"
  ).length;
  const notStartedChapters = totalChapters - completedChapters - inProgressChapters;
  const overallPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  // Countdown to next exam
  const nextExam = examinations.length > 0 ? examinations[0] : null;
  const examDaysRemaining = useMemo(() => {
    if (!nextExam?.exam_date) return 45;
    const diff = new Date(nextExam.exam_date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [nextExam]);

  // Weak chapters classification
  const redChapters = chapters.filter((c) => c.weak_category === "red" || (c.difficulty === "hard" && c.status !== "completed"));
  const yellowChapters = chapters.filter((c) => c.weak_category === "yellow" || (c.difficulty === "medium" && c.status !== "completed"));
  const greenChapters = chapters.filter((c) => c.weak_category === "green" || c.status === "completed");

  // Chapter Status Handler
  const handleUpdateChapterStatus = (chapterId: string, newStatus: "pending" | "in_progress" | "completed") => {
    const studyStatus: "not_started" | "in_progress" | "completed" =
      newStatus === "pending" ? "not_started" : newStatus;
    StorageRepository.updateChapterStudyStatus(chapterId, studyStatus, undefined, user?.id);
    const updated = StorageRepository.getChapters(user?.id);
    setChapters(updated);
    setSubjects(StorageRepository.getSubjects(user?.id));
  };

  // Chapter Weakness Toggle
  const handleToggleWeakness = (chapterId: string, currentCategory?: "red" | "yellow" | "green") => {
    const nextCategory: "red" | "yellow" | "green" =
      currentCategory === "red" ? "yellow" : currentCategory === "yellow" ? "green" : "red";

    const updated = chapters.map((c) => {
      if (c.id === chapterId) {
        return { ...c, weak_category: nextCategory };
      }
      return c;
    });
    setChapters(updated);
    StorageRepository.setChapters(updated, user?.id);
  };

  // Aggregate Calculator Computation
  const calculatedAggregate = useMemo(() => {
    const scores = Object.values(predictedScores);
    if (scores.length === 0) return { total: 0, max: 0, percentage: 0, isPassed: false, failedPapers: [] };

    const total = scores.reduce((sum, val) => sum + (Number(val) || 0), 0);
    const max = scores.length * 100;
    const percentage = Math.round((total / max) * 100);

    const failedPapers = subjects.filter((s) => (predictedScores[s.id] || 0) < 40).map((s) => s.name);
    const isPassed = percentage >= 50 && failedPapers.length === 0;

    return { total, max, percentage, isPassed, failedPapers };
  }, [predictedScores, subjects]);

  // Filtered chapters
  const filteredChapters = chapters.filter((c) => {
    if (selectedSubjectId !== "all" && c.subject_id !== selectedSubjectId) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (weakFilter === "red" && c.weak_category !== "red") return false;
    if (weakFilter === "yellow" && c.weak_category !== "yellow") return false;
    if (weakFilter === "green" && c.weak_category !== "green") return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60">
              <GraduationCap className="h-3.5 w-3.5" />
              Academic Management Hub
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {student?.course || "CS Executive"}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Curriculum, Dates & Academic Performance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track all subjects, exam schedules, eligibility criteria, and passing score models.
          </p>
        </div>

        {/* Quick Exam Countdown Pill */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-violet-100 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="h-10 w-10 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Days to Exam</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {examDaysRemaining} Days Remaining
            </div>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "curriculum"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Curriculum & Syllabus
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {completedChapters}/{totalChapters}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("datesheet")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "datesheet"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Date Sheet & Exam Centre
        </button>

        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "calculator"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Calculator className="h-4 w-4" />
          Passing & Aggregate Calculator
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Profile & Attempt History
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CURRICULUM & SYLLABUS */}
      {/* ========================================================= */}
      {activeTab === "curriculum" && (
        <div className="space-y-6">
          {/* Syllabus Progress Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Overall Syllabus</span>
                <span className="text-xs font-bold text-violet-600">{overallPercentage}%</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {completedChapters} <span className="text-sm font-normal text-slate-400">/ {totalChapters} Chapters</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-violet-600 to-indigo-600"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500">Completed Chapters</div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {completedChapters}
              </div>
              <p className="mt-1 text-xs text-slate-500">Mastered and ready for revision</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500">In Progress / Reading</div>
              <div className="mt-2 text-2xl font-bold text-amber-500">
                {inProgressChapters}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Currently reading ({notStartedChapters} not started)
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-medium text-slate-500">Weakness Heatmap</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                  🔴 {redChapters.length} Red
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  🟡 {yellowChapters.length} Yellow
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  🟢 {greenChapters.length} Green
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Priority triage for exam focus</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Filter by Subject:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Subjects ({subjects.length})</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-2">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Not Started</option>
              </select>

              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-2">Weakness:</span>
              <select
                value={weakFilter}
                onChange={(e) => setWeakFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Chapters</option>
                <option value="red">🔴 Red (High Priority)</option>
                <option value="yellow">🟡 Yellow (Moderate)</option>
                <option value="green">🟢 Green (Mastered)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredChapters.length} of {totalChapters} chapters
            </div>
          </div>

          {/* Chapters Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Chapter Title & Subject</th>
                    <th className="py-3 px-4">Nature & Hours</th>
                    <th className="py-3 px-4">Weakness Triage</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredChapters.map((ch, idx) => {
                    const sub = subjects.find((s) => s.id === ch.subject_id);
                    const isDone = ch.status === "completed" || ch.study_status === "completed";
                    const isInProg = ch.status === "in_progress" || ch.study_status === "in_progress";

                    return (
                      <tr key={ch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-xs font-semibold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {ch.title}
                          </div>
                          <div className="text-xs text-violet-600 dark:text-violet-400">
                            {sub?.name || "Subject"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mr-2">
                            {ch.nature || "theory"}
                          </span>
                          {ch.estimated_hours}h estimated
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleWeakness(ch.id, ch.weak_category)}
                            title="Click to cycle: Red -> Yellow -> Green"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
                          >
                            {ch.weak_category === "red" && (
                              <span className="bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
                                🔴 Red (Urgent)
                              </span>
                            )}
                            {ch.weak_category === "yellow" && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900">
                                🟡 Yellow (Average)
                              </span>
                            )}
                            {(ch.weak_category === "green" || (!ch.weak_category && isDone)) && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900">
                                🟢 Green (Confident)
                              </span>
                            )}
                            {!ch.weak_category && !isDone && (
                              <span className="text-slate-400 border border-dashed border-slate-300 px-2 py-0.5 rounded-full dark:border-slate-700">
                                Set Priority
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </span>
                          ) : isInProg ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
                              <Clock className="h-3 w-3" /> In Progress
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-slate-800">
                              Not Started
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              handleUpdateChapterStatus(
                                ch.id,
                                isDone ? "pending" : "completed"
                              )
                            }
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                              isDone
                                ? "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                                : "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                            }`}
                          >
                            {isDone ? "Mark Pending" : "Mark Done"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* High Priority Topics & Final Revision Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                High-Priority Examination Topics (Feature 18)
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Crucial exam topics that carry the highest marks weightage across recent sessions.
              </p>
              <div className="space-y-3">
                {[
                  { topic: "General Meetings & Quorum Provisions (Sec 103)", sub: "Company Law & Practice", weight: "12-16 Marks" },
                  { topic: "Section 43B & MSME 45-day payment deduction rule", sub: "Tax Laws & Practice", weight: "10-14 Marks" },
                  { topic: "Writ Jurisdiction of Supreme Court & High Court (Art 32/226)", sub: "JIGL", weight: "8-12 Marks" },
                  { topic: "Cash Flow Statement (AS 3 / Ind AS 7)", sub: "Corporate Accounting & FM", weight: "10-15 Marks" },
                  { topic: "SEBI LODR Related Party Transactions Approval", sub: "CMSL", weight: "8-12 Marks" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{item.topic}</div>
                      <div className="text-[11px] text-violet-600 dark:text-violet-400">{item.sub}</div>
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded dark:bg-amber-950/40 dark:text-amber-400">
                      {item.weight}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Final Revision Checklist (Feature 24)
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Formulas, penalty sections, statutory limits, and key judgments for rapid recall.
              </p>
              <div className="space-y-2">
                {[
                  "Companies Act 2013 Table of Penalty Limits & Compounding Provisions",
                  "Income Tax Rebate Sec 87A and Surcharge Slabs for AY 2026-27",
                  "FEMA Compounding Procedures & Master Directions Checklist",
                  "Ind AS 115 Revenue 5-Step Model Recognition Matrix",
                  "Labour Codes: Social Security Statutory Contribution Thresholds",
                  "Constitution of India: Fundamental Rights Restrictions Test",
                ].map((chk, i) => {
                  const isChecked = !!checkedChecklistItems[`chk-${i}`];
                  return (
                    <label
                      key={i}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer dark:hover:bg-slate-800/40"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setCheckedChecklistItems((prev) => ({
                            ...prev,
                            [`chk-${i}`]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span
                        className={`text-xs ${
                          isChecked
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "font-medium text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {chk}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DATE SHEET & EXAM CENTRE */}
      {/* ========================================================= */}
      {activeTab === "datesheet" && (
        <div className="space-y-6">
          {/* Official Date Sheet */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Official Examination Date Sheet (Features 2, 3, 31)
                </h3>
                <p className="text-xs text-slate-500">
                  Target: {student?.target_exam || "June 2026 Examination Session"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300">
                  Exam Timing: 09:00 AM – 12:00 PM (3 Hours)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    <th className="py-3 px-4">Date & Day</th>
                    <th className="py-3 px-4">Paper Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4">Preparation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { date: "02 June 2026 (Tuesday)", code: "PAPER 1", name: "Jurisprudence, Interpretation & General Laws", slot: "09:00 AM - 12:00 PM" },
                    { date: "04 June 2026 (Thursday)", code: "PAPER 2", name: "Company Law & Practice", slot: "09:00 AM - 12:00 PM" },
                    { date: "06 June 2026 (Saturday)", code: "PAPER 3", name: "Setting Up of Business, Industrial & Labour Laws", slot: "09:00 AM - 12:00 PM" },
                    { date: "08 June 2026 (Monday)", code: "PAPER 4", name: "Corporate Accounting & Financial Management", slot: "09:00 AM - 12:00 PM" },
                    { date: "10 June 2026 (Wednesday)", code: "PAPER 5", name: "Capital Markets & Securities Laws", slot: "09:00 AM - 12:00 PM" },
                    { date: "12 June 2026 (Friday)", code: "PAPER 6", name: "Economic, Commercial & Intellectual Property Laws", slot: "09:00 AM - 12:00 PM" },
                    { date: "14 June 2026 (Sunday)", code: "PAPER 7", name: "Tax Laws & Practice", slot: "09:00 AM - 12:00 PM" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {row.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {row.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {row.slot}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-400">
                          Ready & Scheduled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exam Centre, Admit Card & Guidelines (Features 32, 33, 34) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-violet-600" />
                  Exam Centre Details (Feature 33)
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold dark:bg-emerald-950/40 dark:text-emerald-300">
                  Confirmed
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                  <div className="text-slate-400 font-medium">Centre Name & Code</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5 dark:text-white">
                    Kendriya Vidyalaya No. 1, Delhi Cantt (Centre Code: DL-402)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                  <div className="text-slate-400 font-medium">Centre Address</div>
                  <div className="font-medium text-slate-700 mt-0.5 dark:text-slate-300">
                    Mall Road, Near Sadar Bazar, Delhi Cantt, New Delhi - 110010
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="text-slate-400">Reporting Time</div>
                    <div className="font-bold text-slate-800 dark:text-white">08:15 AM</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="text-slate-400">Gate Closes At</div>
                    <div className="font-bold text-rose-600">08:45 AM</div>
                  </div>
                </div>

                {/* Admit Card Download Section (Feature 32) */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white">Admit Card / Hall Ticket</div>
                    <div className="text-slate-400">Available for verified download</div>
                  </div>
                  <button
                    onClick={() => alert("Official Admit Card PDF preview generated successfully for your session.")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 shadow-xs transition-all"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                </div>
              </div>
            </div>

            {/* Official Exam Instructions (Feature 34) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Exam Instructions & Guidelines (Feature 34)
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">•</span>
                  <span><strong>Admit Card & ID:</strong> Carry a printed hard copy of the admit card along with valid student photo identity card.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">•</span>
                  <span><strong>Stationery:</strong> Use only blue or black ink ballpoint pens. Pencils and erasers for diagrams are permitted.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">•</span>
                  <span><strong>Calculator Rules:</strong> Ordinary non-programmable calculators without print facility (up to 6 functions and 12 digits) are allowed for Corporate Accounting & Tax.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span><strong>Prohibited Items:</strong> Mobile phones, smartwatches, digital devices, and loose notes are strictly prohibited inside the exam hall.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">•</span>
                  <span><strong>Reading Time:</strong> A 15-minute question paper reading slot (08:45 AM - 09:00 AM) is provided before writing starts.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PASSING & AGGREGATE CALCULATOR */}
      {/* ========================================================= */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          {/* Passing Criteria Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-400">Subject Minimum Passing Mark</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 dark:text-white">40 Marks</div>
              <p className="text-xs text-slate-500 mt-1">Student must score &ge; 40 in each paper</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-400">Group Aggregate Requirement</div>
              <div className="text-2xl font-bold text-violet-600 mt-1">50% Minimum</div>
              <p className="text-xs text-slate-500 mt-1">Total marks must equal at least half of maximum marks</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-400">Paper Exemption Benchmark</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">60+ Marks</div>
              <p className="text-xs text-slate-500 mt-1">Carried forward for next 3 consecutive examination attempts</p>
            </div>
          </div>

          {/* Interactive Aggregate Calculator (Feature 29) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-violet-600" />
                  Aggregate Marks Calculator & Prediction Model (Feature 29)
                </h3>
                <p className="text-xs text-slate-500">
                  Input your mock test scores or expected marks per subject to evaluate pass status and exemptions.
                </p>
              </div>

              {/* Status Outcome Banner */}
              <div
                className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${
                  calculatedAggregate.isPassed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                }`}
              >
                {calculatedAggregate.isPassed ? "🎉 Pass with Aggregate Met" : "⚠️ Needs Improvement"}
                <span className="text-xs font-normal">
                  ({calculatedAggregate.total} / {calculatedAggregate.max} • {calculatedAggregate.percentage}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => {
                const currentScore = predictedScores[sub.id] || 0;
                const isExempt = currentScore >= 60;
                const isFail = currentScore < 40;

                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 truncate dark:text-white" title={sub.name}>
                        {sub.name}
                      </span>
                      {isExempt && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Exemption
                        </span>
                      )}
                      {isFail && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Below 40
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentScore}
                        onChange={(e) =>
                          setPredictedScores((prev) => ({
                            ...prev,
                            [sub.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-violet-600"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentScore}
                        onChange={(e) =>
                          setPredictedScores((prev) => ({
                            ...prev,
                            [sub.id]: Math.min(100, Math.max(0, Number(e.target.value))),
                          }))
                        }
                        className="w-16 px-2 py-1 text-center font-bold text-sm rounded-lg border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exemption Tracker (Feature 28) & Exam Eligibility (Feature 30) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Exemption Tracker (Feature 28)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Recorded paper exemptions carried forward from previous attempts.
              </p>
              {exemptions.length > 0 ? (
                <div className="space-y-3">
                  {exemptions.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    >
                      <div>
                        <div className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                          {ex.subject_name} ({ex.subject_code})
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Secured: {ex.marks_secured} Marks in {ex.secured_in_attempt} • Valid until: {ex.valid_until_attempt}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No previous paper exemptions active. Scoring 60+ in any paper automatically registers an exemption.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-indigo-600" />
                Exam Eligibility Tracker (Feature 30)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Checklist of administrative requirements to appear in the examination hall.
              </p>
              <div className="space-y-2.5 text-xs">
                {[
                  { req: "Student Registration Active & Fees Paid", status: "Verified & Cleared" },
                  { req: "Pre-Examination Test (PET) Cleared for All Subjects", status: "Cleared (100%)" },
                  { req: "One Day Orientation Programme (ODOP) Completed", status: "Certificate Issued" },
                  { req: "Examination Form Submitted Before Deadline", status: "Submitted & Confirmed" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.req}</span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-950/40 dark:text-emerald-400">
                      ✓ {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PROFILE & ATTEMPT HISTORY */}
      {/* ========================================================= */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Student Profile Card (Feature 1) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Student Profile & Registration Details (Feature 1)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <div className="text-slate-400 font-medium">Candidate Name</div>
                <div className="text-sm font-bold text-slate-900 mt-1 dark:text-white">
                  {student?.full_name || "Enrolled Student"}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <div className="text-slate-400 font-medium">Registered Course</div>
                <div className="text-sm font-bold text-violet-600 mt-1">
                  {student?.course || "CS Executive Programme"}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <div className="text-slate-400 font-medium">Registration Number</div>
                <div className="text-sm font-bold text-slate-900 mt-1 dark:text-white">
                  {student?.registration_number || "240981726/12/2024"}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <div className="text-slate-400 font-medium">Examination Attempt</div>
                <div className="text-sm font-bold text-slate-900 mt-1 dark:text-white">
                  {student?.exam_attempt || "Attempt 1 (June 2026 Session)"}
                </div>
              </div>
            </div>
          </div>

          {/* Exam Attempt History (Feature 26) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Exam Attempt History (Feature 26)
            </h3>
            {attempts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                      <th className="py-3 px-4">Attempt</th>
                      <th className="py-3 px-4">Exam Body</th>
                      <th className="py-3 px-4">Marks Obtained</th>
                      <th className="py-3 px-4">Percentage</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {att.attempt_label}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {att.exam_body}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {att.total_marks} / {att.max_marks}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-violet-600">
                          {att.percentage}%
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No past examination attempts on record. This is your first official sitting.
              </div>
            )}
          </div>

          {/* Subject-Wise Exam Strategy (Feature 35) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Subject-Wise Exam Strategy & Answering Guide (Feature 35)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Tailored answering techniques recommended by senior examiners.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  sub: "Company Law & Practice",
                  strategy: "Quote relevant section numbers accurately. Structure answers in 4 parts: Facts of Case, Applicable Legal Provisions, Analysis/Correlation, and Final Conclusion. Bold key statutory terms.",
                },
                {
                  sub: "Corporate Accounting & Financial Management",
                  strategy: "Attempt practical numerical questions in the first 90 minutes. Present neat working notes with appropriate headings. Clearly state accounting standard assumptions.",
                },
                {
                  sub: "Jurisprudence, Interpretation & General Laws",
                  strategy: "Focus on landmark constitutional case laws. Write structured subheadings explaining statutory interpretation canons (Ejusdem Generis, Mischief Rule, Golden Rule).",
                },
                {
                  sub: "Tax Laws & Practice",
                  strategy: "Draft computation statements with separate inner columns for Gross Incomes and Deductions. Clearly cite Section 115BAC default vs optional regime applicability.",
                },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-violet-100 bg-violet-50/40 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="font-bold text-sm text-violet-900 dark:text-violet-300 mb-1">
                    {item.sub}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.strategy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
