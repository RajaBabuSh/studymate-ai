"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  Users,
  Target,
  HeartHandshake,
} from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Clarity Over Complexity",
      desc: "Studying for difficult exams is hard enough. Study software shouldn't add confusion with bloated menus and fake statistics.",
    },
    {
      icon: ShieldCheck,
      title: "100% Student Privacy",
      desc: "Your data belongs to you. Every student account is completely isolated with independent progress metrics.",
    },
    {
      icon: HeartHandshake,
      title: "Student-First Philosophy",
      desc: "We focus on what genuinely helps: clean subject tracking, a weekly timetable you can edit, and realistic progress tracking.",
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
            <Link href="/features" className="hover:text-violet-600 transition-colors">
              Features
            </Link>
            <Link href="/about" className="text-violet-600 font-bold transition-colors">
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
            <Users className="h-3.5 w-3.5" />
            <span>Our Mission</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Empowering students to study with <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">peace of mind.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 leading-relaxed">
            StudyMate AI was built out of frustration with overly complex, bloated study platforms.
            We believe that focused organization and quiet consistency are the foundation of academic excellence.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* VALUES SECTION                                                */}
      {/* ------------------------------------------------------------- */}
      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-violet-100/80 bg-white p-8 shadow-xs hover:border-violet-300 transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Story Card */}
          <div className="mt-12 rounded-3xl border border-violet-100/80 bg-white p-8 sm:p-12 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Why StudyMate AI?</h2>
            <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                Professional and university examinations require managing hundreds of hours of coursework across
                multiple complex subjects. Many students spend more time wrestling with clunky timetable apps
                and disorganized spreadsheets than actually studying.
              </p>
              <p>
                StudyMate AI strips away unnecessary noise. We give you a straightforward subject catalog, an editable
                weekly study schedule, a focused daily planner, and honest progress tracking. Everything works seamlessly,
                with no distractions and no fluff.
              </p>
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
            <Link href="/features" className="hover:text-slate-800">Features</Link>
            <Link href="/login" className="hover:text-slate-800">Sign In</Link>
            <Link href="/register" className="hover:text-slate-800">Register</Link>
          </div>

          <p>© {new Date().getFullYear()} StudyMate AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
