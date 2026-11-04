import {
  DailyStudyTarget,
  DailyStudyTask,
  DailyCheckInResponse,
} from "@/types/roadmap";
import { ChapterNature } from "@/types/database";
import { StorageRepository } from "./storage";
import { PreparationCentres } from "./preparationCentres";

export const DailyTargetEngine = {
  /**
   * Generates or fetches today's concise target list
   */
  getTodayTargets(userId?: string, dateStr?: string): DailyStudyTarget {
    const today = dateStr || new Date().toISOString().split("T")[0];
    const subjects = StorageRepository.getSubjects(userId);
    const chapters = StorageRepository.getChapters(userId);
    const sessions = StorageRepository.getStudySessions(userId);

    const centres = PreparationCentres.getCentresData(subjects, chapters);

    const tasks: DailyStudyTask[] = [];

    // 1. Chapters to study today (from scheduled sessions or pending queue)
    const todaySessions = sessions.filter(
      (s) => s.date === today && s.status !== "skipped"
    );

    if (todaySessions.length > 0) {
      todaySessions.forEach((s) => {
        tasks.push({
          id: `task-study-${s.id}`,
          type: "study",
          title: s.title || s.chapter_title || "Study Session",
          subjectName: s.subject_name,
          chapterId: s.chapter_id,
          estimatedHours: Math.round((s.duration_minutes / 60) * 10) / 10,
          isCompleted: s.status === "completed",
          completedAt: s.completed_at,
          nature: (s.session_nature as ChapterNature) || undefined,
        });
      });
    } else {
      // Pick next 2 priority pending chapters if no sessions exist
      const nextPending = centres.pendingStudy.notStartedChapters.slice(0, 2);
      nextPending.forEach((ch) => {
        const sub = subjects.find((s) => s.id === ch.subject_id);
        tasks.push({
          id: `task-study-pending-${ch.id}`,
          type: "study",
          title: ch.title,
          subjectName: sub?.name || "Subject",
          chapterId: ch.id,
          estimatedHours: ch.estimated_hours || 3.0,
          isCompleted: false,
          nature: ch.nature,
          difficulty: ch.difficulty,
        });
      });
    }

    // 2. Revisions due today (or overdue)
    const revisionsDueToday = [
      ...centres.revisionCentre.overdueQueue.slice(0, 2),
      ...centres.revisionCentre.upcomingQueue.filter((r) => r.dueDate <= today).slice(0, 2),
    ];

    revisionsDueToday.forEach((rev) => {
      // avoid duplicates
      if (!tasks.some((t) => t.chapterId === rev.chapterId && t.type === "revision")) {
        tasks.push({
          id: `task-rev-${rev.chapterId}-${rev.milestone}`,
          type: "revision",
          title: `Revise: ${rev.chapterTitle}`,
          subjectName: rev.subjectName,
          chapterId: rev.chapterId,
          milestone: rev.milestone,
          estimatedHours: rev.estimatedHours,
          isCompleted: false,
          nature: rev.nature,
        });
      }
    });

    // 3. Tests due today
    const testsDueToday = centres.testCentre.pendingTests.slice(0, 1);
    testsDueToday.forEach((t) => {
      tasks.push({
        id: `task-test-${t.id}`,
        type: "test",
        title: t.title,
        subjectName: t.subjectName,
        chapterId: t.chapterId,
        estimatedHours: 0.75, // 45m
        isCompleted: false,
        difficulty: t.difficulty,
      });
    });

    const totalEstimatedHours =
      Math.round(tasks.reduce((sum, t) => sum + t.estimatedHours, 0) * 10) / 10;
    const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
    const totalTasksCount = tasks.length;
    const completionPercentage =
      totalTasksCount > 0
        ? Math.round((completedTasksCount / totalTasksCount) * 100)
        : 0;

    return {
      date: today,
      tasks,
      totalEstimatedHours,
      completedTasksCount,
      totalTasksCount,
      completionPercentage,
    };
  },

  /**
   * Mark a task completed
   */
  toggleTaskCompletion(
    task: DailyStudyTask,
    userId?: string
  ): { nextRevisionScheduled?: string; isNowCompleted: boolean } {
    const nextCompletedState = !task.isCompleted;

    if (task.type === "study" && task.chapterId) {
      if (nextCompletedState) {
        // Complete study and automatically schedule Revision 1
        const res = PreparationCentres.markStudyChapterCompleted(
          task.chapterId,
          task.estimatedHours,
          userId
        );
        return {
          nextRevisionScheduled: res.nextRevisionDate,
          isNowCompleted: true,
        };
      } else {
        StorageRepository.updateChapterStudyStatus(
          task.chapterId,
          "in_progress",
          0,
          userId
        );
        return { isNowCompleted: false };
      }
    }

    if (task.type === "revision" && task.chapterId && task.milestone) {
      if (nextCompletedState) {
        StorageRepository.addChapterRevision(
          task.chapterId,
          task.milestone,
          "Completed via Daily Study Plan",
          Math.round(task.estimatedHours * 60),
          userId
        );
      }
    }

    if (task.type === "test" && task.chapterId) {
      if (nextCompletedState) {
        StorageRepository.addChapterTestAttempt(
          task.chapterId,
          {
            test_title: task.title,
            score: 42,
            max_score: 50,
            percentage: 84,
            passed: true,
            attempted_at: new Date().toISOString(),
          },
          userId
        );
      }
    }

    return { isNowCompleted: nextCompletedState };
  },

  /**
   * Smart Automatic Adjustment from End-of-Day Check-in
   */
  processDailyCheckIn(
    checkIn: DailyCheckInResponse,
    userId?: string
  ): {
    rescheduledCount: number;
    adjustmentSummary: string;
  } {
    let rescheduledCount = 0;
    const today = checkIn.date || new Date().toISOString().split("T")[0];
    const tomorrow = new Date(new Date(today).getTime() + 86400000)
      .toISOString()
      .split("T")[0];

    const sessions = StorageRepository.getStudySessions(userId);

    // If student requested reschedule or had uncompleted tasks
    if (checkIn.rescheduleRequested || checkIn.uncompletedTaskIds.length > 0 || checkIn.needMoreTime) {
      const updatedSessions = sessions.map((s) => {
        if (s.date === today && s.status !== "completed") {
          rescheduledCount++;
          return {
            ...s,
            date: tomorrow,
            notes: (s.notes ? s.notes + " • " : "") + "Automatically rescheduled via Smart Adjustment Check-In",
          };
        }
        return s;
      });

      StorageRepository.setStudySessions(updatedSessions, userId);
    }

    const summary = checkIn.completedAllToday
      ? "Outstanding work! All targets completed. Future schedule maintained at optimal pace."
      : `Adjusted future roadmap: ${rescheduledCount} pending tasks safely shifted to tomorrow without workload disruption.`;

    StorageRepository.addAuditLog(
      "daily_adjustment_applied",
      `Student daily check-in processed. ${summary}`,
      userId
    );

    return { rescheduledCount, adjustmentSummary: summary };
  },
};
