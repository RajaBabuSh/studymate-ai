import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@studymate.ai").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@StudyMate2026!";

    // Check if the user is attempting to login as admin
    if (normalizedEmail !== adminEmail) {
      return NextResponse.json(
        {
          error:
            "Access Denied: This portal is restricted to authorized administrators. Student accounts cannot sign in here.",
        },
        { status: 403 }
      );
    }

    // Verify admin credentials
    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid administrative credentials." },
        { status: 401 }
      );
    }

    const adminUser = {
      id: "admin-master-001",
      email: normalizedEmail,
      full_name: "Lead Academic Administrator",
      role: "admin" as const,
      created_at: "2026-01-01T00:00:00.000Z",
      last_login_at: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      admin: adminUser,
      message: "Admin authentication successful",
    });

    // Set secure cookie for session
    response.cookies.set("studymate_admin_token", "admin-session-token-verified", {
      httpOnly: false, // Accessible to client admin layout guard
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error during administrator verification." },
      { status: 500 }
    );
  }
}
