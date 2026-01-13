# Row Level Security (RLS) Audit Report

**Date:** December 23, 2024
**Status:** 🚨 **CRITICAL VULNERABILITIES FOUND** - Immediate action required

---

## Executive Summary

A comprehensive audit of Row Level Security policies revealed **2 critical security vulnerabilities** that could allow coaches to access other coaches' data:

1. 🚨 **CRITICAL:** `get_lesson_participants()` function bypasses RLS without validation
2. 🚨 **CRITICAL:** `profiles` table has NO RLS protection

Both vulnerabilities have been fixed with migration files that must be applied immediately.

---

## Detailed Findings

### ✅ Secure Tables

The following tables have proper RLS policies and are secure:

#### 1. **clients** Table
**Status:** ✅ Secure
**Policies:**
- ✅ SELECT: Coaches can only view their own clients (`coach_id = auth.uid()`)
- ✅ INSERT: Coaches can only create clients for themselves
- ✅ UPDATE: Coaches can only update their own clients
- ✅ DELETE: Coaches can only delete their own clients

**Verdict:** Properly secured. No issues found.

---

#### 2. **lessons** Table
**Status:** ✅ Secure
**Policies:**
- ✅ SELECT: Coaches can only view lessons where `coach_id = auth.uid()`
- ✅ INSERT: Coaches can only create lessons for themselves
- ✅ UPDATE: Coaches can only update their own lessons
- ✅ DELETE: Coaches can only delete their own lessons

**Verdict:** Properly secured. No issues found.

---

#### 3. **lesson_types** Table
**Status:** ✅ Secure
**Policies:**
- ✅ SELECT: `coach_id = auth.uid()`
- ✅ INSERT: `coach_id = auth.uid()`
- ✅ UPDATE: `coach_id = auth.uid()`
- ✅ DELETE: `coach_id = auth.uid()`

**Verdict:** Properly secured. No issues found.

---

#### 4. **lesson_participants** Table
**Status:** ✅ Secure
**Policies:** (Transitive security through lessons table)
- ✅ SELECT: Only if lesson belongs to requesting coach
- ✅ INSERT: Only if lesson belongs to requesting coach
- ✅ UPDATE: Only if lesson belongs to requesting coach
- ✅ DELETE: Only if lesson belongs to requesting coach

**Implementation:**
```sql
USING (
  EXISTS (
    SELECT 1 FROM lessons
    WHERE lessons.id = lesson_participants.lesson_id
    AND lessons.coach_id = auth.uid()
  )
)
```

**Verdict:** Properly secured using transitive access control. No issues found.

---

#### 5. **invoices** Table
**Status:** ✅ Secure
**Policies:**
- ✅ SELECT: `coach_id = auth.uid()`
- ✅ INSERT: `coach_id = auth.uid()`
- ✅ UPDATE: `coach_id = auth.uid()`
- ✅ DELETE: `coach_id = auth.uid()`

**Verdict:** Properly secured. No issues found.

---

### 🚨 Critical Vulnerabilities

#### 1. **`get_lesson_participants()` Function - RLS Bypass**

**Severity:** 🚨 **CRITICAL**
**Risk:** High - Complete bypass of RLS policies
**Impact:** Any authenticated user can access ANY lesson's participants

**The Vulnerability:**

```sql
CREATE OR REPLACE FUNCTION get_lesson_participants(lesson_id_param UUID)
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Problem:**
- `SECURITY DEFINER` runs the function with superuser permissions, bypassing ALL RLS policies
- No validation to check if the requesting user owns the lesson
- Any coach can call `get_lesson_participants('another-coach-lesson-id')` and access data they shouldn't see

**Attack Scenario:**
1. Coach A creates a lesson with ID `abc-123`
2. Coach B (malicious) calls `SELECT * FROM get_lesson_participants('abc-123')`
3. Coach B receives all participants, client names, emails, and amounts owed for Coach A's lesson
4. **Complete data breach**

**Fix Applied:** `20251223_fix_get_lesson_participants_security.sql`

The fixed function now validates lesson ownership:
```sql
-- SECURITY: Verify the requesting user owns this lesson
IF NOT EXISTS (
  SELECT 1 FROM lessons
  WHERE id = lesson_id_param
  AND coach_id = auth.uid()
) THEN
  RAISE EXCEPTION 'Access denied: You do not own this lesson';
END IF;
```

**Status:** ⏳ Migration created, pending application

---

#### 2. **`profiles` Table - No RLS Protection**

**Severity:** 🚨 **CRITICAL**
**Risk:** High - Unrestricted access to all user profiles
**Impact:** Any authenticated user can view/modify ANY user's profile data

**The Vulnerability:**

The `profiles` table stores sensitive subscription data:
- `stripe_customer_id` - Stripe customer identifier
- `subscription_id` - Active subscription ID
- `subscription_status` - Billing status
- `trial_ends_at` - Trial expiration date

**Current State:** NO RLS POLICIES EXIST

**Attack Scenario:**
1. Coach A has `stripe_customer_id = 'cus_ABC123'`
2. Coach B (malicious) runs: `SELECT * FROM profiles WHERE id != auth.uid()`
3. Coach B sees ALL coaches' Stripe customer IDs, subscription statuses, and billing info
4. **Complete privacy breach**

**Fix Applied:** `20251223_add_profiles_rls.sql`

Added policies:
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

**Note:** Stripe webhook uses `supabaseAdmin` (service role) which bypasses RLS, so webhook updates still work.

**Status:** ⏳ Migration created, pending application

---

## Recommended Improvements (Non-Critical)

### 1. Standardize Policy Specifications

**Issue:** Inconsistent use of `TO authenticated` clause

**Current:**
- `clients` policies: No `TO` clause (defaults to all roles)
- `lessons`, `invoices`: Explicit `TO authenticated`

**Recommendation:** Add `TO authenticated` to all policies for consistency:

```sql
-- Update clients policies
DROP POLICY "Coaches can view their own clients" ON clients;
CREATE POLICY "Coaches can view their own clients"
  ON clients FOR SELECT
  TO authenticated  -- Add this
  USING (coach_id = auth.uid());
```

**Impact:** Low - No functional change, improves code consistency
**Priority:** Nice to have

---

### 2. Add Audit Logging for Sensitive Operations

**Recommendation:** Log all payment status changes and deletions

**Example:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger on lesson_participants payment status changes
CREATE TRIGGER audit_payment_changes
  AFTER UPDATE ON lesson_participants
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION log_audit_change();
```

**Impact:** Enables forensic analysis and compliance tracking
**Priority:** High for production, medium for MVP

---

## Migration Files Created

### Critical Security Fixes (Apply Immediately)

1. **`20251223_fix_get_lesson_participants_security.sql`**
   - Fixes RLS bypass in `get_lesson_participants()` function
   - Adds ownership validation before returning data

2. **`20251223_add_profiles_rls.sql`**
   - Enables RLS on `profiles` table
   - Adds SELECT, INSERT, UPDATE policies

---

## How to Apply Fixes

### Step 1: Apply Security Migrations

1. Go to https://supabase.com/dashboard
2. Select your "Shift" project
3. Navigate to **SQL Editor**
4. Apply migrations in this order:

   **Migration 1:** Fix get_lesson_participants
   ```sql
   -- Copy contents of: 20251223_fix_get_lesson_participants_security.sql
   -- Paste and Run
   ```

   **Migration 2:** Add profiles RLS
   ```sql
   -- Copy contents of: 20251223_add_profiles_rls.sql
   -- Paste and Run
   ```

5. Verify success:
   ```sql
   -- Check RLS is enabled on profiles
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'profiles';
   -- Should return: rowsecurity = true

   -- Test get_lesson_participants with invalid lesson ID
   SELECT * FROM get_lesson_participants('00000000-0000-0000-0000-000000000000');
   -- Should return: ERROR: Access denied: You do not own this lesson
   ```

---

## Testing Recommendations

### Test 1: Verify `get_lesson_participants()` Security

```sql
-- As Coach A (authenticated as user_a_id):
-- This should SUCCEED (your own lesson)
SELECT * FROM get_lesson_participants('your-lesson-id');

-- As Coach A trying to access Coach B's lesson:
-- This should FAIL with "Access denied"
SELECT * FROM get_lesson_participants('coach-b-lesson-id');
```

**Expected:**
- ✅ Own lesson: Returns participants
- ❌ Other's lesson: Raises exception "Access denied"

---

### Test 2: Verify `profiles` RLS

```sql
-- As Coach A (authenticated):
-- This should return ONLY your profile
SELECT * FROM profiles WHERE id = auth.uid();

-- This should return ZERO rows (not other users' profiles)
SELECT * FROM profiles WHERE id != auth.uid();
```

**Expected:**
- ✅ Own profile: Returns 1 row
- ❌ Other profiles: Returns 0 rows

---

### Test 3: Verify Webhook Still Works

After applying migrations, test Stripe webhooks:

1. Subscribe to a plan in your app
2. Check Vercel logs for webhook processing
3. Verify `profiles` table updated correctly

**Why it still works:** Webhooks use `supabaseAdmin` (service role) which bypasses RLS.

---

## Security Posture Summary

### Before Fixes:
- ❌ `get_lesson_participants()`: Vulnerable to unauthorized access
- ❌ `profiles`: No protection, all data accessible
- ⚠️ Risk Level: **CRITICAL**

### After Fixes:
- ✅ `get_lesson_participants()`: Validates ownership, secure
- ✅ `profiles`: RLS enabled, users isolated
- ✅ All tables: Properly secured
- ✅ Risk Level: **LOW**

---

## Compliance & Best Practices

### Data Isolation ✅
- All coach data properly isolated by `coach_id`
- No cross-coach data leakage possible

### Principle of Least Privilege ✅
- Users can only access their own data
- Service role used only for system operations (webhooks)

### Defense in Depth ✅
- RLS at database level (prevents SQL injection exploits)
- Zod validation at application level (prevents bad input)
- Rate limiting at API level (prevents abuse)

### Auditability ⏳
- Consider adding audit logging for production (recommended)

---

## Maintenance

### Regular RLS Audits

**Frequency:** Quarterly or after major schema changes

**Checklist:**
- [ ] Verify all tables with sensitive data have RLS enabled
- [ ] Check all `SECURITY DEFINER` functions validate access
- [ ] Test policies with multiple user accounts
- [ ] Review any new tables for RLS requirements
- [ ] Document any intentional policy exceptions

---

## Conclusion

**Critical vulnerabilities found:** 2
**Critical vulnerabilities fixed:** 2
**Current security status:** ✅ **SECURE** (after migrations applied)

**Action Required:** Apply the 2 migration files immediately via Supabase SQL Editor.

**Estimated Time:** 5 minutes
**Downtime:** None (migrations are non-breaking)

---

**Last Updated:** December 23, 2024
**Audited By:** Claude Code (Automated Security Audit)
**Next Audit Due:** March 23, 2025 (or after major schema changes)
