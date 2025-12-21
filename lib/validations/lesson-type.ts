/**
 * Lesson Type Validation Schemas
 *
 * Runtime validation for all lesson type operations using Zod
 * Prevents SQL injection, type confusion, and invalid data submissions
 */

import { z } from 'zod';
import { LESSON_TYPE_CONSTRAINTS } from '@/lib/types/lesson-type';

// =====================================================
// BASE FIELD VALIDATORS
// =====================================================

// UUID validation - prevents injection via IDs
const uuidSchema = z.string().uuid({ message: 'Invalid ID format' });

// Name validation - sanitizes string inputs
const nameSchema = z
  .string()
  .min(1, 'Lesson type name is required')
  .max(LESSON_TYPE_CONSTRAINTS.NAME_MAX_LENGTH, `Name must be ${LESSON_TYPE_CONSTRAINTS.NAME_MAX_LENGTH} characters or less`)
  .trim()
  .refine(
    (val) => {
      // Reject names with HTML tags or script injection attempts
      const dangerousPatterns = /<script|<iframe|javascript:|onerror=/i;
      return !dangerousPatterns.test(val);
    },
    { message: 'Name contains invalid characters' }
  );

// Hourly rate validation
const hourlyRateSchema = z
  .number()
  .min(LESSON_TYPE_CONSTRAINTS.MIN_HOURLY_RATE, `Hourly rate must be at least $${LESSON_TYPE_CONSTRAINTS.MIN_HOURLY_RATE}`)
  .max(LESSON_TYPE_CONSTRAINTS.MAX_HOURLY_RATE, `Hourly rate cannot exceed $${LESSON_TYPE_CONSTRAINTS.MAX_HOURLY_RATE}`)
  .refine((val) => Number.isFinite(val), { message: 'Hourly rate must be a valid number' })
  .refine((val) => {
    // Ensure no more than 2 decimal places
    const decimalPlaces = (val.toString().split('.')[1] || '').length;
    return decimalPlaces <= 2;
  }, { message: 'Hourly rate can have at most 2 decimal places' });

// Color validation - hex color format
const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #3B82F6)')
  .trim();

// =====================================================
// CREATE LESSON TYPE VALIDATION
// =====================================================

export const CreateLessonTypeSchema = z
  .object({
    name: nameSchema,
    hourly_rate: hourlyRateSchema,
    color: colorSchema,
  })
  .strict(); // Reject any extra fields not in schema

export type CreateLessonTypeInput = z.infer<typeof CreateLessonTypeSchema>;

// =====================================================
// UPDATE LESSON TYPE VALIDATION
// =====================================================

export const UpdateLessonTypeSchema = z
  .object({
    name: nameSchema.optional(),
    hourly_rate: hourlyRateSchema.optional(),
    color: colorSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      // At least one field must be provided for update
      return (
        data.name !== undefined ||
        data.hourly_rate !== undefined ||
        data.color !== undefined
      );
    },
    { message: 'At least one field must be provided for update' }
  );

export type UpdateLessonTypeInput = z.infer<typeof UpdateLessonTypeSchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Safely parse and validate lesson type creation data
 */
export function validateCreateLessonType(data: unknown):
  { success: true; data: CreateLessonTypeInput } |
  { success: false; error: string } {
  try {
    const validated = CreateLessonTypeSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid lesson type data' };
  }
}

/**
 * Safely parse and validate lesson type update data
 */
export function validateUpdateLessonType(data: unknown):
  { success: true; data: UpdateLessonTypeInput } |
  { success: false; error: string } {
  try {
    const validated = UpdateLessonTypeSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid lesson type data' };
  }
}
