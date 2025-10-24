# MVP Requirements: Shift (Sprint 3)

**Last Updated:** 2025-10-24
**Version:** 1.1
**Status:** Active Development
**Target Launch:** Sprint 3 Completion

---

## Executive Summary

This document defines the Minimum Viable Product (MVP) for Shift, focusing exclusively on the **Individual Coach Model**. The MVP prioritizes core administrative automation (scheduling, billing, payment) to deliver immediate time savings for solo coaches.

**MVP Goal:** Enable a solo figure skating coach to manage their client roster, schedule lessons, track billable hours, generate invoices, and collect payments through a single web application.

---

## MVP Scope

### What's IN Scope (MVP)
✅ User Authentication (Sign Up, Login, Password Reset)
✅ Athlete Profile Management (Create, Edit, View, Archive)
✅ Coach-Driven Lesson Scheduling
✅ Lesson Calendar View (Day, Week, Month)
✅ Post-Lesson Notes (Private coach notes)
✅ 24-Hour Cancellation Policy Enforcement
✅ Late Cancellation & No-Show Tracking
✅ Automated Invoice Generation (Weekly, Bi-Weekly, Monthly)
✅ Stripe Payment Integration
✅ Outstanding Payment Tracking
✅ Basic Dashboard (Upcoming lessons, outstanding payments)

### What's OUT of Scope (Post-MVP)
❌ SMS Reminders & Notifications (Phase 2)
❌ Dedicated Virtual Phone Number (Phase 2)
❌ Recurring Lesson Management (Phase 2)
❌ Goal Tracking (Phase 3)
❌ Lesson Plan Creation (Phase 3)
❌ Lesson Templates (Phase 3)
❌ External Calendar Sync (Phase 3)
❌ Team/Multi-Coach Model (Phase 4)
❌ Parent/Client Portal (Phase 5)

---

## User Stories (EARS Notation)

### Authentication & Onboarding

#### US-1: Sign Up
**As a** figure skating coach
**I want to** create an account with my email and password
**So that** I can start using the app to manage my coaching business

**Acceptance Criteria:**
1. **WHEN** I am on the landing page **AND** I click "Sign Up", **THEN** I shall be directed to the sign-up form
2. **WHEN** I submit valid email and password (6+ characters), **THEN** my account shall be created in Supabase Auth
3. **WHEN** my account is successfully created, **THEN** I shall be redirected to `/dashboard`
4. **IF** I attempt to sign up with an email that already exists, **THEN** I shall see an error message "An account with this email already exists"

**Priority:** P0 (Blocker)
**Status:** ✅ Completed

---

#### US-2: Log In
**As a** registered coach
**I want to** log in with my email and password
**So that** I can access my dashboard and manage my coaching business

**Acceptance Criteria:**
1. **WHEN** I am on the landing page **AND** I click "Log In", **THEN** I shall be directed to the login form
2. **WHEN** I submit valid credentials, **THEN** I shall be authenticated and redirected to `/dashboard`
3. **IF** I submit invalid credentials, **THEN** I shall see an error message "Invalid email or password"
4. **WHEN** I am authenticated, **THEN** my session shall persist across page refreshes

**Priority:** P0 (Blocker)
**Status:** 🔄 In Progress

---

#### US-3: Protected Dashboard Access
**As a** unauthenticated user
**I want to** be prevented from accessing the dashboard without logging in
**So that** my coaching data remains secure and private

**Acceptance Criteria:**
1. **WHEN** I attempt to visit `/dashboard` without being logged in, **THEN** I shall be redirected to `/login`
2. **WHEN** I am logged in **AND** I visit `/dashboard`, **THEN** I shall see my dashboard content
3. **WHEN** I click "Log Out", **THEN** my session shall be ended and I shall be redirected to the landing page

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

### Client Management

#### US-4: Create Athlete Profile
**As a** coach
**I want to** create a new athlete profile with contact and billing information
**So that** I can start scheduling lessons and tracking payments for that client

**Acceptance Criteria:**
1. **WHEN** I click "Add New Athlete" from my dashboard, **THEN** I shall see a profile creation form
2. **WHEN** I submit the form with required fields (athlete name, parent name, email, hourly rate), **THEN** a new athlete profile shall be created in the database
3. **WHEN** the profile is created, **THEN** I shall see a success message and the athlete shall appear in my client list
4. **IF** I attempt to submit without required fields, **THEN** I shall see validation error messages

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

#### US-5: View Athlete Profile
**As a** coach
**I want to** view a comprehensive profile for each athlete
**So that** I can see their contact info, billing details, and lesson history

**Acceptance Criteria:**
1. **WHEN** I click on an athlete from my client list, **THEN** I shall be directed to their profile page
2. **WHEN** I view the profile, **THEN** I shall see:
   - Athlete name and contact information
   - Billing rate and payment method
   - Upcoming scheduled lessons
   - Past lesson history
   - Outstanding balance (if any)
   - Private coach notes
3. **WHEN** I navigate away and return to the profile, **THEN** all information shall persist

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

#### US-6: Edit Athlete Profile
**As a** coach
**I want to** edit an athlete's profile information
**So that** I can keep contact and billing information up-to-date

**Acceptance Criteria:**
1. **WHEN** I am viewing an athlete profile **AND** I click "Edit", **THEN** I shall see an editable form with current information pre-filled
2. **WHEN** I update fields and click "Save", **THEN** the changes shall be persisted to the database
3. **WHEN** the save is successful, **THEN** I shall see a confirmation message and the updated information
4. **IF** I click "Cancel", **THEN** no changes shall be saved and I shall return to the read-only profile view

**Priority:** P1 (Important)
**Status:** ⏳ Pending

---

#### US-7: Archive Athlete
**As a** coach
**I want to** archive an athlete profile when they stop taking lessons
**So that** my active client list remains current without permanently deleting records

**Acceptance Criteria:**
1. **WHEN** I am viewing an athlete profile **AND** I click "Archive", **THEN** I shall see a confirmation dialog
2. **WHEN** I confirm the archive action, **THEN** the athlete shall be removed from my active client list
3. **WHEN** an athlete is archived, **THEN** their historical data (lessons, payments) shall remain accessible
4. **WHEN** I view archived athletes, **THEN** I shall have the option to "Restore" them to active status

**Priority:** P2 (Nice-to-have for MVP)
**Status:** ⏳ Pending

---

### Scheduling

#### US-8: Schedule a Single Lesson
**As a** coach
**I want to** schedule a lesson with an athlete at a specific date and time
**So that** the lesson appears on my calendar and can be tracked for billing

**Acceptance Criteria:**
1. **WHEN** I am viewing an athlete profile **AND** I click "Schedule Lesson", **THEN** I shall see a lesson scheduling form
2. **WHEN** I select a date, start time, and duration, **THEN** I shall be able to save the lesson
3. **WHEN** the lesson is saved, **THEN** it shall appear on my calendar view
4. **WHEN** the lesson is saved, **THEN** it shall be marked as "billable" by default
5. **IF** I attempt to schedule a lesson that conflicts with an existing lesson, **THEN** I shall see a warning message

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

#### US-9: View Lesson Calendar (Week View)
**As a** coach
**I want to** see all my scheduled lessons in a weekly calendar view
**So that** I can quickly understand my upcoming schedule

**Acceptance Criteria:**
1. **WHEN** I navigate to the Calendar page, **THEN** I shall see the current week's lessons by default
2. **WHEN** I view the calendar, **THEN** lessons shall display:
   - Athlete name
   - Lesson time
   - Lesson duration
   - Location (rink name)
3. **WHEN** I click on a lesson, **THEN** I shall see full lesson details
4. **WHEN** I navigate to previous/next week, **THEN** the calendar shall update to show that week's lessons

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

#### US-10: View Lesson Calendar (Day View)
**As a** coach
**I want to** see my schedule for a single day in an hour-by-hour format
**So that** I can focus on today's lessons while at the rink

**Acceptance Criteria:**
1. **WHEN** I switch to "Day View", **THEN** I shall see an hourly timeline for the selected day
2. **WHEN** I view the day, **THEN** lessons shall be displayed in their scheduled time slots
3. **WHEN** I navigate to previous/next day, **THEN** the calendar shall update accordingly
4. **WHEN** I tap on a lesson, **THEN** I shall see quick actions (View Details, Add Note, Mark Complete)

**Priority:** P1 (Important)
**Status:** ⏳ Pending

---

#### US-11: Cancel a Lesson (Coach-Initiated)
**As a** coach
**I want to** cancel a lesson I have scheduled
**So that** it is removed from my calendar and not billed to the client

**Acceptance Criteria:**
1. **WHEN** I am viewing a lesson **AND** I click "Cancel Lesson", **THEN** I shall see a confirmation dialog
2. **WHEN** I confirm the cancellation, **THEN** the lesson shall be removed from my calendar
3. **WHEN** a lesson is cancelled by me, **THEN** it shall NOT be marked as billable
4. **WHEN** a lesson is cancelled, **THEN** a record shall be kept in the lesson history with status "Cancelled by Coach"

**Priority:** P1 (Important)
**Status:** ⏳ Pending

---

#### US-12: Mark Lesson as Late Cancel or No-Show
**As a** coach
**I want to** mark a lesson as "Late Cancel" or "No-Show" when a parent cancels within 24 hours or doesn't show up
**So that** the lesson remains billable and protects my revenue

**Acceptance Criteria:**
1. **WHEN** I am viewing a lesson **AND** I select "Mark as Late Cancel", **THEN** I shall be prompted to confirm
2. **WHEN** I confirm, **THEN** the lesson status shall change to "Late Cancel"
3. **WHEN** a lesson is marked as "Late Cancel" or "No-Show", **THEN** it shall remain billable (included in invoice)
4. **WHEN** I mark a lesson as "Late Cancel", **THEN** I shall have the option to "Forgive" and mark it as non-billable

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

### Lesson Notes

#### US-13: Add Post-Lesson Note
**As a** coach
**I want to** write notes immediately after a lesson
**So that** I can track what we worked on and plan for the next lesson

**Acceptance Criteria:**
1. **WHEN** I view a completed lesson **AND** I click "Add Note", **THEN** I shall see a text input field
2. **WHEN** I write a note and click "Save", **THEN** the note shall be attached to that lesson
3. **WHEN** a note is saved, **THEN** it shall be visible only to me (private)
4. **WHEN** I view an athlete profile, **THEN** I shall see a timeline of all lesson notes for that athlete

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

#### US-14: Edit Past Lesson Notes
**As a** coach
**I want to** edit notes I've written for past lessons
**So that** I can correct errors or add additional context

**Acceptance Criteria:**
1. **WHEN** I am viewing a lesson note **AND** I click "Edit", **THEN** I shall see an editable text field
2. **WHEN** I update the note and click "Save", **THEN** the changes shall be persisted
3. **WHEN** a note is edited, **THEN** the "last updated" timestamp shall be updated
4. **WHEN** I click "Cancel", **THEN** no changes shall be saved

**Priority:** P2 (Nice-to-have for MVP)
**Status:** ⏳ Pending

---

### Billing & Payments

#### US-15: Automated Invoice Generation
**As a** coach
**I want to** automatically generate invoices for my clients based on logged lessons
**So that** I don't have to manually calculate billable hours and create invoices

**Acceptance Criteria:**
1. **WHEN** I set my billing cycle (weekly, bi-weekly, monthly), **THEN** invoices shall be automatically generated at the end of each period
2. **WHEN** an invoice is generated, **THEN** it shall include:
   - Itemized list of lessons (date, time, duration)
   - Hourly rate
   - Total hours
   - Total amount due
   - Previous outstanding balance (if any)
3. **WHEN** an invoice is generated, **THEN** it shall be automatically emailed to the client
4. **WHEN** I view an invoice, **THEN** I shall be able to download it as a PDF

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

#### US-16: Manual Invoice Creation
**As a** coach
**I want to** manually generate and send an invoice outside of my regular billing cycle
**So that** I can bill for one-off lessons or send a reminder invoice

**Acceptance Criteria:**
1. **WHEN** I am viewing an athlete profile **AND** I click "Create Invoice", **THEN** I shall see a preview of unbilled lessons
2. **WHEN** I confirm the invoice, **THEN** it shall be generated and emailed to the client
3. **WHEN** I create a manual invoice, **THEN** those lessons shall be marked as "billed" and not included in the next automatic invoice

**Priority:** P1 (Important)
**Status:** ⏳ Pending

---

#### US-17: Stripe Payment Integration
**As a** coach
**I want to** include a "Pay with Card" link in my invoices
**So that** clients can pay me securely with a credit card

**Acceptance Criteria:**
1. **WHEN** I connect my Stripe account in settings, **THEN** I shall be able to enable credit card payments
2. **WHEN** an invoice is generated, **THEN** it shall include a "Pay with Card" button/link
3. **WHEN** a client clicks "Pay with Card", **THEN** they shall be directed to a Stripe checkout page with the invoice amount pre-filled
4. **WHEN** a payment is successful, **THEN** the invoice shall be automatically marked as "Paid"
5. **WHEN** a payment is successful, **THEN** I shall receive a notification

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

#### US-18: Track Outstanding Payments
**As a** coach
**I want to** see which invoices are unpaid and how much money I'm owed
**So that** I can follow up with clients and understand my cash flow

**Acceptance Criteria:**
1. **WHEN** I view my dashboard, **THEN** I shall see:
   - Total outstanding balance (across all clients)
   - Number of unpaid invoices
   - List of clients with outstanding balances
2. **WHEN** I view an invoice, **THEN** I shall see its status (Sent, Viewed, Paid, Overdue)
3. **WHEN** an invoice is more than 7 days overdue, **THEN** it shall be flagged as "Overdue"
4. **WHEN** I click on an overdue invoice, **THEN** I shall have the option to send a payment reminder

**Priority:** P0 (Blocker)
**Status:** ⏳ Pending

---

#### US-19: Manually Mark Invoice as Paid
**As a** coach
**I want to** manually mark an invoice as paid when I receive payment outside of Stripe (Venmo, Zelle, cash)
**So that** my records stay accurate

**Acceptance Criteria:**
1. **WHEN** I am viewing an unpaid invoice **AND** I click "Mark as Paid", **THEN** I shall see a confirmation dialog
2. **WHEN** I confirm, **THEN** the invoice status shall change to "Paid"
3. **WHEN** I mark an invoice as paid, **THEN** I shall be able to add a note about the payment method (e.g., "Received via Venmo")
4. **WHEN** an invoice is marked as paid, **THEN** the client's outstanding balance shall be updated

**Priority:** P1 (Important)
**Status:** ⏳ Pending

---

### Dashboard

#### US-20: View Dashboard Overview
**As a** coach
**I want to** see a high-level overview of my business when I log in
**So that** I can quickly understand my schedule and financial status

**Acceptance Criteria:**
1. **WHEN** I log in and navigate to the dashboard, **THEN** I shall see:
   - Today's lessons (with times and athlete names)
   - This week's lesson count
   - Outstanding payment total
   - Number of overdue invoices
   - Quick action buttons (Schedule Lesson, Create Invoice, View Calendar)
2. **WHEN** I click on a lesson from the dashboard, **THEN** I shall be directed to the lesson details
3. **WHEN** I click on outstanding payments, **THEN** I shall be directed to the payments page

**Priority:** P1 (Important)
**Status:** ⏳ Pending

---

## Data Model (Simplified for MVP)

### Users Table
```sql
users (
  id: uuid [primary key, from Supabase Auth]
  email: text
  full_name: text
  business_name: text (optional)
  hourly_rate_default: decimal
  billing_cycle: enum (weekly, biweekly, monthly)
  stripe_account_id: text (optional)
  created_at: timestamp
  updated_at: timestamp
)
```

### Athletes Table
```sql
athletes (
  id: uuid [primary key]
  coach_id: uuid [foreign key → users.id]
  athlete_name: text
  parent_name: text
  email: text
  phone: text
  emergency_contact: text (optional)
  hourly_rate: decimal
  payment_method_preference: text (optional)
  status: enum (active, archived)
  created_at: timestamp
  updated_at: timestamp
)
```

### Lessons Table
```sql
lessons (
  id: uuid [primary key]
  coach_id: uuid [foreign key → users.id]
  athlete_id: uuid [foreign key → athletes.id]
  scheduled_date: date
  start_time: time
  duration_minutes: integer
  location: text (optional)
  status: enum (scheduled, completed, cancelled, late_cancel, no_show)
  is_billable: boolean [default: true]
  notes: text (optional)
  created_at: timestamp
  updated_at: timestamp
)
```

### Invoices Table
```sql
invoices (
  id: uuid [primary key]
  coach_id: uuid [foreign key → users.id]
  athlete_id: uuid [foreign key → athletes.id]
  invoice_number: text [unique]
  issue_date: date
  due_date: date
  total_hours: decimal
  total_amount: decimal
  status: enum (draft, sent, viewed, paid, overdue)
  payment_method: text (optional)
  payment_date: date (optional)
  stripe_payment_intent_id: text (optional)
  pdf_url: text (optional)
  created_at: timestamp
  updated_at: timestamp
)
```

### Invoice_Line_Items Table
```sql
invoice_line_items (
  id: uuid [primary key]
  invoice_id: uuid [foreign key → invoices.id]
  lesson_id: uuid [foreign key → lessons.id]
  description: text
  hours: decimal
  rate: decimal
  amount: decimal
  created_at: timestamp
)
```

---

## Technical Requirements

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Mobile-First)
- **UI Components:** Custom components in `/components` directory
- **State Management:** React hooks (useState, useEffect) + React Context for global state (optional)

### Backend
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes (Server Components + Server Actions)
- **File Storage:** Supabase Storage (for invoice PDFs)

### Integrations
- **Payments:** Stripe Checkout + Webhooks
- **Email:** Resend or SendGrid (for invoice delivery)

### Security
- All sensitive data operations MUST use Server Components and Supabase Server Client
- Row Level Security (RLS) enabled on all Supabase tables
- Authentication required for all protected routes
- HTTPS enforced in production

### Performance
- Page load time <2 seconds on 4G connection
- Calendar view renders <500ms
- Invoice generation <3 seconds

---

## Success Metrics (MVP)

### Primary Success Metric
**Billing Efficiency:** % of logged lessons successfully marked as "paid" within 30 days
- **Target:** >80%

### Secondary Metrics
1. **Time Saved:** Coach self-reported hours saved per week
   - **Target:** 4+ hours/week
2. **User Retention:** Weekly active usage
   - **Target:** >70% of registered coaches use app weekly
3. **Payment Collection Rate:** Reduction in 30+ day outstanding invoices
   - **Target:** <10% of invoices overdue >30 days
4. **Feature Adoption:**
   - % of coaches who have scheduled at least 5 lessons
   - % of coaches who have generated at least 1 invoice
   - % of coaches who have connected Stripe

---

## MVP Launch Checklist

### Pre-Launch
- [ ] All P0 user stories completed and tested
- [ ] Supabase database schema created with RLS policies
- [ ] Stripe integration tested in test mode
- [ ] Email delivery tested (invoice sending)
- [ ] Mobile responsiveness verified on iOS and Android
- [ ] Security audit completed (authentication, data access)
- [ ] Performance testing completed (load times, database queries)
- [ ] Error handling and validation implemented
- [ ] User documentation created (onboarding guide, FAQ)

### Launch
- [ ] Deploy to Vercel production
- [ ] Configure production environment variables
- [ ] Enable Stripe live mode
- [ ] Configure custom domain (if applicable)
- [ ] Enable error logging (Sentry or similar)

### Post-Launch
- [ ] Onboard Coach Brittlyn (beta user)
- [ ] Monitor error logs daily (first week)
- [ ] Collect user feedback via in-app survey
- [ ] Track success metrics weekly
- [ ] Iterate on bugs and quick wins
- [ ] Plan Phase 2 features based on feedback

---

## Out of Scope (Confirmed)

The following features are explicitly OUT OF SCOPE for the MVP and will be considered for future phases:

1. SMS notifications and reminders
2. Dedicated virtual phone number
3. Recurring lesson automation
4. Goal tracking for athletes
5. Lesson plan creation and templates
6. External calendar sync (Google Calendar, iCal)
7. Multi-coach/team functionality
8. Parent/client portal
9. Mobile app (native iOS/Android)
10. Advanced reporting and analytics
11. Multi-language support
12. Rink management features

---

## Related Documents
- [Product Overview](./01-product-overview.md)
- [Customer Personas](./02-customer-personas.md)
- [Feature Blueprint](./03-feature-blueprint.md)
- [Technical Architecture](./05-technical-architecture.md)
