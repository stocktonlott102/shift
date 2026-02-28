-- Create calendar_blocks table for non-client personal events
-- These are freeform time blocks (prep time, breaks, etc.) with no billing tracking

CREATE TABLE calendar_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT block_end_after_start CHECK (end_time > start_time)
);

-- Indexes for common query patterns
CREATE INDEX idx_calendar_blocks_coach_id ON calendar_blocks(coach_id);
CREATE INDEX idx_calendar_blocks_start_time ON calendar_blocks(start_time);

-- Row Level Security
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can insert their own blocks"
  ON calendar_blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can view their own blocks"
  ON calendar_blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own blocks"
  ON calendar_blocks FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own blocks"
  ON calendar_blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);
