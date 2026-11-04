"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  KeyRound,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@studymate.ai");
  const [password, setPassword] = useState("Admin@StudyMate2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Administrative authentication failed.");
      }

      // Persist authenticated admin session in storage repository
      StorageRepository.setActiveAdminSession(data.admin);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during administrative authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#070a13] px-4 py-12 sm:px-6 lg:px-8 selection:bg-violet-500 selection:text-white">
      {/* Background Glows */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/25 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">StudyMate AI</h1>
            <span className="rounded bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300 border border-violet-500/40">
              ADMIN PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Authorized Faculty & Platform Administration Console
          </p>
        </div>

        {/* Security Notice Card */}
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 backdrop-blur-md">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-300">Restricted Administrative Area:</span>{" "}
              This login is reserved for system administrators. Student credentials cannot access
              this terminal.
            </div>
          </div>
        </div>

        {/* Login Box */}
        <div className="relative rounded-3xl border border-slate-800 bg-[#0b0f19]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="admin@studymate.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Secure Security Key / Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
                <KeyRound className="h-3.5 w-3.5 text-violet-400" />
                <span>Pre-provisioned Admin Credentials:</span>
              </div>
              <p className="font-mono text-slate-400">admin@studymate.ai / Admin@StudyMate2026!</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Privileges...</span>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              <GraduationCap className="h-4 w-4 text-indigo-400" />
              <span>Are you a student? Go to Student Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
