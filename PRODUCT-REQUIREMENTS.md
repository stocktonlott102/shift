# Shift - Product Requirements Document (PRD)

**Product Name:** Shift
**Version:** 1.0 (MVP)
**Last Updated:** October 27, 2025
**Document Owner:** Product Team
**Status:** Active Development

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Target Users](#target-users)
4. [User Stories & Requirements](#user-stories--requirements)
5. [Feature Specifications](#feature-specifications)
6. [Technical Architecture](#technical-architecture)
7. [Success Metrics](#success-metrics)
8. [Timeline & Roadmap](#timeline--roadmap)
9. [Open Questions & Future Considerations](#open-questions--future-considerations)

---

## Executive Summary

**Problem Statement:**
Figure skating coaches struggle to manage their athletes efficiently, track progress, and maintain organized communication with parents. Current solutions are either too generic (Google Sheets) or too expensive (enterprise coaching platforms).

**Solution:**
Shift is a lightweight SaaS platform designed specifically for figure skating coaches to manage their athlete roster, track progress, and streamline operations - all for $10/month with a 180-day free trial.

**Key Value Propositions:**
- ✅ Simple, focused athlete management
- ✅ Affordable pricing ($10/month)
- ✅ Generous 180-day trial period
- ✅ Mobile-friendly interface
- ✅ Secure data storage

---

## Product Overview

### Vision
To become the go-to management tool for independent figure skating coaches, enabling them to spend less time on administration and more time coaching.

### Mission
Provide figure skating coaches with an affordable, easy-to-use platform to manage their athletes and grow their coaching business.

### Product Type
B2C SaaS (Business-to-Consumer Software as a Service)

### Business Model
- **Pricing:** $10/month subscription (single tier)
- **Trial:** 180 days free trial (no credit card required)
- **Payment:** Stripe integration for seamless subscription management
- **Target Market:** Independent figure skating coaches in the United States

---

## Target Users

### Primary Persona: Independent Figure Skating Coach

**Demographics:**
- Age: 25-55
- Location: United States (ice rinks nationwide)
- Employment: Self-employed or part-time coaching
- Tech Savvy: Moderate (comfortable with apps, not necessarily technical)

**Behaviors:**
- Manages 10-30 athletes of varying skill levels
- Communicates frequently with parents via email/text
- Tracks progress manually (notebooks, spreadsheets)
- Works irregular hours (early mornings, evenings, weekends)
- Often on the move between rinks

**Pain Points:**
- Hard to track which athletes are scheduled when
- Difficult to remember parent contact information
- No centralized system for athlete notes
- Spending too much time on administration
- Existing solutions are too expensive or too complex

**Goals:**
- Spend more time coaching, less time on paperwork
- Stay organized without complicated software
- Easily access athlete information on mobile
- Grow their coaching business sustainably

---

## User Stories & Requirements

### Epic 1: Authentication & Onboarding

#### US-1.1: Sign Up
**As a** new coach
**I want to** create an account with my email and password
**So that** I can start using Shift

**Acceptance Criteria:**
- Coach can sign up with email and password
- Email validation is enforced (valid format)
- Password must meet security requirements (minimum length)
- Account is automatically created with 180-day trial period
- Email confirmation is sent (currently configured for localhost - needs production update)
- User is redirected to dashboard after successful signup

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

#### US-1.2: Log In
**As a** returning coach
**I want to** log in with my email and password
**So that** I can access my account

**Acceptance Criteria:**
- Coach can log in with email and password
- Invalid credentials show clear error message
- Successful login redirects to dashboard
- Session persists across browser refreshes

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

#### US-1.3: Session Management
**As a** logged-in coach
**I want to** stay logged in during my session
**So that** I don't have to re-authenticate constantly

**Acceptance Criteria:**
- Session cookie-based authentication with Supabase
- Session persists after external redirects (e.g., Stripe checkout)
- Session refresh when returning from Stripe (via browser back button)
- Automatic session validation on protected routes

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented (recently fixed browser back button issue)

---

### Epic 2: Subscription Management

#### US-2.1: View Trial Status
**As a** trial user
**I want to** see how many days remain in my trial
**So that** I know when I need to subscribe

**Acceptance Criteria:**
- Dashboard displays trial banner with days remaining
- Banner shows when trial expires (180 days from signup)
- Banner is visible on all dashboard pages
- Banner is dismissed after subscription

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

#### US-2.2: Subscribe to Paid Plan
**As a** coach nearing end of trial
**I want to** subscribe for $10/month
**So that** I can continue using Shift

**Acceptance Criteria:**
- "Subscribe Now" button visible in trial banner
- Clicking button redirects to Stripe Checkout
- Stripe session includes coach's email pre-filled
- Successful payment shows confirmation message
- Subscription status updated in database via webhook
- Trial banner removed after successful subscription

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

#### US-2.3: Cancel Subscription Flow
**As a** subscribed coach
**I want to** return to dashboard if I cancel checkout
**So that** I don't lose my session

**Acceptance Criteria:**
- Browser back button from Stripe returns to dashboard
- User remains logged in after canceling checkout
- "Checkout canceled" message displayed
- No subscription created in system
- Trial status unchanged

**Priority:** P1 (Should Have)
**Status:** ✅ Implemented (recently fixed)

#### US-2.4: Webhook Subscription Updates
**As the** system
**I want to** automatically update subscription status via webhooks
**So that** coaches have immediate access after payment

**Acceptance Criteria:**
- Webhook verifies Stripe signature for security
- `checkout.session.completed` event creates subscription record
- Coach profile updated with subscription status and Stripe customer ID
- Webhook uses service role key to bypass RLS policies
- Idempotent webhook processing (doesn't duplicate subscriptions)

**Priority:** P0 (Must Have)
**Status:** ⚠️ Partially Implemented (webhook exists, needs idempotency)

---

### Epic 3: Athlete Management

#### US-3.1: View Athletes List
**As a** coach
**I want to** see all my athletes in one place
**So that** I can quickly access their information

**Acceptance Criteria:**
- Dashboard displays all athletes for logged-in coach
- Athletes shown in card grid layout
- Each card shows athlete name, age, parent email, phone
- Empty state with "Add Client" prompt when no athletes exist
- Mobile-responsive grid (1 column on mobile, 3+ on desktop)

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

#### US-3.2: Add New Athlete
**As a** coach
**I want to** add a new athlete to my roster
**So that** I can track their information

**Acceptance Criteria:**
- "Add Client" button navigates to `/clients/new` page
- Form includes: athlete name, age, parent name, email, phone
- All fields are required
- Email validation enforced (valid email format)
- Phone validation enforced (accepts various formats: (xxx) xxx-xxxx, xxx-xxx-xxxx, etc.)
- Age must be a positive number
- Success message displayed after adding athlete
- Redirects to clients list after successful add
- Cancel button returns to clients list without saving

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

#### US-3.3: Delete Athlete
**As a** coach
**I want to** remove an athlete from my roster
**So that** I can keep my list up-to-date

**Acceptance Criteria:**
- Each athlete card has a "Delete" button
- Clicking delete shows confirmation dialog
- Confirming deletion removes athlete from database
- Athlete list updates immediately after deletion
- Deletion is permanent (no soft delete in MVP)

**Priority:** P1 (Should Have)
**Status:** ⚠️ Not Yet Implemented

#### US-3.4: Edit Athlete Information
**As a** coach
**I want to** update athlete details
**So that** I can keep information current

**Acceptance Criteria:**
- Each athlete card has an "Edit" button
- Clicking edit navigates to edit form
- Form pre-populated with existing athlete data
- Validation same as add form
- Save updates athlete in database
- Cancel returns without saving changes

**Priority:** P1 (Should Have)
**Status:** ⚠️ Not Yet Implemented

---

### Epic 4: Dashboard & Navigation

#### US-4.1: Dashboard Overview
**As a** coach
**I want to** see an overview of my coaching business
**So that** I can quickly assess my status

**Acceptance Criteria:**
- Dashboard header shows "Welcome, [coach name]"
- Trial/subscription status banner displayed
- Athletes count displayed
- Logout button in header
- Dark mode support with system preference detection

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

#### US-4.2: Logout
**As a** coach
**I want to** log out of my account
**So that** my information is secure

**Acceptance Criteria:**
- Logout button visible in dashboard
- Clicking logout ends session
- User redirected to login page
- Session cookies cleared
- Cannot access protected routes after logout

**Priority:** P0 (Must Have)
**Status:** ✅ Implemented

---

## Feature Specifications

### Authentication System

**Technology:** Supabase Auth with Row Level Security (RLS)

**Features:**
- Email/password authentication
- Session-based authentication using HTTP-only cookies
- Server-side session validation
- Client-side session refresh after external redirects
- Protected routes with automatic redirect to login

**Security:**
- Passwords hashed with bcrypt (handled by Supabase)
- HTTP-only cookies prevent XSS attacks
- RLS policies enforce data isolation between coaches
- Server actions validate user identity before data operations

**Edge Cases Handled:**
- Session persistence after Stripe checkout redirect
- Session refresh when using browser back button from Stripe
- Automatic re-authentication on session expiry
- Invalid credentials error handling

---

### Subscription System

**Technology:** Stripe Checkout + Webhooks

**Pricing:**
- **Trial Period:** 180 days free (6 months)
- **Subscription:** $10/month (recurring)
- **Payment Method:** Credit/debit card via Stripe

**User Flow:**
1. Coach signs up → 180-day trial starts automatically
2. Dashboard shows trial banner with countdown
3. Coach clicks "Subscribe Now" → redirects to Stripe Checkout
4. Coach enters payment info → completes checkout
5. Stripe webhook updates database → trial banner removed
6. Coach has full access with active subscription

**Webhook Events:**
- `checkout.session.completed`: Creates subscription record, updates coach profile
- Future: `customer.subscription.updated`, `customer.subscription.deleted`

**Subscription States:**
- `trial`: Active trial period (default for new users)
- `active`: Paid subscription active
- `canceled`: Subscription canceled (future state)
- `past_due`: Payment failed (future state)

**Edge Cases:**
- Checkout cancellation: User returns to dashboard without subscribing
- Multiple subscription attempts: Only one subscription allowed per coach
- Webhook failures: Needs retry logic (not yet implemented)

---

### Athlete Management System

**Data Model:**

```typescript
interface Client {
  id: string;                    // UUID (auto-generated)
  coach_id: string;              // Foreign key to coaches.id
  athlete_name: string;          // Full name of athlete
  athlete_age: number;           // Current age
  parent_name: string;           // Parent/guardian name
  parent_email: string;          // Parent contact email
  parent_phone: string;          // Parent contact phone
  created_at: timestamp;         // Auto-generated
  updated_at: timestamp;         // Auto-updated
}
```

**Database:**
- PostgreSQL via Supabase
- RLS policies ensure coaches only see their own athletes
- Foreign key relationship: `clients.coach_id → auth.users.id`

**Validation Rules:**
- `athlete_name`: Required, 1-100 characters
- `athlete_age`: Required, positive integer
- `parent_name`: Required, 1-100 characters
- `parent_email`: Required, valid email format
- `parent_phone`: Required, valid phone format (flexible)

**UI Components:**
- Grid layout for athlete cards (responsive)
- Card shows: name, age, parent info, actions
- Empty state with CTA to add first athlete
- Loading states during data fetches
- Error states for failed operations

---

### User Interface & Design

**Design System:**
- **Framework:** Tailwind CSS
- **Color Scheme:** Indigo primary, neutral grays
- **Dark Mode:** Supported with system preference detection
- **Typography:** System font stack for performance
- **Spacing:** Tailwind default scale (4px increments)

**Responsive Breakpoints:**
- Mobile: < 640px (1 column grid)
- Tablet: 640px - 1024px (2 column grid)
- Desktop: > 1024px (3+ column grid)

**Key UI Patterns:**
- Form validation with inline error messages
- Loading spinners during async operations
- Success/error toast notifications (via DashboardWrapper)
- Confirmation dialogs for destructive actions
- Skeleton states for loading content

**Accessibility:**
- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on form inputs
- Color contrast meets WCAG AA standards

---

## Technical Architecture

### Stack Overview

**Frontend:**
- Next.js 15 (App Router)
- React 19 (Server Components + Client Components)
- TypeScript 5.x
- Tailwind CSS 3.x

**Backend:**
- Next.js Server Actions
- Supabase (Auth + PostgreSQL)
- Stripe API

**Hosting & Deployment:**
- Vercel (frontend hosting + serverless functions)
- Supabase Cloud (database + auth)
- Stripe (payment processing)

**Development:**
- npm (package manager)
- ESLint (code linting)
- Git + GitHub (version control)
- Turbopack (dev server)

---

### Data Architecture

**Database Schema:**

```sql
-- Coaches table (managed by Supabase Auth)
auth.users
├── id (uuid, primary key)
├── email (varchar)
├── created_at (timestamp)
└── ... (other auth fields)

-- Coach profiles (extended user data)
public.coach_profiles
├── id (uuid, primary key, references auth.users.id)
├── stripe_customer_id (varchar, nullable)
├── subscription_status (varchar: 'trial' | 'active' | 'canceled')
├── trial_end_date (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)

-- Athletes/Clients table
public.clients
├── id (uuid, primary key)
├── coach_id (uuid, foreign key → auth.users.id)
├── athlete_name (varchar)
├── athlete_age (integer)
├── parent_name (varchar)
├── parent_email (varchar)
├── parent_phone (varchar)
├── created_at (timestamp)
└── updated_at (timestamp)

-- Subscriptions table
public.subscriptions
├── id (uuid, primary key)
├── coach_id (uuid, foreign key → auth.users.id)
├── stripe_subscription_id (varchar, unique)
├── stripe_customer_id (varchar)
├── status (varchar)
├── current_period_start (timestamp)
├── current_period_end (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Row Level Security (RLS) Policies:**

```sql
-- Coaches can only read their own profile
CREATE POLICY "Coaches can view own profile"
  ON coach_profiles FOR SELECT
  USING (auth.uid() = id);

-- Coaches can only read their own clients
CREATE POLICY "Coaches can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = coach_id);

-- Coaches can only insert their own clients
CREATE POLICY "Coaches can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

-- Similar policies for UPDATE and DELETE
```

---

### API Architecture

**Server Actions** (`app/actions/`):

```typescript
// stripe-actions.ts
export async function createCheckoutSession(coachId: string)
  → { success: boolean, sessionUrl?: string, error?: string }

// client-actions.ts
export async function addClient(formData: ClientFormData)
  → { success: boolean, data?: Client, error?: string }

export async function getClients()
  → Client[]
```

**API Routes** (`app/api/`):

```typescript
// app/api/webhooks/stripe/route.ts
POST /api/webhooks/stripe
  - Verifies Stripe signature
  - Processes checkout.session.completed event
  - Updates database with subscription info
  - Returns 200 OK to Stripe
```

**Response Patterns:**

```typescript
// Success response
{
  success: true,
  data: { ... }
}

// Error response
{
  success: false,
  error: "Human-readable error message"
}
```

---

### Security Architecture

**Authentication Security:**
- Session-based auth with HTTP-only cookies
- CSRF protection (Next.js built-in)
- Server-side session validation on all protected routes
- RLS policies prevent unauthorized data access

**API Security:**
- Server Actions validate user identity before operations
- Stripe webhook signature verification
- Service role key only used in webhook (isolated)
- No sensitive data exposed to client

**Data Security:**
- All API routes use HTTPS
- Database credentials in environment variables
- Stripe keys secured in environment variables
- No SQL injection risk (using Supabase SDK parameterized queries)

**Known Security Gaps** (from code review):
- ⚠️ Console.logs expose environment variable names in production
- ⚠️ No rate limiting on authentication endpoints
- ⚠️ No webhook idempotency (could process same event twice)
- ⚠️ No CSRF token verification (relying on Next.js default)

---

## Success Metrics

### Primary Metrics (Launch Goals)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Signups** | 50 coaches in first month | Track Supabase auth.users count |
| **Trial-to-Paid Conversion** | 20% conversion rate | Track subscriptions / total signups |
| **Active Users (WAU)** | 30 weekly active users | Track login frequency |
| **Athletes Added** | 500+ athletes in first month | Track clients table count |
| **Churn Rate** | < 10% monthly churn | Track subscription cancellations |

### Secondary Metrics (Product Quality)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Session Duration** | 5+ minutes average | Analytics tracking |
| **Page Load Time** | < 2 seconds | Vercel Analytics |
| **Error Rate** | < 1% of requests | Error tracking (Sentry) |
| **Mobile Usage** | > 40% of traffic | User agent tracking |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Monthly Recurring Revenue (MRR)** | $500 month 1, $2,000 month 6 | Stripe dashboard |
| **Customer Acquisition Cost (CAC)** | < $20 per customer | Marketing spend / signups |
| **Customer Lifetime Value (LTV)** | > $120 (12 months) | Average subscription length * $10 |
| **LTV:CAC Ratio** | > 3:1 | LTV / CAC |

---

## Timeline & Roadmap

### Phase 1: MVP Launch (Completed)

**Status:** ✅ Completed (October 2025)

**Delivered Features:**
- Authentication (signup, login, logout)
- Trial management (180-day trial, countdown banner)
- Subscription integration (Stripe Checkout, webhooks)
- Athlete management (add, view athletes)
- Dashboard overview
- Mobile-responsive UI
- Dark mode support

**Deployment:**
- Live at: https://shift-ivory.vercel.app
- Database: Supabase Cloud (production)
- Payments: Stripe (live mode)

---

### Phase 2: Core Enhancements (Next 4-6 Weeks)

**Priority:** High
**Timeline:** November - December 2025

**Features to Add:**

1. **Athlete Profile Enhancements**
   - Edit athlete information
   - Delete athlete with confirmation
   - Add notes field for each athlete
   - Add skill level tracking

2. **Quality & Reliability**
   - Add comprehensive test suite (60%+ coverage)
   - Implement error tracking (Sentry)
   - Add structured logging
   - Remove/gate production console.logs
   - Fix email confirmation URLs (production)

3. **User Experience**
   - Add loading states for all async operations
   - Implement optimistic UI updates
   - Add toast notifications for all actions
   - Improve error messages (specific, actionable)

4. **Security Hardening**
   - Add rate limiting to auth endpoints
   - Implement webhook idempotency
   - Add input sanitization
   - Environment variable validation

**Success Criteria:**
- Edit/delete athlete functionality working
- Test coverage > 60%
- Error tracking operational
- Zero console.logs in production
- Email confirmation working on live site

---

### Phase 3: Growth Features (Months 3-4)

**Priority:** Medium
**Timeline:** January - February 2026

**Features to Add:**

1. **Communication Tools**
   - Send emails to parents directly from Shift
   - Email templates for common communications
   - Track email history per athlete

2. **Scheduling**
   - Add lesson scheduling
   - Calendar view of upcoming lessons
   - Reminder notifications

3. **Progress Tracking**
   - Skill checklist for athletes
   - Progress photos upload
   - Competition results tracking

4. **Billing Enhancements**
   - Invoice generation for lessons
   - Payment tracking
   - Billing history

**Success Criteria:**
- 80% of users send at least one email via Shift
- 50% of users schedule lessons in Shift
- Positive user feedback on new features

---

### Phase 4: Scale & Optimize (Months 5-6)

**Priority:** Low
**Timeline:** March - April 2026

**Features to Add:**

1. **Advanced Features**
   - Multi-coach support (team features)
   - Parent portal (view-only access)
   - Custom fields for athletes
   - Bulk operations (import/export)

2. **Performance**
   - Implement caching strategy
   - Database query optimization
   - Image optimization
   - Code splitting

3. **Analytics**
   - Coach dashboard analytics
   - Business insights (revenue, growth)
   - Usage analytics

**Success Criteria:**
- Page load time < 1 second
- Support 500+ concurrent users
- 90% of coaches use analytics features

---

## Open Questions & Future Considerations

### Technical Decisions Needed

1. **Testing Strategy**
   - Which testing framework? (Jest vs Vitest)
   - E2E testing tool? (Playwright vs Cypress)
   - When to write tests? (Now vs later)

2. **Error Tracking**
   - Which service? (Sentry vs LogRocket vs Rollbar)
   - Budget for error tracking? ($0 vs $29/mo)

3. **Observability**
   - Logging solution? (Pino vs Winston vs Bunyan)
   - Log aggregation? (Vercel Logs vs external service)
   - Performance monitoring? (Vercel Analytics vs custom)

4. **Database Management**
   - Migration strategy? (Supabase migrations vs custom)
   - Backup strategy?
   - How to handle schema changes in production?

### Product Questions

1. **Pricing Model**
   - Is $10/month the right price?
   - Should we offer annual discount?
   - Should we add tiers? (Basic/Pro/Enterprise)
   - Free tier with limited athletes?

2. **Trial Period**
   - Is 180 days too long/too short?
   - Should trial require credit card upfront?
   - What happens when trial expires? (grace period vs immediate lockout)

3. **Feature Scope**
   - Should we add group lesson support?
   - Should we support multiple sports? (expand beyond figure skating)
   - Should we add parent portal in Phase 2 or Phase 4?

4. **Competition**
   - Who are our main competitors?
   - What do they charge?
   - What features differentiate us?
   - Can we compete on price alone?

### Business Questions

1. **Marketing**
   - How will we acquire users?
   - What marketing budget do we have?
   - Social media strategy?
   - Content marketing?

2. **Support**
   - How will we handle customer support?
   - Email support vs chat vs phone?
   - SLA for response time?
   - Knowledge base / FAQ needed?

3. **Legal**
   - Privacy policy created?
   - Terms of service created?
   - GDPR compliance needed? (US-only for now)
   - Data retention policy?

4. **Operations**
   - Who monitors production issues?
   - On-call rotation?
   - Incident response plan?
   - Disaster recovery plan?

---

## Appendices

### A. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PRICE_ID=price_xxx
NEXT_PUBLIC_APP_URL=https://shift-ivory.vercel.app

# Optional (for development)
NODE_ENV=development|production
```

### B. Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `app/page.tsx` | Landing page | ✅ Complete |
| `app/login/page.tsx` | Login form | ✅ Complete |
| `app/signup/page.tsx` | Signup form | ✅ Complete |
| `app/dashboard/page.tsx` | Main dashboard | ✅ Complete |
| `app/clients/page.tsx` | Athletes list | ✅ Complete |
| `app/clients/new/page.tsx` | Add athlete form | ✅ Complete |
| `app/actions/stripe-actions.ts` | Stripe checkout logic | ✅ Complete |
| `app/actions/client-actions.ts` | Athlete CRUD | ⚠️ Partial (add only) |
| `app/api/webhooks/stripe/route.ts` | Stripe webhook handler | ✅ Complete |
| `components/DashboardWrapper.tsx` | Session refresh wrapper | ✅ Complete |
| `components/SubscribeButton.tsx` | Stripe checkout trigger | ✅ Complete |
| `components/ClientForm.tsx` | Athlete form component | ✅ Complete |
| `lib/supabase/client.ts` | Supabase browser client | ✅ Complete |
| `lib/supabase/server.ts` | Supabase server client | ✅ Complete |

### C. Database RLS Policies

**Current Policies:**
```sql
-- Coach profiles
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for own profile"
ON coach_profiles FOR SELECT
USING (auth.uid() = id);

-- Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for own clients"
ON clients FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Enable insert for own clients"
ON clients FOR INSERT
WITH CHECK (auth.uid() = coach_id);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = coach_id);
```

### D. Related Documents

- **Code Review Analysis**: `code-review-analysis.md` (engineering quality assessment)
- **Session Notes**: Previous session summaries with implementation details
- **README**: `README.md` (development setup instructions)

---

**Document Version:** 1.0
**Last Updated:** October 27, 2025
**Next Review:** November 15, 2025
