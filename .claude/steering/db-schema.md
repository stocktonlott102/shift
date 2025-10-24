# Database Schema: Shift

**Last Updated:** 2025-10-24
**Version:** 1.0
**Status:** Active Development

---

## Overview

This document defines the database schema for Shift, built on Supabase PostgreSQL. The schema follows the security architecture defined in the PRD, with Row Level Security (RLS) policies ensuring coaches can only access their own data.

**Security Principle:** All tables reference `auth.users.id` as `coach_id` to enable RLS policies that enforce data isolation between coaches.

---

## Table: `profiles`

### Purpose
Stores coach profile data and subscription status, linking to Supabase Auth users. This table tracks the 180-day free trial period and Stripe subscription information for coach billing.

### Schema Definition

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'incomplete')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '180 days'),
  subscription_id TEXT,
  subscription_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_stripe_customer UNIQUE (stripe_customer_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX idx_profiles_trial_ends_at ON public.profiles(trial_ends_at);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'Coach profile data with subscription and trial tracking';
COMMENT ON COLUMN public.profiles.id IS 'Primary key, foreign key to auth.users(id)';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for subscription billing';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Current subscription state: trial, active, past_due, canceled, incomplete';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'Timestamp when 180-day trial expires (NULL if subscribed)';
COMMENT ON COLUMN public.profiles.subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN public.profiles.subscription_plan IS 'Plan tier: individual_coach, team (future)';
```

### Column Specifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | - | Primary key, references `auth.users.id` |
| `stripe_customer_id` | TEXT | YES | NULL | Stripe customer ID (set after checkout) |
| `subscription_status` | TEXT | NO | 'trial' | Current subscription status |
| `trial_ends_at` | TIMESTAMPTZ | YES | NOW() + 180 days | Trial expiration timestamp |
| `subscription_id` | TEXT | YES | NULL | Stripe subscription ID |
| `subscription_plan` | TEXT | YES | NULL | Plan tier identifier |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Record update timestamp |

### Subscription Status Values

| Status | Description |
|--------|-------------|
| `trial` | Coach is in 180-day free trial period |
| `active` | Paid subscription is active and current |
| `past_due` | Payment failed, subscription at risk |
| `canceled` | Subscription has been canceled |
| `incomplete` | Subscription signup incomplete |

### RLS Policies for Profiles

```sql
-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can insert profiles (for new user signup trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);
```

### Auto-Create Profile on User Signup

This trigger automatically creates a profile record when a new user signs up:

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, subscription_status, trial_ends_at)
  VALUES (NEW.id, 'trial', NOW() + INTERVAL '180 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Update Timestamp Trigger

```sql
-- Apply updated_at trigger to profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Table: `clients`

### Purpose
Stores athlete/client information for individual coaches, implementing Section I.A of the PRD (Athlete Profiles).

### Schema Definition

```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL,
  goal_tracking JSONB,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_hourly_rate CHECK (hourly_rate > 0),
  CONSTRAINT valid_email CHECK (parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_clients_coach_id ON public.clients(coach_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_athlete_name ON public.clients(athlete_name);

-- Comments for documentation
COMMENT ON TABLE public.clients IS 'Stores client/athlete profiles for coaches';
COMMENT ON COLUMN public.clients.coach_id IS 'Links to auth.users - ensures RLS data isolation';
COMMENT ON COLUMN public.clients.athlete_name IS 'Name of the athlete/student';
COMMENT ON COLUMN public.clients.parent_email IS 'Parent email for invoices and communication';
COMMENT ON COLUMN public.clients.parent_phone IS 'Parent phone for SMS reminders';
COMMENT ON COLUMN public.clients.hourly_rate IS 'Lesson rate in USD per hour';
COMMENT ON COLUMN public.clients.goal_tracking IS 'JSONB field for storing athlete goals (e.g., test levels, skills)';
COMMENT ON COLUMN public.clients.notes IS 'Private coach notes about the athlete';
COMMENT ON COLUMN public.clients.status IS 'Active or archived status';
```

### Column Specifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `uuid_generate_v4()` | Primary key |
| `coach_id` | UUID | NO | - | Foreign key to `auth.users.id` |
| `athlete_name` | TEXT | NO | - | Athlete's full name |
| `parent_email` | TEXT | NO | - | Parent email for billing/communication |
| `parent_phone` | TEXT | NO | - | Parent phone for SMS notifications |
| `hourly_rate` | NUMERIC(10,2) | NO | - | Lesson rate (must be > 0) |
| `goal_tracking` | JSONB | YES | NULL | Structured goal data (optional) |
| `notes` | TEXT | YES | NULL | Private coach notes |
| `status` | TEXT | NO | 'active' | 'active' or 'archived' |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Record update timestamp |

### Goal Tracking JSONB Structure (Optional)

```json
{
  "current_level": "Pre-Juvenile",
  "goals": [
    {
      "id": "uuid",
      "description": "Pass Pre-Juvenile Moves in the Field test",
      "target_date": "2025-03-15",
      "status": "in_progress",
      "created_at": "2025-01-10"
    }
  ]
}
```

---

## Row Level Security (RLS) Policies

### Enable RLS

```sql
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
```

### Policy: Coaches can view their own clients

```sql
CREATE POLICY "Coaches can view own clients"
  ON public.clients
  FOR SELECT
  USING (auth.uid() = coach_id);
```

**Explanation:** Users can only SELECT rows where the `coach_id` matches their authenticated `auth.uid()`.

### Policy: Coaches can insert their own clients

```sql
CREATE POLICY "Coaches can insert own clients"
  ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = coach_id);
```

**Explanation:** Users can only INSERT rows if they set `coach_id` to their own `auth.uid()`.

### Policy: Coaches can update their own clients

```sql
CREATE POLICY "Coaches can update own clients"
  ON public.clients
  FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);
```

**Explanation:** Users can only UPDATE rows they own, and cannot change `coach_id` to another user.

### Policy: Coaches can delete their own clients

```sql
CREATE POLICY "Coaches can delete own clients"
  ON public.clients
  FOR DELETE
  USING (auth.uid() = coach_id);
```

**Explanation:** Users can only DELETE rows where `coach_id` matches their `auth.uid()`.

---

## Automatic Timestamp Update Trigger

### Function: Update `updated_at` on row modification

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger: Apply to `clients` table

```sql
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Complete Migration Script

Run this in Supabase SQL Editor to create all tables:

```sql
-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Create updated_at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 2: Create profiles table
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'incomplete')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '180 days'),
  subscription_id TEXT,
  subscription_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_stripe_customer UNIQUE (stripe_customer_id)
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX idx_profiles_trial_ends_at ON public.profiles(trial_ends_at);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Add comments for profiles
COMMENT ON TABLE public.profiles IS 'Coach profile data with subscription and trial tracking';
COMMENT ON COLUMN public.profiles.id IS 'Primary key, foreign key to auth.users(id)';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for subscription billing';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Current subscription state';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'Timestamp when 180-day trial expires';

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Apply updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, subscription_status, trial_ends_at)
  VALUES (NEW.id, 'trial', NOW() + INTERVAL '180 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 3: Create clients table
-- ============================================

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL,
  goal_tracking JSONB,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_hourly_rate CHECK (hourly_rate > 0),
  CONSTRAINT valid_email CHECK (parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX idx_clients_coach_id ON public.clients(coach_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_athlete_name ON public.clients(athlete_name);

-- Add comments
COMMENT ON TABLE public.clients IS 'Stores client/athlete profiles for coaches';
COMMENT ON COLUMN public.clients.coach_id IS 'Links to auth.users - ensures RLS data isolation';
COMMENT ON COLUMN public.clients.athlete_name IS 'Name of the athlete/student';
COMMENT ON COLUMN public.clients.parent_email IS 'Parent email for invoices and communication';
COMMENT ON COLUMN public.clients.parent_phone IS 'Parent phone for SMS reminders';
COMMENT ON COLUMN public.clients.hourly_rate IS 'Lesson rate in USD per hour';
COMMENT ON COLUMN public.clients.goal_tracking IS 'JSONB field for storing athlete goals';
COMMENT ON COLUMN public.clients.notes IS 'Private coach notes about the athlete';

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT (view own clients)
CREATE POLICY "Coaches can view own clients"
  ON public.clients
  FOR SELECT
  USING (auth.uid() = coach_id);

-- RLS Policy: INSERT (create own clients)
CREATE POLICY "Coaches can insert own clients"
  ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

-- RLS Policy: UPDATE (modify own clients)
CREATE POLICY "Coaches can update own clients"
  ON public.clients
  FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- RLS Policy: DELETE (remove own clients)
CREATE POLICY "Coaches can delete own clients"
  ON public.clients
  FOR DELETE
  USING (auth.uid() = coach_id);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to clients table
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Testing RLS Policies

### Test 1: Insert a client

```sql
-- As authenticated user, insert a client
INSERT INTO public.clients (coach_id, athlete_name, parent_email, parent_phone, hourly_rate)
VALUES (auth.uid(), 'Sarah Johnson', 'parent@example.com', '555-1234', 75.00);
```

**Expected Result:** ✅ Success (if authenticated)

### Test 2: Try to insert with different coach_id

```sql
-- Try to insert a client for a different coach
INSERT INTO public.clients (coach_id, athlete_name, parent_email, parent_phone, hourly_rate)
VALUES ('00000000-0000-0000-0000-000000000000', 'Jane Doe', 'jane@example.com', '555-5678', 80.00);
```

**Expected Result:** ❌ RLS Policy violation (cannot insert for other coaches)

### Test 3: Query clients

```sql
-- View your own clients
SELECT * FROM public.clients;
```

**Expected Result:** ✅ Returns only clients where `coach_id = auth.uid()`

---

## TypeScript Types

Generate TypeScript types from this schema using Supabase CLI:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

**Expected Type:**

```typescript
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          coach_id: string;
          athlete_name: string;
          parent_email: string;
          parent_phone: string;
          hourly_rate: number;
          goal_tracking: Json | null;
          notes: string | null;
          status: 'active' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          athlete_name: string;
          parent_email: string;
          parent_phone: string;
          hourly_rate: number;
          goal_tracking?: Json | null;
          notes?: string | null;
          status?: 'active' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          athlete_name?: string;
          parent_email?: string;
          parent_phone?: string;
          hourly_rate?: number;
          goal_tracking?: Json | null;
          notes?: string | null;
          status?: 'active' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
```

---

## Future Tables

As defined in the PRD Technical Architecture, the following tables will be added:

1. **`lessons`** - Scheduled lessons with date, time, status
2. **`invoices`** - Generated invoices with payment tracking
3. **`invoice_line_items`** - Individual lesson charges on invoices

See [PRD Technical Architecture](../prd/05-technical-architecture.md) for full schema definitions.

---

## Maintenance

- **Backup Policy:** Supabase provides automatic daily backups
- **Migration History:** Track schema changes in version control
- **Index Monitoring:** Monitor query performance and add indexes as needed

---

## Related Documents

- [PRD: Feature Blueprint](../prd/03-feature-blueprint.md) - Section I.A (Athlete Profiles)
- [PRD: Technical Architecture](../prd/05-technical-architecture.md) - Complete database schema
- [PRD: MVP Requirements](../prd/04-mvp-requirements.md) - User Story US-4 (Create Athlete Profile)
