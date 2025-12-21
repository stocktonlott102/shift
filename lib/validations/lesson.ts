/**
 * Lesson Validation Schemas
 *
 * Runtime validation for all lesson-related operations using Zod
 * Prevents SQL injection, type confusion, and business logic bypass attacks
 */

import { z } from 'zod';

// =====================================================
// ENUMS
// =====================================================

export const LessonStatusSchema = z.enum(['Scheduled', 'Completed', 'Cancelled', 'No Show']);
export const PaymentStatusSchema = z.enum(['Pending', 'Paid', 'Overdue', 'Canceled']);

// =====================================================
// BASE FIELD VALIDATORS
// =====================================================

// UUID validation - prevents injection via IDs
const uuidSchema = z.string().uuid({ message: 'Invalid ID format' });

// Title validation - sanitizes string inputs
const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be 200 characters or less')
  .trim();

// Description validation
const descriptionSchema = z
  .string()
  .max(1000, 'Description must be 1000 characters or less')
  .trim()
  .optional();

// ISO 8601 timestamp validation
const isoTimestampSchema = z
  .string()
  .datetime({ message: 'Invalid timestamp format. Must be ISO 8601.' });

// Location validation
const locationSchema = z
  .string()
  .max(500, 'Location must be 500 characters or less')
  .trim()
  .optional();

// Hourly rate validation - prevents negative or absurd values
const hourlyRateSchema = z
  .number()
  .positive({ message: 'Hourly rate must be positive' })
  .max(10000, { message: 'Hourly rate cannot exceed $10,000/hour' })
  .refine((val) => Number.isFinite(val), { message: 'Hourly rate must be a valid number' });

// Amount validation
const amountSchema = z
  .number()
  .nonnegative({ message: 'Amount cannot be negative' })
  .max(100000, { message: 'Amount cannot exceed $100,000' })
  .refine((val) => Number.isFinite(val), { message: 'Amount must be a valid number' });

// =====================================================
// CREATE LESSON VALIDATION
// =====================================================

export const CreateLessonSchema = z
  .object({
    lesson_type_id: uuidSchema.nullable(),
    client_ids: z
      .array(uuidSchema)
      .min(1, 'At least one client is required')
      .max(50, 'Cannot add more than 50 clients to a lesson'),
    title: titleSchema,
    description: descriptionSchema,
    start_time: isoTimestampSchema,
    end_time: isoTimestampSchema,
    location: locationSchema,
    custom_hourly_rate: hourlyRateSchema.optional(),
    is_recurring: z.boolean().optional(),
  })
  .strict() // Reject any extra fields not in schema
  .refine(
    (data) => {
      const start = new Date(data.start_time);
      const end = new Date(data.end_time);
      return end > start;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.start_time);
      const end = new Date(data.end_time);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      return durationMinutes >= 5; // 5 minute minimum from requirements
    },
    {
      message: 'Lesson duration must be at least 5 minutes',
      path: ['end_time'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.start_time);
      const end = new Date(data.end_time);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return durationHours <= 24; // Prevent absurdly long lessons
    },
    {
      message: 'Lesson duration cannot exceed 24 hours',
      path: ['end_time'],
    }
  )
  .refine(
    (data) => {
      // If custom lesson (no lesson_type_id), custom_hourly_rate is required
      if (data.lesson_type_id === null) {
        return data.custom_hourly_rate !== undefined;
      }
      return true;
    },
    {
      message: 'Custom hourly rate is required for custom lessons',
      path: ['custom_hourly_rate'],
    }
  );

export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;

// =====================================================
// UPDATE LESSON VALIDATION
// =====================================================

export const UpdateLessonSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema,
    start_time: isoTimestampSchema.optional(),
    end_time: isoTimestampSchema.optional(),
    location: locationSchema,
    status: LessonStatusSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      // If both times provided, validate end > start
      if (data.start_time && data.end_time) {
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);
        return end > start;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  )
  .refine(
    (data) => {
      // If both times provided, validate minimum duration
      if (data.start_time && data.end_time) {
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        return durationMinutes >= 5;
      }
      return true;
    },
    {
      message: 'Lesson duration must be at least 5 minutes',
      path: ['end_time'],
    }
  );

export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;

// =====================================================
// CANCEL LESSON VALIDATION
// =====================================================

export const CancelLessonSchema = z
  .object({
    cancelled_reason: z
      .string()
      .max(1000, 'Cancellation reason must be 1000 characters or less')
      .trim()
      .optional(),
  })
  .strict();

export type CancelLessonInput = z.infer<typeof CancelLessonSchema>;

// =====================================================
// LESSON PARTICIPANT VALIDATION
// =====================================================

export const UpdateLessonParticipantSchema = z
  .object({
    payment_status: PaymentStatusSchema,
    paid_at: isoTimestampSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      // If marked as paid, paid_at must be provided
      if (data.payment_status === 'Paid') {
        return data.paid_at !== null && data.paid_at !== undefined;
      }
      return true;
    },
    {
      message: 'Payment date is required when marking as paid',
      path: ['paid_at'],
    }
  );

export type UpdateLessonParticipantInput = z.infer<typeof UpdateLessonParticipantSchema>;

// =====================================================
// QUERY PARAMETER VALIDATION
// =====================================================

// For validating URL query parameters and search filters
export const LessonQuerySchema = z.object({
  lesson_id: uuidSchema.optional(),
  client_id: uuidSchema.optional(),
  status: LessonStatusSchema.optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type LessonQueryInput = z.infer<typeof LessonQuerySchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Safely parse and validate lesson creation data
 * Returns either the validated data or a descriptive error
 */
export function validateCreateLesson(data: unknown):
  { success: true; data: CreateLessonInput } |
  { success: false; error: string } {
  try {
    const validated = CreateLessonSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid lesson data' };
  }
}

/**
 * Safely parse and validate lesson update data
 */
export function validateUpdateLesson(data: unknown):
  { success: true; data: UpdateLessonInput } |
  { success: false; error: string } {
  try {
    const validated = UpdateLessonSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid lesson data' };
  }
}
