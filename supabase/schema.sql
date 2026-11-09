-- =========================================================================
-- StudyMate AI - Supabase Database Schema (Upgraded)
-- Production-ready PostgreSQL schema with Row-Level Security (RLS)
-- and Private Storage Policies for Every Student
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Students / Profiles
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    education_level TEXT DEFAULT 'Professional (CA, CS, CMA)',
    course TEXT DEFAULT 'CS Executive',
    semester TEXT DEFAULT 'Both Groups',
    institution TEXT,
    grade_or_year TEXT DEFAULT 'Student',
    target_exam TEXT DEFAULT 'Upcoming Examination',
    upcoming_exam_date DATE,
    daily_available_hours NUMERIC(4, 2) DEFAULT 4.5,
    preferred_study_time TEXT DEFAULT 'evening', -- morning, afternoon, evening, night, flexible
    break_duration_minutes INT DEFAULT 15,
    weekly_holiday TEXT DEFAULT 'Sunday',
    status TEXT DEFAULT 'active', -- active, suspended
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created in earlier migrations
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Both Groups';

-- 2. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course TEXT,
    name TEXT NOT NULL,
    code TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'BookOpen',
    total_chapters INT DEFAULT 0,
    completed_chapters INT DEFAULT 0,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Chapters (Upgraded with Independent 3-State Tracking)
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chapter_number INT DEFAULT 1,
    difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
    estimated_hours NUMERIC(4, 2) DEFAULT 3.0,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed
    study_status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
    study_completed_at TIMESTAMP WITH TIME ZONE,
    study_hours_spent NUMERIC(5, 2) DEFAULT 0,
    revision_status TEXT DEFAULT 'not_started', -- not_started, revised_once, mastered
    revision_history JSONB DEFAULT '[]'::jsonb,
    test_status TEXT DEFAULT 'not_attempted', -- not_attempted, passed, needs_improvement
    test_history JSONB DEFAULT '[]'::jsonb,
    nature TEXT DEFAULT 'theory', -- numerical, theory, practical, mixed
    is_custom BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT true,
    official_source TEXT DEFAULT 'Official Curriculum',
    syllabus_version TEXT DEFAULT '2024-2026',
    notes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Uploaded Documents
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    file_url TEXT,
    document_type TEXT NOT NULL, -- syllabus, datesheet, notes
    extraction_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    extracted_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Examinations
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    room_location TEXT,
    weightage_percentage NUMERIC(5, 2),
    preparation_level TEXT DEFAULT 'medium', -- low, medium, high
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Timetables
CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    daily_hours NUMERIC(4, 2) DEFAULT 4.0,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Study Sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    timetable_id UUID REFERENCES public.timetables(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name TEXT NOT NULL,
    subject_color TEXT DEFAULT '#6366f1',
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    chapter_title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    duration_minutes INT NOT NULL,
    session_type TEXT DEFAULT 'study', -- study, revision, mock_test, break
    status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, skipped
    difficulty TEXT DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type TEXT NOT NULL, -- study_session, chapter_deadline, revision, exam_countdown, custom
    is_completed BOOLEAN DEFAULT false,
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Study Progress
CREATE TABLE IF NOT EXISTS public.study_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_minutes_studied INT DEFAULT 0,
    chapters_completed_count INT DEFAULT 0,
    sessions_completed_count INT DEFAULT 0,
    consistency_streak_days INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, date)
);

-- 10. Saved Videos
CREATE TABLE IF NOT EXISTS public.saved_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course TEXT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name TEXT NOT NULL,
    chapter_title TEXT,
    category TEXT DEFAULT 'part_1', -- part_1, part_2, part_3, revision, practice, mock_test
    youtube_video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    channel_title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration_seconds INT DEFAULT 0,
    progress_seconds INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Notes
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course TEXT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    chapter_title TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    attachment_urls TEXT[] DEFAULT '{}',
    attachment_type TEXT DEFAULT 'none', -- image, pdf, document, none
    attachment_name TEXT,
    extracted_ocr_text TEXT,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- Row Level Security (RLS) Policies
-- Strict isolation ensuring no student can access another student's data
-- =========================================================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view and manage their own profile"
    ON public.students FOR ALL USING (auth.uid() = id);

CREATE POLICY "Students can manage their own subjects"
    ON public.subjects FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their own chapters"
    ON public.chapters FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their uploaded documents"
    ON public.uploaded_documents FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their examinations"
    ON public.examinations FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their timetables"
    ON public.timetables FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their study sessions"
    ON public.study_sessions FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their reminders"
    ON public.reminders FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their study progress"
    ON public.study_progress FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their saved videos"
    ON public.saved_videos FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their notes"
    ON public.notes FOR ALL USING (auth.uid() = student_id);

-- Storage bucket setup for private student notes & uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-notes', 'student-notes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Students can manage their own files in student-notes"
ON storage.objects FOR ALL
USING (
    bucket_id = 'student-notes' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Auto create student profile on auth signup with dynamic course and study parameters
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.students (
        id,
        email,
        full_name,
        course,
        semester,
        target_exam,
        daily_available_hours,
        status,
        onboarding_completed,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'course', 'CS Executive'),
        COALESCE(new.raw_user_meta_data->>'semester', 'Both Groups'),
        COALESCE(new.raw_user_meta_data->>'target_exam', 'Upcoming Examination'),
        COALESCE((new.raw_user_meta_data->>'daily_available_hours')::numeric, 4.5),
        'active',
        true,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        course = COALESCE(EXCLUDED.course, public.students.course),
        semester = COALESCE(EXCLUDED.semester, public.students.semester),
        target_exam = COALESCE(EXCLUDED.target_exam, public.students.target_exam),
        status = COALESCE(public.students.status, 'active'),
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security Definer function to fetch all registered students for authorized administrative review
CREATE OR REPLACE FUNCTION public.get_all_students_for_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    education_level TEXT,
    course TEXT,
    institution TEXT,
    grade_or_year TEXT,
    semester TEXT,
    target_exam TEXT,
    upcoming_exam_date DATE,
    daily_available_hours NUMERIC,
    status TEXT,
    onboarding_completed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.email,
        s.full_name,
        s.avatar_url,
        s.education_level,
        s.course,
        s.institution,
        s.grade_or_year,
        s.semester,
        s.target_exam,
        s.upcoming_exam_date,
        s.daily_available_hours,
        COALESCE(s.status, 'active') AS status,
        s.onboarding_completed,
        s.created_at,
        s.updated_at
    FROM public.students s
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_all_students_for_admin() TO anon, authenticated, service_role;

-- Security Definer function to toggle student status (active / suspended)
CREATE OR REPLACE FUNCTION public.update_student_status_for_admin(
    p_student_id UUID,
    p_status TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.students
    SET status = p_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_student_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.update_student_status_for_admin(UUID, TEXT) TO anon, authenticated, service_role;

-- RLS Policy allowing verified administrators to view all students
DROP POLICY IF EXISTS "Admins can view all student records" ON public.students;
CREATE POLICY "Admins can view all student records"
    ON public.students FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.id = auth.uid() AND admin_users.role = 'admin'
        )
    );

-- =========================================================================
-- 11. Admin Role & Governance Tables (Strict Role Separation & RLS)
-- =========================================================================

-- Admin Users Table (Isolated from public signups)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and manage admin_users"
    ON public.admin_users FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin'));

-- Platform Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_course TEXT NOT NULL DEFAULT 'all',
    priority TEXT NOT NULL DEFAULT 'normal', -- normal, important, urgent
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    author_email TEXT
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Students can read active announcements
CREATE POLICY "Students can read active announcements"
    ON public.announcements FOR SELECT
    USING (is_active = true);

-- Only admins can insert, update, or delete announcements
CREATE POLICY "Only admins can modify announcements"
    ON public.announcements FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin'));

-- Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    target_entity TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view and record audit logs"
    ON public.admin_audit_logs FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin'));

-- Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_config',
    platform_name TEXT NOT NULL DEFAULT 'StudyMate AI',
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    ai_engine_enabled BOOLEAN NOT NULL DEFAULT true,
    allow_registrations BOOLEAN NOT NULL DEFAULT true,
    system_notice_banner TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform settings"
    ON public.platform_settings FOR SELECT
    USING (true);

CREATE POLICY "Only admins can update platform settings"
    ON public.platform_settings FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin'));

-- 14. Support Tickets (Phase 9 & 12)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'study_guidance', -- technical, study_guidance, timetable, syllabus, general
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view and create their own tickets"
    ON public.support_tickets FOR ALL
    USING (auth.uid() = student_id);

CREATE POLICY "Admins can view and manage all support tickets"
    ON public.support_tickets FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin'));

-- 15. Verified Curriculum Versions (Phase 2 & 12)
CREATE TABLE IF NOT EXISTS public.curriculum_versions (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    exam_body TEXT NOT NULL,
    syllabus_version TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT true,
    effective_years TEXT NOT NULL DEFAULT '2024-2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.curriculum_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for curriculum versions"
    ON public.curriculum_versions FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage curriculum versions"
    ON public.curriculum_versions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND role = 'admin'));

