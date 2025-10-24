# Technical Architecture: Shift

**Last Updated:** 2025-10-24
**Version:** 1.1
**Status:** Active Development

---

## Technology Stack

| Component | Technology | Version | Justification |
|-----------|------------|---------|---------------|
| **Framework** | Next.js | 14+ (App Router) | Full-stack React framework with server components, API routes, and excellent DX |
| **Language** | TypeScript | 5+ | Type safety, better IDE support, reduces runtime errors |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, mobile-first, rapid prototyping, small bundle size |
| **Database** | Supabase (PostgreSQL) | Latest | Managed PostgreSQL with built-in auth, real-time, and storage |
| **Authentication** | Supabase Auth | Latest | Built-in, secure, supports email/password and social logins |
| **Payments** | Stripe | Latest API | Industry standard, excellent docs, robust checkout and webhooks |
| **Email** | Resend or SendGrid | Latest | Reliable transactional email delivery for invoices |
| **Deployment** | Vercel | Latest | Seamless Next.js deployment, serverless functions, edge network |
| **Version Control** | Git + GitHub | N/A | Code collaboration, CI/CD integration |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  (Next.js App Router - Client Components + Server Components)│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│         (Server Actions, API Routes, Middleware)             │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
  │   Supabase     │  │     Stripe     │  │  Email Service │
  │   (Database    │  │   (Payments)   │  │  (Resend/SG)   │
  │   + Auth)      │  │                │  │                │
  └────────────────┘  └────────────────┘  └────────────────┘
```

---

## Folder Structure

```
nextjs-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (global styles, auth provider)
│   ├── page.tsx                 # Landing page
│   ├── signup/
│   │   └── page.tsx             # Sign up page (client component)
│   ├── login/
│   │   └── page.tsx             # Login page (client component)
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard layout (auth-protected)
│   │   ├── page.tsx             # Dashboard home (server component)
│   │   ├── clients/
│   │   │   ├── page.tsx         # Client list (server component)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Client detail (server component)
│   │   │   └── new/
│   │   │       └── page.tsx     # New client form (client component)
│   │   ├── calendar/
│   │   │   └── page.tsx         # Calendar view (client component)
│   │   ├── lessons/
│   │   │   ├── page.tsx         # Lesson list (server component)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Lesson detail (server component)
│   │   │   └── new/
│   │   │       └── page.tsx     # New lesson form (client component)
│   │   ├── invoices/
│   │   │   ├── page.tsx         # Invoice list (server component)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Invoice detail (server component)
│   │   │   └── new/
│   │   │       └── page.tsx     # New invoice form (client component)
│   │   └── settings/
│   │       └── page.tsx         # User settings (client component)
│   └── api/
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts     # Stripe webhook handler
│       └── invoices/
│           └── [id]/
│               └── pdf/
│                   └── route.ts # Invoice PDF generation
├── components/                   # Reusable React components
│   ├── ui/                      # Generic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── auth/                    # Auth-related components
│   │   ├── AuthForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── calendar/                # Calendar components
│   │   ├── CalendarView.tsx
│   │   ├── DayView.tsx
│   │   └── WeekView.tsx
│   ├── clients/                 # Client management components
│   │   ├── ClientCard.tsx
│   │   ├── ClientForm.tsx
│   │   └── ClientList.tsx
│   ├── lessons/                 # Lesson components
│   │   ├── LessonCard.tsx
│   │   ├── LessonForm.tsx
│   │   └── LessonNotes.tsx
│   └── invoices/                # Invoice components
│       ├── InvoiceCard.tsx
│       ├── InvoicePreview.tsx
│       └── PaymentButton.tsx
├── lib/                          # Utility functions and shared logic
│   ├── supabase/
│   │   ├── client.ts            # Browser-side Supabase client
│   │   ├── server.ts            # Server-side Supabase client
│   │   ├── middleware.ts        # Middleware helper for session refresh
│   │   └── types.ts             # Generated Supabase types
│   ├── stripe/
│   │   ├── client.ts            # Stripe client initialization
│   │   └── helpers.ts           # Stripe helper functions
│   ├── utils/
│   │   ├── date.ts              # Date formatting utilities
│   │   ├── currency.ts          # Currency formatting
│   │   └── validation.ts        # Form validation helpers
│   ├── email/
│   │   ├── client.ts            # Email service client
│   │   └── templates.ts         # Email templates (invoice, reminders)
│   └── constants.ts             # App-wide constants
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useClient.ts             # Client data fetching hook
│   ├── useLesson.ts             # Lesson data fetching hook
│   └── useInvoice.ts            # Invoice data fetching hook
├── types/                        # TypeScript type definitions
│   ├── database.ts              # Database schema types
│   ├── api.ts                   # API response types
│   └── index.ts                 # Exported types
├── public/                       # Static assets
│   ├── logo.svg
│   └── favicon.ico
├── middleware.ts                 # Next.js middleware (session refresh)
├── .env.local                    # Environment variables (local)
├── .env.example                  # Environment variables template
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

---

## Data Flow Patterns

### Authentication Flow

```
1. User visits /signup
   └─> Client Component (app/signup/page.tsx)
       └─> Uses Supabase Client (lib/supabase/client.ts)
           └─> Calls supabase.auth.signUp()
               └─> Creates user in Supabase Auth
                   └─> Redirects to /dashboard

2. User visits /login
   └─> Client Component (app/login/page.tsx)
       └─> Uses Supabase Client
           └─> Calls supabase.auth.signInWithPassword()
               └─> Creates session cookie
                   └─> Redirects to /dashboard

3. User visits /dashboard (protected route)
   └─> Middleware (middleware.ts) runs FIRST
       └─> Calls updateSession() from lib/supabase/middleware.ts
           └─> Refreshes Supabase session if expired
               └─> If no session: redirect to /login
               └─> If session valid: continue to page

   └─> Server Component (app/dashboard/page.tsx)
       └─> Uses Supabase Server Client (lib/supabase/server.ts)
           └─> Calls supabase.auth.getUser()
               └─> Fetches user data from database
                   └─> Renders dashboard with server-side data
```

---

### Data Fetching Pattern (Server Component)

```
1. User navigates to /dashboard/clients
   └─> Server Component (app/dashboard/clients/page.tsx)
       └─> Uses Supabase Server Client
           └─> Query: SELECT * FROM athletes WHERE coach_id = [user_id]
               └─> Returns data as props to component
                   └─> Component renders with data (NO loading state needed)

Benefits:
- No loading spinners (data fetched on server before render)
- SEO-friendly (HTML includes data)
- Secure (sensitive queries run on server)
```

---

### Data Mutation Pattern (Server Action)

```
1. User clicks "Create Client" button
   └─> Client Component (app/dashboard/clients/new/page.tsx)
       └─> Form submission calls Server Action
           └─> Server Action (defined in same file or separate actions.ts)
               └─> Uses Supabase Server Client
                   └─> INSERT INTO athletes (...) VALUES (...)
                       └─> Returns success/error response
                           └─> Client component handles response
                               └─> On success: redirect to client list
                               └─> On error: show error message

Benefits:
- No need to create API routes for every mutation
- Type-safe (TypeScript between client and server)
- Automatic revalidation of data
```

---

### Stripe Payment Flow

```
1. Coach generates invoice
   └─> Server Action creates invoice in database
       └─> Creates Stripe Payment Intent
           └─> Stores payment_intent_id in invoice record

2. Coach sends invoice to client (via email)
   └─> Email includes "Pay with Card" button
       └─> Button links to Stripe Checkout page
           └─> Pre-filled with invoice amount

3. Client clicks "Pay with Card"
   └─> Redirects to Stripe Checkout (hosted by Stripe)
       └─> Client enters card details
           └─> Stripe processes payment
               └─> On success: Stripe fires webhook

4. Stripe webhook received
   └─> API Route (/api/webhooks/stripe/route.ts)
       └─> Verifies webhook signature (security)
           └─> Extracts payment_intent_id
               └─> Uses Supabase Server Client
                   └─> UPDATE invoices SET status = 'paid' WHERE payment_intent_id = [id]
                       └─> Sends confirmation email to coach and client

Benefits:
- PCI-compliant (Stripe handles card data)
- Automatic payment confirmation
- No manual invoice updates needed
```

---

## Database Schema (Supabase PostgreSQL)

### Tables

#### users (managed by Supabase Auth)
```sql
-- Extends auth.users table with custom profile data
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  hourly_rate_default DECIMAL(10,2),
  billing_cycle TEXT CHECK (billing_cycle IN ('weekly', 'biweekly', 'monthly')),
  stripe_account_id TEXT,
  stripe_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

---

#### athletes
```sql
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  emergency_contact TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  payment_method_preference TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_athletes_coach_id ON public.athletes(coach_id);
CREATE INDEX idx_athletes_status ON public.athletes(status);

-- Row Level Security
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can only access their own clients
CREATE POLICY "Coaches can view own clients"
  ON public.athletes FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert own clients"
  ON public.athletes FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own clients"
  ON public.athletes FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own clients"
  ON public.athletes FOR DELETE
  USING (auth.uid() = coach_id);
```

---

#### lessons
```sql
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'late_cancel', 'no_show')),
  is_billable BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lessons_coach_id ON public.lessons(coach_id);
CREATE INDEX idx_lessons_athlete_id ON public.lessons(athlete_id);
CREATE INDEX idx_lessons_scheduled_date ON public.lessons(scheduled_date);
CREATE INDEX idx_lessons_status ON public.lessons(status);

-- Row Level Security
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can only access their own lessons
CREATE POLICY "Coaches can view own lessons"
  ON public.lessons FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert own lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own lessons"
  ON public.lessons FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own lessons"
  ON public.lessons FOR DELETE
  USING (auth.uid() = coach_id);
```

---

#### invoices
```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue')),
  payment_method TEXT,
  payment_date DATE,
  stripe_payment_intent_id TEXT,
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_coach_id ON public.invoices(coach_id);
CREATE INDEX idx_invoices_athlete_id ON public.invoices(athlete_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date);

-- Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can only access their own invoices
CREATE POLICY "Coaches can view own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = coach_id);
```

---

#### invoice_line_items
```sql
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  hours DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_lesson_id ON public.invoice_line_items(lesson_id);

-- Row Level Security
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can view line items for their own invoices
CREATE POLICY "Coaches can view own invoice line items"
  ON public.invoice_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert own invoice line items"
  ON public.invoice_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.coach_id = auth.uid()
    )
  );
```

---

### Database Functions

#### Auto-update `updated_at` timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

#### Generate unique invoice number
```sql
CREATE OR REPLACE FUNCTION generate_invoice_number(coach_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  invoice_count INTEGER;
  invoice_number TEXT;
BEGIN
  -- Count existing invoices for this coach
  SELECT COUNT(*) INTO invoice_count
  FROM public.invoices
  WHERE coach_id = coach_uuid;

  -- Generate invoice number: INV-[YEAR]-[COUNT]
  invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((invoice_count + 1)::TEXT, 4, '0');

  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;
```

---

## Security Architecture

### Authentication Security

1. **Password Requirements:**
   - Minimum 6 characters (Supabase default, can be increased)
   - Email verification optional (can be enabled in Supabase settings)

2. **Session Management:**
   - Session cookies handled by Supabase Auth
   - Automatic session refresh via middleware
   - Sessions expire after 1 hour of inactivity (configurable)

3. **Protected Routes:**
   - All `/dashboard/*` routes require authentication
   - Middleware checks session before rendering
   - Unauthenticated users redirected to `/login`

---

### Data Security

1. **Row Level Security (RLS):**
   - Enabled on all tables
   - Coaches can only access their own data
   - Enforced at database level (can't be bypassed)

2. **API Security:**
   - All sensitive operations use Server Components or Server Actions
   - No database credentials exposed to client
   - Supabase Server Client used for all data mutations

3. **Stripe Security:**
   - Webhook signature verification required
   - Secret keys stored in environment variables
   - PCI compliance handled by Stripe (no card data stored)

---

### Environment Variables

```bash
# .env.local (NEVER commit this file)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only, DO NOT expose to client

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx # Safe to expose
STRIPE_SECRET_KEY=sk_test_xxx # Server-side only
STRIPE_WEBHOOK_SECRET=whsec_xxx # For webhook signature verification

# Email Service (Resend or SendGrid)
RESEND_API_KEY=re_xxx # Server-side only
# OR
SENDGRID_API_KEY=SG.xxx # Server-side only

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Production: https://app.cadencecoach.com
```

---

## Deployment Architecture (Vercel)

### Build Configuration

```javascript
// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),

  // Enable React Strict Mode for better error detection
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: ['your-supabase-project.supabase.co'], // For Supabase Storage images
  },

  // Environment variables available to client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
```

---

### Vercel Project Settings

1. **Framework Preset:** Next.js
2. **Build Command:** `npm run build`
3. **Output Directory:** `.next`
4. **Install Command:** `npm install`
5. **Node Version:** 18.x or 20.x

---

### Environment Variables (Production)

Add these in Vercel Dashboard → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` (or `SENDGRID_API_KEY`)
- `NEXT_PUBLIC_APP_URL`

---

### Continuous Deployment

1. **Git Integration:**
   - Connect GitHub repository to Vercel
   - Auto-deploy on push to `main` branch
   - Preview deployments for pull requests

2. **Branch Strategy:**
   - `main` → Production (app.cadencecoach.com)
   - `staging` → Staging (staging.cadencecoach.com)
   - `feature/*` → Preview deployments

---

## Performance Optimization

### Server-Side Rendering (SSR)
- All dashboard pages use Server Components by default
- Data fetched on server before rendering (no loading spinners)
- Faster initial page load

### Static Generation (SSG)
- Landing page (`/`) can be statically generated
- Sign up and login pages can be statically generated
- Reduces server load, improves performance

### Database Query Optimization
- Indexes on all foreign keys and frequently queried columns
- Use `SELECT` with specific columns (not `SELECT *`)
- Pagination for large lists (clients, lessons, invoices)

### Image Optimization
- Use Next.js `<Image>` component for all images
- Automatic lazy loading and optimization
- WebP format with fallbacks

### Caching Strategy
- Supabase query results cached in Server Components
- Use `revalidatePath()` to invalidate cache after mutations
- Static assets cached at CDN edge (Vercel)

---

## Monitoring & Error Handling

### Error Logging
- **Sentry** or **LogRocket** for client-side error tracking
- Console errors automatically captured
- User session replay for debugging

### Server Monitoring
- **Vercel Analytics** for performance metrics
- **Supabase Dashboard** for database performance
- **Stripe Dashboard** for payment monitoring

### Error Handling Patterns

```typescript
// Server Action error handling
export async function createClient(formData: FormData) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('athletes')
      .insert({ ... });

    if (error) throw error;

    revalidatePath('/dashboard/clients');
    return { success: true, data };

  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, error: 'Failed to create client' };
  }
}
```

---

## Testing Strategy (Future)

### Unit Testing
- **Framework:** Jest + React Testing Library
- **Coverage:** Utility functions, helpers, hooks
- **Target:** 80% code coverage

### Integration Testing
- **Framework:** Playwright or Cypress
- **Coverage:** Key user flows (sign up, create client, generate invoice)
- **Target:** Critical paths covered

### End-to-End Testing
- **Framework:** Playwright
- **Coverage:** Full user journeys (onboarding → first invoice)
- **Target:** Happy path + error handling

---

## Related Documents
- [Product Overview](./01-product-overview.md)
- [Customer Personas](./02-customer-personas.md)
- [Feature Blueprint](./03-feature-blueprint.md)
- [MVP Requirements](./04-mvp-requirements.md)
