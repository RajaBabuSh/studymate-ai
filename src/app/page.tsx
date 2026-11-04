"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarCheck2,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { loginAsGuest } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGuestDemo = () => {
    loginAsGuest();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-violet-500 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION BAR                                                */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-violet-100/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/" className="text-violet-600 font-bold transition-colors">
              Home
            </Link>
            <Link href="/features" className="hover:text-violet-600 transition-colors">
              Features
            </Link>
            <Link href="/about" className="hover:text-violet-600 transition-colors">
              About
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleGuestDemo}
              className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100/70 transition-colors"
            >
              Demo Preview
            </button>
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

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
          >
            ☰
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-violet-100 bg-white px-6 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-violet-600"
            >
              Home
            </Link>
            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-600"
            >
              Features
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-600"
            >
              About
            </Link>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2 text-sm font-semibold text-slate-700"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2 text-sm font-bold bg-violet-600 rounded-xl text-white"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION                                                  */}
      {/* ------------------------------------------------------------- */}
      <section id="home" className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
        {/* Soft Violet Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[600px] rounded-full bg-violet-400/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-3.5 py-1 text-xs font-semibold text-violet-700 mb-6 shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Intelligent Student Study Management</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-slate-900">
            Your Study Life, <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Organized.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Plan your studies, manage your subjects, track your progress and prepare for exams with ease.
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-100 bg-violet-50/50 px-7 py-3.5 text-sm font-semibold text-violet-700 hover:bg-violet-100/70 transition-all"
            >
              <span>Student Login</span>
            </Link>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* PRODUCT PREVIEW CARD (WHITE & SOFT VIOLET THEME)            */}
          {/* ----------------------------------------------------------- */}
          <div className="mt-14 rounded-3xl border border-violet-100/80 bg-slate-50/50 p-3 shadow-xl shadow-violet-500/5">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
                    JS
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Welcome back, John Student 👋</h2>
                    <p className="text-xs text-slate-500">Course: CS Executive Professional</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                    ● On Track (84%)
                  </span>
                </div>
              </div>

              {/* Sample Dashboard Cards */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-violet-100/80 bg-violet-50/30 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Today&apos;s Target</span>
                    <Clock className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">3.5 / 4.5 hrs</div>
                  <div className="mt-2 h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-100/80 bg-violet-50/30 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Study Progress</span>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">68% Finished</div>
                  <p className="mt-2 text-[11px] text-slate-500">87 of 128 chapters completed</p>
                </div>

                <div className="rounded-2xl border border-violet-100/80 bg-violet-50/30 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Upcoming Goals</span>
                    <CalendarCheck2 className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">3 Due Today</div>
                  <p className="mt-2 text-[11px] text-slate-500">2 theory, 1 problem set</p>
                </div>

                <div className="rounded-2xl border border-violet-100/80 bg-violet-50/30 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Next Examination</span>
                    <Calendar className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">JIGL Paper 1</div>
                  <p className="mt-2 text-[11px] text-violet-700 font-semibold">42 days remaining</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FEATURE CARDS                                                 */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-20 border-t border-violet-100/80 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Built for Students
            </h2>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
              Everything you need to master your syllabus
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              No complicated setups, no confusing algorithms. Just pure, clean study management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-violet-100/80 bg-white p-6 hover:border-violet-300 hover:shadow-md transition-all">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Simple Subjects</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Add your subjects, organize chapters, and check them off as you finish. Clean and straightforward.
              </p>
            </div>

            <div className="rounded-3xl border border-violet-100/80 bg-white p-6 hover:border-violet-300 hover:shadow-md transition-all">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                <Calendar className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Visual Timetable</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Plan study sessions by day and time. Drag, edit, or adjust whenever your real-world plans change.
              </p>
            </div>

            <div className="rounded-3xl border border-violet-100/80 bg-white p-6 hover:border-violet-300 hover:shadow-md transition-all">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-4">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Study Planner</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Keep track of daily revision targets, assignments, and problem sets with a focused to-do list.
              </p>
            </div>

            <div className="rounded-3xl border border-violet-100/80 bg-white p-6 hover:border-violet-300 hover:shadow-md transition-all">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Real Progress</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                See exact completion percentages across all your subjects. Know exactly where you stand before exams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3-STEP WORKFLOW                                               */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-20 border-t border-violet-100/80">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Simple 3-Step Workflow
            </h2>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900">How StudyMate AI Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="rounded-3xl border border-violet-100/80 bg-white p-7 shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 font-bold text-lg mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900">Set Up Subjects</h4>
              <p className="mt-2 text-xs text-slate-600">
                Choose your course or enter your custom subjects and chapters in seconds.
              </p>
            </div>

            <div className="rounded-3xl border border-violet-100/80 bg-white p-7 shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-lg mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900">Schedule Study Time</h4>
              <p className="mt-2 text-xs text-slate-600">
                Pick your daily study hours. Add sessions manually or let AI generate a balanced starter plan.
              </p>
            </div>

            <div className="rounded-3xl border border-violet-100/80 bg-white p-7 shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900">Track & Conquer</h4>
              <p className="mt-2 text-xs text-slate-600">
                Check off finished chapters and tasks each day. Walk into exam day completely prepared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-violet-600" />
            <span className="font-bold text-slate-800">StudyMate AI</span>
            <span>— Intelligent Student Study Companion</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Home
            </Link>
            <Link href="/features" className="hover:text-slate-800 transition-colors">
              Features
            </Link>
            <Link href="/about" className="hover:text-slate-800 transition-colors">
              About
            </Link>
            <Link href="/login" className="hover:text-slate-800 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-800 transition-colors">
              Create Account
            </Link>
          </div>

          <p>© {new Date().getFullYear()} StudyMate AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
