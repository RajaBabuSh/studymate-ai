import { NextRequest, NextResponse } from "next/server";
import { TimetableEngine } from "@/lib/timetableEngine";
import { Chapter, Subject, Examination } from "@/types/database";

interface RawChapterInput {
  id?: string;
  title?: string;
  difficulty?: "easy" | "medium" | "hard";
  estimated_hours?: number;
  status?: string;
  study_status?: "not_started" | "in_progress" | "completed";
  revision_status?: "not_started" | "revised_once" | "mastered";
  nature?: "numerical" | "theory" | "practical" | "mixed";
}

interface RawSubjectInput {
  id?: string;
  name: string;
  code?: string;
  color?: string;
  is_weak?: boolean;
  chapters?: RawChapterInput[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subjects,
      examinations,
      preferences,
      keepExistingSessions,
      existingSessions,
      studentId,
    } = body;

    const activeStudentId = studentId || "student-active";

    if (!subjects || subjects.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one subject is required for timetable generation." },
        { status: 400 }
      );
    }

    // Convert raw extracted subjects to Chapter[] array if chapters are nested
    const flatChapters: Chapter[] = [];
    const formattedSubjects: Subject[] = [];

    (subjects as RawSubjectInput[]).forEach((s, sIdx: number) => {
      const subjectId = s.id || `sub-${sIdx + 1}`;
      formattedSubjects.push({
        id: subjectId,
        student_id: activeStudentId,
        name: s.name,
        code: s.code || `PAPER-${sIdx + 1}`,
        color: s.color || "#6366f1",
        total_chapters: s.chapters?.length || 0,
        completed_chapters: 0,
        is_weak: Boolean(s.is_weak),
        created_at: new Date().toISOString(),
      });

      if (Array.isArray(s.chapters)) {
        s.chapters.forEach((c, cIdx: number) => {
          flatChapters.push({
            id: c.id || `chap-${subjectId}-${cIdx + 1}`,
            subject_id: subjectId,
            student_id: activeStudentId,
            title: c.title || `Chapter ${cIdx + 1}`,
            chapter_number: cIdx + 1,
            difficulty: c.difficulty || "medium",
            estimated_hours: Number(c.estimated_hours) || 3.0,
            status: (c.status as "pending" | "in_progress" | "completed") || "pending",
            study_status: c.study_status || "not_started",
            revision_status: c.revision_status || "not_started",
            notes_count: 0,
            nature: c.nature,
            created_at: new Date().toISOString(),
          });
        });
      }
    });

    console.log(`\n======================================================`);
    console.log(`[AI Timetable Engine] GENERATING TIMETABLE FOR STUDENT: ${activeStudentId}`);
    console.log(` - Confirmed Subjects Count: ${formattedSubjects.length}`);
    console.log(` - Confirmed Subjects: [${formattedSubjects.map((s) => s.name).join(", ")}]`);
    console.log(` - Total Chapters: ${flatChapters.length}`);
    console.log(
      ` - Scheduled Examinations: [${((examinations || []) as Examination[])
        .map((e) => `${e.subject_name}: ${e.exam_date}`)
        .join(" | ")}]`
    );
    console.log(` - Daily Available Hours: ${preferences?.daily_available_hours || 4.5}h`);
    console.log(` - Preferred Study Time: ${preferences?.preferred_study_time || "evening"}`);
    console.log(` - Keep Existing Sessions: ${Boolean(keepExistingSessions)}`);
    console.log(`======================================================`);

    const result = TimetableEngine.generateTimetable({
      subjects: formattedSubjects,
      chapters: flatChapters,
      examinations: (examinations || []) as Examination[],
      dailyHours: Number(preferences?.daily_available_hours) || 4.5,
      preferredTime: preferences?.preferred_study_time || "evening",
      breakDuration: Number(preferences?.break_duration_minutes) || 15,
      weeklyHoliday: preferences?.weekly_holiday || "Sunday",
      prepLevel: preferences?.preparation_level || "intermediate",
      keepExistingSessions: Boolean(keepExistingSessions),
      existingSessions: existingSessions || [],
      planDays: 14,
    });

    const uniqueSubjectsInSessions = Array.from(
      new Set(result.sessions.map((s) => s.subject_name))
    );
    console.log(`[AI Timetable Engine] Synthesis Results:`);
    console.log(` - Total Sessions: ${result.sessions.length}`);
    console.log(` - Subjects in Schedule: [${uniqueSubjectsInSessions.join(", ")}]`);
    console.log(` - Revision Sessions: ${result.revisionSchedule.length}`);
    console.log(` - Test Sessions: ${result.testSchedule.length}`);
    console.log(` - Final Exam Sprint Sessions: ${result.finalExamRevisionPlan.length}`);
    console.log(` - Validation Warnings: ${result.validationWarnings.length}`);

    return NextResponse.json({
      success: true,
      data: {
        sessions: result.sessions,
        dailySchedule: result.dailySchedule,
        weeklySchedule: result.weeklySchedule,
        subjectWisePlan: result.subjectWisePlan,
        chapterWisePlan: result.chapterWisePlan,
        revisionSchedule: result.revisionSchedule,
        testSchedule: result.testSchedule,
        finalExamRevisionPlan: result.finalExamRevisionPlan,
        allocationExplanations: result.allocationExplanations,
        validationWarnings: result.validationWarnings,
      },
    });
  } catch (error: unknown) {
    console.error("Timetable generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate timetable.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
