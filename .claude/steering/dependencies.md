# Dependency Mapping: Shift Application

**Date:** November 21, 2025
**Purpose:** Complete inventory of external services, libraries, and integrations
**Audience:** Technical & Non-Technical Stakeholders

---

## Table of Contents
1. [External Services (Infrastructure)](#1-external-services-infrastructure)
2. [Major Libraries & Packages](#2-major-libraries--packages)
3. [API Endpoints](#3-api-endpoints)
4. [Database Tables & Relationships](#4-database-tables--relationships)
5. [Third-Party Integrations](#5-third-party-integrations)
6. [Dependency Risk Analysis](#6-dependency-risk-analysis)
7. [Failure Impact Matrix](#7-failure-impact-matrix)
8. [Mitigation Strategies](#8-mitigation-strategies)

---

## 1. External Services (Infrastructure)

### Service 1: Vercel (Hosting & Deployment)

**What it is:** Cloud platform for hosting Next.js applications

**What it provides:**
- **Serverless Functions:** Runs your server code on-demand
- **Edge Network:** Distributes your app globally (faster load times)
- **Automatic Deployments:** Every git push deploys automatically
- **SSL Certificates:** Free HTTPS encryption
- **Preview Deployments:** Test PRs before merging
- **Analytics:** Performance monitoring

**Why it's needed:**
- **Primary:** Hosts your entire application
- **Secondary:** Provides serverless infrastructure
- **Tertiary:** Manages deployments and scaling

**What would break if it failed:**
```
🔴 CRITICAL: Total application outage
- Users cannot access the website
- No pages load
- Dashboard, calendar, client management all offline
- Revenue impact: 100% (no one can use the app)
```

**Cost:** ~$20-100/month (scales with usage)

**Alternatives:**
- AWS Amplify
- Netlify
- Railway
- Self-hosted on AWS/GCP/Azure

**Contract/SLA:**
- 99.9% uptime guarantee (Professional plan)
- No long-term contract (month-to-month)
- Data export available anytime

**Environment Variables Required:**
```bash
# Set in Vercel Dashboard
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_PRICE_ID=...
NEXT_PUBLIC_APP_URL=...
```

---

### Service 2: Supabase (Database & Authentication)

**What it is:** PostgreSQL database + authentication service

**What it provides:**
- **PostgreSQL Database:** Stores all application data
- **Row Level Security (RLS):** Database-level authorization
- **Authentication API:** Email/password login system
- **Real-time Subscriptions:** Live data updates (not currently used)
- **Storage:** File uploads (not currently used)
- **Edge Functions:** Serverless functions (not currently used)

**Why it's needed:**
- **Primary:** Stores all data (users, profiles, clients, lessons, invoices)
- **Secondary:** Handles user authentication (login/signup)
- **Tertiary:** Enforces data security via RLS policies

**What would break if it failed:**
```
🔴 CRITICAL: Application unusable
- Login/signup broken (cannot authenticate)
- Cannot read/write any data
- Dashboard shows no data
- Cannot add clients, schedule lessons, create invoices
- Existing sessions may continue until they expire
- Revenue impact: 100% (app is read-only or broken)
```

**Current Usage:**
- **Database Size:** <100MB (early stage)
- **Requests:** ~1,000-10,000/month
- **Auth Users:** ~10-50 coaches

**Cost:** $0-25/month (currently on free tier)

**Pricing Tiers:**
- Free: Up to 500MB database, 50,000 monthly active users
- Pro: $25/month, 8GB database, 100,000 MAU
- Team: $599/month, custom limits

**Alternatives:**
- **Database:** AWS RDS, PlanetScale, Neon
- **Auth:** Auth0, Firebase Auth, Clerk
- **Combined:** Firebase (Google), AWS Amplify

**Contract/SLA:**
- 99.9% uptime guarantee (Pro plan and above)
- Free tier has no SLA
- Data export via PostgreSQL dump

**Database Tables (6 tables):**
1. `auth.users` - User accounts (managed by Supabase)
2. `profiles` - Coach profiles & subscription status
3. `clients` - Athlete roster
4. `lessons` - Scheduled lessons
5. `invoices` - Payment tracking
6. `invoice_line_items` - Invoice details

**Environment Variables Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...  # Public key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...      # Secret key (server-only)
```

---

### Service 3: Stripe (Payment Processing)

**What it is:** Payment processing platform for subscriptions

**What it provides:**
- **Checkout Sessions:** Hosted payment pages
- **Subscription Management:** Recurring billing
- **Customer Portal:** Self-service subscription management
- **Webhooks:** Event notifications (payment success, etc.)
- **PCI Compliance:** Secure card processing
- **Payment Methods:** Credit/debit cards

**Why it's needed:**
- **Primary:** Process coach subscription payments ($10/month)
- **Secondary:** Manage subscription lifecycle (active, canceled, past_due)
- **Tertiary:** Handle payment failures and retries

**IMPORTANT:** Stripe is ONLY used for coach subscriptions. Client-to-coach payments use P2P links (Venmo/Zelle).

**What would break if it failed:**
```
🟡 HIGH IMPACT: Revenue & subscription management broken
- Coaches cannot subscribe (new signups blocked after trial)
- Cannot manage subscriptions (cancel, update payment method)
- Cannot track subscription status changes
- Existing subscriptions continue (billed by Stripe)
- Trial users unaffected (no Stripe dependency)
- Revenue impact: 50% (trial users can still use app)
```

**Current Usage:**
- **Subscriptions:** ~0-50 active subscriptions
- **Revenue:** ~$0-500/month
- **Transactions:** ~50-100/month

**Cost:**
- **Transaction Fees:** 2.9% + $0.30 per transaction
- **Monthly Revenue:** $500 → Fees: ~$17
- **Platform Fee:** $0 (only transaction fees)

**Pricing Model:**
- No monthly platform fee
- Per-transaction fees: 2.9% + $0.30
- Subscription invoices: Same fees

**Alternatives:**
- PayPal
- Square
- Braintree
- Paddle
- Chargebee

**Contract/SLA:**
- No SLA (best-effort basis)
- 99.9%+ uptime historically
- Instant account setup
- No long-term contract

**Stripe Products:**
1. **Individual Coach Plan**
   - Price ID: `STRIPE_PRICE_ID` (environment variable)
   - Amount: $10.00/month
   - Billing: Monthly recurring

**Webhooks Handled:**
```
POST /api/webhooks/stripe
├── checkout.session.completed → Activate subscription
├── customer.subscription.updated → Update status
├── customer.subscription.deleted → Mark as canceled
└── invoice.payment_failed → Mark as past_due
```

**Environment Variables Required:**
```bash
STRIPE_SECRET_KEY=sk_test_xxx              # Secret key (server-only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Public key
STRIPE_WEBHOOK_SECRET=whsec_xxx            # Webhook signature verification
STRIPE_PRICE_ID=price_xxx                  # Product price ID
```

---

### Service 4: Email Service (Planned - Not Yet Implemented)

**What it is:** Transactional email service

**Options Being Considered:**
- **Resend** (recommended for startups)
- **SendGrid** (enterprise option)
- **AWS SES** (cost-effective)

**What it will provide:**
- **Invoice Emails:** Send invoices to parents
- **Reminder Emails:** Lesson reminders
- **Notification Emails:** Subscription confirmations, trial expiration

**Why it's needed:**
- **Primary:** Automate invoice delivery
- **Secondary:** Send automated reminders
- **Tertiary:** Marketing emails (future)

**Current Status:** 🟡 Planned but not implemented

**What would break if it failed:**
```
🟢 LOW IMPACT: Manual workarounds available
- Invoices not sent automatically (coach sends manually)
- Reminders not sent (coach sends manually)
- User experience degraded but functional
- Revenue impact: <5% (coaches can work around)
```

**Estimated Cost:**
- **Resend:** $20/month for 50,000 emails
- **SendGrid:** $15/month for 40,000 emails
- **AWS SES:** $0.10 per 1,000 emails (~$2/month)

**Integration Timeline:** Month 3-6 (post-MVP)

---

## 2. Major Libraries & Packages

### Runtime Dependencies (Production)

#### 2.1 Next.js (v15.1.6)

**What it is:** React framework for building web applications

**What it provides:**
- **App Router:** File-based routing system
- **Server Components:** Server-side rendering
- **Server Actions:** Backend functions without API routes
- **Image Optimization:** Automatic image resizing
- **Built-in CSS Support:** Tailwind, CSS Modules
- **TypeScript Support:** First-class TypeScript integration

**Why it's needed:**
- **Foundation:** Core framework for the entire app
- **Routing:** URL routing (`/dashboard`, `/clients`, etc.)
- **Rendering:** Server-side and client-side rendering
- **Performance:** Automatic optimizations

**What would break if it failed:**
```
🔴 CRITICAL: App cannot build or run
- Development server won't start
- Production build fails
- All pages and components broken
```

**Bundle Size:** ~90KB gzipped (framework core)

**Alternative Frameworks:**
- Remix
- SvelteKit
- Nuxt (Vue)
- Astro

**Update Frequency:** Every 4-6 weeks (stable releases)

**Breaking Changes:** Major versions (v14 → v15 had breaking changes)

---

#### 2.2 React (v19.0.0) & React-DOM (v19.0.0)

**What it is:** JavaScript library for building user interfaces

**What it provides:**
- **Components:** Reusable UI building blocks
- **Hooks:** State management (`useState`, `useEffect`)
- **JSX:** HTML-like syntax in JavaScript
- **Virtual DOM:** Efficient rendering

**Why it's needed:**
- **UI Framework:** Powers all interactive UI
- **Component Model:** Structure for building interfaces
- **State Management:** Handle user interactions

**What would break if it failed:**
```
🔴 CRITICAL: No UI rendering
- All components fail to render
- No interactivity (buttons, forms, clicks)
- Blank page in browser
```

**Bundle Size:** ~45KB gzipped

**Version Note:** React 19 is the latest version (released 2024)

---

#### 2.3 Supabase Libraries

##### @supabase/supabase-js (v2.45.7)

**What it is:** JavaScript client for Supabase API

**What it provides:**
- **Database Queries:** CRUD operations
- **Authentication:** Login, signup, session management
- **Real-time:** WebSocket subscriptions (not used)
- **Storage:** File uploads (not used)

**Why it's needed:**
- **Database Access:** All data reads/writes
- **Auth API:** User authentication
- **Type Safety:** TypeScript types for database

**What would break if it failed:**
```
🔴 CRITICAL: Cannot communicate with database
- All database queries fail
- Authentication broken
- App shows "Cannot connect to database" errors
```

**Bundle Size:** ~30KB gzipped

**Files Using It:**
- `lib/supabase/client.ts` (browser)
- `lib/supabase/server.ts` (server)
- All server actions

##### @supabase/ssr (v0.5.2)

**What it is:** Server-side rendering utilities for Supabase

**What it provides:**
- **Cookie Management:** Handle session cookies in Next.js
- **Server Client:** Create Supabase clients for server components
- **Middleware Support:** Session refresh in Next.js middleware

**Why it's needed:**
- **Server Auth:** Authenticate users in server components
- **Cookie Handling:** Manage auth cookies correctly
- **SSR Support:** Server-side rendering with Supabase

**What would break if it failed:**
```
🔴 CRITICAL: Server-side auth broken
- Protected pages cannot verify authentication
- Session cookies not handled correctly
- Users logged out unexpectedly
```

**Bundle Size:** ~10KB gzipped

---

#### 2.4 Stripe (v19.1.0)

**What it is:** Official Stripe SDK for Node.js

**What it provides:**
- **API Client:** Call Stripe API endpoints
- **Type Definitions:** TypeScript types for Stripe objects
- **Webhook Verification:** Verify webhook signatures
- **Error Handling:** Stripe-specific error types

**Why it's needed:**
- **Checkout Sessions:** Create payment pages
- **Subscription Management:** Manage recurring billing
- **Webhook Processing:** Handle payment events

**What would break if it failed:**
```
🟡 HIGH IMPACT: Subscription features broken
- Cannot create checkout sessions (new subscriptions blocked)
- Webhooks cannot be verified (security risk)
- Cannot check subscription status
- Server crashes on Stripe API calls
```

**Bundle Size:** ~50KB (server-only, not sent to browser)

**Files Using It:**
- `app/actions/stripe-actions.ts`
- `app/api/webhooks/stripe/route.ts`

**API Version:** `2025-10-29.clover` (pinned in code)

---

#### 2.5 date-fns (v4.1.0)

**What it is:** Modern JavaScript date utility library

**What it provides:**
- **Date Formatting:** Display dates in readable format
- **Date Manipulation:** Add/subtract days, months
- **Date Parsing:** Parse date strings
- **Timezone Support:** Handle different timezones

**Why it's needed:**
- **Trial Countdown:** Calculate days remaining in trial
- **Lesson Scheduling:** Format lesson dates/times
- **Invoice Dates:** Format due dates, sent dates

**What would break if it failed:**
```
🟢 LOW IMPACT: Date formatting errors
- Dates display as raw timestamps
- Trial countdown broken
- Lesson dates show incorrectly
- App still functional, just ugly dates
```

**Bundle Size:** ~15KB gzipped (only functions you use)

**Files Using It:**
- `app/dashboard/page.tsx` (trial countdown)
- `components/Calendar.tsx` (date formatting)
- Future invoice/lesson components

**Alternatives:**
- Moment.js (deprecated, larger)
- Day.js (smaller, less features)
- Luxon (more features, larger)
- Native JavaScript `Intl.DateTimeFormat`

---

### Development Dependencies (Dev-Only)

#### 2.6 TypeScript (v5.x)

**What it is:** Typed superset of JavaScript

**What it provides:**
- **Type Checking:** Catch bugs before runtime
- **Autocomplete:** Better IDE support
- **Refactoring:** Safe code changes
- **Documentation:** Types serve as docs

**Why it's needed:**
- **Bug Prevention:** Catch type errors during development
- **Developer Experience:** Autocomplete and IntelliSense
- **Code Quality:** Enforce type safety

**What would break if it failed:**
```
🟡 MEDIUM IMPACT: Development slowed
- Build fails (needs TypeScript compiler)
- No type checking (more bugs slip through)
- No autocomplete in IDE
- Can still run JavaScript (remove TypeScript)
```

**Build Time:** Adds ~5-10 seconds to production builds

---

#### 2.7 Testing Libraries

##### Jest (v30.2.0)

**What it is:** JavaScript testing framework

**What it provides:**
- **Test Runner:** Execute test files
- **Assertions:** Expect statements
- **Mocking:** Mock functions and modules
- **Coverage:** Code coverage reports

**Why it's needed:**
- **Quality Assurance:** Automated tests catch bugs
- **Regression Prevention:** Tests prevent breaking changes
- **Confidence:** Deploy with confidence

**Files Using It:**
- `__tests__/unit/actions/client-actions.test.ts`
- `__tests__/unit/components/ClientForm.test.tsx`
- `__tests__/integration/client-management.test.tsx`

##### React Testing Library (v16.3.0)

**What it is:** Testing utilities for React components

**What it provides:**
- **Component Rendering:** Render components in tests
- **User Interaction:** Simulate clicks, typing
- **Query Methods:** Find elements by role, text
- **Async Utilities:** Wait for async updates

**Why it's needed:**
- **Component Testing:** Test UI components
- **User-Centric Tests:** Test from user perspective
- **Integration Testing:** Test component interactions

##### @testing-library/jest-dom (v6.9.1)

**What it is:** Custom matchers for Jest

**What it provides:**
- **DOM Assertions:** `toBeInTheDocument()`, `toHaveValue()`
- **Accessibility:** `toHaveAccessibleName()`
- **Form Testing:** `toBeChecked()`, `toBeDisabled()`

**Coverage Thresholds (jest.config.ts):**
```javascript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 60,
    lines: 60,
    statements: 60,
  },
}
```

---

#### 2.8 Tailwind CSS (v3.4.1)

**What it is:** Utility-first CSS framework

**What it provides:**
- **Utility Classes:** Pre-built CSS classes
- **Responsive Design:** Mobile-first breakpoints
- **Dark Mode:** Built-in dark mode support
- **Custom Themes:** Color, spacing, font customization

**Why it's needed:**
- **Styling:** All UI styling uses Tailwind
- **Consistency:** Design system via utility classes
- **Responsive:** Mobile-friendly layouts

**What would break if it failed:**
```
🟡 MEDIUM IMPACT: No styles
- App renders but looks broken
- No colors, spacing, layout
- Functional but unusable
- Need to rewrite with plain CSS
```

**Bundle Size:** ~10KB gzipped (only classes you use)

**Configuration:** `tailwind.config.ts`

**Related Dependencies:**
- **PostCSS** (v8.4.49): CSS processor
- **Autoprefixer** (v10.4.20): Browser compatibility

---

#### 2.9 ESLint (v9.x)

**What it is:** JavaScript linter (code quality tool)

**What it provides:**
- **Code Quality:** Catch common mistakes
- **Style Enforcement:** Consistent code formatting
- **Best Practices:** Warn about anti-patterns
- **Next.js Rules:** Framework-specific linting

**Why it's needed:**
- **Code Quality:** Maintain consistent code style
- **Bug Prevention:** Catch errors early
- **Team Standards:** Enforce team conventions

**Configuration:** `.eslintrc.json`
```json
{
  "extends": "next/core-web-vitals"
}
```

**What would break if it failed:**
```
🟢 LOW IMPACT: Development quality reduced
- Build still works
- No linting errors shown
- Code quality may degrade
- More bugs slip through
```

---

## 3. API Endpoints

Your application has a **minimal API surface** due to Server Actions. Most backend logic uses Server Actions instead of traditional REST API routes.

### API Route 1: Stripe Webhook Handler

**Endpoint:** `POST /api/webhooks/stripe`

**File:** [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts)

**Purpose:** Receive and process Stripe webhook events

**Request Format:**
```http
POST /api/webhooks/stripe HTTP/1.1
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=abc123...

{
  "id": "evt_1ABC123",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_ABC123",
      "customer": "cus_ABC123",
      "subscription": "sub_ABC123",
      "client_reference_id": "user-uuid"
    }
  }
}
```

**Events Handled:**
1. **checkout.session.completed**
   - Triggered: When user completes Stripe checkout
   - Action: Set `subscription_status = 'active'` in profiles table
   - Updates: `stripe_customer_id`, `subscription_id`, `trial_ends_at = null`

2. **customer.subscription.updated**
   - Triggered: When subscription changes (payment method updated, plan changed)
   - Action: Update `subscription_status` based on Stripe status

3. **customer.subscription.deleted**
   - Triggered: When subscription is canceled
   - Action: Set `subscription_status = 'canceled'`

4. **invoice.payment_failed**
   - Triggered: When monthly payment fails
   - Action: Set `subscription_status = 'past_due'`

**Response Format:**
```json
{
  "received": true
}
```

**Security:**
- **Webhook Signature Verification:** Verifies `Stripe-Signature` header
- **Environment Variable:** `STRIPE_WEBHOOK_SECRET`
- **Rejects Invalid Signatures:** Returns 400 if signature invalid

**What would break if this failed:**
```
🟡 HIGH IMPACT: Subscription status not updated
- Users complete checkout but status stays "trial"
- Subscription changes not reflected in app
- Manual database updates required
- Users may be double-billed or lose access unexpectedly
```

**Called By:** Stripe servers (not your frontend)

**Frequency:**
- Checkout: Once per new subscription
- Updates: Whenever subscription changes
- Failures: When payments fail

**Dependencies:**
- Stripe SDK (webhook verification)
- Supabase Admin Client (database updates)

---

### Server Actions (Not Traditional API Routes)

Your app uses **Server Actions** instead of REST API endpoints for most backend operations. These are functions that run on the server but are called directly from client components.

**Why Server Actions Instead of API Routes:**
- Less boilerplate (no HTTP request/response handling)
- Type-safe (TypeScript works across client/server)
- Automatic serialization (no manual JSON parsing)
- Better performance (direct function calls)

**Server Actions Available:**

#### Client Management Actions
**File:** [app/actions/client-actions.ts](app/actions/client-actions.ts)

1. **addClient(formData: ClientData)**
   - Creates new client in database
   - Validates data, checks auth
   - Returns: `{ success: boolean, data?: Client, error?: string }`

2. **getClients()**
   - Fetches all clients for logged-in coach
   - Applies RLS filtering
   - Returns: `{ success: boolean, data: Client[] }`

3. **getClientById(clientId: string)**
   - Fetches single client by ID
   - Verifies ownership
   - Returns: `{ success: boolean, data?: Client }`

4. **updateClient(clientId: string, formData: ClientData)**
   - Updates existing client
   - Validates changes
   - Returns: `{ success: boolean, data?: Client }`

5. **deleteClient(clientId: string)**
   - Archives client (soft delete)
   - Sets `status = 'archived'`
   - Returns: `{ success: boolean }`

#### Stripe Actions
**File:** [app/actions/stripe-actions.ts](app/actions/stripe-actions.ts)

1. **createCheckoutSession(priceId: string)**
   - Creates Stripe Checkout session
   - Returns checkout URL
   - Returns: `{ success: boolean, sessionUrl?: string }`

2. **createCustomerPortalSession()**
   - Creates Stripe Customer Portal session
   - Allows users to manage subscriptions
   - Returns: `{ success: boolean, portalUrl?: string }`

3. **checkSubscriptionStatus()**
   - Checks current subscription status
   - Calculates trial expiration
   - Returns: `{ success: boolean, subscriptionStatus: string, isTrialExpired: boolean }`

#### Lesson Actions
**File:** [app/actions/lesson-actions.ts](app/actions/lesson-actions.ts) (inferred)

- Schedule lessons
- Fetch lessons
- Complete lessons
- Cancel lessons

---

## 4. Database Tables & Relationships

Your database uses **PostgreSQL** via Supabase with **Row Level Security (RLS)** for authorization.

### Database Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      auth.users (Supabase)                  │
│  ┌───────────┬────────────┬──────────────┬────────────┐    │
│  │ id (PK)   │ email      │ password     │ created_at │    │
│  └───────────┴────────────┴──────────────┴────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ 1:1
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                          profiles                           │
│  ┌───────────┬─────────────────┬─────────────┬───────────┐ │
│  │ id (PK/FK)│ stripe_cust_id  │ sub_status  │ trial_end │ │
│  └───────────┴─────────────────┴─────────────┴───────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ 1:many
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                          clients                            │
│  ┌───────────┬────────────┬──────────────┬──────────────┐  │
│  │ id (PK)   │ coach_id   │ athlete_name │ hourly_rate  │  │
│  │           │ (FK)       │              │              │  │
│  └───────────┴────────────┴──────────────┴──────────────┘  │
└────────────────────────┬───────────┬────────────────────────┘
                         │ 1:many    │ 1:many
                         ▼           ▼
       ┌─────────────────────────────────────────────────────┐
       │                  lessons                            │
       │  ┌────────┬──────────┬──────────┬──────────────┐   │
       │  │ id (PK)│coach_id  │client_id │ scheduled_at │   │
       │  │        │  (FK)    │  (FK)    │              │   │
       │  └────────┴──────────┴──────────┴──────────────┘   │
       └─────────────────────────────────────────────────────┘
                         │ many:many (via invoice_line_items)
                         ▼
       ┌─────────────────────────────────────────────────────┐
       │                  invoices                           │
       │  ┌────────┬──────────┬──────────┬──────────────┐   │
       │  │ id (PK)│coach_id  │client_id │ total_amount │   │
       │  │        │  (FK)    │  (FK)    │              │   │
       │  └────────┴──────────┴──────────┴──────────────┘   │
       └────────────────────────┬────────────────────────────┘
                                │ 1:many
                                ▼
       ┌─────────────────────────────────────────────────────┐
       │            invoice_line_items                       │
       │  ┌────────┬──────────┬──────────┬──────────────┐   │
       │  │ id (PK)│invoice_id│lesson_id │ unit_price   │   │
       │  │        │  (FK)    │  (FK)    │              │   │
       │  └────────┴──────────┴──────────┴──────────────┘   │
       └─────────────────────────────────────────────────────┘
```

---

### Table 1: auth.users (Managed by Supabase Auth)

**Purpose:** Store user authentication data

**Schema:**
```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255) NOT NULL,
  email_confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_sign_in_at TIMESTAMP,
  -- Additional Supabase auth fields
);
```

**Columns:**
- `id` (UUID, PK): Unique user identifier
- `email` (VARCHAR): User's email (login)
- `encrypted_password` (VARCHAR): Bcrypt hashed password
- `email_confirmed_at` (TIMESTAMP): Email verification timestamp
- `created_at` (TIMESTAMP): Account creation date
- `last_sign_in_at` (TIMESTAMP): Most recent login

**Relationships:**
- 1:1 with `profiles` table

**Managed By:** Supabase Auth (cannot directly modify)

**Access:** Via Supabase Auth API only

**What would break if this failed:**
```
🔴 CRITICAL: No authentication
- Cannot login or signup
- Cannot verify user identity
- All protected pages inaccessible
```

---

### Table 2: profiles

**Purpose:** Store coach profile data and subscription status

**Schema:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  venmo_link VARCHAR(255),
  zelle_link VARCHAR(255),
  preferred_payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id` (UUID, PK, FK): Links to `auth.users.id`
- `email` (VARCHAR): Cached email from auth.users
- `stripe_customer_id` (VARCHAR): Stripe customer ID (`cus_ABC123`)
- `subscription_id` (VARCHAR): Stripe subscription ID (`sub_ABC123`)
- `subscription_status` (VARCHAR): Current status
  - `'trial'` - New user, 180 days free
  - `'active'` - Paying subscriber
  - `'past_due'` - Payment failed
  - `'canceled'` - Subscription canceled
  - `'incomplete'` - Checkout not completed
- `trial_ends_at` (TIMESTAMP): Trial expiration date (NULL if subscribed)
- `venmo_link` (VARCHAR): Coach's Venmo profile URL
- `zelle_link` (VARCHAR): Coach's Zelle email/phone
- `preferred_payment_method` (VARCHAR): Which P2P link to show in invoices

**Indexes:**
```sql
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
```

**Relationships:**
- 1:1 with `auth.users` (same ID)
- 1:many with `clients`
- 1:many with `lessons`
- 1:many with `invoices`

**RLS Policies:**
```sql
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

**What would break if this failed:**
```
🔴 CRITICAL: No user profiles
- Cannot check subscription status
- Dashboard broken (no user data)
- Cannot determine trial expiration
- Payment links missing (invoice generation broken)
```

**Typical Row:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "coach@example.com",
  "stripe_customer_id": "cus_ABC123",
  "subscription_id": "sub_ABC123",
  "subscription_status": "active",
  "trial_ends_at": null,
  "venmo_link": "https://venmo.com/coach",
  "zelle_link": null,
  "preferred_payment_method": "venmo",
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-21T14:30:00Z"
}
```

---

### Table 3: clients

**Purpose:** Store athlete/client roster for each coach

**Schema:**
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_name VARCHAR(255) NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(50) NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id` (UUID, PK): Unique client identifier
- `coach_id` (UUID, FK): References `auth.users.id`
- `athlete_name` (VARCHAR): Skater's full name
- `parent_email` (VARCHAR): Parent/guardian email (for invoices)
- `parent_phone` (VARCHAR): Parent phone (for SMS reminders)
- `hourly_rate` (NUMERIC): Coach's rate for this client (can vary)
- `notes` (TEXT): Private coach notes
- `status` (VARCHAR): `'active'` or `'archived'` (soft delete)
- `created_at` (TIMESTAMP): When client was added
- `updated_at` (TIMESTAMP): Last modification

**Indexes:**
```sql
CREATE INDEX idx_clients_coach_id ON clients(coach_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);
```

**Relationships:**
- many:1 with `profiles` (coach)
- 1:many with `lessons`
- 1:many with `invoices`

**RLS Policies:**
```sql
CREATE POLICY "Coaches can view own clients"
ON clients FOR SELECT
TO authenticated
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert own clients"
ON clients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own clients"
ON clients FOR UPDATE
TO authenticated
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own clients"
ON clients FOR DELETE
TO authenticated
USING (auth.uid() = coach_id);
```

**What would break if this failed:**
```
🔴 CRITICAL: No client management
- Cannot view client roster
- Cannot add new clients
- Cannot edit client details
- Cannot schedule lessons (no client to book)
- Cannot generate invoices (no client to bill)
```

**Typical Row:**
```json
{
  "id": "client-uuid-here",
  "coach_id": "550e8400-e29b-41d4-a716-446655440000",
  "athlete_name": "Sarah Johnson",
  "parent_email": "mom@example.com",
  "parent_phone": "(555) 123-4567",
  "hourly_rate": 75.00,
  "notes": "Working on single axel, prefers morning lessons",
  "status": "active",
  "created_at": "2025-11-15T10:00:00Z",
  "updated_at": "2025-11-15T10:00:00Z"
}
```

---

### Table 4: lessons

**Purpose:** Store scheduled and completed lessons

**Schema:**
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id` (UUID, PK): Unique lesson identifier
- `coach_id` (UUID, FK): References `auth.users.id`
- `client_id` (UUID, FK): References `clients.id`
- `scheduled_at` (TIMESTAMP): Date and time of lesson
- `duration_minutes` (INTEGER): Lesson length (30, 45, 60, 90 minutes)
- `status` (VARCHAR): Lesson status
  - `'scheduled'` - Upcoming lesson
  - `'completed'` - Lesson finished
  - `'canceled'` - Lesson canceled
  - `'no_show'` - Client didn't show up
- `notes` (TEXT): Lesson-specific notes
- `created_at` (TIMESTAMP): When lesson was scheduled
- `updated_at` (TIMESTAMP): Last modification

**Indexes:**
```sql
CREATE INDEX idx_lessons_coach_id ON lessons(coach_id);
CREATE INDEX idx_lessons_client_id ON lessons(client_id);
CREATE INDEX idx_lessons_scheduled_at ON lessons(scheduled_at);
CREATE INDEX idx_lessons_status ON lessons(status);
```

**Relationships:**
- many:1 with `profiles` (coach)
- many:1 with `clients`
- 1:1 with `invoice_line_items` (one lesson → one line item)

**RLS Policies:**
```sql
CREATE POLICY "Coaches can manage own lessons"
ON lessons FOR ALL
TO authenticated
USING (auth.uid() = coach_id);
```

**What would break if this failed:**
```
🟡 HIGH IMPACT: No scheduling or calendar
- Cannot schedule lessons
- Calendar view broken
- Cannot track completed lessons
- Invoice generation broken (bills based on lessons)
```

**Typical Row:**
```json
{
  "id": "lesson-uuid-here",
  "coach_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_id": "client-uuid-here",
  "scheduled_at": "2025-11-22T14:00:00Z",
  "duration_minutes": 60,
  "status": "scheduled",
  "notes": "Work on single axel technique",
  "created_at": "2025-11-15T10:00:00Z",
  "updated_at": "2025-11-15T10:00:00Z"
}
```

---

### Table 5: invoices

**Purpose:** Store generated invoices for clients

**Schema:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  payment_link TEXT,
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  due_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id` (UUID, PK): Unique invoice identifier
- `coach_id` (UUID, FK): References `auth.users.id`
- `client_id` (UUID, FK): References `clients.id`
- `invoice_number` (VARCHAR): Human-readable invoice ID (e.g., `INV-2025-001`)
- `total_amount` (NUMERIC): Total invoice amount (sum of line items)
- `status` (VARCHAR): Invoice status
  - `'draft'` - Not yet sent
  - `'sent'` - Sent to parent
  - `'paid'` - Marked as paid by coach
  - `'overdue'` - Past due date
- `payment_link` (TEXT): Deep link to Venmo/Zelle (e.g., `venmo://pay?txn=...`)
- `sent_at` (TIMESTAMP): When invoice was emailed
- `paid_at` (TIMESTAMP): When coach marked as paid
- `due_at` (TIMESTAMP): Payment due date
- `created_at` (TIMESTAMP): When invoice was generated
- `updated_at` (TIMESTAMP): Last modification

**Indexes:**
```sql
CREATE INDEX idx_invoices_coach_id ON invoices(coach_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_at ON invoices(due_at);
```

**Relationships:**
- many:1 with `profiles` (coach)
- many:1 with `clients`
- 1:many with `invoice_line_items`

**RLS Policies:**
```sql
CREATE POLICY "Coaches can manage own invoices"
ON invoices FOR ALL
TO authenticated
USING (auth.uid() = coach_id);
```

**What would break if this failed:**
```
🟡 MEDIUM IMPACT: No invoice generation
- Cannot create invoices
- Cannot track payments
- Manual billing required
- Revenue tracking broken
```

**Typical Row:**
```json
{
  "id": "invoice-uuid-here",
  "coach_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_id": "client-uuid-here",
  "invoice_number": "INV-2025-001",
  "total_amount": 300.00,
  "status": "sent",
  "payment_link": "https://venmo.com/coach?note=Invoice-INV-2025-001&amount=300",
  "sent_at": "2025-11-15T10:00:00Z",
  "paid_at": null,
  "due_at": "2025-11-30T23:59:59Z",
  "created_at": "2025-11-15T10:00:00Z",
  "updated_at": "2025-11-15T10:00:00Z"
}
```

---

### Table 6: invoice_line_items

**Purpose:** Store individual line items on invoices (lessons billed)

**Schema:**
```sql
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id` (UUID, PK): Unique line item identifier
- `invoice_id` (UUID, FK): References `invoices.id`
- `lesson_id` (UUID, FK): References `lessons.id` (nullable if manual line item)
- `description` (TEXT): Line item description (e.g., "1-hour lesson on Nov 15, 2025")
- `quantity` (NUMERIC): Quantity (usually 1 for lessons, could be 2 for double lesson)
- `unit_price` (NUMERIC): Price per unit (hourly rate)
- `total_price` (NUMERIC): Total for this line (quantity × unit_price)
- `created_at` (TIMESTAMP): When line item was added

**Indexes:**
```sql
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_lesson_id ON invoice_line_items(lesson_id);
```

**Relationships:**
- many:1 with `invoices`
- 1:1 with `lessons` (one lesson → one line item)

**RLS Policies:**
```sql
CREATE POLICY "Coaches can manage own invoice line items"
ON invoice_line_items FOR ALL
TO authenticated
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE coach_id = auth.uid()
  )
);
```

**What would break if this failed:**
```
🟡 MEDIUM IMPACT: Invoice details missing
- Invoices show total but no breakdown
- Cannot see which lessons billed
- Cannot reconcile payments with lessons
```

**Typical Row:**
```json
{
  "id": "line-item-uuid-here",
  "invoice_id": "invoice-uuid-here",
  "lesson_id": "lesson-uuid-here",
  "description": "1-hour lesson on Nov 15, 2025",
  "quantity": 1,
  "unit_price": 75.00,
  "total_price": 75.00,
  "created_at": "2025-11-15T10:00:00Z"
}
```

---

### Database Relationships Summary

```
auth.users (1) ────────────────────────────────── (1) profiles
     │                                                  │
     │                                                  │
     │ (1:many)                                         │ (1:many)
     │                                                  │
     └──────────────────────┬─────────────────────────┘
                            │
                            ▼
                        clients (many)
                            │
                            │ (1:many)
                            │
                            ▼
                        lessons (many)
                            │
                            │ (many:many via invoice_line_items)
                            │
                      ┌─────┴─────┐
                      │           │
                      ▼           ▼
                  invoices    invoice_line_items
                  (many)          (many)
```

**Cascade Deletes:**
- Delete user → Deletes profile, clients, lessons, invoices (all data)
- Delete client → Deletes lessons, invoices for that client
- Delete invoice → Deletes line items

**Soft Deletes:**
- Clients: Set `status = 'archived'` (not permanently deleted)
- Lessons: Set `status = 'canceled'` (keep history)

---

## 5. Third-Party Integrations

### Current Integrations

#### 1. Stripe Checkout & Customer Portal

**Type:** Embedded integration (hosted by Stripe)

**What it does:**
- Hosts payment pages (users enter credit cards on Stripe's domain)
- Manages subscription lifecycle
- Handles payment retries

**Integration Points:**
- **Create Session:** `app/actions/stripe-actions.ts` → Stripe API
- **Redirect:** User leaves your app → Stripe domain
- **Return:** User returns to your app after payment
- **Webhooks:** Stripe → `/api/webhooks/stripe`

**Data Shared:**
- **To Stripe:** Coach email, user ID (metadata)
- **From Stripe:** Customer ID, subscription ID, payment status

**Security:**
- No credit card data touches your servers (PCI compliance)
- Webhook signatures verified
- HTTPS enforced

---

#### 2. Supabase Auth (Embedded)

**Type:** API integration

**What it does:**
- Email/password authentication
- Session management (JWT tokens)
- Email verification (optional)

**Integration Points:**
- **Login:** `app/login/page.tsx` → Supabase Auth API
- **Signup:** `app/signup/page.tsx` → Supabase Auth API
- **Session Refresh:** `middleware.ts` → Supabase Auth API

**Data Shared:**
- **To Supabase:** Email, password (hashed)
- **From Supabase:** User ID, JWT tokens

**Security:**
- Passwords hashed with bcrypt
- JWT tokens signed with secret key
- Session cookies HttpOnly and Secure

---

### Planned Integrations (Not Yet Implemented)

#### 3. Email Service (Resend or SendGrid)

**Type:** API integration

**Status:** 🟡 Planned for Month 3-6

**What it will do:**
- Send invoice emails to parents
- Send lesson reminders
- Send subscription confirmations

**Integration Points:**
- **Invoice Generation:** Generate PDF → Send via email API
- **Scheduled Jobs:** Cron job → Send reminders

**Data Shared:**
- **To Email Service:** Recipient email, HTML content, attachments
- **From Email Service:** Delivery status, open/click tracking

---

#### 4. SMS Service (Twilio)

**Type:** API integration

**Status:** 🟢 Future consideration (Year 2+)

**What it will do:**
- Send SMS lesson reminders
- Send payment reminders

**Why not now:**
- Cost (~$0.0075/SMS)
- Email sufficient for MVP
- Coach can send manual texts

---

#### 5. Venmo/Zelle Deep Links

**Type:** URL scheme integration

**Status:** ✅ Implemented (P2P payment links)

**What it does:**
- Generate deep links to Venmo/Zelle apps
- Pre-fill payment amount and note

**Integration Points:**
- **Invoice Generation:** Create link with amount and invoice number
- **Email/SMS:** Include link in invoice email

**Example Links:**
```
Venmo: venmo://pay?txn=pay&recipients=coach&amount=300&note=Invoice-INV-2025-001
Zelle: https://www.zellepay.com/pay?to=coach@example.com&amount=300
```

**Data Shared:**
- Coach payment handle (Venmo username or Zelle email)
- Payment amount
- Invoice note

**Security:**
- No API keys required (just URL schemes)
- Users must authorize payments in Venmo/Zelle app
- No payment confirmation (coach marks paid manually)

---

## 6. Dependency Risk Analysis

### Critical Dependencies (App Cannot Run Without)

| Dependency | Impact | Mitigation |
|-----------|---------|-----------|
| **Vercel** | 🔴 Total outage | Multi-region failover, backup to AWS |
| **Supabase** | 🔴 Total outage | Database backups, migrate to AWS RDS |
| **Next.js** | 🔴 Cannot build | Pin version, test upgrades |
| **React** | 🔴 Cannot render | Pin version, test upgrades |

### High-Impact Dependencies (Major Features Broken)

| Dependency | Impact | Mitigation |
|-----------|---------|-----------|
| **Stripe** | 🟡 No new subscriptions | Trial users unaffected, manual payment collection |
| **@supabase/supabase-js** | 🔴 Database broken | Use PostgreSQL client directly |
| **TypeScript** | 🟡 Dev experience | Can convert to JavaScript |

### Medium-Impact Dependencies (Some Features Broken)

| Dependency | Impact | Mitigation |
|-----------|---------|-----------|
| **date-fns** | 🟢 Date formatting | Use native JavaScript Date API |
| **Tailwind CSS** | 🟡 No styling | Convert to plain CSS |

### Low-Impact Dependencies (Dev Tools)

| Dependency | Impact | Mitigation |
|-----------|---------|-----------|
| **Jest** | 🟢 No tests | Use alternative test runner |
| **ESLint** | 🟢 No linting | Use Prettier or manual review |

---

## 7. Failure Impact Matrix

### Scenario 1: Vercel Outage

**Probability:** Low (99.9% uptime)
**Impact:** Critical (100% outage)

**What breaks:**
- Entire website offline
- No pages load
- Users see "503 Service Unavailable"

**Mitigation:**
- Multi-region deployment (Vercel Edge Network)
- Monitor uptime with external service (UptimeRobot)
- Communicate downtime via status page

**Recovery Time:**
- If Vercel outage: Wait for Vercel to recover (typically minutes)
- If account issue: Migrate to AWS/Netlify (4-8 hours)

---

### Scenario 2: Supabase Database Outage

**Probability:** Low (99.9% uptime on Pro plan)
**Impact:** Critical (app unusable)

**What breaks:**
- Cannot read any data
- Cannot write any data
- Login/signup broken
- All pages show "Loading..." or error

**Mitigation:**
- **Real-time Backups:** Supabase backs up every 6 hours
- **Point-in-Time Recovery:** Restore to any point in last 7 days
- **Database Export:** Weekly PostgreSQL dumps to S3
- **Failover:** Can migrate to AWS RDS if needed

**Recovery Time:**
- If Supabase outage: Wait for Supabase (typically minutes)
- If data corruption: Restore from backup (15-30 minutes)
- If permanent Supabase shutdown: Migrate to AWS RDS (1-2 days)

---

### Scenario 3: Stripe Outage

**Probability:** Very Low (99.99% uptime)
**Impact:** High (new subscriptions blocked)

**What breaks:**
- Cannot create new subscriptions
- Cannot access customer portal
- Webhooks not received

**What still works:**
- Trial users unaffected
- Existing subscriptions continue billing
- App remains functional

**Mitigation:**
- **Graceful Degradation:** Show "Subscribe later" message
- **Alternative Payment:** Accept direct bank transfers temporarily
- **Queue Webhooks:** Stripe retries webhooks for 72 hours

**Recovery Time:**
- If Stripe outage: Wait for Stripe (typically minutes)
- If webhook backlog: Process manually from Stripe dashboard (1-2 hours)

---

### Scenario 4: Next.js Breaking Change

**Probability:** Medium (major version upgrades)
**Impact:** Medium (requires code changes)

**What breaks:**
- App fails to build
- Deprecated APIs stop working
- Type errors in TypeScript

**Mitigation:**
- **Pin Version:** Use exact version in package.json (`15.1.6` not `^15.1.6`)
- **Test Upgrades:** Test in staging before production
- **Read Changelogs:** Review breaking changes before upgrading
- **Incremental Upgrades:** Upgrade minor versions first (15.1 → 15.2)

**Recovery Time:**
- Revert to previous version (5 minutes)
- Fix breaking changes (2-8 hours depending on complexity)

---

### Scenario 5: Dependency Vulnerability

**Probability:** Medium (happens occasionally)
**Impact:** Low-Medium (depends on vulnerability)

**What breaks:**
- Potential security risk
- No immediate breakage

**Mitigation:**
- **Dependabot:** Auto-create PRs for security updates
- **Regular Audits:** Run `npm audit` weekly
- **Update Dependencies:** Keep dependencies up-to-date

**Recovery Time:**
- Update dependency (5-30 minutes)
- Test and deploy (1-2 hours)

---

## 8. Mitigation Strategies

### Strategy 1: Dependency Monitoring

**Tools:**
- **Dependabot:** Auto-update dependencies
- **Snyk:** Security vulnerability scanning
- **npm audit:** Built-in vulnerability checker

**Process:**
1. Dependabot creates PR weekly
2. Review changes in staging
3. Run tests
4. Deploy to production

---

### Strategy 2: Database Backups

**Current Setup:**
- Supabase automatic backups (every 6 hours)
- Point-in-time recovery (7 days)

**Recommended Additions:**
- **Weekly Full Dumps:** Export to S3 (keep 1 year)
- **Daily Incremental Backups:** WAL archiving
- **Test Restores:** Quarterly restore test to verify backups work

**Script:**
```bash
# Weekly database export
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
aws s3 cp backup_*.sql s3://shift-backups/
```

---

### Strategy 3: Service Monitoring

**Uptime Monitoring:**
- **UptimeRobot:** Monitor homepage every 5 minutes
- **Alerts:** Email/SMS if down for > 5 minutes

**Error Tracking:**
- **Sentry:** Track JavaScript errors
- **Vercel Logs:** View server errors
- **Supabase Logs:** View database errors

**Performance Monitoring:**
- **Vercel Analytics:** Page load times
- **Web Vitals:** Core Web Vitals tracking

---

### Strategy 4: Graceful Degradation

**If Stripe is down:**
- Show message: "Subscription checkout temporarily unavailable. Try again later or contact support."
- Allow users to continue using trial
- Queue subscription requests

**If Database is slow:**
- Show loading spinners
- Cache data in browser (localStorage)
- Retry requests with exponential backoff

**If Email service is down:**
- Queue emails for later
- Show "Email will be sent shortly" message
- Log failures for manual follow-up

---

### Strategy 5: Disaster Recovery Plan

**Level 1: Vercel Outage (Critical)**
1. Check Vercel status page
2. If extended outage (> 2 hours), deploy to backup host
3. Update DNS to point to backup (TTL 5 minutes)
4. Communicate via status page and email

**Level 2: Database Corruption (Critical)**
1. Stop writes immediately
2. Identify corruption source
3. Restore from most recent backup
4. Replay transactions from WAL logs (if available)
5. Verify data integrity
6. Resume normal operations

**Level 3: Security Breach (Critical)**
1. Revoke all API keys immediately
2. Force logout all users (invalidate sessions)
3. Investigate breach source
4. Patch vulnerability
5. Notify affected users (GDPR requirement)
6. File incident report

---

## Summary & Recommendations

### Dependency Health Scorecard

| Category | Status | Action Needed |
|----------|--------|---------------|
| **Infrastructure** | 🟢 Healthy | Monitor uptime |
| **Database** | 🟢 Healthy | Add weekly backups |
| **Payment Processing** | 🟢 Healthy | None |
| **Libraries** | 🟢 Healthy | Update monthly |
| **Security** | 🟢 Healthy | Run audits weekly |

### Immediate Actions (Next Sprint)

1. ✅ **Set up Dependabot** (5 minutes)
2. ✅ **Enable Vercel Analytics** (5 minutes)
3. ✅ **Set up UptimeRobot** (10 minutes)
4. 🟡 **Weekly database backups to S3** (2 hours)
5. 🟡 **Document disaster recovery plan** (1 day)

### Short-Term (1-3 Months)

1. Add Sentry for error tracking
2. Set up automated security audits
3. Test database restore process
4. Create status page for users
5. Document all environment variables

### Long-Term (6-12 Months)

1. Multi-region database replication
2. Implement caching layer (Redis)
3. Add feature flags for graceful degradation
4. Set up staging environment
5. Implement blue-green deployments

---

**Document Last Updated:** November 21, 2025
**Next Review:** When adding major new dependency or integration
