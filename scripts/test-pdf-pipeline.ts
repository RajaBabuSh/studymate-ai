import { parseAcademicDocument } from "@/lib/documentParser";
import { TimetableEngine } from "@/lib/timetableEngine";
import { Chapter, Subject, Examination } from "@/types/database";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName} ${details ? "- " + details : ""}`);
    failed++;
  }
}

function createPdfBuffer(lines: string[]): Buffer {
  const stream = "BT /F1 12 Tf 50 750 Td (" + lines.join(") Tj T* (") + ") Tj ET";
  return Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \n0000000293 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF`
  );
}

export async function runPdfPipelineTests() {
  console.log("==========================================================");
  console.log("STUDYMATE AI - REAL PDF EXTRACTION & TIMETABLE TEST SUITE");
  console.log("==========================================================\n");

  // -------------------------------------------------------------
  // TEST 1: CA Intermediate Date Sheet PDF Extraction
  // -------------------------------------------------------------
  console.log("--- TEST 1: CA Intermediate Date Sheet PDF ---");
  const caPdf = createPdfBuffer([
    "THE INSTITUTE OF CHARTERED ACCOUNTANTS OF INDIA",
    "EXAMINATION TIMETABLE - NOVEMBER 2026",
    "INTERMEDIATE EXAMINATION (NEW SCHEME)",
    "Paper - 1: Advanced Accounting - 03-11-2026 - 2:00 PM to 5:00 PM",
    "Paper - 2: Corporate and Other Laws - 05-11-2026 - 2:00 PM to 5:00 PM",
    "Paper - 3: Direct and Indirect Taxation - 07-11-2026 - 2:00 PM to 5:00 PM",
    "Paper - 4: Cost and Management Accounting - 09-11-2026 - 2:00 PM to 5:00 PM",
  ]);

  const caResult = await parseAcademicDocument(caPdf, {
    fileName: "ICAI_CA_Inter_Nov2026_Datesheet.pdf",
    documentType: "datesheet",
    studentCourse: "ca-inter",
    targetExamDate: "2026-11-03",
  });

  assert(caResult.success, "CA Inter Date Sheet successfully parsed");
  assert(caResult.extractedSubjects.length === 4, "Extracted exactly 4 CA Intermediate subjects", `Found ${caResult.extractedSubjects.length}`);

  const caSubNames = caResult.extractedSubjects.map((s) => s.name);
  assert(caSubNames.includes("Advanced Accounting"), "Extracted 'Advanced Accounting'");
  assert(caSubNames.includes("Corporate and Other Laws") || caSubNames.some(s => s.toLowerCase().includes("corporate")), "Extracted 'Corporate and Other Laws'");
  assert(caSubNames.includes("Direct and Indirect Taxation") || caSubNames.some(s => s.toLowerCase().includes("tax")), "Extracted 'Taxation'");
  assert(caSubNames.includes("Cost and Management Accounting") || caSubNames.some(s => s.toLowerCase().includes("cost")), "Extracted 'Cost Accounting'");

  // Verify NO Computer Science subjects entered
  assert(!caSubNames.includes("Data Structures & Algorithms"), "Verified: NO 'Data Structures & Algorithms' in CA Inter");
  assert(!caSubNames.includes("Operating Systems"), "Verified: NO 'Operating Systems' in CA Inter");
  assert(!caSubNames.includes("Discrete Mathematics & Probability"), "Verified: NO 'Discrete Mathematics' in CA Inter");

  // Verify individual exam dates
  const advAccExam = caResult.extractedExaminations.find((e) => e.subject_name.toLowerCase().includes("accounting"));
  assert(Boolean(advAccExam && advAccExam.exam_date === "2026-11-03"), "Extracted correct exam date (2026-11-03) for Advanced Accounting", `Got ${advAccExam?.exam_date}`);

  // -------------------------------------------------------------
  // TEST 2: CS Executive Date Sheet PDF Extraction
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: CS Executive Date Sheet PDF ---");
  const csPdf = createPdfBuffer([
    "THE INSTITUTE OF COMPANY SECRETARIES OF INDIA",
    "EXAMINATION TIME TABLE - DECEMBER 2026",
    "EXECUTIVE PROGRAMME (2022 SYLLABUS)",
    "21-12-2026: Jurisprudence, Interpretation and General Laws (Paper 1)",
    "22-12-2026: Company Law and Practice (Paper 2)",
    "23-12-2026: Setting Up of Business, Industrial and Labour Laws (Paper 3)",
    "24-12-2026: Corporate Accounting and Financial Management (Paper 4)",
  ]);

  const csResult = await parseAcademicDocument(csPdf, {
    fileName: "ICSI_CS_Exec_Dec2026.pdf",
    documentType: "datesheet",
    studentCourse: "cs-exec",
    targetExamDate: "2026-12-21",
  });

  assert(csResult.success, "CS Executive Date Sheet successfully parsed");
  const csSubNames = csResult.extractedSubjects.map((s) => s.name);
  assert(csSubNames.some((s) => s.includes("Jurisprudence") || s.includes("General Laws")), "Extracted Jurisprudence Paper 1");
  assert(csSubNames.some((s) => s.includes("Company Law")), "Extracted Company Law Paper 2");
  assert(!csSubNames.includes("Data Structures & Algorithms"), "Verified: NO engineering subjects in CS Executive");

  // -------------------------------------------------------------
  // TEST 3: CBSE Class 12 Date Sheet PDF Extraction
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: CBSE Class 12 Date Sheet PDF ---");
  const cbsePdf = createPdfBuffer([
    "CENTRAL BOARD OF SECONDARY EDUCATION",
    "SENIOR SCHOOL CERTIFICATE EXAMINATION (CLASS XII) 2027",
    "15-02-2027: Physics (Subject Code: 042) - 10:30 AM to 01:30 PM",
    "20-02-2027: Chemistry (Subject Code: 043) - 10:30 AM to 01:30 PM",
    "27-02-2027: Mathematics (Subject Code: 041) - 10:30 AM to 01:30 PM",
  ]);

  const cbseResult = await parseAcademicDocument(cbsePdf, {
    fileName: "CBSE_Class12_Datesheet_2027.pdf",
    documentType: "datesheet",
    studentCourse: "class-12",
    targetExamDate: "2027-02-15",
  });

  assert(cbseResult.success, "CBSE Class 12 Date Sheet successfully parsed");
  const cbseSubNames = cbseResult.extractedSubjects.map((s) => s.name);
  assert(cbseSubNames.includes("Physics"), "Extracted Physics");
  assert(cbseSubNames.includes("Chemistry"), "Extracted Chemistry");
  assert(cbseSubNames.includes("Mathematics"), "Extracted Mathematics");
  assert(!cbseSubNames.includes("Data Structures & Algorithms"), "Verified: NO engineering subjects in Class 12 CBSE");

  // -------------------------------------------------------------
  // TEST 4: Date Conflict Warning Detection
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Date Conflict Warning Detection ---");
  const conflictPdf = createPdfBuffer([
    "UNIVERSITY SEMESTER EXAMINATIONS 2026",
    "Financial Accounting - 25-12-2026 - 02:00 PM to 05:00 PM",
  ]);

  const conflictResult = await parseAcademicDocument(conflictPdf, {
    fileName: "University_DateSheet.pdf",
    documentType: "datesheet",
    studentCourse: "bcom",
    targetExamDate: "2026-11-01", // 54 days apart
  });

  assert(conflictResult.dateConflicts.length > 0, "Detected date conflict between uploaded date sheet (25-12-2026) and target date (2026-11-01)");
  console.log(` - Conflict Reason: ${conflictResult.dateConflicts[0]?.reason}`);

  // -------------------------------------------------------------
  // TEST 5: Full Pipeline - From Extracted CA Inter to Timetable
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Full Pipeline - Generated Timetable Strict Matching ---");
  const mockConfirmedSubjects: Subject[] = caResult.extractedSubjects.map((s, idx) => ({
    id: `sub-confirmed-${idx + 1}`,
    student_id: "student-ca-test",
    name: s.name,
    code: s.code || `PAPER-${idx + 1}`,
    color: "#6366f1",
    total_chapters: s.chapters.length,
    completed_chapters: 0,
    target_date: s.exam_date,
    is_weak: s.name.includes("Taxation"),
    created_at: new Date().toISOString(),
  }));

  const mockConfirmedChapters: Chapter[] = caResult.extractedSubjects.flatMap((s, sIdx) =>
    s.chapters.map((ch, cIdx) => ({
      id: `chap-${sIdx + 1}-${cIdx + 1}`,
      subject_id: `sub-confirmed-${sIdx + 1}`,
      student_id: "student-ca-test",
      title: ch.title,
      chapter_number: cIdx + 1,
      difficulty: ch.difficulty,
      estimated_hours: ch.estimated_hours,
      status: "pending" as const,
      study_status: "not_started" as const,
      revision_status: "not_started" as const,
      notes_count: 0,
      nature: ch.nature,
      created_at: new Date().toISOString(),
    }))
  );

  const mockConfirmedExams: Examination[] = caResult.extractedExaminations.map((e, idx) => ({
    id: `ex-${idx + 1}`,
    student_id: "student-ca-test",
    subject_name: e.subject_name,
    exam_name: e.exam_name,
    exam_date: e.exam_date,
    preparation_level: "medium",
    created_at: new Date().toISOString(),
  }));

  const timetableResult = TimetableEngine.generateTimetable({
    subjects: mockConfirmedSubjects,
    chapters: mockConfirmedChapters,
    examinations: mockConfirmedExams,
    dailyHours: 6.0,
    preferredTime: "morning",
    breakDuration: 15,
    weeklyHoliday: "Sunday",
    prepLevel: "intermediate",
    planDays: 14,
  });

  assert(timetableResult.sessions.length > 0, "Timetable generated study sessions", `Count: ${timetableResult.sessions.length}`);

  const generatedSubjectNames = Array.from(new Set(timetableResult.sessions.map((s) => s.subject_name)));
  console.log("Generated subjects in schedule:", generatedSubjectNames);

  // Strict validation: every generated subject must belong to the confirmed CA Inter subjects
  let allSubjectsMatch = true;
  for (const sName of generatedSubjectNames) {
    if (!caSubNames.includes(sName)) {
      allSubjectsMatch = false;
      console.error(`Unrecognized subject in schedule: ${sName}`);
    }
  }
  assert(allSubjectsMatch, "Verified: Every generated study session strictly belongs to confirmed CA Inter subjects!");

  // Verify numerical chapters get morning peak
  const morningPeaks = timetableResult.sessions.filter((s) => s.notes?.includes("Morning Numerical"));
  assert(morningPeaks.length > 0, "Numerical chapters scheduled during morning alert peak", `Count: ${morningPeaks.length}`);

  console.log("\n==========================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  return { passed, failed };
}

// Self-run when executed
if (typeof require !== "undefined" && require.main === module) {
  runPdfPipelineTests().then(({ failed: errCount }) => {
    if (errCount > 0) process.exit(1);
  });
}
