$bodyObj = @{
  studentId = 'student-validation-test'
  preferences = @{
    daily_available_hours = 2
    preferred_study_time = 'evening'
    break_duration_minutes = 15
    weekly_holiday = 'Sunday'
    preparation_level = 'intermediate'
  }
  subjects = @(
    @{
      id = 'sub-tax'
      name = 'Direct Taxation'
      code = 'PAPER-4'
      is_weak = $true
      chapters = @(
        @{ id = 'c1'; title = 'Basic Tax'; nature = 'theory'; estimated_hours = 4; difficulty = 'easy' }
      )
    }
  )
  examinations = @()
  keepExistingSessions = $true
  existingSessions = @(
    @{
      id = 'ex-sess-1'
      student_id = 'student-validation-test'
      timetable_id = 'tt-existing'
      subject_id = 'sub-tax'
      subject_name = 'Direct Taxation'
      subject_color = '#6366f1'
      chapter_title = 'Marathon Problem Solving'
      date = '2026-11-06'
      start_time = '08:00'
      end_time = '16:00'
      duration_minutes = 480
      session_type = 'study'
      status = 'scheduled'
      created_at = '2026-11-01'
    }
  )
}

$jsonPayload = $bodyObj | ConvertTo-Json -Depth 6
$res = Invoke-RestMethod -Uri 'http://localhost:3000/api/ai/generate-timetable' -Method Post -Body $jsonPayload -ContentType 'application/json'

Write-Host "Sessions total count:" $res.data.sessions.Count
Write-Host "First session ID:" $res.data.sessions[0].id
Write-Host "Validation warnings:" ($res.data.validationWarnings | ConvertTo-Json -Depth 3)
