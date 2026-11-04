/**
 * End-to-End Automated Test for StudyMate AI Smart Study Roadmap & Preparation Management
 */

import { CS_EXECUTIVE_OFFICIAL_CURRICULUM, CS_EXECUTIVE_EXAM_DATESHEET } from "../src/lib/csExecutiveCurriculum";
import { runCsExecutiveCurriculumAudit } from "../src/lib/curriculumAudit";
import { RoadmapEngine } from "../src/lib/roadmapEngine";
import { PreparationCentres, DEFAULT_REVISION_STRATEGIES } from "../src/lib/preparationCentres";
import { DailyTargetEngine } from "../src/lib/dailyTargetEngine";
import { StorageRepository } from "../src/lib/storage";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runAllTests() {
  console.log("================================================================================");
  console.log("RUNNING STUDYMATE AI SMART ROADMAP & PREPARATION MANAGEMENT VERIFICATION SUITE");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // TEST 1: MODULE 1 - OFFICIAL CS EXECUTIVE SYLLABUS AUDIT (128 VERBATIM CHAPTERS)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 1] Verifying 128-Chapter Official Curriculum Structure...");
  assert(CS_EXECUTIVE_OFFICIAL_CURRICULUM.length === 7, "Exactly 7 official subjects present");

  const expectedCounts = [
    { paper: 1, name: "Jurisprudence, Interpretation & General Laws", count: 14 },
    { paper: 2, name: "Company Law & Practice", count: 17 },
    { paper: 3, name: "Setting Up of Business, Industrial & Labour Laws", count: 23 },
    { paper: 4, name: "Corporate Accounting & Financial Management", count: 19 },
    { paper: 5, name: "Capital Markets & Securities Laws", count: 18 },
    { paper: 6, name: "Economic, Commercial & Intellectual Property Laws", count: 17 },
    { paper: 7, name: "Tax Laws & Practice", count: 20 },
  ];

  let grandTotal = 0;
  expectedCounts.forEach((exp) => {
    const sub = CS_EXECUTIVE_OFFICIAL_CURRICULUM.find((s) => s.paperNumber === exp.paper);
    assert(!!sub, `Paper ${exp.paper} found`);
    assert(sub!.chapters.length === exp.count, `Paper ${exp.paper} (${sub!.subjectName}) has exactly ${exp.count} lessons (found: ${sub!.chapters.length})`);
    grandTotal += sub!.chapters.length;
  });

  assert(grandTotal === 128, `Grand total is exactly 128 chapters (found: ${grandTotal})`);

  // Run the curriculum audit against the curriculum itself
  const auditReport = runCsExecutiveCurriculumAudit(
    CS_EXECUTIVE_OFFICIAL_CURRICULUM.map((s) => ({
      subjectName: s.subjectName,
      chapters: s.chapters.map((c) => ({ title: c.title, chapterNumber: c.chapterNumber })),
    }))
  );

  assert(auditReport.isFullyVerified === true, "Curriculum audit passes with 100% verified status");
  assert(auditReport.totalMissing === 0, "Curriculum audit has 0 missing chapters");
  assert(auditReport.totalMismatch === 0, "Curriculum audit has 0 mismatched chapters");
  assert(auditReport.overallAccuracyPct === 100, "Overall accuracy is 100%");
  assert(CS_EXECUTIVE_EXAM_DATESHEET.length === 7, "Datesheet contains 7 scheduled exam dates");

  // ---------------------------------------------------------------------------
  // TEST 2: MODULE 2 - THREE SEPARATE PREPARATION CENTRES
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 2] Verifying Three Separate Preparation Centres Separation...");
  const testUserId = "test-student-roadmap-e2e";

  // Initialize fresh curriculum for the test user
  StorageRepository.migrateCsExecutiveCurriculum(testUserId);
  const subjects = StorageRepository.getSubjects(testUserId);
  const chapters = StorageRepository.getChapters(testUserId);

  assert(subjects.length === 7, "User has 7 subjects");
  assert(chapters.length === 128, "User has 128 chapters");

  const centresData = PreparationCentres.getCentresData(testUserId);

  // A: Pending Study
  assert(centresData.pendingStudy.totalPendingCount === 128, "Initially all 128 chapters are pending study");
  assert(centresData.pendingStudy.notStartedChapters.length === 128, "128 chapters not started");
  assert(centresData.pendingStudy.remainingStudyHours > 0, `Pending study hours calculated: ${centresData.pendingStudy.remainingStudyHours} hrs`);

  // B: Revision Centre
  assert(centresData.revisionCentre.totalRevisionsDue === 0, "Initially 0 revisions are due before study is completed");
  assert(DEFAULT_REVISION_STRATEGIES.length >= 3, "At least 3 configurable spaced repetition strategies provided");

  // C: Test Centre
  assert(centresData.testCentre.chapterTests.length === 128, "All 128 chapter diagnostic tests available in Test Centre");
  assert(centresData.testCentre.subjectTests.length === 7, "7 subject sectional tests available in Test Centre");
  assert(centresData.testCentre.mockExams.length >= 3, "Full mock marathon exams registered");

  // ---------------------------------------------------------------------------
  // TEST 3: MODULE 2 & 5 - CHAPTER STUDY COMPLETION & AUTOMATIC REVISION 1 QUEUING
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 3] Testing Study Completion -> Auto Schedule Revision 1 without marking revision complete...");
  const firstChapter = chapters[0];
  const completionResult = PreparationCentres.markStudyChapterCompleted(firstChapter.id, 3.5, testUserId);

  assert(completionResult.success === true, "Chapter study marked as completed");
  assert(!!completionResult.nextRevisionDate, `Next revision date scheduled: ${completionResult.nextRevisionDate}`);

  // Re-fetch centres data
  const postCompleteCentres = PreparationCentres.getCentresData(testUserId);

  assert(postCompleteCentres.pendingStudy.totalPendingCount === 127, "Pending study chapters reduced to 127");
  assert(postCompleteCentres.revisionCentre.revision1Queue.length === 1, "Revision 1 queue now contains exactly 1 scheduled chapter");
  assert(postCompleteCentres.revisionCentre.revision1Queue[0].chapterId === firstChapter.id, "Queued chapter matches the completed chapter");
  
  // Verify revision is NOT marked complete automatically
  const updatedChapter = StorageRepository.getChapters(testUserId).find((c) => c.id === firstChapter.id);
  assert(updatedChapter!.study_status === "completed", "study_status is 'completed'");
  assert(updatedChapter!.revision_status !== "completed", "revision_status is NOT marked completed (separation verified)");
  assert(updatedChapter!.test_status !== "passed", "test_status is NOT marked completed (separation verified)");

  // ---------------------------------------------------------------------------
  // TEST 4: MODULE 3 - 3-PHASE AUTOMATIC AI STUDY ROADMAP & REALISTIC FEASIBILITY
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 4] Generating 3-Phase Multi-Phase Roadmap & Feasibility Check...");
  
  // Case A: Realistic timeline (e.g., 180 days out, 5.0 hrs/day)
  const realisticTargetDate = new Date();
  realisticTargetDate.setDate(realisticTargetDate.getDate() + 180);
  const realisticDateStr = realisticTargetDate.toISOString().split("T")[0];

  const planA = RoadmapEngine.generateRoadmap({
    studentId: testUserId,
    examName: "CS Executive Examination",
    targetExamDate: realisticDateStr,
    dailyHours: 5.0,
    subjects,
    chapters,
  });

  assert(planA.totalPreparationDays === 180, "Roadmap computes 180 preparation days");
  assert(planA.phase1.subjectDeadlines.length === 7, "Phase 1 computes deadlines for all 7 subjects");
  assert(planA.phase1.chapterDeadlines.length > 0, "Phase 1 computes pacing for every pending chapter");
  assert(planA.phase2.milestones.length > 0, "Phase 2 computes spaced revision passes");
  assert(planA.phase3.mockExams.length >= 3, "Phase 3 schedules full 3-hour mock marathon exams");
  assert(planA.feasibility.isRealistic === true, "Plan A is verified realistic within 5 hrs/day across 180 days");

  // Case B: Overly tight deadline (e.g. 30 days for 128 chapters at 2 hrs/day)
  const tightTargetDate = new Date();
  tightTargetDate.setDate(tightTargetDate.getDate() + 30);
  const tightDateStr = tightTargetDate.toISOString().split("T")[0];

  const planB = RoadmapEngine.generateRoadmap({
    studentId: testUserId,
    examName: "CS Executive Examination",
    targetExamDate: tightDateStr,
    dailyHours: 2.0,
    subjects,
    chapters,
  });

  assert(planB.feasibility.isRealistic === false, "Feasibility engine flags unrealistic schedule");
  assert(planB.feasibility.gapHours > 0, `Detected deficit of ${planB.feasibility.gapHours} hours`);
  assert(planB.feasibility.alternativeSuggestions.length >= 2, "Engine generates constructive alternative solutions");

  // ---------------------------------------------------------------------------
  // TEST 5: MODULE 4 - SIMPLE DAILY STUDY PLAN ("TODAY'S TARGET")
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 5] Testing Daily Target Engine (Today's Targets)...");
  const todayTargets = DailyTargetEngine.getTodayTargets(testUserId);

  assert(todayTargets.tasks.length > 0, "Today's targets contains active tasks");
  assert(todayTargets.totalEstimatedHours > 0, `Total estimated hours today: ${todayTargets.totalEstimatedHours}h`);
  assert(todayTargets.completionPercentage >= 0 && todayTargets.completionPercentage <= 100, "Completion percentage is bounded");

  // Toggle task completion
  const firstTask = todayTargets.tasks[0];
  const toggleResult = DailyTargetEngine.toggleTaskCompletion(firstTask, testUserId);
  assert(toggleResult.success === true, "Task completion toggled successfully");
  assert(toggleResult.isNowCompleted === true, "Task status changed to completed");

  // ---------------------------------------------------------------------------
  // TEST 6: MODULE 8 - SMART END-OF-DAY ADJUSTMENT (CHECK-IN)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST 6] Testing Smart End-of-Day Check-In & Auto-Reschedule...");
  const checkInRes = DailyTargetEngine.processDailyCheckIn(
    {
      date: new Date().toISOString().split("T")[0],
      completedAllToday: false,
      uncompletedTaskIds: ["task-dummy-uncompleted"],
      foundDifficult: true,
      difficultySubject: "CAFM",
      difficultyNotes: "Found cash flows difficult",
      needMoreTime: true,
      additionalHoursNeeded: 1.5,
      rescheduleRequested: true,
      studentNotes: "Shifted today's unfinished portions to tomorrow",
      recordedAt: new Date().toISOString(),
    },
    testUserId
  );

  assert(checkInRes.success === true, "Daily check-in processed successfully");
  assert(checkInRes.rescheduledSessionsCount >= 0, "Rescheduled sessions counted");

  console.log("\n================================================================================");
  console.log("ALL 6 ROADMAP ENGINE & PREPARATION CENTRES MODULE TESTS PASSED WITH 100% SUCCESS!");
  console.log("================================================================================\n");
}

runAllTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
