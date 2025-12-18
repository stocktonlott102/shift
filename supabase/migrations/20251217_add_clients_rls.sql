-- Migration: Add RLS policies to clients table
-- Date: 2024-12-17
-- Description: Enable RLS on clients table and add policies to allow coaches to access their own clients

-- Enable RLS on clients table (if not already enabled)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can SELECT their own clients
CREATE POLICY "Coaches can view their own clients"
  ON clients FOR SELECT
  USING (coach_id = auth.uid());

-- Policy: Coaches can INSERT clients for themselves
CREATE POLICY "Coaches can create clients"
  ON clients FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Policy: Coaches can UPDATE their own clients
CREATE POLICY "Coaches can update their own clients"
  ON clients FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Policy: Coaches can DELETE their own clients
CREATE POLICY "Coaches can delete their own clients"
  ON clients FOR DELETE
  USING (coach_id = auth.uid());

COMMENT ON TABLE clients IS 'Client/athlete information for coaches. RLS ensures coaches can only access their own clients.';
