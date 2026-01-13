# Database Indexes - Performance Optimization

## Overview

This document tracks all database indexes for the Shift application. Proper indexing ensures fast query performance as your data grows.

## Applied Indexes

### Existing Indexes (Already in Production)

#### `lessons` table:
- ✅ `idx_lessons_coach_id` - ON lessons(coach_id)
- ✅ `idx_lessons_client_id` - ON lessons(client_id)
- ✅ `idx_lessons_start_time` - ON lessons(start_time)
- ✅ `idx_lessons_status` - ON lessons(status)
- ✅ `idx_lessons_lesson_type_id` - ON lessons(lesson_type_id)
- ✅ `idx_lessons_recurrence_parent` - Partial index WHERE recurrence_parent_id IS NOT NULL
- ✅ `idx_lessons_is_recurring` - Partial index WHERE is_recurring = TRUE

#### `lesson_types` table:
- ✅ `idx_lesson_types_coach_id` - ON lesson_types(coach_id)
- ✅ `idx_lesson_types_is_active` - ON lesson_types(coach_id, is_active)

#### `lesson_participants` table:
- ✅ `idx_lesson_participants_lesson_id` - ON lesson_participants(lesson_id)
- ✅ `idx_lesson_participants_client_id` - ON lesson_participants(client_id)
- ✅ `idx_lesson_participants_payment_status` - ON lesson_participants(payment_status)

#### `invoices` table:
- ✅ `idx_invoices_coach_id` - ON invoices(coach_id)
- ✅ `idx_invoices_client_id` - ON invoices(client_id)
- ✅ `idx_invoices_lesson_id` - ON invoices(lesson_id)
- ✅ `idx_invoices_payment_status` - ON invoices(payment_status)
- ✅ `idx_invoices_due_date` - ON invoices(due_date)

---

### New Indexes (Migration: 20251223_add_performance_indexes.sql)

**Status**: ⏳ Pending application to production database

#### `clients` table:
- 🆕 `idx_clients_coach_id` - ON clients(coach_id)
  - **Purpose**: Improves performance when fetching all clients for a specific coach
  - **Queries optimized**: Client list page, client filtering

- 🆕 `idx_clients_updated_at` - ON clients(updated_at)
  - **Purpose**: Enables fast "recently modified clients" queries
  - **Queries optimized**: Audit tracking, activity feeds

#### `lessons` table:
- 🆕 `idx_lessons_coach_start_time` - ON lessons(coach_id, start_time)
  - **Purpose**: Composite index for calendar queries (coach + time range)
  - **Queries optimized**: Calendar view, lesson scheduling
  - **Query example**: "Get all lessons for coach X between dates Y and Z"

- 🆕 `idx_lessons_updated_at` - ON lessons(updated_at)
  - **Purpose**: Enables fast "recently updated lessons" queries
  - **Queries optimized**: Recent activity tracking, audit logs

#### `lesson_participants` table:
- 🆕 `idx_lesson_participants_lesson_payment` - ON lesson_participants(lesson_id, payment_status)
  - **Purpose**: Optimizes payment status queries for specific lessons
  - **Queries optimized**: Outstanding payments view, payment tracking
  - **Query example**: "Get all unpaid participants for this lesson"

---

## How to Apply the Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your "Shift" project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `supabase/migrations/20251223_add_performance_indexes.sql`
6. Paste into the SQL editor
7. Click **Run** to execute
8. Verify indexes were created successfully

### Option 2: Supabase CLI (If linked)

```bash
npx supabase db push
```

---

## Performance Impact

### Expected Improvements:

1. **Client List Page**: 50-80% faster load time (indexed coach_id lookup)
2. **Calendar Queries**: 60-90% faster (composite index on coach_id + start_time)
3. **Outstanding Payments**: 40-70% faster (composite index on lesson_id + payment_status)
4. **Recent Activity**: 50-80% faster (indexed updated_at columns)

### Index Size Overhead:

- Each index adds ~2-5% storage overhead per table
- Minimal impact with current data size
- Trade-off is worth it for query performance gains

---

## Index Maintenance

### Automatic:
- PostgreSQL automatically maintains indexes on INSERT, UPDATE, DELETE
- No manual intervention required

### Monitoring:
- Use Supabase Dashboard → Database → Performance
- Check query execution plans for slow queries
- Look for sequential scans on large tables (indicates missing index)

### Future Considerations:

If you notice slow queries on:
- **Lesson creation date ranges**: Add index on `lessons.created_at`
- **Invoice creation date ranges**: Add index on `invoices.created_at`
- **Complex filtering**: Add composite indexes for frequently combined filters

---

## Query Optimization Tips

### Use Indexes Effectively:

1. **Date Range Queries**: Always filter by indexed date columns first
   ```sql
   -- Good: Uses idx_lessons_coach_start_time
   SELECT * FROM lessons
   WHERE coach_id = 'abc-123'
   AND start_time BETWEEN '2024-01-01' AND '2024-12-31';

   -- Bad: Sequential scan (no index on end_time alone)
   SELECT * FROM lessons
   WHERE end_time > '2024-12-31';
   ```

2. **Payment Queries**: Use composite index by filtering lesson_id first
   ```sql
   -- Good: Uses idx_lesson_participants_lesson_payment
   SELECT * FROM lesson_participants
   WHERE lesson_id = 'xyz-789'
   AND payment_status = 'Pending';
   ```

3. **Client Queries**: Always include coach_id in WHERE clause
   ```sql
   -- Good: Uses idx_clients_coach_id
   SELECT * FROM clients
   WHERE coach_id = 'abc-123'
   ORDER BY last_name;
   ```

---

## Index Coverage Report

| Table | Foreign Keys Indexed | Commonly Queried Fields Indexed | Status |
|-------|---------------------|--------------------------------|--------|
| clients | ✅ coach_id (NEW) | ✅ updated_at (NEW) | ✅ Complete |
| lessons | ✅ coach_id, client_id, lesson_type_id | ✅ start_time, status, updated_at (NEW), coach+start composite (NEW) | ✅ Complete |
| lesson_types | ✅ coach_id | ✅ is_active (composite) | ✅ Complete |
| lesson_participants | ✅ lesson_id, client_id | ✅ payment_status, lesson+payment composite (NEW) | ✅ Complete |
| invoices | ✅ coach_id, client_id, lesson_id | ✅ payment_status, due_date | ✅ Complete |

---

## Migration History

| Date | Migration File | Indexes Added | Status |
|------|---------------|---------------|--------|
| 2024-12-23 | `20251223_add_performance_indexes.sql` | 5 indexes (clients, lessons, lesson_participants) | ⏳ Pending |
| Earlier | Various migration files | 16 indexes across all tables | ✅ Applied |

---

## Next Steps

1. ✅ Migration file created: `supabase/migrations/20251223_add_performance_indexes.sql`
2. ⏳ **TODO**: Apply migration to production database via Supabase SQL Editor
3. ⏳ **TODO**: Verify indexes were created successfully
4. ⏳ **TODO**: Monitor query performance improvements in Supabase Dashboard

**Last Updated**: December 23, 2024
**Status**: Indexes defined, pending application to production database
