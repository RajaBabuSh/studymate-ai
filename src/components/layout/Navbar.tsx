"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import {
  Bell,
  Calendar,
  User,
  LogOut,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Sliders,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { StorageRepository } from "@/lib/storage";
import { Examination, Reminder, Announcement } from "@/types/database";
import { getDaysRemaining } from "@/lib/utils";

export default function Navbar() {
  const router = useRouter();
  const { user, student, isGuest, signOut, resetDemoData } = useAuth();
  const { isCollapsed, isMobileOpen, toggleSidebar } = useSidebar();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [nearestExam, setNearestExam] = useState<Examination | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
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

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await signOut();
    router.replace("/login");
  };

  const daysLeft = nearestExam ? getDaysRemaining(nearestExam.exam_date) : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 md:px-8 backdrop-blur-md shadow-xs transition-colors">
      {/* Top Left: Clean Sidebar Toggle Button + Academic Status Banner */}
      <div className="flex items-center gap-3">
        {/* Sidebar ON/OFF Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-xs hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 active:scale-95 transition-all focus:outline-none cursor-pointer"
          aria-label={
            isMobileOpen
              ? "Close sidebar menu"
              : isCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            isMobileOpen
              ? "Close sidebar menu"
              : isCollapsed
              ? "Expand sidebar (Full Navigation)"
              : "Collapse sidebar (Compact Rail)"
          }
        >
          {/* Mobile indicator */}
          <span className="md:hidden flex items-center justify-center">
            {isMobileOpen ? (
              <X className="h-5 w-5 text-purple-600" />
            ) : (
              <Menu className="h-5 w-5 text-slate-700" />
            )}
          </span>

          {/* Desktop / Tablet indicator */}
          <span className="hidden md:flex items-center justify-center">
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5 text-slate-700 hover:text-purple-600 transition-colors" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-slate-700 hover:text-purple-600 transition-colors" />
            )}
          </span>
        </button>

        {/* Nearest Exam Countdown Banner */}
        {nearestExam && (
          <div className="hidden lg:flex items-center gap-2 rounded-full bg-purple-50 border border-purple-100 px-3 py-1 text-xs font-medium text-purple-900 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
            <span>
              Next Exam: <strong>{nearestExam.subject_name}</strong> in{" "}
              <span className="font-bold text-purple-700">
                {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : "Today!") : "Upcoming"}
              </span>
            </span>
          </div>
        )}

        {isGuest && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            Guest Preview Mode
          </span>
        )}
      </div>

      {/* Top Right: Notifications & Profile (Timer and AI Timetable buttons cleanly removed) */}
      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 shadow-xs transition"
            title="Notifications & Academic Alerts"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {reminders.length + announcements.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-xs">
                {reminders.length + announcements.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xl z-50 animate-slide-up">
              {/* Announcements Section */}
              {announcements.length > 0 && (
                <div className="mb-3 pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block mb-2">
                    Faculty & Exam Alerts
                  </span>
                  <div className="space-y-2">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-2xl border border-purple-100 bg-purple-50/60 p-2.5 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          <Megaphone className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-900 text-[11px]">
                              {ann.title}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">
                              {ann.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Study Reminders
                </span>
                <Link
                  href="/resources"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-purple-600 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reminders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No pending reminders</p>
                ) : (
                  reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">{rem.title}</p>
                          {rem.description && (
                            <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">
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
            className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 pr-3 hover:bg-slate-50 shadow-xs transition"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {student?.full_name ? student.full_name.charAt(0) : "S"}
            </div>
            <span className="hidden md:inline text-xs font-bold text-slate-800">
              {student?.full_name || "Student"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-slate-200/80 bg-white p-3 shadow-xl z-50 animate-slide-up">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {student?.full_name || "Enrolled Student"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {student?.email || "student@studymate.ai"}
                </p>
                {student?.course && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100">
                    <Sparkles className="h-2.5 w-2.5" />
                    {student.course}
                  </span>
                )}
              </div>

              <div className="py-2 space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="h-4 w-4 text-purple-600" />
                  <span>Student Profile & Course</span>
                </Link>

                <Link
                  href="/academic"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Sliders className="h-4 w-4 text-blue-600" />
                  <span>Curriculum & Date Sheet</span>
                </Link>

                {isGuest && (
                  <button
                    onClick={() => {
                      resetDemoData();
                      setShowProfileMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left"
                  >
                    <RefreshCw className="h-4 w-4 text-amber-500" />
                    <span>Reset Preview Data</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
