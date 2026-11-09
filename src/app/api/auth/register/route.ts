import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getSupabaseServerClient,
  isServerSupabaseConfigured,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/lib/supabaseServer";

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

    console.log(`[AuthRegister] Registration attempt: ${cleanEmail} for course: ${selectedCourse}`);

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
    if (!isServerSupabaseConfigured) {
      console.error("[AuthRegister] CRITICAL: Supabase URL is not configured on this server!");
      console.error(`[AuthRegister] SUPABASE_URL exists: ${Boolean(SUPABASE_URL)}, SERVICE_ROLE_KEY exists: ${Boolean(SUPABASE_SERVICE_ROLE_KEY)}`);

      // In production, reject offline dummy mode so user knows environment variables are missing
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            error:
              "Production Database Error: Supabase cloud environment variables are missing on Vercel. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Vercel Project Settings > Environment Variables.",
            databaseConfigured: false,
          },
          { status: 503 }
        );
      }

      // Offline / Local Development Fallback
      return NextResponse.json({
        success: true,
        offlineMode: true,
        user: {
          id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email: cleanEmail,
          full_name: cleanName,
        },
        message: "Offline student profile created successfully (Local dev only).",
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // =========================================================================
    // Case 1: SUPABASE_SERVICE_ROLE_KEY is available (Production Standard)
    // =========================================================================
    if (supabaseAdmin) {
      console.log(`[AuthRegister] Using privileged Supabase Admin client for: ${cleanEmail}`);

      // Create user with email auto-confirmation for immediate student access
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
        console.error("[AuthRegister] auth.admin.createUser failed:", createError.message);
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
      console.log(`[AuthRegister] Auth user created successfully. ID: ${newUserId}. Inserting student profile...`);

      // Persist profile into public.students table with full schema
      const fullProfilePayload = {
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
      };

      let profileSaved = false;
      const { error: profileError } = await supabaseAdmin.from("students").upsert(fullProfilePayload);

      if (!profileError) {
        profileSaved = true;
        console.log(`[AuthRegister] Student profile successfully persisted to public.students for ${newUserId}`);
      } else {
        console.warn("[AuthRegister] Full profile upsert warning:", profileError.message);
        // Fallback: retry with minimal core columns in case custom columns (semester/status) are pending migration
        const coreProfilePayload = {
          id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          course: selectedCourse,
          target_exam: selectedTargetExam,
          daily_available_hours: numDailyHours,
          onboarding_completed: true,
        };
        const { error: coreError } = await supabaseAdmin.from("students").upsert(coreProfilePayload);
        if (!coreError) {
          profileSaved = true;
          console.log(`[AuthRegister] Student profile persisted with core columns for ${newUserId}`);
        } else {
          console.error("[AuthRegister] Core profile upsert also failed:", coreError.message);
        }
      }

      return NextResponse.json({
        success: true,
        autoConfirmed: true,
        profileSaved,
        user: {
          id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          course: selectedCourse,
          semester: selectedSemester,
        },
        message: "Student account created successfully.",
      });
    }

    // =========================================================================
    // Case 2: Only NEXT_PUBLIC_SUPABASE_ANON_KEY is available on the server
    // =========================================================================
    console.log(`[AuthRegister] SUPABASE_SERVICE_ROLE_KEY missing. Falling back to anon signUp for: ${cleanEmail}`);
    const standardClient = getSupabaseServerClient();
    if (!standardClient) {
      return NextResponse.json(
        { error: "Supabase client initialization failed on the server." },
        { status: 500 }
      );
    }

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
      console.error("[AuthRegister] standardClient.auth.signUp error:", signUpError.message);
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    // Supabase returns empty identities array when user already exists (enumeration prevention)
    if (signUpData.user?.identities && signUpData.user.identities.length === 0) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Attempt direct profile insert with standard client (works if RLS INSERT policy is active)
    if (signUpData.user) {
      try {
        await standardClient.from("students").upsert({
          id: signUpData.user.id,
          email: cleanEmail,
          full_name: cleanName,
          course: selectedCourse,
          semester: selectedSemester,
          target_exam: selectedTargetExam,
          daily_available_hours: numDailyHours,
          status: "active",
          onboarding_completed: true,
        });
      } catch (err) {
        console.warn("[AuthRegister] Standard client profile upsert notice:", err);
      }
    }

    // If email confirmation is required by Supabase project settings
    if (!signUpData.session) {
      return NextResponse.json({
        success: true,
        emailConfirmationRequired: true,
        user: signUpData.user,
        message:
          "Registration successful! A verification email has been dispatched. Please confirm your email before signing in.",
      });
    }

    return NextResponse.json({
      success: true,
      session: signUpData.session,
      user: signUpData.user,
      message: "Student account created successfully.",
    });
  } catch (error) {
    console.error("[AuthRegister] Unhandled exception during student registration:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during account registration. Please try again." },
      { status: 500 }
    );
  }
}
