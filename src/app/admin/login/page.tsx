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
    <div className="flex min-h-screen flex-col justify-center bg-slate-50/70 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[500px] rounded-full bg-purple-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">StudyMate AI</h1>
            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
              ADMIN PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Authorized Faculty & Platform Administration Console
          </p>
        </div>

        {/* Security Notice Card */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold">Restricted Administrative Area:</span>{" "}
              This portal is strictly reserved for faculty and administrators. Student accounts cannot authenticate here.
            </div>
          </div>
        </div>

        {/* Login Box */}
        <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-purple-500/5">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none transition-all"
                  placeholder="admin@studymate.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Security Key / Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3 text-[11px] text-purple-900">
              <div className="flex items-center gap-1.5 font-semibold text-purple-900 mb-0.5">
                <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                <span>Pre-provisioned Admin Credentials:</span>
              </div>
              <p className="font-mono text-purple-700 text-[10px]">admin@studymate.ai / Admin@StudyMate2026!</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
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

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-purple-600 transition"
            >
              <GraduationCap className="h-4 w-4 text-purple-600" />
              <span>Are you a student? Go to Student Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
