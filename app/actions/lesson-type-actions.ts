'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import type { LessonType } from '@/lib/types/lesson-type';
import { CreateLessonTypeSchema, UpdateLessonTypeSchema } from '@/lib/validations/lesson-type';
import {
  logLessonTypeCreated,
  logLessonTypeUpdated,
  logLessonTypeDeleted,
} from '@/lib/audit-log';

interface ActionResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
}

/**
 * Create a new lesson type
 * Uses Zod validation to prevent SQL injection and invalid data
 */
export async function createLessonType(input: unknown): Promise<ActionResponse<LessonType>> {
  try {
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

    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = CreateLessonTypeSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const validatedInput = validationResult.data;

    const { data, error } = await supabase
      .from('lesson_types')
      .insert({
        coach_id: user.id,
        name: validatedInput.name,
        hourly_rate: validatedInput.hourly_rate,
        color: validatedInput.color,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson type:', error);
      return {
        success: false,
        error: error.message || 'Failed to create lesson type.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to create lesson type.',
      };
    }

    // Log lesson type creation (fire-and-forget)
    logLessonTypeCreated(user.id, data.id, data.name, Number(data.hourly_rate));

    revalidatePath('/lesson-types');

    return {
      success: true,
      data: data as LessonType,
      message: 'Lesson type created successfully!',
    };
  } catch (error: any) {
    console.error('Unexpected error creating lesson type:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Update an existing lesson type
 * Uses Zod validation to prevent SQL injection and invalid data
 */
export async function updateLessonType(id: string, input: unknown): Promise<ActionResponse<LessonType>> {
  try {
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

    // SECURITY: Validate id is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return {
        success: false,
        error: 'Invalid lesson type ID format',
      };
    }

    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = UpdateLessonTypeSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const validatedInput = validationResult.data;

    const { data, error } = await supabase
      .from('lesson_types')
      .update(validatedInput)
      .eq('id', id)
      .eq('coach_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson type:', error);
      return {
        success: false,
        error: error.message || 'Failed to update lesson type.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Lesson type not found.',
      };
    }

    // Log lesson type update (fire-and-forget)
    logLessonTypeUpdated(user.id, id, data.name, validatedInput);

    revalidatePath('/lesson-types');

    return {
      success: true,
      data: data as LessonType,
      message: 'Lesson type updated successfully!',
    };
  } catch (error: any) {
    console.error('Unexpected error updating lesson type:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Delete a lesson type (soft delete via is_active flag)
 */
export async function deleteLessonType(id: string): Promise<ActionResponse> {
  try {
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

    // Fetch lesson type name before soft-delete for audit log
    const { data: lessonTypeData } = await supabase
      .from('lesson_types')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('lesson_types')
      .update({ is_active: false })
      .eq('id', id)
      .eq('coach_id', user.id);

    if (error) {
      console.error('Error deleting lesson type:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete lesson type.',
      };
    }

    // Log lesson type deletion (fire-and-forget)
    if (lessonTypeData) {
      logLessonTypeDeleted(user.id, id, lessonTypeData.name);
    }

    revalidatePath('/lesson-types');

    return {
      success: true,
      message: 'Lesson type deleted successfully!',
    };
  } catch (error: any) {
    console.error('Unexpected error deleting lesson type:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Get all lesson types for the authenticated coach
 */
export async function getLessonTypes(): Promise<ActionResponse<LessonType[]>> {
  try {
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

    const { data, error } = await supabase
      .from('lesson_types')
      .select('*')
      .eq('coach_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching lesson types:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch lesson types.',
      };
    }

    return {
      success: true,
      data: (data || []) as LessonType[],
    };
  } catch (error: any) {
    console.error('Unexpected error fetching lesson types:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Get a specific lesson type by ID
 */
export async function getLessonTypeById(id: string): Promise<ActionResponse<LessonType>> {
  try {
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

    // SECURITY: Validate id is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return {
        success: false,
        error: 'Invalid lesson type ID format',
      };
    }

    const { data, error } = await supabase
      .from('lesson_types')
      .select('*')
      .eq('id', id)
      .eq('coach_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching lesson type:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch lesson type.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Lesson type not found.',
      };
    }

    return {
      success: true,
      data: data as LessonType,
    };
  } catch (error: any) {
    console.error('Unexpected error fetching lesson type:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}
