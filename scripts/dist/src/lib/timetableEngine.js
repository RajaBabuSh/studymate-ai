import { detectChapterNature } from "@/lib/chapterIntelligence";
const TIME_SLOT_MAP = {
    morning: ["06:30", "08:15", "10:00", "11:45"],
    afternoon: ["13:00", "14:45", "16:30", "18:15"],
    evening: ["17:00", "18:45", "20:30", "22:15"],
    night: ["20:00", "21:45", "23:30", "01:15"],
    flexible: ["08:30", "13:30", "17:30", "20:30"],
};
export const TimetableEngine = {
    /**
     * Generates a fully verified, pedagogically sound, multi-dimensional timetable
     */
    generateTimetable(params) {
        const { subjects, chapters, examinations, dailyHours, preferredTime, breakDuration, weeklyHoliday, keepExistingSessions, existingSessions = [], planDays = 14, } = params;
        const now = new Date();
        const approvedSessions = keepExistingSessions
            ? existingSessions.filter((s) => s.status === "completed")
            : [];
        const approvedDates = new Set(approvedSessions.map((s) => s.date));
        // Map examination dates
        const examMap = new Map();
        const sortedExams = [...examinations].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
        sortedExams.forEach((ex) => {
            examMap.set(ex.subject_name.toLowerCase(), new Date(ex.exam_date));
        });
        // 1. Calculate Subject Allocation Weights & Reasoning
        const totalSubjectChapters = new Map();
        subjects.forEach((s) => {
            const count = chapters.filter((c) => c.subject_id === s.id).length;
            totalSubjectChapters.set(s.id, count || 1);
        });
        // Allocation logic: Weak subjects receive +40% buffer; sooner exams receive +30%
        const allocationExplanations = [];
        const subjectWisePlan = [];
        const totalWeightSum = subjects.reduce((sum, sub) => {
            let weight = totalSubjectChapters.get(sub.id) || 4;
            if (sub.is_weak)
                weight *= 1.4; // 40% weak buffer
            const examDate = examMap.get(sub.name.toLowerCase());
            if (examDate) {
                const daysLeft = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 86400)));
                if (daysLeft < 30)
                    weight *= 1.3;
            }
            return sum + weight;
        }, 0);
        const totalPlannedHours = planDays * dailyHours;
        subjects.forEach((sub) => {
            let weight = totalSubjectChapters.get(sub.id) || 4;
            const reasons = [];
            if (sub.is_weak) {
                weight *= 1.4;
                reasons.push("Allocated 40% weak-subject buffer for deep numerical drills");
            }
            const examDate = examMap.get(sub.name.toLowerCase());
            if (examDate) {
                const daysLeft = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 86400)));
                if (daysLeft < 30) {
                    weight *= 1.3;
                    reasons.push(`Exam is in ${daysLeft} days (+30% priority acceleration)`);
                }
                else {
                    reasons.push(`Exam is in ${daysLeft} days`);
                }
            }
            else {
                reasons.push("Standard curriculum pacing");
            }
            const share = totalWeightSum > 0 ? weight / totalWeightSum : 1 / subjects.length;
            const allocatedHours = Math.round(totalPlannedHours * share * 10) / 10;
            const explanation = reasons.join(" • ");
            allocationExplanations.push({
                subjectName: sub.name,
                explanation,
                timeShare: Math.round(share * 100),
            });
            subjectWisePlan.push({
                subjectId: sub.id,
                subjectName: sub.name,
                subjectColor: sub.color || "#6366f1",
                allocatedHours,
                chapterCount: totalSubjectChapters.get(sub.id) || 0,
                revisionSessionsCount: 0,
                mockTestsCount: 0,
                reasoning: explanation,
            });
        });
        const workUnits = [];
        chapters.forEach((chap) => {
            const sub = subjects.find((s) => s.id === chap.subject_id);
            const subName = sub?.name || "General";
            const nature = chap.nature || detectChapterNature(subName, chap.title);
            const examDate = examMap.get(subName.toLowerCase()) || new Date(now.getTime() + 60 * 86400000);
            const daysToExam = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 86400)));
            // Priority formula: Harder + Sooner Exam + Weak Subject = Higher Priority
            let priority = 100;
            if (chap.difficulty === "hard")
                priority += 50;
            if (chap.difficulty === "medium")
                priority += 20;
            if (sub?.is_weak)
                priority += 40;
            if (daysToExam < 30)
                priority += (30 - daysToExam) * 2;
            workUnits.push({
                id: chap.id,
                subjectId: chap.subject_id,
                subjectName: subName,
                subjectColor: sub?.color || "#6366f1",
                title: chap.title,
                nature,
                estimatedHours: chap.estimated_hours || 3.0,
                isWeak: Boolean(sub?.is_weak),
                daysToExam,
                priorityScore: priority,
            });
        });
        // Sort by priority descending
        workUnits.sort((a, b) => b.priorityScore - a.priorityScore);
        // 3. Day-by-Day Generation Loop
        const allGeneratedSessions = [...approvedSessions];
        const sessionDurationMins = 80; // 1 hr 20 min session with focus
        const sessionsPerDay = Math.max(1, Math.min(4, Math.floor((dailyHours * 60) / (sessionDurationMins + breakDuration))));
        const slotStarters = TIME_SLOT_MAP[preferredTime] || TIME_SLOT_MAP.morning;
        const workUnitIdx = 0;
        const studiedUnitsForSpacedRecall = [];
        const chapterWiseMap = new Map();
        for (let dayOffset = 0; dayOffset < planDays; dayOffset++) {
            const currentDate = new Date(now);
            currentDate.setDate(currentDate.getDate() + dayOffset);
            const dateStr = currentDate.toISOString().split("T")[0];
            // If date was already approved and locked, skip generating duplicate
            if (approvedDates.has(dateStr))
                continue;
            const dayOfWeek = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
            const isRestDay = dayOfWeek === weeklyHoliday.toLowerCase();
            if (isRestDay) {
                // Schedule light review on holiday
                if (studiedUnitsForSpacedRecall.length > 0) {
                    const item = studiedUnitsForSpacedRecall[studiedUnitsForSpacedRecall.length - 1];
                    allGeneratedSessions.push({
                        id: `session-holiday-${dateStr}-${Math.random().toString(36).substring(2, 6)}`,
                        student_id: "student-active",
                        timetable_id: "tt-ai-engine",
                        subject_id: item.unit.subjectId,
                        subject_name: item.unit.subjectName,
                        subject_color: item.unit.subjectColor,
                        chapter_id: item.unit.id,
                        chapter_title: `Rest Day Light Review: ${item.unit.title}`,
                        date: dateStr,
                        start_time: "10:30",
                        end_time: "11:30",
                        duration_minutes: 60,
                        session_type: "revision",
                        status: "scheduled",
                        difficulty: "easy",
                        notes: "Low-cognitive load review to maintain memory consolidation without fatigue.",
                        created_at: new Date().toISOString(),
                    });
                }
                continue;
            }
            // Check for Mock Test placement (2-3 days before an exam)
            const upcomingExamWithin3Days = sortedExams.find((ex) => {
                const diff = Math.ceil((new Date(ex.exam_date).getTime() - currentDate.getTime()) / (1000 * 86400));
                return diff === 2 || diff === 3;
            });
            for (let sIdx = 0; sIdx < sessionsPerDay; sIdx++) {
                const startTimeStr = slotStarters[sIdx % slotStarters.length];
                const [startH, startM] = startTimeStr.split(":").map(Number);
                const endTotalMins = startH * 60 + startM + sessionDurationMins;
                const endH = Math.floor(endTotalMins / 60) % 24;
                const endM = endTotalMins % 60;
                const endTimeStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
                // Slot 0 (Morning / Alert Peak): Numerical / Practical Chapters
                // Slot 1 & 2: Theory / Case studies / Spaced Revisions
                // Final Slot near exam: Mock Test
                let sessionType = "study";
                let targetUnit;
                let sessionTitle = "";
                if (upcomingExamWithin3Days && sIdx === sessionsPerDay - 1) {
                    // Mock Test Drill
                    sessionType = "mock_test";
                    const sub = subjects.find((s) => s.name === upcomingExamWithin3Days.subject_name);
                    targetUnit = {
                        id: `mock-${upcomingExamWithin3Days.id}`,
                        subjectId: sub?.id || "sub-mock",
                        subjectName: upcomingExamWithin3Days.subject_name,
                        subjectColor: sub?.color || "#ec4899",
                        title: `Timed Model Test: ${upcomingExamWithin3Days.exam_name}`,
                        nature: "practical",
                        estimatedHours: 2.0,
                        isWeak: Boolean(sub?.is_weak),
                        daysToExam: 3,
                        priorityScore: 300,
                    };
                    sessionTitle = targetUnit.title;
                    // Update subject plan counter
                    const sPlan = subjectWisePlan.find((sp) => sp.subjectName === targetUnit.subjectName);
                    if (sPlan)
                        sPlan.mockTestsCount++;
                }
                else if (studiedUnitsForSpacedRecall.length > 0 &&
                    (dayOffset % 3 === 0 && sIdx === 1)) {
                    // Spaced Revision Milestone (3 days after study)
                    sessionType = "revision";
                    const pick = studiedUnitsForSpacedRecall[Math.floor(Math.random() * studiedUnitsForSpacedRecall.length)];
                    targetUnit = pick.unit;
                    sessionTitle = `Spaced Revision 1: ${targetUnit.title}`;
                    const sPlan = subjectWisePlan.find((sp) => sp.subjectName === targetUnit.subjectName);
                    if (sPlan)
                        sPlan.revisionSessionsCount++;
                    const existingEntry = chapterWiseMap.get(targetUnit.id);
                    if (existingEntry) {
                        existingEntry.revisionDates.push(dateStr);
                    }
                }
                else if (workUnitIdx < workUnits.length) {
                    // First pass: Pick numerical chapters for morning/first slot, theory for evening
                    const remainingUnits = workUnits.slice(workUnitIdx);
                    let chosenIndex = 0;
                    if (sIdx === 0) {
                        const numIdx = remainingUnits.findIndex((u) => u.nature === "numerical" || u.nature === "practical");
                        if (numIdx >= 0)
                            chosenIndex = numIdx;
                    }
                    else {
                        const theoryIdx = remainingUnits.findIndex((u) => u.nature === "theory");
                        if (theoryIdx >= 0)
                            chosenIndex = theoryIdx;
                    }
                    targetUnit = remainingUnits[chosenIndex];
                    workUnits.splice(workUnitIdx + chosenIndex, 1);
                    sessionTitle = targetUnit.title;
                    studiedUnitsForSpacedRecall.push({ unit: targetUnit, studiedDate: dateStr });
                    if (!chapterWiseMap.has(targetUnit.id)) {
                        chapterWiseMap.set(targetUnit.id, {
                            chapterId: targetUnit.id,
                            chapterTitle: targetUnit.title,
                            subjectName: targetUnit.subjectName,
                            nature: targetUnit.nature,
                            studyDate: dateStr,
                            revisionDates: [],
                        });
                    }
                }
                else {
                    // Second Revision cycle
                    sessionType = "revision";
                    const pick = studiedUnitsForSpacedRecall[(dayOffset + sIdx) % studiedUnitsForSpacedRecall.length];
                    targetUnit = pick ? pick.unit : workUnits[0];
                    sessionTitle = `Deep Recall Drill: ${targetUnit.title}`;
                    const existingEntry = chapterWiseMap.get(targetUnit.id);
                    if (existingEntry && !existingEntry.revisionDates.includes(dateStr)) {
                        existingEntry.revisionDates.push(dateStr);
                    }
                }
                allGeneratedSessions.push({
                    id: `sess-${dateStr}-${sIdx}-${Math.random().toString(36).substring(2, 6)}`,
                    student_id: "student-active",
                    timetable_id: "tt-ai-engine",
                    subject_id: targetUnit.subjectId,
                    subject_name: targetUnit.subjectName,
                    subject_color: targetUnit.subjectColor,
                    chapter_id: targetUnit.id,
                    chapter_title: sessionTitle,
                    date: dateStr,
                    start_time: startTimeStr,
                    end_time: endTimeStr,
                    duration_minutes: sessionDurationMins,
                    session_type: sessionType,
                    status: dayOffset === 0 && sIdx === 0 ? "in_progress" : "scheduled",
                    difficulty: "medium",
                    notes: `${targetUnit.nature === "numerical" ? "Morning Numerical Calculation Drill" : "Active Recall & Structured Short Notes"}. Break: ${breakDuration}m`,
                    created_at: new Date().toISOString(),
                });
            }
        }
        // 4. Build Schedules Groupings
        const dailySchedule = {};
        allGeneratedSessions.forEach((sess) => {
            if (!dailySchedule[sess.date]) {
                dailySchedule[sess.date] = [];
            }
            dailySchedule[sess.date].push(sess);
        });
        const weeklySchedule = [];
        const dateKeys = Object.keys(dailySchedule).sort();
        for (let w = 0; w < Math.ceil(dateKeys.length / 7); w++) {
            const sliceDates = dateKeys.slice(w * 7, (w + 1) * 7);
            const weekSessions = sliceDates.flatMap((d) => dailySchedule[d] || []);
            const totalHours = Math.round(weekSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60);
            weeklySchedule.push({
                weekNumber: w + 1,
                startDate: sliceDates[0] || "",
                endDate: sliceDates[sliceDates.length - 1] || "",
                totalHours,
                sessionsCount: weekSessions.length,
            });
        }
        const revisionSchedule = allGeneratedSessions.filter((s) => s.session_type === "revision");
        const testSchedule = allGeneratedSessions.filter((s) => s.session_type === "mock_test" || s.session_type === "numerical_practice");
        const finalExamRevisionPlan = allGeneratedSessions.filter((s) => {
            const sessDate = new Date(s.date);
            return sortedExams.some((ex) => {
                const diff = Math.ceil((new Date(ex.exam_date).getTime() - sessDate.getTime()) / (1000 * 86400));
                return diff >= 0 && diff <= 5;
            });
        });
        // 5. PHASE 8: Plan Validation & RED WARNING System
        const validationWarnings = this.validatePlan(allGeneratedSessions, chapters, examinations, dailyHours);
        return {
            sessions: allGeneratedSessions,
            dailySchedule,
            weeklySchedule,
            subjectWisePlan,
            chapterWisePlan: Array.from(chapterWiseMap.values()),
            revisionSchedule,
            testSchedule,
            finalExamRevisionPlan,
            allocationExplanations,
            validationWarnings,
        };
    },
    /**
     * PHASE 8: Strict Plan Validation & Error Detection
     */
    validatePlan(sessions, chapters, examinations, dailyHours) {
        const warnings = [];
        // Check 1: Excessive Daily Workload
        const dateHoursMap = new Map();
        sessions.forEach((s) => {
            const current = dateHoursMap.get(s.date) || 0;
            dateHoursMap.set(s.date, current + s.duration_minutes / 60);
        });
        let overloadedDate = null;
        let overloadedHours = 0;
        dateHoursMap.forEach((hrs, date) => {
            if (hrs > dailyHours + 1.5) {
                overloadedDate = date;
                overloadedHours = Math.round(hrs * 10) / 10;
            }
        });
        if (overloadedDate) {
            warnings.push({
                id: "warn-overload",
                severity: "error",
                issue_type: "excessive_workload",
                title: `Excessive Study Hours on ${overloadedDate}`,
                what_is_wrong: `Scheduled study volume (${overloadedHours}h) exceeds your declared available daily target (${dailyHours}h).`,
                why_is_it_a_problem: "Cognitive overload leads to burnout, diminished numerical retention, and severe timetable abandonment.",
                ai_recommendation: `Cap daily study sessions to ${dailyHours}h and extend revision milestones across open calendar slots.`,
                suggested_action: "Accept AI workload cap to prevent fatigue.",
                student_decision: "pending",
            });
        }
        // Check 2: Missing Revision Sessions
        const scheduledRevisionCount = sessions.filter((s) => s.session_type === "revision").length;
        if (scheduledRevisionCount < Math.min(4, Math.floor(chapters.length / 3))) {
            warnings.push({
                id: "warn-insufficient-revision",
                severity: "error",
                issue_type: "insufficient_revision",
                title: "Insufficient Revision Checkpoints Detected",
                what_is_wrong: `Only ${scheduledRevisionCount} spaced revision sessions are scheduled across your entire study plan.`,
                why_is_it_a_problem: "According to Ebbinghaus forgetting curve research, memory decays up to 70% within 48 hours without planned revision milestones.",
                ai_recommendation: "Add 3-day and 7-day spaced recall slots for mastered chapters.",
                suggested_action: "Inject automated 45-minute revision milestones.",
                student_decision: "pending",
            });
        }
        // Check 3: Missing Mock Tests for Upcoming Exams
        examinations.forEach((ex) => {
            const hasMock = sessions.some((s) => s.session_type === "mock_test" &&
                s.subject_name.toLowerCase() === ex.subject_name.toLowerCase());
            if (!hasMock) {
                warnings.push({
                    id: `warn-missing-mock-${ex.id}`,
                    severity: "error",
                    issue_type: "missing_test_sessions",
                    title: `No Full-Length Mock Test Scheduled for ${ex.subject_name}`,
                    what_is_wrong: `There are zero timed practice test sessions scheduled prior to ${ex.exam_date}.`,
                    why_is_it_a_problem: "Students without timed 3-hour exam simulation frequently struggle with time management in the examination hall.",
                    ai_recommendation: `Schedule a 2-hour timed diagnostic test session 3 days before ${ex.exam_date}.`,
                    suggested_action: "Insert dedicated mock examination session.",
                    student_decision: "pending",
                });
            }
        });
        return warnings;
    },
};
