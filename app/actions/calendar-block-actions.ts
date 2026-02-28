'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import { checkRateLimit, lessonRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import {
  CreateCalendarBlockSchema,
  UpdateCalendarBlockSchema,
} from '@/lib/validations/calendar-block';
import type { CalendarBlock } from '@/lib/types/calendar-block';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ActionResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
  message?: string;
}

/**
 * Create a new calendar block (personal non-client event)
 */
export async function createCalendarBlock(input: unknown): Promise<ActionResponse<CalendarBlock>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    const identifier = getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(identifier, lessonRateLimit);
    if (!rateLimitResult.success) {
      return { success: false, error: rateLimitResult.error || 'Too many requests. Please try again later.' };
    }

    const validationResult = CreateCalendarBlockSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }

    const { title, notes, start_time, end_time, color } = validationResult.data;

    const { data: block, error: insertError } = await supabase
      .from('calendar_blocks')
      .insert({
        coach_id: user.id,
        title,
        notes: notes || null,
        start_time,
        end_time,
        color: color || '#6B7280',
      })
      .select()
      .single();

    if (insertError || !block) {
      console.error('Database error creating calendar block:', insertError);
      return { success: false, error: ERROR_MESSAGES.CALENDAR_BLOCK.CREATE_FAILED };
    }

    revalidatePath('/calendar');

    return {
      success: true,
      data: block as CalendarBlock,
      message: SUCCESS_MESSAGES.CALENDAR_BLOCK.CREATED,
    };
  } catch (error: any) {
    console.error('Unexpected error creating calendar block:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR };
  }
}

/**
 * Fetch calendar blocks for the authenticated coach, optionally filtered by date range.
 */
export async function getCalendarBlocks(filters?: {
  start_date?: string;
  end_date?: string;
}): Promise<ActionResponse<CalendarBlock[]>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN, data: [] };
    }

    let query = supabase
      .from('calendar_blocks')
      .select('*')
      .eq('coach_id', user.id)
      .order('start_time', { ascending: true });

    if (filters?.start_date) {
      query = query.gte('end_time', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('start_time', filters.end_date);
    }

    const { data: blocks, error: fetchError } = await query;

    if (fetchError) {
      console.error('Database error fetching calendar blocks:', fetchError);
      return { success: false, error: ERROR_MESSAGES.CALENDAR_BLOCK.FETCH_FAILED, data: [] };
    }

    return { success: true, data: (blocks || []) as CalendarBlock[] };
  } catch (error: any) {
    console.error('Unexpected error fetching calendar blocks:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR, data: [] };
  }
}

/**
 * Update an existing calendar block
 */
export async function updateCalendarBlock(
  blockId: string,
  input: unknown
): Promise<ActionResponse<CalendarBlock>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    if (!UUID_REGEX.test(blockId)) {
      return { success: false, error: 'Invalid block ID format' };
    }

    const identifier = getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(identifier, lessonRateLimit);
    if (!rateLimitResult.success) {
      return { success: false, error: rateLimitResult.error || 'Too many requests. Please try again later.' };
    }

    const validationResult = UpdateCalendarBlockSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }

    const { data: block, error: updateError } = await supabase
      .from('calendar_blocks')
      .update(validationResult.data)
      .eq('id', blockId)
      .eq('coach_id', user.id)
      .select()
      .single();

    if (updateError || !block) {
      console.error('Database error updating calendar block:', updateError);
      return { success: false, error: ERROR_MESSAGES.CALENDAR_BLOCK.UPDATE_FAILED };
    }

    revalidatePath('/calendar');

    return {
      success: true,
      data: block as CalendarBlock,
      message: SUCCESS_MESSAGES.CALENDAR_BLOCK.UPDATED,
    };
  } catch (error: any) {
    console.error('Unexpected error updating calendar block:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR };
  }
}

/**
 * Delete a calendar block permanently
 */
export async function deleteCalendarBlock(blockId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    if (!UUID_REGEX.test(blockId)) {
      return { success: false, error: 'Invalid block ID format' };
    }

    const identifier = getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(identifier, lessonRateLimit);
    if (!rateLimitResult.success) {
      return { success: false, error: rateLimitResult.error || 'Too many requests. Please try again later.' };
    }

    const { error: deleteError } = await supabase
      .from('calendar_blocks')
      .delete()
      .eq('id', blockId)
      .eq('coach_id', user.id);

    if (deleteError) {
      console.error('Database error deleting calendar block:', deleteError);
      return { success: false, error: ERROR_MESSAGES.CALENDAR_BLOCK.DELETE_FAILED };
    }

    revalidatePath('/calendar');

    return { success: true, message: SUCCESS_MESSAGES.CALENDAR_BLOCK.DELETED };
  } catch (error: any) {
    console.error('Unexpected error deleting calendar block:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR };
  }
}
