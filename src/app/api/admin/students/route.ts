import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabaseServer";
import { StorageRepository } from "@/lib/storage";
import { Student } from "@/types/database";

export const dynamic = "force-dynamic";

const CATALOG_COURSES = [
  "CS Executive",
  "CSEET",
  "CS Professional",
  "CA Foundation",
  "CA Intermediate",
  "CA Final",
  "B.Com",
  "BBA",
  "BCA",
];

/**
 * Validates administrative session token from cookies or authorization headers.
 */
function isAuthorizedAdmin(req: NextRequest): boolean {
  const adminCookie = req.cookies.get("studymate_admin_token")?.value;
  const adminHeader = req.headers.get("x-admin-token") || req.headers.get("authorization");

  if (adminCookie === "admin-session-token-verified") return true;
  if (adminHeader && adminHeader.includes("admin-session-token-verified")) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Administrative privileges required." },
      { status: 401 }
    );
  }

  // Check if Supabase connection is available
  if (!isServerSupabaseConfigured) {
    console.warn("[AdminStudents] Supabase is not configured on the server. URL missing.");
    return NextResponse.json({
      success: true,
      count: 0,
      students: [],
      courses: CATALOG_COURSES,
      databaseConnected: false,
      databaseConfigError:
        "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing in Vercel Project Settings.",
    });
  }

  try {
    const studentsMap = new Map<string, Student>();
    const supabaseAdmin = getSupabaseAdmin();
    let databaseConnected = false;

    // =========================================================================
    // Source 1: Query public.students table directly
    // =========================================================================
    let dbProfiles: Record<string, unknown>[] | null = null;

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        dbProfiles = data as Record<string, unknown>[];
        databaseConnected = true;
        console.log(`[AdminStudents] Retrieved ${dbProfiles.length} profiles from public.students via admin client`);
      } else if (error) {
        console.warn("[AdminStudents] public.students query error:", error.message);
      }
    }

    if (!dbProfiles) {
      const standardClient = getSupabaseServerClient();
      if (standardClient) {
        // Fallback A: Try SECURITY DEFINER RPC
        const { data: rpcData, error: rpcErr } = await standardClient.rpc("get_all_students_for_admin");
        if (!rpcErr && Array.isArray(rpcData)) {
          dbProfiles = rpcData as Record<string, unknown>[];
          databaseConnected = true;
        } else {
          // Fallback B: Standard SELECT
          const { data: selData, error: selErr } = await standardClient
            .from("students")
            .select("*")
            .order("created_at", { ascending: false });

          if (!selErr && Array.isArray(selData)) {
            dbProfiles = selData as Record<string, unknown>[];
            databaseConnected = true;
          }
        }
      }
    }

    // Populate students from public.students table
    if (dbProfiles && dbProfiles.length > 0) {
      dbProfiles.forEach((row) => {
        const id = String(row.id || "");
        if (!id) return;

        const email = String(row.email || "").toLowerCase();
        const studentStatus = row.status === "suspended" ? "suspended" : "active";

        studentsMap.set(id, {
          id,
          email,
          full_name: String(row.full_name || "Enrolled Student"),
          course: String(row.course || "CS Executive"),
          semester: String(row.semester || "Both Groups"),
          target_exam: String(row.target_exam || "Scheduled Examination"),
          upcoming_exam_date: typeof row.upcoming_exam_date === "string" ? row.upcoming_exam_date : undefined,
          daily_available_hours: Number(row.daily_available_hours) || 4.5,
          status: studentStatus,
          education_level: String(row.education_level || "Professional (CA, CS, CMA)"),
          institution: typeof row.institution === "string" ? row.institution : undefined,
          grade_or_year: String(row.grade_or_year || "Student"),
          preferred_study_time: (row.preferred_study_time as Student["preferred_study_time"]) || "evening",
          break_duration_minutes: Number(row.break_duration_minutes) || 15,
          weekly_holiday: String(row.weekly_holiday || "Sunday"),
          onboarding_completed: Boolean(row.onboarding_completed),
          created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
          updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
        });
      });
    }

    // =========================================================================
    // Source 2: Query Supabase Auth Users directly (Self-Healing Layer)
    // Ensures students who registered in Auth but experienced a profile insert glitch
    // are ALWAYS displayed and auto-repaired in the database.
    // =========================================================================
    if (supabaseAdmin) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (!authError && authData?.users) {
          databaseConnected = true;
          console.log(`[AdminStudents] Found ${authData.users.length} registered users in auth.users`);

          for (const authUser of authData.users) {
            const userId = authUser.id;
            const meta = (authUser.user_metadata || {}) as Record<string, unknown>;
            const userEmail = (authUser.email || "").toLowerCase();

            // Skip admin master accounts
            if (userEmail.includes("admin@") || meta.role === "admin") {
              continue;
            }

            if (!studentsMap.has(userId)) {
              console.log(`[AdminStudents] Auto-healing missing profile for student: ${userEmail} (${userId})`);

              const studentRecord: Student = {
                id: userId,
                email: userEmail,
                full_name: String(meta.full_name || userEmail.split("@")[0] || "Enrolled Student"),
                course: String(meta.course || "CS Executive"),
                semester: String(meta.semester || "Both Groups"),
                target_exam: String(meta.target_exam || "Scheduled Examination"),
                upcoming_exam_date: typeof meta.upcoming_exam_date === "string" ? meta.upcoming_exam_date : undefined,
                daily_available_hours: Number(meta.daily_available_hours) || 4.5,
                status: "active",
                education_level: "Professional (CA, CS, CMA)",
                grade_or_year: "Student",
                preferred_study_time: "evening",
                break_duration_minutes: 15,
                weekly_holiday: "Sunday",
                onboarding_completed: true,
                created_at: authUser.created_at || new Date().toISOString(),
                updated_at: authUser.created_at || new Date().toISOString(),
              };

              studentsMap.set(userId, studentRecord);

              // Asynchronously backfill into public.students
              supabaseAdmin
                .from("students")
                .upsert({
                  id: userId,
                  email: userEmail,
                  full_name: studentRecord.full_name,
                  course: studentRecord.course,
                  semester: studentRecord.semester,
                  target_exam: studentRecord.target_exam,
                  daily_available_hours: studentRecord.daily_available_hours,
                  status: "active",
                  onboarding_completed: true,
                })
                .then(({ error: backfillErr }) => {
                  if (backfillErr) {
                    console.warn(`[AdminStudents] Backfill notice for ${userId}:`, backfillErr.message);
                  } else {
                    console.log(`[AdminStudents] Backfilled student profile ${userId} successfully`);
                  }
                });
            }
          }
        }
      } catch (authFetchErr) {
        console.warn("[AdminStudents] Auth users list notice:", authFetchErr);
      }
    }

    // =========================================================================
    // Source 3: Offline / Local demo accounts (Development fallback only)
    // =========================================================================
    if (process.env.NODE_ENV !== "production") {
      try {
        const localSummaries = StorageRepository.getAllStudentsSummary();
        localSummaries.forEach(({ student }) => {
          if (!studentsMap.has(student.id)) {
            studentsMap.set(student.id, student);
          }
        });
      } catch {
        // Safe to ignore in headless server
      }
    }

    const allStudentsList = Array.from(studentsMap.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    // Compute dynamic courses: enrolled courses found in database + catalog courses
    const enrolledCourses = Array.from(
      new Set(allStudentsList.map((s) => s.course).filter((c): c is string => Boolean(c && typeof c === "string")))
    );
    const combinedCourses = Array.from(new Set([...enrolledCourses, ...CATALOG_COURSES]));

    console.log(`[AdminStudents] Serving ${allStudentsList.length} total students to admin directory`);

    return NextResponse.json({
      success: true,
      count: allStudentsList.length,
      students: allStudentsList,
      courses: combinedCourses,
      databaseConnected,
    });
  } catch (err: unknown) {
    console.error("[AdminStudents] Unhandled error during student directory fetch:", err);
    return NextResponse.json(
      { error: "Failed to retrieve student directory from database." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Administrative privileges required." },
      { status: 401 }
    );
  }

  try {
    const { studentId, status } = await req.json();

    if (!studentId || !status || (status !== "active" && status !== "suspended")) {
      return NextResponse.json(
        { error: "Valid studentId and status ('active' | 'suspended') are required." },
        { status: 400 }
      );
    }

    console.log(`[AdminStudents] Updating student ${studentId} status to: ${status}`);
    let updatedInDb = false;

    // 1. Update in Supabase if configured
    if (isServerSupabaseConfigured) {
      const supabaseAdmin = getSupabaseAdmin();
      const nowIso = new Date().toISOString();

      if (supabaseAdmin) {
        // Update public.students
        const { error } = await supabaseAdmin
          .from("students")
          .update({ status, updated_at: nowIso })
          .eq("id", studentId);

        if (!error) {
          updatedInDb = true;
          console.log(`[AdminStudents] Status updated in public.students for ${studentId}`);
        } else {
          console.warn("[AdminStudents] Status update notice in public.students:", error.message);
        }

        // Also update auth user metadata
        try {
          await supabaseAdmin.auth.admin.updateUserById(studentId, {
            user_metadata: { status },
          });
        } catch (authMetaErr) {
          console.warn("[AdminStudents] Could not sync status to user_metadata:", authMetaErr);
        }
      }

      if (!updatedInDb) {
        const standardClient = getSupabaseServerClient();
        if (standardClient) {
          const { error: rpcErr } = await standardClient.rpc("update_student_status_for_admin", {
            p_student_id: studentId,
            p_status: status,
          });
          if (!rpcErr) updatedInDb = true;
        }
      }
    }

    // 2. Also update local storage if present
    StorageRepository.toggleStudentStatus(studentId, status);

    return NextResponse.json({
      success: true,
      message: `Student account status updated to ${status}.`,
      updatedInDb,
    });
  } catch (err: unknown) {
    console.error("[AdminStudents] Status update exception:", err);
    return NextResponse.json(
      { error: "Failed to update student account status." },
      { status: 500 }
    );
  }
}
