$routes = @(
    '/roadmap',
    '/admin/curriculum-audit',
    '/api/admin/audit-curriculum',
    '/dashboard',
    '/exam-planner',
    '/subjects',
    '/tests',
    '/timetable'
)

Write-Host "================================================="
Write-Host "VERIFYING STUDYMATE AI PRODUCTION SERVER ROUTES"
Write-Host "================================================="

$allOk = $true
foreach ($r in $routes) {
    try {
        $url = "http://localhost:3000" + $r
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        if ($resp.StatusCode -eq 200) {
            Write-Host ("  [PASS] (HTTP 200) " + $r)
        } else {
            Write-Host ("  [FAIL] (HTTP " + $resp.StatusCode + ") " + $r)
            $allOk = $false
        }
    } catch {
        Write-Host ("  [FAIL] " + $r + " : " + $_.Exception.Message)
        $allOk = $false
    }
}

Write-Host "================================================="
if ($allOk) {
    Write-Host "ALL PRODUCTION ROUTES VERIFIED WITH HTTP 200 OK!"
} else {
    Write-Host "SOME ROUTES FAILED VERIFICATION!"
    exit 1
}
