# Audit Logging Integration Guide

This document shows how to integrate audit logging into your server actions.

## Quick Start

### 1. Import the audit logging utilities

```typescript
import { logClientDeleted, AuditActions, ResourceTypes, logAuditEvent } from '@/lib/audit-log';
```

### 2. Add audit logging after successful operations

## Example: Client Deletion with Audit Logging

**Before** (current code in `app/actions/client-actions.ts`):

```typescript
export async function deleteClient(clientId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to delete a client.' };
    }

    // Delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('coach_id', user.id);

    if (error) {
      return { success: false, error: `Failed to delete client: ${error.message}` };
    }

    revalidatePath('/clients');
    return { success: true, message: 'Client deleted successfully' };
  } catch (error: any) {
    return { success: false, error: `An unexpected error occurred` };
  }
}
```

**After** (with audit logging):

```typescript
import { logClientDeleted } from '@/lib/audit-log';

export async function deleteClient(clientId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to delete a client.' };
    }

    // ⭐ Fetch client data BEFORE deletion (for audit log)
    const { data: client } = await supabase
      .from('clients')
      .select('first_name, last_name')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single();

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const clientName = `${client.first_name} ${client.last_name}`;

    // Delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('coach_id', user.id);

    if (error) {
      return { success: false, error: `Failed to delete client: ${error.message}` };
    }

    // ⭐ Log the deletion (async, non-blocking)
    await logClientDeleted(
      user.id,
      clientId,
      clientName,
      'User requested deletion'
    );

    revalidatePath('/clients');
    return { success: true, message: 'Client deleted successfully' };
  } catch (error: any) {
    return { success: false, error: `An unexpected error occurred` };
  }
}
```

## More Examples

### Example: Log Lesson Creation

```typescript
import { logLessonCreated } from '@/lib/audit-log';

// After creating the lesson...
const lesson = await supabase.from('lessons').insert(lessonData).select().single();

if (lesson.data) {
  await logLessonCreated(
    user.id,
    lesson.data.id,
    lesson.data.title,
    {
      client_ids: clientIds,
      start_time: lesson.data.start_time,
      end_time: lesson.data.end_time,
      is_recurring: lesson.data.is_recurring,
    }
  );
}
```

### Example: Log Payment Marked as Paid

```typescript
import { logPaymentMarkedPaid } from '@/lib/audit-log';

// After marking payment as paid...
await logPaymentMarkedPaid(
  user.id,
  participantId,
  clientName,
  amountPaid
);
```

### Example: Custom Audit Log Event

```typescript
import { logAuditEvent, AuditActions, ResourceTypes } from '@/lib/audit-log';

await logAuditEvent({
  userId: user.id,
  action: 'custom.action',
  resourceType: ResourceTypes.LESSON,
  resourceId: lessonId,
  description: 'Something important happened',
  metadata: {
    old_value: 'before',
    new_value: 'after',
    reason: 'User requested change'
  }
});
```

## Priority Actions to Add Audit Logging To

### HIGH PRIORITY (Critical Security Events)

1. **Client Management** (`app/actions/client-actions.ts`)
   - ✅ `deleteClient()` - Track client deletions
   - `updateClient()` - Track what fields changed

2. **Lesson Management** (`app/actions/lesson-actions.ts`)
   - `deleteLesson()` - Track lesson deletions
   - `createLessonWithParticipants()` - Track lesson creation

3. **Payment Actions** (`app/actions/lesson-history-actions.ts`)
   - `markAllLessonsPaid()` - Track bulk payment updates
   - `markLessonPaid()` - Track individual payments

### MEDIUM PRIORITY

4. **Recurring Lessons** (`app/actions/recurring-lesson-actions.ts`)
   - `deleteFutureLessonsInSeries()` - Track bulk deletions
   - `updateFutureLessonsInSeries()` - Track bulk updates

5. **Lesson Types** (`app/actions/lesson-type-actions.ts`)
   - `deleteLessonType()` - Track lesson type deletions

### LOW PRIORITY

6. **Authentication** (`app/actions/auth-actions.ts`)
   - Login/logout events (for security monitoring)

## Best Practices

### 1. Always fetch data BEFORE deletion
```typescript
// ❌ Bad - can't log what was deleted
await supabase.from('clients').delete().eq('id', clientId);

// ✅ Good - fetch first, then delete
const { data: client } = await supabase
  .from('clients')
  .select('*')
  .eq('id', clientId)
  .single();

await supabase.from('clients').delete().eq('id', clientId);
await logClientDeleted(user.id, clientId, getClientName(client));
```

### 2. Include meaningful metadata
```typescript
// ❌ Bad - no context
await logAuditEvent({
  userId: user.id,
  action: 'lesson.deleted',
  resourceType: 'lesson',
  resourceId: lessonId,
});

// ✅ Good - rich context
await logAuditEvent({
  userId: user.id,
  action: 'lesson.deleted',
  resourceType: 'lesson',
  resourceId: lessonId,
  description: `Deleted lesson: ${lessonTitle} with ${clientNames}`,
  metadata: {
    lesson_title: lessonTitle,
    client_names: clientNames,
    start_time: startTime,
    reason: 'User requested cancellation',
  }
});
```

### 3. Don't block on audit logging
```typescript
// Audit logging uses try/catch internally and won't throw
// It's designed to be fire-and-forget
await logAuditEvent({ ... }); // Safe - won't break your operation

// But you can also use it without await if you want
logAuditEvent({ ... }); // Also fine - truly async
```

### 4. Log AFTER successful operations
```typescript
// ❌ Bad - log before operation succeeds
await logClientDeleted(...);
await supabase.from('clients').delete()...;

// ✅ Good - log after operation succeeds
await supabase.from('clients').delete()...;
await logClientDeleted(...); // Only logs if deletion succeeded
```

## Viewing Audit Logs

### In Database (SQL)
```sql
-- Recent audit logs for a user
SELECT * FROM audit_logs
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 50;

-- Audit logs for a specific resource
SELECT * FROM audit_logs
WHERE resource_type = 'client'
  AND resource_id = 'client-uuid'
ORDER BY created_at DESC;

-- All deletion events
SELECT * FROM audit_logs
WHERE action LIKE '%.deleted'
ORDER BY created_at DESC;
```

### In Code (TypeScript)
```typescript
import { getRecentAuditLogs, getResourceAuditLogs } from '@/lib/audit-log';

// Get recent logs
const { data: logs } = await getRecentAuditLogs(50);

// Get logs for a specific client
const { data: clientLogs } = await getResourceAuditLogs('client', clientId);
```

## Testing

To test audit logging after migration:

1. Apply the migration in Supabase Dashboard
2. Add audit logging to one action (e.g., `deleteClient`)
3. Perform the action in your app
4. Check the audit_logs table:
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

You should see your audit log entry with all the details!

## Next Steps

1. ✅ Apply the migration: `supabase/migrations/20251230_create_audit_logs.sql`
2. ✅ Test manually by inserting a test audit log
3. 🔲 Integrate into high-priority actions (start with `deleteClient`)
4. 🔲 Gradually add to other actions as time permits
5. 🔲 (Optional) Create admin page to view audit logs
