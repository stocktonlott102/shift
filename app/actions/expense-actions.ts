'use server';

import { createClient } from '@/lib/supabase/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import { EXPENSE_CATEGORY_COLORS, IRS_MILEAGE_RATE } from '@/lib/constants/expense-categories';
import { validateCreateExpense, validateCreateMileage, validateUpdateExpense } from '@/lib/validations/expense';
import type {
  Expense,
  ExpenseData,
  MonthlyExpense,
  CategoryBreakdown,
  ExpenseCategory,
} from '@/lib/types/expense';

/**
 * Map a raw Supabase row to our Expense interface (snake_case -> camelCase).
 */
function mapRow(row: any): Expense {
  return {
    id: row.id,
    coachId: row.coach_id,
    date: row.date,
    amount: Number(row.amount),
    category: row.category as ExpenseCategory,
    description: row.description || '',
    receiptReference: row.receipt_reference || null,
    isRecurring: row.is_recurring ?? false,
    isMileage: row.is_mileage ?? false,
    milesDriven: row.miles_driven ? Number(row.miles_driven) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all expenses for a year and aggregate into ExpenseData.
 */
export async function getExpenseSummary(year: number): Promise<{
  success: boolean;
  error?: string;
  data?: ExpenseData;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    const yearStart = `${year}-01-01`;
    const yearEnd = `${year + 1}-01-01`;

    const { data: rows, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('coach_id', user.id)
      .gte('date', yearStart)
      .lt('date', yearEnd)
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('Error fetching expenses:', fetchError);
      return { success: false, error: ERROR_MESSAGES.EXPENSE.FETCH_FAILED };
    }

    const expenses = (rows || []).map(mapRow);

    // Monthly aggregation
    const monthlyExpenses: MonthlyExpense[] = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      totalAmount: 0,
      expenseCount: 0,
    }));

    // Category aggregation
    const categoryMap = new Map<ExpenseCategory, { count: number; total: number }>();

    let totalExpenses = 0;
    let totalMilesDriven = 0;

    for (const exp of expenses) {
      const month = new Date(exp.date + 'T00:00:00').getMonth();
      monthlyExpenses[month].totalAmount += exp.amount;
      monthlyExpenses[month].expenseCount++;
      totalExpenses += exp.amount;

      if (exp.isMileage && exp.milesDriven) {
        totalMilesDriven += exp.milesDriven;
      }

      const existing = categoryMap.get(exp.category);
      if (existing) {
        existing.count++;
        existing.total += exp.amount;
      } else {
        categoryMap.set(exp.category, { count: 1, total: exp.amount });
      }
    }

    const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        color: EXPENSE_CATEGORY_COLORS[category] || '#9CA3AF',
        expenseCount: data.count,
        totalAmount: Math.round(data.total * 100) / 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      success: true,
      data: {
        year,
        expenses,
        monthlyExpenses,
        categoryBreakdown,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalMilesDriven: Math.round(totalMilesDriven * 100) / 100,
        totalMileageDeduction: Math.round(totalMilesDriven * IRS_MILEAGE_RATE * 100) / 100,
      },
    };
  } catch (error: any) {
    console.error('Unexpected error in getExpenseSummary:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR };
  }
}

/**
 * Create a new expense.
 */
export async function createExpense(input: unknown): Promise<{
  success: boolean;
  error?: string;
  data?: Expense;
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    const validation = validateCreateExpense(input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const { data: row, error: insertError } = await supabase
      .from('expenses')
      .insert({
        coach_id: user.id,
        date: validation.data.date,
        amount: validation.data.amount,
        category: validation.data.category,
        description: validation.data.description,
        receipt_reference: validation.data.receipt_reference || null,
        is_recurring: validation.data.is_recurring || false,
        is_mileage: validation.data.is_mileage || false,
        miles_driven: validation.data.miles_driven || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating expense:', insertError);
      return { success: false, error: ERROR_MESSAGES.EXPENSE.CREATE_FAILED };
    }

    return {
      success: true,
      data: mapRow(row),
      message: validation.data.is_mileage
        ? SUCCESS_MESSAGES.EXPENSE.MILEAGE_CREATED
        : SUCCESS_MESSAGES.EXPENSE.CREATED,
    };
  } catch (error: any) {
    console.error('Unexpected error in createExpense:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR };
  }
}

/**
 * Update an existing expense.
 */
export async function updateExpense(
  id: string,
  input: unknown
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    const validation = validateUpdateExpense(input);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    // Build update object from validated fields (only include defined fields)
    const updateData: Record<string, any> = {};
    if (validation.data.date !== undefined) updateData.date = validation.data.date;
    if (validation.data.amount !== undefined) updateData.amount = validation.data.amount;
    if (validation.data.category !== undefined) updateData.category = validation.data.category;
    if (validation.data.description !== undefined) updateData.description = validation.data.description;
    if (validation.data.receipt_reference !== undefined) updateData.receipt_reference = validation.data.receipt_reference;
    if (validation.data.is_recurring !== undefined) updateData.is_recurring = validation.data.is_recurring;

    const { error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .eq('coach_id', user.id);

    if (updateError) {
      console.error('Error updating expense:', updateError);
      return { success: false, error: ERROR_MESSAGES.EXPENSE.UPDATE_FAILED };
    }

    return { success: true, message: SUCCESS_MESSAGES.EXPENSE.UPDATED };
  } catch (error: any) {
    console.error('Unexpected error in updateExpense:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR };
  }
}

/**
 * Delete an expense.
 */
export async function deleteExpense(id: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('coach_id', user.id);

    if (deleteError) {
      console.error('Error deleting expense:', deleteError);
      return { success: false, error: ERROR_MESSAGES.EXPENSE.DELETE_FAILED };
    }

    return { success: true, message: SUCCESS_MESSAGES.EXPENSE.DELETED };
  } catch (error: any) {
    console.error('Unexpected error in deleteExpense:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR };
  }
}
