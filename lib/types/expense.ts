/**
 * Expense Type Definitions
 *
 * Types for the Business Expense Tracking feature — expense entries,
 * category breakdowns, mileage tracking, and CSV export.
 */

export const EXPENSE_CATEGORIES = [
  'Equipment & Supplies',
  'Professional Development',
  'Technology & Software',
  'Transportation',
  'Facility & Venue Rental',
  'Insurance',
  'Marketing & Advertising',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  coachId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: ExpenseCategory;
  description: string;
  receiptReference: string | null;
  isRecurring: boolean;
  isMileage: boolean;
  milesDriven: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseData {
  year: number;
  expenses: Expense[];
  monthlyExpenses: MonthlyExpense[];
  categoryBreakdown: CategoryBreakdown[];
  totalExpenses: number;
  totalMilesDriven: number;
  totalMileageDeduction: number;
}

export interface MonthlyExpense {
  month: number; // 0-11
  totalAmount: number;
  expenseCount: number;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  color: string;
  expenseCount: number;
  totalAmount: number;
}

export interface ExpenseExportRow {
  date: string;
  category: string;
  description: string;
  amount: number;
  receiptReference: string;
}
