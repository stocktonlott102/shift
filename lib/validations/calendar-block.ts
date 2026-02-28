import { z } from 'zod';

const isoTimestampSchema = z
  .string()
  .datetime({ message: 'Invalid timestamp format. Must be ISO 8601.' });

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g. #6B7280)' })
  .optional();

export const CreateCalendarBlockSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').trim(),
    notes: z.string().max(1000, 'Notes must be 1000 characters or less').trim().optional(),
    start_time: isoTimestampSchema,
    end_time: isoTimestampSchema,
    color: hexColorSchema,
  })
  .strict()
  .refine(
    (data) => new Date(data.end_time) > new Date(data.start_time),
    { message: 'End time must be after start time', path: ['end_time'] }
  )
  .refine(
    (data) => {
      const durationMinutes = (new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / (1000 * 60);
      return durationMinutes >= 5;
    },
    { message: 'Block duration must be at least 5 minutes', path: ['end_time'] }
  );

export const UpdateCalendarBlockSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').trim().optional(),
    notes: z.string().max(1000, 'Notes must be 1000 characters or less').trim().optional(),
    start_time: isoTimestampSchema.optional(),
    end_time: isoTimestampSchema.optional(),
    color: hexColorSchema,
  })
  .strict()
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return new Date(data.end_time) > new Date(data.start_time);
      }
      return true;
    },
    { message: 'End time must be after start time', path: ['end_time'] }
  )
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        const durationMinutes = (new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / (1000 * 60);
        return durationMinutes >= 5;
      }
      return true;
    },
    { message: 'Block duration must be at least 5 minutes', path: ['end_time'] }
  );

export type CreateCalendarBlockInput = z.infer<typeof CreateCalendarBlockSchema>;
export type UpdateCalendarBlockInput = z.infer<typeof UpdateCalendarBlockSchema>;
