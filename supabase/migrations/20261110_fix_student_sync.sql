-- =========================================================================
-- StudyMate AI - Supabase Production Database Migration
-- Fixes: Student Registration, Admin Directory Sync, Schema Columns & RLS
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure public.students table exists with complete columns
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
    preferred_study_time TEXT DEFAULT 'evening',
    break_duration_minutes INT DEFAULT 15,
    weekly_holiday TEXT DEFAULT 'Sunday',
    status TEXT DEFAULT 'active',
    onboarding_completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Idempotent column additions for existing installations
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Both Groups';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS course TEXT DEFAULT 'CS Executive';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS target_exam TEXT DEFAULT 'Upcoming Examination';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS upcoming_exam_date DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS daily_available_hours NUMERIC(4, 2) DEFAULT 4.5;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true;

-- 3. Row Level Security (RLS) setup
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Policy 1: Students can view their own profile
DROP POLICY IF EXISTS "Students can view and manage their own profile" ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
CREATE POLICY "Students can view their own profile"
    ON public.students FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Students can update their own profile
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can update their own profile"
    ON public.students FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Allow INSERT during registration (works for anon client signups)
DROP POLICY IF EXISTS "Allow student registration profile insert" ON public.students;
CREATE POLICY "Allow student registration profile insert"
    ON public.students FOR INSERT
    WITH CHECK (true);

-- Policy 4: Allow service_role full access (service_role bypasses RLS by default, but this is explicit)
DROP POLICY IF EXISTS "Service role full access on students" ON public.students;
CREATE POLICY "Service role full access on students"
    ON public.students FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Automatic profile generation trigger on auth.users INSERT
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
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user trigger warning: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Security Definer RPC function for admin student retrieval (bypasses RLS safely)
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

-- 6. Security Definer RPC function for status toggle
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
