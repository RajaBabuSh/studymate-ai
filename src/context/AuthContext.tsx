"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Student } from "@/types/database";
import { StorageRepository, GUEST_STUDENT } from "@/lib/storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  student: Student | null;
  isGuest: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginAsGuest: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    academicDetails?: {
      course?: string;
      semester?: string;
      targetExam?: string;
      dailyHours?: number;
    }
  ) => Promise<{ error?: string; emailConfirmationRequired?: boolean; message?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  updateStudentProfile: (updates: Partial<Student>) => Promise<void>;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple deterministic hash for offline credential verification
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "hash_" + Math.abs(hash).toString(16) + "_" + str.length;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load student profile for a given user ID
  const loadStudentProfile = useCallback(async (userId: string, email: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("id", userId)
          .single();

        if (!error && data) {
          setStudent(data);
          StorageRepository.setStudent(data, userId);
          if (data.course) {
            StorageRepository.setStudentCourse(data.course, data.semester || "Both Groups", userId);
          }
          return data;
        }
      } catch (err) {
        console.warn("Could not load student from Supabase, checking local", err);
      }
    }

    // Load from user-isolated local store
    let local = StorageRepository.getStudent(userId);
    if (!local) {
      // Fallback check in registered accounts DB
      const acct = StorageRepository.findAccountByEmail(email);
      if (acct) {
        local = acct.student;
      }
    }
    setStudent(local);
    return local;
  }, []);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || "",
            };
            setUser(authUser);
            setIsGuest(false);
            StorageRepository.setActiveSession({
              userId: authUser.id,
              email: authUser.email,
              isGuest: false,
            });
            await loadStudentProfile(authUser.id, authUser.email);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error("Supabase session check error", err);
        }
      }

      // Check active local session
      const activeSession = StorageRepository.getActiveSession();
      if (activeSession) {
        if (activeSession.isGuest) {
          setUser({ id: activeSession.userId, email: activeSession.email });
          setIsGuest(true);
          setStudent(StorageRepository.getStudent(activeSession.userId) || GUEST_STUDENT);
        } else {
          setUser({ id: activeSession.userId, email: activeSession.email });
          setIsGuest(false);
          await loadStudentProfile(activeSession.userId, activeSession.email);
        }
      } else {
        // Logged-out state
        setUser(null);
        setStudent(null);
        setIsGuest(false);
      }

      setIsLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || "",
          };
          setUser(authUser);
          setIsGuest(false);
          StorageRepository.setActiveSession({
            userId: authUser.id,
            email: authUser.email,
            isGuest: false,
          });
          await loadStudentProfile(authUser.id, authUser.email);
        } else {
          setUser(null);
          setStudent(null);
          setIsGuest(false);
          StorageRepository.setActiveSession(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [loadStudentProfile]);

  // 1-Click Guest Demo Mode (strictly isolated under guest namespace)
  const loginAsGuest = () => {
    StorageRepository.resetGuestDemo();
    const guestUser: AuthUser = {
      id: GUEST_STUDENT.id,
      email: GUEST_STUDENT.email,
    };
    StorageRepository.setActiveSession({
      userId: guestUser.id,
      email: guestUser.email,
      isGuest: true,
    });
    setUser(guestUser);
    setIsGuest(true);
    setStudent(GUEST_STUDENT);
  };

  // Student Sign In with real credential validation
  const signInWithEmail = async (email: string, pass: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      return { error: "Please enter both email and password." };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("email not confirmed")) {
          return {
            error:
              "Your email address has not been confirmed yet. Please check your inbox (and spam folder) for the verification link from StudyMate AI.",
          };
        }
        if (msg.includes("invalid login credentials")) {
          return {
            error: "Incorrect email or password. Please verify your credentials or register a new account.",
          };
        }
        return { error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = { id: data.user.id, email: data.user.email || cleanEmail };
        setUser(authUser);
        setIsGuest(false);
        StorageRepository.setActiveSession({
          userId: authUser.id,
          email: authUser.email,
          isGuest: false,
        });
        await loadStudentProfile(authUser.id, authUser.email);
        return {};
      }
    }

    // Offline / Local credential verification
    const account = StorageRepository.findAccountByEmail(cleanEmail);
    if (!account) {
      return {
        error: "No account found with this email. Please check your spelling or register a new account.",
      };
    }

    const inputHash = simpleHash(pass);
    if (account.passwordHash !== inputHash) {
      return { error: "Incorrect password. Please try again." };
    }

    // Login successful
    const authUser: AuthUser = { id: account.id, email: account.email };
    setUser(authUser);
    setIsGuest(false);
    setStudent(account.student);

    StorageRepository.setActiveSession({
      userId: account.id,
      email: account.email,
      isGuest: false,
    });

    return {};
  };

  // Student Sign Up with secure server API and local resilience
  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    academicDetails?: {
      course?: string;
      semester?: string;
      targetExam?: string;
      dailyHours?: number;
    }
  ): Promise<{ error?: string; emailConfirmationRequired?: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !pass || !cleanName) {
      return { error: "Please fill in your name, email, and password." };
    }

    if (pass.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    // Step 1: Call secure server-side registration endpoint
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: pass,
          fullName: cleanName,
          course: academicDetails?.course,
          semester: academicDetails?.semester,
          targetExam: academicDetails?.targetExam,
          dailyHours: academicDetails?.dailyHours,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        return { error: data.error || "Failed to create student account." };
      }

      if (data.emailConfirmationRequired) {
        return {
          emailConfirmationRequired: true,
          message:
            data.message ||
            "Account created! Please check your email inbox to verify your account before logging in.",
        };
      }

      if (data.autoConfirmed || data.session) {
        // Authenticate with Supabase client to initialize browser session if configured
        if (isSupabaseConfigured && supabase) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: pass,
          });
          if (!signInErr && signInData.user) {
            const authUser: AuthUser = { id: signInData.user.id, email: cleanEmail };
            setUser(authUser);
            setIsGuest(false);
            StorageRepository.setActiveSession({
              userId: authUser.id,
              email: authUser.email,
              isGuest: false,
            });
            await loadStudentProfile(authUser.id, authUser.email);
            return {};
          }
        }

        const newUserId = data.user?.id || `student_${Date.now()}`;
        const authUser: AuthUser = { id: newUserId, email: cleanEmail };
        setUser(authUser);
        setIsGuest(false);

        const freshStudent = StorageRepository.initializeFreshStudentAccount(
          newUserId,
          cleanEmail,
          cleanName
        );
        const updatedStudent: Student = {
          ...freshStudent,
          course: academicDetails?.course || "CS Executive",
          semester: academicDetails?.semester || "Both Groups",
          target_exam: academicDetails?.targetExam || `${academicDetails?.course || "CS Executive"} Examination`,
          daily_available_hours: academicDetails?.dailyHours || 4.5,
          onboarding_completed: true,
        };
        StorageRepository.setStudent(updatedStudent, newUserId);
        StorageRepository.setStudentCourse(
          updatedStudent.course || "CS Executive",
          updatedStudent.semester || "Both Groups",
          newUserId
        );
        setStudent(updatedStudent);

        StorageRepository.setActiveSession({
          userId: newUserId,
          email: cleanEmail,
          isGuest: false,
        });

        return {};
      }
    } catch (apiErr) {
      console.warn("Server registration endpoint failed, checking client fallback:", apiErr);
    }

    // Step 2: Client-side Supabase direct signup fallback
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: cleanName,
            course: academicDetails?.course || "CS Executive",
            semester: academicDetails?.semester || "Both Groups",
            target_exam: academicDetails?.targetExam || "CS Executive Examination",
            daily_available_hours: academicDetails?.dailyHours || 4.5,
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user?.identities && data.user.identities.length === 0) {
        return { error: "An account with this email address already exists. Please sign in." };
      }

      if (!data.session) {
        return {
          emailConfirmationRequired: true,
          message:
            "Registration successful! A verification email has been dispatched. Please confirm your email before logging in.",
        };
      }

      if (data.user) {
        const newUserId = data.user.id;
        const authUser: AuthUser = { id: newUserId, email: cleanEmail };
        setUser(authUser);
        setIsGuest(false);

        const freshStudent = StorageRepository.initializeFreshStudentAccount(
          newUserId,
          cleanEmail,
          cleanName
        );
        const updatedStudent: Student = {
          ...freshStudent,
          course: academicDetails?.course || "CS Executive",
          semester: academicDetails?.semester || "Both Groups",
          target_exam: academicDetails?.targetExam || "CS Executive Examination",
          daily_available_hours: academicDetails?.dailyHours || 4.5,
          onboarding_completed: true,
        };
        setStudent(updatedStudent);

        StorageRepository.setActiveSession({
          userId: newUserId,
          email: cleanEmail,
          isGuest: false,
        });

        try {
          await supabase.from("students").upsert({
            id: newUserId,
            email: cleanEmail,
            full_name: cleanName,
            course: updatedStudent.course,
            semester: updatedStudent.semester,
            target_exam: updatedStudent.target_exam,
            daily_available_hours: updatedStudent.daily_available_hours,
            status: "active",
            onboarding_completed: true,
          });
        } catch (dbErr) {
          console.warn("Could not insert to Supabase students table", dbErr);
        }

        return {};
      }
    }

    // Step 3: Offline / Local Account Creation
    const existing = StorageRepository.findAccountByEmail(cleanEmail);
    if (existing) {
      return { error: "An account with this email address already exists. Please sign in." };
    }

    const newUserId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const freshStudent = StorageRepository.initializeFreshStudentAccount(
      newUserId,
      cleanEmail,
      cleanName
    );
    const updatedStudent: Student = {
      ...freshStudent,
      course: academicDetails?.course || "CS Executive",
      semester: academicDetails?.semester || "Both Groups",
      target_exam: academicDetails?.targetExam || `${academicDetails?.course || "CS Executive"} Examination`,
      daily_available_hours: academicDetails?.dailyHours || 4.5,
      onboarding_completed: true,
    };

    // Save to registered accounts DB
    StorageRepository.saveRegisteredAccount({
      id: newUserId,
      email: cleanEmail,
      passwordHash: simpleHash(pass),
      fullName: cleanName,
      student: updatedStudent,
    });

    const authUser: AuthUser = { id: newUserId, email: cleanEmail };
    setUser(authUser);
    setIsGuest(false);
    setStudent(updatedStudent);

    StorageRepository.setActiveSession({
      userId: newUserId,
      email: cleanEmail,
      isGuest: false,
    });

    return {};
  };

  // Password Reset
  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { error: "Please enter your email address." };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) return { error: error.message };
      return { message: "Password reset instructions dispatched to your email!" };
    }

    const account = StorageRepository.findAccountByEmail(cleanEmail);
    if (!account) {
      return { error: "No student account found with this email." };
    }

    return {
      message: `Password reset link verified for ${cleanEmail}. In offline mode, your password remains active or can be reset upon support request.`,
    };
  };

  // Sign Out: completely clear session and state
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error", err);
      }
    }

    StorageRepository.setActiveSession(null);
    setUser(null);
    setStudent(null);
    setIsGuest(false);
  };

  // Update profile
  const updateStudentProfile = async (updates: Partial<Student>) => {
    if (!student || !user) return;
    const updated: Student = {
      ...student,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setStudent(updated);
    StorageRepository.setStudent(updated, user.id);

    if (isSupabaseConfigured && supabase && !isGuest) {
      try {
        await supabase.from("students").update(updates).eq("id", user.id);
      } catch (err) {
        console.warn("Could not sync profile update to Supabase", err);
      }
    }
  };

  const resetDemoData = () => {
    if (isGuest) {
      StorageRepository.resetGuestDemo();
      setStudent(GUEST_STUDENT);
    }
  };

  const isAuthenticated = Boolean(user !== null || isGuest);

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        isGuest,
        isLoading,
        isAuthenticated,
        loginAsGuest,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
        updateStudentProfile,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
