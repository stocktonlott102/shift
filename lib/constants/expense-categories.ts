import type { ExpenseCategory } from '@/lib/types/expense';

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Equipment & Supplies': '#F59E0B',
  'Professional Development': '#8B5CF6',
  'Technology & Software': '#3B82F6',
  'Transportation': '#10B981',
  'Facility & Venue Rental': '#EC4899',
  'Insurance': '#6366F1',
  'Marketing & Advertising': '#F97316',
  'Other': '#9CA3AF',
};

/** IRS standard mileage rate for 2026 (dollars per mile) */
export const IRS_MILEAGE_RATE = 0.70;
