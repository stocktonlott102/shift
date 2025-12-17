'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import type {
  UpdateLessonData,
  CancelLessonData,
  Lesson,
  LessonWithClient,
} from '@/lib/types/lesson';

type CreateSingleClientLessonInput = {
  client_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
};

type CreateMultiClientLessonInput = {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  client_ids: string[];
  lesson_type_id?: string; // when using a saved lesson type
  custom_hourly_rate?: number; // used when "Custom" type selected
  rate_at_booking?: number; // optional override, defaults from type/custom
};

/**
 * Server Action: Create a new lesson and automatically generate an invoice
 *
 * Security: Uses Supabase Server Client with RLS policies
 * Business Logic: When a lesson is created, an invoice is automatically generated
 */
export async function createLesson(formData: CreateSingleClientLessonInput) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
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

    // Validation: Required fields
    if (!formData.client_id || !formData.title || !formData.start_time || !formData.end_time) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.REQUIRED_FIELDS,
      };
    }

    // Validation: End time must be after start time
    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);

    if (endTime <= startTime) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.INVALID_TIME_RANGE,
      };
    }

    // Validation: Minimum lesson duration (15 minutes)
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes < 15) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.INVALID_DURATION,
      };
    }

    // Fetch the client to get their hourly rate
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, hourly_rate, athlete_name')
      .eq('id', formData.client_id)
      .eq('coach_id', user.id) // Security: Ensure coach owns this client
      .single();

    if (clientError || !client) {
      return {
        success: false,
        error: ERROR_MESSAGES.CLIENT.NOT_FOUND,
      };
    }

    // Create the lesson with rate snapshot
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        coach_id: user.id,
        client_id: formData.client_id,
        title: formData.title,
        description: formData.description || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location || null,
        rate_at_booking: client.hourly_rate,
        status: 'Scheduled',
      })
      .select()
      .single();

    if (lessonError || !lesson) {
      console.error('Database error creating lesson:', lessonError);
      return {
        success: false,
        error: `${ERROR_MESSAGES.LESSON.CREATE_FAILED}: ${lessonError?.message}`,
      };
    }

    // Calculate invoice amount (duration * rate)
    const durationHours = durationMs / (1000 * 60 * 60);
    const amountDue = durationHours * client.hourly_rate;

    // Generate invoice number
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
      .rpc('generate_invoice_number');

    if (invoiceNumberError) {
      console.error('Error generating invoice number:', invoiceNumberError);
      // Continue anyway with a fallback invoice number
    }

    const invoiceNumber = invoiceNumberData || `INV-${Date.now()}`;

    // Set due date to 14 days from lesson date
    const dueDate = new Date(startTime);
    dueDate.setDate(dueDate.getDate() + 14);

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        lesson_id: lesson.id,
        client_id: formData.client_id,
        coach_id: user.id,
        invoice_number: invoiceNumber,
        amount_due: Math.round(amountDue * 100) / 100, // Round to 2 decimal places
        due_date: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        payment_status: 'Pending',
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Database error creating invoice:', invoiceError);
      // Note: Lesson was created successfully, but invoice failed
      // We could implement a cleanup here, but for now we'll let the lesson exist
      return {
        success: false,
        error: `Lesson created, but ${ERROR_MESSAGES.INVOICE.CREATE_FAILED}: ${invoiceError.message}`,
      };
    }

    // Revalidate relevant pages
    revalidatePath('/lessons');
    revalidatePath('/calendar');
    revalidatePath('/invoices');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        lesson,
        invoice,
      },
      message: SUCCESS_MESSAGES.LESSON.CREATED,
    };
  } catch (error: any) {
    console.error('Unexpected error creating lesson:', error);
    return {
      success: false,
      error: `${ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR}: ${error.message || ''}`,
    };
  }
}

/**
 * Server Action: Create a multi-client lesson using Lesson Types
 *
 * Creates a lesson (with optional `lesson_type_id`), snapshots `rate_at_booking`,
 * and inserts rows into `lesson_participants` with evenly split `amount_owed`.
 *
 * Notes:
 * - Does not create invoices yet; Outstanding view will use `lesson_participants`.
 * - Requires migration adding `lesson_type_id` and `lesson_participants` to be applied.
 */
export async function createLessonWithParticipants(input: CreateMultiClientLessonInput) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    // Basic validation
    if (!input.start_time || !input.end_time || !input.title || !input.client_ids?.length) {
      return { success: false, error: ERROR_MESSAGES.LESSON.REQUIRED_FIELDS };
    }

    const startTime = new Date(input.start_time);
    const endTime = new Date(input.end_time);
    if (endTime <= startTime) {
      return { success: false, error: ERROR_MESSAGES.LESSON.INVALID_TIME_RANGE };
    }

    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    if (durationMinutes < 15) {
      return { success: false, error: ERROR_MESSAGES.LESSON.INVALID_DURATION };
    }

    // Ensure all clients belong to this coach
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id')
      .eq('coach_id', user.id)
      .in('id', input.client_ids);

    if (clientsError) {
      return { success: false, error: ERROR_MESSAGES.CLIENT.FETCH_FAILED };
    }

    const validClientIds = (clients || []).map((c: any) => c.id);
    if (validClientIds.length !== input.client_ids.length) {
      return { success: false, error: ERROR_MESSAGES.CLIENT.NOT_FOUND };
    }

    // Determine hourly rate from lesson type or custom
    let hourlyRate: number | null = null;
    let lessonTypeId: string | null = input.lesson_type_id || null;

    if (lessonTypeId) {
      const { data: lt, error: ltError } = await supabase
        .from('lesson_types')
        .select('id, hourly_rate, is_active, coach_id')
        .eq('id', lessonTypeId)
        .single();

      if (ltError || !lt || lt.coach_id !== user.id || !lt.is_active) {
        return { success: false, error: ERROR_MESSAGES.LESSON.TYPE_NOT_FOUND };
      }
      hourlyRate = Number(lt.hourly_rate);
    } else if (typeof input.custom_hourly_rate === 'number') {
      hourlyRate = input.custom_hourly_rate;
      if (hourlyRate <= 0 || hourlyRate > 999) {
        return { success: false, error: ERROR_MESSAGES.LESSON.INVALID_RATE };
      }
    } else {
      return { success: false, error: ERROR_MESSAGES.LESSON.INVALID_RATE };
    }

    const durationHours = durationMs / (1000 * 60 * 60);
    const totalAmount = Math.round(durationHours * hourlyRate * 100) / 100;
    const splitAmount = Math.round((totalAmount / input.client_ids.length) * 100) / 100;

    // Create the lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        coach_id: user.id,
        // keep legacy client_id null for multi-client
        client_id: null,
        title: input.title,
        description: input.description || null,
        start_time: input.start_time,
        end_time: input.end_time,
        location: input.location || null,
        rate_at_booking: input.rate_at_booking ?? hourlyRate,
        lesson_type_id: lessonTypeId,
        status: 'Scheduled',
      })
      .select()
      .single();

    if (lessonError || !lesson) {
      console.error('Database error creating multi-client lesson:', lessonError);
      return {
        success: false,
        error: `${ERROR_MESSAGES.LESSON.CREATE_FAILED}: ${lessonError?.message}`,
      };
    }

    // Insert participants in a single batch
    const participantsRows = input.client_ids.map((cid) => ({
      lesson_id: lesson.id,
      client_id: cid,
      amount_owed: splitAmount,
    }));

    const { error: lpError } = await supabase.from('lesson_participants').insert(participantsRows);
    if (lpError) {
      console.error('Error inserting lesson participants:', lpError);
      return { success: false, error: ERROR_MESSAGES.LESSON.PARTICIPANTS_CREATE_FAILED };
    }

    // Revalidate relevant pages
    revalidatePath('/calendar');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: { lesson },
      message: SUCCESS_MESSAGES.LESSON.CREATED,
    };
  } catch (error: any) {
    console.error('Unexpected error creating multi-client lesson:', error);
    return {
      success: false,
      error: `${ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR}: ${error.message || ''}`,
    };
  }
}

/**
 * Server Action: Get all lessons for the authenticated coach
 */
export async function getLessons(filters?: {
  client_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
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

    // Build query with filters
    let query = supabase
      .from('lessons')
      .select(
        `
        *,
        client:clients (
          id,
          athlete_name,
          parent_email,
          parent_phone
        )
      `
      )
      .eq('coach_id', user.id)
      .order('start_time', { ascending: true });

    // Apply filters if provided
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.start_date) {
      query = query.gte('start_time', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('start_time', filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching lessons:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.FETCH_FAILED,
        data: [],
      };
    }

    return {
      success: true,
      data: data as LessonWithClient[],
    };
  } catch (error: any) {
    console.error('Unexpected error fetching lessons:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
      data: [],
    };
  }
}

/**
 * Server Action: Get a single lesson by ID
 */
export async function getLessonById(lessonId: string) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
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

    // Query single lesson with client data - RLS automatically ensures it belongs to this coach
    const { data, error } = await supabase
      .from('lessons')
      .select(
        `
        *,
        client:clients (
          id,
          athlete_name,
          parent_email,
          parent_phone,
          hourly_rate
        )
      `
      )
      .eq('id', lessonId)
      .single();

    if (error) {
      console.error('Database error fetching lesson:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.FETCH_SINGLE_FAILED,
      };
    }

    if (!data) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.NOT_FOUND,
      };
    }

    return {
      success: true,
      data: data as LessonWithClient,
    };
  } catch (error: any) {
    console.error('Unexpected error fetching lesson:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Server Action: Update an existing lesson
 */
export async function updateLesson(lessonId: string, formData: UpdateLessonData) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
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

    // Validation: If updating times, ensure end is after start
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);

      if (endTime <= startTime) {
        return {
          success: false,
          error: ERROR_MESSAGES.LESSON.INVALID_TIME_RANGE,
        };
      }

      // Check minimum duration
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = durationMs / (1000 * 60);

      if (durationMinutes < 15) {
        return {
          success: false,
          error: ERROR_MESSAGES.LESSON.INVALID_DURATION,
        };
      }
    }

    // Update the lesson - RLS ensures user owns this lesson
    const { data, error } = await supabase
      .from('lessons')
      .update(formData)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating lesson:', error);
      return {
        success: false,
        error: `${ERROR_MESSAGES.LESSON.UPDATE_FAILED}: ${error.message}`,
      };
    }

    // Revalidate relevant pages
    revalidatePath('/lessons');
    revalidatePath('/calendar');
    revalidatePath(`/lessons/${lessonId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      data,
      message: SUCCESS_MESSAGES.LESSON.UPDATED,
    };
  } catch (error: any) {
    console.error('Unexpected error updating lesson:', error);
    return {
      success: false,
      error: `${ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR}: ${error.message || ''}`,
    };
  }
}

/**
 * Server Action: Cancel a lesson
 */
export async function cancelLesson(lessonId: string, cancelData?: CancelLessonData) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
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

    // Update lesson status to Cancelled
    const { data, error } = await supabase
      .from('lessons')
      .update({
        status: 'Cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_reason: cancelData?.cancelled_reason || null,
      })
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      console.error('Database error cancelling lesson:', error);
      return {
        success: false,
        error: `${ERROR_MESSAGES.LESSON.CANCEL_FAILED}: ${error.message}`,
      };
    }

    // Update associated invoice to Canceled status
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({ payment_status: 'Canceled' })
      .eq('lesson_id', lessonId);

    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError);
      // Continue anyway - lesson was cancelled successfully
    }

    // Revalidate relevant pages
    revalidatePath('/lessons');
    revalidatePath('/calendar');
    revalidatePath(`/lessons/${lessonId}`);
    revalidatePath('/invoices');
    revalidatePath('/dashboard');

    return {
      success: true,
      data,
      message: SUCCESS_MESSAGES.LESSON.CANCELLED,
    };
  } catch (error: any) {
    console.error('Unexpected error cancelling lesson:', error);
    return {
      success: false,
      error: `${ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR}: ${error.message || ''}`,
    };
  }
}

/**
 * Server Action: Mark a lesson as completed
 */
export async function completeLesson(lessonId: string) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
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

    // Update lesson status to Completed
    const { data, error } = await supabase
      .from('lessons')
      .update({ status: 'Completed' })
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      console.error('Database error completing lesson:', error);
      return {
        success: false,
        error: `${ERROR_MESSAGES.LESSON.UPDATE_FAILED}: ${error.message}`,
      };
    }

    // Revalidate relevant pages
    revalidatePath('/lessons');
    revalidatePath('/calendar');
    revalidatePath(`/lessons/${lessonId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      data,
      message: SUCCESS_MESSAGES.LESSON.COMPLETED,
    };
  } catch (error: any) {
    console.error('Unexpected error completing lesson:', error);
    return {
      success: false,
      error: `${ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR}: ${error.message || ''}`,
    };
  }
}
