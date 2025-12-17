/**
 * Lesson and Invoice Type Definitions
 *
 * Centralized type definitions for lesson calendar and invoicing
 */

import { LessonType } from './lesson-type';
import { Client } from './client';

// =====================================================
// ENUMS
// =====================================================

export type LessonStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
export type PaymentStatus = 'Pending' | 'Paid' | 'Overdue' | 'Canceled';

// =====================================================
// LESSON PARTICIPANT TYPES
// =====================================================

export interface LessonParticipant {
  id: string;
  lesson_id: string;
  client_id: string;
  amount_owed: number;
  created_at: string;
}

export interface LessonParticipantWithClient extends LessonParticipant {
  client: Client;
}

// =====================================================
// LESSON TYPES
// =====================================================

export interface Lesson {
  id: string;
  coach_id: string;
  client_id: string | null; // Deprecated: kept for backward compatibility with old lessons
  lesson_type_id: string | null; // New: references lesson_types table

  // Lesson Details
  title: string;
  description?: string | null;
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
  location?: string | null;

  // Financial
  rate_at_booking: number; // Historical rate snapshot
  duration_hours?: number; // Calculated field

  // Status
  status: LessonStatus;
  cancelled_at?: string | null;
  cancelled_reason?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Form data for creating a new lesson (updated for multi-client support)
 */
export interface CreateLessonData {
  lesson_type_id: string | null; // null for custom lessons
  client_ids: string[]; // Multiple clients for group lessons
  title: string; // Auto-generated or custom
  description?: string;
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
  location?: string;
  custom_hourly_rate?: number; // Only for custom lessons (lesson_type_id = null)
}

/**
 * Form data for updating an existing lesson
 */
export interface UpdateLessonData {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  status?: LessonStatus;
}

/**
 * Data for cancelling a lesson
 */
export interface CancelLessonData {
  cancelled_reason?: string;
}

// =====================================================
// INVOICE TYPES
// =====================================================

export interface Invoice {
  id: string;
  lesson_id: string;
  client_id: string;
  coach_id: string;

  // Invoice Details
  invoice_number: string;
  amount_due: number;
  due_date: string; // ISO 8601 date

  // Payment
  payment_status: PaymentStatus;
  paid_at?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Form data for creating an invoice
 * (Typically created automatically when a lesson is booked)
 */
export interface CreateInvoiceData {
  lesson_id: string;
  client_id: string;
  amount_due: number;
  due_date: string; // ISO 8601 date
}

/**
 * Form data for updating an invoice
 */
export interface UpdateInvoiceData {
  payment_status?: PaymentStatus;
  paid_at?: string;
  due_date?: string;
}

// =====================================================
// JOINED TYPES (for displaying data)
// =====================================================

/**
 * Lesson with client information
 * (useful for calendar display)
 * DEPRECATED: Use LessonWithParticipants for new lessons
 */
export interface LessonWithClient extends Lesson {
  client: {
    id: string;
    athlete_name: string;
    parent_email: string;
    parent_phone: string;
  } | null;
  lesson_participants?: Array<{
    id: string;
    client_id: string;
    amount_owed: number;
    client: {
      id: string;
      athlete_name: string;
      parent_email: string;
      parent_phone: string;
    };
  }>;
}

/**
 * Lesson with participants and lesson type
 * (for new multi-client lessons)
 */
export interface LessonWithParticipants extends Lesson {
  participants?: LessonParticipantWithClient[];
  lesson_type?: LessonType | null;
}

/**
 * Invoice with lesson and client information
 * (useful for invoice list display)
 */
export interface InvoiceWithDetails extends Invoice {
  lesson: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  };
  client: {
    id: string;
    athlete_name: string;
    parent_email: string;
  };
}
