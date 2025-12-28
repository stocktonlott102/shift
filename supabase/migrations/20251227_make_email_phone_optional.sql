-- Migration: Make parent_email and parent_phone optional
-- Date: 2024-12-27
-- Description: Remove email validation constraint and allow NULL values for contact fields

-- Drop any existing email validation constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS valid_email;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS valid_phone;

-- Allow NULL values for parent_email and parent_phone
ALTER TABLE clients ALTER COLUMN parent_email DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN parent_phone DROP NOT NULL;

-- Update any empty strings to NULL
UPDATE clients SET parent_email = NULL WHERE parent_email = '';
UPDATE clients SET parent_phone = NULL WHERE parent_phone = '';

-- Add new constraint that only validates email format IF it's not NULL and not empty
ALTER TABLE clients ADD CONSTRAINT valid_email_format
  CHECK (parent_email IS NULL OR parent_email = '' OR parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Add comment
COMMENT ON COLUMN clients.parent_email IS 'Parent/guardian email (optional) - used for invoices';
COMMENT ON COLUMN clients.parent_phone IS 'Parent/guardian phone (optional) - used for SMS reminders';
