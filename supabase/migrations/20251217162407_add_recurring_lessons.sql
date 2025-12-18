-- Migration: Add recurring lesson support
-- Description: Adds fields to track recurring lessons (weekly only, 1-year limit)

-- Add recurrence fields to lessons table
ALTER TABLE lessons
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_parent_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster recurring lesson queries
CREATE INDEX idx_lessons_recurrence_parent ON lessons(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;
CREATE INDEX idx_lessons_is_recurring ON lessons(is_recurring) WHERE is_recurring = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN lessons.is_recurring IS 'True if this lesson is part of a recurring series';
COMMENT ON COLUMN lessons.recurrence_parent_id IS 'References the first lesson in the recurring series (NULL for parent lesson)';
COMMENT ON COLUMN lessons.recurrence_end_date IS 'The end date for recurring lesson generation (1 year from start)';
