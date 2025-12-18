-- Migration: Refactor clients table
-- Date: 2024-12-17
-- Description: 
--   1. Remove status column (no longer filtering active/inactive)
--   2. Remove hourly_rate column (now stored in lesson_types)
--   3. Split athlete_name into first_name and last_name columns
--   4. Migrate existing athlete_name data to first_name

-- Add new columns
ALTER TABLE clients 
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100);

-- Migrate existing data: copy athlete_name to first_name
-- For existing data, we'll put the full name in first_name
-- Users will need to manually split names or they can edit clients after migration
UPDATE clients 
SET first_name = athlete_name,
    last_name = ''
WHERE first_name IS NULL;

-- Make the new columns NOT NULL now that they have data
ALTER TABLE clients 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Drop old columns
ALTER TABLE clients 
DROP COLUMN IF EXISTS athlete_name,
DROP COLUMN IF EXISTS hourly_rate,
DROP COLUMN IF EXISTS status;

-- Add comment to table
COMMENT ON TABLE clients IS 'Client/athlete information for coaches. Refactored 2024-12-17: removed status/hourly_rate, split names.';
COMMENT ON COLUMN clients.first_name IS 'Client first name';
COMMENT ON COLUMN clients.last_name IS 'Client last name';
