-- Migration: Lesson Types Feature
-- Created: 2025-12-16
-- Description: Create lesson_types table, lesson_participants junction table, and update lessons table

-- ============================================================================
-- PART 1: Create lesson_types table
-- ============================================================================

CREATE TABLE lesson_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate > 0 AND hourly_rate <= 999),
  color TEXT NOT NULL DEFAULT '#3B82F6',
  title_template TEXT NOT NULL DEFAULT '{client_names}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique lesson type names per coach
  UNIQUE(coach_id, name)
);

-- Enable RLS
ALTER TABLE lesson_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_types
CREATE POLICY "Coaches can view own lesson types"
  ON lesson_types FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create own lesson types"
  ON lesson_types FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own lesson types"
  ON lesson_types FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own lesson types"
  ON lesson_types FOR DELETE
  USING (auth.uid() = coach_id);

-- Index for faster lookups
CREATE INDEX idx_lesson_types_coach_id ON lesson_types(coach_id);
CREATE INDEX idx_lesson_types_is_active ON lesson_types(coach_id, is_active);

-- ============================================================================
-- PART 2: Create lesson_participants junction table
-- ============================================================================

CREATE TABLE lesson_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount_owed DECIMAL(10,2) NOT NULL CHECK (amount_owed >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure a client can only be added once per lesson
  UNIQUE(lesson_id, client_id)
);

-- Enable RLS
ALTER TABLE lesson_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_participants
CREATE POLICY "Coaches can view own lesson participants"
  ON lesson_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_participants.lesson_id
      AND lessons.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create own lesson participants"
  ON lesson_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_participants.lesson_id
      AND lessons.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update own lesson participants"
  ON lesson_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_participants.lesson_id
      AND lessons.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete own lesson participants"
  ON lesson_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_participants.lesson_id
      AND lessons.coach_id = auth.uid()
    )
  );

-- Indexes for faster lookups
CREATE INDEX idx_lesson_participants_lesson_id ON lesson_participants(lesson_id);
CREATE INDEX idx_lesson_participants_client_id ON lesson_participants(client_id);

-- ============================================================================
-- PART 3: Update lessons table
-- ============================================================================

-- Add lesson_type_id column (nullable for backward compatibility with existing lessons)
ALTER TABLE lessons
  ADD COLUMN lesson_type_id UUID REFERENCES lesson_types(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_lessons_lesson_type_id ON lessons(lesson_type_id);

-- NOTE: We are NOT removing client_id column yet
-- This is to maintain backward compatibility with existing lessons
-- Existing lessons will use client_id, new lessons will use lesson_participants
-- In a future migration, we can migrate old lessons and remove client_id

-- ============================================================================
-- PART 4: Updated timestamp trigger for lesson_types
-- ============================================================================

CREATE OR REPLACE FUNCTION update_lesson_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lesson_types_updated_at
  BEFORE UPDATE ON lesson_types
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_types_updated_at();

-- ============================================================================
-- PART 5: Helper function to get lesson participants with client details
-- ============================================================================

-- This function helps fetch lesson participants with joined client data
CREATE OR REPLACE FUNCTION get_lesson_participants(lesson_id_param UUID)
RETURNS TABLE (
  participant_id UUID,
  client_id UUID,
  athlete_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  amount_owed DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id AS participant_id,
    lp.client_id,
    c.athlete_name,
    c.parent_email,
    c.parent_phone,
    lp.amount_owed
  FROM lesson_participants lp
  JOIN clients c ON c.id = lp.client_id
  WHERE lp.lesson_id = lesson_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- End of migration
-- ============================================================================
