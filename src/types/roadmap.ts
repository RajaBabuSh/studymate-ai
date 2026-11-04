import { ChapterNature, Difficulty, RevisionMilestoneType } from "./database";

export interface RevisionStrategyConfig {
  id: string;
  name: string;
  description: string;
  intervals: number[]; // e.g. [1, 7, 21] days from completion / previous revision
  isDefault: boolean;
}

export interface RevisionQueueItem {
  id: string;
  chapterId: string;
  chapterTitle: string;
  subjectId: string;
  subjectName: string;
  milestone: RevisionMilestoneType;
  dueDate: string; // YYYY-MM-DD
  isOverdue: boolean;
  daysOverdue: number;
  studyCompletedAt?: string;
  nature: ChapterNature;
  estimatedHours: number;
}

export interface TestQueueItem {
  id: string;
  title: string;
  testType: "chapter" | "subject" | "mock";
  chapterId?: string;
  chapterTitle?: string;
  subjectId: string;
  subjectName: string;
  dueDate: string; // YYYY-MM-DD
  status: "pending" | "completed" | "skipped";
  lastScore?: number;
  maxScore: number;
  percentage?: number;
  passed?: boolean;
  difficulty: Difficulty;
  weakTopics?: string[];
  recommendations?: string;
}

export interface DailyStudyTask {
  id: string;
  type: "study" | "revision" | "test" | "personal";
  title: string;
  subjectName: string;
  chapterId?: string;
  milestone?: RevisionMilestoneType;
  estimatedHours: number;
  isCompleted: boolean;
  completedAt?: string;
  nature?: ChapterNature;
  difficulty?: Difficulty;
}

export interface DailyStudyTarget {
  date: string; // YYYY-MM-DD
  tasks: DailyStudyTask[];
  totalEstimatedHours: number;
  completedTasksCount: number;
  totalTasksCount: number;
  completionPercentage: number;
}

export interface RoadmapPhase1 {
  startDate: string;
  targetDate: string;
  totalDays: number;
  totalHours: number;
  dailyHours: number;
  subjectDeadlines: Array<{
    subjectId: string;
    subjectName: string;
    deadlineDate: string;
    pendingChaptersCount: number;
    allocatedHours: number;
    isWeak: boolean;
  }>;
  chapterDeadlines: Array<{
    chapterId: string;
    title: string;
    subjectName: string;
    deadlineDate: string;
    nature: ChapterNature;
    difficulty: Difficulty;
    estimatedHours: number;
  }>;
}

export interface RoadmapPhase2 {
  startDate: string;
  targetDate: string;
  totalDays: number;
  totalHours: number;
  revision1Deadline: string;
  revision2Deadline: string;
  revision3Deadline: string;
  milestones: Array<{
    title: string;
    date: string;
    focus: string;
    type: "rapid_recap" | "deep_review" | "mock_marathon";
  }>;
}

export interface RoadmapPhase3 {
  startDate: string;
  targetDate: string;
  totalDays: number;
  chapterTestsCount: number;
  subjectTestsCount: number;
  mockExams: Array<{
    title: string;
    date: string;
    subjectName: string;
    durationMinutes: number;
    purpose: string;
  }>;
}

export interface RoadmapFeasibility {
  isRealistic: boolean;
  totalRequiredHours: number;
  totalAvailableHours: number;
  gapHours: number;
  recommendedDailyHours: number;
  recommendedExamDate?: string;
  warningMessage?: string;
  alternativeSuggestions: string[];
}

export interface CompleteRoadmapPlan {
  id: string;
  studentId: string;
  examName: string;
  targetExamDate: string;
  startDate: string;
  totalPreparationDays: number;
  dailyStudyHours: number;
  isSyllabusAuditVerified: boolean;
  auditIssuesCount: number;
  phase1: RoadmapPhase1;
  phase2: RoadmapPhase2;
  phase3: RoadmapPhase3;
  feasibility: RoadmapFeasibility;
  createdAt: string;
  updatedAt: string;
}

export interface DailyCheckInResponse {
  date: string;
  completedAllToday: boolean;
  uncompletedTaskIds: string[];
  foundDifficult: boolean;
  difficultySubject?: string;
  difficultyNotes?: string;
  needMoreTime: boolean;
  additionalHoursNeeded?: number;
  rescheduleRequested: boolean;
  studentNotes?: string;
  recordedAt: string;
}

export { DEFAULT_REVISION_STRATEGIES } from "@/lib/preparationCentres";
