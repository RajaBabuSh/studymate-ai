"use client";

import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import SupportAssistantModal from "@/components/support/SupportAssistantModal";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

function StudentDashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070a13] dark:text-slate-100 antialiased selection:bg-purple-500 selection:text-white transition-colors">
      <Sidebar />
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
      <SupportAssistantModal />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, student, isGuest } = useAuth();

  const isAdminRoute = pathname?.startsWith("/admin");
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/features" ||
    pathname === "/about" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    Boolean(isAdminRoute);
  const isOnboardingRoute = pathname === "/onboarding";

  useEffect(() => {
    if (isLoading || isAdminRoute) return;

    // 1. Unauthenticated users trying to access protected routes -> redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    // 2. Newly registered student who has not completed onboarding -> redirect to onboarding
    if (
      isAuthenticated &&
      !isGuest &&
      student &&
      !student.onboarding_completed &&
      !isOnboardingRoute &&
      !isPublicRoute
    ) {
      router.replace("/onboarding");
      return;
    }

    // 3. Authenticated user visiting /login or /register -> redirect to dashboard
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      if (student && !student.onboarding_completed && !isGuest) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, student, isGuest, pathname, isPublicRoute, isOnboardingRoute, isAdminRoute, router]);

  // Admin routes manage their own isolated layout and authentication guard
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Loading state for protected routes
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 dark:bg-[#070a13] dark:text-slate-200">
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Loading student workspace...</p>
      </div>
    );
  }

  // Public Landing / Auth pages
  if (isPublicRoute) {
    return <main className="min-h-screen bg-slate-50 dark:bg-[#070a13] dark:text-slate-100">{children}</main>;
  }

  // Protected Student Experience wrapped with responsive Sidebar State
  return (
    <SidebarProvider>
      <StudentDashboardShell>{children}</StudentDashboardShell>
    </SidebarProvider>
  );
}
