"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarCheck2,
  TrendingUp,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function FeaturesPage() {
  const featureList = [
    {
      icon: BookOpen,
      title: "Subject & Chapter Catalog",
      tag: "Syllabus Organization",
      description:
        "Easily organize all subjects and individual chapters for your course. Check off completed lessons with one click and monitor exactly what remains.",
      highlights: ["Custom subject colors", "Chapter completion toggles", "Dynamic progress tracking"],
    },
    {
      icon: Calendar,
      title: "Weekly Study Timetable",
      tag: "Time Management",
      description:
        "Build a weekly schedule that fits your daily routine. Add study sessions with start times and durations, or use the AI suggestion button for a balanced template.",
      highlights: ["Monday-to-Sunday navigation", "Duration & time-slot controls", "One-click session completion"],
    },
    {
      icon: CalendarCheck2,
      title: "Study Planner & Daily Goals",
      tag: "Routine Consistency",
      description:
        "Break voluminous professional syllabi into achievable daily goals. Prioritize critical theory and numerical chapters to avoid exam week burnout.",
      highlights: ["Priority level tags", "Today's focus filter", "Overdue target alerts"],
    },
    {
      icon: TrendingUp,
      title: "Real-Time Progress Analytics",
      tag: "Exam Preparedness",
      description:
        "No fake stats or arbitrary scores. StudyMate AI tracks your actual completed chapters and hours spent against upcoming examination dates.",
      highlights: ["Subject-by-subject percentage", "Exam countdown clocks", "Accurate completion metrics"],
    },
    {
      icon: FileText,
      title: "Study Notes & Flash Points",
      tag: "Academic Retention",
      description:
        "Keep chapter summaries, section numbers, case laws, and formulas directly alongside your syllabus for fast active recall before test day.",
      highlights: ["Chapter-linked notes", "Clean markdown formatting", "Instant search & filter"],
    },
    {
      icon: ShieldCheck,
      title: "Strict Student Account Isolation",
      tag: "Privacy & Independence",
      description:
        "Every student receives an independent profile and workspace. Your subjects, timetable, and study notes remain strictly private to your account.",
      highlights: ["Separate user credentials", "Supabase authentication", "Zero data overlap"],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-violet-500 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* HEADER                                                        */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-violet-100/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight text-slate-900">StudyMate</span>
              <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-extrabold text-violet-700 border border-violet-100">
                AI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-violet-600 transition-colors">
              Home
            </Link>
            <Link href="/features" className="text-violet-600 font-bold transition-colors">
              Features
            </Link>
            <Link href="/about" className="hover:text-violet-600 transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-violet-600/25 hover:bg-violet-500 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION                                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-16 pb-16 text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-96 rounded-full bg-violet-400/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-3.5 py-1 text-xs font-semibold text-violet-700 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Product Features</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Built from the ground up for <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">serious students.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 leading-relaxed">
            Everything you need to master your syllabus, structure your daily study hours, and conquer exam day without confusion.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FEATURE CARDS GRID                                            */}
      {/* ------------------------------------------------------------- */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureList.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-violet-100/80 bg-white p-7 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full">
                        {f.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">{f.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5">
                    {f.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Banner */}
          <div className="mt-16 rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 sm:p-12 text-center text-white shadow-xl shadow-violet-600/15">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to organize your study life?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-violet-100">
              Join thousands of students preparing for professional examinations with confidence.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-bold text-violet-700 shadow-sm hover:bg-violet-50 transition-colors"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-violet-600" />
            <span className="font-bold text-slate-800">StudyMate AI</span>
            <span>— Intelligent Student Study Companion</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-slate-800">Home</Link>
            <Link href="/about" className="hover:text-slate-800">About</Link>
            <Link href="/login" className="hover:text-slate-800">Sign In</Link>
            <Link href="/register" className="hover:text-slate-800">Register</Link>
          </div>

          <p>© {new Date().getFullYear()} StudyMate AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
