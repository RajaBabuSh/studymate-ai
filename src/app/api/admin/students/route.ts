import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseServerClient, isServerSupabaseConfigured } from "@/lib/supabaseServer";
import { StorageRepository } from "@/lib/storage";
import { Student } from "@/types/database";

export const dynamic = "force-dynamic";

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

  try {
    const studentsList: Student[] = [];
    const seenEmails = new Set<string>();

    // 1. Fetch from Supabase PostgreSQL if configured
    if (isServerSupabaseConfigured) {
      const supabaseAdmin = getSupabaseAdmin();
      let dbStudents: Record<string, unknown>[] | null = null;

      // Method A: Privileged service role client (bypasses RLS)
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from("students")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          dbStudents = data as Record<string, unknown>[];
        } else if (error) {
          console.warn("Service role student fetch failed, trying RPC:", error.message);
        }
      }

      // Method B: Fallback via SECURITY DEFINER RPC function
      if (!dbStudents) {
        const standardClient = getSupabaseServerClient();
        if (standardClient) {
          const { data: rpcData, error: rpcError } = await standardClient.rpc(
            "get_all_students_for_admin"
          );

          if (!rpcError && Array.isArray(rpcData)) {
            dbStudents = rpcData as Record<string, unknown>[];
          } else {
            // Method C: Fallback to standard SELECT query
            const { data: selectData } = await standardClient
              .from("students")
              .select("*")
              .order("created_at", { ascending: false });

            if (Array.isArray(selectData)) {
              dbStudents = selectData as Record<string, unknown>[];
            }
          }
        }
      }

      // Map Supabase rows to Student interface
      if (dbStudents && dbStudents.length > 0) {
        dbStudents.forEach((row) => {
          const email = typeof row.email === "string" ? row.email : "";
          const normalizedEmail = email.toLowerCase();
          if (normalizedEmail) seenEmails.add(normalizedEmail);

          const studentStatus = row.status === "suspended" ? "suspended" : "active";

          studentsList.push({
            id: String(row.id || ""),
            email: email,
            full_name: (typeof row.full_name === "string" ? row.full_name : "") || "Enrolled Student",
            course: typeof row.course === "string" ? row.course : "General Curriculum",
            semester: typeof row.semester === "string" ? row.semester : "Both Groups",
            target_exam: typeof row.target_exam === "string" ? row.target_exam : "Scheduled Examination",
            upcoming_exam_date: typeof row.upcoming_exam_date === "string" ? row.upcoming_exam_date : undefined,
            daily_available_hours: Number(row.daily_available_hours) || 4.5,
            status: studentStatus,
            education_level: typeof row.education_level === "string" ? row.education_level : "Professional (CA, CS, CMA)",
            institution: typeof row.institution === "string" ? row.institution : undefined,
            grade_or_year: typeof row.grade_or_year === "string" ? row.grade_or_year : "Student",
            preferred_study_time: (typeof row.preferred_study_time === "string" ? (row.preferred_study_time as Student["preferred_study_time"]) : "evening") || "evening",
            break_duration_minutes: Number(row.break_duration_minutes) || 15,
            weekly_holiday: typeof row.weekly_holiday === "string" ? row.weekly_holiday : "Sunday",
            onboarding_completed: Boolean(row.onboarding_completed),
            created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
            updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
          });
        });
      }
    }

    // 2. Also check local/offline storage accounts so demo and offline students remain visible
    try {
      const localSummaries = StorageRepository.getAllStudentsSummary();
      localSummaries.forEach(({ student }) => {
        const normalizedEmail = (student.email || "").toLowerCase();
        if (normalizedEmail && !seenEmails.has(normalizedEmail)) {
          seenEmails.add(normalizedEmail);
          studentsList.push(student);
        }
      });
    } catch {
      // Local storage might be empty on server
    }

    return NextResponse.json({
      success: true,
      count: studentsList.length,
      students: studentsList,
    });
  } catch (err: unknown) {
    console.error("Admin students fetch error:", err);
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

    let updatedInDb = false;

    // 1. Update in Supabase if configured
    if (isServerSupabaseConfigured) {
      const supabaseAdmin = getSupabaseAdmin();
      const nowIso = new Date().toISOString();

      if (supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from("students")
          .update({ status, updated_at: nowIso })
          .eq("id", studentId);

        if (!error) updatedInDb = true;
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

    // 2. Also update in local storage repository
    StorageRepository.toggleStudentStatus(studentId, status);

    return NextResponse.json({
      success: true,
      message: `Student account status updated to ${status}.`,
      updatedInDb,
    });
  } catch (err: unknown) {
    console.error("Admin student status update error:", err);
    return NextResponse.json(
      { error: "Failed to update student account status." },
      { status: 500 }
    );
  }
}
