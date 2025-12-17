-- Migration: Make client_id nullable in lessons table
-- Created: 2025-12-16
-- Description: Allow client_id to be null for multi-client lessons using lesson_participants

-- Make client_id nullable to support multi-client lessons
ALTER TABLE lessons
  ALTER COLUMN client_id DROP NOT NULL;

-- Note: Existing lessons with client_id will remain unchanged
-- New multi-client lessons will have client_id = NULL and use lesson_participants instead
