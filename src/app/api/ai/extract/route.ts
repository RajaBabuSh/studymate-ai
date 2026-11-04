import { NextRequest, NextResponse } from "next/server";
import { parseAcademicDocument } from "@/lib/documentParser";
import { COURSE_CATALOG } from "@/lib/courseCatalog";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const documentType = (formData.get("documentType") as "syllabus" | "datesheet") || "syllabus";
    const file = formData.get("file") as File | null;
    const studentCourse = (formData.get("studentCourse") as string) || (formData.get("course") as string) || "";
    const targetExamDate = (formData.get("targetExamDate") as string) || "";
    const studentId = (formData.get("studentId") as string) || "student-active";
    const isExplicitDemo = formData.get("isDemo") === "true";

    const fileName = file?.name || (documentType === "datesheet" ? "examination_date_sheet.pdf" : "syllabus.pdf");
    const mimeType = file?.type || "application/pdf";

    console.log(`\n======================================================`);
    console.log(`[AI Extract API] INCOMING DOCUMENT EXTRACTION REQUEST`);
    console.log(` - File: ${fileName} (${mimeType})`);
    console.log(` - Document Type: ${documentType}`);
    console.log(` - Student ID: ${studentId}`);
    console.log(` - Declared Student Course: ${studentCourse || "Not Specified"}`);
    console.log(` - Target Exam Date: ${targetExamDate || "Not Specified"}`);
    console.log(`======================================================`);

    // 1. Process Real File Upload if Provided
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      console.log(`[AI Extract API] Read ${fileBuffer.length} bytes from uploaded file: ${fileName}`);

      // Attempt AI Document Parsing via documentParser engine
      const parseResult = await parseAcademicDocument(fileBuffer, {
        fileName,
        mimeType,
        documentType,
        studentCourse,
        targetExamDate,
        studentId,
      });

      console.log(`[AI Extract API] Parsing Result Status: ${parseResult.success ? "SUCCESS" : "FAILED"}`);
      console.log(` - Detected Course: ${parseResult.detectedCourse}`);
      console.log(` - Exam Name: ${parseResult.examName}`);
      console.log(` - Extracted Subjects Count: ${parseResult.extractedSubjects.length}`);
      console.log(` - Extracted Subject Names: [${parseResult.extractedSubjects.map((s) => s.name).join(", ")}]`);
      console.log(` - Extracted Exam Dates Count: ${parseResult.extractedExaminations.length}`);
      console.log(
        ` - Extracted Dates: [${parseResult.extractedExaminations
          .map((e) => `${e.subject_name} -> ${e.exam_date}`)
          .join(" | ")}]`
      );
      console.log(` - Confidence: ${Math.round(parseResult.confidenceScore * 100)}%`);
      console.log(` - Source: ${parseResult.source}`);
      if (parseResult.dateConflicts.length > 0) {
        console.warn(` - Date Conflicts Detected:`, parseResult.dateConflicts);
      }

      if (!parseResult.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              parseResult.errorMessage ||
              "Unable to extract subjects or exam dates from the uploaded document. Please check the document format or input subjects manually.",
            isScannedOrEmpty: parseResult.isScannedOrEmpty,
            validationNotes: parseResult.validationNotes,
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        success: true,
        source: parseResult.source,
        data: {
          document_id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file_name: fileName,
          exam_name: parseResult.examName,
          detected_course: parseResult.detectedCourse,
          subjects: parseResult.extractedSubjects,
          examinations: parseResult.extractedExaminations,
          confidence_score: parseResult.confidenceScore,
          is_scanned_or_empty: parseResult.isScannedOrEmpty,
          date_conflicts: parseResult.dateConflicts,
          validation_notes: parseResult.validationNotes,
          notes: parseResult.validationNotes.join(" "),
        },
      });
    }

    // 2. Explicit Demo Mode Handlers (Only when user explicitly launches demo environment)
    if (isExplicitDemo) {
      console.log(`[AI Extract API] Generating Course-Appropriate DEMO data for course: ${studentCourse || "ca-inter"}`);
      const courseKey = studentCourse || "ca-inter";
      const courseDef = COURSE_CATALOG.find((c) => c.id === courseKey) || COURSE_CATALOG[1]; // CA Inter default

      const demoSubjects = courseDef.subjects.map((s, sIdx) => ({
        id: `demo-sub-${sIdx + 1}`,
        name: s.name,
        code: s.code,
        color: s.color,
        is_weak: sIdx === 0,
        is_custom: false,
        is_verified: true,
        exam_body: courseDef.examBody,
        syllabus_version: courseDef.syllabusVersion,
        chapters: s.defaultChapters.map((cName, cIdx) => ({
          chapter_number: cIdx + 1,
          title: cName,
          difficulty: cIdx % 2 === 0 ? "medium" : "hard",
          estimated_hours: 3.5,
          nature: s.name.toLowerCase().includes("accounting") || s.name.toLowerCase().includes("tax") ? "numerical" : "theory",
        })),
      }));

      const today = new Date();
      const demoExams = courseDef.subjects.map((s, sIdx) => {
        const examDate = new Date(today);
        examDate.setDate(examDate.getDate() + 14 + sIdx * 2);
        return {
          id: `demo-exam-${sIdx + 1}`,
          subject_name: s.name,
          exam_name: `${courseDef.name} Final Examination`,
          exam_date: examDate.toISOString().split("T")[0],
          start_time: "02:00 PM",
          end_time: "05:00 PM",
        };
      });

      return NextResponse.json({
        success: true,
        source: "demo-environment",
        data: {
          document_id: "demo-document",
          file_name: `Sample_${courseDef.name.replace(/\s+/g, "_")}_Schedule.pdf`,
          exam_name: `${courseDef.name} Official Examination Demo`,
          detected_course: courseDef.id,
          subjects: demoSubjects,
          examinations: demoExams,
          confidence_score: 0.98,
          validation_notes: ["Loaded official demo curriculum template for verification."],
          notes: "Loaded official demo curriculum template for verification.",
        },
      });
    }

    // 3. No File Provided and Not Demo Mode
    return NextResponse.json(
      {
        success: false,
        error: "No file was uploaded. Please upload a PDF syllabus or examination date sheet.",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("[AI Extract API Error]", error);
    const message = error instanceof Error ? error.message : "Failed to process document";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
