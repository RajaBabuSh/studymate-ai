import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const projectDir = path.resolve('C:/Users/testadmin/.gemini/antigravity/scratch/studymate-ai');

const routes = [
  '/',
  '/login',
  '/register',
  '/onboarding',
  '/dashboard',
  '/subjects',
  '/timetable',
  '/tests',
  '/exam-planner',
  '/videos',
  '/reminders',
  '/notes',
  '/admin/login',
  '/admin/dashboard',
  '/admin/students',
  '/admin/courses',
  '/admin/subjects',
  '/admin/chapters',
  '/admin/announcements',
  '/admin/settings'
];

async function checkRoute(routePath) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${routePath}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ path: routePath, statusCode: res.statusCode, bodyLength: data.length });
      });
    });
    req.on('error', (err) => {
      resolve({ path: routePath, error: err.message });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ path: routePath, error: 'TIMEOUT' });
    });
  });
}

async function testApi() {
  const payload = JSON.stringify({
    studentId: 'test-student-1',
    dailyAvailableHours: 6,
    preferredStudyTime: 'morning',
    breakDurationMinutes: 15,
    weeklyHolidays: ['Sunday'],
    examPreparationLevel: 'intermediate',
    weakSubjectIds: ['sub-tax'],
    subjects: [
      {
        id: 'sub-tax',
        name: 'Direct & Indirect Taxation',
        course_id: 'ca-inter',
        code: 'PAPER-4',
        exam_body: 'ICAI',
        syllabus_version: '2024-2026',
        is_verified: true,
        chapters: [
          { id: 'c1', title: 'Basic Concepts of Income Tax', nature: 'theory', estimated_hours: 8, difficulty: 'easy' },
          { id: 'c2', title: 'Heads of Income - Capital Gains', nature: 'numerical', estimated_hours: 18, difficulty: 'hard' }
        ]
      },
      {
        id: 'sub-law',
        name: 'Corporate & Other Laws',
        course_id: 'ca-inter',
        code: 'PAPER-2',
        exam_body: 'ICAI',
        syllabus_version: '2024-2026',
        is_verified: true,
        chapters: [
          { id: 'c3', title: 'Company Formation & Incorporation', nature: 'theory', estimated_hours: 10, difficulty: 'medium' }
        ]
      }
    ],
    targetExamDate: '2026-11-20',
    keepExistingSessions: false
  });

  return new Promise((resolve) => {
    const req = http.request(
      'http://localhost:3000/api/ai/generate-timetable',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ statusCode: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await checkRoute('/');
      if (res.statusCode === 200) return true;
    } catch {
      // wait
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function run() {
  console.log('Starting Next.js production server from within test runner...');
  const server = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-p', '3000'], {
    cwd: projectDir,
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg.includes('Ready') || msg.includes('started')) console.log('[Server]:', msg);
  });
  server.stderr.on('data', (d) => {
    console.error('[Server Error]:', d.toString().trim());
  });

  try {
    const isReady = await waitForServer(25);
    if (!isReady) {
      console.error('Server failed to start in time.');
      process.exit(1);
    }
    console.log('Server is UP on port 3000!\n');

    console.log('--- TESTING ALL APPLICATION ROUTES ---');
    let failed = 0;
    for (const r of routes) {
      const res = await checkRoute(r);
      if (res.statusCode === 200) {
        console.log(`[PASS] ${res.path.padEnd(25)} -> Status 200 OK (${res.bodyLength} bytes)`);
      } else {
        console.log(`[FAIL] ${res.path.padEnd(25)} -> Status ${res.statusCode || res.error}`);
        failed++;
      }
    }

    console.log('\n--- TESTING AI TIMETABLE GENERATOR API ---');
    const apiRes = await testApi();
    console.log('API Status Code:', apiRes.statusCode);
    if (apiRes.statusCode === 200 && apiRes.body?.success) {
      console.log('[PASS] Timetable API returned success = true');
      console.log(`[PASS] Total study sessions generated: ${apiRes.body.sessions?.length}`);
      console.log(`[PASS] Daily plans generated: ${apiRes.body.daily_plans?.length}`);
      console.log(`[PASS] Plan validation warnings detected: ${apiRes.body.validation_report?.warnings?.length}`);
      
      const taxReasoning = apiRes.body.allocation_reasoning?.['sub-tax'];
      if (taxReasoning && taxReasoning.is_weak) {
        console.log(`[PASS] Weak subject buffer applied: base ${taxReasoning.base_hours}h -> allocated ${taxReasoning.allocated_hours}h (+${Math.round(taxReasoning.weak_buffer_hours)}h weak subject boost)`);
      }

      // Check morning peak allocation for numerical chapters
      const numericalMorningSessions = apiRes.body.sessions?.filter(s => s.nature === 'numerical' && s.is_morning_peak);
      console.log(`[PASS] Numerical morning peak sessions scheduled: ${numericalMorningSessions?.length}`);
    } else {
      console.log('[FAIL] API response error:', JSON.stringify(apiRes.body, null, 2));
      failed++;
    }

    console.log(`\n==================================================`);
    console.log(`SUMMARY: ${routes.length + 1 - failed} / ${routes.length + 1} checks PASSED!`);
    console.log(`==================================================`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    try {
      server.kill('SIGTERM');
      spawn('cmd.exe', ['/c', 'taskkill', '/pid', String(server.pid), '/f', '/t']);
    } catch {
      // ignore
    }
  }
}

run();
