# StudyMate AI – Intelligent Student Study Companion & EdTech SaaS Platform

An enterprise-grade AI-powered student study management system, examination teacher intelligence engine, and administrative SaaS portal built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## 🌟 Architecture & Platform Capabilities

### 1. Premium Website Redesign (`/`)
- **Visual Aesthetic**: Deep navy and violet SaaS palette (`#070a13`, `#0b0f19`, deep violet and indigo ambient glows).
- **Interactive AI Timetable Simulator**: Prospective students can dynamically select their curriculum (CA Intermediate, CS Executive, B.Com, Class 12), daily hours, and alert peak, immediately visualizing adaptive study slots with morning numerical sessions and evening concepts.
- **Interactive Dashboard Preview**: Live tab switching between Today's Targets, 7-Day Consistency Mastery, and Chapter Intelligence strategies.
- **Curriculum Shelves & Features Grid**: Full feature breakdown including the AI Exam Target Planner, Numerical vs Theory classification, Chapter practice tests, and Peaceful focus timer.
- **Accordion FAQ & SaaS Footer**: Clear student guidance and discreet administrative link.

---

### 2. Dedicated Administrator Portal & Role Separation (`/admin/*`)
- **Restricted Access Control (`/admin/login`)**:
  - Isolated from student signups with clear administrative warning.
  - Role-based access control (`role: "admin"` vs `role: "student"`).
  - Server-side verification API (`/api/admin/login`).
  - Pre-provisioned administrator credentials:
    - **Email**: `admin@studymate.ai`
    - **Password**: `Admin@StudyMate2026!`
  - Strict redirects: Non-admin users or logged-out requests to `/admin/*` are immediately redirected to `/admin/login`.
- **Administrative Layout Shell (`AdminAppShell`)**:
  - Dedicated administrative sidebar and header with real-time AI cluster status indicator.
  - Fast-switching link to live Student Portal.

---

### 3. Administrator Modules & Platform Governance

| Module Route | Purpose | Key Capabilities |
| :--- | :--- | :--- |
| **`/admin/dashboard`** | Platform Overview | Aggregates registered students, active accounts, timetables generated, curriculum courses, study hours, and real-time audit logs. |
| **`/admin/students`** | Student Directory & Controls | Search and filter students by course, toggle account status (Active / Suspended). **Strict Privacy**: Academic metadata only; student notes and document uploads remain private and encrypted. |
| **`/admin/courses`** | Curriculum Catalog | Add, edit, toggle active status, and manage curriculum qualifications (CA Foundation, CA Inter, CA Final, CS Exec, B.Com, BBA, BCA, Class 10/12). |
| **`/admin/subjects`** | Curriculum Subjects | Manage official subjects per course, paper codes, theme colors, and chapter counts. |
| **`/admin/chapters`** | Chapter Intelligence Tuning | Classify chapters by Nature (Numerical, Theory, Practical, Mixed), Length (Short, Medium, Long), and Exam Weightage with circadian slot allocation. |
| **`/admin/videos`** | Curated Video Library | Index verified YouTube lectures and marathon revision sessions mapped to course and subject. |
| **`/admin/announcements`**| Platform Broadcasts | Publish targeted announcements by course or platform-wide with priority flags (Normal, Important, Urgent), instantly displayed on student dashboards and notification bells. |
| **`/admin/settings`** | Platform Configuration & Audit | Toggle maintenance mode, enable/disable AI engines, edit session banner notices, and review complete tamper-evident audit logs. |

---

### 4. Advanced AI Study & Teacher Engine (Student Platform)

- **AI Exam Target Planner (`/exam-planner`)**:
  - Calculates remaining days to exam and computes daily study volume.
  - Automatically allocates a 40% time buffer to student-identified weak subjects.
  - **Red Validation Alerts**: Flags unrealistic schedules if required preparation hours exceed available daily study time.
- **Numerical vs Theory Chapter Classification (`/subjects`)**:
  - High-performance algorithm classifies each chapter into `numerical`, `theory`, `practical`, or `mixed`.
  - Schedules intensive numerical practice during morning alertness peaks.
  - Assigns structured active recall, short notes, and spaced repetition (3-day and 7-day) to theory topics.
- **Smart Practice Tests with Automated Scoring (`/tests`)**:
  - Generates chapter-specific diagnostic tests featuring numerical drills, MCQs, and case studies.
  - Provides diagnostic feedback, master step breakdown, and performance tracking.
- **Peaceful Study Timer (`StudyTimerModal`)**:
  - Focus study companion with optional Quiet Mode that automatically logs study minutes and marks syllabus progress.
- **Evening Reflection Check-in (`DailyAdjustmentModal`)**:
  - 60-second reflection modal to report fatigue, mastery, or backlog, enabling dynamic schedule adjustment.

---

### 5. Multi-Step Onboarding & Complete Account Isolation (`/onboarding`)

- **5-Step Onboarding Wizard**:
  - Profile setup (Education level, institution, target exam).
  - Course selection across professional and academic tiers.
  - Dynamic subject curation.
  - Study preferences (hours, morning/evening preference, break length, weekly holiday).
- **Absolute Privacy & Isolation**:
  - Fully partitioned under individual authenticated student IDs.
  - Supabase PostgreSQL Row-Level Security (RLS) policies.
  - Separate Guest Demo Sandbox (`studymate_guest_*`).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2.15 (App Router, Server Actions & API Routes)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS with custom Deep Navy/Violet palette and glassmorphism
- **Icons & Visuals**: Lucide React, Canvas Confetti
- **Database & Storage**: Supabase PostgreSQL with Row-Level Security (RLS)
- **AI & Vision OCR**: Multimodal Server-side AI (Gemini Vision API)

---

## 🚀 Getting Started

```bash
cd C:\Users\testadmin\.gemini\antigravity\scratch\studymate-ai

# 1. Install dependencies (if needed)
npm install

# 2. Run TypeScript check & Lint
npx tsc --noEmit
npm run lint

# 3. Production Build
npm run build

# 4. Start Production Server
npm run start
# Server listens on http://localhost:3000
```

---

## 🔐 Credentials & Access Portals

| Portal | URL | Credentials |
| :--- | :--- | :--- |
| **Student Platform** | `http://localhost:3000/login` | Register new account or click **"Launch Demo"** |
| **Administrator Console** | `http://localhost:3000/admin/login` | **Email**: `admin@studymate.ai`<br>**Password**: `Admin@StudyMate2026!` |

---

## 📁 Supabase Database Schema

The production PostgreSQL schema is located in `supabase/schema.sql`. It includes:
1. `students` table with RLS
2. `subjects`, `chapters`, `examinations`, `study_sessions`, `reminders`, `study_progress`, `saved_videos`, `notes`, `uploaded_documents`
3. `admin_users`, `announcements`, `admin_audit_logs`, `platform_settings` tables with strict administrator RLS policies.
4. Private bucket storage policies for student notes.
