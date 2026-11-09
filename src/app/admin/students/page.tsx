"use client";

import React, { useEffect, useState, useCallback } from "react";
import AdminAppShell from "@/components/admin/AdminAppShell";
import { StorageRepository } from "@/lib/storage";
import {
  Search,
  Filter,
  ShieldCheck,
  Lock,
  UserCheck,
  UserX,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Student } from "@/types/database";

interface StudentDisplayItem {
  student: Student;
  totalMinutesStudied: number;
  sessionsCount: number;
  timetableCreated: boolean;
}

const DEFAULT_COURSES = [
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

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentDisplayItem[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>(DEFAULT_COURSES);
  const [databaseConnected, setDatabaseConnected] = useState<boolean>(true);
  const [databaseConfigError, setDatabaseConfigError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch live students from backend API (connected to Supabase PostgreSQL)
      const res = await fetch("/api/admin/students", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const apiStudents: Student[] = data.students || [];

      if (Array.isArray(data.courses) && data.courses.length > 0) {
        setAvailableCourses(data.courses);
      }

      if (typeof data.databaseConnected === "boolean") {
        setDatabaseConnected(data.databaseConnected);
      }

      if (data.databaseConfigError) {
        setDatabaseConfigError(data.databaseConfigError);
      } else {
        setDatabaseConfigError(null);
      }

      // Correlate with local metrics (study time, sessions, timetables) if available
      const localSummaries = StorageRepository.getAllStudentsSummary();
      const localMetricsMap = new Map<string, { minutes: number; sessions: number; timetable: boolean }>();

      localSummaries.forEach((item) => {
        const key = (item.student.email || item.student.id || "").toLowerCase();
        localMetricsMap.set(key, {
          minutes: item.totalMinutesStudied,
          sessions: item.sessionsCount,
          timetable: item.timetableCreated,
        });
      });

      const displayList: StudentDisplayItem[] = apiStudents.map((s) => {
        const key = (s.email || s.id || "").toLowerCase();
        const metrics = localMetricsMap.get(key);
        return {
          student: s,
          totalMinutesStudied: metrics ? metrics.minutes : 0,
          sessionsCount: metrics ? metrics.sessions : 0,
          timetableCreated: metrics ? metrics.timetable : false,
        };
      });

      setStudents(displayList);
    } catch (err: unknown) {
      console.error("Failed to load students:", err);
      try {
        const local = StorageRepository.getAllStudentsSummary();
        if (local.length > 0) {
          setStudents(local);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load students from database.");
        }
      } catch {
        setError(err instanceof Error ? err.message : "Failed to load students from database.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleToggleStatus = async (studentId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    setUpdatingId(studentId);

    try {
      // 1. Send update to API to persist change in Supabase PostgreSQL
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update account status on server.");
      }

      // 2. Update local state optimistically
      setStudents((prev) =>
        prev.map((item) =>
          item.student.id === studentId
            ? { ...item, student: { ...item.student, status: nextStatus } }
            : item
        )
      );

      // Also sync local storage
      StorageRepository.toggleStudentStatus(studentId, nextStatus);

      setFeedbackMessage(`Student account status updated to ${nextStatus}.`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: unknown) {
      console.error("Error updating student status:", err);
      StorageRepository.toggleStudentStatus(studentId, nextStatus);
      setStudents((prev) =>
        prev.map((item) =>
          item.student.id === studentId
            ? { ...item, student: { ...item.student, status: nextStatus } }
            : item
        )
      );
      setFeedbackMessage(`Account updated locally to ${nextStatus}.`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStudents = students.filter((item) => {
    const matchesSearch =
      (item.student.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.student.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse =
      selectedCourse === "all" || item.student.course === selectedCourse;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && item.student.status !== "suspended") ||
      (selectedStatus === "suspended" && item.student.status === "suspended");

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recent";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "Recent";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <AdminAppShell pageTitle="Student Directory & Account Governance">
      <div className="space-y-6">
        {/* Supabase Disconnected Warning Banner */}
        {!databaseConnected && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Supabase Database Environment Variables Required on Vercel
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  {databaseConfigError ||
                    "The admin portal is running in offline mode because database variables are missing in Vercel. Newly registered students from other devices will not sync until the following variables are set in your Vercel Project Settings:"}
                </p>
                <div className="pt-1.5 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="rounded-md bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 font-bold text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    NEXT_PUBLIC_SUPABASE_URL
                  </span>
                  <span className="rounded-md bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 font-bold text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </span>
                  <span className="rounded-md bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 font-bold text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    SUPABASE_SERVICE_ROLE_KEY
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strict Student Privacy Banner */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/60 dark:border-purple-900/60 dark:bg-purple-950/40 p-4 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shrink-0 shadow-xs">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                Student Privacy & Data Protection Safeguards
              </h3>
              <p className="mt-0.5 text-xs text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
                Administrative access is restricted to academic metadata, course enrollment, target
                examination dates, registration timestamps, and account status. Personal student study notes,
                uploaded private files, and password credentials remain securely encrypted and isolated.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium animate-fade-in">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchStudents()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-800 px-3 py-1 font-semibold text-rose-900 dark:text-rose-200 transition"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Course Filter */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-500 dark:text-slate-400">Course:</span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-800">All Courses ({students.length})</option>
                {availableCourses.map((c) => (
                  <option key={c} value={c} className="dark:bg-slate-800">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-800">All Statuses</option>
                <option value="active" className="dark:bg-slate-800">Active Only</option>
                <option value="suspended" className="dark:bg-slate-800">Suspended Only</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchStudents()}
              disabled={isLoading}
              title="Refresh database records"
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-purple-600 dark:text-purple-400 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs transition-colors">
          {isLoading ? (
            /* Loading State */
            <div className="py-20 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Loading registered student accounts from Supabase PostgreSQL...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {searchTerm || selectedCourse !== "all" || selectedStatus !== "all"
                  ? "No matching student accounts found"
                  : "No students registered yet"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchTerm || selectedCourse !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your search terms or clearing course and status filters."
                  : "When students create accounts on StudyMate AI, their profiles, enrollments, and statuses will appear here in real time."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Student Profile</th>
                    <th className="px-6 py-4">Enrolled Course</th>
                    <th className="px-6 py-4">Target Examination</th>
                    <th className="px-6 py-4">Registered Date</th>
                    <th className="px-6 py-4">Account Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map(({ student }) => {
                    const isSuspended = student.status === "suspended";
                    const isUpdating = updatingId === student.id;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        {/* Student Name & Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-900">
                              {student.full_name?.charAt(0).toUpperCase() || "S"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {student.full_name || "Enrolled Student"}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Enrolled Course */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="inline-block rounded-md bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                              {student.course || "General Curriculum"}
                            </span>
                            {student.semester && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {student.semester}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Target Examination */}
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            <span className="font-medium">{student.target_exam || "Scheduled Examination"}</span>
                          </div>
                          {student.upcoming_exam_date && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {student.upcoming_exam_date}
                            </span>
                          )}
                        </td>

                        {/* Registration Date */}
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {formatDate(student.created_at)}
                        </td>

                        {/* Account Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              isSuspended
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
                            }`}
                          >
                            {isSuspended ? "Suspended" : "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(student.id, student.status)}
                            disabled={isUpdating}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 cursor-pointer ${
                              isSuspended
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900"
                            }`}
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : isSuspended ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Reactivate</span>
                              </>
                            ) : (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                <span>Suspend</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminAppShell>
  );
}
