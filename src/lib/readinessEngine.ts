import {
  Chapter,
  Subject,
  Examination,
  ExamReadinessAnalysis,
} from "@/types/database";

/**
 * AI Examination Readiness & Analytics Engine
 * Implements Phase 4 (Separate Revision and Test Analytics) and
 * Phase 5 (Transparent, Pedagogically Sound Exam Readiness Engine).
 */

export interface TestStats {
  performanceRate: number; // Total marks obtained / Total maximum marks * 100
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalAttempts: number;
  testedChaptersCount: number;
  scoreImprovementRate: number;
}

export const ReadinessEngine = {
  /**
   * Metric A: Syllabus Completion Rate
   * Completed chapters / Total chapters * 100
   */
  calculateSyllabusCompletion(chapters: Chapter[]): number {
    if (!chapters || chapters.length === 0) return 0;
    const completed = chapters.filter(
      (c) => c.study_status === "completed" || c.status === "completed"
    ).length;
    return Math.round((completed / chapters.length) * 100);
  },

  /**
   * Metric B: Revision Completion Rate
   * Completed revision milestones / Planned revision milestones * 100
   * Default planned revisions: 2 per chapter
   */
  calculateRevisionCompletion(
    chapters: Chapter[],
    plannedRevisionsPerChapter: number = 2
  ): { rate: number; totalPlanned: number; completedCount: number } {
    if (!chapters || chapters.length === 0) {
      return { rate: 0, totalPlanned: 0, completedCount: 0 };
    }

    const totalPlanned = chapters.length * plannedRevisionsPerChapter;
    let completedCount = 0;

    chapters.forEach((c) => {
      if (c.revision_history && c.revision_history.length > 0) {
        completedCount += Math.min(c.revision_history.length, plannedRevisionsPerChapter);
      } else if (c.revision_status === "mastered") {
        completedCount += plannedRevisionsPerChapter;
      } else if (c.revision_status === "revised_once") {
        completedCount += 1;
      }
    });

    const rate = totalPlanned > 0 ? Math.round((completedCount / totalPlanned) * 100) : 0;
    return {
      rate: Math.min(100, rate),
      totalPlanned,
      completedCount,
    };
  },

  /**
   * Metric C: Test Performance Rate
   * Total marks obtained / Total maximum marks across all attempts * 100
   * Plus highest, lowest, average, and score improvement tracking.
   */
  calculateTestPerformance(chapters: Chapter[]): TestStats {
    let totalMarksEarned = 0;
    let totalMaxMarks = 0;
    let highest = 0;
    let lowest = 100;
    let totalAttempts = 0;
    const testedChapters = new Set<string>();

    const attemptsList: Array<{ percentage: number; date: string }> = [];

    chapters.forEach((c) => {
      if (c.test_history && c.test_history.length > 0) {
        testedChapters.add(c.id);
        c.test_history.forEach((att) => {
          totalMarksEarned += att.score;
          totalMaxMarks += att.max_score || 100;
          totalAttempts++;

          const pct = att.percentage ?? (att.score / (att.max_score || 100)) * 100;
          if (pct > highest) highest = pct;
          if (pct < lowest) lowest = pct;

          attemptsList.push({
            percentage: pct,
            date: att.attempted_at,
          });
        });
      }
    });

    if (totalAttempts === 0) {
      return {
        performanceRate: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalAttempts: 0,
        testedChaptersCount: 0,
        scoreImprovementRate: 0,
      };
    }

    // Sort chronologically for improvement calculation
    attemptsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let improvementRate = 0;
    if (attemptsList.length >= 2) {
      const firstScore = attemptsList[0].percentage;
      const latestScore = attemptsList[attemptsList.length - 1].percentage;
      improvementRate = Math.round(latestScore - firstScore);
    }

    const performanceRate = Math.round((totalMarksEarned / totalMaxMarks) * 100);
    const avgScore = Math.round(
      attemptsList.reduce((acc, a) => acc + a.percentage, 0) / attemptsList.length
    );

    return {
      performanceRate,
      averageScore: avgScore,
      highestScore: Math.round(highest),
      lowestScore: Math.round(lowest === 100 && totalAttempts === 0 ? 0 : lowest),
      totalAttempts,
      testedChaptersCount: testedChapters.size,
      scoreImprovementRate: improvementRate,
    };
  },

  /**
   * Metric D: Test Coverage Rate
   * Chapters with at least one completed test / Total eligible chapters * 100
   */
  calculateTestCoverage(chapters: Chapter[]): number {
    if (!chapters || chapters.length === 0) return 0;
    const testedCount = chapters.filter(
      (c) => c.test_history && c.test_history.length > 0
    ).length;
    return Math.round((testedCount / chapters.length) * 100);
  },

  /**
   * PHASE 5: Comprehensive Transparent Exam Readiness Engine
   * Calculates multi-factor readiness score with transparent weights and explanations.
   */
  calculateExamReadiness(
    subjects: Subject[],
    chapters: Chapter[],
    exams: Examination[],
    dailyHours: number = 4.5
  ): ExamReadinessAnalysis {
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(
      (c) => c.study_status === "completed" || c.status === "completed"
    ).length;
    const inProgressChapters = chapters.filter(
      (c) => c.study_status === "in_progress" || c.status === "in_progress"
    ).length;
    const notStartedChapters = totalChapters - completedChapters - inProgressChapters;

    // Component Rates
    const syllabusRate = this.calculateSyllabusCompletion(chapters);
    const revObj = this.calculateRevisionCompletion(chapters, 2);
    const revisionRate = revObj.rate;
    const testStats = this.calculateTestPerformance(chapters);
    const testPerformanceRate = testStats.performanceRate;
    const testCoverageRate = this.calculateTestCoverage(chapters);

    // Timeline & Consistency Factor
    let timelineFactor = 80; // Baseline
    let nearestExamDays = 60;
    if (exams && exams.length > 0) {
      const now = new Date();
      const examDates = exams
        .map((e) => new Date(e.exam_date).getTime())
        .filter((t) => !isNaN(t) && t > now.getTime());
      if (examDates.length > 0) {
        nearestExamDays = Math.ceil((Math.min(...examDates) - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Pending hours required
    const pendingHours = chapters
      .filter((c) => c.study_status !== "completed" && c.status !== "completed")
      .reduce((sum, c) => sum + (c.estimated_hours || 3.0), 0);

    const availableHoursUntilExam = nearestExamDays * dailyHours;

    if (availableHoursUntilExam < pendingHours) {
      // Overload risk
      timelineFactor = Math.max(30, Math.round((availableHoursUntilExam / pendingHours) * 70));
    } else if (availableHoursUntilExam >= pendingHours * 1.5) {
      timelineFactor = 95; // Ample buffer
    } else {
      timelineFactor = 85;
    }

    // Weighted Formula Weights:
    // Syllabus: 30%, Revision: 25%, Test Performance: 25%, Test Coverage: 10%, Timeline: 10%
    const syllabusWeight = 0.30;
    const revisionWeight = 0.25;
    const testPerfWeight = 0.25;
    const testCoverageWeight = 0.10;
    const consistencyWeight = 0.10;

    let weightedScore =
      syllabusRate * syllabusWeight +
      revisionRate * revisionWeight +
      testPerformanceRate * testPerfWeight +
      testCoverageRate * testCoverageWeight +
      timelineFactor * consistencyWeight;

    // If student has done 0 tests, do not punish excessively, but cap readiness at 75%
    if (testStats.totalAttempts === 0 && syllabusRate > 40) {
      const adjustedWeight =
        syllabusRate * 0.45 + revisionRate * 0.35 + timelineFactor * 0.20;
      weightedScore = Math.min(75, Math.round(adjustedWeight * 0.85));
    }

    const overallScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    let grade: ExamReadinessAnalysis["grade"] = "Critical Risk";
    if (overallScore >= 80) grade = "Exemplary";
    else if (overallScore >= 65) grade = "Ready";
    else if (overallScore >= 45) grade = "Moderate Risk";

    // Subject-wise Readiness Breakdown
    const subjectReadiness = subjects.map((sub) => {
      const subChapters = chapters.filter((c) => c.subject_id === sub.id);
      const subTotal = subChapters.length;
      if (subTotal === 0) {
        return {
          subject_id: sub.id,
          subject_name: sub.name,
          readiness_percentage: 0,
          syllabus_covered: 0,
          revision_rate: 0,
          average_score: 0,
          is_weak: Boolean(sub.is_weak),
          status: "at_risk" as const,
        };
      }

      const subSyl = this.calculateSyllabusCompletion(subChapters);
      const subRev = this.calculateRevisionCompletion(subChapters, 2).rate;
      const subTests = this.calculateTestPerformance(subChapters);
      const subScore = Math.round(subSyl * 0.45 + subRev * 0.30 + (subTests.averageScore || subSyl) * 0.25);

      let status: "ready" | "needs_focus" | "at_risk" = "at_risk";
      if (subScore >= 70) status = "ready";
      else if (subScore >= 45) status = "needs_focus";

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        readiness_percentage: Math.min(100, subScore),
        syllabus_covered: subSyl,
        revision_rate: subRev,
        average_score: subTests.averageScore,
        is_weak: Boolean(sub.is_weak),
        status,
      };
    });

    // Risk Warnings Generation
    const riskWarnings: string[] = [];
    if (syllabusRate < 50 && nearestExamDays < 45) {
      riskWarnings.push(
        `Critical: Syllabus is only ${syllabusRate}% covered with ${nearestExamDays} days until examination.`
      );
    }
    if (availableHoursUntilExam < pendingHours) {
      riskWarnings.push(
        `Insufficient Preparation Time: You have ${Math.round(pendingHours)}h of study required but only ${Math.round(availableHoursUntilExam)}h available before exams.`
      );
    }
    if (testStats.totalAttempts === 0) {
      riskWarnings.push(
        "Zero Chapter Practice Tests: High examination risk. Concept mastery without testing leads to exam hall recall failure."
      );
    } else if (testCoverageRate < 35 && completedChapters > 3) {
      riskWarnings.push(
        `Low Test Coverage: Only ${testCoverageRate}% of chapters have been tested. Target at least 70% coverage before final mocks.`
      );
    }
    if (revisionRate < 30 && completedChapters >= 4) {
      riskWarnings.push(
        `Low Revision Rate (${revisionRate}%): Completed chapters risk retention decay without Spaced Revision Milestones 1 & 2.`
      );
    }

    // Pedagogical Recommendations
    const recommendations: string[] = [];
    if (testStats.totalAttempts === 0) {
      recommendations.push(
        "Attempt your first Smart Practice Test in an in-progress chapter to unlock calibrated scoring."
      );
    }
    const weakSub = subjectReadiness.find((s) => s.is_weak || s.status === "at_risk");
    if (weakSub) {
      recommendations.push(
        `Allocate a 40% study buffer to "${weakSub.subject_name}" during morning peak alertness hours.`
      );
    }
    if (inProgressChapters > 4) {
      recommendations.push(
        `You have ${inProgressChapters} chapters simultaneously in progress. Complete current chapters before opening new ones.`
      );
    }
    recommendations.push(
      "Enforce 3-day spaced recall on completed numerical problems to lock retention."
    );

    const formulaExplanation =
      "Overall Readiness is mathematically calculated from: Syllabus Coverage (30%) + Revision Milestones (25%) + Test Marks Performance (25%) + Test Coverage (10%) + Timeline Buffer Factor (10%). It does not rely on subjective guesses.";

    return {
      overall_score: overallScore,
      grade,
      breakdown: {
        syllabus_completion_rate: syllabusRate,
        syllabus_weight: 30,
        revision_completion_rate: revisionRate,
        revision_weight: 25,
        test_performance_rate: testPerformanceRate,
        test_performance_weight: 25,
        test_coverage_rate: testCoverageRate,
        test_coverage_weight: 10,
        consistency_and_timeline_factor: timelineFactor,
        consistency_weight: 10,
      },
      metrics: {
        total_chapters: totalChapters,
        completed_chapters: completedChapters,
        in_progress_chapters: inProgressChapters,
        not_started_chapters: notStartedChapters,
        total_planned_revisions: revObj.totalPlanned,
        completed_revisions: revObj.completedCount,
        total_tests_attempted: testStats.totalAttempts,
        average_test_score: testStats.averageScore,
        highest_test_score: testStats.highestScore,
        lowest_test_score: testStats.lowestScore,
        tested_chapters_count: testStats.testedChaptersCount,
      },
      subject_readiness: subjectReadiness,
      risk_warnings: riskWarnings,
      recommendations: recommendations,
      formula_explanation: formulaExplanation,
    };
  },
};
