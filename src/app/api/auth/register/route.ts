import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseServerClient, isServerSupabaseConfigured } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, course, semester, targetExam, dailyHours } = body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");
    const cleanName = String(fullName || "").trim();
    const selectedCourse = String(course || "CS Executive").trim();
    const selectedSemester = String(semester || "Both Groups").trim();
    const selectedTargetExam = String(targetExam || `${selectedCourse} Examination`).trim();
    const numDailyHours = Number(dailyHours) || 4.5;

    // Field Validations
    if (!cleanEmail || !cleanPassword || !cleanName) {
      return NextResponse.json(
        { error: "Full name, email address, and password are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters in length." },
        { status: 400 }
      );
    }

    // Check if Supabase backend is configured
    if (isServerSupabaseConfigured) {
      const supabaseAdmin = getSupabaseAdmin();

      // Case 1: SUPABASE_SERVICE_ROLE_KEY is available (Production Recommended)
      if (supabaseAdmin) {
        // Attempt to create user with auto-confirmation for immediate seamless student onboarding
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            full_name: cleanName,
            course: selectedCourse,
            semester: selectedSemester,
            target_exam: selectedTargetExam,
            daily_available_hours: numDailyHours,
          },
        });

        if (createError) {
          const errMsg = createError.message.toLowerCase();
          if (
            errMsg.includes("already registered") ||
            errMsg.includes("already exists") ||
            errMsg.includes("unique constraint") ||
            errMsg.includes("duplicate key")
          ) {
            return NextResponse.json(
              { error: "An account with this email address already exists. Please sign in instead." },
              { status: 409 }
            );
          }
          return NextResponse.json(
            { error: createError.message || "Failed to create student account." },
            { status: 400 }
          );
        }

        const newUserId = userData.user.id;
        const nowIso = new Date().toISOString();

        // Persist profile into public.students table
        const { error: profileError } = await supabaseAdmin.from("students").upsert({
          id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          course: selectedCourse,
          semester: selectedSemester,
          target_exam: selectedTargetExam,
          daily_available_hours: numDailyHours,
          status: "active",
          onboarding_completed: true,
          created_at: nowIso,
          updated_at: nowIso,
        });

        if (profileError) {
          console.warn("Could not insert profile record into students table:", profileError.message);
        }

        return NextResponse.json({
          success: true,
          autoConfirmed: true,
          user: {
            id: newUserId,
            email: cleanEmail,
            full_name: cleanName,
          },
          message: "Student account created successfully.",
        });
      }

      // Case 2: Only NEXT_PUBLIC_SUPABASE_ANON_KEY is configured on the server
      const standardClient = getSupabaseServerClient();
      if (standardClient) {
        const { data: signUpData, error: signUpError } = await standardClient.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: cleanName,
              course: selectedCourse,
              semester: selectedSemester,
              target_exam: selectedTargetExam,
              daily_available_hours: numDailyHours,
            },
          },
        });

        if (signUpError) {
          return NextResponse.json(
            { error: signUpError.message },
            { status: 400 }
          );
        }

        // Supabase returns empty identities array when user already exists (enumeration prevention)
        if (signUpData.user?.identities && signUpData.user.identities.length === 0) {
          return NextResponse.json(
            { error: "An account with this email address already exists. Please sign in instead." },
            { status: 409 }
          );
        }

        // If email confirmation is required by Supabase project settings
        if (!signUpData.session) {
          return NextResponse.json({
            success: true,
            emailConfirmationRequired: true,
            user: signUpData.user,
            message: "Registration successful! A verification email has been dispatched. Please confirm your email before signing in.",
          });
        }

        return NextResponse.json({
          success: true,
          session: signUpData.session,
          user: signUpData.user,
          message: "Student account created successfully.",
        });
      }
    }

    // Case 3: Offline / Local Mode (Supabase not configured)
    return NextResponse.json({
      success: true,
      offlineMode: true,
      user: {
        id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: cleanEmail,
        full_name: cleanName,
      },
      message: "Offline student profile created successfully.",
    });
  } catch (error) {
    console.error("Student registration API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during account registration. Please try again." },
      { status: 500 }
    );
  }
}
