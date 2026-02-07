-- Migration: Create expenses table for business expense tracking
-- Date: 2026-02-07
-- Description:
--   Create the expenses table for coaches to track business expenses,
--   including mileage entries. Supports CRUD operations with RLS policies
--   ensuring coaches can only access their own expenses.

-- STEP 1: Create the expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  receipt_reference TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  is_mileage BOOLEAN NOT NULL DEFAULT FALSE,
  miles_driven DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 2: Add indexes for common query patterns
CREATE INDEX idx_expenses_coach_id ON expenses(coach_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_coach_date ON expenses(coach_id, date);

-- STEP 3: Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- STEP 4: RLS Policies — coaches can only access their own expenses
CREATE POLICY "Coaches can view own expenses"
  ON expenses FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create own expenses"
  ON expenses FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own expenses"
  ON expenses FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own expenses"
  ON expenses FOR DELETE
  USING (coach_id = auth.uid());

-- STEP 5: Auto-update updated_at trigger (reuses existing function from 0002 migration)
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 6: Comments
COMMENT ON TABLE expenses IS 'Business expenses for coaches. Includes regular expenses and mileage entries. RLS ensures coaches can only access their own expenses.';
COMMENT ON COLUMN expenses.category IS 'Expense category aligned with IRS Schedule C (e.g., Equipment & Supplies, Transportation)';
COMMENT ON COLUMN expenses.description IS 'Business purpose description — serves as IRS-compliant record of why the expense was business-related';
COMMENT ON COLUMN expenses.receipt_reference IS 'Optional text reference to receipt (e.g., Amazon order #123, Chase statement 1/15)';
COMMENT ON COLUMN expenses.is_recurring IS 'Flag indicating this is a recurring monthly cost (reference only, does not auto-generate)';
COMMENT ON COLUMN expenses.is_mileage IS 'True if this expense was created via the mileage entry form';
COMMENT ON COLUMN expenses.miles_driven IS 'Miles driven for mileage entries; NULL for regular expenses';
