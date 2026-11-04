"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck2,
  BookOpen,
  Award,
  Zap,
  HelpCircle,
  Briefcase,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Academic Management",
    href: "/academic",
    icon: GraduationCap,
  },
  {
    name: "Study Planner",
    href: "/planner",
    icon: CalendarCheck2,
  },
  {
    name: "Learning & Revision",
    href: "/learning",
    icon: BookOpen,
  },
  {
    name: "Tests & Performance",
    href: "/tests",
    icon: Award,
  },
  {
    name: "Productivity",
    href: "/productivity",
    icon: Zap,
  },
  {
    name: "Resources & Support",
    href: "/resources",
    icon: HelpCircle,
  },
  {
    name: "Career & Results",
    href: "/career",
    icon: Briefcase,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { student, isGuest, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-3 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-100 bg-white px-4 py-5 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 md:translate-x-0 shadow-xs",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="px-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  StudyMate
                </span>
                <span className="rounded-md bg-violet-50 px-1.5 py-0.2 text-[10px] font-extrabold text-violet-700 border border-violet-100 dark:bg-violet-950/60 dark:border-violet-900/40 dark:text-violet-300">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Intelligent Study Partner</p>
            </div>
          </Link>

          {/* Student Active Course Pill */}
          {student?.course && (
            <div className="mt-3.5 flex items-center justify-between gap-2 rounded-xl bg-violet-50/70 border border-violet-100 dark:bg-violet-950/30 dark:border-violet-900/40 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Enrolled Course</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {student.course}
                </p>
              </div>
              {isGuest && (
                <span className="rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 text-[9px] font-semibold px-1.5 py-0.5">
                  Demo
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-violet-50 text-violet-700 shadow-xs dark:bg-violet-950/60 dark:text-violet-300"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-violet-600" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Action Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
