'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import {
  LessonHistoryActionResponse,
  OutstandingLessonsCountResponse,
  LessonHistoryEntry,
  LessonHistoryFilters,
} from '@/lib/types/lesson-history';
import { LessonWithClient } from '@/lib/types/lesson';

/**
 * Get all outstanding lessons that need confirmation
 * Returns lessons that are scheduled but have passed their end time
 */
export async function getOutstandingLessons(): Promise<
  LessonHistoryActionResponse<LessonWithClient[]>
> {
  try {
    const supabase = await createClient();

    // Verify authentication
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

    // Query lessons that are scheduled and past their end time
    const now = new Date().toISOString();
    const { data: lessons, error: queryError } = await supabase
      .from('lessons')
      .select(
        `
        *,
        client:clients (
          id,
          athlete_name,
          parent_email,
          parent_phone
        ),
        lesson_participants (
          id,
          client_id,
          amount_owed,
          client:clients (
            id,
            athlete_name,
            parent_email,
            parent_phone
          )
        )
      `
      )
      .eq('coach_id', user.id)
      .eq('status', 'Scheduled')
      .lt('end_time', now)
      .order('end_time', { ascending: true });

    if (queryError) {
      console.error('Error fetching outstanding lessons:', queryError);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.FETCH_FAILED,
      };
    }

    return {
      success: true,
      data: lessons || [],
    };
  } catch (error: any) {
    console.error('Unexpected error in getOutstandingLessons:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Get count of outstanding lessons for notification badge
 */
export async function getOutstandingLessonsCount(): Promise<
  LessonHistoryActionResponse<OutstandingLessonsCountResponse>
> {
  try {
    const supabase = await createClient();

    // Verify authentication
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

    // Query count of outstanding lessons
    const now = new Date().toISOString();
    const { count, error: queryError } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('status', 'Scheduled')
      .lt('end_time', now);

    if (queryError) {
      console.error('Error fetching outstanding lessons count:', queryError);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.FETCH_FAILED,
      };
    }

    return {
      success: true,
      data: { count: count || 0 },
    };
  } catch (error: any) {
    console.error('Unexpected error in getOutstandingLessonsCount:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Confirm that a lesson occurred
 * Updates lesson status from Scheduled to Completed
 */
export async function confirmLesson(
  lessonId: string
): Promise<LessonHistoryActionResponse> {
  try {
    const supabase = await createClient();

    // Verify authentication
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

    // First, fetch the lesson to validate status and ownership
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('coach_id', user.id)
      .single();

    if (fetchError || !lesson) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.NOT_FOUND,
      };
    }

    // Validate lesson status
    if (lesson.status !== 'Scheduled') {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.INVALID_STATUS,
      };
    }

    // Validate lesson has ended
    const now = new Date();
    const lessonEndTime = new Date(lesson.end_time);
    if (lessonEndTime > now) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.FUTURE_LESSON,
      };
    }

    // Update lesson status to Completed
    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        status: 'Completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId)
      .eq('coach_id', user.id);

    if (updateError) {
      console.error('Error confirming lesson:', updateError);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.CONFIRM_FAILED,
      };
    }

    // Revalidate pages that display lesson data
    revalidatePath('/outstanding-lessons');
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/calendar');

    return {
      success: true,
      message: SUCCESS_MESSAGES.LESSON_HISTORY.CONFIRMED,
    };
  } catch (error: any) {
    console.error('Unexpected error in confirmLesson:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Mark a lesson as No Show
 * Updates lesson status to 'No Show' and cancels associated invoice
 */
export async function markLessonNoShow(
  lessonId: string
): Promise<LessonHistoryActionResponse> {
  try {
    const supabase = await createClient();

    // Verify authentication
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

    // First, fetch the lesson to validate ownership and status
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('coach_id', user.id)
      .single();

    if (fetchError || !lesson) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.NOT_FOUND,
      };
    }

    // Validate lesson status
    if (lesson.status !== 'Scheduled') {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.NOT_SCHEDULED,
      };
    }

    // Update lesson status to No Show
    const { error: updateLessonError } = await supabase
      .from('lessons')
      .update({
        status: 'No Show',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId)
      .eq('coach_id', user.id);

    if (updateLessonError) {
      console.error('Error marking lesson as no-show:', updateLessonError);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.CONFIRM_FAILED,
      };
    }

    // Update associated invoice to Canceled status
    const { error: updateInvoiceError } = await supabase
      .from('invoices')
      .update({
        payment_status: 'Canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('lesson_id', lessonId)
      .eq('coach_id', user.id);

    if (updateInvoiceError) {
      console.error('Error updating invoice for no-show:', updateInvoiceError);
      // Note: We continue even if invoice update fails, as lesson status is more critical
    }

    // Revalidate pages that display lesson data
    revalidatePath('/outstanding-lessons');
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/calendar');

    return {
      success: true,
      message: SUCCESS_MESSAGES.LESSON_HISTORY.MARKED_NO_SHOW,
    };
  } catch (error: any) {
    console.error('Unexpected error in markLessonNoShow:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Get lesson history for a specific client
 * Returns completed lessons with invoice/payment information
 */
export async function getLessonHistory(
  clientId: string,
  filters?: LessonHistoryFilters
): Promise<LessonHistoryActionResponse<LessonHistoryEntry[]>> {
  try {
    const supabase = await createClient();

    // Verify authentication
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

    // Build query for lessons with invoices
    // Include both Scheduled and Completed lessons
    let query = supabase
      .from('lessons')
      .select(
        `
        id,
        title,
        description,
        start_time,
        end_time,
        location,
        rate_at_booking,
        duration_hours,
        status,
        client:clients (
          athlete_name
        ),
        invoices (
          id,
          payment_status,
          paid_at,
          amount_due
        )
      `
      )
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .in('status', ['Scheduled', 'Completed']);

    // Apply date filters if provided
    if (filters?.dateFrom) {
      query = query.gte('start_time', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('start_time', filters.dateTo);
    }

    // Order by start time descending (newest first)
    query = query.order('start_time', { ascending: false });

    const { data: lessons, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching lesson history:', queryError);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.FETCH_FAILED,
      };
    }

    // Transform data into LessonHistoryEntry format
    const lessonHistory: LessonHistoryEntry[] = (lessons || []).map((lesson: any) => {
      const invoice = lesson.invoices?.[0]; // Get first invoice (should be one-to-one)
      const startTime = new Date(lesson.start_time);

      return {
        lessonId: lesson.id,
        invoiceId: invoice?.id || '',
        date: startTime.toISOString().split('T')[0], // YYYY-MM-DD
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        serviceType: lesson.title,
        duration: lesson.duration_hours || 0,
        rate: lesson.rate_at_booking,
        lessonStatus: lesson.status,
        paymentStatus: invoice?.payment_status || 'Pending',
        paidAt: invoice?.paid_at || null,
        notes: lesson.description || undefined,
        location: lesson.location || undefined,
        clientName: lesson.client?.athlete_name || '',
      };
    });

    // Apply payment status filter if provided
    let filteredHistory = lessonHistory;
    if (filters?.paymentStatus && filters.paymentStatus !== 'All') {
      filteredHistory = lessonHistory.filter(
        (entry) => entry.paymentStatus === filters.paymentStatus
      );
    }

    return {
      success: true,
      data: filteredHistory,
    };
  } catch (error: any) {
    console.error('Unexpected error in getLessonHistory:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Calculate unpaid balance for a specific client
 * Sums all invoices with Pending or Overdue status
 */
export async function calculateUnpaidBalance(
  clientId: string
): Promise<LessonHistoryActionResponse<{ balance: number }>> {
  try {
    const supabase = await createClient();

    // Verify authentication
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

    // Query invoices with pending/overdue status
    const { data: invoices, error: queryError } = await supabase
      .from('invoices')
      .select('amount_due')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .in('payment_status', ['Pending', 'Overdue']);

    if (queryError) {
      console.error('Error calculating unpaid balance:', queryError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.CALCULATE_FAILED,
      };
    }

    // Sum all unpaid amounts
    const balance = (invoices || []).reduce(
      (sum, invoice) => sum + (invoice.amount_due || 0),
      0
    );

    return {
      success: true,
      data: { balance: Number(balance.toFixed(2)) },
    };
  } catch (error: any) {
    console.error('Unexpected error in calculateUnpaidBalance:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Mark a single lesson as paid
 * Updates invoice payment_status to 'Paid' and sets paid_at timestamp
 */
export async function markLessonAsPaid(
  lessonId: string
): Promise<LessonHistoryActionResponse> {
  try {
    const supabase = await createClient();

    // Verify authentication
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

    // Fetch the lesson to validate it's completed
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('status')
      .eq('id', lessonId)
      .eq('coach_id', user.id)
      .single();

    if (fetchError || !lesson) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.NOT_FOUND,
      };
    }

    // Validate lesson is completed
    if (lesson.status !== 'Completed') {
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.NOT_COMPLETED,
      };
    }

    // Update invoice to Paid status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        payment_status: 'Paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('lesson_id', lessonId)
      .eq('coach_id', user.id);

    if (updateError) {
      console.error('Error marking lesson as paid:', updateError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.MARK_PAID_FAILED,
      };
    }

    // Revalidate pages that display payment data
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: SUCCESS_MESSAGES.PAYMENT.MARKED_PAID,
    };
  } catch (error: any) {
    console.error('Unexpected error in markLessonAsPaid:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Mark all unpaid lessons for a client as paid
 * Bulk updates all invoices with Pending status to Paid
 */
export async function markAllLessonsPaid(
  clientId: string
): Promise<LessonHistoryActionResponse<{ count: number; totalAmount: number }>> {
  try {
    const supabase = await createClient();

    // Verify authentication
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

    // First, fetch all pending invoices to get count and total
    const { data: pendingInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, amount_due')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .eq('payment_status', 'Pending');

    if (fetchError) {
      console.error('Error fetching pending invoices:', fetchError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.BULK_UPDATE_FAILED,
      };
    }

    const count = pendingInvoices?.length || 0;
    const totalAmount = (pendingInvoices || []).reduce(
      (sum, inv) => sum + (inv.amount_due || 0),
      0
    );

    if (count === 0) {
      return {
        success: true,
        data: { count: 0, totalAmount: 0 },
        message: 'No pending invoices to update.',
      };
    }

    // Update all pending invoices to Paid
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        payment_status: 'Paid',
        paid_at: now,
        updated_at: now,
      })
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .eq('payment_status', 'Pending');

    if (updateError) {
      console.error('Error bulk updating invoices:', updateError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.BULK_UPDATE_FAILED,
      };
    }

    // Revalidate pages that display payment data
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: { count, totalAmount: Number(totalAmount.toFixed(2)) },
      message: SUCCESS_MESSAGES.PAYMENT.BULK_PAID(count),
    };
  } catch (error: any) {
    console.error('Unexpected error in markAllLessonsPaid:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}
