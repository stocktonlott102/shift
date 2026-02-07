/**
 * Expense Validation Schemas
 *
 * Runtime validation for expense-related operations using Zod.
 * Prevents invalid data, type confusion, and business logic bypass.
 */

import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '@/lib/types/expense';

// =====================================================
// BASE FIELD VALIDATORS
// =====================================================

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Must be YYYY-MM-DD.');

const amountSchema = z
  .number()
  .positive('Amount must be greater than 0.')
  .max(100000, 'Amount cannot exceed $100,000.')
  .refine((val) => Number.isFinite(val), 'Amount must be a valid number.');

const categorySchema = z.enum(EXPENSE_CATEGORIES, {
  message: 'Please select a valid category.',
});

const descriptionSchema = z
  .string()
  .min(1, 'Description is required.')
  .max(500, 'Description must be 500 characters or less.')
  .trim();

const receiptReferenceSchema = z
  .string()
  .max(200, 'Receipt reference must be 200 characters or less.')
  .trim()
  .nullable()
  .optional();

const milesSchema = z
  .number()
  .positive('Miles must be greater than 0.')
  .max(10000, 'Miles cannot exceed 10,000 per entry.')
  .refine((val) => Number.isFinite(val), 'Miles must be a valid number.');

const purposeSchema = z
  .string()
  .min(1, 'Purpose / destination is required.')
  .max(500, 'Purpose must be 500 characters or less.')
  .trim();

// =====================================================
// CREATE EXPENSE VALIDATION
// =====================================================

export const CreateExpenseSchema = z
  .object({
    date: dateSchema,
    amount: amountSchema,
    category: categorySchema,
    description: descriptionSchema,
    receipt_reference: receiptReferenceSchema,
    is_recurring: z.boolean().optional().default(false),
    is_mileage: z.boolean().optional().default(false),
    miles_driven: z.number().positive().nullable().optional(),
  })
  .strict();

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

// =====================================================
// CREATE MILEAGE VALIDATION
// =====================================================

export const CreateMileageSchema = z
  .object({
    date: dateSchema,
    miles_driven: milesSchema,
    purpose: purposeSchema,
  })
  .strict();

export type CreateMileageInput = z.infer<typeof CreateMileageSchema>;

// =====================================================
// UPDATE EXPENSE VALIDATION
// =====================================================

export const UpdateExpenseSchema = z
  .object({
    date: dateSchema.optional(),
    amount: amountSchema.optional(),
    category: categorySchema.optional(),
    description: descriptionSchema.optional(),
    receipt_reference: receiptReferenceSchema,
    is_recurring: z.boolean().optional(),
  })
  .strict();

export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function validateCreateExpense(
  data: unknown
): { success: true; data: CreateExpenseInput } | { success: false; error: string } {
  try {
    const validated = CreateExpenseSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { success: false, error: 'Invalid expense data.' };
  }
}

export function validateCreateMileage(
  data: unknown
): { success: true; data: CreateMileageInput } | { success: false; error: string } {
  try {
    const validated = CreateMileageSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { success: false, error: 'Invalid mileage data.' };
  }
}

export function validateUpdateExpense(
  data: unknown
): { success: true; data: UpdateExpenseInput } | { success: false; error: string } {
  try {
    const validated = UpdateExpenseSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { success: false, error: 'Invalid expense data.' };
  }
}
