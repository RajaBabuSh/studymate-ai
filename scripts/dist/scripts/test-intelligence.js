import { COURSE_CATALOG, getCourseSyllabusInfo, findSubjectInCatalog } from "../src/lib/courseCatalog";
import { ReadinessEngine } from "../src/lib/readinessEngine";
import { TimetableEngine } from "../src/lib/timetableEngine";
import { detectChapterNature } from "../src/lib/examPlannerEngine";
let passed = 0;
let failed = 0;
function assert(condition, testName, details) {
    if (condition) {
        console.log(`[PASS] ${testName}`);
        passed++;
    }
    else {
        console.error(`[FAIL] ${testName} ${details ? "- " + details : ""}`);
        failed++;
    }
}
console.log("==================================================");
console.log("STUDYMATE AI - COMPREHENSIVE INTELLIGENCE TEST SUITE");
console.log("==================================================\n");
// 1. COURSE CATALOG & OFFICIAL CURRICULUM VERIFICATION
console.log("--- 1. OFFICIAL SYLLABUS & CURRICULUM INDEX ---");
assert(COURSE_CATALOG.length >= 10, "Course catalog contains all major academic streams", `Found ${COURSE_CATALOG.length} courses`);
const caInter = COURSE_CATALOG.find(c => c.id === "ca-inter");
assert(Boolean(caInter && caInter.examBody === "ICAI" && caInter.syllabusVersion.includes("2024-2026") && caInter.isVerified), "CA Intermediate syllabus verified with ICAI 2024-2026");
const csExec = COURSE_CATALOG.find(c => c.id === "cs-exec");
assert(Boolean(csExec && csExec.examBody === "ICSI" && csExec.isVerified), "CS Executive syllabus verified with ICSI 2022/2026");
const bcom = COURSE_CATALOG.find(c => c.id === "bcom");
assert(Boolean(bcom && bcom.examBody === "UGC / State Universities" && bcom.isVerified), "B.Com syllabus verified with UGC CBCS guidelines");
const class12 = COURSE_CATALOG.find(c => c.id === "class-12");
assert(Boolean(class12 && class12.examBody === "CBSE / State Boards" && class12.isVerified), "Class 12 syllabus verified with CBSE/State Boards");
const syllabusInfo = getCourseSyllabusInfo("ca-inter");
assert(syllabusInfo.examBody === "ICAI" && syllabusInfo.isVerified, "getCourseSyllabusInfo helper returns verified metadata");
const foundSubject = findSubjectInCatalog("ca-inter", "Corporate & Other Laws");
assert(Boolean(foundSubject && foundSubject.code === "PAPER-2"), "findSubjectInCatalog finds ICAI subject by name");
// 2. CHAPTER NATURE DETECTION (NUMERICAL VS THEORY)
console.log("\n--- 2. CHAPTER NATURE DETECTION (NUMERICAL VS THEORY) ---");
const mathNature = detectChapterNature("Integration, Differentiation & Calculus", "ca-foundation");
assert(mathNature === "numerical", "Calculus correctly detected as numerical", `Detected: ${mathNature}`);
const lawNature = detectChapterNature("Companies Act Provisions & Corporate Law", "ca-inter");
assert(lawNature === "theory", "Companies Act correctly detected as theory", `Detected: ${lawNature}`);
const statsNature = detectChapterNature("Linear Regression and Statistical Practical Exercises", "bcom");
assert(statsNature === "practical" || statsNature === "numerical" || statsNature === "mixed", "Statistics detected as practical/numerical/mixed", `Detected: ${statsNature}`);
// 3. READINESS ENGINE & SEPARATE ANALYTICS
console.log("\n--- 3. AI EXAM READINESS ENGINE & SEPARATED ANALYTICS ---");
const mockChapters = [
    {
        id: "c1",
        subject_id: "s1",
        student_id: "st-1",
        title: "Accounting Standards",
        chapter_number: 1,
        difficulty: "medium",
        estimated_hours: 6,
        status: "completed",
        study_status: "completed",
        study_completed_at: "2026-11-01T10:00:00Z",
        study_hours_spent: 7,
        revision_status: "revised_once",
        revision_history: [
            { id: "r1", milestone: "revision_1", date: "2026-11-02", score_or_confidence: 85, completed: true }
        ],
        test_status: "passed",
        test_history: [
            { id: "t1", test_type: "chapter_quiz", date: "2026-11-03", marks_obtained: 42, max_marks: 50, percentage: 84, status: "passed" }
        ],
        notes_count: 2,
        created_at: "2026-11-01"
    },
    {
        id: "c2",
        subject_id: "s1",
        student_id: "st-1",
        title: "Consolidated Financial Statements",
        chapter_number: 2,
        difficulty: "hard",
        estimated_hours: 12,
        status: "in_progress",
        study_status: "in_progress",
        study_hours_spent: 4,
        revision_status: "not_started",
        revision_history: [],
        test_status: "needs_improvement",
        test_history: [
            { id: "t2", test_type: "chapter_quiz", date: "2026-11-03", marks_obtained: 20, max_marks: 50, percentage: 40, status: "needs_improvement" }
        ],
        notes_count: 0,
        created_at: "2026-11-01"
    },
    {
        id: "c3",
        subject_id: "s1",
        student_id: "st-1",
        title: "Buyback of Securities",
        chapter_number: 3,
        difficulty: "easy",
        estimated_hours: 4,
        status: "pending",
        study_status: "not_started",
        revision_status: "not_started",
        notes_count: 0,
        created_at: "2026-11-01"
    }
];
const mockSubjects = [
    {
        id: "s1",
        student_id: "st-1",
        name: "Advanced Accounting",
        code: "PAPER-1",
        color: "#6366f1",
        total_chapters: 3,
        completed_chapters: 1,
        is_weak: true,
        created_at: "2026-11-01"
    }
];
const targetExamDate = "2026-11-25";
// A. Check Separated Analytics
const syllabusPct = ReadinessEngine.calculateSyllabusCompletion(mockChapters);
assert(Math.round(syllabusPct) === 33, "Syllabus completion is strictly 1 of 3 (33%)", `Got ${syllabusPct}`);
const revisionPct = ReadinessEngine.calculateRevisionCompletion(mockChapters);
assert(Math.round(revisionPct) === 33, "Revision completion is strictly 1 of 3 chapters with revisions (33%)", `Got ${revisionPct}`);
const testPerf = ReadinessEngine.calculateTestPerformance(mockChapters);
assert(testPerf.totalAttempts === 2, "Test performance accurately tracks 2 logged tests", `Total: ${testPerf.totalAttempts}`);
assert(testPerf.highestScore === 84 && testPerf.lowestScore === 40, "Test performance captures highest (84%) and lowest (40%) marks");
assert(testPerf.performanceRate === 62, "Test performance average is strictly (84+40)/2 = 62%", `Got ${testPerf.performanceRate}`);
const testCoveragePct = ReadinessEngine.calculateTestCoverage(mockChapters);
assert(Math.round(testCoveragePct) === 67, "Test coverage is strictly 2 of 3 chapters tested (67%)", `Got ${testCoveragePct}`);
// B. Overall AI Exam Readiness Analysis
const readiness = ReadinessEngine.calculateReadiness({
    subjects: mockSubjects,
    chapters: mockChapters,
    targetExamDate,
    dailyHoursAvailable: 6
});
assert(readiness.overall_score >= 0 && readiness.overall_score <= 100, "Readiness score computed within 0-100 range", `Score: ${readiness.overall_score}`);
assert(readiness.breakdown.syllabus_completion_rate === 33, "Readiness breakdown isolates syllabus completion (33%)");
assert(readiness.breakdown.revision_completion_rate === 33, "Readiness breakdown isolates revision completion (33%)");
assert(readiness.breakdown.test_performance_rate === 62, "Readiness breakdown isolates test performance (62%)");
assert(readiness.breakdown.test_coverage_rate === 67, "Readiness breakdown isolates test coverage (67%)");
assert(readiness.risk_warnings.length > 0, "Readiness engine generates risk warnings for incomplete syllabus and revisions");
// 4. TIMETABLE ENGINE & RED WARNING SYSTEM
console.log("\n--- 4. MULTI-DIMENSIONAL TIMETABLE ENGINE & RED WARNING SYSTEM ---");
const mockExams = [
    {
        id: "ex-1",
        student_id: "st-1",
        name: "ICAI CA Intermediate Group 1",
        exam_date: "2026-11-20",
        days_left: 16,
        is_target: true,
        total_subjects: 1,
        created_at: "2026-11-01"
    }
];
const existingSession = {
    id: "sess-kept-1",
    student_id: "st-1",
    subject_id: "s1",
    chapter_id: "c1",
    session_date: "2026-11-05",
    start_time: "09:00",
    end_time: "11:00",
    duration_minutes: 120,
    session_type: "study",
    topic: "Approved Session - Keep Intact",
    status: "scheduled",
    created_at: "2026-11-01"
};
const timetableResult = TimetableEngine.generateTimetable({
    subjects: mockSubjects,
    chapters: mockChapters,
    examinations: mockExams,
    dailyHours: 6,
    preferredTime: "morning",
    breakDuration: 15,
    weeklyHoliday: "Sunday",
    prepLevel: "intermediate",
    keepExistingSessions: true,
    existingSessions: [existingSession],
    planDays: 14
});
assert(timetableResult.sessions.length > 0, "Timetable generated study sessions", `Total: ${timetableResult.sessions.length}`);
assert(timetableResult.dailySchedule.length > 0, "Daily schedule timeline constructed", `Days: ${timetableResult.dailySchedule.length}`);
assert(timetableResult.weeklySchedule.length > 0, "Weekly schedule matrix constructed", `Weeks: ${timetableResult.weeklySchedule.length}`);
// Check weak subject allocation (+40% buffer)
const s1Explanation = timetableResult.allocationExplanations["s1"];
assert(Boolean(s1Explanation && s1Explanation.is_weak), "Weak subject flagged for allocation boost");
assert(s1Explanation && s1Explanation.allocated_hours > s1Explanation.base_hours, "Weak subject receives +40% buffer hours", `Base: ${s1Explanation?.base_hours}h, Allocated: ${s1Explanation?.allocated_hours}h (+${s1Explanation?.weak_buffer_hours}h)`);
// Check session retention
const retained = timetableResult.sessions.find(s => s.id === "sess-kept-1");
assert(Boolean(retained), "Preserves approved existing study session when keepExistingSessions is true");
// Check revision & test schedules
assert(timetableResult.revisionSchedule.length > 0, "Generated dedicated spaced revision sessions", `Count: ${timetableResult.revisionSchedule.length}`);
assert(timetableResult.testSchedule.length > 0, "Generated dedicated test & practice sessions", `Count: ${timetableResult.testSchedule.length}`);
assert(timetableResult.finalExamRevisionPlan.length > 0, "Generated pre-exam final sprint revision plan", `Sprint days: ${timetableResult.finalExamRevisionPlan.length}`);
// Check RED WARNING validation
console.log("\n--- 5. PLAN VALIDATION ENGINE (RED WARNINGS) ---");
assert(timetableResult.validationWarnings !== undefined, "Plan validation report is present");
console.log(`Detected ${timetableResult.validationWarnings.length} validation alert(s):`);
timetableResult.validationWarnings.forEach(w => {
    console.log(` - [${w.severity.toUpperCase()}] ${w.what_is_wrong} -> AI Advice: ${w.ai_recommendation}`);
});
console.log("\n==================================================");
console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");
if (failed > 0) {
    process.exit(1);
}
