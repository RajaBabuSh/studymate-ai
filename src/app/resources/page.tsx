"use client";

import React, { useState, useEffect } from "react";
import { StorageRepository } from "@/lib/storage";
import { Announcement } from "@/types/database";
import {
  HelpCircle,
  FileText,
  Download,
  Users,
  Bell,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function ResourcesSupportPage() {
  const [activeTab, setActiveTab] = useState<
    "pyq_library" | "amendments" | "announcements" | "mentors" | "groups"
  >("pyq_library");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const list = StorageRepository.getAnnouncements();
    setAnnouncements(list);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60">
              <HelpCircle className="h-3.5 w-3.5" />
              Resources & Support Hub
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Official Syllabus, PYQ Libraries & Mentor Support
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Access verified examination question papers, suggested answer guidelines, statutory amendments, and mentor directory.
          </p>
        </div>
      </div>

      {/* Primary Submenu Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("pyq_library")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "pyq_library"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FileText className="h-4 w-4" />
          PYQ & Suggested Answers (Features 81, 82)
        </button>

        <button
          onClick={() => setActiveTab("amendments")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "amendments"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Official Syllabus & Amendments (Feature 83)
        </button>

        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "announcements"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Bell className="h-4 w-4" />
          Announcements & Alerts (Features 22, 84, 90)
        </button>

        <button
          onClick={() => setActiveTab("mentors")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "mentors"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Faculty & Mentors (Feature 85)
        </button>

        <button
          onClick={() => setActiveTab("groups")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "groups"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Peer Study Groups & Forum (Features 87, 88, 89)
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PYQ & SUGGESTED ANSWERS LIBRARY (Features 81, 82) */}
      {/* ========================================================= */}
      {activeTab === "pyq_library" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Official Previous Year Question Papers & Suggested Answers
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Official past examination question papers paired with ICSI model suggested answers and marking schemes.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    <th className="py-3 px-4">Session</th>
                    <th className="py-3 px-4">Subject & Paper</th>
                    <th className="py-3 px-4">Suggested Answers</th>
                    <th className="py-3 px-4 text-right">Download Resource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { session: "December 2024", sub: "Jurisprudence, Interpretation & General Laws (JIGL)", code: "Paper 1" },
                    { session: "December 2024", sub: "Company Law & Practice (CLP)", code: "Paper 2" },
                    { session: "June 2024", sub: "Setting Up of Business, Industrial & Labour Laws (SBIL)", code: "Paper 3" },
                    { session: "June 2024", sub: "Corporate Accounting & Financial Management (CAFM)", code: "Paper 4" },
                    { session: "December 2023", sub: "Capital Markets & Securities Laws (CMSL)", code: "Paper 5" },
                    { session: "December 2023", sub: "Economic, Commercial & Intellectual Property Laws (ECIPL)", code: "Paper 6" },
                    { session: "June 2023", sub: "Tax Laws & Practice", code: "Paper 7" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {row.session}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{row.sub}</div>
                        <div className="text-xs text-violet-600">{row.code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> Full Model Answers Included
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => alert(`Downloading verified question paper & suggested answers for ${row.sub} (${row.session})`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-all dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900"
                        >
                          <Download className="h-3.5 w-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: OFFICIAL SYLLABUS & AMENDMENTS (Feature 83) */}
      {/* ========================================================= */}
      {activeTab === "amendments" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Official Syllabus & Statutory Amendments Digest (Feature 83)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Statutory circulars, MCA notifications, and CBDT amendments applicable for upcoming examination sessions.
            </p>

            <div className="space-y-4">
              {[
                {
                  title: "Finance Act 2024 Direct Tax Amendments (AY 2025-26 / 2026-27)",
                  body: "Section 115BAC new default tax regime slabs revised standard deduction increased to ₹75,000. Capital gains taxation reform under Section 112A (STT-paid LTCG @ 12.5% over ₹1.25 Lakh).",
                  date: "Notification: CBDT Circular 14/2024",
                  applicable: "Applicable for June 2026 Examination",
                },
                {
                  title: "Companies (Significant Beneficial Ownership) Second Amendment Rules",
                  body: "Mandatory reporting timelines for identification of SBO and reporting under Form BEN-2. Strict reporting compliance by designated partners and reporting companies.",
                  date: "Notification: MCA GSR 712(E)",
                  applicable: "Applicable for Company Law Paper 2",
                },
                {
                  title: "SEBI (LODR) Amendments on Market Rumours Verification",
                  body: "Mandatory confirmation, denial, or clarification of market rumours by top 100 and top 250 listed entities within 24 hours of material price movement.",
                  date: "Notification: SEBI/LAD-NRO/GN/2024/181",
                  applicable: "Applicable for CMSL Paper 5",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                      {item.applicable}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                    {item.body}
                  </p>
                  <div className="text-[11px] text-slate-400 font-medium">{item.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ANNOUNCEMENTS & ALERTS (Features 22, 84, 90) */}
      {/* ========================================================= */}
      {activeTab === "announcements" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Important Examination Announcements & Deadlines (Features 22, 90)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Official institutional notifications regarding enrollment forms, admit card release, and exam schedules.
            </p>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-xl border border-violet-100 bg-violet-50/40 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-violet-900 dark:text-violet-300">{ann.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-violet-200 text-violet-900 dark:bg-violet-900 dark:text-violet-200">
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ann.content}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-2">
                    Target: {ann.target_course} • Published by: {ann.author_email || "Lead Academic Office"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FACULTY & MENTORS (Feature 85) */}
      {/* ========================================================= */}
      {activeTab === "mentors" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Faculty & Academic Mentors Directory (Feature 85)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Reach out to subject matter specialists during designated weekly academic office hours.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "CS Rajeev Sharma, FCS, LL.B.",
                  sub: "Company Law & Practice / CMSL",
                  hours: "Tue & Thu: 04:00 PM - 06:00 PM",
                  email: "rajeev.sharma@studymate.ai",
                  bio: "22 years of corporate secretarial practice. Former Chairman of NIRC secretarial chapter.",
                },
                {
                  name: "CA Ananya Deshmukh, FCA",
                  sub: "Corporate Accounting & FM / Tax Laws",
                  hours: "Mon & Wed: 03:00 PM - 05:00 PM",
                  email: "ananya.deshmukh@studymate.ai",
                  bio: "Specialist in Ind AS implementation and direct taxation computation models.",
                },
                {
                  name: "Adv. Vikram Mehra, LL.M. (Constitutional Law)",
                  sub: "Jurisprudence, Interpretation & General Laws",
                  hours: "Friday: 02:00 PM - 05:00 PM",
                  email: "vikram.mehra@studymate.ai",
                  bio: "Supreme Court advocate and academic researcher in statutory interpretation jurisprudence.",
                },
                {
                  name: "Dr. Meenakshi Iyer, Ph.D. (Labour Law)",
                  sub: "Setting Up of Business, Industrial & Labour Laws",
                  hours: "Saturday: 10:00 AM - 01:00 PM",
                  email: "meenakshi.iyer@studymate.ai",
                  bio: "Author of comprehensive commentaries on the new Indian Labour Codes.",
                },
              ].map((mentor, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{mentor.name}</div>
                  <div className="text-xs text-violet-600 font-semibold mb-2">{mentor.sub}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{mentor.bio}</p>
                  <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span>Office Hours: {mentor.hours}</span>
                    <a
                      href={`mailto:${mentor.email}`}
                      className="text-violet-600 font-bold hover:underline"
                    >
                      Email Mentor
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PEER STUDY GROUPS & FORUM (Features 87, 88, 89) */}
      {/* ========================================================= */}
      {activeTab === "groups" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Peer Study Groups & Material Sharing (Features 87, 88, 89)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Connect with fellow students preparing for the same examination session. Discuss doubts and exchange revision resources.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "CS Executive June 2026 - Group 1 Discussion Circle",
                  focus: "Company Law, JIGL & SBIL",
                  members: 248,
                  schedule: "Every Evening at 09:00 PM",
                },
                {
                  title: "Corporate Accounting & FM Numerical Problem Solvers",
                  focus: "Working Capital, WACC & Cash Flow Problem Sets",
                  members: 194,
                  schedule: "Saturday Morning 10:30 AM",
                },
                {
                  title: "Direct Tax & GST Case Studies Discussion Group",
                  focus: "AY 2025-26 & 2026-27 Tax amendments and computational drills",
                  members: 312,
                  schedule: "Sunday at 04:00 PM",
                },
                {
                  title: "Daily 5:00 AM Miracle Study Group (Virtual Library)",
                  focus: "Silent timed Pomodoro focus sessions",
                  members: 520,
                  schedule: "Daily 05:00 AM – 08:00 AM",
                },
              ].map((grp, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{grp.title}</div>
                  <div className="text-xs text-violet-600 font-semibold mb-2">{grp.focus}</div>
                  <div className="text-xs text-slate-500 mb-4">
                    Active Members: {grp.members} Students • Session: {grp.schedule}
                  </div>
                  <button
                    onClick={() => alert(`Joined ${grp.title}! Channel invite activated.`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 shadow-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Join Circle
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
