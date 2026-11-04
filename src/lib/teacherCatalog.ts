import { TeacherProfile } from "@/types/database";

/**
 * Intelligent YouTube Teacher Recommendation Engine
 * Curated directory of verified top faculty and educators for CA, CS, Commerce, and School boards.
 */

export const TEACHER_PROFILES: TeacherProfile[] = [
  // --- CA Faculty ---
  {
    id: "t-ca-anand",
    name: "CA Anand Bhanggariya",
    channel_name: "Swapnil Patni's Classes",
    course_specialization: ["CA Foundation", "CA Intermediate"],
    subjects: ["Accounting", "Advanced Accounting"],
    language: "Hinglish",
    teaching_style: "examples_first",
    rating: 4.9,
    total_ratings: 1240,
    bio: "Renowned Accounts faculty known for conceptual clarity, diagrammatic ledger postings, and practical balance sheet presentations.",
  },
  {
    id: "t-ca-neeraj",
    name: "CA Neeraj Arora",
    channel_name: "CA Neeraj Arora / Edu91",
    course_specialization: ["CA Intermediate"],
    subjects: ["Auditing and Ethics", "Corporate and Other Laws"],
    language: "Hindi",
    teaching_style: "slow_detailed",
    rating: 4.8,
    total_ratings: 2180,
    bio: "Pioneer in Standards on Auditing (SAs) simplified memory techniques and statutory provisions breakdown.",
  },
  {
    id: "t-ca-pranav",
    name: "CA Pranav Popat",
    channel_name: "Unacademy CA Foundation",
    course_specialization: ["CA Foundation"],
    subjects: ["Quantitative Aptitude (Maths, LR & Stats)"],
    language: "Hinglish",
    teaching_style: "examples_first",
    rating: 4.9,
    total_ratings: 1890,
    bio: "First-attempt CA with engineering math shortcuts, calculator tricks, and step-by-step statistics problem-solving.",
  },
  {
    id: "t-ca-aaditya",
    name: "CA Aaditya Jain",
    channel_name: "CA Aaditya Jain",
    course_specialization: ["CA Intermediate", "CA Final"],
    subjects: ["Financial Management and Strategic Management", "Strategic Financial Management (SFM)"],
    language: "English",
    teaching_style: "visual",
    rating: 4.9,
    total_ratings: 3120,
    bio: "Known as the Finance Guru, specializing in capital budgeting, portfolio management, and stock market financial valuation.",
  },
  {
    id: "t-ca-bhanwar",
    name: "CA Bhanwar Borana",
    channel_name: "BB Virtuals",
    course_specialization: ["CA Intermediate", "CA Final"],
    subjects: ["Taxation (Direct & Indirect Tax)", "Direct Tax Laws"],
    language: "Hinglish",
    teaching_style: "short_revision",
    rating: 4.95,
    total_ratings: 4500,
    bio: "Famous for 'Compact' summary charts, mnemonic stories for income tax sections, and rapid revision marathons.",
  },

  // --- CS Faculty ---
  {
    id: "t-cs-vohra",
    name: "CS Amit Vohra",
    channel_name: "Amit Vohra Law Classes",
    course_specialization: ["CS Executive", "CS Professional"],
    subjects: ["Company Law and Practice", "Jurisprudence, Interpretation and General Laws"],
    language: "Hinglish",
    teaching_style: "slow_detailed",
    rating: 4.85,
    total_ratings: 1650,
    bio: "Premier legal scholar dissecting sections, judicial precedents, and landmark High Court / NCLT rulings for CS aspirants.",
  },
  {
    id: "t-cs-unique",
    name: "Unique Academy for Commerce",
    channel_name: "Unique Academy for Commerce",
    course_specialization: ["CS Executive", "CS Professional"],
    subjects: ["Setting Up of Business, Industrial and Labour Laws", "Capital Market and Securities Laws"],
    language: "Hinglish",
    teaching_style: "visual",
    rating: 4.8,
    total_ratings: 2780,
    bio: "Dedicated team for Company Secretary examinations offering live past-exam marathons and drafting workshops.",
  },

  // --- Commerce & Undergraduate Faculty ---
  {
    id: "t-sunil-panda",
    name: "Sunil Panda",
    channel_name: "Sunil Panda - The Educator",
    course_specialization: ["Class 12", "B.Com", "BBA"],
    subjects: ["Accounting", "Business Studies", "Economics"],
    language: "Hindi",
    teaching_style: "short_revision",
    rating: 4.9,
    total_ratings: 5400,
    bio: "Master educator for Board and Undergraduate commerce exams, known for last-mile revision and sample paper walkthroughs.",
  },
  {
    id: "t-rajat-arora",
    name: "Rajat Arora",
    channel_name: "Rajat Arora",
    course_specialization: ["Class 11", "Class 12", "B.Com"],
    subjects: ["Economics", "Accountancy", "Business Studies"],
    language: "Hinglish",
    teaching_style: "visual",
    rating: 4.92,
    total_ratings: 6200,
    bio: "Interactive, clear, and relatable lectures simplifying complex economic theories and financial statements.",
  },
];

/**
 * Filter teachers based on student preferences
 */
export function recommendTeachers(params: {
  course: string;
  subjectName?: string;
  language?: "Hindi" | "English" | "Hinglish" | "all";
  teachingStyle?: TeacherProfile["teaching_style"] | "all";
}): TeacherProfile[] {
  return TEACHER_PROFILES.filter((teacher) => {
    // Match course
    const courseMatch =
      teacher.course_specialization.some((c) =>
        params.course.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(params.course.toLowerCase())
      ) || params.course.toLowerCase().includes("other");

    // Match subject if provided
    let subjectMatch = true;
    if (params.subjectName && params.subjectName !== "all") {
      subjectMatch = teacher.subjects.some((s) =>
        s.toLowerCase().includes(params.subjectName!.toLowerCase()) ||
        params.subjectName!.toLowerCase().includes(s.toLowerCase())
      );
    }

    // Match language
    let langMatch = true;
    if (params.language && params.language !== "all") {
      langMatch = teacher.language.toLowerCase() === params.language.toLowerCase();
    }

    // Match style
    let styleMatch = true;
    if (params.teachingStyle && params.teachingStyle !== "all") {
      styleMatch = teacher.teaching_style === params.teachingStyle;
    }

    return (courseMatch || subjectMatch) && langMatch && styleMatch;
  });
}
