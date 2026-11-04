"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  Sparkles,
  Sun,
  Moon,
  Calendar,
  User,
  LogOut,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Sliders,
  Megaphone,
  Compass,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";
import { Examination, Reminder, Announcement } from "@/types/database";
import { getDaysRemaining } from "@/lib/utils";
import StudyTimerModal from "@/components/timer/StudyTimerModal";

export default function Navbar() {
  const router = useRouter();
  const { user, student, isGuest, signOut, resetDemoData } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [nearestExam, setNearestExam] = useState<Examination | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Check dark mode preference
    if (typeof window !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    }

    // Load nearest exam and active reminders for this student
    const exams = StorageRepository.getExaminations(user?.id);
    if (exams.length > 0) {
      const sorted = [...exams].sort(
        (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
      );
      setNearestExam(sorted[0]);
    }

    const rems = StorageRepository.getReminders(user?.id);
    setReminders(rems.filter((r) => !r.is_completed));

    const anns = StorageRepository.getAnnouncements();
    setAnnouncements(
      anns.filter(
        (a) => a.is_active && (a.target_course === "all" || a.target_course === student?.course)
      )
    );
  }, [user?.id, student?.course]);

  const toggleDarkMode = () => {
    if (typeof document !== "undefined") {
      if (document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      } else {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }
    }
  };

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await signOut();
    router.replace("/login");
  };

  const daysLeft = nearestExam ? getDaysRemaining(nearestExam.exam_date) : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 md:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="flex items-center gap-4">
        {/* Nearest Exam Countdown Banner */}
        {nearestExam && (
          <div className="hidden lg:flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-900 dark:text-indigo-300">
            <Calendar className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span>
              Next Exam: <strong>{nearestExam.subject_name}</strong> in{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : "Today!") : "Upcoming"}
              </span>
            </span>
          </div>
        )}

        {isGuest && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            Guest Demo Mode
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Focus Timer Button */}
        <button
          onClick={() => setShowTimerModal(true)}
          title="Open Peaceful Study Timer"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
        >
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          <span className="hidden md:inline">Timer</span>
        </button>

        {/* AI Action Pill */}
        <Link
          href="/timetable"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 transition-all hover:shadow-glow"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Timetable</span>
        </Link>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle Dark Mode"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
          >
            <Bell className="h-4 w-4" />
            {reminders.length + announcements.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {reminders.length + announcements.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-slide-up">
              {/* Announcements Section */}
              {announcements.length > 0 && (
                <div className="mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Faculty & Exam Alerts
                  </span>
                  <div className="mt-1.5 space-y-2">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-xl border border-violet-100 bg-violet-50/60 p-2 text-xs dark:border-violet-900/40 dark:bg-violet-950/30"
                      >
                        <div className="flex items-start gap-1.5">
                          <Megaphone className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-[11px]">
                              {ann.title}
                            </p>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {ann.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Study Reminders
                </span>
                <Link
                  href="/reminders"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reminders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No pending reminders</p>
                ) : (
                  reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs dark:border-slate-800/80 dark:bg-slate-800/40"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{rem.title}</p>
                          {rem.description && (
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                              {rem.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Student Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {student?.full_name ? student.full_name.charAt(0) : "S"}
            </div>
            <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-200">
              {student?.full_name || "Student"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-slide-up">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {student?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
                  {student?.email}
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-bold">
                  {student?.course || student?.grade_or_year || "Enrolled Student"}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Dashboard Overview
                </Link>

                <Link
                  href="/roadmap"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Compass className="h-3.5 w-3.5 text-violet-500" />
                  Smart Roadmap & Targets
                </Link>

                <Link
                  href="/onboarding"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  <Sliders className="h-3.5 w-3.5 text-slate-400" />
                  Course & Subject Setup
                </Link>

                {isGuest && (
                  <button
                    onClick={() => {
                      resetDemoData();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                    Reset Guest Demo Data
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Peaceful Study Timer Modal */}
      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
      />
    </header>
  );
}
