# Database Migration Instructions

## Migration 0002: Lesson Calendar and Invoicing System

### What This Migration Does

This migration adds the complete lesson calendar and invoicing system to your database:

1. ✅ Adds `hourly_rate` field to existing `clients` table
2. ✅ Creates `lessons` table for booking lessons
3. ✅ Creates `invoices` table for automatic invoice generation
4. ✅ Creates ENUM types for type-safe status fields
5. ✅ Adds RLS (Row Level Security) policies
6. ✅ Creates helper functions for invoice numbering and timestamps

---

## How to Run This Migration

### Option 1: Run in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **+ New query**
4. Copy the entire contents of `supabase/migrations/0002_create_lessons_and_invoices.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify success - you should see "Success. No rows returned"

### Option 2: Run via Supabase CLI (Advanced)

```bash
# Make sure you're logged in to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push

# Or run migrations in order
supabase migration up
```

---

## Verification Steps

After running the migration, verify it worked:

### 1. Check Tables Exist

Run this query in the SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('lessons', 'invoices');
```

**Expected result:** You should see both `lessons` and `invoices` tables.

### 2. Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('lessons', 'invoices');
```

**Expected result:** Both tables should have `rowsecurity = true`.

### 3. Check Policies Exist

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('lessons', 'invoices')
ORDER BY tablename, policyname;
```

**Expected result:** You should see 4 policies per table (INSERT, SELECT, UPDATE, DELETE).

### 4. Check ENUM Types

```sql
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('lesson_status', 'payment_status')
ORDER BY typname, enumsortorder;
```

**Expected result:**
- `lesson_status`: Scheduled, Completed, Cancelled, No Show
- `payment_status`: Pending, Paid, Overdue, Canceled

### 5. Check hourly_rate Column Added

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'hourly_rate';
```

**Expected result:** Column exists with type `numeric` and default `75.00`.

---

## Rollback (If Needed)

If something goes wrong and you need to undo this migration:

```sql
-- WARNING: This will delete all lesson and invoice data!

-- Drop tables
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS lesson_status;
DROP TYPE IF EXISTS payment_status;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS generate_invoice_number();

-- Remove hourly_rate column (optional - only if you want to fully rollback)
ALTER TABLE clients DROP COLUMN IF EXISTS hourly_rate;
```

---

## Next Steps After Migration

Once the migration is successful:

1. ✅ Install React Big Calendar package:
   ```bash
  # The project now uses a custom headless Tailwind scheduler UI.
  # No extra calendar UI dependency is required. If you previously
  # followed older instructions that installed `react-big-calendar`,
  # you may remove it from your project with:
  # npm uninstall react-big-calendar @types/react-big-calendar
   ```

2. ✅ Test the lesson server actions in your app

3. ✅ Build the UI components (calendar view, booking form)

---

## Troubleshooting

### Error: "type already exists"

If you see this error, it means you've run the migration before. You can either:
- Skip the ENUM creation (comment out those lines)
- Or drop the existing types first: `DROP TYPE lesson_status CASCADE;`

### Error: "column already exists"

If `hourly_rate` column already exists:
- Remove the `ADD COLUMN` line for `hourly_rate`
- Or use `ADD COLUMN IF NOT EXISTS` (already in the migration)

### Error: "relation already exists"

If tables already exist, either:
- Drop them first (see Rollback section)
- Or skip table creation

### Error: "function does not exist: generate_invoice_number"

Make sure the function was created in Step 7 of the migration. You can check with:

```sql
SELECT proname FROM pg_proc WHERE proname = 'generate_invoice_number';
```

---

## Support

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify your Supabase project is active (not paused)
3. Ensure you have the correct permissions
4. Check this file for common errors

---

**Migration File:** `supabase/migrations/0002_create_lessons_and_invoices.sql`
**Created:** 2025-11-18
**Status:** Ready to run
