"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import {
  CareerProgressRecord,
  ExamAttemptRecord,
  ExemptionRecord,
} from "@/types/database";
import {
  Briefcase,
  Award,
  CheckCircle2,
  Calendar,
  Building,
  FileText,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function CareerResultsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "results" | "exemptions" | "internship" | "resume" | "placements"
  >("results");

  const [attempts, setAttempts] = useState<ExamAttemptRecord[]>([]);
  const [exemptions, setExemptions] = useState<ExemptionRecord[]>([]);
  const [careerProgress, setCareerProgress] = useState<CareerProgressRecord | null>(null);

  useEffect(() => {
    const atts = StorageRepository.getExamAttempts(user?.id);
    const exms = StorageRepository.getExemptions(user?.id);
    const prog = StorageRepository.getCareerProgress(user?.id);

    setAttempts(atts);
    setExemptions(exms);
    setCareerProgress(prog);
  }, [user]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60">
              <Briefcase className="h-3.5 w-3.5" />
              Post-Exam & Career Development Hub
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Result Analytics, Training & Placement Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track examination results, monitor exemption carry-forward, log mandatory internship training, and build your corporate compliance career.
          </p>
        </div>
      </div>

      {/* Primary Submenu Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "results"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Award className="h-4 w-4" />
          Result Tracker & Status (Features 101, 102, 103)
        </button>

        <button
          onClick={() => setActiveTab("exemptions")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "exemptions"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Next Attempt & Exemptions (Features 104, 105)
        </button>

        <button
          onClick={() => setActiveTab("internship")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "internship"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Building className="h-4 w-4" />
          Internship & Training (Features 106, 107)
        </button>

        <button
          onClick={() => setActiveTab("resume")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "resume"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FileText className="h-4 w-4" />
          Skills & Certifications (Features 108, 109)
        </button>

        <button
          onClick={() => setActiveTab("placements")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "placements"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Placement & Trainee Opportunities (Feature 110)
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RESULT TRACKER & ANALYSIS (Features 101, 102, 103) */}
      {/* ========================================================= */}
      {activeTab === "results" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Official Examination Results Archive (Features 101, 102, 103)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Subject-wise marks breakdowns, aggregate totals, and qualification status from past sittings.
            </p>

            {attempts.map((att) => (
              <div
                key={att.id}
                className="mb-6 p-5 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                      {att.exam_body} • Roll No: {att.roll_number}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {att.attempt_label}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {att.total_marks} / {att.max_marks}
                      </div>
                      <div className="text-xs font-bold text-violet-600">{att.percentage}% Aggregate</div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {att.status}
                    </span>
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                        <th className="py-2">Subject Code</th>
                        <th className="py-2">Subject Name</th>
                        <th className="py-2 text-right">Marks Obtained</th>
                        <th className="py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {att.marks_breakdown.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-700/30">
                          <td className="py-2.5 font-bold text-violet-600">{m.subject_code}</td>
                          <td className="py-2.5 text-slate-800 dark:text-slate-200">{m.subject_name}</td>
                          <td className="py-2.5 font-bold text-right text-slate-900 dark:text-white">
                            {m.marks_obtained} / {m.max_marks}
                          </td>
                          <td className="py-2.5 text-center">
                            {m.is_exemption ? (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Exemption (60+)
                              </span>
                            ) : m.passed ? (
                              <span className="text-emerald-600 font-semibold">Cleared (40+)</span>
                            ) : (
                              <span className="text-rose-600 font-semibold">Below 40</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: NEXT ATTEMPT & EXEMPTIONS (Features 104, 105) */}
      {/* ========================================================= */}
      {activeTab === "exemptions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-violet-600" />
                Next Attempt Planner (Feature 104)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Strategic target allocation for your upcoming examination sitting.
              </p>
              <div className="p-4 rounded-xl bg-violet-50 text-xs text-slate-700 space-y-2 dark:bg-violet-950/30 dark:text-slate-300 border border-violet-100 dark:border-violet-900">
                <div className="font-bold text-violet-900 dark:text-violet-200">
                  Target: June 2026 CS Executive Examination
                </div>
                <p>
                  Having secured Group 1 qualification with an exemption in Company Law (62 Marks), your upcoming focus is exclusively Group 2:
                </p>
                <ul className="list-disc list-inside space-y-1 font-semibold text-slate-800 dark:text-slate-200">
                  <li>Paper 5: Capital Markets & Securities Laws (CMSL)</li>
                  <li>Paper 6: Economic, Commercial & Intellectual Property Laws (ECIPL)</li>
                  <li>Paper 7: Tax Laws & Practice</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-emerald-600" />
                Exemption Carry-Forward Ledger (Feature 105)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Statutory validity of exempted subjects across 3 consecutive examinations.
              </p>
              {exemptions.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                >
                  <div className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                    {ex.subject_name} ({ex.subject_code})
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                    Score: {ex.marks_secured} Marks • Secured: {ex.secured_in_attempt}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                    Valid Until: {ex.valid_until_attempt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: INTERNSHIP & ARTICLES TRAINING (Features 106, 107) */}
      {/* ========================================================= */}
      {activeTab === "internship" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Mandatory Practical Training & Articleship Tracker (Features 106, 107)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Track your 21-month mandatory Executive Development and Practical Training with accredited secretarial firms or corporates.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <div className="text-xs text-slate-400">Training Firm / Corporate</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {careerProgress?.firm_name || "Apex Corporate Advisory LLP"}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <div className="text-xs text-slate-400">Training Days Completed</div>
                <div className="text-sm font-bold text-violet-600 mt-1">
                  {careerProgress?.total_training_days_completed || 180} / 630 Days (29%)
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <div className="text-xs text-slate-400">Internship Status</div>
                <div className="text-sm font-bold text-emerald-600 mt-1">
                  Ongoing & Form Verified
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <span className="font-bold text-slate-800 dark:text-white">Quarterly Report Status: </span>
              Quarter 1 & 2 progress reports submitted and countersigned by Principal Trainer. Quarter 3 due on 31 March 2026.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SKILLS & CERTIFICATIONS (Features 108, 109) */}
      {/* ========================================================= */}
      {activeTab === "resume" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Corporate Governance Resume & Certifications (Features 108, 109)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Track specialized professional skill certifications and industry-ready compliance capabilities.
            </p>

            <div className="space-y-3 mb-6">
              {careerProgress?.certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{cert}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Verified
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert("Professional Compliance Resume generated in standardized CS Trainee format.")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 shadow-xs"
            >
              <FileText className="h-4 w-4" /> Download Standardized CS Resume
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PLACEMENTS & TRAINEE OPPORTUNITIES (Feature 110) */}
      {/* ========================================================= */}
      {activeTab === "placements" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Management Trainee & Compliance Placement Board (Feature 110)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Active vacancies and internship positions with accredited corporate secretarial firms and listed entities.
            </p>

            <div className="space-y-3">
              {[
                {
                  company: "Tata Consultancy Services Ltd. (Corporate Secretarial Dept)",
                  role: "Management Trainee - Secretarial & Legal Compliance",
                  stipend: "₹25,000 / Month",
                  location: "Mumbai / Bengaluru",
                  status: "Applications Open",
                },
                {
                  company: "Deloitte Touche Tohmatsu India LLP",
                  role: "Analyst - Corporate Governance & Secretarial Audit",
                  stipend: "₹28,000 / Month",
                  location: "Gurugram / New Delhi",
                  status: "Shortlisting Active",
                },
                {
                  company: "HDFC Bank Legal Cell",
                  role: "Executive Trainee - Regulatory Filing & RBI Compliance",
                  stipend: "₹24,000 / Month",
                  location: "Mumbai",
                  status: "Applications Open",
                },
              ].map((job, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{job.company}</div>
                    <div className="text-xs text-violet-600 font-semibold mt-0.5">{job.role}</div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-3">
                      <span>Stipend: {job.stipend}</span>
                      <span>•</span>
                      <span>Location: {job.location}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Application submitted to ${job.company} with your verified profile credentials.`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 shadow-xs shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Apply Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
