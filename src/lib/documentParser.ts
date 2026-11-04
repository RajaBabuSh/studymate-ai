import { COURSE_CATALOG, findSubjectInCatalog, getCourseSyllabusInfo } from "@/lib/courseCatalog";
import { detectChapterNature } from "@/lib/chapterIntelligence";
import { Difficulty, ChapterNature } from "@/types/database";

export interface ExtractedChapter {
  id?: string;
  chapter_number: number;
  title: string;
  difficulty: Difficulty;
  estimated_hours: number;
  nature: ChapterNature;
  subtopics?: string[];
}

export interface ExtractedSubject {
  id?: string;
  name: string;
  code?: string;
  color?: string;
  exam_date?: string;
  exam_time?: string;
  room_location?: string;
  is_weak?: boolean;
  is_custom?: boolean;
  is_verified?: boolean;
  exam_body?: string;
  syllabus_version?: string;
  chapters: ExtractedChapter[];
}

export interface ExtractedExamination {
  id?: string;
  subject_name: string;
  exam_name: string;
  exam_date: string; // YYYY-MM-DD
  start_time?: string;
  end_time?: string;
  room_location?: string;
  is_confirmed?: boolean;
  notes?: string;
}

export interface DocumentParseResult {
  success: boolean;
  documentType: "syllabus" | "datesheet";
  fileName: string;
  examName: string;
  extractedSubjects: ExtractedSubject[];
  extractedExaminations: ExtractedExamination[];
  confidenceScore: number;
  source: "pdf-native-parser" | "gemini-vision-ocr" | "verified-curriculum-match";
  detectedCourse?: string;
  rawTextLength: number;
  isScannedOrEmpty: boolean;
  dateConflicts: Array<{
    subjectName: string;
    extractedDate: string;
    targetDate: string;
    reason: string;
  }>;
  validationNotes: string[];
  errorMessage?: string;
}

export interface DocumentParseOptions {
  fileName: string;
  mimeType?: string;
  documentType: "syllabus" | "datesheet";
  studentCourse?: string;
  targetExamDate?: string;
  studentId?: string;
}

// -------------------------------------------------------------
// 1. Text Extraction from PDF Buffer or Plain Text
// -------------------------------------------------------------
export async function extractRawTextFromBuffer(
  buffer: Buffer,
  mimeType: string = "application/pdf"
): Promise<{ text: string; pageCount: number; isScannedOrEmpty: boolean }> {
  // If plain text / markdown / CSV
  if (
    mimeType.includes("text/plain") ||
    mimeType.includes("text/csv") ||
    mimeType.includes("markdown")
  ) {
    const text = buffer.toString("utf-8");
    return {
      text,
      pageCount: 1,
      isScannedOrEmpty: text.trim().length === 0,
    };
  }

  // PDF Extraction via pdf-parse
  try {
    let PDFParse: unknown = null;
    try {
      // Use eval require to prevent client-side bundler warnings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeRequire = eval("require");
      const mod = nodeRequire("pdf-parse");
      PDFParse = mod?.PDFParse || mod?.default?.PDFParse || mod?.default || mod;
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfModule = await import("pdf-parse" as any);
      PDFParse = pdfModule?.PDFParse || pdfModule?.default?.PDFParse || pdfModule?.default || pdfModule;
    }

    if (typeof PDFParse === "function") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parserInstance = new (PDFParse as any)({ data: buffer });
        if (typeof parserInstance.load === "function") {
          await parserInstance.load();
          const parsed = await parserInstance.getText();
          if (typeof parserInstance.destroy === "function") {
            await parserInstance.destroy();
          }
          const text = typeof parsed === "string" ? parsed : parsed?.text || "";
          const pageCount = parsed?.total || parsed?.pages?.length || 1;
          const cleanText = text.trim();
          return {
            text: cleanText,
            pageCount,
            isScannedOrEmpty: cleanText.length < 20,
          };
        }
      } catch (classErr) {
        console.warn("PDFParse class method failed, testing direct function", classErr);
      }

      // Functional style check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (PDFParse as any)(buffer);
      const text = data?.text ? data.text.trim() : "";
      return {
        text,
        pageCount: data?.numpages || 1,
        isScannedOrEmpty: text.length < 20,
      };
    }
  } catch (err) {
    console.warn("pdf-parse extraction failed, attempting raw stream sweep", err);
  }

  // Fallback: Raw PDF stream sweep (extract uncompressed or partially compressed ascii strings)
  try {
    const rawAscii = buffer.toString("latin1");
    const streamRegex = /BT\s+([\s\S]*?)\s+ET/g;
    let match;
    const extractedParts: string[] = [];
    while ((match = streamRegex.exec(rawAscii)) !== null) {
      const block = match[1];
      const stringMatches = block.match(/\((.*?)\)\s*T[jJ]/g);
      if (stringMatches) {
        stringMatches.forEach((sm) => {
          const content = sm.replace(/^[(\s]+/, "").replace(/[)\sTj]+$/, "");
          if (content.length > 1) extractedParts.push(content);
        });
      }
    }

    const fallbackText = extractedParts.join(" ").trim();
    if (fallbackText.length > 20) {
      return {
        text: fallbackText,
        pageCount: 1,
        isScannedOrEmpty: false,
      };
    }
  } catch {
    // Ignore fallback failure
  }

  return {
    text: "",
    pageCount: 1,
    isScannedOrEmpty: true,
  };
}

// -------------------------------------------------------------
// 2. Date String Normalization Helpers
// -------------------------------------------------------------
const MONTH_MAP: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

export function normalizeDateStringToISO(dateStr: string): string | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // Pattern A: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Pattern B: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Pattern C: 03rd November 2026 or 3 Nov 2026 or Nov 3, 2026
  const textDateMatch = clean.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)[,\s]+(\d{4})/i
  );
  if (textDateMatch) {
    const d = textDateMatch[1].padStart(2, "0");
    const monthWord = textDateMatch[2].toLowerCase();
    const m = MONTH_MAP[monthWord] || MONTH_MAP[monthWord.slice(0, 3)];
    const y = textDateMatch[3];
    if (m && y) return `${y}-${m}-${d}`;
  }

  const textDateMatch2 = clean.match(
    /([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i
  );
  if (textDateMatch2) {
    const monthWord = textDateMatch2[1].toLowerCase();
    const d = textDateMatch2[2].padStart(2, "0");
    const m = MONTH_MAP[monthWord] || MONTH_MAP[monthWord.slice(0, 3)];
    const y = textDateMatch2[3];
    if (m && y) return `${y}-${m}-${d}`;
  }

  return null;
}

// -------------------------------------------------------------
// 3. Course and Subject Correlation Logic
// -------------------------------------------------------------
export function normalizeCourseId(courseId?: string): string {
  if (!courseId) return "other";
  const c = courseId.toLowerCase().trim();
  if (c === "ca-inter" || c === "ca-intermediate" || c.includes("intermediate")) return "ca-intermediate";
  if (c === "ca-foundation" || c.includes("foundation")) return "ca-foundation";
  if (c === "ca-final" || c.includes("ca final")) return "ca-final";
  if (c === "cs-exec" || c === "cs-executive" || c.includes("executive")) return "cs-executive";
  if (c === "cs-prof" || c === "cs-professional" || c.includes("professional")) return "cs-professional";
  if (c === "cbse-12" || c === "class-12" || c.includes("12") || c.includes("xii")) return "class-12";
  if (c === "cbse-10" || c === "class-10" || c.includes("10") || c.includes(" x")) return "class-10";
  if (c === "bcom" || c === "b.com" || c === "b-com") return "b-com";
  if (c === "bba") return "bba";
  if (c === "bca") return "bca";
  if (c === "ba") return "ba";
  return courseId;
}

export function detectCourseFromText(text: string, defaultCourse?: string): string {
  const t = text.toLowerCase();

  if (t.includes("chartered accountants") || t.includes("icai") || t.includes("ca inter")) {
    if (t.includes("foundation")) return "ca-foundation";
    if (t.includes("final")) return "ca-final";
    return "ca-intermediate";
  }

  if (t.includes("company secretaries") || t.includes("icsi") || t.includes("cs exec")) {
    if (t.includes("professional")) return "cs-professional";
    return "cs-executive";
  }

  if (t.includes("class xii") || t.includes("class 12") || t.includes("senior school") || t.includes("cbse")) {
    return "class-12";
  }

  if (t.includes("class x") || t.includes("class 10") || t.includes("secondary school")) {
    return "class-10";
  }

  if (t.includes("b.com") || t.includes("bcom") || t.includes("bachelor of commerce")) {
    return "b-com";
  }

  if (t.includes("bba") || t.includes("business administration")) {
    return "bba";
  }

  if (t.includes("bca") || t.includes("computer applications")) {
    return "bca";
  }

  return normalizeCourseId(defaultCourse);
}

// -------------------------------------------------------------
// 4. Examination Name Extraction
// -------------------------------------------------------------
export function extractExamTitleFromText(text: string, defaultCourse?: string): string {
  const lines = text
    .split(/[\r\n\t]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 15);

  const keywords = [
    "examination",
    "timetable",
    "time table",
    "date sheet",
    "datesheet",
    "schedule",
    "programme",
    "term end",
    "scheme",
  ];

  for (const line of lines) {
    const lLower = line.toLowerCase();
    if (keywords.some((k) => lLower.includes(k)) && line.length < 90) {
      // Clean up trailing dashes or colons
      return line.replace(/[:\-–—]+$/, "").trim();
    }
  }

  const courseInfo = defaultCourse ? getCourseSyllabusInfo(defaultCourse) : null;
  if (courseInfo && courseInfo.isVerified) {
    const cObj = COURSE_CATALOG.find((c) => c.id === defaultCourse);
    return `${cObj?.name || defaultCourse} Official Examination Schedule`;
  }

  return "Official Examination Schedule";
}

// -------------------------------------------------------------
// 5. Academic Date Sheet Line Parser
// -------------------------------------------------------------
export interface ParsedDateSheetEntry {
  rawLine: string;
  subjectName: string;
  paperCode?: string;
  examDate: string;
  examTime?: string;
  roomLocation?: string;
}

export function parseDateSheetLines(
  text: string,
  targetCourseId?: string
): ParsedDateSheetEntry[] {
  const entries: ParsedDateSheetEntry[] = [];
  const lines = text.split(/[\r\n\t]+|\s{4,}/).map((l) => l.trim()).filter((l) => l.length > 5);

  const resolvedCourseId = normalizeCourseId(targetCourseId);
  const activeCourse = resolvedCourseId
    ? COURSE_CATALOG.find((c) => c.id === resolvedCourseId)
    : undefined;

  // Regex for dates embedded in lines
  const dateRegex =
    /(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*)?(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3,9})[-/.]\d{4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9}[,\s]+\d{4}|[A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+\d{4})/i;

  // Time regex matching ranges (10:30 AM to 1:30 PM, 2:00 PM - 5:00 PM) and single points (10:30 AM, 2:00 PM, 10:00)
  const timeRegex = /(?:\b\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*(?:to|-|–)\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)|\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\b\d{1,2}\s*(?:AM|PM|am|pm))/i;

  lines.forEach((line) => {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) return;

    const rawDateStr = dateMatch[1];
    const isoDate = normalizeDateStringToISO(rawDateStr);
    if (!isoDate) return;

    // Time extract
    let examTime: string | undefined;
    const timeMatch = line.match(timeRegex);
    if (timeMatch) examTime = timeMatch[0].trim();

    // Remove the date and time from the line to isolate the subject
    let subjectPart = line
      .replace(dateMatch[0], "")
      .replace(timeRegex, "")
      .replace(/Hall\s*\d+|Room\s*\d+|Complex|Auditorium\s*[A-Z]?/gi, "")
      .replace(/[|:;•\-_()]+/g, " ")
      .trim();

    // Check for paper or subject code (e.g. Paper 1, Subject 042, Code 042, Paper-2, BCH 5.1)
    let paperCode: string | undefined;
    const codeMatch = subjectPart.match(
      /(?:(?:Paper|Code|Subject|Sub)\s*[-–—:]?\s*([A-Za-z0-9]+)|(Group\s*[-–—:]?\s*\w+))/i
    );
    if (codeMatch) {
      paperCode = codeMatch[0].trim().replace(/[:\-–—]+$/, "");
      subjectPart = subjectPart.replace(codeMatch[0], "").trim();
    }

    // Clean up days of week, time remnants, and boundary punctuation
    subjectPart = subjectPart
      .replace(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi, "")
      .replace(/\b\d{1,2}\s+\d{2}\s+(?:AM|PM|am|pm)\b/gi, "")
      .replace(/\b(?:AM|PM|am|pm|Morning|Afternoon|Evening|Forenoon)\b/gi, "")
      .replace(/^[0-9\s\-–—:]+/, "")
      .replace(/[\s\-–—:]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (subjectPart.length < 3) return;

    // Check if subjectPart matches an official subject in the student's catalog
    let matchedName = subjectPart;
    if (activeCourse) {
      const found = activeCourse.subjects.find((s) => {
        const sL = s.name.toLowerCase();
        const partL = subjectPart.toLowerCase();
        return (
          partL === sL ||
          partL.includes(sL) ||
          sL.includes(partL) ||
          (s.code && (partL.includes(s.code.toLowerCase()) || paperCode?.toLowerCase().includes(s.code.toLowerCase())))
        );
      });
      if (found) {
        matchedName = found.name;
        if (!paperCode && found.code) paperCode = found.code;
      }
    }

    // Prevent duplicate entries for same subject on same date
    const exists = entries.some(
      (e) => e.subjectName.toLowerCase() === matchedName.toLowerCase() && e.examDate === isoDate
    );
    if (!exists) {
      entries.push({
        rawLine: line,
        subjectName: matchedName,
        paperCode,
        examDate: isoDate,
        examTime: examTime || "02:00 PM - 05:00 PM",
      });
    }
  });

  return entries;
}

// -------------------------------------------------------------
// 6. Main Document Parser Coordinator
// -------------------------------------------------------------
export async function parseAcademicDocument(
  fileBuffer: Buffer,
  options: DocumentParseOptions
): Promise<DocumentParseResult> {
  const { fileName, mimeType = "application/pdf", documentType, studentCourse, targetExamDate } = options;

  // 1. Extract plain text from document
  const extraction = await extractRawTextFromBuffer(fileBuffer, mimeType);
  const rawText = extraction.text;
  const isScannedOrEmpty = extraction.isScannedOrEmpty;

  const detectedCourse = detectCourseFromText(rawText, studentCourse);
  const examName = extractExamTitleFromText(rawText, detectedCourse);
  const activeCourseObj = COURSE_CATALOG.find((c) => c.id === detectedCourse);

  const extractedSubjects: ExtractedSubject[] = [];
  const extractedExaminations: ExtractedExamination[] = [];
  const dateConflicts: DocumentParseResult["dateConflicts"] = [];
  const validationNotes: string[] = [];

  // If text is unreadable/scanned and empty: fail with clear, actionable error
  if (isScannedOrEmpty || rawText.length < 25) {
    return {
      success: false,
      documentType,
      fileName,
      examName: "Unreadable Document",
      extractedSubjects: [],
      extractedExaminations: [],
      confidenceScore: 0.0,
      source: "pdf-native-parser",
      detectedCourse,
      rawTextLength: rawText.length,
      isScannedOrEmpty: true,
      dateConflicts: [],
      validationNotes: [
        "The uploaded PDF does not contain selectable text (scanned image or rasterized PDF).",
        "You can either: (1) Re-upload a digital PDF or clear document, (2) Load verified curriculum for your course, or (3) Add your subjects manually in the verification table.",
      ],
      errorMessage:
        "Unable to read text from this PDF. Please ensure the document is not password-protected and contains selectable text.",
    };
  }

  // -----------------------------------------------------------
  // Parse Datesheet
  // -----------------------------------------------------------
  if (documentType === "datesheet") {
    const parsedEntries = parseDateSheetLines(rawText, detectedCourse);

    if (parsedEntries.length > 0) {
      parsedEntries.forEach((entry, idx) => {
        // Find subject in course catalog to pull default chapters
        const catalogSubject = activeCourseObj
          ? findSubjectInCatalog(detectedCourse, entry.subjectName)
          : undefined;

        const chapters: ExtractedChapter[] = catalogSubject
          ? catalogSubject.defaultChapters.map((cName, cIdx) => ({
              chapter_number: cIdx + 1,
              title: cName,
              difficulty: "medium",
              estimated_hours: 3.5,
              nature: detectChapterNature(cName, detectedCourse),
            }))
          : [
              {
                chapter_number: 1,
                title: "Core Concepts & Fundamentals",
                difficulty: "easy",
                estimated_hours: 3.0,
                nature: detectChapterNature(entry.subjectName, detectedCourse),
              },
              {
                chapter_number: 2,
                title: "Advanced Applications & Problem Solving",
                difficulty: "hard",
                estimated_hours: 5.0,
                nature: detectChapterNature(entry.subjectName, detectedCourse),
              },
              {
                chapter_number: 3,
                title: "Past Examination Question Practice",
                difficulty: "medium",
                estimated_hours: 4.0,
                nature: "practical",
              },
            ];

        extractedSubjects.push({
          id: `sub-extracted-${idx + 1}`,
          name: entry.subjectName,
          code: entry.paperCode || `PAPER-${idx + 1}`,
          color: catalogSubject?.color || "#6366f1",
          exam_date: entry.examDate,
          exam_time: entry.examTime,
          is_weak: false,
          is_custom: !catalogSubject,
          is_verified: Boolean(catalogSubject),
          exam_body: activeCourseObj?.examBody || "Uploaded Document Authority",
          syllabus_version: activeCourseObj?.syllabusVersion || "Extracted from Date Sheet",
          chapters,
        });

        extractedExaminations.push({
          id: `exam-extracted-${idx + 1}`,
          subject_name: entry.subjectName,
          exam_name: `${entry.subjectName} (${entry.paperCode || "Exam"})`,
          exam_date: entry.examDate,
          start_time: entry.examTime?.split("-")[0]?.trim() || "02:00 PM",
          end_time: entry.examTime?.split("-")[1]?.trim() || "05:00 PM",
          room_location: entry.roomLocation,
          notes: `Extracted from ${fileName}: ${entry.rawLine}`,
        });

        // Date conflict check with student's target exam date
        if (targetExamDate) {
          const tDate = new Date(targetExamDate);
          const eDate = new Date(entry.examDate);
          const diffDays = Math.abs(Math.round((eDate.getTime() - tDate.getTime()) / 86400000));
          if (diffDays > 21) {
            dateConflicts.push({
              subjectName: entry.subjectName,
              extractedDate: entry.examDate,
              targetDate: targetExamDate,
              reason: `Exam date in uploaded date sheet (${entry.examDate}) is ${diffDays} days away from your declared target date (${targetExamDate}).`,
            });
          }
        }
      });

      validationNotes.push(
        `Successfully extracted ${parsedEntries.length} individual subject examinations directly from "${fileName}".`
      );
    } else {
      // If parsing lines found no explicit dates, try to match known course subjects
      if (activeCourseObj) {
        validationNotes.push(
          `Document mentions "${activeCourseObj.name}". Matched verified subjects from official curriculum.`
        );
        activeCourseObj.subjects.forEach((s, idx) => {
          extractedSubjects.push({
            id: `sub-${s.code || idx + 1}`,
            name: s.name,
            code: s.code,
            color: s.color,
            is_weak: false,
            is_custom: false,
            is_verified: true,
            exam_body: activeCourseObj.examBody,
            syllabus_version: activeCourseObj.syllabusVersion,
            chapters: s.defaultChapters.map((cName, cIdx) => ({
              chapter_number: cIdx + 1,
              title: cName,
              difficulty: "medium",
              estimated_hours: 3.5,
              nature: detectChapterNature(cName, detectedCourse),
            })),
          });

          const mockDate = targetExamDate || new Date(Date.now() + (idx + 10) * 86400000).toISOString().split("T")[0];
          extractedExaminations.push({
            id: `exam-${idx + 1}`,
            subject_name: s.name,
            exam_name: `${s.name} - ${activeCourseObj.name}`,
            exam_date: mockDate,
            start_time: "02:00 PM",
            end_time: "05:00 PM",
          });
        });
      }
    }
  } else {
    // -----------------------------------------------------------
    // Parse Syllabus
    // -----------------------------------------------------------
    // Scan text for subjects and chapters
    const subjectSections: Array<{ name: string; chapters: ExtractedChapter[] }> = [];
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    let currentSubjectName: string | null = null;
    let currentChapters: ExtractedChapter[] = [];

    const subjectHeaderRegex = /(?:Subject|Course|Paper|Module)\s*[:\-–—]\s*(.+)/i;
    const chapterLineRegex = /(?:Chapter|Unit|Module|\d+\.)\s*[:\-–—]?\s*(\d+)?\s*[:\-–—]?\s*(.+)/i;

    lines.forEach((line) => {
      const sMatch = line.match(subjectHeaderRegex);
      if (sMatch) {
        if (currentSubjectName && currentChapters.length > 0) {
          subjectSections.push({ name: currentSubjectName, chapters: currentChapters });
        }
        currentSubjectName = sMatch[1].trim();
        currentChapters = [];
        return;
      }

      const cMatch = line.match(chapterLineRegex);
      if (cMatch && currentSubjectName) {
        const cNum = cMatch[1] ? Number(cMatch[1]) : currentChapters.length + 1;
        const cTitle = cMatch[2].trim();
        if (cTitle.length > 3) {
          currentChapters.push({
            chapter_number: cNum,
            title: cTitle,
            difficulty: "medium",
            estimated_hours: 3.5,
            nature: detectChapterNature(cTitle, detectedCourse),
          });
        }
      }
    });

    if (currentSubjectName && currentChapters.length > 0) {
      subjectSections.push({ name: currentSubjectName, chapters: currentChapters });
    }

    if (subjectSections.length > 0) {
      subjectSections.forEach((sec, idx) => {
        const catSub = activeCourseObj ? findSubjectInCatalog(detectedCourse, sec.name) : undefined;
        extractedSubjects.push({
          id: `sub-syl-${idx + 1}`,
          name: sec.name,
          code: catSub?.code || `PAPER-${idx + 1}`,
          color: catSub?.color || "#6366f1",
          is_weak: false,
          is_custom: !catSub,
          is_verified: Boolean(catSub),
          exam_body: activeCourseObj?.examBody || "Uploaded Document Syllabus",
          syllabus_version: activeCourseObj?.syllabusVersion || "Uploaded Document",
          chapters: sec.chapters,
        });
      });
      validationNotes.push(`Extracted ${extractedSubjects.length} subjects with syllabus modules from "${fileName}".`);
    } else if (activeCourseObj) {
      // Use verified catalog subjects
      validationNotes.push(`Curriculum matched: ${activeCourseObj.name} (${activeCourseObj.examBody}).`);
      activeCourseObj.subjects.forEach((s, idx) => {
        extractedSubjects.push({
          id: `sub-${s.code || idx + 1}`,
          name: s.name,
          code: s.code,
          color: s.color,
          is_weak: false,
          is_custom: false,
          is_verified: true,
          exam_body: activeCourseObj.examBody,
          syllabus_version: activeCourseObj.syllabusVersion,
          chapters: s.defaultChapters.map((cName, cIdx) => ({
            chapter_number: cIdx + 1,
            title: cName,
            difficulty: "medium",
            estimated_hours: 3.5,
            nature: detectChapterNature(cName, detectedCourse),
          })),
        });
      });
    }
  }

  // Calculate extraction confidence
  let confidence = 0.85;
  if (extractedSubjects.length === 0) confidence = 0.3;
  else if (extractedExaminations.length > 0) confidence = 0.94;

  return {
    success: extractedSubjects.length > 0,
    documentType,
    fileName,
    examName,
    extractedSubjects,
    extractedExaminations,
    confidenceScore: confidence,
    source: "pdf-native-parser",
    detectedCourse,
    rawTextLength: rawText.length,
    isScannedOrEmpty: false,
    dateConflicts,
    validationNotes,
  };
}
