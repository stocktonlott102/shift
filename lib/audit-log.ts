/**
 * Audit Logging Utility
 *
 * Provides functions to log critical operations for security and compliance.
 * All logs are stored in the audit_logs table with RLS protection.
 *
 * Usage:
 * ```typescript
 * await logAuditEvent({
 *   userId: user.id,
 *   action: 'client.created',
 *   resourceType: 'client',
 *   resourceId: newClient.id,
 *   description: `Created client: ${newClient.first_name} ${newClient.last_name}`,
 *   metadata: { first_name: newClient.first_name, last_name: newClient.last_name }
 * });
 * ```
 */

import { createClient } from '@/lib/supabase/server';

// =====================================================
// Types
// =====================================================

export interface AuditLogEvent {
  userId: string;
  userEmail?: string;
  action: string; // Format: 'resource.action' (e.g., 'client.created', 'lesson.deleted')
  resourceType: string; // e.g., 'client', 'lesson', 'payment'
  resourceId?: string; // UUID of the affected resource (optional for bulk ops)
  description?: string; // Human-readable description
  metadata?: Record<string, any>; // Additional structured data
  ipAddress?: string; // IP address of the user
  userAgent?: string; // Browser/client info
}

// Standard action types for consistency
export const AuditActions = {
  // Client actions
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_DELETED: 'client.deleted',

  // Lesson actions
  LESSON_CREATED: 'lesson.created',
  LESSON_UPDATED: 'lesson.updated',
  LESSON_DELETED: 'lesson.deleted',
  LESSON_CANCELLED: 'lesson.cancelled',
  RECURRING_LESSONS_CREATED: 'recurring_lessons.created',
  RECURRING_LESSONS_DELETED: 'recurring_lessons.deleted',

  // Payment actions
  PAYMENT_MARKED_PAID: 'payment.marked_paid',
  PAYMENT_STATUS_CHANGED: 'payment.status_changed',
  BULK_PAYMENTS_MARKED_PAID: 'payments.bulk_marked_paid',

  // Lesson type actions
  LESSON_TYPE_CREATED: 'lesson_type.created',
  LESSON_TYPE_UPDATED: 'lesson_type.updated',
  LESSON_TYPE_DELETED: 'lesson_type.deleted',

  // Authentication actions (for security monitoring)
  USER_LOGGED_IN: 'auth.logged_in',
  USER_LOGGED_OUT: 'auth.logged_out',
  USER_SIGNUP: 'auth.signup',

  // Data export actions
  DATA_EXPORTED: 'data.exported',
} as const;

// Resource types for consistency
export const ResourceTypes = {
  CLIENT: 'client',
  LESSON: 'lesson',
  LESSON_PARTICIPANT: 'lesson_participant',
  LESSON_TYPE: 'lesson_type',
  INVOICE: 'invoice',
  USER: 'user',
  PROFILE: 'profile',
} as const;

// =====================================================
// Main Audit Logging Function
// =====================================================

/**
 * Log an audit event to the database
 *
 * @param event - The audit event to log
 * @returns Promise<boolean> - True if successful, false otherwise
 *
 * @example
 * ```typescript
 * await logAuditEvent({
 *   userId: user.id,
 *   action: AuditActions.CLIENT_CREATED,
 *   resourceType: ResourceTypes.CLIENT,
 *   resourceId: client.id,
 *   description: `Created client: ${client.first_name} ${client.last_name}`,
 *   metadata: { first_name: client.first_name, last_name: client.last_name }
 * });
 * ```
 */
export async function logAuditEvent(event: AuditLogEvent): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get user email if not provided
    let userEmail = event.userEmail;
    if (!userEmail) {
      const { data: userData } = await supabase.auth.getUser();
      userEmail = userData.user?.email;
    }

    // Insert audit log
    const { error } = await supabase.from('audit_logs').insert({
      user_id: event.userId,
      user_email: userEmail,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId || null,
      description: event.description || null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
    });

    if (error) {
      console.error('Failed to log audit event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging should never break the main operation
    return false;
  }
}

// =====================================================
// Convenience Functions for Common Operations
// =====================================================

/**
 * Log client creation
 */
export async function logClientCreated(
  userId: string,
  clientId: string,
  clientName: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    userId,
    action: AuditActions.CLIENT_CREATED,
    resourceType: ResourceTypes.CLIENT,
    resourceId: clientId,
    description: `Created client: ${clientName}`,
    metadata,
  });
}

/**
 * Log client update
 */
export async function logClientUpdated(
  userId: string,
  clientId: string,
  clientName: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
) {
  return logAuditEvent({
    userId,
    action: AuditActions.CLIENT_UPDATED,
    resourceType: ResourceTypes.CLIENT,
    resourceId: clientId,
    description: `Updated client: ${clientName}`,
    metadata: { old_values: oldValues, new_values: newValues },
  });
}

/**
 * Log client deletion
 */
export async function logClientDeleted(
  userId: string,
  clientId: string,
  clientName: string,
  reason?: string
) {
  return logAuditEvent({
    userId,
    action: AuditActions.CLIENT_DELETED,
    resourceType: ResourceTypes.CLIENT,
    resourceId: clientId,
    description: `Deleted client: ${clientName}`,
    metadata: reason ? { reason } : undefined,
  });
}

/**
 * Log lesson creation
 */
export async function logLessonCreated(
  userId: string,
  lessonId: string,
  lessonTitle: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    userId,
    action: AuditActions.LESSON_CREATED,
    resourceType: ResourceTypes.LESSON,
    resourceId: lessonId,
    description: `Created lesson: ${lessonTitle}`,
    metadata,
  });
}

/**
 * Log lesson deletion
 */
export async function logLessonDeleted(
  userId: string,
  lessonId: string,
  lessonTitle: string,
  reason?: string
) {
  return logAuditEvent({
    userId,
    action: AuditActions.LESSON_DELETED,
    resourceType: ResourceTypes.LESSON,
    resourceId: lessonId,
    description: `Deleted lesson: ${lessonTitle}`,
    metadata: reason ? { reason } : undefined,
  });
}

/**
 * Log recurring lessons creation
 */
export async function logRecurringLessonsCreated(
  userId: string,
  parentLessonId: string,
  lessonTitle: string,
  count: number
) {
  return logAuditEvent({
    userId,
    action: AuditActions.RECURRING_LESSONS_CREATED,
    resourceType: ResourceTypes.LESSON,
    resourceId: parentLessonId,
    description: `Created ${count} recurring lessons: ${lessonTitle}`,
    metadata: { lesson_count: count, parent_lesson_id: parentLessonId },
  });
}

/**
 * Log payment marked as paid
 */
export async function logPaymentMarkedPaid(
  userId: string,
  participantId: string,
  clientName: string,
  amount: number
) {
  return logAuditEvent({
    userId,
    action: AuditActions.PAYMENT_MARKED_PAID,
    resourceType: ResourceTypes.LESSON_PARTICIPANT,
    resourceId: participantId,
    description: `Marked payment as paid for ${clientName} ($${amount})`,
    metadata: { amount, client_name: clientName },
  });
}

/**
 * Log bulk payments marked as paid
 */
export async function logBulkPaymentsMarkedPaid(
  userId: string,
  clientId: string,
  clientName: string,
  count: number,
  totalAmount: number
) {
  return logAuditEvent({
    userId,
    action: AuditActions.BULK_PAYMENTS_MARKED_PAID,
    resourceType: ResourceTypes.CLIENT,
    resourceId: clientId,
    description: `Marked ${count} payments as paid for ${clientName} (Total: $${totalAmount})`,
    metadata: { payment_count: count, total_amount: totalAmount, client_name: clientName },
  });
}

// =====================================================
// Query Functions for Viewing Audit Logs
// =====================================================

/**
 * Get recent audit logs for the current user
 */
export async function getRecentAuditLogs(limit: number = 50) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated', data: [] };

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(resourceType: string, resourceId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated', data: [] };

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resource audit logs:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching resource audit logs:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(action: string, limit: number = 50) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated', data: [] };

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs by action:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching audit logs by action:', error);
    return { success: false, error: error.message, data: [] };
  }
}
