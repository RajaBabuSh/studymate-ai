import {
  CompleteRoadmapPlan,
  RoadmapPhase1,
  RoadmapPhase2,
  RoadmapPhase3,
  RoadmapFeasibility,
} from "@/types/roadmap";
import { Subject, Chapter, Examination } from "@/types/database";
import { getChapterStrategy } from "./chapterIntelligence";
import { runCsExecutiveCurriculumAudit } from "./curriculumAudit";

export interface RoadmapEngineParams {
  studentId: string;
  examName: string;
  targetExamDate: string; // YYYY-MM-DD
  dailyHours: number;
  subjects: Subject[];
  chapters: Chapter[];
  examinations?: Examination[];
  weakSubjects?: string[];
  startDate?: string;
}

export const RoadmapEngine = {
  /**
   * Generates the multi-phase roadmap dynamically from actual student curriculum
   */
  generateRoadmap(params: RoadmapEngineParams): CompleteRoadmapPlan {
    const {
      studentId,
      examName,
      targetExamDate,
      dailyHours,
      subjects,
      chapters,
      examinations = [],
      weakSubjects = [],
      startDate = new Date().toISOString().split("T")[0],
    } = params;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const target = new Date(targetExamDate);
    target.setHours(0, 0, 0, 0);

    const totalDaysDiff = Math.max(
      1,
      Math.ceil((target.getTime() - start.getTime()) / (1000 * 86400))
    );

    // 1. Audit Check on Syllabus
    const audit = runCsExecutiveCurriculumAudit(
      subjects.map((s) => ({
        subjectName: s.name,
        chapters: chapters
          .filter((c) => c.subject_id === s.id)
          .map((c) => ({ title: c.title, chapterNumber: c.chapter_number })),
      }))
    );

    const isAuditPassed = audit.isFullyVerified;
    const auditIssuesCount = audit.totalMissing + audit.totalMismatch;

    // 2. Phase 1: Syllabus Completion
    let phase1TotalHours = 0;
    const subjectDeadlines: RoadmapPhase1["subjectDeadlines"] = [];
    const chapterDeadlines: RoadmapPhase1["chapterDeadlines"] = [];

    // Map examination dates by subject
    const examDateMap = new Map<string, string>();
    examinations.forEach((e) => {
      examDateMap.set(e.subject_name.toLowerCase(), e.exam_date);
    });

    let cumulativeStudyDays = 0;

    subjects.forEach((sub) => {
      const isWeak =
        sub.is_weak ||
        weakSubjects.includes(sub.name) ||
        weakSubjects.includes(sub.id);
      const subChaps = chapters.filter((c) => c.subject_id === sub.id);
      const subPending = subChaps.filter(
        (c) => c.study_status !== "completed" && c.status !== "completed"
      );

      let subHours = 0;
      subPending.forEach((ch) => {
        const strategy = getChapterStrategy(sub.name, ch.title, ch.estimated_hours);
        const diffMultiplier =
          ch.difficulty === "hard" ? 1.4 : ch.difficulty === "easy" ? 0.9 : 1.1;
        const natureMultiplier = strategy.nature === "numerical" ? 1.25 : 1.0;
        const weakMultiplier = isWeak ? 1.3 : 1.0;

        const effectiveHours =
          Math.round(
            (ch.estimated_hours || 3.5) *
              diffMultiplier *
              natureMultiplier *
              weakMultiplier *
              10
          ) / 10;

        subHours += effectiveHours;
        phase1TotalHours += effectiveHours;

        // Daily pacing: dedicate portion of daily hours to this chapter
        const daysForChap = Math.max(1, Math.round(effectiveHours / Math.max(2, dailyHours * 0.6)));
        cumulativeStudyDays += daysForChap;

        const chapDeadline = new Date(start);
        chapDeadline.setDate(start.getDate() + cumulativeStudyDays);

        chapterDeadlines.push({
          chapterId: ch.id,
          title: ch.title,
          subjectName: sub.name,
          deadlineDate: chapDeadline.toISOString().split("T")[0],
          nature: strategy.nature,
          difficulty: ch.difficulty,
          estimatedHours: effectiveHours,
        });
      });

      const subDeadline = new Date(start);
      subDeadline.setDate(start.getDate() + cumulativeStudyDays);

      subjectDeadlines.push({
        subjectId: sub.id,
        subjectName: sub.name,
        deadlineDate: subDeadline.toISOString().split("T")[0],
        pendingChaptersCount: subPending.length,
        allocatedHours: Math.round(subHours * 10) / 10,
        isWeak,
      });
    });

    const phase1Days = Math.max(
      1,
      Math.ceil(phase1TotalHours / Math.max(1, dailyHours))
    );
    const phase1TargetDate = new Date(start);
    phase1TargetDate.setDate(start.getDate() + phase1Days);

    const phase1: RoadmapPhase1 = {
      startDate,
      targetDate: phase1TargetDate.toISOString().split("T")[0],
      totalDays: phase1Days,
      totalHours: Math.round(phase1TotalHours * 10) / 10,
      dailyHours,
      subjectDeadlines,
      chapterDeadlines,
    };

    // 3. Phase 2: Revision (Spaced Repetition: 35% for Rev 1, 20% for Rev 2, 10% for Rev 3)
    const rev1Hours = Math.round(phase1TotalHours * 0.35 * 10) / 10;
    const rev2Hours = Math.round(phase1TotalHours * 0.2 * 10) / 10;
    const rev3Hours = Math.round(phase1TotalHours * 0.1 * 10) / 10;
    const phase2TotalHours = rev1Hours + rev2Hours + rev3Hours;
    const phase2Days = Math.max(1, Math.ceil(phase2TotalHours / Math.max(1, dailyHours)));

    const phase2Start = new Date(phase1TargetDate);
    phase2Start.setDate(phase2Start.getDate() + 1);

    const rev1Deadline = new Date(phase2Start);
    rev1Deadline.setDate(phase2Start.getDate() + Math.ceil(rev1Hours / dailyHours));

    const rev2Deadline = new Date(rev1Deadline);
    rev2Deadline.setDate(rev1Deadline.getDate() + Math.ceil(rev2Hours / dailyHours));

    const rev3Deadline = new Date(rev2Deadline);
    rev3Deadline.setDate(rev2Deadline.getDate() + Math.ceil(rev3Hours / dailyHours));

    const phase2: RoadmapPhase2 = {
      startDate: phase2Start.toISOString().split("T")[0],
      targetDate: rev3Deadline.toISOString().split("T")[0],
      totalDays: phase2Days,
      totalHours: Math.round(phase2TotalHours * 10) / 10,
      revision1Deadline: rev1Deadline.toISOString().split("T")[0],
      revision2Deadline: rev2Deadline.toISOString().split("T")[0],
      revision3Deadline: rev3Deadline.toISOString().split("T")[0],
      milestones: [
        {
          title: "Revision 1 (First Spaced Review)",
          date: rev1Deadline.toISOString().split("T")[0],
          focus: "Comprehensive summary notes, statutory formulas, and 15 practice MCQs per lesson.",
          type: "rapid_recap",
        },
        {
          title: "Revision 2 (Deep Problem & Case Analysis)",
          date: rev2Deadline.toISOString().split("T")[0],
          focus: "Unsolved past examination numerical problems, practical case laws, and drafting drills.",
          type: "deep_review",
        },
        {
          title: "Revision 3 (Pre-Exam Sprint Marathon)",
          date: rev3Deadline.toISOString().split("T")[0],
          focus: "Rapid-fire cram sheets, standard section limits, and master formula sheets.",
          type: "mock_marathon",
        },
      ],
    };

    // 4. Phase 3: Tests & Exam Practice
    const phase3Start = new Date(rev2Deadline);
    const mockExamList: RoadmapPhase3["mockExams"] = [];

    // Schedule 1 full mock per subject in the final 14 days
    subjects.forEach((sub, sIdx) => {
      const mockDate = new Date(target);
      mockDate.setDate(target.getDate() - Math.max(3, 14 - sIdx * 2));

      mockExamList.push({
        title: `${sub.name} Full Examination Mock Simulation`,
        date: mockDate.toISOString().split("T")[0],
        subjectName: sub.name,
        durationMinutes: 180,
        purpose: "Official 3-hour strict timed simulation adhering to standard ICSI marking pattern.",
      });
    });

    const phase3TotalHours = chapters.length * 0.75 + subjects.length * 3; // 45m per chapter test + 3h mock per subject
    const phase3Days = Math.max(1, Math.ceil(phase3TotalHours / Math.max(1, dailyHours)));

    const phase3: RoadmapPhase3 = {
      startDate: phase3Start.toISOString().split("T")[0],
      targetDate: targetExamDate,
      totalDays: phase3Days,
      chapterTestsCount: chapters.length,
      subjectTestsCount: subjects.length * 2,
      mockExams: mockExamList,
    };

    // 5. Feasibility & Workload Realism Calculation
    const grandRequiredHours =
      phase1TotalHours + phase2TotalHours + phase3TotalHours;
    const totalAvailableHours = totalDaysDiff * dailyHours;
    const gapHours = Math.round((grandRequiredHours - totalAvailableHours) * 10) / 10;
    const isRealistic = totalAvailableHours >= grandRequiredHours * 0.85;

    const recommendedDailyHours =
      Math.ceil((grandRequiredHours / totalDaysDiff) * 10) / 10;

    const recExtDate = new Date(start);
    recExtDate.setDate(start.getDate() + Math.ceil(grandRequiredHours / dailyHours));

    const alternativeSuggestions: string[] = [];
    if (!isRealistic) {
      alternativeSuggestions.push(
        `Increase your daily study commitment from ${dailyHours} hrs to at least ${recommendedDailyHours} hrs/day to cover all 3 phases comfortably.`
      );
      alternativeSuggestions.push(
        `Consider scheduling your target examination completion to ${
          recExtDate.toISOString().split("T")[0]
        } (+${Math.ceil((recExtDate.getTime() - target.getTime()) / 86400000)} days) to prevent cramming and burnout.`
      );
      alternativeSuggestions.push(
        `Streamline Revision 2 by focusing strictly on high-yield statutory and numerical chapters carrying 70%+ of historical marks.`
      );
    }

    const feasibility: RoadmapFeasibility = {
      isRealistic,
      totalRequiredHours: Math.round(grandRequiredHours * 10) / 10,
      totalAvailableHours: Math.round(totalAvailableHours * 10) / 10,
      gapHours: gapHours > 0 ? gapHours : 0,
      recommendedDailyHours,
      recommendedExamDate: recExtDate.toISOString().split("T")[0],
      warningMessage: isRealistic
        ? undefined
        : `Workload Alert: The requested target date requires ${Math.round(grandRequiredHours)} hours of preparation, but only ${Math.round(totalAvailableHours)} hours are available at ${dailyHours} hrs/day. Adjust daily hours or extend target date.`,
      alternativeSuggestions,
    };

    return {
      id: `roadmap-${Date.now()}`,
      studentId,
      examName,
      targetExamDate,
      startDate,
      totalPreparationDays: totalDaysDiff,
      dailyStudyHours: dailyHours,
      isSyllabusAuditVerified: isAuditPassed,
      auditIssuesCount,
      phase1,
      phase2,
      phase3,
      feasibility,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
