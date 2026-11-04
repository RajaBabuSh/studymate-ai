import { getChapterStrategy } from "./chapterIntelligence";
/**
 * Generate a sound, pedagogically structured Exam Target Plan
 */
export function generateExamTargetPlan(input) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(input.examDate);
    targetDate.setHours(0, 0, 0, 0);
    const diffMs = targetDate.getTime() - today.getTime();
    const remainingDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const pendingChapters = input.chapters.filter((c) => c.status !== "completed");
    const totalAvailableHours = remainingDays * input.dailyHours;
    // Calculate subject weight multipliers based on weak/strong status
    const subjectList = input.subjects.length > 0 ? input.subjects : [
        { id: "s1", student_id: input.studentId, name: "Core Paper 1", color: "#6366f1", total_chapters: 5, completed_chapters: 0, created_at: "" },
        { id: "s2", student_id: input.studentId, name: "Core Paper 2", color: "#8b5cf6", total_chapters: 5, completed_chapters: 0, created_at: "" },
    ];
    const totalSubjectWeight = subjectList.reduce((acc, sub) => {
        const isWeak = input.weakSubjects.includes(sub.name);
        const isStrong = input.strongSubjects.includes(sub.name);
        const weight = isWeak ? 1.4 : isStrong ? 0.75 : 1.0;
        return acc + weight;
    }, 0);
    // Subject-wise time allocations & chapter deadlines
    let accumulatedDays = 0;
    const subjectAllocations = subjectList.map((sub) => {
        const isWeak = input.weakSubjects.includes(sub.name);
        const isStrong = input.strongSubjects.includes(sub.name);
        const weight = isWeak ? 1.4 : isStrong ? 0.75 : 1.0;
        const sharePercentage = Math.round((weight / totalSubjectWeight) * 100);
        const allocatedHours = Math.round((totalAvailableHours * sharePercentage) / 100);
        const subChapters = input.chapters.filter((c) => c.subject_id === sub.id || c.title.toLowerCase().includes(sub.name.toLowerCase()));
        const chaptersToSchedule = subChapters.length > 0 ? subChapters : [
            { id: `c-${sub.id}-1`, subject_id: sub.id, student_id: input.studentId, title: `${sub.name} - Unit 1`, chapter_number: 1, difficulty: "medium", estimated_hours: 4, status: "pending", revision_status: "not_started", notes_count: 0, created_at: "" },
            { id: `c-${sub.id}-2`, subject_id: sub.id, student_id: input.studentId, title: `${sub.name} - Unit 2`, chapter_number: 2, difficulty: "hard", estimated_hours: 6, status: "pending", revision_status: "not_started", notes_count: 0, created_at: "" },
        ];
        const chapterDeadlines = chaptersToSchedule.map((ch) => {
            const strategy = getChapterStrategy(sub.name, ch.title, ch.estimated_hours);
            // Stagger deadlines based on hours
            const daysForChapter = Math.max(1, Math.round(strategy.recommended_hours / Math.max(2, input.dailyHours * 0.6)));
            accumulatedDays += daysForChapter;
            const deadlineDate = new Date(today);
            deadlineDate.setDate(today.getDate() + Math.min(remainingDays - 5, accumulatedDays));
            return {
                chapter_title: ch.title,
                deadline_date: deadlineDate.toISOString().split("T")[0],
                nature: strategy.nature,
                estimated_hours: strategy.recommended_hours,
            };
        });
        return {
            subject_name: sub.name,
            allocated_hours: allocatedHours,
            share_percentage: sharePercentage,
            is_weak: isWeak,
            reasoning: isWeak
                ? `Allocated 40% additional buffer for intensive concept building and numerical practice.`
                : isStrong
                    ? `Streamlined allocation focusing on rapid revision and past paper drills.`
                    : `Balanced standard coverage factoring in syllabus density and official weighting.`,
            chapter_deadlines: chapterDeadlines,
        };
    });
    // Revision schedules (Spaced Repetition: Milestone 1, Milestone 2, Final Sprint)
    const revisionSchedule = [];
    if (remainingDays >= 14) {
        const revDate1 = new Date(today);
        revDate1.setDate(today.getDate() + Math.round(remainingDays * 0.45));
        const revDate2 = new Date(today);
        revDate2.setDate(today.getDate() + Math.round(remainingDays * 0.75));
        const revDate3 = new Date(today);
        revDate3.setDate(today.getDate() + Math.max(1, remainingDays - 3));
        subjectList.forEach((sub, sIdx) => {
            revisionSchedule.push({
                date: revDate1.toISOString().split("T")[0],
                subject_name: sub.name,
                chapter_title: `First Milestone Review (${sub.name})`,
                revision_type: "rapid_recap",
                focus: "Formula sheet recall, key definitions, and first round of 15 practice MCQs",
            });
            if (sIdx === 0 || input.weakSubjects.includes(sub.name)) {
                revisionSchedule.push({
                    date: revDate2.toISOString().split("T")[0],
                    subject_name: sub.name,
                    chapter_title: `Deep Concept Revision (${sub.name})`,
                    revision_type: "deep_review",
                    focus: "Comprehensive unsolved problem sets and statutory case analysis",
                });
            }
        });
        revisionSchedule.push({
            date: revDate3.toISOString().split("T")[0],
            subject_name: "All Enrolled Subjects",
            chapter_title: "Final Pre-Exam Rapid Marathon",
            revision_type: "mock_marathon",
            focus: "High-yield summary notes, statutory limits, standard rates, and formula cram sheets",
        });
    }
    // Mock Examination Dates (14 days and 7 days prior to exam)
    const mockExamDates = [];
    if (remainingDays >= 10) {
        const mock1Date = new Date(targetDate);
        mock1Date.setDate(targetDate.getDate() - Math.min(14, Math.floor(remainingDays / 2)));
        const mock2Date = new Date(targetDate);
        mock2Date.setDate(targetDate.getDate() - Math.min(6, Math.max(3, Math.floor(remainingDays / 4))));
        subjectList.slice(0, 2).forEach((sub, idx) => {
            mockExamDates.push({
                date: (idx === 0 ? mock1Date : mock2Date).toISOString().split("T")[0],
                exam_name: `${sub.name} Full Mock Test #${idx + 1}`,
                subject_name: sub.name,
                duration_minutes: 180,
                purpose: "Simulated exam conditions under strict 3-hour timer with past 3-attempt question format.",
            });
        });
    }
    // Verified Teacher Recommendations
    const recommendations = [
        {
            id: "rec-1",
            title: "Circadian Numerical Scheduling",
            category: "ai_recommendation",
            explanation: `Schedule complex numerical problem-solving during your morning peak alert slot (8:00 AM - 11:30 AM). Reserve qualitative reading and theory for afternoon sessions to minimize mental fatigue.`,
        },
        {
            id: "rec-2",
            title: "Compulsory High-Weightage Chapters First",
            category: "past_paper_observation",
            explanation: `Past 6 examination attempts demonstrate that 50%+ of scoring marks come from 35% of syllabus chapters. Prioritize high-importance modules before minor descriptive chapters.`,
        },
        {
            id: "rec-3",
            title: "Three-Attempt Past Examination Papers (PYQs)",
            category: "official_pattern",
            explanation: `Statutory examination bodies (ICAI, ICSI, and University Boards) repeat structural question patterns. Practicing the past 3 official exam papers adds 12-18% accuracy to final scores.`,
        },
    ];
    return {
        id: `plan-${Date.now()}`,
        student_id: input.studentId,
        exam_name: input.examName || `${input.course} Examination`,
        exam_date: input.examDate,
        course: input.course,
        remaining_days: remainingDays,
        pending_chapters: pendingChapters.length || input.chapters.length,
        daily_study_target_hours: input.dailyHours,
        current_prep_percentage: input.currentPrepPercentage,
        weak_subjects: input.weakSubjects,
        strong_subjects: input.strongSubjects,
        subject_allocations: subjectAllocations,
        revision_schedule: revisionSchedule,
        mock_exam_dates: mockExamDates,
        recommendations: recommendations,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}
/**
 * Module 4: Plan Error Detection and Student Approval
 * Thoroughly validates the timetable or study plan against reality checks.
 */
export function validatePlan(plan, chapters, dailyAvailableHours) {
    const errors = [];
    if (!plan)
        return errors;
    const totalRequiredHours = chapters.reduce((acc, c) => acc + (c.estimated_hours || 4), 0);
    const totalAvailableHours = plan.remaining_days * dailyAvailableHours;
    // 1. Unrealistic Study Duration Check
    if (totalRequiredHours > totalAvailableHours * 1.15 && plan.remaining_days > 3) {
        const deficit = Math.round(totalRequiredHours - totalAvailableHours);
        errors.push({
            id: "err-unrealistic-duration",
            severity: "error",
            issue_type: "unrealistic_duration",
            title: "Required Syllabus Hours Exceed Total Available Preparation Time",
            what_is_wrong: `Your syllabus requires ${totalRequiredHours} study hours, but with ${plan.remaining_days} days at ${dailyAvailableHours} hrs/day, you only have ${totalAvailableHours} available hours (deficit of ${deficit} hours).`,
            why_is_it_a_problem: `Trying to compress an overloaded syllabus without adjusting hours leads to cramming, incomplete chapter coverage, and acute exam burnout.`,
            ai_recommendation: `Increase daily study time by ${(deficit / plan.remaining_days).toFixed(1)} hrs/day, or prioritize high-yield chapters (Class A) and shift low-weightage theory to rapid review.`,
            suggested_action: "Recalibrate daily hours to " + Math.min(12, Math.ceil(dailyAvailableHours + deficit / plan.remaining_days)) + " hrs",
            student_decision: "pending",
        });
    }
    // 2. Insufficient Revision Blocks Check
    if (plan.remaining_days <= 25 && plan.revision_schedule.length === 0) {
        errors.push({
            id: "err-insufficient-revision",
            severity: "error",
            issue_type: "insufficient_revision",
            title: "No Scheduled Revision Checkpoints Before Exam",
            what_is_wrong: `The target examination is ${plan.remaining_days} days away, but there are zero designated spaced revision sessions scheduled.`,
            why_is_it_a_problem: `According to Ebbinghaus's Forgetting Curve, students retain less than 28% of learned material after 14 days without periodic active recall.`,
            ai_recommendation: `Allocate at least 3 spaced revision days: Day 7 (Rapid Recall), Day 14 (Mixed Practice), and 3 days before exam (Formula & Summary Cram).`,
            suggested_action: "Auto-insert 3 spaced revision milestones into the timetable",
            student_decision: "pending",
        });
    }
    // 3. Inadequate Numerical Practice Check
    const numericalChapters = chapters.filter((c) => {
        const nat = c.nature || getChapterStrategy("", c.title).nature;
        return nat === "numerical" || nat === "practical";
    });
    if (numericalChapters.length >= 3 && dailyAvailableHours < 3.5) {
        errors.push({
            id: "err-inadequate-numerical",
            severity: "warning",
            issue_type: "inadequate_numerical_practice",
            title: "Insufficient Daily Allocation for Calculation-Heavy Subjects",
            what_is_wrong: `You have ${numericalChapters.length} numerical/practical chapters, but only ${dailyAvailableHours} daily hours allocated.`,
            why_is_it_a_problem: `Numerical mastery requires solving unassisted problems on paper. Less than 2 hours daily leads to superficial reading of solutions rather than genuine calculation speed.`,
            ai_recommendation: `Reserve a dedicated 90-minute uninterrupted calculation block during peak alert hours every morning.`,
            suggested_action: "Add 90m Daily Numerical Drill to morning schedule",
            student_decision: "pending",
        });
    }
    // 4. Excessive Daily Workload Check
    if (dailyAvailableHours > 11) {
        errors.push({
            id: "err-excessive-workload",
            severity: "warning",
            issue_type: "excessive_workload",
            title: "Daily Study Target Exceeds Sustainable Cognitive Capacity",
            what_is_wrong: `Scheduled study target is ${dailyAvailableHours} hours/day.`,
            why_is_it_a_problem: `Cognitive research proves that mental retention degrades sharply past 8-9 hours of active study without substantial recovery intervals.`,
            ai_recommendation: `Cap high-intensity study at 8 hours/day and insert two 20-minute restorative breaks plus adequate sleep.`,
            suggested_action: "Cap daily hours at 8.5 hrs with integrated Pomodoro breaks",
            student_decision: "pending",
        });
    }
    // 5. Exam Date In Past or Too Close Check
    if (plan.remaining_days <= 1) {
        errors.push({
            id: "err-incorrect-exam-date",
            severity: "error",
            issue_type: "incorrect_exam_dates",
            title: "Examination Date is Immediate or In The Past",
            what_is_wrong: `The target exam date is set to ${plan.exam_date} (${plan.remaining_days} day remaining).`,
            why_is_it_a_problem: `A comprehensive multi-chapter preparation plan cannot be executed in 24 hours.`,
            ai_recommendation: `Update your exam date to the upcoming term or switch the engine to '24-Hour Emergency Marathon Review Mode'.`,
            suggested_action: "Update examination date to upcoming term",
            student_decision: "pending",
        });
    }
    return errors;
}
