'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import type { CreateLessonTypeInput, UpdateLessonTypeInput, LessonType } from '@/lib/types/lesson-type';

interface ActionResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
}

/**
 * Create a new lesson type
 */
export async function createLessonType(
  input: CreateLessonTypeInput
): Promise<ActionResponse<LessonType>> {
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

    // Validate input
    if (!input.name?.trim()) {
      return {
        success: false,
        error: 'Lesson type name is required.',
      };
    }

    if (!input.hourly_rate || input.hourly_rate <= 0 || input.hourly_rate > 999) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.INVALID_RATE,
      };
    }

    const { data, error } = await supabase
      .from('lesson_types')
      .insert({
        coach_id: user.id,
        name: input.name.trim(),
        hourly_rate: input.hourly_rate,
        color: input.color || '#3B82F6',
        title_template: input.title_template || '{client_names}',
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
 */
export async function updateLessonType(
  id: string,
  input: UpdateLessonTypeInput
): Promise<ActionResponse<LessonType>> {
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

    // Validate inputs
    if (input.name && !input.name.trim()) {
      return {
        success: false,
        error: 'Lesson type name cannot be empty.',
      };
    }

    if (input.hourly_rate !== undefined) {
      if (input.hourly_rate <= 0 || input.hourly_rate > 999) {
        return {
          success: false,
          error: ERROR_MESSAGES.LESSON.INVALID_RATE,
        };
      }
    }

    const updatePayload: any = {};
    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.hourly_rate !== undefined) updatePayload.hourly_rate = input.hourly_rate;
    if (input.color !== undefined) updatePayload.color = input.color;
    if (input.title_template !== undefined) updatePayload.title_template = input.title_template;

    const { data, error } = await supabase
      .from('lesson_types')
      .update(updatePayload)
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
