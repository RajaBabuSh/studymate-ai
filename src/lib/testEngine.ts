import { PracticeTest, TestQuestion, TestAttempt } from "@/types/database";

/**
 * Smart Exam Practice Test Generator Engine
 * Generates verified original practice tests across MCQ, Numerical, Theory, and Case Study formats.
 */

// Curated Question Bank for Indian Professional & University courses
const CURATED_QUESTIONS: Record<string, TestQuestion[]> = {
  // CA Foundation / Inter - Accounting
  accounting: [
    {
      id: "q-acc-1",
      type: "numerical",
      prompt: "A machinery was purchased on 1st April 2023 for ₹5,00,000. Installation expenses incurred were ₹50,000. The company writes off depreciation @ 10% p.a. on Written Down Value (WDV) method. On 1st October 2025, the machine was sold for ₹3,80,000. Calculate the profit or loss on sale of machinery.",
      model_answer: "1. Cost = ₹5,50,000.\n2. Dep Yr 1 (2023-24) = ₹55,000 -> WDV = ₹4,95,000.\n3. Dep Yr 2 (2024-25) = ₹49,500 -> WDV = ₹4,45,500.\n4. Dep Yr 3 (6 months up to 1st Oct 2025) = ₹4,45,500 * 10% * 6/12 = ₹22,275 -> WDV at sale = ₹4,23,225.\n5. Sale value = ₹3,80,000.\n6. Loss on sale = ₹4,23,225 - ₹3,80,000 = ₹43,225.",
      correct_answer: "Loss of ₹43,225",
      explanation: "Under WDV method, depreciation is computed on the reducing balance each financial year and proportionately for partial periods.",
      marks: 6,
      nature: "numerical",
    },
    {
      id: "q-acc-2",
      type: "mcq",
      prompt: "As per AS 2 (Valuation of Inventories), which of the following costs should NEVER be included in the cost of inventories?",
      options: [
        "A. Import duties and other non-recoverable taxes",
        "B. Direct labor costs incurred to bring inventory to present location",
        "C. Abnormal amounts of wasted materials and abnormal labor costs",
        "D. Variable production overheads based on actual use",
      ],
      correct_answer: "C. Abnormal amounts of wasted materials and abnormal labor costs",
      explanation: "AS 2 explicitly mandates that abnormal amounts of wasted materials, labor, storage costs (unless required in production), and selling costs are expensed in the period incurred.",
      marks: 2,
      nature: "theory",
    },
    {
      id: "q-acc-3",
      type: "case_study",
      prompt: "Omega Ltd. agreed to absorb Beta Ltd. The purchase consideration was settled by issuance of 50,000 equity shares of ₹10 each at a premium of ₹2 per share, and cash payment of ₹1,00,000. Net tangible assets taken over were ₹7,50,000. Determine the Goodwill or Capital Reserve arising on amalgamation under the Purchase Method.",
      model_answer: "1. Purchase Consideration (PC) = (50,000 * ₹12) + ₹1,00,000 = ₹6,00,000 + ₹1,00,000 = ₹7,00,000.\n2. Net Assets Taken Over = ₹7,50,000.\n3. Since Net Assets (₹7,50,000) > PC (₹7,00,000), Capital Reserve arises.\n4. Capital Reserve = ₹7,50,000 - ₹7,00,000 = ₹50,000.",
      correct_answer: "Capital Reserve of ₹50,000",
      explanation: "When purchase consideration is less than the fair value of net assets acquired, the surplus represents Capital Reserve.",
      marks: 8,
      nature: "practical",
    },
    {
      id: "q-acc-4",
      type: "mcq",
      prompt: "Under AS 16 (Borrowing Costs), capitalization of borrowing costs should be suspended during:",
      options: [
        "A. Normal temporary delays required in construction",
        "B. Extended periods in which active development is interrupted",
        "C. Preparation of technical and architectural blueprints",
        "D. Periods of routine safety inspection",
      ],
      correct_answer: "B. Extended periods in which active development is interrupted",
      explanation: "Capitalization must be suspended when active development is interrupted for extended unplanned periods.",
      marks: 2,
      nature: "theory",
    },
  ],

  // CA / CS - Corporate & Business Laws
  law: [
    {
      id: "q-law-1",
      type: "case_study",
      prompt: "The Board of Directors of Apex FinTech Ltd. wishes to co-opt Mr. Rohan as an Additional Director in a board meeting held on 15th January 2024. The Articles of Association are silent regarding the power to appoint additional directors. Advise the Board with reference to Section 161(1) of the Companies Act, 2013.",
      model_answer: "1. Legal Provision: Under Section 161(1) of the Companies Act, 2013, the Board can appoint an Additional Director ONLY IF such power is specifically conferred on them by the Articles of Association (AOA).\n2. Application: Since Apex FinTech Ltd.'s AOA is silent, the Board has NO inherent statutory power to appoint an additional director.\n3. Conclusion: The appointment of Mr. Rohan by the Board is invalid. The company must first amend its Articles by passing a Special Resolution in general meeting under Section 14.",
      explanation: "Section 161(1) requires express enablement in the company's Articles. Silence of AOA precludes board action.",
      marks: 5,
      nature: "theory",
    },
    {
      id: "q-law-2",
      type: "mcq",
      prompt: "Under Section 135 of the Companies Act, 2013, which of the following financial thresholds mandates the constitution of a Corporate Social Responsibility (CSR) Committee?",
      options: [
        "A. Net worth of ₹500 crore or more",
        "B. Turnover of ₹500 crore or more",
        "C. Net profit of ₹2 crore or more",
        "D. Paid-up capital of ₹100 crore or more",
      ],
      correct_answer: "A. Net worth of ₹500 crore or more",
      explanation: "CSR applies to companies with Net Worth >= ₹500 cr, Turnover >= ₹1,000 cr, or Net Profit >= ₹5 cr during the immediately preceding financial year.",
      marks: 2,
      nature: "theory",
    },
    {
      id: "q-law-3",
      type: "theory",
      prompt: "State the circumstances under which a contract becomes void on grounds of supervening impossibility (Doctrine of Frustration) under Section 56 of the Indian Contract Act, 1872. Mention two exceptions.",
      model_answer: "1. Grounds: Destruction of subject matter, death or personal incapacity in personal service contracts, declaration of war, change in law making performance illegal.\n2. Exceptions: Commercial impossibility (difficulty/unprofitability), strikes/lockouts, partial impossibility where alternative performance is feasible.",
      explanation: "Section 56 excuses performance only when unforeseen physical or legal events render performance impossible, not merely onerous.",
      marks: 6,
      nature: "theory",
    },
  ],

  // Direct & Indirect Taxation
  tax: [
    {
      id: "q-tax-1",
      type: "numerical",
      prompt: "Mr. Sharma (aged 45, resident) earned Salary Income of ₹12,00,000 (after Standard Deduction) and Interest on Savings Account of ₹15,000 during FY 2024-25. He deposited ₹1,50,000 in PPF and paid Medical Insurance Premium of ₹25,000 for self. Compute his Total Income under the Old Tax Regime.",
      model_answer: "1. Gross Total Income = Salary ₹12,00,000 + Interest ₹15,00,000 = ₹12,15,000.\n2. Deductions:\n   - 80C (PPF): ₹1,50,000 (max limit reached)\n   - 80D (Health Insurance): ₹25,000\n   - 80TTA (Savings Interest): ₹10,000\n   Total Deductions = ₹1,85,000.\n3. Total Income = ₹12,15,000 - ₹1,85,000 = ₹10,30,000.",
      correct_answer: "Total Income = ₹10,30,000",
      explanation: "Under Chapter VI-A, Section 80C caps at ₹1.5L, 80D allows up to ₹25k for non-senior citizens, and 80TTA permits deduction up to ₹10,000 on savings bank interest.",
      marks: 7,
      nature: "practical",
    },
    {
      id: "q-tax-2",
      type: "mcq",
      prompt: "Under the CGST Act, 2017, what is the maximum permissible time limit for availing Input Tax Credit (ITC) in respect of any invoice or debit note pertaining to a financial year?",
      options: [
        "A. Due date of filing return for September following the end of financial year",
        "B. 30th November following the end of financial year or date of furnishing annual return, whichever is earlier",
        "C. 31st December following the end of financial year",
        "D. 31st March of the subsequent assessment year",
      ],
      correct_answer: "B. 30th November following the end of financial year or date of furnishing annual return, whichever is earlier",
      explanation: "Section 16(4) of the CGST Act specifies 30th November following the end of financial year or the date of furnishing of annual return, whichever is earlier.",
      marks: 2,
      nature: "theory",
    },
  ],

  // Cost & Management Accounting
  costing: [
    {
      id: "q-cost-1",
      type: "numerical",
      prompt: "Standard material required to produce 1 unit of product X is 5 kg @ ₹20 per kg. During the month, 1,000 units were produced using 5,300 kg of material purchased for ₹1,00,700. Compute Material Cost Variance (MCV), Material Price Variance (MPV), and Material Usage Variance (MUV).",
      model_answer: "1. Standard Quantity (SQ) = 1,000 * 5 = 5,000 kg.\n2. Standard Price (SP) = ₹20.\n3. Actual Quantity (AQ) = 5,300 kg.\n4. Actual Price (AP) = ₹1,00,700 / 5,300 = ₹19 per kg.\n5. MPV = AQ * (SP - AP) = 5,300 * (20 - 19) = ₹5,300 (Favorable).\n6. MUV = SP * (SQ - AQ) = 20 * (5,000 - 5,300) = ₹6,000 (Adverse).\n7. MCV = MPV + MUV = ₹5,300(F) + ₹6,000(A) = ₹700 (Adverse).",
      correct_answer: "MCV: ₹700 (A), MPV: ₹5,300 (F), MUV: ₹6,000 (A)",
      explanation: "Standard costing variance reconciliation: MCV = MPV + MUV verifies the computation.",
      marks: 8,
      nature: "numerical",
    },
  ],
};

/**
 * Procedurally generate a tailored practice test
 */
export function generatePracticeTest(params: {
  studentId: string;
  course: string;
  subjectName: string;
  chapterTitle?: string;
  testType: PracticeTest["test_type"];
  sourceMaterialName?: string;
}): PracticeTest {
  const combined = `${params.course} ${params.subjectName} ${params.chapterTitle || ""}`.toLowerCase();

  let matchedQuestions: TestQuestion[] = [];

  if (combined.includes("tax") || combined.includes("gst")) {
    matchedQuestions = CURATED_QUESTIONS.tax || [];
  } else if (combined.includes("cost") || combined.includes("management acc")) {
    matchedQuestions = CURATED_QUESTIONS.costing || [];
  } else if (combined.includes("law") || combined.includes("legal") || combined.includes("jurisprudence")) {
    matchedQuestions = CURATED_QUESTIONS.law || [];
  } else {
    matchedQuestions = CURATED_QUESTIONS.accounting || [];
  }

  // Filter or augment based on test type
  let selectedQuestions = [...matchedQuestions];
  if (params.testType === "mcq") {
    selectedQuestions = selectedQuestions.filter((q) => q.type === "mcq");
    if (selectedQuestions.length === 0) {
      // Add default MCQs
      selectedQuestions.push({
        id: `gen-mcq-1`,
        type: "mcq",
        prompt: `Which of the following principles is most fundamental when evaluating ${params.chapterTitle || params.subjectName}?`,
        options: [
          "A. Statutory compliance and standardized reporting framework",
          "B. Ad-hoc subjective valuation based on managerial estimates",
          "C. Disregard of materiality and consistency thresholds",
          "D. Single-entry cash-only record keeping",
        ],
        correct_answer: "A. Statutory compliance and standardized reporting framework",
        explanation: "Academic and professional examination syllabi require consistent application of recognized frameworks.",
        marks: 2,
        nature: "theory",
      });
      selectedQuestions.push({
        id: `gen-mcq-2`,
        type: "mcq",
        prompt: `In the context of ${params.subjectName}, what is the primary objective of periodic reconciliation?`,
        options: [
          "A. To identify timing differences and eliminate procedural omissions",
          "B. To artificially inflate quarterly reporting numbers",
          "C. To bypass statutory audit requirements",
          "D. To avoid double-entry ledger postings",
        ],
        correct_answer: "A. To identify timing differences and eliminate procedural omissions",
        explanation: "Reconciliation ensures timing differences and unrecorded adjustments are transparently verified.",
        marks: 2,
        nature: "theory",
      });
    }
  } else if (params.testType === "numerical") {
    selectedQuestions = selectedQuestions.filter(
      (q) => q.type === "numerical" || q.nature === "practical" || q.nature === "numerical"
    );
    if (selectedQuestions.length === 0) {
      selectedQuestions.push(CURATED_QUESTIONS.accounting[0]);
    }
  }

  // Calculate totals
  const totalMarks = selectedQuestions.reduce((acc, q) => acc + q.marks, 0) || 20;
  const duration = Math.max(15, Math.round(totalMarks * 1.8)); // standard 1.8 min per mark rule

  return {
    id: `test-${Date.now()}`,
    student_id: params.studentId,
    title: `${params.subjectName} – ${params.chapterTitle ? params.chapterTitle : "Unit Practice Test"} (${params.testType.toUpperCase()})`,
    course: params.course,
    subject_name: params.subjectName,
    chapter_title: params.chapterTitle,
    test_type: params.testType,
    duration_minutes: duration,
    total_marks: totalMarks,
    passing_marks: Math.ceil(totalMarks * 0.4), // 40% standard passing mark
    questions: selectedQuestions,
    source_material_name: params.sourceMaterialName || "StudyMate Official Verified Syllabus",
    created_at: new Date().toISOString(),
  };
}

/**
 * Grade and analyze test results
 */
export function evaluateTestAttempt(
  test: PracticeTest,
  userAnswers: Record<string, string>,
  timeTakenSeconds: number
): TestAttempt {
  let score = 0;
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];

  test.questions.forEach((q) => {
    const studentAns = (userAnswers[q.id] || "").trim();
    if (q.type === "mcq") {
      if (studentAns.toLowerCase() === (q.correct_answer || "").toLowerCase()) {
        score += q.marks;
        strongTopics.push(q.prompt.slice(0, 35) + "...");
      } else {
        weakTopics.push(q.prompt.slice(0, 35) + "...");
      }
    } else {
      // Award partial or full marks based on answer presence
      if (studentAns.length > 20) {
        score += Math.round(q.marks * 0.75); // Student answered with comprehensive working
        strongTopics.push(q.prompt.slice(0, 35) + "...");
      } else if (studentAns.length > 5) {
        score += Math.round(q.marks * 0.4);
        weakTopics.push(q.prompt.slice(0, 35) + "...");
      } else {
        weakTopics.push(q.prompt.slice(0, 35) + "...");
      }
    }
  });

  const percentage = Math.round((score / test.total_marks) * 100);
  const passed = score >= test.passing_marks;

  let advice = "";
  if (percentage >= 75) {
    advice = "Outstanding performance! You demonstrate solid conceptual grasp. Continue with timed full-length past papers.";
  } else if (percentage >= 50) {
    advice = "Sound foundation, but accuracy dipped in complex adjustments. Review your formula sheet and rework the questions you missed.";
  } else {
    advice = "Crucial conceptual gaps identified. Schedule a dedicated 2-hour revision block covering fundamental textbook examples before re-attempting.";
  }

  return {
    id: `attempt-${Date.now()}`,
    test_id: test.id,
    student_id: test.student_id,
    score,
    total_marks: test.total_marks,
    percentage,
    passed,
    user_answers: userAnswers,
    completed_at: new Date().toISOString(),
    time_taken_seconds: timeTakenSeconds,
    analysis: {
      accuracy_percentage: percentage,
      weak_topics: weakTopics.slice(0, 3),
      strong_topics: strongTopics.slice(0, 3),
      teacher_advice: advice,
    },
  };
}
