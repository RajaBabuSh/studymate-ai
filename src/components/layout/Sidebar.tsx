"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Video,
  BellRing,
  FileText,
  TrendingUp,
  Flame,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  Target,
  FileQuestion,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Smart Roadmap",
    href: "/roadmap",
    icon: Compass,
    badge: "Auto",
    highlight: true,
  },
  {
    name: "AI Exam Planner",
    href: "/exam-planner",
    icon: Target,
    badge: "Teacher",
    highlight: false,
  },
  {
    name: "AI Timetable",
    href: "/timetable",
    icon: CalendarDays,
    badge: "AI",
    highlight: false,
  },
  {
    name: "Chapter Intelligence",
    href: "/subjects",
    icon: BookOpen,
    badge: null,
  },
  {
    name: "Smart Tests",
    href: "/tests",
    icon: FileQuestion,
    badge: "Practice",
  },
  {
    name: "Teacher Videos",
    href: "/videos",
    icon: Video,
    badge: null,
  },
  {
    name: "Smart Reminders",
    href: "/reminders",
    icon: BellRing,
    badge: null,
  },
  {
    name: "My Notes",
    href: "/notes",
    icon: FileText,
    badge: null,
  },
  {
    name: "Progress Tracker",
    href: "/progress",
    icon: TrendingUp,
    badge: null,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { student, isGuest } = useAuth();

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-3 left-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white/95 px-4 py-5 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95 transition-transform duration-300 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="px-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  StudyMate
                </span>
                <span className="rounded-md bg-indigo-100 px-1.5 py-0.2 text-[10px] font-extrabold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Intelligent Study Partner</p>
            </div>
          </div>

          {/* Student Active Course Pill */}
          {student?.course && (
            <div className="mt-3.5 flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-indigo-50/90 to-purple-50/70 dark:from-indigo-950/50 dark:to-purple-950/30 px-3 py-2 border border-indigo-100/80 dark:border-indigo-900/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
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
        <nav className="mt-5 flex-1 space-y-1.5">
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
                    ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-600" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Study Streak Card */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-white p-3.5 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
              <Flame className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">7 Day Streak</span>
                <span className="text-[10px] text-amber-500 font-bold">★ Master</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Consistency score: 98%
              </p>
            </div>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              style={{ width: "85%" }}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            StudyMate AI v2.4 • Academic Edition
          </p>
        </div>
      </aside>
    </>
  );
}
