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
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  FileText,
  Users,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION BAR                                                */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight text-white">StudyMate</span>
              <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-400 border border-indigo-500/30">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="#home" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="#features" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="#about" className="hover:text-white transition-colors">
              About
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleGuestDemo}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Demo Preview
            </button>
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Create Account
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-300"
          >
            ☰
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900 px-6 py-4 space-y-3">
            <Link
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-300"
            >
              Home
            </Link>
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-300"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-300"
            >
              How It Works
            </Link>
            <Link
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-slate-300"
            >
              About
            </Link>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2 text-sm font-semibold text-slate-300"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2 text-sm font-bold bg-indigo-600 rounded-xl text-white"
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
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[600px] rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Smart Student Study Management</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-white">
            Your Study Life, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Organized.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            Plan your studies, manage your subjects, track your progress and prepare for exams with ease.
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
            >
              <span>Student Login</span>
            </Link>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* PRODUCT PREVIEW MOCKUP                                      */}
          {/* ----------------------------------------------------------- */}
          <div className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-md">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950 p-6 text-left">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                    JS
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Welcome back, John Student 👋</h2>
                    <p className="text-xs text-slate-400">Course: CS Executive Preparation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                    ● On Track (84%)
                  </span>
                </div>
              </div>

              {/* Sample Dashboard Preview Cards */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Today&apos;s Target</span>
                    <Clock className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">3.5 / 4.5 hrs</div>
                  <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Study Progress</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">68% Finished</div>
                  <p className="mt-2 text-[11px] text-slate-400">87 of 128 chapters completed</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Upcoming Tasks</span>
                    <CheckSquare className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">3 Due Today</div>
                  <p className="mt-2 text-[11px] text-slate-400">2 theory, 1 practice set</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Next Examination</span>
                    <Calendar className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">JIGL Paper 1</div>
                  <p className="mt-2 text-[11px] text-purple-400 font-semibold">42 days remaining</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FEATURE CARDS                                                 */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Built for Students
            </h2>
            <h3 className="mt-2 text-3xl font-extrabold text-white">
              Everything you need to master your syllabus
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              No complicated setups, no confusing algorithms. Just pure, clean study management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-indigo-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Simple Subjects</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Add your subjects, organize chapters, and check them off as you finish. Clean and straightforward.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-purple-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4">
                <Calendar className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Visual Timetable</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Plan study sessions by day and time. Drag, edit, or adjust whenever your real-world plans change.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-emerald-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                <CheckSquare className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Daily Tasks</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Keep track of daily revision targets, assignments, and problem sets with a focused to-do list.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-amber-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Real Progress</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                See exact completion percentages across all your subjects. Know exactly where you stand before exams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* HOW IT WORKS                                                  */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/80">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Simple 3-Step Workflow
            </h2>
            <h3 className="mt-2 text-3xl font-extrabold text-white">How StudyMate AI Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-lg mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-white">Set Up Subjects</h4>
              <p className="mt-2 text-xs text-slate-400">
                Choose your course or enter your custom subjects and chapters in seconds.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 font-bold text-lg mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-white">Schedule Study Time</h4>
              <p className="mt-2 text-xs text-slate-400">
                Pick your daily study hours. Add sessions manually or let AI generate a balanced starter plan.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-lg mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-white">Track & Conquer</h4>
              <p className="mt-2 text-xs text-slate-400">
                Check off finished chapters and tasks each day. Walk into exam day completely prepared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* ABOUT SECTION                                                 */}
      {/* ------------------------------------------------------------- */}
      <section id="about" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <Users className="h-3.5 w-3.5" />
            <span>About StudyMate AI</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Designed for students who want to study without distractions
          </h3>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Most study apps are bloated with excessive menus, fake statistics, and overwhelming configuration wizards.
            StudyMate AI is built on a clean philosophy: give students an easy, dependable space to track their syllabus,
            manage their weekly timetable, and conquer examinations with total clarity.
          </p>
          <div className="mt-8 flex justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-400" /> Private & Secure
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% Student-Controlled
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-purple-400" /> Independent Accounts
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PROFESSIONAL FOOTER                                           */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-slate-300">StudyMate AI</span>
            <span>— Intelligent Student Study Companion</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">
              Create Account
            </Link>
            <Link href="/support" className="hover:text-slate-300 transition-colors">
              Support
            </Link>
          </div>

          <p>© {new Date().getFullYear()} StudyMate AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
