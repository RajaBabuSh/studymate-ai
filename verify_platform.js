const http = require("http");
const { spawn } = require("child_process");

const PORT = 3005; // Use an isolated port
const BASE_URL = `http://127.0.0.1:${PORT}`;

const ROUTES_TO_TEST = [
  // Landing & Auth
  "/",
  "/login",
  "/register",
  "/onboarding",

  // Student Features
  "/dashboard",
  "/exam-planner",
  "/timetable",
  "/subjects",
  "/tests",
  "/videos",
  "/reminders",
  "/notes",
  "/progress",

  // Admin Portal Routes
  "/admin/login",
  "/admin/dashboard",
  "/admin/students",
  "/admin/courses",
  "/admin/subjects",
  "/admin/chapters",
  "/admin/videos",
  "/admin/announcements",
  "/admin/settings",
];

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchUrl(`${BASE_URL}/`);
      if (res.statusCode === 200) return true;
    } catch {
      // wait 1 second
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

async function runVerification() {
  console.log(`Starting StudyMate AI Next.js production server on port ${PORT}...`);
  const server = spawn("cmd.exe", ["/c", `npx next start -p ${PORT}`], {
    cwd: __dirname,
    stdio: "pipe",
    env: { ...process.env, PORT: String(PORT) },
  });

  server.stdout.on("data", (d) => process.stdout.write(`[SERVER] ${d}`));
  server.stderr.on("data", (d) => process.stderr.write(`[SERVER ERR] ${d}`));

  try {
    const isReady = await waitForServer();
    if (!isReady) {
      throw new Error("Server failed to respond within timeout.");
    }
    console.log("Server is online and responding! Beginning verification tests...\n");

    let passedCount = 0;
    let failedCount = 0;

    // 1. Verify GET routes
    console.log("=== 1. VERIFYING ALL STUDENT & ADMIN PAGES ===");
    for (const route of ROUTES_TO_TEST) {
      const start = Date.now();
      try {
        const res = await fetchUrl(`${BASE_URL}${route}`);
        const duration = Date.now() - start;
        if (res.statusCode === 200) {
          console.log(`✓ [200 OK] ${route} (${duration}ms)`);
          passedCount++;
        } else {
          console.error(`✗ [${res.statusCode}] ${route}`);
          failedCount++;
        }
      } catch (err) {
        console.error(`✗ [ERROR] ${route}: ${err.message}`);
        failedCount++;
      }
    }

    // 2. Verify Admin Login API Authentication
    console.log("\n=== 2. VERIFYING ADMIN AUTHENTICATION API ===");

    // Test 2a: Empty payload -> 400
    try {
      const res = await fetchUrl(`${BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.statusCode === 400) {
        console.log("✓ Empty credentials properly rejected with 400 Bad Request");
        passedCount++;
      } else {
        console.error(`✗ Expected 400 but got ${res.statusCode}`);
        failedCount++;
      }
    } catch (e) {
      console.error("✗ Test 2a failed:", e.message);
      failedCount++;
    }

    // Test 2b: Student credentials rejected -> 403 Forbidden
    try {
      const res = await fetchUrl(`${BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@example.com", password: "Password123!" }),
      });
      if (res.statusCode === 403) {
        console.log("✓ Non-admin student email properly rejected with 403 Forbidden");
        passedCount++;
      } else {
        console.error(`✗ Expected 403 but got ${res.statusCode}`);
        failedCount++;
      }
    } catch (e) {
      console.error("✗ Test 2b failed:", e.message);
      failedCount++;
    }

    // Test 2c: Wrong admin password -> 401 Unauthorized
    try {
      const res = await fetchUrl(`${BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@studymate.ai", password: "WrongPassword999" }),
      });
      if (res.statusCode === 401) {
        console.log("✓ Wrong admin password properly rejected with 401 Unauthorized");
        passedCount++;
      } else {
        console.error(`✗ Expected 401 but got ${res.statusCode}`);
        failedCount++;
      }
    } catch (e) {
      console.error("✗ Test 2c failed:", e.message);
      failedCount++;
    }

    // Test 2d: Correct admin credentials -> 200 OK + Admin Profile
    try {
      const res = await fetchUrl(`${BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@studymate.ai", password: "Admin@StudyMate2026!" }),
      });
      const data = JSON.parse(res.body);
      if (res.statusCode === 200 && data.success && data.admin.role === "admin") {
        console.log("✓ Valid admin credentials authenticated with 200 OK & role='admin'");
        passedCount++;
      } else {
        console.error(`✗ Expected 200 with admin profile but got:`, res.statusCode, data);
        failedCount++;
      }
    } catch (e) {
      console.error("✗ Test 2d failed:", e.message);
      failedCount++;
    }

    console.log("\n=============================================");
    console.log(`VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED.`);
    console.log("=============================================");

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    console.log("Shutting down test server...");
    spawn("taskkill", ["/pid", server.pid, "/f", "/t"]);
  }
}

runVerification();
