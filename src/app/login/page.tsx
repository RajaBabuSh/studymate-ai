"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Sparkles, Lock, Mail, ArrowRight, AlertCircle, Check, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, loginAsGuest, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signInWithEmail(email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGuestDemo = () => {
    loginAsGuest();
    router.push("/dashboard");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    setResetLoading(true);

    const res = await resetPassword(resetEmail);
    setResetLoading(false);

    if (res.error) {
      setResetError(res.error);
    } else {
      setResetMessage(res.message || "Reset link dispatched to your inbox!");
      setTimeout(() => {
        setShowForgotModal(false);
        setResetMessage(null);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold tracking-tight text-white">StudyMate</span>
              <span className="ml-1 rounded bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-300 border border-indigo-500/40">
                AI
              </span>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Student Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your courses, personalized AI timetable, and private notes
          </p>
        </div>

        {/* Guest Demo Hero Banner */}
        <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 to-purple-950/50 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Want to test immediately?
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Explore guest demo with pre-loaded CA Inter subjects and schedule.
              </p>
            </div>
            <button
              onClick={handleGuestDemo}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-transform"
            >
              <span>Launch Demo</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Student Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 active:scale-98 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            New to StudyMate AI?{" "}
            <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Reset Password</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your student email and we will verify your account.
            </p>

            {resetError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetMessage ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{resetMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-3.5 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 rounded-xl border border-slate-700 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {resetLoading ? "Verifying..." : "Verify & Reset"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
