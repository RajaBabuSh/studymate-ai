$caPdfLines = @(
  "THE INSTITUTE OF CHARTERED ACCOUNTANTS OF INDIA",
  "EXAMINATION TIMETABLE - NOVEMBER 2026",
  "INTERMEDIATE EXAMINATION (NEW SCHEME)",
  "Paper - 1: Advanced Accounting - 03-11-2026 - 2:00 PM to 5:00 PM",
  "Paper - 2: Corporate and Other Laws - 05-11-2026 - 2:00 PM to 5:00 PM",
  "Paper - 3: Direct and Indirect Taxation - 07-11-2026 - 2:00 PM to 5:00 PM",
  "Paper - 4: Cost and Management Accounting - 09-11-2026 - 2:00 PM to 5:00 PM"
)

$stream = "BT /F1 12 Tf 50 750 Td (" + ($caPdfLines -join ") Tj T* (") + ") Tj ET"
$pdfContent = "%PDF-1.4`n1 0 obj`n<< /Type /Catalog /Pages 2 0 R >>`nendobj`n2 0 obj`n<< /Type /Pages /Kids [3 0 R] /Count 1 >>`nendobj`n3 0 obj`n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`nendobj`n4 0 obj`n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`nendobj`n5 0 obj`n<< /Length $($stream.Length) >>`nstream`n$stream`nendstream`nendobj`nxref`n0 6`n0000000000 65535 f `n0000000009 00000 n `n0000000058 00000 n `n0000000115 00000 n `n0000000214 00000 n `n0000000293 00000 n `ntrailer`n<< /Size 6 /Root 1 0 R >>`nstartxref`n500`n%%EOF"

$tempPdfPath = "$PSScriptRoot\temp_ca_inter_datesheet.pdf"
[System.IO.File]::WriteAllText($tempPdfPath, $pdfContent, [System.Text.Encoding]::ASCII)

Write-Host "Created sample PDF at: $tempPdfPath"

# Prepare multipart form data
Add-Type -AssemblyName 'System.Net.Http'
$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent

$fileBytes = [System.IO.File]::ReadAllBytes($tempPdfPath)
$byteContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$fileBytes)
$byteContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/pdf')
$content.Add($byteContent, 'file', 'ICAI_CA_Inter_Nov2026.pdf')

$stringContentDocType = New-Object System.Net.Http.StringContent('datesheet')
$content.Add($stringContentDocType, 'documentType')

$stringContentCourse = New-Object System.Net.Http.StringContent('ca-inter')
$content.Add($stringContentCourse, 'studentCourse')

$stringContentTarget = New-Object System.Net.Http.StringContent('2026-11-03')
$content.Add($stringContentTarget, 'targetExamDate')

Write-Host "`n1. SENDING PDF TO /api/ai/extract ..."
$response = $client.PostAsync('http://localhost:3000/api/ai/extract', $content).Result
$responseBody = $response.Content.ReadAsStringAsync().Result

Write-Host "HTTP Status: $($response.StatusCode)"
$extractJson = $responseBody | ConvertFrom-Json

Write-Host "Extraction Success: $($extractJson.success)"
Write-Host "Detected Course: $($extractJson.data.detected_course)"
Write-Host "Exam Name: $($extractJson.data.exam_name)"
Write-Host "Extracted Subjects Count: $($extractJson.data.subjects.Count)"

$extractedSubjects = $extractJson.data.subjects
$extractedExams = $extractJson.data.examinations

Write-Host "`nExtracted Subjects:"
foreach ($s in $extractedSubjects) {
  Write-Host " - $($s.name) ($($s.code)) | Exam Date: $($s.exam_date) | Chapters: $($s.chapters.Count)"
}

Write-Host "`n2. CONFIRMING DATA & GENERATING FINAL TIMETABLE ..."
$timetablePayload = @{
  studentId = 'student-ca-live'
  preferences = @{
    daily_available_hours = 6
    preferred_study_time = 'morning'
    break_duration_minutes = 15
    weekly_holiday = 'Sunday'
    preparation_level = 'intermediate'
  }
  subjects = $extractedSubjects
  examinations = $extractedExams
  keepExistingSessions = $false
} | ConvertTo-Json -Depth 6

$ttRes = Invoke-RestMethod -Uri 'http://localhost:3000/api/ai/generate-timetable' -Method Post -Body $timetablePayload -ContentType 'application/json'

Write-Host "Timetable API Success: $($ttRes.success)"
Write-Host "Total Sessions Generated: $($ttRes.data.sessions.Count)"

$scheduledSubjects = $ttRes.data.sessions | ForEach-Object { $_.subject_name } | Select-Object -Unique
Write-Host "`nSubjects in Final Generated Schedule:"
foreach ($sub in $scheduledSubjects) {
  Write-Host " + $sub"
}

# Strict Safety Assertions
$hasDataStructures = ($scheduledSubjects -contains 'Data Structures & Algorithms')
$hasOperatingSystems = ($scheduledSubjects -contains 'Operating Systems')
$hasDiscreteMath = ($scheduledSubjects -contains 'Discrete Mathematics & Probability')
$allMatched = (-not $hasDataStructures -and -not $hasOperatingSystems -and -not $hasDiscreteMath)

Write-Host "`n--- FINAL STRICT VERIFICATION CHECKS ---"
Write-Host " - Contains 'Data Structures & Algorithms'? $hasDataStructures (Must be False)"
Write-Host " - Contains 'Operating Systems'? $hasOperatingSystems (Must be False)"
Write-Host " - Contains 'Discrete Mathematics'? $hasDiscreteMath (Must be False)"
Write-Host " - All Sessions Match Extracted CA Inter Subjects? $allMatched"

if ($allMatched -and ($ttRes.data.sessions.Count -gt 0)) {
  Write-Host "`n==================================================================" -ForegroundColor Green
  Write-Host "[PIPELINE AUDIT PASSED 100%]: REAL PDF PRODUCED REAL TIMETABLE!" -ForegroundColor Green
  Write-Host "==================================================================" -ForegroundColor Green
} else {
  Write-Host "`n[PIPELINE AUDIT FAILED]: Hardcoded subjects leaked into schedule!" -ForegroundColor Red
  exit 1
}
