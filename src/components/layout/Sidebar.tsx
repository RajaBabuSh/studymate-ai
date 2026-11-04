"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck2,
  BookOpen,
  Award,
  Zap,
  Briefcase,
  Settings,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

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
  const { student, isGuest, signOut } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <>
      {/* Backdrop for Mobile Overlay Drawer */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content (Desktop Collapsed/Expanded + Mobile Overlay Drawer) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#0b0f19] transition-all duration-300 ease-in-out shadow-xs",
          // Desktop width states
          isCollapsed ? "md:w-20 px-2.5 py-4" : "md:w-64 px-4 py-5",
          // Mobile drawer states
          isMobileOpen
            ? "translate-x-0 w-64 px-4 py-5 shadow-2xl z-50"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Expanded or Mobile Layout */}
          <div className={cn("flex items-center", isCollapsed ? "md:hidden justify-between" : "justify-between")}>
            <Link
              href="/dashboard"
              onClick={closeMobile}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-blue-600 text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                    StudyMate
                  </span>
                  <span className="rounded-md bg-purple-50 px-1.5 py-0.2 text-[10px] font-extrabold text-purple-700 border border-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Intelligent Study Partner</p>
              </div>
            </Link>

            {/* Mobile close button inside drawer */}
            <button
              onClick={closeMobile}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Collapsed Desktop Brand Icon */}
          <div className={cn("hidden", isCollapsed && "md:flex flex-col items-center justify-center")}>
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-blue-600 text-white shadow-md shadow-purple-500/20 hover:scale-105 transition-transform"
              title="StudyMate AI Dashboard"
            >
              <GraduationCap className="h-6 w-6" />
            </Link>
          </div>

          {/* Student Active Course Pill (Shown when Expanded or Mobile) */}
          {student?.course && (
            <div
              className={cn(
                "mt-3.5 flex items-center justify-between gap-2 rounded-2xl bg-purple-50/70 border border-purple-100 dark:bg-purple-950/40 dark:border-purple-900/60 px-3 py-2",
                isCollapsed && "md:hidden"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Enrolled Course</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {student.course}
                </p>
              </div>
              {isGuest && (
                <span className="rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] font-semibold px-1.5 py-0.5 border border-amber-200 dark:border-amber-900">
                  Demo
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "group relative transition-all",
                  // Expanded / Mobile Full layout
                  isCollapsed
                    ? "md:flex md:h-11 md:w-11 md:mx-auto md:items-center md:justify-center md:rounded-2xl md:my-1.5 flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold"
                    : "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold",
                  isActive
                    ? "bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-xs dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/60"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                )}
              >
                {/* Active indicator bar for expanded mode */}
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-purple-600" />
                )}

                <Icon
                  className={cn(
                    "shrink-0 transition-transform group-hover:scale-110",
                    isCollapsed ? "h-5 w-5 md:h-5 md:w-5" : "h-4 w-4",
                    isActive
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-slate-400 group-hover:text-purple-600 dark:text-slate-500 dark:group-hover:text-purple-400"
                  )}
                />

                {/* Text Label */}
                <span
                  className={cn(
                    "truncate flex-1",
                    isCollapsed && "md:hidden"
                  )}
                >
                  {item.name}
                </span>

                {/* Hover Tooltip Pill in Collapsed Desktop Mode */}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden rounded-xl bg-slate-900 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg whitespace-nowrap md:group-hover:inline-block z-50">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Action Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out" : undefined}
            className={cn(
              "group relative flex items-center transition-colors text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30",
              isCollapsed
                ? "md:h-11 md:w-11 md:mx-auto md:justify-center md:rounded-2xl rounded-2xl px-3.5 py-2.5 text-xs font-semibold w-full gap-3"
                : "w-full gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold"
            )}
          >
            <LogOut className={cn("shrink-0", isCollapsed ? "h-5 w-5 md:h-5 md:w-5" : "h-4 w-4")} />
            <span className={cn(isCollapsed && "md:hidden")}>Logout</span>

            {isCollapsed && (
              <span className="pointer-events-none absolute left-full ml-3 hidden rounded-xl bg-slate-900 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg whitespace-nowrap md:group-hover:inline-block z-50">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
