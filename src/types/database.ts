export type Difficulty = "easy" | "medium" | "hard";
export type ChapterStatus = "pending" | "in_progress" | "completed";
export type RevisionStatus = "not_started" | "revised_once" | "mastered";
export type DocumentType = "syllabus" | "datesheet" | "notes" | "study_material" | "question_paper";
export type ExtractionStatus = "pending" | "processing" | "completed" | "failed";
export type SessionType = "study" | "revision" | "mock_test" | "break" | "numerical_practice" | "theory_reading";
export type SessionStatus = "scheduled" | "in_progress" | "completed" | "skipped";
export type ReminderType = "study_session" | "chapter_deadline" | "revision" | "exam_countdown" | "custom";
export type PreferredStudyTime = "morning" | "afternoon" | "evening" | "night" | "flexible";
export type ExamPreparationLevel = "beginner" | "intermediate" | "advanced";

// Chapter Intelligence Types
export type ChapterNature = "numerical" | "theory" | "practical" | "mixed";
export type ChapterLength = "short" | "medium" | "long";
export type ExamImportance = "high" | "medium" | "normal";

export interface ChapterStrategy {
  nature: ChapterNature;
  length: ChapterLength;
  importance: ExamImportance;
  importance_rationale: string;
  recommended_hours: number;
  practice_target_mcqs: number;
  practice_target_numericals: number;
  strategy_steps: string[];
  alert_time_slot: "morning_peak" | "afternoon" | "evening" | "any";
}

export type EducationLevel =
  | "School (Class 9-10)"
  | "Senior Secondary (Class 11-12)"
  | "Undergraduate (B.Com, BBA, BCA, BA, B.Sc)"
  | "Postgraduate (M.Com, MBA, MCA, MA)"
  | "Professional (CA, CS, CMA)"
  | "Competitive Examinations";

export type UserRole = "student" | "admin";
export type StudentAccountStatus = "active" | "suspended";

export interface Student {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role?: UserRole;
  status?: StudentAccountStatus;
  education_level?: EducationLevel | string;
  course?: string; // e.g. "CA Foundation", "CS Executive", "BCA", etc.
  institution?: string; // optional college or university
  grade_or_year: string;
  target_exam: string;
  upcoming_exam_date?: string;
  daily_available_hours: number;
  preferred_study_time: PreferredStudyTime;
  break_duration_minutes: number;
  weekly_holiday: string; // e.g. "Sunday"
  onboarding_completed: boolean;
  weak_subjects?: string[];
  strong_subjects?: string[];
  preparation_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  student_id: string;
  course?: string;
  name: string;
  code?: string;
  color: string;
  icon?: string;
  total_chapters: number;
  completed_chapters: number;
  target_date?: string;
  is_weak?: boolean;
  is_strong?: boolean;
  created_at: string;
}

export type StudyStatus = "not_started" | "in_progress" | "completed";
export type RevisionMilestoneType = "revision_1" | "revision_2" | "revision_3" | "additional";
export type TestStatus = "not_attempted" | "attempted" | "passed" | "needs_improvement";

export interface ChapterRevisionRecord {
  id: string;
  milestone: RevisionMilestoneType;
  completed_at: string;
  duration_minutes?: number;
  notes?: string;
}

export interface ChapterTestRecord {
  id: string;
  test_id?: string;
  test_title: string;
  attempted_at: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
}

export interface Chapter {
  id: string;
  subject_id: string;
  student_id: string;
  title: string;
  chapter_number: number;
  subtopics?: string[];
  difficulty: Difficulty;
  estimated_hours: number;
  status: ChapterStatus;
  study_status?: StudyStatus;
  study_completed_at?: string;
  study_hours_spent?: number;
  revision_status: RevisionStatus;
  revision_history?: ChapterRevisionRecord[];
  test_status?: TestStatus;
  test_history?: ChapterTestRecord[];
  notes_count: number;
  nature?: ChapterNature;
  length_category?: ChapterLength;
  exam_importance?: ExamImportance;
  importance_notes?: string;
  practice_target?: string;
  is_custom?: boolean;
  official_source?: string;
  syllabus_version?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

// Module 1: AI Exam Target Planner Types
export interface ExamTargetPlan {
  id: string;
  student_id: string;
  exam_name: string;
  exam_date: string;
  course: string;
  remaining_days: number;
  pending_chapters: number;
  daily_study_target_hours: number;
  current_prep_percentage: number;
  weak_subjects: string[];
  strong_subjects: string[];
  subject_allocations: Array<{
    subject_name: string;
    allocated_hours: number;
    share_percentage: number;
    is_weak: boolean;
    reasoning: string;
    chapter_deadlines: Array<{
      chapter_title: string;
      deadline_date: string;
      nature: ChapterNature;
      estimated_hours: number;
    }>;
  }>;
  revision_schedule: Array<{
    date: string;
    subject_name: string;
    chapter_title: string;
    revision_type: "rapid_recap" | "deep_review" | "mock_marathon";
    focus: string;
  }>;
  mock_exam_dates: Array<{
    date: string;
    exam_name: string;
    subject_name: string;
    duration_minutes: number;
    purpose: string;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    category: "official_pattern" | "past_paper_observation" | "ai_recommendation";
    explanation: string;
  }>;
  created_at: string;
  updated_at: string;
}

// Module 4: Plan Validation & Error Detection
export interface PlanValidationError {
  id: string;
  severity: "error" | "warning";
  issue_type:
    | "unrealistic_duration"
    | "overlapping_sessions"
    | "insufficient_revision"
    | "missed_chapters"
    | "inadequate_numerical_practice"
    | "incorrect_exam_dates"
    | "missing_test_sessions"
    | "excessive_workload";
  title: string;
  what_is_wrong: string;
  why_is_it_a_problem: string;
  ai_recommendation: string;
  suggested_action: string;
  student_decision: "accepted" | "kept_existing" | "pending";
}

// Module 6: Smart Exam Practice Test Generator Types
export interface TestQuestion {
  id: string;
  type: "mcq" | "numerical" | "theory" | "case_study";
  prompt: string;
  context?: string;
  options?: string[]; // For MCQs
  correct_answer?: string; // For MCQs / numerical final value
  model_answer?: string; // Step-by-step solution / Key theory points
  explanation: string;
  marks: number;
  nature: ChapterNature;
}

export interface PracticeTest {
  id: string;
  student_id: string;
  title: string;
  course: string;
  subject_name: string;
  chapter_title?: string;
  test_type: "mcq" | "numerical" | "theory" | "case_study" | "full_mock";
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  questions: TestQuestion[];
  source_material_name?: string;
  created_at: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  user_answers: Record<string, string>; // question_id -> student answer
  completed_at: string;
  time_taken_seconds: number;
  analysis: {
    accuracy_percentage: number;
    weak_topics: string[];
    strong_topics: string[];
    teacher_advice: string;
  };
}

// Module 7: YouTube Teacher Recommendation Types
export interface TeacherProfile {
  id: string;
  name: string;
  channel_name: string;
  course_specialization: string[];
  subjects: string[];
  language: "Hindi" | "English" | "Hinglish";
  teaching_style: "slow_detailed" | "examples_first" | "visual" | "short_revision";
  rating: number;
  total_ratings: number;
  avatar_url?: string;
  bio: string;
}

export interface TeacherRating {
  teacher_id: string;
  student_id: string;
  useful: boolean;
  feedback?: string;
  rated_at: string;
}

// Module 9: Daily Reflection & Adjustment Types
export interface DailyAdjustment {
  id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  completed_tasks: string[];
  missed_tasks: string[];
  difficult_chapters: string[];
  needs_extra_revision: boolean;
  suggested_adjustments: Array<{
    id: string;
    action: string;
    reason: string;
    recommended_time_slot: string;
  }>;
  status: "applied" | "kept_existing" | "pending";
  created_at: string;
}

export interface UploadedDocument {
  id: string;
  student_id: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url?: string;
  document_type: DocumentType;
  extraction_status: ExtractionStatus;
  extracted_data?: {
    course?: string;
    subjects?: Array<{
      name: string;
      code?: string;
      chapters: Array<{
        title: string;
        chapter_number?: number;
        difficulty?: Difficulty;
        estimated_hours?: number;
      }>;
    }>;
    examinations?: Array<{
      subject_name: string;
      exam_name: string;
      exam_date: string;
      start_time?: string;
      end_time?: string;
    }>;
    confidence_score?: number;
    raw_summary?: string;
    notes?: string;
  };
  created_at: string;
}

export interface Examination {
  id: string;
  student_id: string;
  subject_id?: string;
  subject_name: string;
  exam_name: string;
  exam_date: string;
  start_time?: string;
  end_time?: string;
  room_location?: string;
  weightage_percentage?: number;
  preparation_level: "low" | "medium" | "high";
  notes?: string;
  created_at: string;
}

export interface Timetable {
  id: string;
  student_id: string;
  title: string;
  course?: string;
  start_date: string;
  end_date: string;
  daily_hours: number;
  is_active: boolean;
  preferences: {
    preferred_study_time: PreferredStudyTime;
    break_duration: number;
    weekly_holiday: string;
    preparation_level: ExamPreparationLevel;
  };
  created_at: string;
}

export interface StudySession {
  id: string;
  student_id: string;
  timetable_id: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  chapter_id?: string;
  chapter_title: string;
  title?: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  session_type: SessionType;
  status: SessionStatus;
  difficulty?: Difficulty;
  notes?: string;
  completed_at?: string;
  session_nature?: ChapterNature | string;
  is_locked?: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  reminder_time: string; // ISO string
  reminder_type: ReminderType;
  is_completed: boolean;
  related_entity_id?: string;
  created_at: string;
}

export interface StudentTask {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  subject_id?: string;
  subject_name?: string;
  due_date: string; // YYYY-MM-DD
  priority: "low" | "medium" | "high";
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface StudyProgress {
  id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  total_minutes_studied: number;
  chapters_completed_count: number;
  sessions_completed_count: number;
  consistency_streak_days: number;
  created_at: string;
}

export type VideoCategory =
  | "part_1"
  | "part_2"
  | "part_3"
  | "revision"
  | "practice"
  | "mock_test";

export interface SavedVideo {
  id: string;
  student_id: string;
  course?: string;
  subject_id?: string;
  subject_name: string;
  chapter_title?: string;
  category?: VideoCategory;
  youtube_video_id: string;
  title: string;
  channel_title: string;
  thumbnail_url: string;
  duration_seconds: number;
  progress_seconds: number;
  is_completed: boolean;
  is_favorite: boolean;
  last_watched_at?: string;
  created_at: string;
}

export interface Note {
  id: string;
  student_id: string;
  course?: string;
  subject_id: string;
  subject_name: string;
  chapter_id?: string;
  chapter_title?: string;
  title: string;
  content: string;
  tags: string[];
  attachment_urls?: string[];
  attachment_type?: "image" | "pdf" | "document" | "none";
  attachment_name?: string;
  extracted_ocr_text?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Admin Portal & Platform Governance Types
// ==========================================

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin";
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
}

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_course: string; // "all" or specific course e.g. "CA Intermediate"
  priority: AnnouncementPriority;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  author_email?: string;
}

export type AuditActionType =
  | "login"
  | "logout"
  | "student_status_change"
  | "course_created"
  | "course_updated"
  | "course_deleted"
  | "subject_created"
  | "subject_updated"
  | "subject_deleted"
  | "chapter_created"
  | "chapter_updated"
  | "chapter_deleted"
  | "video_created"
  | "video_updated"
  | "video_deleted"
  | "announcement_published"
  | "announcement_deleted"
  | "daily_adjustment_applied"
  | "roadmap_updated"
  | "settings_updated";

export interface AdminAuditLog {
  id: string;
  admin_email: string;
  action: AuditActionType;
  details: string;
  timestamp: string;
  target_entity?: string;
}

export interface PlatformSettings {
  platform_name: string;
  academic_year: string;
  maintenance_mode: boolean;
  ai_engine_enabled: boolean;
  allow_registrations: boolean;
  system_notice_banner: string;
  updated_at: string;
}

export interface CourseCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string; // "Professional", "Undergraduate", "School"
  total_subjects: number;
  is_active: boolean;
  description?: string;
  exam_body?: string;
  syllabus_version?: string;
  academic_session?: string;
}

export interface ExamReadinessAnalysis {
  overall_score: number; // 0 to 100
  grade: "Exemplary" | "Ready" | "Moderate Risk" | "Critical Risk";
  breakdown: {
    syllabus_completion_rate: number; // 0 - 100
    syllabus_weight: number; // e.g. 30%
    revision_completion_rate: number; // 0 - 100
    revision_weight: number; // e.g. 25%
    test_performance_rate: number; // 0 - 100
    test_performance_weight: number; // e.g. 25%
    test_coverage_rate: number; // 0 - 100
    test_coverage_weight: number; // e.g. 10%
    consistency_and_timeline_factor: number; // 0 - 100
    consistency_weight: number; // e.g. 10%
  };
  metrics: {
    total_chapters: number;
    completed_chapters: number;
    in_progress_chapters: number;
    not_started_chapters: number;
    total_planned_revisions: number;
    completed_revisions: number;
    total_tests_attempted: number;
    average_test_score: number;
    highest_test_score: number;
    lowest_test_score: number;
    tested_chapters_count: number;
  };
  subject_readiness: Array<{
    subject_id: string;
    subject_name: string;
    readiness_percentage: number;
    syllabus_covered: number;
    revision_rate: number;
    average_score: number;
    is_weak: boolean;
    status: "ready" | "needs_focus" | "at_risk";
  }>;
  risk_warnings: string[];
  recommendations: string[];
  formula_explanation: string;
}

export interface SupportTicket {
  id: string;
  student_id: string;
  student_email: string;
  subject: string;
  message: string;
  category: "curriculum" | "timetable" | "account" | "technical" | "exam_readiness";
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportChatMessage {
  id: string;
  sender: "student" | "assistant" | "system";
  text: string;
  suggested_actions?: Array<{ label: string; action_id: string; target_url?: string }>;
  timestamp: string;
  page_context?: string;
}
