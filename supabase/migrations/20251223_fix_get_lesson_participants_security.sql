-- Migration: Fix Security Vulnerability in get_lesson_participants Function
-- Created: 2024-12-23
-- Purpose: Add access control to SECURITY DEFINER function to prevent unauthorized access
--
-- CRITICAL SECURITY FIX:
-- The get_lesson_participants() function uses SECURITY DEFINER which bypasses RLS.
-- Without validation, ANY authenticated user could access ANY lesson's participants.
-- This fix adds a check to ensure only the lesson's owner can access participants.

-- Drop the existing vulnerable function
DROP FUNCTION IF EXISTS get_lesson_participants(UUID);

-- Recreate with proper security validation
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
  -- SECURITY: Verify the requesting user owns this lesson
  -- This prevents coaches from accessing other coaches' lesson participants
  IF NOT EXISTS (
    SELECT 1 FROM lessons
    WHERE id = lesson_id_param
    AND coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not own this lesson';
  END IF;

  -- If validation passed, return the participants
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

-- Add comment documenting the security model
COMMENT ON FUNCTION get_lesson_participants(UUID) IS
  'Returns participants for a lesson. SECURITY DEFINER is used to bypass RLS for the JOIN,
   but access is explicitly validated by checking lesson ownership against auth.uid().';
