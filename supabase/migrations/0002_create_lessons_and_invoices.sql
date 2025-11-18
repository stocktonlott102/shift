-- =====================================================
-- Migration: Add Lesson Calendar and Invoicing System
-- Created: 2025-11-18
-- Description:
--   1. Add hourly_rate to clients table
--   2. Create lessons table with status tracking
--   3. Create invoices table linked to lessons
--   4. Add RLS policies for security
--   5. Create enums for status fields
--   6. Add triggers for updated_at
-- =====================================================

-- =====================================================
-- STEP 1: Create ENUM types for type safety
-- =====================================================

CREATE TYPE lesson_status AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'No Show');
CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Overdue', 'Canceled');

-- =====================================================
-- STEP 2: Add hourly_rate to existing clients table
-- =====================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC NOT NULL DEFAULT 75.00;

COMMENT ON COLUMN clients.hourly_rate IS 'Standard hourly rate for this client in USD';

-- =====================================================
-- STEP 3: Create lessons table
-- =====================================================

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,

    -- Lesson Details
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT, -- Which rink or ice surface

    -- Financial Tracking (Snapshot of rate at time of booking)
    rate_at_booking NUMERIC NOT NULL,
    duration_hours NUMERIC GENERATED ALWAYS AS
        (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) STORED,

    -- Status Tracking
    status lesson_status NOT NULL DEFAULT 'Scheduled',
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraints
    CONSTRAINT end_after_start CHECK (end_time > start_time),
    CONSTRAINT positive_rate CHECK (rate_at_booking > 0)
);

-- Create indexes for performance
CREATE INDEX idx_lessons_coach_id ON lessons(coach_id);
CREATE INDEX idx_lessons_client_id ON lessons(client_id);
CREATE INDEX idx_lessons_start_time ON lessons(start_time);
CREATE INDEX idx_lessons_status ON lessons(status);

-- Add comments for documentation
COMMENT ON TABLE lessons IS 'Individual lesson sessions booked by coaches for clients';
COMMENT ON COLUMN lessons.rate_at_booking IS 'Hourly rate at time of booking (snapshot from clients.hourly_rate)';
COMMENT ON COLUMN lessons.duration_hours IS 'Calculated duration in hours (auto-generated)';
COMMENT ON COLUMN lessons.status IS 'Current status of the lesson';

-- =====================================================
-- STEP 4: Create invoices table
-- =====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL UNIQUE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Invoice Details
    invoice_number TEXT UNIQUE NOT NULL,
    amount_due NUMERIC NOT NULL,
    due_date DATE NOT NULL,

    -- Payment Tracking
    payment_status payment_status NOT NULL DEFAULT 'Pending',
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraints
    CONSTRAINT positive_amount CHECK (amount_due > 0)
);

-- Create indexes for performance
CREATE INDEX idx_invoices_coach_id ON invoices(coach_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_lesson_id ON invoices(lesson_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Add comments for documentation
COMMENT ON TABLE invoices IS 'Invoices generated for lesson bookings';
COMMENT ON COLUMN invoices.invoice_number IS 'Human-readable invoice number (e.g., INV-2025-001)';
COMMENT ON COLUMN invoices.amount_due IS 'Total amount due for the lesson (rate * duration)';

-- =====================================================
-- STEP 5: Create function for auto-updating updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- STEP 6: Create triggers for updated_at
-- =====================================================

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 7: Create function to generate invoice numbers
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    year := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year || '-%';

    -- Format: INV-2025-001
    invoice_num := 'INV-' || year || '-' || LPAD(sequence_num::TEXT, 3, '0');

    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 8: Enable Row Level Security
-- =====================================================

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 9: Create RLS Policies for lessons table
-- =====================================================

-- Coaches can insert their own lessons
CREATE POLICY "Coaches can insert their own lessons"
    ON lessons FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = coach_id);

-- Coaches can view their own lessons
CREATE POLICY "Coaches can view their own lessons"
    ON lessons FOR SELECT
    TO authenticated
    USING (auth.uid() = coach_id);

-- Coaches can update their own lessons
CREATE POLICY "Coaches can update their own lessons"
    ON lessons FOR UPDATE
    TO authenticated
    USING (auth.uid() = coach_id);

-- Coaches can delete their own lessons
CREATE POLICY "Coaches can delete their own lessons"
    ON lessons FOR DELETE
    TO authenticated
    USING (auth.uid() = coach_id);

-- =====================================================
-- STEP 10: Create RLS Policies for invoices table
-- =====================================================

-- Coaches can insert their own invoices
CREATE POLICY "Coaches can insert their own invoices"
    ON invoices FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = coach_id);

-- Coaches can view their own invoices
CREATE POLICY "Coaches can view their own invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (auth.uid() = coach_id);

-- Coaches can update their own invoices
CREATE POLICY "Coaches can update their own invoices"
    ON invoices FOR UPDATE
    TO authenticated
    USING (auth.uid() = coach_id);

-- Coaches can delete their own invoices
CREATE POLICY "Coaches can delete their own invoices"
    ON invoices FOR DELETE
    TO authenticated
    USING (auth.uid() = coach_id);

-- =====================================================
-- VERIFICATION QUERIES (commented out - for reference)
-- =====================================================

-- Check tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('lessons', 'invoices');

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('lessons', 'invoices');

-- Check policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('lessons', 'invoices');

-- =====================================================
-- END OF MIGRATION
-- =====================================================
