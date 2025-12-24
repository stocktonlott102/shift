import { z } from 'zod';

/**
 * Validation schemas for lesson history and payment server actions
 * Prevents injection attacks and ensures data integrity
 */

/**
 * Schema for confirming a lesson occurred
 */
export const ConfirmLessonSchema = z.object({
  lessonId: z
    .string()
    .uuid('Lesson ID must be a valid UUID'),
});

/**
 * Schema for marking a lesson as no-show
 */
export const MarkLessonNoShowSchema = z.object({
  lessonId: z
    .string()
    .uuid('Lesson ID must be a valid UUID'),
});

/**
 * Schema for getting lesson history for a client
 */
export const GetLessonHistorySchema = z.object({
  clientId: z
    .string()
    .uuid('Client ID must be a valid UUID'),
  filters: z
    .object({
      dateFrom: z.string().datetime('Invalid date format').optional(),
      dateTo: z.string().datetime('Invalid date format').optional(),
      paymentStatus: z.enum(['All', 'Pending', 'Paid', 'Canceled']).optional(),
    })
    .optional(),
});

/**
 * Schema for calculating unpaid balance
 */
export const CalculateUnpaidBalanceSchema = z.object({
  clientId: z
    .string()
    .uuid('Client ID must be a valid UUID'),
});

/**
 * Schema for marking a lesson as paid
 */
export const MarkLessonAsPaidSchema = z.object({
  lessonId: z
    .string()
    .uuid('Lesson ID must be a valid UUID'),
  clientId: z
    .string()
    .uuid('Client ID must be a valid UUID')
    .optional(),
});

/**
 * Schema for marking a lesson as unpaid
 */
export const MarkLessonAsUnpaidSchema = z.object({
  lessonId: z
    .string()
    .uuid('Lesson ID must be a valid UUID'),
  clientId: z
    .string()
    .uuid('Client ID must be a valid UUID')
    .optional(),
});

/**
 * Schema for marking all lessons paid for a client
 */
export const MarkAllLessonsPaidSchema = z.object({
  clientId: z
    .string()
    .uuid('Client ID must be a valid UUID'),
});

/**
 * Schema for marking a participant as paid
 */
export const MarkParticipantPaidSchema = z.object({
  lessonId: z
    .string()
    .uuid('Lesson ID must be a valid UUID'),
  clientId: z
    .string()
    .uuid('Client ID must be a valid UUID'),
});

/**
 * Schema for marking all lesson participants as paid
 */
export const MarkLessonParticipantsPaidSchema = z.object({
  lessonId: z
    .string()
    .uuid('Lesson ID must be a valid UUID'),
});

export type ConfirmLessonInput = z.infer<typeof ConfirmLessonSchema>;
export type MarkLessonNoShowInput = z.infer<typeof MarkLessonNoShowSchema>;
export type GetLessonHistoryInput = z.infer<typeof GetLessonHistorySchema>;
export type CalculateUnpaidBalanceInput = z.infer<typeof CalculateUnpaidBalanceSchema>;
export type MarkLessonAsPaidInput = z.infer<typeof MarkLessonAsPaidSchema>;
export type MarkLessonAsUnpaidInput = z.infer<typeof MarkLessonAsUnpaidSchema>;
export type MarkAllLessonsPaidInput = z.infer<typeof MarkAllLessonsPaidSchema>;
export type MarkParticipantPaidInput = z.infer<typeof MarkParticipantPaidSchema>;
export type MarkLessonParticipantsPaidInput = z.infer<typeof MarkLessonParticipantsPaidSchema>;
