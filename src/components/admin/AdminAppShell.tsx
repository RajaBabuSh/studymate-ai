"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ListTree,
  Video,
  Megaphone,
  Sliders,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  BellRing,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";
import { AdminUser } from "@/types/database";

const ADMIN_NAV = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Student Directory", href: "/admin/students", icon: Users },
  { name: "Courses Catalog", href: "/admin/courses", icon: GraduationCap },
  { name: "Curriculum Subjects", href: "/admin/subjects", icon: BookOpen },
  { name: "Chapter Intelligence", href: "/admin/chapters", icon: ListTree },
  { name: "Curriculum Audit (128 Ch)", href: "/admin/curriculum-audit", icon: ShieldCheck },
  { name: "Study Videos", href: "/admin/videos", icon: Video },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Platform Settings", href: "/admin/settings", icon: Sliders },
];

export default function AdminAppShell({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Role verification
    const activeAdmin = StorageRepository.getActiveAdminSession();
    if (!activeAdmin || activeAdmin.role !== "admin") {
      router.replace("/admin/login?error=session_required");
      return;
    }
    setAdmin(activeAdmin);
    setLoading(false);
  }, [router]);

  const handleAdminLogout = () => {
    StorageRepository.setActiveAdminSession(null);
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070a13] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-xs font-medium text-slate-400">Verifying Administrative Privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070a13] text-slate-100 font-sans">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-800/80 bg-[#0b0f19] px-4 py-6 justify-between shrink-0">
        <div>
          {/* Admin Portal Header */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">StudyMate</span>
                <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-violet-400 border border-violet-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Academic Control Center</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-900/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-violet-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer Controls */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <Link
            href="/dashboard"
            target="_blank"
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
              Student Portal
            </span>
            <span className="text-[10px] text-slate-500">View Live</span>
          </Link>

          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
            <p className="text-[11px] font-semibold text-white truncate">{admin?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">{admin?.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
              Super Admin Active
            </span>
          </div>

          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#0b0f19]/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Production AI Cluster Online</span>
            </div>

            <Link
              href="/admin/announcements"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800"
              title="Platform Alerts"
            >
              <BellRing className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-[#0b0f19] px-6 py-4 space-y-2">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                    isActive ? "bg-violet-600/20 text-violet-300" : "text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={handleAdminLogout}
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
