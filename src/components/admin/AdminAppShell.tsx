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
  { name: "Curriculum Audit", href: "/admin/curriculum-audit", icon: ShieldCheck },
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
    // Server-side / session verification
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">Verifying Administrative Privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/70 text-slate-900 font-sans">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white px-4 py-6 justify-between shrink-0 shadow-xs">
        <div>
          {/* Admin Portal Brand Header */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-md shadow-purple-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base tracking-tight">StudyMate</span>
                <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-extrabold text-purple-700 border border-purple-200">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Academic Control Center</p>
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
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-xs font-bold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-purple-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer Controls */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <Link
            href="/dashboard"
            target="_blank"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-purple-600" />
              Student Portal
            </span>
            <span className="text-[10px] text-slate-400 font-normal">View Live</span>
          </Link>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
            <p className="text-[11px] font-bold text-slate-900 truncate">{admin?.full_name}</p>
            <p className="text-[10px] text-slate-500 truncate">{admin?.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
              Super Admin Active
            </span>
          </div>

          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production AI Cluster Online</span>
            </div>

            <Link
              href="/admin/announcements"
              className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 border border-slate-200 transition-colors"
              title="Platform Alerts"
            >
              <BellRing className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-6 py-4 space-y-2 shadow-sm">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold ${
                    isActive ? "bg-purple-50 text-purple-700 font-bold border border-purple-200" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={handleAdminLogout}
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-600"
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
