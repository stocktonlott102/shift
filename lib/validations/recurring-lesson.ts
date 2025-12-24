import { z } from 'zod';

/**
 * Validation schemas for recurring lesson server actions
 * Prevents injection attacks and ensures data integrity
 */

/**
 * Schema for getting recurring series for a client
 */
export const GetRecurringSeriesSchema = z.object({
  clientId: z
    .string()
    .uuid('Client ID must be a valid UUID'),
});

/**
 * Schema for updating future lessons in a series
 */
export const UpdateFutureLessonsSchema = z.object({
  lessonId: z
    .string()
    .uuid('Lesson ID must be a valid UUID'),
  updates: z.object({
    title: z.string().min(1, 'Title cannot be empty').max(200, 'Title too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    start_time: z.string().datetime('Invalid start time format').optional(),
    end_time: z.string().datetime('Invalid end time format').optional(),
    location: z.string().max(200, 'Location too long').optional(),
    status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'No Show']).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be updated' }
  ),
});

/**
 * Schema for deleting future lessons in a series
 */
export const DeleteFutureLessonsSchema = z.object({
  lessonId: z
    .string()
    .uuid('Lesson ID must be a valid UUID'),
});

export type GetRecurringSeriesInput = z.infer<typeof GetRecurringSeriesSchema>;
export type UpdateFutureLessonsInput = z.infer<typeof UpdateFutureLessonsSchema>;
export type DeleteFutureLessonsInput = z.infer<typeof DeleteFutureLessonsSchema>;
