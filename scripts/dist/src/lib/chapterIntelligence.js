/**
 * Chapter Intelligence & Classification Engine
 * Analyzes subject domain and chapter title to determine pedagogical strategy,
 * exam importance, and cognitive workload.
 */
// Heuristics for Numerical/Practical topics
const NUMERICAL_KEYWORDS = [
    "accounting", "tax", "gst", "cost", "costing", "budget", "ratio", "valuation",
    "depreciation", "amalgamation", "reconstruction", "consolidation", "capital",
    "leverage", "working capital", "variance", "arithmetic", "indices", "annuity",
    "equation", "calculus", "probability", "statistics", "mathematics", "formula",
    "cash flow", "balance sheet", "journal", "ledger", "inventory", "bills of exchange",
    "financial management", "interest", "forex", "derivative", "hedging"
];
// Heuristics for Pure Theory / Statutory topics
const THEORY_KEYWORDS = [
    "act", "law", "statute", "constitution", "jurisprudence", "interpretation",
    "governance", "ethics", "regulatory", "preliminary", "incorporation", "prospectus",
    "deposit", "dividend", "director", "board", "meeting", "penalties", "audit standard",
    "documentation", "evidence", "opinion", "reporting", "economic theory", "demand",
    "supply", "macroeconomics", "policy", "treaty", "fema", "sebi", "arbitration",
    "management", "business studies", "organization", "marketing", "strategy"
];
// High-importance / Frequently tested topics across CA, CS, Commerce, & Board exams
const HIGH_IMPORTANCE_PATTERNS = [
    {
        pattern: /amalgamation|reconstruction|consolidation/i,
        rationale: "Consistently tested as a 14-16 mark compulsory question in professional accounting papers (Past 8 ICAI/ICSI attempts).",
    },
    {
        pattern: /pgbp|profits & gains|capital gains|head of income/i,
        rationale: "Core direct tax section carrying 18-22 marks in computation of total income.",
    },
    {
        pattern: /input tax credit|itc|supply under gst/i,
        rationale: "Fundamental GST practical mechanism; minimum 10-14 marks in indirect taxation.",
    },
    {
        pattern: /standard costing|variance|marginal costing|cvp/i,
        rationale: "Key decision-making modules in Costing, accounting for 20%+ of past exam weightage.",
    },
    {
        pattern: /accounting standards|as \d+|ind as/i,
        rationale: "Mandatory question 1 across financial reporting examinations (16-20 marks guaranteed).",
    },
    {
        pattern: /directors|board meeting|general meeting|appointment/i,
        rationale: "Heavyweight company law chapter; averages 15-18 marks across corporate law papers.",
    },
    {
        pattern: /capital budgeting|wacc|cost of capital/i,
        rationale: "Flagship FM concept; tested in every examination sitting for 10-15 marks.",
    },
    {
        pattern: /audit report|sa \d+|risk assessment/i,
        rationale: "Core Standards on Auditing (SAs) carrying compulsory application-based questions.",
    },
    {
        pattern: /partnership|company accounts|shares/i,
        rationale: "Fundamental accounting framework; recurring high-mark comprehensive problem.",
    },
];
/**
 * Detect chapter nature: numerical, theory, practical, or mixed
 */
export function detectChapterNature(subjectName, chapterTitle) {
    const combined = `${subjectName} ${chapterTitle}`.toLowerCase();
    const isNumerical = NUMERICAL_KEYWORDS.some((kw) => combined.includes(kw));
    const isTheory = THEORY_KEYWORDS.some((kw) => combined.includes(kw));
    if (isNumerical && isTheory) {
        return "mixed";
    }
    if (isNumerical) {
        // Check if it's purely practical or numerical
        if (combined.includes("tax") || combined.includes("audit") || combined.includes("cost sheet")) {
            return "practical";
        }
        return "numerical";
    }
    if (isTheory) {
        return "theory";
    }
    // Fallback heuristic based on subject
    if (/math|account|stat|cost|finance|tax/i.test(subjectName)) {
        return "numerical";
    }
    if (/law|legal|jurisprudence|english|history|polity|economic|management|business/i.test(subjectName)) {
        return "theory";
    }
    return "mixed";
}
/**
 * Classify chapter length based on complexity and estimated hours
 */
export function classifyChapterLength(chapterTitle, estimatedHours) {
    if (estimatedHours >= 6.5)
        return "long";
    if (estimatedHours <= 3.0)
        return "short";
    // Check title patterns
    if (/standards|amalgamation|consolidation|pgbp|itc|variance|costing|contract/i.test(chapterTitle)) {
        return "long";
    }
    if (/intro|overview|basic|preliminary|framework/i.test(chapterTitle)) {
        return "short";
    }
    return "medium";
}
/**
 * Determine verified examination importance and rationale
 */
export function evaluateExamImportance(subjectName, chapterTitle) {
    const text = `${subjectName} ${chapterTitle}`;
    for (const item of HIGH_IMPORTANCE_PATTERNS) {
        if (item.pattern.test(text)) {
            return {
                importance: "high",
                rationale: item.rationale,
            };
        }
    }
    if (/important|core|advanced|reconciliation|depreciation|dividend/i.test(text)) {
        return {
            importance: "medium",
            rationale: "Frequently appears in secondary question slots and short notes (6-8 marks weightage).",
        };
    }
    return {
        importance: "normal",
        rationale: "Standard syllabus chapter; tested in periodic rotation or MCQ sections (4-6 marks).",
    };
}
/**
 * Generate comprehensive pedagogical strategy for any chapter
 */
export function getChapterStrategy(subjectName, chapterTitle, estimatedHours = 4) {
    const nature = detectChapterNature(subjectName, chapterTitle);
    const length = classifyChapterLength(chapterTitle, estimatedHours);
    const { importance, rationale } = evaluateExamImportance(subjectName, chapterTitle);
    let steps = [];
    let alertSlot = "any";
    let targetMcqs = 15;
    let targetNumericals = 0;
    switch (nature) {
        case "numerical":
            alertSlot = "morning_peak"; // Peak cognitive alertness
            targetNumericals = length === "long" ? 12 : length === "medium" ? 8 : 5;
            targetMcqs = 20;
            steps = [
                "Phase 1: Concept Grasping & Master Formula Sheet construction (30 mins)",
                "Phase 2: Walk through 3 step-by-step solved institutional textbook illustrations (45 mins)",
                "Phase 3: Deep Numerical Drill – Solve 5-8 unassisted problems on paper without peeking (60-90 mins)",
                "Phase 4: Timed Past-Paper Question Challenge – Complete 1 comprehensive exam problem in 25 mins",
                "Phase 5: Error Log Documentation – Record calculation mistakes & edge adjustments in revision notebook",
            ];
            break;
        case "theory":
            alertSlot = "afternoon";
            targetNumericals = 0;
            targetMcqs = 30;
            steps = [
                "Phase 1: First Reading – Structural overview, definitions, and statutory sections (45 mins)",
                "Phase 2: Keyword Extraction – Highlight landmark case laws, sub-sections, and exceptions (30 mins)",
                "Phase 3: Active Recall – Close book and recite key provisions / draft 1-page mindmap (30 mins)",
                "Phase 4: Case Study Application – Write structured answer following the Fact-Law-Conclusion model",
                "Phase 5: Spaced Repetition Flashcards – Review section numbers and threshold limits",
            ];
            break;
        case "practical":
            alertSlot = "morning_peak";
            targetNumericals = length === "long" ? 8 : 5;
            targetMcqs = 25;
            steps = [
                "Phase 1: Statutory Provision Review – Understand the governing legal framework & computational rules",
                "Phase 2: Format Mastery – Memorize standard presentation templates (e.g. Balance Sheet, Tax Computation)",
                "Phase 3: Integrated Case Problem Solving – Work through mixed numerical-cum-legal scenario questions",
                "Phase 4: Speed Accuracy Drill – Timed working note calculations with standard rounding rules",
            ];
            break;
        case "mixed":
        default:
            alertSlot = "morning_peak";
            targetNumericals = 6;
            targetMcqs = 20;
            steps = [
                "Phase 1: Theory foundation & fundamental principles reading (40 mins)",
                "Phase 2: Immediate numerical application of learned theory (50 mins)",
                "Phase 3: Objective & MCQ practice for rapid rule reinforcement (20 mins)",
                "Phase 4: Synthesis & Summary notes compilation (20 mins)",
            ];
            break;
    }
    // Calculate recommended study hours based on length and importance
    let recHours = estimatedHours;
    if (length === "long")
        recHours = Math.max(recHours, 7);
    else if (length === "medium")
        recHours = Math.max(recHours, 4.5);
    else
        recHours = Math.max(recHours, 2.5);
    if (importance === "high")
        recHours += 1.5;
    return {
        nature,
        length,
        importance,
        importance_rationale: rationale,
        recommended_hours: recHours,
        practice_target_mcqs: targetMcqs,
        practice_target_numericals: targetNumericals,
        strategy_steps: steps,
        alert_time_slot: alertSlot,
    };
}
