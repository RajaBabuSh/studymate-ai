"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Video,
  ShieldCheck,
  FileCheck2,
  BrainCircuit,
  Zap,
  Target,
  FileQuestion,
  Calculator,
  Timer,
  ChevronDown,
  Sun,
  Moon,
  Lock,
  RotateCcw,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { loginAsGuest } = useAuth();

  // Interactive Timetable Simulator State
  const [simCourse, setSimCourse] = useState("CA Intermediate");
  const [simHours, setSimHours] = useState(4.5);
  const [simTimePref, setSimTimePref] = useState<"morning" | "evening">("morning");
  const [simTargetDays, setSimTargetDays] = useState(60);
  const [simulating, setSimulating] = useState(false);
  const [simulatedSchedule, setSimulatedSchedule] = useState([
    {
      time: "07:00 - 08:30 AM",
      subject: "Advanced Accounting",
      chapter: "Amalgamation & Goodwill AS 14",
      nature: "numerical",
      slot: "Morning Peak Alertness",
      color: "from-blue-600 to-indigo-600",
    },
    {
      time: "08:45 - 10:15 AM",
      subject: "Taxation (GST & Direct Tax)",
      chapter: "PGBP Deductions & MSME Sec 43B(h)",
      nature: "numerical",
      slot: "Intense Numerical Drill",
      color: "from-indigo-600 to-violet-600",
    },
    {
      time: "06:00 - 07:30 PM",
      subject: "Corporate & Other Laws",
      chapter: "Directors Appointment & Powers",
      nature: "theory",
      slot: "Active Recall & Short Notes",
      color: "from-violet-600 to-purple-600",
    },
  ]);

  // Dashboard Preview Tab State
  const [activePreviewTab, setActivePreviewTab] = useState<"today" | "streak" | "intelligence">("today");

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleGuestDemo = () => {
    loginAsGuest();
    router.push("/dashboard");
  };

  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      if (simCourse.includes("CA")) {
        setSimulatedSchedule([
          {
            time: simTimePref === "morning" ? "06:30 - 08:30 AM" : "05:00 - 07:00 PM",
            subject: "Advanced Accounting",
            chapter: "AS 14 Amalgamation & Capital Reserve",
            nature: "numerical",
            slot: "High Weightage Morning Slot",
            color: "from-blue-600 to-indigo-600",
          },
          {
            time: simTimePref === "morning" ? "08:45 - 10:15 AM" : "07:15 - 08:45 PM",
            subject: "Cost and Management Accounting",
            chapter: "Standard Costing & Variance Analysis",
            nature: "practical",
            slot: "Circadian Alert Peak Slot",
            color: "from-indigo-600 to-violet-600",
          },
          {
            time: "09:30 - 10:30 PM",
            subject: "Corporate & Other Laws",
            chapter: "Management & Administration (Sec 88-122)",
            nature: "theory",
            slot: "Active Recall & Revision",
            color: "from-violet-600 to-purple-600",
          },
        ]);
      } else if (simCourse.includes("CS")) {
        setSimulatedSchedule([
          {
            time: "07:00 - 08:30 AM",
            subject: "Company Law & Practice",
            chapter: "Board Governance & Secretarial Standards",
            nature: "theory",
            slot: "Critical Provision Retention",
            color: "from-violet-600 to-indigo-600",
          },
          {
            time: "08:45 - 10:15 AM",
            subject: "Securities Laws & Capital Markets",
            chapter: "SEBI (ICDR) Regulations 2018",
            nature: "practical",
            slot: "Case Study & Clause Analysis",
            color: "from-blue-600 to-cyan-600",
          },
          {
            time: "06:00 - 07:30 PM",
            subject: "Corporate Accounting & Tax",
            chapter: "Valuation of Shares & Debentures",
            nature: "numerical",
            slot: "Evening Numerical Practice",
            color: "from-indigo-600 to-purple-600",
          },
        ]);
      } else {
        setSimulatedSchedule([
          {
            time: "07:00 - 08:30 AM",
            subject: "Financial Accounting",
            chapter: "Partnership Dissolution & Piecemeal",
            nature: "numerical",
            slot: "Step-by-Step Numerical Practice",
            color: "from-blue-600 to-indigo-600",
          },
          {
            time: "08:45 - 10:00 AM",
            subject: "Business Statistics & Analytics",
            chapter: "Probability & Normal Distribution",
            nature: "numerical",
            slot: "Formula Recall & Calculation Drills",
            color: "from-indigo-600 to-violet-600",
          },
          {
            time: "06:30 - 07:45 PM",
            subject: "Business Organization & Management",
            chapter: "Strategic Planning & Organizational Structure",
            nature: "theory",
            slot: "Concept Understanding & Notes",
            color: "from-purple-600 to-pink-600",
          },
        ]);
      }
      setSimulating(false);
    }, 400);
  };

  const FAQS = [
    {
      q: "How does the AI create a timetable from my syllabus photo or PDF?",
      a: "Our server-side multimodal AI analyzes your uploaded syllabus and examination date sheet. It detects every subject, chapter, and exam date, classifies chapters into numerical or theory, and builds a realistic day-by-day timetable accounting for your available daily hours, rest days, and spaced revision intervals.",
    },
    {
      q: "Can I adjust or edit the timetable if my schedule changes?",
      a: "Yes, completely! You have 100% control. You can edit any study session, swap chapters, adjust difficulty ratings, mark sessions complete, or use the Evening Reflection tool to dynamically adjust your targets.",
    },
    {
      q: "Does StudyMate AI classify numerical chapters differently from theory?",
      a: "Yes. Numerical chapters (like AS 14 Accounting, Taxation PGBP, Costing) require calculation drills and solved examples, scheduled during your morning alert peak. Theory chapters (like Corporate Law, Audit) receive structured concept reading, active recall, and spaced repetition intervals.",
    },
    {
      q: "Are the educational videos verified educators?",
      a: "Yes. StudyMate AI indexes curated YouTube lectures from verified educators for CA, CS, Commerce, and School curricula with distraction-free embedded playback.",
    },
    {
      q: "How is my account data kept private?",
      a: "Every registered student receives a completely isolated account backed by Supabase Row-Level Security (RLS). Your notes, uploaded documents, and personal schedules are strictly accessible only by your authenticated session.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-white selection:bg-violet-500 selection:text-white font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070a13]/85 backdrop-blur-md px-6 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-violet-600/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white">StudyMate</span>
              <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-violet-400 border border-violet-500/30">
                AI
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#simulator" className="hover:text-white transition">AI Simulator</a>
            <a href="#features" className="hover:text-white transition">Exam Engine</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#courses" className="hover:text-white transition">Curricula</a>
            <a href="#faqs" className="hover:text-white transition">FAQs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition px-3 py-1.5"
            >
              Sign In
            </Link>
            <button
              onClick={handleGuestDemo}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Zap className="h-4 w-4" />
              <span>Launch Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-28 lg:pb-32">
        {/* Deep Violet & Indigo Glow Effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[550px] w-[850px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />
        <div className="pointer-events-none absolute top-40 -left-20 h-80 w-80 rounded-full bg-indigo-600/15 blur-[110px]" />
        <div className="pointer-events-none absolute top-60 -right-20 h-96 w-96 rounded-full bg-purple-600/15 blur-[130px]" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300 backdrop-blur-md mb-8 animate-fade-in shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
            <span>Intelligent Personal Examination Teacher & Timetable Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12] mb-6">
            Master Every Exam with{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Adaptive AI Timetables
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed mb-10">
            Upload photos or PDFs of your syllabus and examination date sheet. Our AI classifies numerical vs theory chapters, accounts for your daily study hours, and plans realistic study deadlines with spaced revisions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGuestDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-105 active:scale-95 transition-all"
            >
              <Zap className="h-4 w-4" />
              <span>Explore Interactive Student Demo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-8 py-4 text-sm font-semibold text-slate-200 hover:bg-slate-700/80 hover:text-white transition"
            >
              Create Free Account
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Syllabus Multimodal OCR
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Numerical vs Theory Scheduling
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Spaced Revision Engine
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Isolated Student Accounts
            </span>
          </div>
        </div>

        {/* Live Interactive App Preview Card */}
        <div className="relative mx-auto mt-14 max-w-6xl px-4 sm:px-6">
          <div className="relative rounded-3xl border border-slate-800 bg-[#0b0f19]/90 p-3 sm:p-5 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/90 pb-3.5 px-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  studymate-ai.app/dashboard
                </span>
              </div>

              {/* Tab Switcher for Preview */}
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setActivePreviewTab("today")}
                  className={`rounded-lg px-3 py-1 font-semibold transition ${
                    activePreviewTab === "today"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Today&apos;s Target
                </button>
                <button
                  onClick={() => setActivePreviewTab("streak")}
                  className={`rounded-lg px-3 py-1 font-semibold transition ${
                    activePreviewTab === "streak"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  7-Day Consistency
                </button>
                <button
                  onClick={() => setActivePreviewTab("intelligence")}
                  className={`rounded-lg px-3 py-1 font-semibold transition ${
                    activePreviewTab === "intelligence"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Chapter Intelligence
                </button>
              </div>
            </div>

            {/* Simulated Live Tabs Content */}
            <div className="pt-4 text-left">
              {activePreviewTab === "today" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Daily Study Volume</span>
                      <span className="rounded-md bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                        82% Completed
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">3.5 / 4.5 hrs</p>
                    <p className="text-xs text-slate-400 mt-1">2 sessions completed • 1 upcoming</p>
                    <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[82%]" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Target Examination</span>
                      <span className="rounded-md bg-violet-500/20 text-violet-300 px-2 py-0.5 text-[10px] font-bold">
                        In 60 Days
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-white truncate">
                      CA Intermediate Group 1
                    </p>
                    <p className="text-xs text-violet-300 mt-1">Paper 1: Advanced Accounting</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>7 Chapters Total</span>
                      <span className="text-emerald-400 font-semibold">4 Mastered</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Spaced Revision</span>
                      <span className="rounded-md bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                        Checkpoint Active
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-white truncate">
                      PGBP Profits & Gains Sec 43B
                    </p>
                    <p className="text-xs text-slate-400 mt-1">7-Day memory consolidation trigger</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-300">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Review formulas & 5 numerical drills</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === "streak" && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">Study Consistency & Streak</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Zero missed sessions in past 7 days</p>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                      🔥 7-Day Mastery Streak
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                      <div key={day} className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">{day}</span>
                        <div
                          className="w-full rounded-xl bg-gradient-to-t from-violet-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white py-4 shadow-md shadow-violet-900/30"
                          style={{ height: `${55 + i * 5}px` }}
                        >
                          {(3.5 + (i % 3) * 0.5).toFixed(1)}h
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePreviewTab === "intelligence" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                      <Calculator className="h-4 w-4" />
                      <span>Numerical Pedagogical Strategy</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      Assigned to <strong>Morning Peak Alertness</strong> slots. Enforces solved example analysis, daily calculation practice, and step-marked mock exercises.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                      <BookOpen className="h-4 w-4" />
                      <span>Theory Pedagogical Strategy</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                      Assigned to <strong>Evening Concept</strong> slots. Focuses on active recall, concept mind maps, short markdown notes, and 3-day / 7-day spaced repetition.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE AI TIMETABLE SIMULATOR SECTION */}
      <section id="simulator" className="border-t border-slate-800 bg-[#0b0f19] py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300 mb-3">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              <span>Test the Study Engine Live</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive AI Timetable Simulator
            </h2>
            <p className="mt-2 text-slate-400 text-sm max-w-2xl mx-auto">
              Select your course curriculum, study hours, and preferred time slot to witness how StudyMate AI dynamically distributes numerical and theory sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Control Panel */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <SlidersIcon className="h-4 w-4 text-violet-400" />
                <span>Simulation Parameters</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Course Curriculum
                </label>
                <select
                  value={simCourse}
                  onChange={(e) => setSimCourse(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                >
                  <option value="CA Intermediate">CA Intermediate (ICAI)</option>
                  <option value="CA Foundation">CA Foundation (ICAI)</option>
                  <option value="CS Executive">CS Executive (ICSI)</option>
                  <option value="B.Com Honours">B.Com Honours (University)</option>
                  <option value="Class 12 Boards">Class 12 Boards (CBSE/State)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Daily Study Commitment</span>
                  <span className="text-violet-400 font-bold">{simHours} Hours/Day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="0.5"
                  value={simHours}
                  onChange={(e) => setSimHours(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Circadian Peak Alertness Slot
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSimTimePref("morning")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 font-semibold transition border ${
                      simTimePref === "morning"
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                        : "border-slate-800 bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    <span>Morning Peak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimTimePref("evening")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 font-semibold transition border ${
                      simTimePref === "evening"
                        ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                        : "border-slate-800 bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    <span>Evening Peak</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Days Remaining Until Examination
                </label>
                <select
                  value={simTargetDays}
                  onChange={(e) => setSimTargetDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                >
                  <option value={30}>30 Days (High-intensity crash schedule)</option>
                  <option value={60}>60 Days (Balanced comprehensive plan)</option>
                  <option value={90}>90 Days (Deep concept + 2 revision cycles)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={runSimulation}
                disabled={simulating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {simulating ? (
                  <span>Generating Adaptive Schedule...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Simulate AI Timetable</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Timetable Preview Display */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-[#070a13] p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Simulated Study Plan for Tomorrow</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {simCourse} • {simHours} Hours Target • {simTargetDays} Days to Exam
                  </p>
                </div>
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                  Optimal Pedagogical Balance
                </span>
              </div>

              <div className="space-y-3">
                {simulatedSchedule.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-violet-300">
                        {item.time}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.nature === "numerical"
                              ? "bg-blue-500/20 text-blue-300"
                              : item.nature === "practical"
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "bg-purple-500/20 text-purple-300"
                          }`}
                        >
                          {item.nature}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{item.slot}</span>
                      </div>
                    </div>

                    <h5 className="font-bold text-white text-sm">{item.chapter}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{item.subject}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <span>Includes 15-min hydration breaks between intensive numerical slots</span>
                <button
                  onClick={handleGuestDemo}
                  className="text-violet-400 font-bold hover:text-violet-300 transition flex items-center gap-1"
                >
                  <span>Build your personal plan now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow Section */}
      <section id="how-it-works" className="border-t border-slate-800 bg-[#070a13] py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Effortless Onboarding
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              From Document Upload to Balanced Timetable in 5 Steps
            </h3>
            <p className="mt-3 text-slate-400 text-sm max-w-2xl mx-auto">
              Never spend 5 hours building an unrealistic spreadsheet schedule that falls apart on day 2.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                icon: FileCheck2,
                title: "Upload Syllabus",
                desc: "Upload photos or PDF of your university syllabus or official curriculum booklet.",
              },
              {
                step: "02",
                icon: CalendarCheck,
                title: "Upload Date Sheet",
                desc: "Snap a photo of the examination dates or upload the official notification notice.",
              },
              {
                step: "03",
                icon: Clock,
                title: "Set Availability",
                desc: "Specify daily available study hours, weekly rest day, and preferred study slots.",
              },
              {
                step: "04",
                icon: ShieldCheck,
                title: "Verify Extracted Data",
                desc: "Review AI-extracted subjects and exam dates. Edit or confirm with complete confidence.",
              },
              {
                step: "05",
                icon: BrainCircuit,
                title: "Balanced Schedule",
                desc: "AI distributes numerical morning drills, evening concepts, and spaced revisions.",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="relative rounded-2xl border border-slate-800 bg-[#0b0f19] p-5 hover:border-violet-500/50 transition-all group shadow-md"
                >
                  <span className="text-xs font-mono font-bold text-violet-400/80">
                    STEP {s.step}
                  </span>
                  <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 font-bold text-white text-sm">{s.title}</h4>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="border-t border-slate-800 py-20 px-6 bg-[#0b0f19]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Exam Teacher Intelligence
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Engineered with Sound Examination Science
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-[#070a13] p-6 hover:border-slate-700 transition">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">AI Exam Target Planner</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Calculates remaining preparation days, applies 40% time buffer to weak subjects, and warns immediately if targets exceed available daily study hours.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#070a13] p-6 hover:border-slate-700 transition">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 mb-4">
                <Calculator className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Numerical vs Theory Detection</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Classifies chapters into numerical, theory, practical, and mixed. Applies solved examples for numericals and active recall short notes for theory.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#070a13] p-6 hover:border-slate-700 transition">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 mb-4">
                <FileQuestion className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Smart Chapter Practice Tests</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Auto-generates chapter tests with numerical calculation drills, multiple-choice questions, and case studies, complete with automated step-scoring.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#070a13] p-6 hover:border-slate-700 transition">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-4">
                <Timer className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Peaceful Study Timer</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                A non-irritating focus timer with optional Quiet Mode that automatically logs study minutes and marks syllabus progress without disruptive alarms.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#070a13] p-6 hover:border-slate-700 transition">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-4">
                <Moon className="h-4 w-4" />
              </div>
              <h4 className="text-base font-bold text-white">Evening Reflection Engine</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                A 60-second evening reflection modal allowing students to report tiredness or backlogs. The AI dynamically reschedules without cognitive overload.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#070a13] p-6 hover:border-slate-700 transition">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 mb-4">
                <Video className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Curated Teacher Playlists</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Watch verified top educator lectures organized by course and chapter with embedded YouTube playback and zero advertising distraction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Curricula Shelf */}
      <section id="courses" className="border-t border-slate-800 py-20 px-6 bg-[#070a13]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Comprehensive Course Support
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Curriculum Ready for Every Major Exam
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              { name: "CA Foundation", badge: "ICAI" },
              { name: "CA Intermediate", badge: "ICAI" },
              { name: "CA Final", badge: "ICAI" },
              { name: "CS Executive", badge: "ICSI" },
              { name: "CS Professional", badge: "ICSI" },
              { name: "B.Com Honours", badge: "University" },
              { name: "BBA Business", badge: "Undergrad" },
              { name: "BCA Computer", badge: "Undergrad" },
              { name: "Class 12 Commerce", badge: "CBSE" },
              { name: "Class 10 Boards", badge: "CBSE" },
            ].map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border border-slate-800 bg-[#0b0f19] p-4 text-center hover:border-violet-500/40 transition"
              >
                <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                  {c.badge}
                </span>
                <p className="mt-2 font-bold text-white text-xs">{c.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faqs" className="border-t border-slate-800 py-20 px-6 bg-[#0b0f19]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Got Questions?
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-[#070a13] overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-violet-300 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        isOpen ? "transform rotate-180 text-violet-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section className="border-t border-slate-800 py-20 px-6 bg-gradient-to-b from-[#0b0f19] to-[#070a13] text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Take Control of Your Exam Preparation?
          </h2>
          <p className="text-sm text-slate-400 mb-8 max-w-xl mx-auto">
            Join thousands of students turning chaotic syllabi into structured, peaceful daily study targets.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGuestDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Zap className="h-4 w-4" />
              <span>Launch Interactive Demo</span>
            </button>
            <Link
              href="/register"
              className="w-full sm:w-auto rounded-2xl border border-slate-700 bg-slate-800/90 px-8 py-3.5 text-sm font-semibold text-slate-200 hover:text-white transition"
            >
              Sign Up for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-6 text-xs text-slate-500 bg-[#070a13]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-violet-400" />
            <span className="font-bold text-slate-300">StudyMate AI</span>
            <span>— Intelligent Student Study Companion</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/login" className="hover:text-white transition">Student Login</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition font-semibold"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Faculty Admin Portal</span>
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl mt-6 pt-6 border-t border-slate-900 text-center text-[11px] text-slate-600">
          © {new Date().getFullYear()} StudyMate AI Platform. Built with Next.js App Router, Supabase Row-Level Security, and Multimodal Vision AI.
        </div>
      </footer>
    </div>
  );
}

function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
