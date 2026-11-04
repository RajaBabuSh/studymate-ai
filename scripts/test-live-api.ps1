$resp = Invoke-RestMethod -Uri 'http://localhost:3000/api/admin/audit-curriculum' -Method Get
Write-Host ("Total Subjects: " + $resp.data.totalSubjects)
Write-Host ("Total Lessons: " + $resp.data.totalPdfChapters)
Write-Host ("Total Verified: " + $resp.data.totalChaptersVerified)
Write-Host ("Accuracy: " + $resp.data.overallAccuracyPct + "%")
Write-Host ("Is Fully Verified: " + $resp.data.isFullyVerified)

Write-Host "`nSubject breakdown:"
foreach ($s in $resp.data.subjects) {
    Write-Host ("  Paper " + $s.paperNumber + " (" + $s.subjectName + "): " + $s.totalPdfChapters + " chapters - Status: " + $s.status)
}
