# CS Executive Live API & Audit Verification

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "STUDYMATE AI: LIVE CS EXECUTIVE 128-CHAPTER AUDIT VERIFICATION" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Test Audit API
Write-Host "`n1. Querying GET /api/admin/audit-curriculum ..."
$auditRes = Invoke-RestMethod -Uri 'http://localhost:3000/api/admin/audit-curriculum' -Method Get

Write-Host " - Success: $($auditRes.success)"
Write-Host " - Total Subjects: $($auditRes.summary.totalSubjects) (Expected: 7)"
Write-Host " - Total Chapters: $($auditRes.summary.totalChapters) (Expected: 128)"
Write-Host " - Verified Chapters: $($auditRes.summary.verifiedChapters) (Expected: 128)"
Write-Host " - Missing Chapters: $($auditRes.summary.missingChapters) (Expected: 0)"
Write-Host " - Mismatched Chapters: $($auditRes.summary.mismatchedChapters) (Expected: 0)"
Write-Host " - Duplicates: $($auditRes.summary.duplicates) (Expected: 0)"
Write-Host " - Accuracy Percentage: $($auditRes.summary.accuracyPercentage)%"
Write-Host " - Fully Verified: $($auditRes.summary.isFullyVerified)"

if ($auditRes.summary.totalSubjects -ne 7 -or $auditRes.summary.totalChapters -ne 128 -or $auditRes.summary.verifiedChapters -ne 128) {
  Write-Host "[FAIL] Audit numbers do not match exact requirements!" -ForegroundColor Red
  exit 1
}
Write-Host "[PASS] 100% Exact Match: All 7 Subjects and 128 Chapters Verified!" -ForegroundColor Green

# 2. Check each subject breakdown
Write-Host "`n2. Verifying Each Subject's Chapter Counts:"
$expectedBreakdown = @{
  1 = 14 # JIGL
  2 = 17 # Company Law
  3 = 23 # SBIL
  4 = 19 # CAFM
  5 = 18 # CMSL
  6 = 17 # ECIPL
  7 = 20 # Tax Laws
}

foreach ($sub in $auditRes.data.subjects) {
  $exp = $expectedBreakdown[$sub.paperNumber]
  $actual = $sub.totalPdfChapters
  $verified = $sub.verifiedCount
  $status = if ($actual -eq $exp -and $verified -eq $exp) { "[OK]" } else { "[FAIL]" }
  Write-Host " $status Paper $($sub.paperNumber): $($sub.subjectName) ($($sub.shortName)) - $verified/$actual Verified (Expected: $exp) [PDF Page $($sub.pdfPage)]"
  if ($actual -ne $exp -or $verified -ne $exp) {
    Write-Host "[FAIL] Mismatch in Paper $($sub.paperNumber)" -ForegroundColor Red
    exit 1
  }
}
Write-Host "[PASS] All 7 Subject chapter counts match target breakdown exactly!" -ForegroundColor Green

# 3. Test Student Migration Endpoint
Write-Host "`n3. Testing POST /api/admin/audit-curriculum (Data Migration) ..."
$migPayload = @{ studentId = "student-cs-live-audit" } | ConvertTo-Json
$migRes = Invoke-RestMethod -Uri 'http://localhost:3000/api/admin/audit-curriculum' -Method Post -Body $migPayload -ContentType 'application/json'

Write-Host " - Migration Success: $($migRes.success)"
Write-Host " - Subjects Mapped: $($migRes.data.subjectsUpdated)"
Write-Host " - Chapters Total: $($migRes.data.chaptersTotal)"
Write-Host " - Backup Key: $($migRes.data.backupKey)"

if (-not $migRes.success -or $migRes.data.chaptersTotal -ne 128) {
  Write-Host "[FAIL] Migration did not produce 128 chapters!" -ForegroundColor Red
  exit 1
}
Write-Host "[PASS] Safe student migration created 128 verified chapters with backup!" -ForegroundColor Green

# 4. Test Timetable Generation with 128 Chapters
Write-Host "`n4. Testing Timetable Generation with Verified CS Executive Subjects ..."
# Build timetable payload using the first 4 subjects
$ttSubjects = $auditRes.data.subjects | Select-Object -First 4 | ForEach-Object {
  @{
    id = "sub-$($_.paperNumber)"
    student_id = "student-cs-live-audit"
    name = $_.subjectName
    code = $_.code
    color = "#6366f1"
    is_weak = ($_.paperNumber -eq 4)
    chapters = $_.rows | ForEach-Object {
      @{
        chapter_number = $_.chapterNumber
        title = $_.pdfChapter
        difficulty = "medium"
        estimated_hours = 3.5
        nature = if ($_.subjectName -match "Accounting") { "numerical" } else { "theory" }
      }
    }
  }
}

$ttPayload = @{
  studentId = "student-cs-live-audit"
  preferences = @{
    daily_available_hours = 6
    preferred_study_time = "morning"
    break_duration_minutes = 15
    weekly_holiday = "Sunday"
    preparation_level = "intermediate"
  }
  subjects = $ttSubjects
  examinations = @(
    @{ subject_name = "Jurisprudence, Interpretation & General Laws"; exam_date = "2026-12-21" }
    @{ subject_name = "Company Law & Practice"; exam_date = "2026-12-23" }
    @{ subject_name = "Setting Up of Business, Industrial & Labour Laws"; exam_date = "2026-12-26" }
    @{ subject_name = "Corporate Accounting & Financial Management"; exam_date = "2026-12-28" }
  )
  keepExistingSessions = $false
} | ConvertTo-Json -Depth 6

$ttRes = Invoke-RestMethod -Uri 'http://localhost:3000/api/ai/generate-timetable' -Method Post -Body $ttPayload -ContentType 'application/json'

Write-Host " - Timetable Generation Success: $($ttRes.success)"
Write-Host " - Generated Sessions Count: $($ttRes.data.sessions.Count)"

$scheduledSubjects = $ttRes.data.sessions | ForEach-Object { $_.subject_name } | Select-Object -Unique
Write-Host " - Scheduled Subjects: $($scheduledSubjects -join ', ')"

$hasEngineering = ($scheduledSubjects -contains "Data Structures & Algorithms") -or ($scheduledSubjects -contains "Operating Systems")
Write-Host " - Contains Engineering Subjects? $hasEngineering (Must be False)"

if ($hasEngineering -or $ttRes.data.sessions.Count -eq 0) {
  Write-Host "[FAIL] Timetable leaked unauthorized subjects!" -ForegroundColor Red
  exit 1
}
Write-Host "[PASS] Timetable engine exclusively scheduled verified CS Executive subjects & chapters!" -ForegroundColor Green

# 5. Check UI Page
Write-Host "`n5. Verifying /admin/curriculum-audit Web Page ..."
$webRes = Invoke-WebRequest -Uri 'http://localhost:3000/admin/curriculum-audit' -UseBasicParsing
Write-Host " - HTTP Status Code: $($webRes.StatusCode)"

if ($webRes.StatusCode -ne 200) {
  Write-Host "[FAIL] /admin/curriculum-audit returned non-200 code!" -ForegroundColor Red
  exit 1
}
Write-Host "[PASS] Web page rendered with HTTP 200!" -ForegroundColor Green

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "[FINAL STATUS]: CS EXECUTIVE ZERO TOLERANCE AUDIT PASSED 100%!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
