$routes = @(
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/dashboard',
    '/subjects',
    '/timetable',
    '/tasks',
    '/progress',
    '/notes',
    '/support',
    '/settings'
)

Write-Host "================================================="
Write-Host "VERIFYING STUDYMATE AI SIMPLIFIED PLATFORM ROUTES"
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
    Write-Host "ALL 12 SIMPLIFIED PRODUCT ROUTES VERIFIED WITH HTTP 200 OK!"
} else {
    Write-Host "SOME ROUTES FAILED VERIFICATION!"
    exit 1
}
