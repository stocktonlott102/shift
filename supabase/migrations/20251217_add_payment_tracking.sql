-- Migration: Add payment tracking to lesson_participants
-- Date: 2024-12-17
-- Description: 
--   Add payment status and timestamp fields to lesson_participants
--   to properly track payment history without losing charge information

-- Add payment tracking columns
ALTER TABLE lesson_participants 
ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'Pending',
ADD COLUMN paid_at TIMESTAMPTZ;

-- Add index for querying by payment status
CREATE INDEX idx_lesson_participants_payment_status ON lesson_participants(payment_status);

-- Add comments
COMMENT ON COLUMN lesson_participants.amount_owed IS 'Original amount this client owes for this lesson (preserved for history)';
COMMENT ON COLUMN lesson_participants.payment_status IS 'Payment status: Pending, Paid, Overdue, or Canceled';
COMMENT ON COLUMN lesson_participants.paid_at IS 'Timestamp when payment was marked as paid';
