import {
  Student,
  Subject,
  Chapter,
  Examination,
  Timetable,
  StudySession,
  Reminder,
  StudentTask,
  StudyProgress,
  SavedVideo,
  Note,
  UploadedDocument,
  ExamTargetPlan,
  PracticeTest,
  TestAttempt,
  DailyAdjustment,
  AdminUser,
  Announcement,
  AdminAuditLog,
  PlatformSettings,
  CourseCatalogItem,
  AuditActionType,
  StudyStatus,
  RevisionMilestoneType,
  TestStatus,
  ChapterTestRecord,
  SupportTicket,
  SupportChatMessage,
  ExamReadinessAnalysis,
  ChapterNature,
  Difficulty,
  ExamAttemptRecord,
  ExemptionRecord,
  FlashcardItem,
  StudentDoubtItem,
  SleepDistractionLog,
  CareerProgressRecord,
} from "@/types/database";
import { ReadinessEngine } from "@/lib/readinessEngine";
import { CS_EXECUTIVE_OFFICIAL_CURRICULUM } from "@/lib/csExecutiveCurriculum";
import { initializeCourseCurriculumForStudent } from "@/lib/courseCatalog";

const ACTIVE_SESSION_KEY = "studymate_active_session";
const REGISTERED_USERS_KEY = "studymate_registered_users_db";
const ADMIN_ACTIVE_SESSION_KEY = "studymate_admin_active_session";
const ADMIN_AUDIT_LOGS_KEY = "studymate_admin_audit_logs";
const ANNOUNCEMENTS_KEY = "studymate_platform_announcements";
const PLATFORM_SETTINGS_KEY = "studymate_platform_settings";
const COURSE_CATALOG_KEY = "studymate_course_catalog";

export interface ActiveSession {
  userId: string;
  email: string;
  isGuest: boolean;
}

export interface StoredUserAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  student: Student;
}

// Guest Demo Seed Data (STRICTLY isolated under guest namespace)
export const GUEST_STUDENT: Student = {
  id: "guest-demo-user-id",
  email: "demo.student@studymate.ai",
  full_name: "Demo Student (Alex)",
  course: "CA Intermediate",
  education_level: "Professional (CA, CS, CMA)",
  institution: "ICAI Exam Board",
  grade_or_year: "Professional Stage 2",
  target_exam: "May 2027 CA Intermediate Examination",
  upcoming_exam_date: "2027-05-15",
  daily_available_hours: 4.5,
  preferred_study_time: "evening",
  break_duration_minutes: 15,
  weekly_holiday: "Sunday",
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const GUEST_SUBJECTS: Subject[] = [
  {
    id: "guest-sub-1",
    student_id: GUEST_STUDENT.id,
    course: "CA Intermediate",
    name: "Advanced Accounting",
    code: "PAPER-1",
    color: "#6366f1",
    icon: "BookOpen",
    total_chapters: 7,
    completed_chapters: 4,
    target_date: "2027-05-15",
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-sub-2",
    student_id: GUEST_STUDENT.id,
    course: "CA Intermediate",
    name: "Corporate and Other Laws",
    code: "PAPER-2",
    color: "#8b5cf6",
    icon: "Scale",
    total_chapters: 8,
    completed_chapters: 5,
    target_date: "2027-05-18",
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-sub-3",
    student_id: GUEST_STUDENT.id,
    course: "CA Intermediate",
    name: "Taxation (Direct & GST)",
    code: "PAPER-3",
    color: "#ef4444",
    icon: "Receipt",
    total_chapters: 10,
    completed_chapters: 6,
    target_date: "2027-05-21",
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-sub-4",
    student_id: GUEST_STUDENT.id,
    course: "CA Intermediate",
    name: "Auditing and Ethics",
    code: "PAPER-5",
    color: "#06b6d4",
    icon: "ShieldCheck",
    total_chapters: 6,
    completed_chapters: 3,
    target_date: "2027-05-25",
    created_at: new Date().toISOString(),
  },
];

export const GUEST_CHAPTERS: Chapter[] = [
  {
    id: "guest-chap-1",
    subject_id: "guest-sub-1",
    student_id: GUEST_STUDENT.id,
    title: "Financial Statements of Companies (Schedule III)",
    chapter_number: 1,
    difficulty: "hard",
    estimated_hours: 4.5,
    status: "completed",
    study_status: "completed",
    study_completed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    study_hours_spent: 4.5,
    revision_status: "mastered",
    revision_history: [
      {
        id: "rev-g-1a",
        milestone: "revision_1",
        completed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        duration_minutes: 60,
        notes: "Schedule III presentation formats & disclosure checklists memorized.",
      },
      {
        id: "rev-g-1b",
        milestone: "revision_2",
        completed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        duration_minutes: 45,
        notes: "Rapid balance sheet regrouping practice.",
      },
    ],
    test_status: "passed",
    test_history: [
      {
        id: "test-att-g1",
        test_title: "Schedule III Comprehensive Problem",
        attempted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        score: 88,
        max_score: 100,
        percentage: 88,
        passed: true,
      },
    ],
    notes_count: 3,
    nature: "numerical",
    length_category: "long",
    exam_importance: "high",
    official_source: "ICAI BoS Study Material 2024-2026",
    syllabus_version: "New Scheme of Education & Training",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-chap-2",
    subject_id: "guest-sub-1",
    student_id: GUEST_STUDENT.id,
    title: "Amalgamation and Reconstruction of Companies",
    chapter_number: 2,
    difficulty: "hard",
    estimated_hours: 5.0,
    status: "in_progress",
    study_status: "in_progress",
    study_hours_spent: 2.5,
    revision_status: "not_started",
    revision_history: [],
    test_status: "not_attempted",
    test_history: [],
    notes_count: 2,
    nature: "numerical",
    length_category: "long",
    exam_importance: "high",
    official_source: "ICAI BoS Study Material 2024-2026",
    syllabus_version: "New Scheme of Education & Training",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-chap-3",
    subject_id: "guest-sub-2",
    student_id: GUEST_STUDENT.id,
    title: "Appointment & Qualifications of Directors",
    chapter_number: 1,
    difficulty: "medium",
    estimated_hours: 3.5,
    status: "completed",
    study_status: "completed",
    study_completed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    study_hours_spent: 3.5,
    revision_status: "revised_once",
    revision_history: [
      {
        id: "rev-g-3a",
        milestone: "revision_1",
        completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        duration_minutes: 45,
        notes: "Section 149, 152, DIN and Independent Director criteria reviewed.",
      },
    ],
    test_status: "passed",
    test_history: [
      {
        id: "test-att-g3",
        test_title: "Directors Case Studies Drill",
        attempted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        score: 76,
        max_score: 100,
        percentage: 76,
        passed: true,
      },
    ],
    notes_count: 4,
    nature: "theory",
    length_category: "medium",
    exam_importance: "high",
    official_source: "ICAI BoS Study Material 2024-2026",
    syllabus_version: "New Scheme of Education & Training",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-chap-4",
    subject_id: "guest-sub-3",
    student_id: GUEST_STUDENT.id,
    title: "Profits & Gains of Business or Profession (PGBP)",
    chapter_number: 3,
    difficulty: "hard",
    estimated_hours: 6.0,
    status: "completed",
    study_status: "completed",
    study_completed_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    study_hours_spent: 6.0,
    revision_status: "mastered",
    revision_history: [
      {
        id: "rev-g-4a",
        milestone: "revision_1",
        completed_at: new Date(Date.now() - 6 * 86400000).toISOString(),
        duration_minutes: 60,
        notes: "Depreciation Section 32 and disallowed expenses Section 40(a).",
      },
      {
        id: "rev-g-4b",
        milestone: "revision_2",
        completed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        duration_minutes: 50,
        notes: "Section 43B(h) MSME 45-day payment amendments drill.",
      },
    ],
    test_status: "passed",
    test_history: [
      {
        id: "test-att-g4",
        test_title: "PGBP Comprehensive Tax Computation",
        attempted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        score: 82,
        max_score: 100,
        percentage: 82,
        passed: true,
      },
    ],
    notes_count: 5,
    nature: "practical",
    length_category: "long",
    exam_importance: "high",
    official_source: "ICAI BoS Study Material 2024-2026",
    syllabus_version: "New Scheme of Education & Training",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
];

export const GUEST_EXAMINATIONS: Examination[] = [
  {
    id: "guest-exam-1",
    student_id: GUEST_STUDENT.id,
    subject_id: "guest-sub-1",
    subject_name: "Advanced Accounting",
    exam_name: "Paper 1: Advanced Accounting",
    exam_date: "2027-05-15",
    start_time: "14:00",
    end_time: "17:00",
    room_location: "Hall 4A, Examination Center",
    weightage_percentage: 100,
    preparation_level: "high",
    notes: "Covers Ind AS, Amalgamations, and Schedule III presentation.",
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-exam-2",
    student_id: GUEST_STUDENT.id,
    subject_id: "guest-sub-2",
    subject_name: "Corporate and Other Laws",
    exam_name: "Paper 2: Corporate & Other Laws",
    exam_date: "2027-05-18",
    start_time: "14:00",
    end_time: "17:00",
    room_location: "Hall 4A, Examination Center",
    weightage_percentage: 100,
    preparation_level: "medium",
    notes: "Review Section 149-172 of Companies Act and FEMA regulations.",
    created_at: new Date().toISOString(),
  },
];

const todayStr = new Date().toISOString().split("T")[0];

export const GUEST_SESSIONS: StudySession[] = [
  {
    id: "guest-sess-1",
    student_id: GUEST_STUDENT.id,
    timetable_id: "tt-guest",
    subject_id: "guest-sub-1",
    subject_name: "Advanced Accounting",
    subject_color: "#6366f1",
    chapter_id: "guest-chap-2",
    chapter_title: "Amalgamation: Purchase Consideration Calculation",
    date: todayStr,
    start_time: "17:30",
    end_time: "19:00",
    duration_minutes: 90,
    session_type: "study",
    status: "completed",
    difficulty: "hard",
    notes: "Mastered Net Assets method vs Net Payment method.",
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-sess-2",
    student_id: GUEST_STUDENT.id,
    timetable_id: "tt-guest",
    subject_id: "guest-sub-3",
    subject_name: "Taxation (Direct & GST)",
    subject_color: "#ef4444",
    chapter_id: "guest-chap-4",
    chapter_title: "PGBP: Inadmissible Deductions under Section 40(a)",
    date: todayStr,
    start_time: "19:15",
    end_time: "20:45",
    duration_minutes: 90,
    session_type: "study",
    status: "in_progress",
    difficulty: "hard",
    notes: "Working through 40(a)(ia) TDS non-deduction disallowance.",
    created_at: new Date().toISOString(),
  },
];

export const GUEST_REMINDERS: Reminder[] = [
  {
    id: "guest-rem-1",
    student_id: GUEST_STUDENT.id,
    title: "Accounting Practice Session",
    description: "Amalgamation journal entries practice at 5:30 PM.",
    reminder_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    reminder_type: "study_session",
    is_completed: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-rem-2",
    student_id: GUEST_STUDENT.id,
    title: "CA Inter Exam Countdown",
    description: "Review RTP (Revision Test Papers) and past exam questions.",
    reminder_time: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    reminder_type: "exam_countdown",
    is_completed: false,
    created_at: new Date().toISOString(),
  },
];

export const GUEST_PROGRESS: StudyProgress[] = [
  {
    id: "guest-prog-1",
    student_id: GUEST_STUDENT.id,
    date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0],
    total_minutes_studied: 240,
    chapters_completed_count: 1,
    sessions_completed_count: 2,
    consistency_streak_days: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-prog-2",
    student_id: GUEST_STUDENT.id,
    date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    total_minutes_studied: 270,
    chapters_completed_count: 1,
    sessions_completed_count: 3,
    consistency_streak_days: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-prog-3",
    student_id: GUEST_STUDENT.id,
    date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
    total_minutes_studied: 210,
    chapters_completed_count: 0,
    sessions_completed_count: 2,
    consistency_streak_days: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-prog-4",
    student_id: GUEST_STUDENT.id,
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    total_minutes_studied: 300,
    chapters_completed_count: 2,
    sessions_completed_count: 3,
    consistency_streak_days: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-prog-5",
    student_id: GUEST_STUDENT.id,
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    total_minutes_studied: 260,
    chapters_completed_count: 1,
    sessions_completed_count: 2,
    consistency_streak_days: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-prog-6",
    student_id: GUEST_STUDENT.id,
    date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    total_minutes_studied: 320,
    chapters_completed_count: 1,
    sessions_completed_count: 3,
    consistency_streak_days: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: "guest-prog-7",
    student_id: GUEST_STUDENT.id,
    date: todayStr,
    total_minutes_studied: 180,
    chapters_completed_count: 1,
    sessions_completed_count: 2,
    consistency_streak_days: 7,
    created_at: new Date().toISOString(),
  },
];

export const GUEST_NOTES: Note[] = [
  {
    id: "guest-note-1",
    student_id: GUEST_STUDENT.id,
    course: "CA Intermediate",
    subject_id: "guest-sub-1",
    subject_name: "Advanced Accounting",
    chapter_title: "Amalgamation Schemes",
    title: "Amalgamation: AS 14 Accounting Treatment & Goodwill",
    content: `### Accounting for Amalgamation (AS 14)
1. **Pooling of Interests Method (Amalgamation in the Nature of Merger)**:
   - All assets, liabilities, and reserves of transferor company recorded at existing carrying amounts.
   - Difference between purchase consideration and share capital is adjusted against General Reserve.
2. **Purchase Method (Amalgamation in the Nature of Purchase)**:
   - Assets and liabilities recorded at agreed/fair values.
   - Excess of purchase consideration over net assets = **Goodwill** (amortized over 5 years).
   - Excess of net assets over purchase consideration = **Capital Reserve**.`,
    tags: ["AS14", "CA Inter", "Exam Tip", "Accounting"],
    attachment_type: "none",
    is_pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "guest-note-2",
    student_id: GUEST_STUDENT.id,
    course: "CA Intermediate",
    subject_id: "guest-sub-3",
    subject_name: "Taxation (Direct & GST)",
    chapter_title: "PGBP Profits & Gains",
    title: "Section 43B Specified Deductions on Actual Payment",
    content: `### Section 43B Cheat Sheet
Certain expenses allowable only on actual payment before the due date of filing ITR under Section 139(1):
- Tax, duty, cess, or fee payable to Government.
- Contribution to Provident Fund, Superannuation Fund, Gratuity Fund.
- Bonus or commission to employees.
- Interest on loans from Public Financial Institutions / Banks.
- Leave encashment provision.
- **Section 43B(h)**: Payments to Micro and Small Enterprises (MSMEs) must be made within 15/45 days under the MSMED Act! Otherwise disallowed in that year.`,
    tags: ["Section 43B", "Direct Tax", "MSME Amendment", "PGBP"],
    attachment_type: "none",
    is_pinned: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Helper to safely read and write JSON in browser
function getJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage set error", err);
  }
}

export const StorageRepository = {
  // Session management
  getActiveSession(): ActiveSession | null {
    return getJson<ActiveSession | null>(ACTIVE_SESSION_KEY, null);
  },
  setActiveSession(session: ActiveSession | null): void {
    if (session) {
      setJson(ACTIVE_SESSION_KEY, session);
    } else if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  },

  // Registered Accounts DB (for offline/credential persistence)
  getRegisteredAccounts(): Record<string, StoredUserAccount> {
    return getJson<Record<string, StoredUserAccount>>(REGISTERED_USERS_KEY, {});
  },
  saveRegisteredAccount(account: StoredUserAccount): void {
    const db = this.getRegisteredAccounts();
    db[account.email.toLowerCase()] = account;
    setJson(REGISTERED_USERS_KEY, db);
  },
  findAccountByEmail(email: string): StoredUserAccount | null {
    const db = this.getRegisteredAccounts();
    return db[email.toLowerCase()] || null;
  },

  // Key generator with strict user isolation
  getUserKey(key: string, userId?: string): string {
    const currentSession = this.getActiveSession();
    const effectiveId = userId || currentSession?.userId;
    const isGuest = currentSession?.isGuest;

    if (!effectiveId || isGuest) {
      return `studymate_guest_${key}`;
    }
    return `studymate_user_${effectiveId}_${key}`;
  },

  // Profile
  getStudent(userId?: string): Student | null {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<Student>(this.getUserKey("profile"), GUEST_STUDENT);
    }
    if (!userId && !session?.userId) return null;
    return getJson<Student | null>(this.getUserKey("profile", userId), null);
  },

  setStudent(student: Student, userId?: string): void {
    setJson(this.getUserKey("profile", userId || student.id), student);
    // Also sync to registered accounts DB
    const account = this.findAccountByEmail(student.email);
    if (account) {
      account.student = student;
      account.fullName = student.full_name;
      this.saveRegisteredAccount(account);
    }
  },

  // Dynamic Course & Semester Curriculum Initializer (Multi-course CA, CS, B.Com, BBA, BCA, etc.)
  setStudentCourse(
    courseName: string,
    semester?: string,
    userId?: string
  ): { subjectsCount: number; chaptersCount: number } {
    const session = this.getActiveSession();
    const effectiveId = userId || session?.userId;
    if (!effectiveId) return { subjectsCount: 0, chaptersCount: 0 };

    const student = this.getStudent(effectiveId);
    if (student) {
      student.course = courseName;
      if (semester) student.semester = semester;
      student.updated_at = new Date().toISOString();
      this.setStudent(student, effectiveId);
    }

    const { subjects, chapters } = initializeCourseCurriculumForStudent(
      courseName,
      effectiveId
    );
    this.setSubjects(subjects, effectiveId);
    this.setChapters(chapters, effectiveId);

    return { subjectsCount: subjects.length, chaptersCount: chapters.length };
  },

  // Subjects
  getSubjects(userId?: string): Subject[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<Subject[]>(this.getUserKey("subjects"), GUEST_SUBJECTS);
    }
    return getJson<Subject[]>(this.getUserKey("subjects", userId), []);
  },
  setSubjects(subjects: Subject[], userId?: string): void {
    setJson(this.getUserKey("subjects", userId), subjects);
  },

  // Chapters
  getChapters(userId?: string): Chapter[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<Chapter[]>(this.getUserKey("chapters"), GUEST_CHAPTERS);
    }
    return getJson<Chapter[]>(this.getUserKey("chapters", userId), []);
  },
  setChapters(chapters: Chapter[], userId?: string): void {
    setJson(this.getUserKey("chapters", userId), chapters);
  },

  // Chapter Tracking & Preparation Management
  updateChapterStudyStatus(
    chapterId: string,
    studyStatus: StudyStatus,
    studyHoursSpent?: number,
    userId?: string
  ): Chapter | null {
    const chapters = this.getChapters(userId);
    let updated: Chapter | null = null;
    const next = chapters.map((c) => {
      if (c.id === chapterId) {
        const isCompleted = studyStatus === "completed";
        updated = {
          ...c,
          study_status: studyStatus,
          status: isCompleted ? "completed" : studyStatus === "in_progress" ? "in_progress" : "pending",
          study_completed_at: isCompleted ? (c.study_completed_at || new Date().toISOString()) : undefined,
          study_hours_spent: studyHoursSpent !== undefined ? studyHoursSpent : (c.study_hours_spent || 0),
          updated_at: new Date().toISOString(),
        };
        return updated;
      }
      return c;
    });
    this.setChapters(next, userId);
    return updated;
  },

  addChapterRevision(
    chapterId: string,
    milestone: RevisionMilestoneType,
    notes?: string,
    durationMinutes?: number,
    userId?: string
  ): Chapter | null {
    const chapters = this.getChapters(userId);
    let updated: Chapter | null = null;
    const next = chapters.map((c) => {
      if (c.id === chapterId) {
        const revHistory = [...(c.revision_history || [])];
        revHistory.push({
          id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          milestone,
          completed_at: new Date().toISOString(),
          duration_minutes: durationMinutes || 45,
          notes,
        });
        const revStatus = revHistory.length >= 2 ? "mastered" : "revised_once";
        updated = {
          ...c,
          revision_status: revStatus,
          revision_history: revHistory,
          updated_at: new Date().toISOString(),
        };
        return updated;
      }
      return c;
    });
    this.setChapters(next, userId);
    return updated;
  },

  addChapterTestAttempt(
    chapterId: string,
    attempt: Omit<ChapterTestRecord, "id">,
    userId?: string
  ): Chapter | null {
    const chapters = this.getChapters(userId);
    let updated: Chapter | null = null;
    const next = chapters.map((c) => {
      if (c.id === chapterId) {
        const testHistory = [...(c.test_history || [])];
        const newRecord: ChapterTestRecord = {
          ...attempt,
          id: `test-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        };
        testHistory.push(newRecord);
        const testStatus: TestStatus = newRecord.passed ? "passed" : "needs_improvement";
        updated = {
          ...c,
          test_status: testStatus,
          test_history: testHistory,
          updated_at: new Date().toISOString(),
        };
        return updated;
      }
      return c;
    });
    this.setChapters(next, userId);
    return updated;
  },

  addCustomChapter(
    subjectId: string,
    title: string,
    estimatedHours: number,
    difficulty: Difficulty,
    nature: ChapterNature,
    userId?: string
  ): Chapter {
    const chapters = this.getChapters(userId);
    const subChapters = chapters.filter((c) => c.subject_id === subjectId);
    const newChapter: Chapter = {
      id: `custom-chap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      subject_id: subjectId,
      student_id: userId || GUEST_STUDENT.id,
      title: title.trim(),
      chapter_number: subChapters.length + 1,
      difficulty,
      estimated_hours: estimatedHours || 3.0,
      status: "pending",
      study_status: "not_started",
      study_hours_spent: 0,
      revision_status: "not_started",
      revision_history: [],
      test_status: "not_attempted",
      test_history: [],
      notes_count: 0,
      nature,
      is_custom: true,
      official_source: "Student Custom Chapter",
      syllabus_version: "Personalized Study Track",
      is_verified: true,
      created_at: new Date().toISOString(),
    };
    chapters.push(newChapter);
    this.setChapters(chapters, userId);
    return newChapter;
  },

  deleteChapter(chapterId: string, userId?: string): boolean {
    const chapters = this.getChapters(userId);
    const filtered = chapters.filter((c) => c.id !== chapterId);
    if (filtered.length !== chapters.length) {
      this.setChapters(filtered, userId);
      return true;
    }
    return false;
  },

  getExamReadiness(userId?: string): ExamReadinessAnalysis {
    const subjects = this.getSubjects(userId);
    const chapters = this.getChapters(userId);
    const exams = this.getExaminations(userId);
    const student = this.getStudent(userId);
    return ReadinessEngine.calculateExamReadiness(
      subjects,
      chapters,
      exams,
      student?.daily_available_hours || 4.5
    );
  },

  // Support Tickets & Support Chat
  getSupportTickets(userId?: string): SupportTicket[] {
    return getJson<SupportTicket[]>(this.getUserKey("support_tickets", userId), [
      {
        id: "ticket-seed-1",
        student_id: userId || GUEST_STUDENT.id,
        student_email: "demo.student@studymate.ai",
        subject: "ICAI New Scheme 2024 Syllabus Clarification",
        message: "Can I customize the chapter sequence for Paper 1 Advanced Accounting Schedule III?",
        category: "curriculum",
        status: "resolved",
        priority: "medium",
        admin_response: "Yes! You can edit any chapter difficulty or target date directly from Chapter Intelligence, or add your own custom study units.",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  },

  saveSupportTicket(ticket: SupportTicket, userId?: string): void {
    const list = this.getSupportTickets(userId);
    const idx = list.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) {
      list[idx] = ticket;
    } else {
      list.unshift(ticket);
    }
    setJson(this.getUserKey("support_tickets", userId), list);
  },

  getSupportChatMessages(userId?: string): SupportChatMessage[] {
    return getJson<SupportChatMessage[]>(this.getUserKey("support_chat", userId), [
      {
        id: "msg-welcome",
        sender: "assistant",
        text: "Hello! I am your StudyMate Academic Assistant. I can guide you on syllabus management, your timetable, chapter revisions, test performance, or technical questions.",
        timestamp: new Date().toISOString(),
        suggested_actions: [
          { label: "How is Exam Readiness calculated?", action_id: "explain_readiness" },
          { label: "How do I mark revisions complete?", action_id: "explain_revisions" },
          { label: "Need technical help / Contact admin", action_id: "create_ticket" },
        ],
      },
    ]);
  },

  saveSupportChatMessage(message: SupportChatMessage, userId?: string): void {
    const list = this.getSupportChatMessages(userId);
    list.push(message);
    setJson(this.getUserKey("support_chat", userId), list.slice(-50));
  },

  clearSupportChatMessages(userId?: string): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.getUserKey("support_chat", userId));
    }
  },

  // Examinations
  getExaminations(userId?: string): Examination[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<Examination[]>(this.getUserKey("examinations"), GUEST_EXAMINATIONS);
    }
    return getJson<Examination[]>(this.getUserKey("examinations", userId), []);
  },
  setExaminations(exams: Examination[], userId?: string): void {
    setJson(this.getUserKey("examinations", userId), exams);
  },

  // Timetables
  getTimetables(userId?: string): Timetable[] {
    return getJson<Timetable[]>(this.getUserKey("timetables", userId), []);
  },
  getTimetable(userId?: string): Timetable | null {
    const list = this.getTimetables(userId);
    return list.length > 0 ? list[0] : null;
  },
  setTimetables(timetables: Timetable[], userId?: string): void {
    setJson(this.getUserKey("timetables", userId), timetables);
  },

  // Study Sessions
  getStudySessions(userId?: string): StudySession[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<StudySession[]>(this.getUserKey("sessions"), GUEST_SESSIONS);
    }
    return getJson<StudySession[]>(this.getUserKey("sessions", userId), []);
  },
  setStudySessions(sessions: StudySession[], userId?: string): void {
    setJson(this.getUserKey("sessions", userId), sessions);
  },

  // Reminders
  getReminders(userId?: string): Reminder[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<Reminder[]>(this.getUserKey("reminders"), GUEST_REMINDERS);
    }
    return getJson<Reminder[]>(this.getUserKey("reminders", userId), []);
  },
  setReminders(reminders: Reminder[], userId?: string): void {
    setJson(this.getUserKey("reminders", userId), reminders);
  },

  // Student Tasks
  getTasks(userId?: string): StudentTask[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<StudentTask[]>(this.getUserKey("tasks"), [
        {
          id: "task-guest-1",
          student_id: "guest-student-id",
          title: "Complete Chapter 1 Practice Questions",
          subject_name: "General Studies",
          due_date: new Date().toISOString().split("T")[0],
          priority: "high",
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        {
          id: "task-guest-2",
          student_id: "guest-student-id",
          title: "Revise Summary Notes & Flashcards",
          subject_name: "General Studies",
          due_date: new Date().toISOString().split("T")[0],
          priority: "medium",
          is_completed: false,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    return getJson<StudentTask[]>(this.getUserKey("tasks", userId), []);
  },
  setTasks(tasks: StudentTask[], userId?: string): void {
    setJson(this.getUserKey("tasks", userId), tasks);
  },

  // Progress
  getProgress(userId?: string): StudyProgress[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<StudyProgress[]>(this.getUserKey("progress"), GUEST_PROGRESS);
    }
    return getJson<StudyProgress[]>(this.getUserKey("progress", userId), []);
  },
  setProgress(progress: StudyProgress[], userId?: string): void {
    setJson(this.getUserKey("progress", userId), progress);
  },

  // Videos
  getVideos(userId?: string): SavedVideo[] {
    return getJson<SavedVideo[]>(this.getUserKey("videos", userId), []);
  },
  setVideos(videos: SavedVideo[], userId?: string): void {
    setJson(this.getUserKey("videos", userId), videos);
  },

  // Notes
  getNotes(userId?: string): Note[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<Note[]>(this.getUserKey("notes"), GUEST_NOTES);
    }
    return getJson<Note[]>(this.getUserKey("notes", userId), []);
  },
  setNotes(notes: Note[], userId?: string): void {
    setJson(this.getUserKey("notes", userId), notes);
  },

  // Documents
  getDocuments(userId?: string): UploadedDocument[] {
    return getJson<UploadedDocument[]>(this.getUserKey("documents", userId), []);
  },
  setDocuments(docs: UploadedDocument[], userId?: string): void {
    setJson(this.getUserKey("documents", userId), docs);
  },

  // Module 1 & 4: Exam Target Plan & Decision Persistence
  getExamPlan(userId?: string): ExamTargetPlan | null {
    return getJson<ExamTargetPlan | null>(this.getUserKey("exam_plan", userId), null);
  },
  setExamPlan(plan: ExamTargetPlan, userId?: string): void {
    setJson(this.getUserKey("exam_plan", userId), plan);
  },
  getPlanDecisions(userId?: string): Record<string, "accepted" | "kept_existing"> {
    return getJson<Record<string, "accepted" | "kept_existing">>(this.getUserKey("plan_decisions", userId), {});
  },
  savePlanDecision(errorId: string, decision: "accepted" | "kept_existing", userId?: string): void {
    const decisions = this.getPlanDecisions(userId);
    decisions[errorId] = decision;
    setJson(this.getUserKey("plan_decisions", userId), decisions);
  },

  // Module 6: Practice Tests & Attempts
  getPracticeTests(userId?: string): PracticeTest[] {
    return getJson<PracticeTest[]>(this.getUserKey("practice_tests", userId), []);
  },
  setPracticeTests(tests: PracticeTest[], userId?: string): void {
    setJson(this.getUserKey("practice_tests", userId), tests);
  },
  savePracticeTest(test: PracticeTest, userId?: string): void {
    const current = this.getPracticeTests(userId);
    const existingIdx = current.findIndex((t) => t.id === test.id);
    if (existingIdx >= 0) {
      current[existingIdx] = test;
    } else {
      current.unshift(test);
    }
    this.setPracticeTests(current, userId);
  },
  getTestAttempts(userId?: string): TestAttempt[] {
    return getJson<TestAttempt[]>(this.getUserKey("test_attempts", userId), []);
  },
  saveTestAttempt(attempt: TestAttempt, userId?: string): void {
    const attempts = this.getTestAttempts(userId);
    attempts.unshift(attempt);
    setJson(this.getUserKey("test_attempts", userId), attempts);
  },

  // Module 7: Teacher Ratings
  getTeacherRatings(userId?: string): Record<string, boolean> {
    return getJson<Record<string, boolean>>(this.getUserKey("teacher_ratings", userId), {});
  },
  rateTeacher(teacherId: string, useful: boolean, userId?: string): void {
    const ratings = this.getTeacherRatings(userId);
    ratings[teacherId] = useful;
    setJson(this.getUserKey("teacher_ratings", userId), ratings);
  },

  // Module 9: Daily Adjustments / Evening Reflection
  getDailyAdjustments(userId?: string): DailyAdjustment[] {
    return getJson<DailyAdjustment[]>(this.getUserKey("daily_adjustments", userId), []);
  },
  saveDailyAdjustment(adj: DailyAdjustment, userId?: string): void {
    const list = this.getDailyAdjustments(userId);
    list.unshift(adj);
    setJson(this.getUserKey("daily_adjustments", userId), list);
  },
  updateDailyAdjustmentStatus(adjId: string, status: "applied" | "kept_existing", userId?: string): void {
    const list = this.getDailyAdjustments(userId);
    const found = list.find((a) => a.id === adjId);
    if (found) {
      found.status = status;
      setJson(this.getUserKey("daily_adjustments", userId), list);
    }
  },

  // Module 8: Non-Irritating Study Timer Background Recording
  recordTimerSession(minutes: number, sessionTitle: string, subjectName: string, userId?: string): void {
    if (minutes <= 0) return;
    const today = new Date().toISOString().split("T")[0];

    // 1. Update daily progress
    const progressList = this.getProgress(userId);
    let todayProg = progressList.find((p) => p.date === today);
    if (!todayProg) {
      todayProg = {
        id: `prog-${Date.now()}`,
        student_id: userId || "guest",
        date: today,
        total_minutes_studied: 0,
        chapters_completed_count: 0,
        sessions_completed_count: 0,
        consistency_streak_days: Math.max(1, progressList.length + 1),
        created_at: new Date().toISOString(),
      };
      progressList.push(todayProg);
    }
    todayProg.total_minutes_studied += minutes;
    todayProg.sessions_completed_count += 1;
    this.setProgress(progressList, userId);

    // 2. Add completed study session record
    const sessions = this.getStudySessions(userId);
    const now = new Date();
    const startH = now.getHours().toString().padStart(2, "0");
    const startM = now.getMinutes().toString().padStart(2, "0");

    sessions.push({
      id: `timer-sess-${Date.now()}`,
      student_id: userId || "guest",
      timetable_id: "timer-auto",
      subject_id: `sub-timer`,
      subject_name: subjectName || "Focused Study",
      subject_color: "#6366f1",
      chapter_title: sessionTitle || "Self-Paced Learning",
      date: today,
      start_time: `${startH}:${startM}`,
      end_time: `${startH}:${startM}`,
      duration_minutes: minutes,
      session_type: "study",
      status: "completed",
      notes: "Logged via StudyMate Peaceful Study Timer",
      created_at: new Date().toISOString(),
    });
    this.setStudySessions(sessions, userId);
  },

  // Initialize a completely blank student account on registration
  initializeFreshStudentAccount(userId: string, email: string, fullName: string): Student {
    const freshStudent: Student = {
      id: userId,
      email: email,
      full_name: fullName,
      course: "",
      education_level: "",
      institution: "",
      grade_or_year: "Student",
      target_exam: "Upcoming Examination",
      daily_available_hours: 4.0,
      preferred_study_time: "evening",
      break_duration_minutes: 15,
      weekly_holiday: "Sunday",
      onboarding_completed: false, // Must go through Onboarding Wizard
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save completely empty arrays for this user
    this.setStudent(freshStudent, userId);
    this.setSubjects([], userId);
    this.setChapters([], userId);
    this.setExaminations([], userId);
    this.setStudySessions([], userId);
    this.setReminders([], userId);
    this.setProgress([], userId);
    this.setVideos([], userId);
    this.setNotes([], userId);
    this.setDocuments([], userId);

    return freshStudent;
  },

  // Reset Guest Demo Data ONLY
  resetGuestDemo(): void {
    setJson("studymate_guest_profile", GUEST_STUDENT);
    setJson("studymate_guest_subjects", GUEST_SUBJECTS);
    setJson("studymate_guest_chapters", GUEST_CHAPTERS);
    setJson("studymate_guest_examinations", GUEST_EXAMINATIONS);
    setJson("studymate_guest_sessions", GUEST_SESSIONS);
    setJson("studymate_guest_reminders", GUEST_REMINDERS);
    setJson("studymate_guest_progress", GUEST_PROGRESS);
    setJson("studymate_guest_notes", GUEST_NOTES);
  },

  // ==========================================
  // Admin Portal & Platform Governance Methods
  // ==========================================

  getActiveAdminSession(): AdminUser | null {
    return getJson<AdminUser | null>(ADMIN_ACTIVE_SESSION_KEY, null);
  },

  setActiveAdminSession(admin: AdminUser | null): void {
    if (admin) {
      setJson(ADMIN_ACTIVE_SESSION_KEY, admin);
      this.addAuditLog("login", `Admin authenticated: ${admin.email}`, "AdminSession", admin.email);
    } else {
      const current = this.getActiveAdminSession();
      if (current) {
        this.addAuditLog("logout", `Admin logged out: ${current.email}`, "AdminSession", current.email);
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem(ADMIN_ACTIVE_SESSION_KEY);
      }
    }
  },

  getAdminAuditLogs(): AdminAuditLog[] {
    return getJson<AdminAuditLog[]>(ADMIN_AUDIT_LOGS_KEY, [
      {
        id: "log-seed-1",
        admin_email: "system@studymate.ai",
        action: "settings_updated",
        details: "Platform initialized with role-based security isolation.",
        timestamp: new Date().toISOString(),
        target_entity: "PlatformSettings",
      },
      {
        id: "log-seed-2",
        admin_email: "system@studymate.ai",
        action: "course_created",
        details: "Curriculum models provisioned for ICAI, ICSI, and University degrees.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        target_entity: "CourseCatalog",
      },
    ]);
  },

  addAuditLog(action: AuditActionType, details: string, target_entity?: string, adminEmail?: string): void {
    const logs = this.getAdminAuditLogs();
    const currentAdmin = this.getActiveAdminSession();
    const log: AdminAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      admin_email: adminEmail || currentAdmin?.email || "admin@studymate.ai",
      action,
      details,
      timestamp: new Date().toISOString(),
      target_entity,
    };
    logs.unshift(log);
    setJson(ADMIN_AUDIT_LOGS_KEY, logs.slice(0, 150));
  },

  getAnnouncements(): Announcement[] {
    return getJson<Announcement[]>(ANNOUNCEMENTS_KEY, [
      {
        id: "ann-1",
        title: "2026-2027 Academic Schedule & AI Study Tools Active",
        content: "Welcome students! The AI Exam Target Planner and Numerical vs Theory study engines are active for the new academic session.",
        target_course: "all",
        priority: "normal",
        is_active: true,
        created_at: new Date().toISOString(),
        author_email: "admin@studymate.ai",
      },
      {
        id: "ann-2",
        title: "ICAI Exam Timetable & Practice Test Series Ready",
        content: "Verified model test papers and chapter intelligence classification have been refreshed for CA & CS curricula.",
        target_course: "CA Intermediate",
        priority: "important",
        is_active: true,
        created_at: new Date().toISOString(),
        author_email: "admin@studymate.ai",
      },
    ]);
  },

  saveAnnouncement(announcement: Announcement): void {
    const list = this.getAnnouncements();
    const idx = list.findIndex((a) => a.id === announcement.id);
    if (idx >= 0) {
      list[idx] = announcement;
      this.addAuditLog("announcement_published", `Updated announcement: "${announcement.title}"`, announcement.id);
    } else {
      list.unshift(announcement);
      this.addAuditLog("announcement_published", `Published announcement: "${announcement.title}" (Target: ${announcement.target_course})`, announcement.id);
    }
    setJson(ANNOUNCEMENTS_KEY, list);
  },

  deleteAnnouncement(id: string): void {
    const list = this.getAnnouncements().filter((a) => a.id !== id);
    setJson(ANNOUNCEMENTS_KEY, list);
    this.addAuditLog("announcement_deleted", `Deleted announcement id: ${id}`, id);
  },

  getPlatformSettings(): PlatformSettings {
    return getJson<PlatformSettings>(PLATFORM_SETTINGS_KEY, {
      platform_name: "StudyMate AI",
      academic_year: "2026-2027",
      maintenance_mode: false,
      ai_engine_enabled: true,
      allow_registrations: true,
      system_notice_banner: "Welcome to StudyMate AI – Intelligent Exam Preparation Engine Active.",
      updated_at: new Date().toISOString(),
    });
  },

  updatePlatformSettings(settings: Partial<PlatformSettings>): PlatformSettings {
    const current = this.getPlatformSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
    setJson(PLATFORM_SETTINGS_KEY, updated);
    this.addAuditLog("settings_updated", "Platform configuration settings modified.", "PlatformSettings");
    return updated;
  },

  getCoursesCatalog(): CourseCatalogItem[] {
    return getJson<CourseCatalogItem[]>(COURSE_CATALOG_KEY, [
      { id: "course-ca-found", code: "CA-FND", name: "CA Foundation", category: "Professional", total_subjects: 4, is_active: true, description: "Entry-level exam for Chartered Accountancy" },
      { id: "course-ca-inter", code: "CA-INT", name: "CA Intermediate", category: "Professional", total_subjects: 6, is_active: true, description: "Intermediate stage examination for ICAI CA" },
      { id: "course-ca-final", code: "CA-FNL", name: "CA Final", category: "Professional", total_subjects: 6, is_active: true, description: "Final qualification examination for Chartered Accountancy" },
      { id: "course-cs-exec", code: "CS-EXE", name: "CS Executive", category: "Professional", total_subjects: 7, is_active: true, description: "ICSI Company Secretary Executive level" },
      { id: "course-cs-prof", code: "CS-PRF", name: "CS Professional", category: "Professional", total_subjects: 7, is_active: true, description: "ICSI Company Secretary Professional level" },
      { id: "course-bcom", code: "B-COM", name: "B.Com (General / Honours)", category: "Undergraduate", total_subjects: 6, is_active: true, description: "Bachelor of Commerce university curriculum" },
      { id: "course-bba", code: "BBA", name: "BBA (Bachelor of Business Admin)", category: "Undergraduate", total_subjects: 6, is_active: true, description: "Business Administration undergraduate degree" },
      { id: "course-bca", code: "BCA", name: "BCA (Bachelor of Computer App)", category: "Undergraduate", total_subjects: 6, is_active: true, description: "Computer Applications undergraduate curriculum" },
      { id: "course-ba", code: "BA", name: "BA (Bachelor of Arts)", category: "Undergraduate", total_subjects: 5, is_active: true, description: "Arts & Humanities undergraduate degree" },
      { id: "course-c12", code: "CLASS-12", name: "Class 12 (CBSE / State Board)", category: "School", total_subjects: 5, is_active: true, description: "Senior Secondary Board examinations" },
      { id: "course-c10", code: "CLASS-10", name: "Class 10 (CBSE / State Board)", category: "School", total_subjects: 5, is_active: true, description: "Secondary School Board examinations" },
    ]);
  },

  saveCourseCatalogItem(item: CourseCatalogItem): void {
    const catalog = this.getCoursesCatalog();
    const idx = catalog.findIndex((c) => c.id === item.id);
    if (idx >= 0) {
      catalog[idx] = item;
      this.addAuditLog("course_updated", `Updated course catalog item: ${item.name} (${item.code})`, item.id);
    } else {
      catalog.push(item);
      this.addAuditLog("course_created", `Created course catalog item: ${item.name} (${item.code})`, item.id);
    }
    setJson(COURSE_CATALOG_KEY, catalog);
  },

  deleteCourseCatalogItem(id: string): void {
    const catalog = this.getCoursesCatalog().filter((c) => c.id !== id);
    setJson(COURSE_CATALOG_KEY, catalog);
    this.addAuditLog("course_deleted", `Deleted course id: ${id}`, id);
  },

  // Student Administration with Strict Privacy
  // Note: Only aggregate metrics are provided; private notes and uploads are strictly withheld
  getAllStudentsSummary(): Array<{
    student: Student;
    totalMinutesStudied: number;
    sessionsCount: number;
    timetableCreated: boolean;
  }> {
    const accounts = this.getRegisteredAccounts();
    const result: Array<{
      student: Student;
      totalMinutesStudied: number;
      sessionsCount: number;
      timetableCreated: boolean;
    }> = [];

    // Also include guest demo user for completeness in demo mode
    const guestStudent = this.getStudent(GUEST_STUDENT.id);
    if (guestStudent) {
      const guestProgress = this.getProgress(GUEST_STUDENT.id);
      const totalMinutes = guestProgress.reduce((acc, p) => acc + (p.total_minutes_studied || 0), 0);
      const guestSessions = this.getStudySessions(GUEST_STUDENT.id);
      const tt = this.getTimetable(GUEST_STUDENT.id);
      result.push({
        student: { ...guestStudent, status: guestStudent.status || "active" },
        totalMinutesStudied: totalMinutes,
        sessionsCount: guestSessions.length,
        timetableCreated: !!tt,
      });
    }

    Object.values(accounts).forEach((acc) => {
      const s = this.getStudent(acc.id) || acc.student;
      if (s) {
        const prog = this.getProgress(s.id);
        const totalMinutes = prog.reduce((sum, p) => sum + (p.total_minutes_studied || 0), 0);
        const sessions = this.getStudySessions(s.id);
        const tt = this.getTimetable(s.id);
        result.push({
          student: { ...s, status: s.status || "active" },
          totalMinutesStudied: totalMinutes,
          sessionsCount: sessions.length,
          timetableCreated: !!tt,
        });
      }
    });

    return result;
  },

  toggleStudentStatus(studentId: string, status: "active" | "suspended"): boolean {
    const accounts = this.getRegisteredAccounts();
    let found = false;

    Object.keys(accounts).forEach((email) => {
      if (accounts[email].id === studentId) {
        accounts[email].student.status = status;
        found = true;
      }
    });

    if (found) {
      setJson(REGISTERED_USERS_KEY, accounts);
    }

    const student = this.getStudent(studentId);
    if (student) {
      student.status = status;
      this.setStudent(student, studentId);
      found = true;
    }

    this.addAuditLog(
      "student_status_change",
      `Student account (${studentId}) status toggled to: ${status}`,
      studentId
    );

    return found;
  },

  /**
   * Safe migration for CS Executive curriculum
   * Preserves all user notes, test records, revision records, study statuses,
   * while upgrading subjects and chapters to the official 128 verified chapters.
   */
  migrateCsExecutiveCurriculum(userId?: string): {
    migrated: boolean;
    backupKey: string;
    subjectsUpdated: number;
    chaptersTotal: number;
    logs: string[];
  } {
    const session = this.getActiveSession();
    const effectiveId = userId || session?.userId;
    if (!effectiveId) {
      return {
        migrated: false,
        backupKey: "",
        subjectsUpdated: 0,
        chaptersTotal: 0,
        logs: ["No active user ID found for migration."],
      };
    }

    const logs: string[] = [];
    const backupKey = `studymate_backup_${effectiveId}_${Date.now()}`;

    // 1. Safe Backup of current state
    const currentSubjects = this.getSubjects(effectiveId);
    const currentChapters = this.getChapters(effectiveId);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          backupKey,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            subjects: currentSubjects,
            chapters: currentChapters,
          })
        );
        logs.push(`Backup safely saved to key: ${backupKey}`);
      } catch (e) {
        console.warn("Could not save backup to localStorage", e);
      }
    }

    // 2. Map subjects & chapters preserving all progress
    const updatedSubjects: Subject[] = [];
    const updatedChapters: Chapter[] = [];

    CS_EXECUTIVE_OFFICIAL_CURRICULUM.forEach((officialSub) => {
      // Find existing subject for this official paper
      const existingSub = currentSubjects.find((s) => {
        const sName = s.name.toLowerCase();
        const oName = officialSub.name.toLowerCase();
        const oShort = officialSub.shortName.toLowerCase();
        return (
          sName === oName ||
          sName === oShort ||
          oName.includes(sName) ||
          sName.includes(oShort)
        );
      });

      const subId =
        existingSub?.id ||
        `cs-sub-${officialSub.paperNumber}-${Date.now().toString(36)}`;
      const existingChapsForSub = currentChapters.filter(
        (c) => c.subject_id === existingSub?.id
      );

      // Create/update Subject
      const mappedSubject: Subject = {
        id: subId,
        student_id: effectiveId,
        course: "CS Executive",
        name: officialSub.name,
        code: officialSub.code,
        color: officialSub.color,
        icon: officialSub.icon,
        total_chapters: officialSub.chapters.length,
        completed_chapters: 0,
        target_date:
          officialSub.examDate || existingSub?.target_date || "2026-12-21",
        is_weak: existingSub?.is_weak || false,
        is_strong: existingSub?.is_strong || false,
        created_at: existingSub?.created_at || new Date().toISOString(),
      };

      // Map chapters
      let completedChapsCount = 0;
      officialSub.chapters.forEach((offCh) => {
        // Find if student already had this chapter (by title or number)
        const existingChap = existingChapsForSub.find((c) => {
          const cNorm = c.title.toLowerCase().replace(/[^\w]/g, "");
          const offNorm = offCh.title.toLowerCase().replace(/[^\w]/g, "");
          return (
            cNorm === offNorm ||
            cNorm.includes(offNorm) ||
            offNorm.includes(cNorm) ||
            c.chapter_number === offCh.chapterNumber
          );
        });

        const chapId =
          existingChap?.id ||
          `cs-chap-${officialSub.paperNumber}-${offCh.chapterNumber}-${Date.now().toString(36)}`;
        const studyStatus =
          existingChap?.study_status ||
          (existingChap?.status === "completed"
            ? "completed"
            : existingChap?.status === "in_progress"
            ? "in_progress"
            : "not_started");

        if (studyStatus === "completed") completedChapsCount++;

        const mappedChapter: Chapter = {
          id: chapId,
          subject_id: subId,
          student_id: effectiveId,
          title: offCh.title,
          chapter_number: offCh.chapterNumber,
          difficulty: existingChap?.difficulty || offCh.difficulty,
          estimated_hours:
            existingChap?.estimated_hours || offCh.estimatedHours,
          status:
            existingChap?.status ||
            (studyStatus === "completed"
              ? "completed"
              : studyStatus === "in_progress"
              ? "in_progress"
              : "pending"),
          study_status: studyStatus,
          study_completed_at: existingChap?.study_completed_at,
          study_hours_spent:
            existingChap?.study_hours_spent !== undefined
              ? existingChap.study_hours_spent
              : studyStatus === "completed"
              ? offCh.estimatedHours
              : 0,
          revision_status: existingChap?.revision_status || "not_started",
          revision_history: existingChap?.revision_history || [],
          test_status: existingChap?.test_status || "not_attempted",
          test_history: existingChap?.test_history || [],
          nature: offCh.nature,
          notes_count: existingChap?.notes_count || 0,
          created_at: existingChap?.created_at || new Date().toISOString(),
        };

        updatedChapters.push(mappedChapter);
      });

      mappedSubject.completed_chapters = completedChapsCount;
      updatedSubjects.push(mappedSubject);
    });

    // 3. Save safe migrated records
    this.setSubjects(updatedSubjects, effectiveId);
    this.setChapters(updatedChapters, effectiveId);

    // 4. Update student profile target course to CS Executive if applicable
    const student = this.getStudent(effectiveId);
    if (student) {
      student.course = "CS Executive";
      student.updated_at = new Date().toISOString();
      this.setStudent(student, effectiveId);
    }

    logs.push(
      `Successfully upgraded student (${effectiveId}) to 7 official subjects and ${updatedChapters.length} verified lessons.`
    );

    return {
      migrated: true,
      backupKey,
      subjectsUpdated: updatedSubjects.length,
      chaptersTotal: updatedChapters.length,
      logs,
    };
  },

  // Exam Attempts (Feature 26, 101, 102, 103)
  getExamAttempts(userId?: string): ExamAttemptRecord[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<ExamAttemptRecord[]>(this.getUserKey("exam_attempts"), [
        {
          id: "att-dec-2025",
          student_id: GUEST_STUDENT.id,
          attempt_label: "December 2025 Attempt (Group 1)",
          exam_body: "ICSI CS Executive",
          registration_number: "240981726/12/2024",
          roll_number: "419822",
          total_marks: 218,
          max_marks: 400,
          percentage: 54.5,
          status: "Passed",
          marks_breakdown: [
            { subject_code: "JIGL", subject_name: "Jurisprudence, Interpretation & General Laws", marks_obtained: 54, max_marks: 100, passed: true, is_exemption: false },
            { subject_code: "CLP", subject_name: "Company Law & Practice", marks_obtained: 62, max_marks: 100, passed: true, is_exemption: true },
            { subject_code: "SBIL", subject_name: "Setting Up of Business, Industrial & Labour Laws", marks_obtained: 51, max_marks: 100, passed: true, is_exemption: false },
            { subject_code: "CAFM", subject_name: "Corporate Accounting & Financial Management", marks_obtained: 51, max_marks: 100, passed: true, is_exemption: false },
          ],
          created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
        },
      ]);
    }
    return getJson<ExamAttemptRecord[]>(this.getUserKey("exam_attempts", userId), []);
  },
  saveExamAttempt(attempt: ExamAttemptRecord, userId?: string): void {
    const list = this.getExamAttempts(userId);
    const existingIdx = list.findIndex((a) => a.id === attempt.id);
    if (existingIdx >= 0) {
      list[existingIdx] = attempt;
    } else {
      list.unshift(attempt);
    }
    setJson(this.getUserKey("exam_attempts", userId), list);
  },

  // Exemptions (Feature 28, 105)
  getExemptions(userId?: string): ExemptionRecord[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<ExemptionRecord[]>(this.getUserKey("exemptions"), [
        {
          id: "exm-1",
          student_id: GUEST_STUDENT.id,
          subject_code: "CLP",
          subject_name: "Company Law & Practice",
          marks_secured: 62,
          secured_in_attempt: "December 2025",
          valid_until_attempt: "June 2028 (3 consecutive attempts)",
          is_active: true,
        },
      ]);
    }
    return getJson<ExemptionRecord[]>(this.getUserKey("exemptions", userId), []);
  },
  saveExemption(exemption: ExemptionRecord, userId?: string): void {
    const list = this.getExemptions(userId);
    const existingIdx = list.findIndex((e) => e.id === exemption.id);
    if (existingIdx >= 0) {
      list[existingIdx] = exemption;
    } else {
      list.push(exemption);
    }
    setJson(this.getUserKey("exemptions", userId), list);
  },

  // Flashcards (Feature 46, 47)
  getFlashcards(userId?: string): FlashcardItem[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<FlashcardItem[]>(this.getUserKey("flashcards"), [
        {
          id: "fc-1",
          student_id: GUEST_STUDENT.id,
          subject_name: "Company Law & Practice",
          chapter_title: "General Meetings",
          front: "What is the statutory quorum for a Public Company AGM?",
          back: "Up to 1000 members: 5 members personally present. 1000 to 5000 members: 15 members personally present. Exceeding 5000 members: 30 members personally present. (Section 103, Companies Act 2013)",
          mastery_level: "reviewing",
          last_reviewed_at: new Date().toISOString(),
        },
        {
          id: "fc-2",
          student_id: GUEST_STUDENT.id,
          subject_name: "Jurisprudence, Interpretation & General Laws",
          chapter_title: "Sources of Law",
          front: "What are the essential elements of a valid Custom in Indian Jurisprudence?",
          back: "Immemorial antiquity, certainty, reasonableness, continuity, peaceable enjoyment, and consistency with statutory enactments.",
          mastery_level: "learning",
          last_reviewed_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "fc-3",
          student_id: GUEST_STUDENT.id,
          subject_name: "Tax Laws & Practice",
          chapter_title: "Basic Concepts & Basis of Charge",
          front: "Under what conditions is a person considered Ordinarily Resident (ROR) in India?",
          back: "Must satisfy at least 1 basic condition under Sec 6(1) AND both additional conditions: Resident in India for at least 2 out of 10 preceding PYs, AND physically present for 730 days or more during 7 preceding PYs.",
          mastery_level: "mastered",
          last_reviewed_at: new Date().toISOString(),
        },
      ]);
    }
    return getJson<FlashcardItem[]>(this.getUserKey("flashcards", userId), []);
  },
  saveFlashcard(card: FlashcardItem, userId?: string): void {
    const list = this.getFlashcards(userId);
    const existingIdx = list.findIndex((c) => c.id === card.id);
    if (existingIdx >= 0) {
      list[existingIdx] = card;
    } else {
      list.unshift(card);
    }
    setJson(this.getUserKey("flashcards", userId), list);
  },
  deleteFlashcard(cardId: string, userId?: string): void {
    const list = this.getFlashcards(userId).filter((c) => c.id !== cardId);
    setJson(this.getUserKey("flashcards", userId), list);
  },

  // Doubts (Feature 55, 86)
  getDoubts(userId?: string): StudentDoubtItem[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<StudentDoubtItem[]>(this.getUserKey("doubts"), [
        {
          id: "dbt-1",
          student_id: GUEST_STUDENT.id,
          subject_name: "Corporate Accounting & Financial Management",
          chapter_title: "Cash Flow Statement",
          question: "How are interim dividends and final proposed dividends differentiated in Cash Flow financing vs operating activities under AS 3?",
          status: "clarified",
          resolution_notes: "Interim dividend paid during the year is an outflow under Financing Activities. It is also added back to net profit in Operating Activities to find operating profit before working capital adjustments.",
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: "dbt-2",
          student_id: GUEST_STUDENT.id,
          subject_name: "Company Law & Practice",
          chapter_title: "Board of Directors",
          question: "Can an Additional Director appointed under Section 161(1) continue if the AGM is adjourned?",
          status: "open",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    }
    return getJson<StudentDoubtItem[]>(this.getUserKey("doubts", userId), []);
  },
  saveDoubt(doubt: StudentDoubtItem, userId?: string): void {
    const list = this.getDoubts(userId);
    const existingIdx = list.findIndex((d) => d.id === doubt.id);
    if (existingIdx >= 0) {
      list[existingIdx] = doubt;
    } else {
      list.unshift(doubt);
    }
    setJson(this.getUserKey("doubts", userId), list);
  },
  updateDoubtStatus(doubtId: string, status: "open" | "clarified", resolution?: string, userId?: string): void {
    const list = this.getDoubts(userId);
    const item = list.find((d) => d.id === doubtId);
    if (item) {
      item.status = status;
      if (resolution) item.resolution_notes = resolution;
      setJson(this.getUserKey("doubts", userId), list);
    }
  },

  // Productivity & Sleep (Features 71-76)
  getSleepDistractionLogs(userId?: string): SleepDistractionLog[] {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<SleepDistractionLog[]>(this.getUserKey("sleep_distraction_logs"), [
        {
          id: "log-1",
          student_id: GUEST_STUDENT.id,
          date: new Date().toISOString().split("T")[0],
          sleep_hours: 7.5,
          break_duration_minutes: 45,
          distraction_duration_minutes: 25,
          top_distractions: ["Social Media notifications", "Unscheduled phone call"],
          focus_score: 88,
          reflection_notes: "Strong focus during the morning company law revision block.",
          created_at: new Date().toISOString(),
        },
      ]);
    }
    return getJson<SleepDistractionLog[]>(this.getUserKey("sleep_distraction_logs", userId), []);
  },
  saveSleepDistractionLog(log: SleepDistractionLog, userId?: string): void {
    const list = this.getSleepDistractionLogs(userId);
    const existingIdx = list.findIndex((l) => l.date === log.date);
    if (existingIdx >= 0) {
      list[existingIdx] = log;
    } else {
      list.unshift(log);
    }
    setJson(this.getUserKey("sleep_distraction_logs", userId), list);
  },

  // Career Progress (Features 106-110)
  getCareerProgress(userId?: string): CareerProgressRecord {
    const session = this.getActiveSession();
    if (session?.isGuest) {
      return getJson<CareerProgressRecord>(this.getUserKey("career_progress"), {
        id: "c-rec-guest",
        student_id: GUEST_STUDENT.id,
        course_stage: "CS Executive Stage (Passed Group 1, preparing Group 2)",
        internship_status: "ongoing",
        firm_name: "Apex Corporate Advisory LLP, New Delhi",
        internship_start_date: "2025-08-01",
        internship_end_date: "2027-02-01",
        total_training_days_completed: 180,
        certifications: [
          "ICSI Pre-Examination Test Qualified",
          "One Day Orientation Programme (ODOP)",
          "Advanced Excel for Financial Modeling",
        ],
        target_job_roles: ["Company Secretary", "Corporate Governance Officer", "Legal Compliance Manager"],
        placement_applications: [
          { company_name: "Tata Consultancy Services (Legal Cell)", role: "Management Trainee - Compliance", applied_date: "2026-03-01", status: "shortlisted" },
          { company_name: "Deloitte India", role: "Tax & Secretarial Advisory Analyst", applied_date: "2026-02-15", status: "interview" },
        ],
      });
    }
    return getJson<CareerProgressRecord>(this.getUserKey("career_progress", userId), {
      id: "c-rec-" + (userId || "default"),
      student_id: userId || "",
      course_stage: "Professional Examination Candidate",
      internship_status: "not_started",
      total_training_days_completed: 0,
      certifications: [],
      target_job_roles: [],
      placement_applications: [],
    });
  },
  saveCareerProgress(record: CareerProgressRecord, userId?: string): void {
    setJson(this.getUserKey("career_progress", userId), record);
  },
};
