import { Lesson, LessonWithClient } from './lesson';

/**
 * Outstanding Lesson View Model
 * Extends LessonWithClient with convenience properties for UI display
 */
export interface OutstandingLesson extends LessonWithClient {
  displayDate: string; // Formatted date like "Dec 15, 2025"
  displayTime: string; // Formatted time range like "10:00 AM - 11:00 AM"
  formattedCost: string; // Formatted currency like "$75.00"
}

/**
 * Lesson History Entry
 * Combines lesson and invoice data for payment tracking
 */
export interface LessonHistoryEntry {
  lessonId: string;
  invoiceId: string;
  date: string; // ISO 8601 date portion (YYYY-MM-DD)
  startTime: string; // ISO 8601 datetime
  endTime: string; // ISO 8601 datetime
  serviceType: string; // lesson.title
  duration: number; // hours
  rate: number; // rate_at_booking
  lessonStatus: 'Scheduled' | 'Completed' | 'Canceled' | 'No Show';
  paymentStatus: 'Pending' | 'Paid' | 'Overdue' | 'Canceled';
  paidAt?: string | null;
  notes?: string;
  location?: string;
  clientName?: string; // For display purposes
}

/**
 * Lesson History Summary
 * Aggregated statistics for a client's lesson history
 */
export interface LessonHistorySummary {
  totalLessons: number;
  completedLessons: number;
  pendingPayments: number;
  unpaidBalance: number; // Sum of all pending/overdue amounts
}

/**
 * Lesson History Filters
 * Optional filter criteria for querying lesson history
 */
export interface LessonHistoryFilters {
  paymentStatus?: 'All' | 'Pending' | 'Paid' | 'Overdue';
  dateFrom?: string; // ISO 8601 date
  dateTo?: string; // ISO 8601 date
}

/**
 * Lesson History Sort Options
 * Configuration for sorting lesson history results
 */
export interface LessonHistorySortOptions {
  sortBy: 'date' | 'status' | 'amount';
  sortOrder: 'asc' | 'desc';
}

/**
 * Server Action Response Types
 * Standardized response format for all lesson history actions
 */
export interface LessonHistoryActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Outstanding Lessons Count Response
 * Response type for getting count of outstanding lessons
 */
export interface OutstandingLessonsCountResponse {
  count: number;
}

/**
 * Bulk Payment Update Response
 * Response type for bulk payment status updates
 */
export interface BulkPaymentUpdateResponse {
  updatedCount: number;
  totalAmount: number;
  failedCount?: number;
}
