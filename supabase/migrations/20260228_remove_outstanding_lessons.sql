-- Migration: Remove Outstanding Lessons Step
-- Date: 2026-02-28
-- Description:
--   Simplify the lesson lifecycle by eliminating the manual "confirm lesson
--   happened" step. Any lesson that is still Scheduled but whose time has
--   already passed is treated as completed and eligible for payment.
--
--   Before: Scheduled (future) → Outstanding (past, unconfirmed) → Completed → Paid
--   After:  Scheduled (future) → [time passes] → Payment Pending → Paid
--
-- This migration marks all currently-outstanding lessons (status = Scheduled
-- AND end_time < now) as Completed with payment_status = Pending, so they
-- appear immediately as "Payment Pending" in the new simplified UI.

UPDATE lessons
SET
  status     = 'Completed',
  updated_at = NOW()
WHERE
  status   = 'Scheduled'
  AND end_time < NOW();

-- Verification query (run after applying to confirm 0 rows remain outstanding):
-- SELECT COUNT(*) FROM lessons WHERE status = 'Scheduled' AND end_time < NOW();
