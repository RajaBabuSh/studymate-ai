import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getSupabaseServerClient,
  isServerSupabaseConfigured,
  SUPABASE_URL,
  serverUrlValidation,
  serviceRoleKeyValidation,
  anonKeyValidation,
} from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

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

  let host: string | null = null;
  if (serverUrlValidation.isValid && SUPABASE_URL) {
    try {
      const u = new URL(SUPABASE_URL);
      host = u.host;
    } catch {
      host = "invalid-url";
    }
  } else if (serverUrlValidation.errorType) {
    host = `error-${serverUrlValidation.errorType.toLowerCase()}`;
  }

  const rawUrlSet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);

  const statusReport = {
    configured: isServerSupabaseConfigured,
    hasUrl: rawUrlSet,
    urlValidation: {
      isValid: serverUrlValidation.isValid,
      projectRef: serverUrlValidation.projectRef,
      errorType: serverUrlValidation.errorType,
    },
    hasAnonKey: anonKeyValidation.isValid,
    hasServiceRoleKey: serviceRoleKeyValidation.isValid,
    supabaseHost: host,
    connectionWorking: false,
    tableExists: false,
    totalAuthUsers: null as number | null,
    totalStudentProfiles: null as number | null,
    diagnosticMessages: [] as string[],
    actionItems: [] as string[],
  };

  if (!serverUrlValidation.isValid) {
    statusReport.diagnosticMessages.push(
      serverUrlValidation.errorMessage || "NEXT_PUBLIC_SUPABASE_URL is invalid."
    );
    statusReport.actionItems.push(
      "Set NEXT_PUBLIC_SUPABASE_URL in Vercel Project Settings > Environment Variables. Expected format: https://YOUR_PROJECT_REF.supabase.co"
    );
  }

  if (!serviceRoleKeyValidation.isValid) {
    statusReport.diagnosticMessages.push(
      serviceRoleKeyValidation.errorMessage || "SUPABASE_SERVICE_ROLE_KEY is missing or invalid."
    );
    statusReport.actionItems.push(
      "Copy your service_role secret key from Supabase Dashboard (Settings > API > service_role) and add it as SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables."
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Test Admin Connection
  if (supabaseAdmin) {
    try {
      // 1. Check public.students table
      const { count, error: countErr } = await supabaseAdmin
        .from("students")
        .select("id", { count: "exact", head: true });

      if (!countErr) {
        statusReport.tableExists = true;
        statusReport.connectionWorking = true;
        statusReport.totalStudentProfiles = count ?? 0;
      } else {
        statusReport.diagnosticMessages.push(
          `public.students table check error: ${countErr.message}`
        );
        statusReport.actionItems.push(
          "Run supabase/migrations/20261110_fix_student_sync.sql in your Supabase SQL Editor to create the required tables and columns."
        );
      }

      // 2. Check auth.users
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });

      if (!authErr) {
        statusReport.connectionWorking = true;
        statusReport.totalAuthUsers = authData.users ? authData.users.length : 0;
      } else {
        statusReport.diagnosticMessages.push(
          `auth.users check error: ${authErr.message}`
        );
      }
    } catch (e: unknown) {
      statusReport.diagnosticMessages.push(
        `Admin connection error: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  } else {
    // Test Standard Client Connection
    const standardClient = getSupabaseServerClient();
    if (standardClient) {
      try {
        const { error } = await standardClient.from("students").select("id").limit(1);
        if (!error) {
          statusReport.connectionWorking = true;
          statusReport.tableExists = true;
        } else {
          statusReport.diagnosticMessages.push(`Standard client query: ${error.message}`);
        }
      } catch (e: unknown) {
        statusReport.diagnosticMessages.push(
          `Standard client exception: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
  }

  return NextResponse.json({ success: true, status: statusReport });
}
