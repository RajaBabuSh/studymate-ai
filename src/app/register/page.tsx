"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { StorageRepository } from "@/lib/storage";
import { GraduationCap, Lock, Mail, User, ArrowRight, AlertCircle, Loader2, Sparkles, BookOpen, Clock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, loginAsGuest } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("CS Executive");
  const [targetExam, setTargetExam] = useState("");
  const [dailyHours, setDailyHours] = useState(4.5);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signUpWithEmail(email, password, name);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      // Update the student profile with custom course and daily hours
      const session = StorageRepository.getActiveSession();
      const activeStudent = StorageRepository.getStudent(session?.userId);
      if (activeStudent) {
        StorageRepository.setStudent(
          {
            ...activeStudent,
            course: course.trim(),
            target_exam: targetExam.trim() || `${course.trim()} Examination`,
            daily_available_hours: dailyHours,
            onboarding_completed: true,
          },
          session?.userId
        );
      }
      router.push("/dashboard");
    }
  };

  const handleGuestDemo = () => {
    loginAsGuest();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/60 px-4 py-12 relative overflow-hidden">
      {/* Soft violet background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-400/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold tracking-tight text-slate-900">StudyMate</span>
              <span className="ml-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-extrabold text-violet-700 border border-violet-100">
                AI
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Student Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Set up your independent student workspace and study plan.
          </p>
        </div>

        {/* Demo banner */}
        <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/70 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                <span>Want a quick preview?</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Try StudyMate AI as a guest student without registering.
              </p>
            </div>
            <button
              onClick={handleGuestDemo}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-500 transition-colors"
            >
              <span>Launch Demo</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Registration Card */}
        <div className="rounded-3xl border border-violet-100/90 bg-white p-8 shadow-xl shadow-violet-500/5">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Academic Onboarding Information */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 block">
                Academic Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enrolled Course</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. CS Executive"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Study Target</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <select
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-violet-500 focus:outline-none focus:bg-white transition-all"
                    >
                      <option value={2}>2.0 hours / day</option>
                      <option value={3}>3.0 hours / day</option>
                      <option value={4.5}>4.5 hours / day</option>
                      <option value={6}>6.0 hours / day</option>
                      <option value={8}>8.0 hours / day</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Examination (Optional)
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. December 2026 Examination"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-violet-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-violet-600 hover:text-violet-500 underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
