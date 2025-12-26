-- Migration: Add RLS to profiles table
-- Created: 2024-12-23
-- Purpose: Protect profiles table with Row Level Security
--
-- CRITICAL SECURITY FIX:
-- The profiles table stores sensitive subscription data (stripe_customer_id, subscription_status)
-- but has NO RLS policies, allowing any authenticated user to access other users' profiles.

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: DELETE policy intentionally omitted - profile deletion should be handled
-- through account deletion workflows, not direct DELETE operations

-- Add comment documenting the security model
COMMENT ON TABLE profiles IS
  'User profile data including Stripe subscription information.
   Protected by RLS - users can only access their own profile.
   Service role (supabaseAdmin) bypasses RLS for webhook updates.';
