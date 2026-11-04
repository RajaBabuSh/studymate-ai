import {
  RevisionQueueItem,
  TestQueueItem,
  RevisionStrategyConfig,
} from "@/types/roadmap";
import {
  Subject,
  Chapter,
  RevisionMilestoneType,
} from "@/types/database";
import { StorageRepository } from "./storage";

export const DEFAULT_REVISION_STRATEGIES: RevisionStrategyConfig[] = [
  {
    id: "strategy-standard",
    name: "Standard Spaced Repetition (1 - 7 - 21 Days)",
    description: "Pedagogically proven 3-tier forgetting-curve counter: Rev 1 after 1 day, Rev 2 after 7 days, Rev 3 after 21 days.",
    intervals: [1, 7, 21],
    isDefault: true,
  },
  {
    id: "strategy-intensive",
    name: "Intensive 4-Stage Spacing (1 - 3 - 7 - 14 Days)",
    description: "Designed for high-density statutory laws and computational subjects requiring frequent early reinforcement.",
    intervals: [1, 3, 7, 14],
    isDefault: false,
  },
  {
    id: "strategy-sprint",
    name: "Rapid Examination Sprint (2 - 5 - 10 Days)",
    description: "Accelerated review cadence when examination is fewer than 45 days away.",
    intervals: [2, 5, 10],
    isDefault: false,
  },
];

export interface PreparationCentresData {
  pendingStudy: {
    notStartedChapters: Chapter[];
    inProgressChapters: Chapter[];
    totalPendingCount: number;
    remainingStudyHours: number;
    estimatedCompletionDate: string;
  };
  revisionCentre: {
    activeStrategy: RevisionStrategyConfig;
    rev1Queue: RevisionQueueItem[];
    rev2Queue: RevisionQueueItem[];
    rev3Queue: RevisionQueueItem[];
    additionalQueue: RevisionQueueItem[];
    overdueQueue: RevisionQueueItem[];
    upcomingQueue: RevisionQueueItem[];
    totalPendingRevisionsCount: number;
  };
  testCentre: {
    chapterTests: TestQueueItem[];
    subjectTests: TestQueueItem[];
    mockTests: TestQueueItem[];
    pendingTests: TestQueueItem[];
    completedTests: TestQueueItem[];
    averageScorePct: number;
    weakChapters: Array<{
      chapterId: string;
      chapterTitle: string;
      subjectName: string;
      score: number;
      recommendation: string;
    }>;
  };
}

export const PreparationCentres = {
  /**
   * Computes state for all three independent preparation centres
   */
  getCentresData(
    subjects: Subject[],
    chapters: Chapter[],
    dailyHours: number = 4.5,
    strategyId: string = "strategy-standard"
  ): PreparationCentresData {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const strategy =
      DEFAULT_REVISION_STRATEGIES.find((s) => s.id === strategyId) ||
      DEFAULT_REVISION_STRATEGIES[0];

    const subjectMap = new Map<string, Subject>();
    subjects.forEach((s) => subjectMap.set(s.id, s));

    // =========================================================
    // 1. PENDING STUDY CENTRE
    // =========================================================
    const notStartedChapters = chapters.filter(
      (c) => !c.study_status || c.study_status === "not_started"
    );
    const inProgressChapters = chapters.filter(
      (c) => c.study_status === "in_progress"
    );

    const pendingList = [...notStartedChapters, ...inProgressChapters];
    const remainingStudyHours = pendingList.reduce(
      (sum, c) => sum + (c.estimated_hours || 3.5),
      0
    );

    const studyDaysNeeded = Math.ceil(remainingStudyHours / Math.max(1, dailyHours));
    const completionDate = new Date(today);
    completionDate.setDate(today.getDate() + studyDaysNeeded);

    // =========================================================
    // 2. REVISION CENTRE
    // =========================================================
    const completedStudyChapters = chapters.filter(
      (c) => c.study_status === "completed" || c.status === "completed"
    );

    const rev1Queue: RevisionQueueItem[] = [];
    const rev2Queue: RevisionQueueItem[] = [];
    const rev3Queue: RevisionQueueItem[] = [];
    const additionalQueue: RevisionQueueItem[] = [];
    const overdueQueue: RevisionQueueItem[] = [];
    const upcomingQueue: RevisionQueueItem[] = [];

    completedStudyChapters.forEach((ch) => {
      const sub = subjectMap.get(ch.subject_id);
      const subName = sub?.name || "Subject";
      const revHistory = ch.revision_history || [];

      // Determine next revision milestone
      let nextMilestone: RevisionMilestoneType = "revision_1";
      let daysOffset = strategy.intervals[0] || 1;

      if (revHistory.length === 0) {
        nextMilestone = "revision_1";
        daysOffset = strategy.intervals[0] || 1;
      } else if (revHistory.length === 1) {
        nextMilestone = "revision_2";
        daysOffset = strategy.intervals[1] || 7;
      } else if (revHistory.length === 2) {
        nextMilestone = "revision_3";
        daysOffset = strategy.intervals[2] || 21;
      } else {
        nextMilestone = "additional";
        daysOffset = strategy.intervals[3] || 30;
      }

      // Calculate due date based on study_completed_at or last revision timestamp
      const baseDate =
        revHistory.length > 0
          ? new Date(revHistory[revHistory.length - 1].completed_at)
          : ch.study_completed_at
          ? new Date(ch.study_completed_at)
          : new Date(today);

      const dueDateObj = new Date(baseDate);
      dueDateObj.setDate(baseDate.getDate() + daysOffset);
      const dueDateStr = dueDateObj.toISOString().split("T")[0];

      const diffDays = Math.ceil(
        (dueDateObj.getTime() - today.getTime()) / (1000 * 86400)
      );
      const isOverdue = diffDays < 0;
      const daysOverdue = isOverdue ? Math.abs(diffDays) : 0;

      const item: RevisionQueueItem = {
        id: `rev-item-${ch.id}-${nextMilestone}`,
        chapterId: ch.id,
        chapterTitle: ch.title,
        subjectId: ch.subject_id,
        subjectName: subName,
        milestone: nextMilestone,
        dueDate: dueDateStr,
        isOverdue,
        daysOverdue,
        studyCompletedAt: ch.study_completed_at,
        nature: ch.nature || "theory",
        estimatedHours: Math.round((ch.estimated_hours || 3.5) * 0.35 * 10) / 10,
      };

      if (nextMilestone === "revision_1") rev1Queue.push(item);
      else if (nextMilestone === "revision_2") rev2Queue.push(item);
      else if (nextMilestone === "revision_3") rev3Queue.push(item);
      else additionalQueue.push(item);

      if (isOverdue) overdueQueue.push(item);
      else upcomingQueue.push(item);
    });

    // Sort overdue by most urgent
    overdueQueue.sort((a, b) => b.daysOverdue - a.daysOverdue);
    upcomingQueue.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    // =========================================================
    // 3. TEST CENTRE
    // =========================================================
    const chapterTests: TestQueueItem[] = [];
    const subjectTests: TestQueueItem[] = [];
    const mockTests: TestQueueItem[] = [];
    const pendingTests: TestQueueItem[] = [];
    const completedTests: TestQueueItem[] = [];
    const weakChapters: PreparationCentresData["testCentre"]["weakChapters"] = [];

    let totalScoreSum = 0;
    let scoredTestsCount = 0;

    // A. Chapter Tests (Unlocks as chapters are studied)
    chapters.forEach((ch) => {
      const sub = subjectMap.get(ch.subject_id);
      const subName = sub?.name || "Subject";
      const testHistory = ch.test_history || [];
      const hasAttempt = testHistory.length > 0;
      const lastAttempt = hasAttempt ? testHistory[testHistory.length - 1] : null;

      const isCompleted = hasAttempt;
      const status = isCompleted ? "completed" : "pending";

      const item: TestQueueItem = {
        id: `test-ch-${ch.id}`,
        title: `${ch.title} Diagnostic Test`,
        testType: "chapter",
        chapterId: ch.id,
        chapterTitle: ch.title,
        subjectId: ch.subject_id,
        subjectName: subName,
        dueDate: todayStr,
        status,
        lastScore: lastAttempt?.score,
        maxScore: lastAttempt?.max_score || 50,
        percentage: lastAttempt?.percentage,
        passed: lastAttempt?.passed,
        difficulty: ch.difficulty,
        recommendations:
          lastAttempt && !lastAttempt.passed
            ? "Score below 50%: Schedule a targeted formula & concept drill before proceeding."
            : undefined,
      };

      chapterTests.push(item);
      if (isCompleted) {
        completedTests.push(item);
        if (lastAttempt) {
          totalScoreSum += lastAttempt.percentage;
          scoredTestsCount++;
          if (lastAttempt.percentage < 50) {
            weakChapters.push({
              chapterId: ch.id,
              chapterTitle: ch.title,
              subjectName: subName,
              score: lastAttempt.percentage,
              recommendation: "Focus on statutory provisions & practice past exam MCQ set.",
            });
          }
        }
      } else if (ch.study_status === "completed" || ch.status === "completed") {
        pendingTests.push(item);
      }
    });

    // B. Subject Tests (Sectional)
    subjects.forEach((sub, sIdx) => {
      const subChaps = chapters.filter((c) => c.subject_id === sub.id);
      const doneCount = subChaps.filter(
        (c) => c.study_status === "completed" || c.status === "completed"
      ).length;
      const pct = subChaps.length > 0 ? (doneCount / subChaps.length) * 100 : 0;

      const dueDateObj = new Date(today);
      dueDateObj.setDate(today.getDate() + 7 + sIdx * 3);

      const item: TestQueueItem = {
        id: `test-sub-${sub.id}`,
        title: `${sub.name} Mid-Curriculum Evaluation`,
        testType: "subject",
        subjectId: sub.id,
        subjectName: sub.name,
        dueDate: dueDateObj.toISOString().split("T")[0],
        status: pct >= 50 ? "pending" : "pending",
        maxScore: 100,
        difficulty: "hard",
        recommendations:
          pct < 50
            ? "Complete at least 50% of chapters in this subject to unlock comprehensive sectional test."
            : "Unlocked: Test your cross-chapter synthesis across all covered topics.",
      };

      subjectTests.push(item);
      pendingTests.push(item);
    });

    // C. Full Mock Exams
    subjects.slice(0, 2).forEach((sub, mIdx) => {
      const mockDateObj = new Date(today);
      mockDateObj.setDate(today.getDate() + 14 + mIdx * 5);

      const item: TestQueueItem = {
        id: `mock-${sub.id}-${mIdx}`,
        title: `${sub.name} Full Syllabus Mock Exam (3 Hours)`,
        testType: "mock",
        subjectId: sub.id,
        subjectName: sub.name,
        dueDate: mockDateObj.toISOString().split("T")[0],
        status: "pending",
        maxScore: 100,
        difficulty: "hard",
      };
      mockTests.push(item);
      pendingTests.push(item);
    });

    const averageScorePct =
      scoredTestsCount > 0 ? Math.round(totalScoreSum / scoredTestsCount) : 0;

    return {
      pendingStudy: {
        notStartedChapters,
        inProgressChapters,
        totalPendingCount: pendingList.length,
        remainingStudyHours: Math.round(remainingStudyHours * 10) / 10,
        estimatedCompletionDate: completionDate.toISOString().split("T")[0],
      },
      revisionCentre: {
        activeStrategy: strategy,
        rev1Queue,
        rev2Queue,
        rev3Queue,
        additionalQueue,
        overdueQueue,
        upcomingQueue,
        totalPendingRevisionsCount:
          rev1Queue.length + rev2Queue.length + rev3Queue.length,
      },
      testCentre: {
        chapterTests,
        subjectTests,
        mockTests,
        pendingTests,
        completedTests,
        averageScorePct,
        weakChapters,
      },
    };
  },

  /**
   * Completes a study chapter:
   *  1. Moves chapter out of pending study (`study_status = "completed"`)
   *  2. Automatically schedules Revision 1 in Revision Centre
   *  3. Adds diagnostic test to Test Centre queue
   *  4. DOES NOT automatically complete revisions or tests!
   */
  markStudyChapterCompleted(
    chapterId: string,
    hoursSpent?: number,
    userId?: string
  ): { chapter: Chapter | null; nextRevisionDate: string } {
    const updated = StorageRepository.updateChapterStudyStatus(
      chapterId,
      "completed",
      hoursSpent,
      userId
    );

    const now = new Date();
    const nextRev = new Date(now);
    nextRev.setDate(now.getDate() + 1); // Standard 1-day spacing for Rev 1
    const nextRevisionDate = nextRev.toISOString().split("T")[0];

    return { chapter: updated, nextRevisionDate };
  },

  /**
   * Intelligently reschedules overdue revisions across future days without overloading
   */
  rescheduleOverdueRevisions(
    overdueItems: RevisionQueueItem[],
    dailyHoursBudget: number = 2.0
  ): Array<{ chapterId: string; newDueDate: string }> {
    const today = new Date();
    let dayOffset = 1;
    let accumulatedHours = 0;

    return overdueItems.map((item) => {
      accumulatedHours += item.estimatedHours;
      if (accumulatedHours > dailyHoursBudget) {
        dayOffset++;
        accumulatedHours = item.estimatedHours;
      }

      const newDate = new Date(today);
      newDate.setDate(today.getDate() + dayOffset);

      return {
        chapterId: item.chapterId,
        newDueDate: newDate.toISOString().split("T")[0],
      };
    });
  },
};
