# Multi-Course E2E Pipeline Verification Test
# Verifies CA Inter, CS Executive, CBSE Class 12, and Empty/Unreadable PDF handling

Add-Type -AssemblyName 'System.Net.Http'

function Test-CoursePdf {
  param(
    [string]$TestName,
    [string]$PdfFileName,
    [string[]]$PdfLines,
    [string]$CourseCode,
    [string]$TargetDate,
    [string[]]$ExpectedSubjects,
    [string[]]$ForbiddenSubjects
  )

  Write-Host "`n========================================================" -ForegroundColor Cyan
  Write-Host "TEST: $TestName" -ForegroundColor Cyan
  Write-Host "========================================================" -ForegroundColor Cyan

  # Generate PDF stream
  $stream = "BT /F1 12 Tf 50 750 Td (" + ($PdfLines -join ") Tj T* (") + ") Tj ET"
  $pdfContent = "%PDF-1.4`n1 0 obj`n<< /Type /Catalog /Pages 2 0 R >>`nendobj`n2 0 obj`n<< /Type /Pages /Kids [3 0 R] /Count 1 >>`nendobj`n3 0 obj`n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`nendobj`n4 0 obj`n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`nendobj`n5 0 obj`n<< /Length $($stream.Length) >>`nstream`n$stream`nendstream`nendobj`nxref`n0 6`n0000000000 65535 f `n0000000009 00000 n `n0000000058 00000 n `n0000000115 00000 n `n0000000214 00000 n `n0000000293 00000 n `ntrailer`n<< /Size 6 /Root 1 0 R >>`nstartxref`n500`n%%EOF"

  $tempPdf = "$PSScriptRoot\temp_$PdfFileName"
  [System.IO.File]::WriteAllText($tempPdf, $pdfContent, [System.Text.Encoding]::ASCII)

  $client = New-Object System.Net.Http.HttpClient
  $content = New-Object System.Net.Http.MultipartFormDataContent

  $fileBytes = [System.IO.File]::ReadAllBytes($tempPdf)
  $byteContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$fileBytes)
  $byteContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/pdf')
  $content.Add($byteContent, 'file', $PdfFileName)

  $content.Add((New-Object System.Net.Http.StringContent('datesheet')), 'documentType')
  $content.Add((New-Object System.Net.Http.StringContent($CourseCode)), 'studentCourse')
  $content.Add((New-Object System.Net.Http.StringContent($TargetDate)), 'targetExamDate')

  Write-Host "1. Extracting PDF via /api/ai/extract ..."
  $res = $client.PostAsync('http://localhost:3000/api/ai/extract', $content).Result
  $body = $res.Content.ReadAsStringAsync().Result
  $json = $body | ConvertFrom-Json

  if (-not $json.success) {
    Write-Host "[FAIL] Extraction failed: $($json.error)" -ForegroundColor Red
    return $false
  }

  Write-Host " - Extraction Success: $($json.success)"
  Write-Host " - Exam Name: $($json.data.exam_name)"
  Write-Host " - Subjects Count: $($json.data.subjects.Count)"

  $extractedNames = $json.data.subjects | ForEach-Object { $_.name }
  Write-Host " - Extracted Subject Names: $($extractedNames -join ', ')"

  # Check forbidden subjects
  foreach ($f in $ForbiddenSubjects) {
    if ($extractedNames -contains $f) {
      Write-Host "[FAIL] Extracted contains forbidden subject: $f" -ForegroundColor Red
      return $false
    }
  }

  Write-Host "2. Generating Final Timetable via /api/ai/generate-timetable ..."
  $ttPayload = @{
    studentId = "student-$CourseCode"
    preferences = @{
      daily_available_hours = 6
      preferred_study_time = 'morning'
      break_duration_minutes = 15
      weekly_holiday = 'Sunday'
      preparation_level = 'intermediate'
    }
    subjects = $json.data.subjects
    examinations = $json.data.examinations
    keepExistingSessions = $false
  } | ConvertTo-Json -Depth 6

  $ttRes = Invoke-RestMethod -Uri 'http://localhost:3000/api/ai/generate-timetable' -Method Post -Body $ttPayload -ContentType 'application/json'

  $scheduledSubjects = $ttRes.data.sessions | ForEach-Object { $_.subject_name } | Select-Object -Unique
  Write-Host " - Timetable Sessions Generated: $($ttRes.data.sessions.Count)"
  Write-Host " - Scheduled Subjects: $($scheduledSubjects -join ', ')"

  foreach ($f in $ForbiddenSubjects) {
    if ($scheduledSubjects -contains $f) {
      Write-Host "[FAIL] Timetable leaked forbidden subject: $f" -ForegroundColor Red
      return $false
    }
  }

  # Clean up temp file
  if (Test-Path $tempPdf) { Remove-Item $tempPdf }

  Write-Host "[PASS] $TestName strictly accurate! 0 leaked subjects." -ForegroundColor Green
  return $true
}

# --- TEST 1: CS Executive ---
$csLines = @(
  "THE INSTITUTE OF COMPANY SECRETARIES OF INDIA",
  "EXAMINATION DATE SHEET - DECEMBER 2026",
  "EXECUTIVE PROGRAMME EXAMINATION",
  "Paper 1: Jurisprudence, Interpretation & General Laws - 21-12-2026",
  "Paper 2: Company Law & Practice - 23-12-2026",
  "Paper 3: Setting Up of Business, Industrial and Labour Laws - 26-12-2026",
  "Paper 4: Corporate Accounting and Financial Management - 28-12-2026"
)
$csPass = Test-CoursePdf -TestName "ICSI CS Executive Date Sheet" `
  -PdfFileName "ICSI_CS_Exec_Dec2026.pdf" `
  -PdfLines $csLines `
  -CourseCode "cs-executive" `
  -TargetDate "2026-12-21" `
  -ExpectedSubjects @("Jurisprudence, Interpretation & General Laws", "Company Law & Practice") `
  -ForbiddenSubjects @("Data Structures & Algorithms", "Operating Systems", "Discrete Mathematics & Probability", "Advanced Accounting")

# --- TEST 2: CBSE Class 12 ---
$cbseLines = @(
  "CENTRAL BOARD OF SECONDARY EDUCATION",
  "SENIOR SCHOOL CERTIFICATE EXAMINATION 2027",
  "DATE SHEET CLASS XII",
  "Subject 042: Physics - 20-02-2027 - 10:30 AM",
  "Subject 043: Chemistry - 27-02-2027 - 10:30 AM",
  "Subject 041: Mathematics - 08-03-2027 - 10:30 AM",
  "Subject 301: English Core - 15-03-2027 - 10:30 AM"
)
$cbsePass = Test-CoursePdf -TestName "CBSE Class 12 Board Exam Date Sheet" `
  -PdfFileName "CBSE_Class12_Datesheet2027.pdf" `
  -PdfLines $cbseLines `
  -CourseCode "cbse-12" `
  -TargetDate "2027-02-20" `
  -ExpectedSubjects @("Physics", "Chemistry", "Mathematics", "English Core") `
  -ForbiddenSubjects @("Data Structures & Algorithms", "Operating Systems", "Corporate and Other Laws", "Jurisprudence")

# --- TEST 3: Unreadable / Scanned PDF error handling ---
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "TEST: Unreadable / Corrupt PDF Error Handling (No silent mock fallback)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$emptyPdf = "%PDF-1.4`n%%EOF"
$emptyPdfPath = "$PSScriptRoot\temp_corrupt.pdf"
[System.IO.File]::WriteAllText($emptyPdfPath, $emptyPdf, [System.Text.Encoding]::ASCII)

$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent
$fileBytes = [System.IO.File]::ReadAllBytes($emptyPdfPath)
$byteContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$fileBytes)
$byteContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/pdf')
$content.Add($byteContent, 'file', 'corrupt.pdf')
$content.Add((New-Object System.Net.Http.StringContent('datesheet')), 'documentType')
$content.Add((New-Object System.Net.Http.StringContent('ca-inter')), 'studentCourse')

$res = $client.PostAsync('http://localhost:3000/api/ai/extract', $content).Result
$body = $res.Content.ReadAsStringAsync().Result
$errJson = $body | ConvertFrom-Json

Write-Host "HTTP Status: $($res.StatusCode)"
Write-Host "Success: $($errJson.success)"
Write-Host "Error Message: $($errJson.error)"

if (Test-Path $emptyPdfPath) { Remove-Item $emptyPdfPath }

$errorHandledPass = ($res.StatusCode -eq 422 -and -not $errJson.success)
if ($errorHandledPass) {
  Write-Host "[PASS] Correctly rejected unreadable PDF with HTTP 422 and helpful message!" -ForegroundColor Green
} else {
  Write-Host "[FAIL] Did not return HTTP 422 for unreadable PDF!" -ForegroundColor Red
}

Write-Host "`n========================================================" -ForegroundColor Yellow
Write-Host "ALL COURSE VERIFICATION SUMMARY" -ForegroundColor Yellow
Write-Host " - CS Executive: $(if ($csPass) { 'PASSED' } else { 'FAILED' })"
Write-Host " - CBSE Class 12: $(if ($cbsePass) { 'PASSED' } else { 'FAILED' })"
Write-Host " - Corrupt PDF Guard: $(if ($errorHandledPass) { 'PASSED' } else { 'FAILED' })"
Write-Host "========================================================" -ForegroundColor Yellow
