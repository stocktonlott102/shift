'use server';

import { createClient } from '@/lib/supabase/server';
import { ERROR_MESSAGES } from '@/lib/constants/messages';
import type {
  FinancialData,
  MonthlyIncome,
  ClientIncome,
  LessonTypeIncome,
  TaxSummary,
  QuarterlyIncome,
  LessonExportRow,
} from '@/lib/types/financial';

const QUARTERLY_DEADLINES: Record<number, string> = {
  1: 'Apr 15',
  2: 'Jun 15',
  3: 'Sep 15',
  4: 'Jan 15',
};

const QUARTER_LABELS: Record<number, string> = {
  1: 'Q1 (Jan–Mar)',
  2: 'Q2 (Apr–Jun)',
  3: 'Q3 (Jul–Sep)',
  4: 'Q4 (Oct–Dec)',
};

function getQuarter(month: number): number {
  return Math.floor(month / 3) + 1;
}

function getDurationHours(startTime: string, endTime: string): number {
  return (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
}

/**
 * Server Action: Get all financial data for a given year.
 *
 * Fetches lessons for the year with participants, lesson types, and clients,
 * then aggregates into monthly income, client breakdown, lesson type breakdown,
 * tax summary, and raw lesson details for CSV export.
 */
export async function getFinancialSummary(year: number): Promise<{
  success: boolean;
  error?: string;
  data?: FinancialData;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: ERROR_MESSAGES.AUTH.NOT_LOGGED_IN };
    }

    const yearStart = `${year}-01-01T00:00:00.000Z`;
    const yearEnd = `${year + 1}-01-01T00:00:00.000Z`;

    // Fetch all non-cancelled lessons for the year with participants and types
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        start_time,
        end_time,
        status,
        rate_at_booking,
        lesson_type_id,
        client_id,
        title,
        lesson_type:lesson_types (
          id,
          name,
          color,
          hourly_rate
        ),
        lesson_participants (
          client_id,
          amount_owed,
          payment_status,
          paid_at,
          client:clients (
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq('coach_id', user.id)
      .gte('start_time', yearStart)
      .lt('start_time', yearEnd)
      .neq('status', 'Cancelled')
      .order('start_time', { ascending: true });

    if (lessonsError) {
      console.error('Error fetching lessons for financials:', lessonsError);
      return { success: false, error: 'Failed to fetch financial data.' };
    }

    // For legacy lessons that have client_id but no participants,
    // we need to look up the client name
    const legacyClientIds = new Set<string>();
    for (const lesson of lessons || []) {
      const participants = (lesson as any).lesson_participants || [];
      if (participants.length === 0 && lesson.client_id) {
        legacyClientIds.add(lesson.client_id);
      }
    }

    let legacyClients: Record<string, { first_name: string; last_name: string }> = {};
    if (legacyClientIds.size > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .in('id', Array.from(legacyClientIds));

      if (clients) {
        for (const c of clients) {
          legacyClients[c.id] = { first_name: c.first_name, last_name: c.last_name };
        }
      }
    }

    // --- Aggregation ---
    const monthlyMap: MonthlyIncome[] = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      totalPaid: 0,
      lessonCount: 0,
      hoursCoached: 0,
    }));

    const clientMap = new Map<string, ClientIncome>();
    const lessonTypeMap = new Map<string | 'uncategorized', LessonTypeIncome>();
    const quarterlyMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const uniqueClients = new Set<string>();
    const lessonDetails: LessonExportRow[] = [];

    let totalLessons = 0;
    let totalHoursCoached = 0;
    let grossIncome = 0;

    for (const lesson of lessons || []) {
      const startDate = new Date(lesson.start_time);
      const month = startDate.getMonth();
      const quarter = getQuarter(month);
      const durationHours = getDurationHours(lesson.start_time, lesson.end_time);
      const participants = (lesson as any).lesson_participants || [];
      const lessonType = (lesson as any).lesson_type as {
        id: string;
        name: string;
        color: string;
        hourly_rate: number;
      } | null;

      totalLessons++;
      totalHoursCoached += durationHours;
      monthlyMap[month].lessonCount++;
      monthlyMap[month].hoursCoached += durationHours;

      // Determine lesson type key
      const ltKey = lessonType ? lessonType.id : 'uncategorized';
      if (!lessonTypeMap.has(ltKey)) {
        lessonTypeMap.set(ltKey, {
          lessonTypeId: lessonType ? lessonType.id : null,
          lessonTypeName: lessonType ? lessonType.name : 'Uncategorized',
          lessonTypeColor: lessonType ? lessonType.color : '#9CA3AF',
          lessonCount: 0,
          hoursCoached: 0,
          totalPaid: 0,
          rate: lessonType ? Number(lessonType.hourly_rate) : 0,
        });
      }
      const ltEntry = lessonTypeMap.get(ltKey)!;
      ltEntry.lessonCount++;
      ltEntry.hoursCoached += durationHours;

      if (participants.length > 0) {
        // Modern lessons with participants
        for (const p of participants) {
          const client = (p as any).client as {
            id: string;
            first_name: string;
            last_name: string;
          } | null;
          const clientId = p.client_id || client?.id || 'unknown';
          const clientName = client
            ? `${client.first_name} ${client.last_name}`
            : 'Unknown Client';
          const amount = Number(p.amount_owed) || 0;
          const isPaid = p.payment_status === 'Paid';

          uniqueClients.add(clientId);

          // Client breakdown
          if (!clientMap.has(clientId)) {
            clientMap.set(clientId, {
              clientId,
              clientName,
              lessonCount: 0,
              hoursCoached: 0,
              totalPaid: 0,
            });
          }
          const ce = clientMap.get(clientId)!;
          ce.lessonCount++;
          ce.hoursCoached += durationHours / participants.length;

          if (isPaid) {
            ce.totalPaid += amount;
            monthlyMap[month].totalPaid += amount;
            quarterlyMap[quarter] += amount;
            grossIncome += amount;
            ltEntry.totalPaid += amount;
          }

          // Lesson detail for CSV export
          lessonDetails.push({
            date: startDate.toISOString().split('T')[0],
            clientName,
            lessonType: lessonType ? lessonType.name : 'Uncategorized',
            durationHours: Math.round((durationHours / participants.length) * 100) / 100,
            amountPaid: isPaid ? amount : 0,
            paymentStatus: p.payment_status,
          });
        }
      } else {
        // Legacy lesson without participants — fall back to rate_at_booking
        const rate = Number(lesson.rate_at_booking) || 0;
        const amount = Math.round(rate * durationHours * 100) / 100;
        const clientId = lesson.client_id || 'unknown';
        const legacyClient = lesson.client_id ? legacyClients[lesson.client_id] : null;
        const clientName = legacyClient
          ? `${legacyClient.first_name} ${legacyClient.last_name}`
          : 'Unknown Client';

        // Legacy lessons are treated as paid if status is Completed
        const isPaid = lesson.status === 'Completed';

        if (clientId !== 'unknown') uniqueClients.add(clientId);

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            clientId,
            clientName,
            lessonCount: 0,
            hoursCoached: 0,
            totalPaid: 0,
          });
        }
        const ce = clientMap.get(clientId)!;
        ce.lessonCount++;
        ce.hoursCoached += durationHours;

        if (isPaid) {
          ce.totalPaid += amount;
          monthlyMap[month].totalPaid += amount;
          quarterlyMap[quarter] += amount;
          grossIncome += amount;
          ltEntry.totalPaid += amount;
        }

        lessonDetails.push({
          date: startDate.toISOString().split('T')[0],
          clientName,
          lessonType: lessonType ? lessonType.name : 'Uncategorized',
          durationHours: Math.round(durationHours * 100) / 100,
          amountPaid: isPaid ? amount : 0,
          paymentStatus: isPaid ? 'Paid' : 'Pending',
        });
      }
    }

    // Build quarterly breakdown
    const quarterlyBreakdown: QuarterlyIncome[] = [1, 2, 3, 4].map((q) => ({
      quarter: q,
      label: QUARTER_LABELS[q],
      income: Math.round(quarterlyMap[q] * 100) / 100,
      deadline: `${QUARTERLY_DEADLINES[q]}, ${q === 4 ? year + 1 : year}`,
    }));

    const taxSummary: TaxSummary = {
      grossIncome: Math.round(grossIncome * 100) / 100,
      quarterlyBreakdown,
      totalLessons,
      totalHoursCoached: Math.round(totalHoursCoached * 100) / 100,
      uniqueClientsServed: uniqueClients.size,
    };

    // Sort breakdowns
    const clientBreakdown = Array.from(clientMap.values()).sort(
      (a, b) => b.totalPaid - a.totalPaid
    );
    const lessonTypeBreakdown = Array.from(lessonTypeMap.values()).sort(
      (a, b) => b.totalPaid - a.totalPaid
    );

    return {
      success: true,
      data: {
        year,
        monthlyIncome: monthlyMap,
        clientBreakdown,
        lessonTypeBreakdown,
        taxSummary,
        lessonDetails,
      },
    };
  } catch (error: any) {
    console.error('Unexpected error in getFinancialSummary:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR,
    };
  }
}
