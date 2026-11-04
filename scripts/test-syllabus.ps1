# Syllabus Extraction Test
Add-Type -AssemblyName 'System.Net.Http'

$sylLines = @(
  "SYLLABUS DOCUMENT - CA INTERMEDIATE 2026",
  "Subject: Corporate and Other Laws",
  "Chapter 1: Preliminary and Incorporation of Company",
  "Chapter 2: Prospectus and Allotment of Securities",
  "Chapter 3: Share Capital and Debentures",
  "Chapter 4: Management and Administration",
  "Subject: Advanced Accounting",
  "Chapter 1: Accounting Standards (AS 1 to AS 29)",
  "Chapter 2: Financial Statements of Companies",
  "Chapter 3: Buyback of Securities",
  "Chapter 4: Amalgamation of Companies"
)

$stream = "BT /F1 12 Tf 50 750 Td (" + ($sylLines -join ") Tj T* (") + ") Tj ET"
$pdfContent = "%PDF-1.4`n1 0 obj`n<< /Type /Catalog /Pages 2 0 R >>`nendobj`n2 0 obj`n<< /Type /Pages /Kids [3 0 R] /Count 1 >>`nendobj`n3 0 obj`n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`nendobj`n4 0 obj`n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`nendobj`n5 0 obj`n<< /Length $($stream.Length) >>`nstream`n$stream`nendstream`nendobj`nxref`n0 6`n0000000000 65535 f `n0000000009 00000 n `n0000000058 00000 n `n0000000115 00000 n `n0000000214 00000 n `n0000000293 00000 n `ntrailer`n<< /Size 6 /Root 1 0 R >>`nstartxref`n500`n%%EOF"

$tempPdf = "$PSScriptRoot\temp_syllabus.pdf"
[System.IO.File]::WriteAllText($tempPdf, $pdfContent, [System.Text.Encoding]::ASCII)

$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent
$fileBytes = [System.IO.File]::ReadAllBytes($tempPdf)
$byteContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$fileBytes)
$byteContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse('application/pdf')
$content.Add($byteContent, 'file', 'CA_Inter_Syllabus.pdf')
$content.Add((New-Object System.Net.Http.StringContent('syllabus')), 'documentType')
$content.Add((New-Object System.Net.Http.StringContent('ca-intermediate')), 'studentCourse')

$res = $client.PostAsync('http://localhost:3000/api/ai/extract', $content).Result
$body = $res.Content.ReadAsStringAsync().Result
$json = $body | ConvertFrom-Json

Write-Host "Syllabus Extraction Success: $($json.success)"
Write-Host "Subjects Found: $($json.data.subjects.Count)"

foreach ($s in $json.data.subjects) {
  Write-Host "`nSubject: $($s.name)"
  foreach ($c in $s.chapters) {
    Write-Host "  Chapter $($c.chapter_number): $($c.title) (Nature: $($c.nature))"
  }
}

if (Test-Path $tempPdf) { Remove-Item $tempPdf }
