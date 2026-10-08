-- ====================================================================
-- P W HOLDINGS EMPLOYEE MANAGEMENT SYSTEM - COMPLETE SUPABASE SCHEMA
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT DEFAULT 'IT',
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    initials TEXT,
    status TEXT DEFAULT 'Working',
    role TEXT DEFAULT 'Employee',
    emp_code TEXT,
    designation TEXT,
    card_designation TEXT,
    employment_type TEXT DEFAULT 'Full Time',
    dob DATE,
    gender TEXT,
    nic TEXT,
    address TEXT,
    phone TEXT,
    personal_email TEXT,
    date_joined DATE DEFAULT CURRENT_DATE,
    photo_url TEXT,
    skills TEXT,
    school_attended TEXT,
    tshirt_size TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on users (for backward compatibility if table exists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emp_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS card_designation TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full Time';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nic TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS personal_email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_joined DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_attended TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tshirt_size TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- 2. LEAVE BALANCES TABLE
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    total_days NUMERIC(5, 2) DEFAULT 21.00,
    used_days NUMERIC(5, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_leave_balances_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_user_id ON public.leave_balances(user_id);

-- 3. DAILY WORK ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.daily_work_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    work_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_work_entries_user_date ON public.daily_work_entries(user_id, entry_date);

-- 4. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    day_of_week TEXT,
    start_time TIME,
    end_time TIME,
    special_session TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'Pending',
    reason TEXT,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status ON public.leave_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

-- 5. EMPLOYEE ACTIVITY TABLE
CREATE TABLE IF NOT EXISTS public.employee_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_activity_user_created ON public.employee_activity(user_id, created_at DESC);

-- 6. EMPLOYEE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    file_type TEXT DEFAULT 'application/pdf',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_user_id ON public.employee_documents(user_id);

-- 7. BIRTHDAY REMINDER LOGS TABLE
CREATE TABLE IF NOT EXISTS public.birthday_reminder_logs (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    recipient TEXT NOT NULL,
    channel TEXT NOT NULL, -- 'email' | 'whatsapp'
    sent_year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_birthday_reminder UNIQUE (employee_id, recipient, channel, sent_year)
);

CREATE INDEX IF NOT EXISTS idx_birthday_logs_emp_year ON public.birthday_reminder_logs(employee_id, sent_year);

-- 8. AUTH OTPS TABLE
CREATE TABLE IF NOT EXISTS public.auth_otps (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    type TEXT NOT NULL, -- 'register' | 'reset-password'
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_email_type ON public.auth_otps(email, type);

-- 9. EMAIL EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.email_events (
    id BIGSERIAL PRIMARY KEY,
    recipient TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_events_status_next ON public.email_events(status, next_attempt_at);
