-- Migration: Remove title_template from lesson_types
-- Created: 2025-12-16
-- Description: Remove the title_template field as we'll auto-generate titles as "Lesson Type Name - Client Names"

-- Drop the title_template column from lesson_types
ALTER TABLE lesson_types
  DROP COLUMN title_template;
