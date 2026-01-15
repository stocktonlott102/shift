-- Migration: Fix audit_logs user_id constraint
-- Created: 2026-01-14
-- Purpose: Allow audit logs for unauthenticated events (failed logins, password reset requests)
--
-- Problem: The original schema requires user_id to be NOT NULL with a foreign key to auth.users,
-- but some audit events occur before authentication (failed login attempts, password reset requests).
-- The placeholder UUID '00000000-0000-0000-0000-000000000000' violates the foreign key constraint.
--
-- Solution: Make user_id nullable and update RLS policies accordingly.

-- =====================================================
-- STEP 1: Drop the foreign key constraint
-- =====================================================
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- =====================================================
-- STEP 2: Make user_id nullable
-- =====================================================
ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;

-- =====================================================
-- STEP 3: Re-add foreign key with ON DELETE SET NULL
-- =====================================================
ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- =====================================================
-- STEP 4: Update RLS policies to handle null user_id
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can create their own audit logs" ON audit_logs;

-- Recreate SELECT policy - users can view their own logs OR logs with null user_id
-- (null user_id logs are for failed logins etc., which are viewable by admins only via service role)
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT policy is no longer needed since we use service role for audit logging
-- Service role bypasses RLS entirely

-- =====================================================
-- END OF MIGRATION
-- =====================================================
