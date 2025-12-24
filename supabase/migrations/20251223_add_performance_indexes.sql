-- Migration: Add Performance Indexes
-- Created: 2024-12-23
-- Purpose: Add missing database indexes to improve query performance
--
-- Indexes added:
-- 1. clients.coach_id - Critical for filtering clients by coach
-- 2. lessons(coach_id, start_time) - Composite index for calendar queries
-- 3. lessons.updated_at - For recent activity queries
-- 4. lesson_participants(lesson_id, payment_status) - Optimizes payment tracking

-- Add index on clients.coach_id
-- This index improves performance when fetching all clients for a specific coach
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients(coach_id);

-- Add composite index on lessons(coach_id, start_time)
-- This optimizes calendar queries that filter by coach and sort/filter by time
-- Covers common queries like: "Get all lessons for coach X between dates Y and Z"
CREATE INDEX IF NOT EXISTS idx_lessons_coach_start_time ON lessons(coach_id, start_time);

-- Add index on lessons.updated_at
-- Useful for "recently updated" queries and audit tracking
CREATE INDEX IF NOT EXISTS idx_lessons_updated_at ON lessons(updated_at);

-- Add composite index on lesson_participants(lesson_id, payment_status)
-- Optimizes queries that check payment status for specific lessons
-- Covers queries like: "Get all unpaid participants for this lesson"
CREATE INDEX IF NOT EXISTS idx_lesson_participants_lesson_payment ON lesson_participants(lesson_id, payment_status);

-- Add index on clients.updated_at
-- Useful for tracking recently modified clients
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON clients(updated_at);
