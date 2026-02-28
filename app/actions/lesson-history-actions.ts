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
import {
  ConfirmLessonSchema,
  MarkLessonNoShowSchema,
  GetLessonHistorySchema,
  CalculateUnpaidBalanceSchema,
  MarkLessonAsPaidSchema,
  MarkLessonAsUnpaidSchema,
  MarkAllLessonsPaidSchema,
  MarkParticipantPaidSchema,
  MarkLessonParticipantsPaidSchema,
} from '@/lib/validations/lesson-history';
import {
  logLessonCompleted,
  logLessonNoShow,
  logPaymentMarkedPaid,
  logBulkPaymentsMarkedPaid,
} from '@/lib/audit-log';

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
          first_name,
          last_name,
          parent_email,
          parent_phone
        ),
        lesson_participants (
          id,
          client_id,
          amount_owed,
          client:clients (
            id,
            first_name,
            last_name,
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
 * Uses Zod validation to prevent injection attacks
 */
export async function confirmLesson(input: unknown): Promise<LessonHistoryActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = ConfirmLessonSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { lessonId } = validationResult.data;

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

    // Log lesson confirmation (fire-and-forget)
    logLessonCompleted(user.id, lessonId, lesson.title || 'Unknown');

    // Revalidate pages that display lesson data
    revalidatePath('/outstanding-lessons');
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/calendar');
    revalidatePath('/dashboard');

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
 * Uses Zod validation to prevent injection attacks
 */
export async function markLessonNoShow(input: unknown): Promise<LessonHistoryActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = MarkLessonNoShowSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { lessonId } = validationResult.data;

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

    // Log lesson no-show (fire-and-forget)
    logLessonNoShow(user.id, lessonId, lesson.title || 'Unknown');

    // Revalidate pages that display lesson data
    revalidatePath('/outstanding-lessons');
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/calendar');
    revalidatePath('/dashboard');

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
 * Handles both legacy (client_id) and new (lesson_participants) lesson structures
 * Uses Zod validation to prevent injection attacks
 */
export async function getLessonHistory(input: unknown): Promise<LessonHistoryActionResponse<LessonHistoryEntry[]>> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = GetLessonHistorySchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { clientId, filters } = validationResult.data;

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

    // Query lesson_participants to find all lessons for this client
    const { data: participants, error: participantsError } = await supabase
      .from('lesson_participants')
      .select('lesson_id, amount_owed, payment_status, paid_at')
      .eq('client_id', clientId);

    if (participantsError) {
      console.error('Error fetching lesson participants:', participantsError);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.FETCH_FAILED,
      };
    }

    if (!participants || participants.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const lessonIds = participants.map(p => p.lesson_id);

    // Now fetch the actual lessons and their details
    let lessonsQuery = supabase
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
        coach_id
      `
      )
      .in('id', lessonIds)
      .eq('coach_id', user.id)
      .in('status', ['Scheduled', 'Completed']);

    // Apply date filters if provided
    if (filters?.dateFrom) {
      lessonsQuery = lessonsQuery.gte('start_time', filters.dateFrom);
    }
    if (filters?.dateTo) {
      lessonsQuery = lessonsQuery.lte('start_time', filters.dateTo);
    }

    // Order by start time descending (newest first)
    lessonsQuery = lessonsQuery.order('start_time', { ascending: false });

    const { data: lessons, error: lessonsError } = await lessonsQuery;

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON_HISTORY.FETCH_FAILED,
      };
    }

    // Create a map of lesson IDs to their participant data for quick lookup
    const participantMap = new Map(
      participants.map(p => [p.lesson_id, { amount_owed: p.amount_owed, payment_status: p.payment_status, paid_at: p.paid_at }])
    );

    // Transform data into LessonHistoryEntry format
    const lessonHistory: LessonHistoryEntry[] = (lessons || []).map((lesson: any) => {
      const startTime = new Date(lesson.start_time);
      const participantData = participantMap.get(lesson.id);
      const clientCharge = participantData?.amount_owed || 0;
      const paymentStatus = participantData?.payment_status || 'Pending';
      const paidAt = participantData?.paid_at || null;

      return {
        lessonId: lesson.id,
        invoiceId: '', // No invoices in this system
        date: startTime.toISOString().split('T')[0], // YYYY-MM-DD
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        serviceType: lesson.title,
        duration: lesson.duration_hours || 0,
        charge: clientCharge,
        lessonStatus: lesson.status,
        paymentStatus: paymentStatus,
        paidAt: paidAt,
        notes: lesson.description || undefined,
        location: lesson.location || undefined,
      };
    });

    // Apply payment status filter if provided
    let finalHistory = lessonHistory;
    if (filters?.paymentStatus && filters.paymentStatus !== 'All') {
      finalHistory = lessonHistory.filter(
        (entry) => entry.paymentStatus === filters.paymentStatus
      );
    }

    return {
      success: true,
      data: finalHistory,
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
 * Sums all lesson_participants amount_owed for COMPLETED lessons (confirmed by coach)
 * Uses Zod validation to prevent injection attacks
 */
export async function calculateUnpaidBalance(input: unknown): Promise<LessonHistoryActionResponse<{ balance: number }>> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = CalculateUnpaidBalanceSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { clientId } = validationResult.data;

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

    console.log(`[calculateUnpaidBalance] Calculating balance for client: ${clientId}, user: ${user.id}`);

    // Step 1: Get all lesson_participants for this client with Pending payment status
    const { data: participants, error: pError } = await supabase
      .from('lesson_participants')
      .select('lesson_id, amount_owed, payment_status')
      .eq('client_id', clientId)
      .eq('payment_status', 'Pending');

    if (pError) {
      console.error('Error fetching lesson_participants:', pError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.CALCULATE_FAILED,
      };
    }

    console.log(`[calculateUnpaidBalance] Found ${participants?.length || 0} lesson_participants`);
    if (participants && participants.length > 0) {
      console.log('[calculateUnpaidBalance] Participants:', participants);
    }

    if (!participants || participants.length === 0) {
      return {
        success: true,
        data: { balance: 0 },
      };
    }

    // Step 2: Get all the lesson IDs
    const lessonIds = participants.map(p => p.lesson_id);
    console.log(`[calculateUnpaidBalance] Lesson IDs: ${lessonIds.join(', ')}`);

    // Step 3: Fetch lessons to check status and coach ownership
    const { data: lessons, error: lError } = await supabase
      .from('lessons')
      .select('id, status, coach_id')
      .in('id', lessonIds)
      .eq('coach_id', user.id);

    if (lError) {
      console.error('Error fetching lessons:', lError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.CALCULATE_FAILED,
      };
    }

    console.log(`[calculateUnpaidBalance] Found ${lessons?.length || 0} lessons matching coach`);
    if (lessons && lessons.length > 0) {
      console.log('[calculateUnpaidBalance] Lessons:', lessons);
    }

    // Step 4: Create a map of completed lesson IDs
    const completedLessonIds = new Set(
      (lessons || [])
        .filter(l => l.status === 'Completed')
        .map(l => l.id)
    );

    console.log(`[calculateUnpaidBalance] Completed lesson IDs: ${Array.from(completedLessonIds).join(', ')}`);

    // Step 5: Sum up amounts for completed lessons
    const balance = (participants || [])
      .filter(p => completedLessonIds.has(p.lesson_id))
      .reduce((sum, p) => sum + (p.amount_owed || 0), 0);

    console.log(`[calculateUnpaidBalance] Final balance: ${balance}`);

    // Also return debug info temporarily
    console.log(`[DEBUG] Participants count: ${participants?.length}, Completed lessons: ${completedLessonIds.size}, Balance: ${balance}`);

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
 * Uses Zod validation to prevent injection attacks
 */
export async function markLessonAsPaid(input: unknown): Promise<LessonHistoryActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = MarkLessonAsPaidSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { lessonId, clientId } = validationResult.data;

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

    // Update lesson_participants for this lesson to mark as paid
    // If clientId provided, only update that client's participant record
    // Otherwise, update all participants for the lesson
    let updateQuery = supabase
      .from('lesson_participants')
      .update({
        payment_status: 'Paid',
        paid_at: new Date().toISOString(),
      })
      .eq('lesson_id', lessonId);
    
    if (clientId) {
      updateQuery = updateQuery.eq('client_id', clientId);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error marking lesson as paid:', updateError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.MARK_PAID_FAILED,
      };
    }

    // Log payment marked as paid (fire-and-forget)
    // Fetch participant details for logging
    if (clientId) {
      const { data: participant } = await supabase
        .from('lesson_participants')
        .select('amount_owed, client:clients(first_name, last_name)')
        .eq('lesson_id', lessonId)
        .eq('client_id', clientId)
        .single();

      if (participant) {
        const client = participant.client as any;
        logPaymentMarkedPaid(
          user.id,
          `${lessonId}-${clientId}`,
          client ? `${client.first_name} ${client.last_name}` : 'Unknown',
          participant.amount_owed || 0
        );
      }
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
 * Mark a lesson participant as unpaid
 * Sets payment_status back to Pending and clears paid_at
 * Uses Zod validation to prevent injection attacks
 */
export async function markLessonAsUnpaid(input: unknown): Promise<LessonHistoryActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = MarkLessonAsUnpaidSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { lessonId, clientId } = validationResult.data;

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

    // Fetch the lesson to validate it exists and belongs to this coach
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

    // Update lesson_participants to mark as unpaid
    let updateQuery = supabase
      .from('lesson_participants')
      .update({
        payment_status: 'Pending',
        paid_at: null,
      })
      .eq('lesson_id', lessonId);
    
    if (clientId) {
      updateQuery = updateQuery.eq('client_id', clientId);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error marking lesson as unpaid:', updateError);
      return {
        success: false,
        error: 'Failed to mark lesson as unpaid',
      };
    }

    // Revalidate pages that display payment data
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Lesson marked as unpaid',
    };
  } catch (error: any) {
    console.error('Unexpected error in markLessonAsUnpaid:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Mark all unpaid lessons for a client as paid
 * Bulk updates all invoices with Pending status to Paid
 * Uses Zod validation to prevent injection attacks
 */
export async function markAllLessonsPaid(input: unknown): Promise<LessonHistoryActionResponse<{ count: number; totalAmount: number }>> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = MarkAllLessonsPaidSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { clientId } = validationResult.data;

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

    // First, get all lesson_participants with pending payments for completed lessons
    // Step 1: Get participant records for this client with pending payment status
    const { data: participants, error: participantError } = await supabase
      .from('lesson_participants')
      .select('lesson_id, amount_owed')
      .eq('client_id', clientId)
      .eq('payment_status', 'Pending');

    if (participantError) {
      console.error('Error fetching lesson participants:', participantError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.BULK_UPDATE_FAILED,
      };
    }

    if (!participants || participants.length === 0) {
      return {
        success: true,
        data: { count: 0, totalAmount: 0 },
        message: 'No pending payments to update.',
      };
    }

    // Step 2: Get the lessons to verify they're completed and belong to this coach
    const lessonIds = participants.map(p => p.lesson_id);
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('coach_id', user.id)
      .eq('status', 'Completed')
      .in('id', lessonIds);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.BULK_UPDATE_FAILED,
      };
    }

    const completedLessonIds = (lessons || []).map(l => l.id);
    
    // Filter participants to only those with completed lessons
    const participantsToPay = participants.filter(p => 
      completedLessonIds.includes(p.lesson_id)
    );

    const count = participantsToPay.length;
    const totalAmount = participantsToPay.reduce(
      (sum, p) => sum + (p.amount_owed || 0),
      0
    );

    if (count === 0) {
      return {
        success: true,
        data: { count: 0, totalAmount: 0 },
        message: 'No pending payments for completed lessons.',
      };
    }

    // Update all lesson_participants for completed lessons to mark as paid
    const { error: updateError } = await supabase
      .from('lesson_participants')
      .update({
        payment_status: 'Paid',
        paid_at: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .in('lesson_id', completedLessonIds)
      .eq('payment_status', 'Pending');

    if (updateError) {
      console.error('Error bulk updating invoices:', updateError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.BULK_UPDATE_FAILED,
      };
    }

    // Log bulk payments marked as paid (fire-and-forget)
    // Fetch client name for logging
    const { data: clientData } = await supabase
      .from('clients')
      .select('first_name, last_name')
      .eq('id', clientId)
      .single();

    if (clientData) {
      logBulkPaymentsMarkedPaid(
        user.id,
        clientId,
        `${clientData.first_name} ${clientData.last_name}`,
        count,
        Number(totalAmount.toFixed(2))
      );
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

/**
 * Mark a lesson participant as paid
 * Updates the lesson_participants record's amount_owed to 0
 * Used for multi-client lessons where payments are tracked per participant
 * Uses Zod validation to prevent injection attacks
 */
export async function markParticipantPaid(input: unknown): Promise<LessonHistoryActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = MarkParticipantPaidSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { lessonId, clientId } = validationResult.data;

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

    // Verify the lesson belongs to this coach
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, coach_id')
      .eq('id', lessonId)
      .eq('coach_id', user.id)
      .single();

    if (lessonError || !lesson) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.NOT_FOUND,
      };
    }

    // Update the lesson_participants record
    const { error: updateError } = await supabase
      .from('lesson_participants')
      .update({
        amount_owed: 0,
      })
      .eq('lesson_id', lessonId)
      .eq('client_id', clientId);

    if (updateError) {
      console.error('Error marking participant as paid:', updateError);
      return {
        success: false,
        error: ERROR_MESSAGES.PAYMENT.MARK_PAID_FAILED,
      };
    }

    // Revalidate pages that display lesson data
    revalidatePath('/outstanding-lessons');
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: SUCCESS_MESSAGES.PAYMENT.MARKED_PAID,
    };
  } catch (error: any) {
    console.error('Unexpected error in markParticipantPaid:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Get unpaid balances for multiple clients in a single batch.
 * Replaces the N+1 loop in the clients list page:
 *   Before: 1 getClients query + (2 queries × N clients)
 *   After:  1 getClients query + 2 batch queries (constant)
 *
 * Algorithm:
 *   1. Fetch all lesson_participants with payment_status='Pending' for the given client IDs.
 *   2. Fetch all completed lessons (coach-owned) matching those lesson IDs.
 *   3. Intersect and sum in JS — no migration required.
 *
 * Returns a Map<client_id, balance> so callers can do O(1) lookups.
 */
export async function getClientBalancesBatch(
  clientIds: string[]
): Promise<LessonHistoryActionResponse<Map<string, number>>> {
  try {
    if (clientIds.length === 0) {
      return { success: true, data: new Map() };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    // Query 1: all pending participant records for these clients
    const { data: participants, error: pError } = await supabase
      .from('lesson_participants')
      .select('client_id, lesson_id, amount_owed')
      .in('client_id', clientIds)
      .eq('payment_status', 'Pending');

    if (pError) {
      console.error('Error fetching lesson_participants batch:', pError);
      return { success: false, error: ERROR_MESSAGES.PAYMENT.CALCULATE_FAILED };
    }

    if (!participants || participants.length === 0) {
      return { success: true, data: new Map(clientIds.map((id) => [id, 0])) };
    }

    // Query 2: verify coach ownership and Completed status for those lesson IDs
    const lessonIds = [...new Set(participants.map((p) => p.lesson_id))];

    const { data: completedLessons, error: lError } = await supabase
      .from('lessons')
      .select('id')
      .in('id', lessonIds)
      .eq('coach_id', user.id)
      .eq('status', 'Completed');

    if (lError) {
      console.error('Error fetching completed lessons batch:', lError);
      return { success: false, error: ERROR_MESSAGES.PAYMENT.CALCULATE_FAILED };
    }

    const completedIds = new Set((completedLessons || []).map((l) => l.id));

    // Aggregate in JS
    const balanceMap = new Map<string, number>(clientIds.map((id) => [id, 0]));
    for (const p of participants) {
      if (completedIds.has(p.lesson_id)) {
        balanceMap.set(p.client_id, (balanceMap.get(p.client_id) ?? 0) + (p.amount_owed || 0));
      }
    }

    // Round to 2 decimal places
    for (const [id, bal] of balanceMap) {
      balanceMap.set(id, Number(bal.toFixed(2)));
    }

    return { success: true, data: balanceMap };
  } catch (error: any) {
    console.error('Unexpected error in getClientBalancesBatch:', error);
    return { success: false, error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR };
  }
}

/**
 * Mark all participants in a lesson as paid
 * Updates all lesson_participants records to have amount_owed = 0
 * Used when confirming a completed multi-client lesson
 * Uses Zod validation to prevent injection attacks
 */
export async function markLessonParticipantsPaid(input: unknown): Promise<LessonHistoryActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = MarkLessonParticipantsPaidSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { lessonId } = validationResult.data;

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

    // Verify the lesson belongs to this coach
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, coach_id, lesson_participants(id)')
      .eq('id', lessonId)
      .eq('coach_id', user.id)
      .single();

    if (lessonError || !lesson) {
      return {
        success: false,
        error: ERROR_MESSAGES.LESSON.NOT_FOUND,
      };
    }

    // If lesson has participants, mark them all as paid
    if (lesson.lesson_participants && lesson.lesson_participants.length > 0) {
      const { error: updateError } = await supabase
        .from('lesson_participants')
        .update({
          amount_owed: 0,
        })
        .eq('lesson_id', lessonId);

      if (updateError) {
        console.error('Error marking lesson participants as paid:', updateError);
        return {
          success: false,
          error: ERROR_MESSAGES.PAYMENT.MARK_PAID_FAILED,
        };
      }
    }

    // Revalidate pages that display lesson data
    revalidatePath('/outstanding-lessons');
    revalidatePath('/clients/[id]', 'page');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: SUCCESS_MESSAGES.PAYMENT.MARKED_PAID,
    };
  } catch (error: any) {
    console.error('Unexpected error in markLessonParticipantsPaid:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}
