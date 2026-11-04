"use client";

import React, { useEffect, useState } from "react";
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
  Clock,
  Sparkles,
} from "lucide-react";
import { Student } from "@/types/database";

interface StudentSummaryItem {
  student: Student;
  totalMinutesStudied: number;
  sessionsCount: number;
  timetableCreated: boolean;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentSummaryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadStudents = () => {
    const list = StorageRepository.getAllStudentsSummary();
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleToggleStatus = (studentId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    const ok = StorageRepository.toggleStudentStatus(studentId, nextStatus);
    if (ok) {
      setFeedbackMessage(`Student account status updated to ${nextStatus}.`);
      loadStudents();
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const filteredStudents = students.filter((item) => {
    const matchesSearch =
      item.student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse =
      selectedCourse === "all" || item.student.course === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const availableCourses = Array.from(
    new Set(students.map((s) => s.student.course).filter(Boolean))
  );

  return (
    <AdminAppShell pageTitle="Student Directory & Account Governance">
      <div className="space-y-6">
        {/* Strict Student Privacy Banner */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shrink-0 shadow-xs">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-purple-900">
                Student Privacy & Data Protection Safeguards
              </h3>
              <p className="mt-0.5 text-xs text-purple-800/80 leading-relaxed">
                Administrative access is restricted to academic metadata, course enrollment, target
                examination dates, and account status. Personal student study notes, private
                markdown files, and uploaded document attachments remain strictly private and
                isolated from administrator inspection.
              </p>
            </div>
          </div>
        </div>

        {feedbackMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600 shadow-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold">Course:</span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Enrolled Courses</option>
                {availableCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Student Profile</th>
                  <th className="px-6 py-4">Enrolled Course</th>
                  <th className="px-6 py-4">Target Examination</th>
                  <th className="px-6 py-4">Study Volume</th>
                  <th className="px-6 py-4">Timetable</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No matching students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(({ student, totalMinutesStudied, sessionsCount, timetableCreated }) => {
                    const isSuspended = student.status === "suspended";
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-200">
                              {student.full_name?.charAt(0) || "S"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{student.full_name || "Enrolled Student"}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-md bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700 border border-purple-200">
                            {student.course || "General Curriculum"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-purple-600" />
                            <span>{student.target_exam || "Scheduled"}</span>
                          </div>
                          {student.upcoming_exam_date && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {student.upcoming_exam_date}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{(totalMinutesStudied / 60).toFixed(1)} hrs</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {sessionsCount} sessions logged
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {timetableCreated ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <Sparkles className="h-3 w-3" />
                              Generated
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Pending</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              isSuspended
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isSuspended ? "Suspended" : "Active"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(student.id, student.status)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              isSuspended
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                          >
                            {isSuspended ? (
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
