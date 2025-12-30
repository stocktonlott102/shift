-- Migration: Create Audit Logging System
-- Created: 2024-12-30
-- Purpose: Track critical operations for security and compliance
--
-- Features:
-- 1. Comprehensive event tracking (who, what, when, where)
-- 2. Stores before/after state for data changes
-- 3. IP address and user agent tracking
-- 4. Automatic timestamping with timezone support
-- 5. Indexed for fast querying
-- 6. RLS policies for coach-only access

-- =====================================================
-- STEP 1: Create audit_logs table
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who performed the action
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT, -- Denormalized for easier querying

  -- What action was performed
  action TEXT NOT NULL, -- e.g., 'client.created', 'lesson.deleted', 'payment.marked_paid'
  resource_type TEXT NOT NULL, -- e.g., 'client', 'lesson', 'payment'
  resource_id UUID, -- ID of the affected resource (can be null for bulk operations)

  -- Details about the change
  description TEXT, -- Human-readable description
  metadata JSONB, -- Additional structured data (old values, new values, etc.)

  -- Context about the request
  ip_address INET, -- IP address of the user
  user_agent TEXT, -- Browser/client info

  -- When it happened
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT valid_action_format CHECK (action ~ '^[a-z_]+\.[a-z_]+$'), -- Format: resource.action
  CONSTRAINT valid_resource_type CHECK (resource_type ~ '^[a-z_]+$')
);

-- =====================================================
-- STEP 2: Create indexes for performance
-- =====================================================

-- Index for querying by user (most common query)
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);

-- Index for querying by resource
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);

-- Index for querying by action type
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- Index for time-based queries (recent activity)
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- STEP 3: Add table comments
-- =====================================================

COMMENT ON TABLE audit_logs IS 'Audit trail for all critical operations in the system';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (references auth.users)';
COMMENT ON COLUMN audit_logs.action IS 'Action identifier in format: resource.action (e.g., client.created)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (client, lesson, payment, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected (nullable for bulk ops)';
COMMENT ON COLUMN audit_logs.metadata IS 'Structured JSON data with old/new values, additional context';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string (browser/client information)';

-- =====================================================
-- STEP 4: Enable Row Level Security
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create RLS Policies
-- =====================================================

-- Coaches can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can insert audit logs (called from server actions)
-- Note: We use a service role for insertions, but this policy allows
-- authenticated users to create logs for their own actions
CREATE POLICY "Users can create their own audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Prevent updates and deletes (audit logs are immutable)
-- No UPDATE or DELETE policies = no one can modify/delete logs

-- =====================================================
-- STEP 6: Create helper function for common queries
-- =====================================================

-- Function to get recent audit logs for a user
CREATE OR REPLACE FUNCTION get_recent_audit_logs(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.description,
    al.metadata,
    al.created_at
  FROM audit_logs al
  WHERE al.user_id = p_user_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit logs for a specific resource
CREATE OR REPLACE FUNCTION get_resource_audit_logs(
  p_resource_type TEXT,
  p_resource_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  action TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.description,
    al.metadata,
    al.created_at,
    al.user_email
  FROM audit_logs al
  WHERE al.resource_type = p_resource_type
    AND al.resource_id = p_resource_id
    AND al.user_id = p_user_id
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: Create view for common audit queries
-- =====================================================

CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT
  al.id,
  al.user_id,
  al.user_email,
  al.action,
  al.resource_type,
  al.resource_id,
  al.description,
  al.created_at,
  -- Extract common metadata fields
  al.metadata->>'old_value' as old_value,
  al.metadata->>'new_value' as new_value,
  al.metadata->>'reason' as reason
FROM audit_logs al;

COMMENT ON VIEW audit_logs_summary IS 'Simplified view of audit logs with common metadata fields extracted';

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================

-- To verify the table was created:
-- SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs';

-- To verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs';

-- To verify policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'audit_logs';

-- To test inserting an audit log (replace with real user_id):
-- INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, description, metadata)
-- VALUES (
--   'your-user-id-here',
--   'coach@example.com',
--   'client.created',
--   'client',
--   'some-client-id',
--   'Created new client: John Doe',
--   '{"client_name": "John Doe", "parent_email": "parent@example.com"}'::jsonb
-- );

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Log client creation
-- INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, description, metadata)
-- VALUES (
--   auth.uid(),
--   (SELECT email FROM auth.users WHERE id = auth.uid()),
--   'client.created',
--   'client',
--   'new-client-uuid',
--   'Created client: Sarah Smith',
--   jsonb_build_object(
--     'first_name', 'Sarah',
--     'last_name', 'Smith',
--     'parent_email', 'parent@example.com'
--   )
-- );

-- Example 2: Log lesson deletion
-- INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, description, metadata)
-- VALUES (
--   auth.uid(),
--   (SELECT email FROM auth.users WHERE id = auth.uid()),
--   'lesson.deleted',
--   'lesson',
--   'deleted-lesson-uuid',
--   'Deleted lesson: Hockey Practice with John Doe',
--   jsonb_build_object(
--     'lesson_title', 'Hockey Practice',
--     'client_name', 'John Doe',
--     'start_time', '2024-12-30T10:00:00Z',
--     'reason', 'Client requested cancellation'
--   )
-- );

-- Example 3: Log payment marked as paid
-- INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, description, metadata)
-- VALUES (
--   auth.uid(),
--   (SELECT email FROM auth.users WHERE id = auth.uid()),
--   'payment.marked_paid',
--   'lesson_participant',
--   'participant-uuid',
--   'Marked lesson payment as paid for client John Doe',
--   jsonb_build_object(
--     'old_status', 'Pending',
--     'new_status', 'Paid',
--     'amount', 75.00,
--     'client_name', 'John Doe'
--   )
-- );

-- =====================================================
-- END OF MIGRATION
-- =====================================================
