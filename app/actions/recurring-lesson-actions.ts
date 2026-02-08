'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ERROR_MESSAGES } from '@/lib/constants/messages';
import {
  GetRecurringSeriesSchema,
  UpdateFutureLessonsSchema,
  DeleteFutureLessonsSchema,
} from '@/lib/validations/recurring-lesson';

interface RecurringSeries {
  id: string; // parent lesson ID
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  recurrence_end_date: string;
  lesson_count: number;
  future_lesson_count: number;
}

interface ActionResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
}

/**
 * Get all recurring lesson series for a specific client
 * Returns only the parent lessons (one per series) with summary info
 * Uses Zod validation to prevent injection attacks
 */
export async function getRecurringSeriesForClient(input: unknown): Promise<ActionResponse<RecurringSeries[]>> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = GetRecurringSeriesSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
        data: [],
      };
    }

    const { clientId } = validationResult.data;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN,
        data: [],
      };
    }

    // Get all recurring lessons for this client where they are a participant
    const { data: participantLessons, error: participantError } = await supabase
      .from('lesson_participants')
      .select('lesson_id')
      .eq('client_id', clientId);

    if (participantError) {
      console.error('Error fetching lesson participants:', participantError);
      return {
        success: false,
        error: 'Failed to fetch recurring lessons',
        data: [],
      };
    }

    const lessonIds = participantLessons?.map((p: any) => p.lesson_id) || [];

    if (lessonIds.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Get all recurring lessons
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('id', lessonIds)
      .eq('is_recurring', true)
      .eq('coach_id', user.id);

    if (lessonsError) {
      console.error('Error fetching recurring lessons:', lessonsError);
      return {
        success: false,
        error: 'Failed to fetch recurring lessons',
        data: [],
      };
    }

    if (!allLessons || allLessons.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Group by recurrence_parent_id
    const seriesMap = new Map<string, any>();
    const now = new Date();

    for (const lesson of allLessons) {
      const parentId = lesson.recurrence_parent_id || lesson.id;

      if (!seriesMap.has(parentId)) {
        // Find the parent lesson (first in series)
        const parent = allLessons.find((l: any) => l.id === parentId);
        if (parent) {
          const seriesLessons = allLessons.filter(
            (l: any) => (l.recurrence_parent_id === parentId || l.id === parentId)
          );

          const futureLessons = seriesLessons.filter(
            (l: any) => new Date(l.start_time) >= now
          );

          seriesMap.set(parentId, {
            id: parent.id,
            title: parent.title,
            start_time: parent.start_time,
            end_time: parent.end_time,
            location: parent.location,
            status: parent.status,
            recurrence_end_date: parent.recurrence_end_date,
            lesson_count: seriesLessons.length,
            future_lesson_count: futureLessons.length,
          });
        }
      }
    }

    const series = Array.from(seriesMap.values());

    return {
      success: true,
      data: series,
    };
  } catch (error: any) {
    console.error('Unexpected error fetching recurring series:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
      data: [],
    };
  }
}

/**
 * Update all future lessons in a recurring series
 * Uses Zod validation to prevent injection attacks
 */
export async function updateFutureLessonsInSeries(input: unknown): Promise<ActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = UpdateFutureLessonsSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { lessonId, updates } = validationResult.data;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN,
      };
    }

    // Get the lesson to find its parent
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('coach_id', user.id)
      .single();

    if (lessonError || !lesson) {
      return {
        success: false,
        error: 'Lesson not found',
      };
    }

    const parentId = lesson.recurrence_parent_id || lesson.id;
    const lessonStartTime = new Date(lesson.start_time);

    // Separate time-related fields from non-time fields
    const { start_time: newStartTime, end_time: newEndTime, ...nonTimeUpdates } = updates;
    const hasTimeChanges = newStartTime !== undefined || newEndTime !== undefined;
    const hasNonTimeChanges = Object.keys(nonTimeUpdates).length > 0;

    // Bulk-update non-time fields (title, description, location, status)
    if (hasNonTimeChanges) {
      const { error: bulkUpdateError } = await supabase
        .from('lessons')
        .update(nonTimeUpdates)
        .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
        .gte('start_time', lessonStartTime.toISOString())
        .eq('coach_id', user.id);

      if (bulkUpdateError) {
        console.error('Error bulk updating future lessons:', bulkUpdateError);
        return { success: false, error: 'Failed to update future lessons' };
      }
    }

    // For time changes, calculate delta and apply per-lesson to preserve weekly cadence
    if (hasTimeChanges) {
      const originalStart = new Date(lesson.start_time);
      const originalEnd = new Date(lesson.end_time);

      const startDeltaMs = newStartTime
        ? new Date(newStartTime).getTime() - originalStart.getTime()
        : 0;
      const endDeltaMs = newEndTime
        ? new Date(newEndTime).getTime() - originalEnd.getTime()
        : 0;

      // Fetch all future lessons in the series
      const { data: futureLessons, error: fetchError } = await supabase
        .from('lessons')
        .select('id, start_time, end_time')
        .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
        .gte('start_time', lessonStartTime.toISOString())
        .eq('coach_id', user.id);

      if (fetchError) {
        console.error('Error fetching future lessons for time update:', fetchError);
        return { success: false, error: 'Failed to fetch future lessons' };
      }

      // Apply the time delta to each lesson individually
      const updatePromises = (futureLessons || []).map((futureLesson) => {
        const updatedFields: Record<string, string> = {};

        if (startDeltaMs !== 0) {
          const shiftedStart = new Date(new Date(futureLesson.start_time).getTime() + startDeltaMs);
          updatedFields.start_time = shiftedStart.toISOString();
        }
        if (endDeltaMs !== 0) {
          const shiftedEnd = new Date(new Date(futureLesson.end_time).getTime() + endDeltaMs);
          updatedFields.end_time = shiftedEnd.toISOString();
        }

        if (Object.keys(updatedFields).length === 0) return Promise.resolve({ error: null });

        return supabase
          .from('lessons')
          .update(updatedFields)
          .eq('id', futureLesson.id)
          .eq('coach_id', user.id);
      });

      const results = await Promise.all(updatePromises);
      const failedUpdate = results.find((r) => r.error);
      if (failedUpdate?.error) {
        console.error('Error updating individual lesson time:', failedUpdate.error);
        return { success: false, error: 'Failed to update some lesson times' };
      }
    }

    revalidatePath('/calendar');
    revalidatePath('/clients');

    return {
      success: true,
      message: 'Updated all future lessons in series',
    };
  } catch (error: any) {
    console.error('Unexpected error updating future lessons:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Delete all future lessons in a recurring series
 * Uses Zod validation to prevent injection attacks
 */
export async function deleteFutureLessonsInSeries(input: unknown): Promise<ActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = DeleteFutureLessonsSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { lessonId } = validationResult.data;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN,
      };
    }

    // Get the lesson to find its parent
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('coach_id', user.id)
      .single();

    if (lessonError || !lesson) {
      return {
        success: false,
        error: 'Lesson not found',
      };
    }

    const parentId = lesson.recurrence_parent_id || lesson.id;
    const lessonStartTime = new Date(lesson.start_time);

    // Delete all future lessons (including this one)
    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
      .gte('start_time', lessonStartTime.toISOString())
      .eq('coach_id', user.id);

    if (deleteError) {
      console.error('Error deleting future lessons:', deleteError);
      return {
        success: false,
        error: 'Failed to delete future lessons',
      };
    }

    revalidatePath('/calendar');
    revalidatePath('/clients');

    return {
      success: true,
      message: 'Deleted all future lessons in series',
    };
  } catch (error: any) {
    console.error('Unexpected error deleting future lessons:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}
