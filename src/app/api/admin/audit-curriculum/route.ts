import { NextRequest, NextResponse } from "next/server";
import { runCsExecutiveCurriculumAudit } from "@/lib/curriculumAudit";
import { CS_EXECUTIVE_OFFICIAL_CURRICULUM } from "@/lib/csExecutiveCurriculum";
import { StorageRepository } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const auditReport = runCsExecutiveCurriculumAudit();

  return NextResponse.json({
    success: true,
    data: auditReport,
    summary: {
      totalSubjects: CS_EXECUTIVE_OFFICIAL_CURRICULUM.length,
      totalChapters: auditReport.totalPdfChapters,
      verifiedChapters: auditReport.totalChaptersVerified,
      missingChapters: auditReport.totalMissing,
      mismatchedChapters: auditReport.totalMismatch,
      duplicates: auditReport.totalDuplicate,
      accuracyPercentage: auditReport.overallAccuracyPct,
      isFullyVerified: auditReport.isFullyVerified,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const studentId = body.studentId || "student-active";

    const result = StorageRepository.migrateCsExecutiveCurriculum(studentId);

    return NextResponse.json({
      success: result.migrated,
      data: result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error during migration",
      },
      { status: 500 }
    );
  }
}
