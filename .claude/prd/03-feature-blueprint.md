# Feature Blueprint: Shift

**Last Updated:** 2025-10-24
**Version:** 1.1
**Status:** Active Development

---

## Overview

This document outlines the complete feature set for Shift, separated by the two target coaching models:
1. **Individual Coach Model** - Solo coach managing their own client roster
2. **Coaching Team Model** - Head Coach coordinating multiple coaches and shared athletes

---

## I. Individual Coach Functionality

> **Target User:** Solo coach managing 10-30 private students
> **Primary Goal:** Automate scheduling, billing, and communication to save 6-8 hours/week

---

### A. Client Management and Profiles

#### A1. Athlete Profiles
**Description:** Digital file for each client storing comprehensive information

**Fields:**
- **Contact Information**
  - Athlete name
  - Parent/guardian names
  - Email addresses
  - Phone numbers
  - Emergency contacts
- **Billing Information**
  - Hourly rate
  - Payment method preferences (Venmo, Zelle, Stripe)
  - Billing frequency (weekly, bi-weekly, monthly)
  - Outstanding balance
- **Availability**
  - Client-submitted preferred lesson times
  - Day-of-week preferences
  - Time-of-day preferences
  - Blackout dates (vacations, competitions)
- **Basic Info**
  - Skill level
  - Current test level
  - Date started coaching

**User Actions:**
- Create new athlete profile
- Edit athlete information
- View athlete profile
- Archive/deactivate athlete (no longer coaching)

**MVP Status:** ✅ Core MVP Feature

---

#### A2. Goal Tracking
**Description:** Jointly set and monitor specific skating goals for each athlete

**Features:**
- Create goals with target completion dates (e.g., "Pass Pre-Juvenile Moves test by March 2025")
- Mark goals as in-progress, completed, or deferred
- View goal history and completion timeline
- Link goals to specific lesson notes

**User Actions:**
- Add new goal for athlete
- Update goal status
- View goal progress
- Generate goal completion report

**MVP Status:** 🔄 Post-MVP (Phase 2)

---

#### A3. Coach Lesson Notes
**Description:** Private section in each profile visible only to the individual coach for post-lesson notes and long-term planning

**Features:**
- Timestamped notes attached to specific lessons
- Private notes (not visible to parents)
- Rich text formatting (bold, bullets, etc.)
- Search/filter notes by date or keyword
- Export notes for athlete

**User Actions:**
- Write post-lesson note
- Edit past notes
- Search notes for specific athlete
- View note timeline

**MVP Status:** ✅ Core MVP Feature

---

### B. Scheduling and Calendar Features

#### B1. Coach-Driven Booking
**Description:** The coach views the client's submitted availability and books a lesson time directly. The coach is always in control of the schedule.

**Core Workflow:**
1. Coach views athlete's submitted availability
2. Coach selects a time slot from available options
3. System books the lesson and sends confirmation
4. Lesson appears on coach's calendar

**Key Principle:** **Coach has full control**—parents cannot self-book; they only submit availability

**User Actions:**
- View client availability
- Select and book a lesson time
- Confirm or propose alternative time
- Bulk schedule recurring lessons

**MVP Status:** ✅ Core MVP Feature

---

#### B2. Lesson Calendar View
**Description:** A clear, mobile-friendly calendar displaying the coach's entire confirmed schedule

**Views:**
- **Day View:** Hour-by-hour schedule for single day
- **Week View:** Weekly overview with all lessons
- **Month View:** Monthly overview with lesson counts per day
- **List View:** Chronological list of upcoming lessons

**Features:**
- Color-coding by athlete or lesson type
- Tap lesson to view details
- Quick actions (cancel, reschedule, add note)
- Filter by athlete or date range

**User Actions:**
- Switch between calendar views
- Tap lesson to see details
- Navigate to different dates
- Export schedule (PDF, iCal)

**MVP Status:** ✅ Core MVP Feature

---

#### B3. Recurring Lesson Management
**Description:** Easy setup for standing weekly lessons that repeat without manual rebooking

**Features:**
- Create recurring lesson series (e.g., "Every Tuesday at 4pm")
- Define recurrence pattern (weekly, bi-weekly, specific days)
- Set end date or "ongoing"
- Bulk edit all future occurrences
- Skip individual occurrences (e.g., holiday weeks)
- Cancel entire series

**User Actions:**
- Create recurring lesson
- Edit recurrence pattern
- Skip single occurrence
- Cancel series
- Convert single lesson to recurring

**MVP Status:** 🔄 Post-MVP (Phase 2)

---

#### B4. External Calendar Sync
**Description:** One-way sync to external calendars (Google Calendar, Apple Calendar, Outlook). Once a lesson is scheduled in the app, it is automatically pushed to the coach's external calendar.

**Features:**
- One-way sync (app → external calendar)
- Real-time or near-real-time updates
- Include lesson details in calendar event (athlete name, location, notes)
- Update external event when lesson is modified
- Remove event when lesson is cancelled

**Integration:**
- Google Calendar API
- Apple Calendar (iCal format)
- Outlook/Microsoft 365

**User Actions:**
- Connect external calendar account
- Enable/disable sync
- Choose which calendar to sync to
- Disconnect calendar

**MVP Status:** 🔄 Post-MVP (Phase 3)

---

#### B5. Lesson Cancellation Rules
**Description:** Enforces cancellation policies to protect coach's time and revenue

**24-Hour Window Rule:**
- **Outside 24 hours:** Parents/clients CAN cancel via app
- **Within 24 hours:** Parents/clients CANNOT cancel via app
- **Late cancellation:** Must contact coach directly

**Cancellation Workflow (Outside 24 Hours):**
1. Parent requests cancellation via app
2. System checks if >24 hours before lesson
3. If yes, cancellation is approved automatically
4. Lesson is removed from schedule
5. Coach receives notification
6. Cancellation email sent to parent

**Cancellation Workflow (Within 24 Hours):**
1. Parent attempts cancellation via app
2. System blocks cancellation
3. Message displayed: "Please contact your coach directly for cancellations within 24 hours"
4. Parent must text/call coach

**User Actions (Coach):**
- Set cancellation policy (24-hour default)
- View cancellation history for client
- Manual override (forgive late cancellation)
- Block client cancellations entirely (require coach approval)

**MVP Status:** ✅ Core MVP Feature

---

#### B6. Late Cancellation Notification & Billing
**Description:** If a parent notifies the coach of a no-show within the 24-hour window, the lesson remains in the billing hours for the coach, and an SMS notification is sent.

**Features:**
- Coach can manually mark lesson as "late cancel" or "no-show"
- Lesson remains billable (not removed from invoice)
- Automatic SMS sent to coach about opening in schedule
- Option to mark as "forgiven" (not billed)

**Notification Content:**
> "Late cancellation: [Athlete Name] cancelled their [Day, Time] lesson. This slot is still billable and may be filled with another student."

**User Actions (Coach):**
- Mark lesson as late cancel/no-show
- Choose to bill or forgive
- Attempt to fill slot with another student
- Add note explaining cancellation

**MVP Status:** ✅ Core MVP Feature

---

### C. Communication and Notifications

#### C1. SMS Lesson Reminders
**Description:** The system sends automatic SMS reminders to clients/parents about their upcoming lessons **from Shift's dedicated number**, keeping these transactional messages separate from personal parent-coach communication.

**Key Benefit:** Parents and coaches can still text each other personally about athlete progress, coaching strategy, and questions WITHOUT those conversations being cluttered by automated lesson reminders.

**Reminder Schedule:**
- **Weekly summary:** Sent every Sunday evening with upcoming week's lessons
- **24-hour reminder:** Sent 24 hours before each lesson (optional)

**SMS Content (Weekly):**
> "Hi [Parent Name], here are [Athlete Name]'s lessons this week with Coach [Name]:
> - Monday 4:00pm
> - Thursday 3:30pm
> Reply STOP to unsubscribe. -Shift"

**SMS Content (24-Hour):**
> "[Athlete Name] has a lesson tomorrow at [Time] with Coach [Name]. See you at the rink! -Shift"

**Features:**
- Customizable reminder timing
- Opt-out support (STOP keyword)
- Coach can customize message template
- Include lesson location/rink name

**User Actions (Coach):**
- Enable/disable automated reminders
- Customize reminder message
- Set reminder timing (how many hours before)
- View SMS delivery status

**MVP Status:** 🔄 Post-MVP (Phase 2 - SMS integration required)

---

#### C2. Dedicated SMS Number
**Description:** All automated reminders (lessons, invoices, cancellations) are sent from Shift's dedicated virtual phone number, **completely separate from the coach's personal phone**.

**The Core Value:**
- **Parents and coaches STILL text each other personally** about athlete progress, coaching questions, and important updates
- **Automated transactional messages come from Shift**, not the coach's personal number
- This separation keeps personal text threads focused on **meaningful coaching conversations**, not cluttered with administrative reminders

**Features:**
- Virtual phone number assigned to coach account
- Area code matches coach's location (if possible)
- Number displayed as "Shift" or "[Coach Name] via Shift" in SMS apps
- Two-way SMS support (parents can reply, coach sees in Shift inbox)
- SMS inbox within app to view/respond to messages

**Benefits:**
- **Preserves parent-coach relationship** by keeping transactional messages separate
- Parents can text coach directly for coaching conversations
- Coach's personal texts remain focused on relational communication
- Professional appearance for business messages
- Can be "turned off" during off-hours

**Integration:**
- Twilio API for SMS delivery and virtual numbers

**User Actions (Coach):**
- View assigned virtual number
- Set display name for SMS
- Enable/disable two-way SMS
- Set auto-reply for off-hours
- View SMS inbox and respond

**MVP Status:** 🔄 Post-MVP (Phase 2 - SMS integration required)

---

### D. Lesson Planning and Tracking

#### D1. Lesson Plan Creation (Optional)
**Description:** An optional tool allowing the coach to create and save detailed lesson plans for an upcoming session

**Features:**
- Pre-lesson planning template
- Sections for: warm-up, skills to work on, drills, cool-down
- Attach lesson plan to scheduled lesson
- Copy from previous lesson plan
- Save as template for future use

**User Actions:**
- Create lesson plan before lesson
- Attach plan to scheduled lesson
- Copy plan from previous lesson
- Save plan as reusable template
- View lesson plan during session

**MVP Status:** 🔄 Post-MVP (Phase 3 - Nice-to-have)

---

#### D2. Post-Lesson Notes
**Description:** A dedicated space attached to the lesson for the coach to write notes on how the lesson went and what was accomplished

**Features:**
- Quick note entry immediately after lesson
- Pre-filled fields: What we worked on, Progress made, Next lesson focus
- Voice-to-text support (for on-the-go notes)
- Attach to athlete profile for history
- Private (coach-only) or shareable (parent can view)

**User Actions:**
- Write post-lesson note
- Use voice-to-text for quick entry
- Mark note as private or shareable
- Edit past notes
- View note timeline for athlete

**MVP Status:** ✅ Core MVP Feature

---

#### D3. Customizable Lesson Templates
**Description:** The coach can create and save their own lesson structures for fast, repeatable assignment

**Features:**
- Create named templates (e.g., "Beginner Warmup", "Jump Technique", "Test Prep")
- Pre-populated sections with common drills/skills
- Quick-apply template to lesson plan
- Edit and update templates
- Share templates with other coaches (team model)

**User Actions:**
- Create new template
- Edit existing template
- Apply template to lesson plan
- Delete unused template
- View all saved templates

**MVP Status:** 🔄 Post-MVP (Phase 3 - Nice-to-have)

---

### E. Financial and Administrative

#### E1. Invoice Generation Scheduling
**Description:** Automated generation and sending of invoices with flexible scheduling: coaches can choose to send them out weekly, bi-weekly, or monthly

**Features:**
- Automated invoice creation based on logged lessons
- Flexible billing cycles:
  - Weekly (every Friday)
  - Bi-weekly (every other Friday)
  - Monthly (last day of month)
- Itemized invoice with:
  - Date and time of each lesson
  - Hourly rate
  - Total hours
  - Total amount due
  - Previous balance (if outstanding)
- PDF generation
- Automatic email delivery
- Track invoice status (sent, viewed, paid)

**Invoice Workflow:**
1. System automatically calculates billable hours for period
2. Generates PDF invoice
3. Sends via email to parent
4. Tracks when email is opened
5. Updates when payment is received

**User Actions (Coach):**
- Set billing cycle preference
- Customize invoice template (logo, business name)
- Preview invoice before sending
- Manually send invoice outside of schedule
- Resend invoice
- Mark invoice as paid manually

**MVP Status:** ✅ Core MVP Feature

---

#### E2. Secure Payment Link Options
**Description:** The invoice includes the option to embed a secure payment link (Stripe/Square) for credit card payments or a direct payment link (Venmo) for peer-to-peer transfers

**Payment Options:**
- **Stripe Integration (Credit Card)**
  - "Pay with Card" button in invoice
  - Redirects to secure Stripe checkout
  - Automatic payment confirmation
  - Webhook updates invoice status
- **Venmo Direct Link**
  - "Pay with Venmo" button in invoice
  - Opens Venmo app with amount pre-filled
  - Coach marks as paid manually after receiving
- **Zelle Instructions**
  - Include Zelle email/phone in invoice
  - Manual payment confirmation

**User Actions (Coach):**
- Connect Stripe account
- Add Venmo username
- Add Zelle information
- Choose which payment options to include in invoice
- View payment transaction history

**MVP Status:** ✅ Core MVP Feature (Stripe priority)

---

#### E3. Tracking Outstanding Payments
**Description:** Tracks which invoices have been paid and which are overdue

**Features:**
- Dashboard showing:
  - Total outstanding balance (across all clients)
  - Number of overdue invoices
  - Clients with unpaid invoices
- **Invoice Status:**
  - Sent (gray)
  - Viewed (blue)
  - Paid (green)
  - Overdue (red)
- Automatic reminders for overdue invoices
- Aging report (30, 60, 90+ days overdue)
- Payment history per client

**User Actions (Coach):**
- View outstanding payments dashboard
- Filter by overdue, paid, pending
- Send payment reminder email
- Mark invoice as paid manually
- Add note to invoice (e.g., "Payment plan agreed")
- View payment history for client

**MVP Status:** ✅ Core MVP Feature

---

## II. Coaching Team Functionality

> **Target User:** Head Coach coordinating 3-4 specialty coaches and 40-50 students
> **Primary Goal:** Centralized scheduling, team collaboration, and automated billing for entire team

---

### A. Coach and Athlete Management

#### A1. Athlete Profiles (Shared Access)
**Description:** A single, comprehensive digital file for each athlete, accessible to their assigned coaches

**Shared Fields:**
- All fields from Individual Coach model (contact, billing, availability)
- **Team-Specific Fields:**
  - Assigned coaches (primary + specialty)
  - Team/competition level
  - Parent communication preferences
  - Billing responsible party (if different from parent)

**Access Control:**
- Primary coach: Full read/write access
- Assigned specialty coaches: Read access + ability to add notes
- Other coaches: No access (privacy)

**User Actions:**
- View shared athlete profile
- Add collaborative notes
- View notes from other coaches
- Update athlete progress (if assigned)

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### A2. Role-Based Access Control (RBAC)
**Description:** Permissions are defined by user role (Head Coach has administrative control, Secondary Coach only sees their assigned athletes/schedules)

**User Roles:**

| Role | Permissions |
|------|-------------|
| **Head Coach / Organizational Manager** | - Full access to all athletes, schedules, and finances<br>- Can create/edit/delete coaches<br>- Can assign coaches to athletes<br>- Can view all coach schedules<br>- Can generate team reports<br>- Can manage team billing |
| **Secondary Coach / Specialty Coach** | - Can only view assigned athletes<br>- Can only see their own schedule<br>- Can add notes to assigned athletes<br>- Can log their own lessons<br>- Can view their own earnings<br>- Cannot see other coaches' schedules |
| **Parent/Client** | - Can only view their own child's schedule<br>- Can submit availability<br>- Can view invoices and payment history<br>- Cannot see other athletes or coaches |

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### A3. Secondary Coach Availability Input
**Description:** Secondary Coaches input their available lesson times into the system for Organizational Managers to view when scheduling

**Features:**
- Coaches can set:
  - Weekly recurring availability (e.g., "Available Tuesdays 4-7pm")
  - One-time availability blocks
  - Blackout dates (vacations, conflicts)
- Organizational Manager sees consolidated view of all coach availability
- System suggests optimal coach assignments based on availability overlap

**User Actions (Secondary Coach):**
- Set weekly availability
- Block out specific dates
- Update availability as needed
- View own availability calendar

**User Actions (Head Coach):**
- View all coaches' availability in one view
- Filter by day/time
- Assign lessons based on availability
- Request availability updates from coaches

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### A4. Coach Handoff/Progress Notes
**Description:** A collaborative tool for seamless communication between coaches working with the same athlete

**Structure:**
Two separate note sections per lesson:

**Primary Coach Section:**
- "What to work on next"
- "Focus areas for specialty coach"
- "Current challenges"

**Secondary Coach Section:**
- "What we worked on today"
- "Progress made"
- "Recommendations for next lesson"

**Features:**
- Both coaches can see both sections (read-only after submission)
- Timestamped and attributed to coach
- Visible in athlete profile timeline
- Searchable by keyword

**Use Case Example:**
1. Primary coach works with athlete on jumps, notes "needs help with double salchow entry"
2. Jump specialist (secondary coach) sees note before their lesson
3. Jump specialist works on salchow entry, notes "improved entry speed, ready to progress to double"
4. Primary coach sees update and adjusts lesson plan accordingly

**User Actions:**
- Write primary coach note
- Write secondary coach note
- View handoff note timeline
- Search notes by coach or keyword

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

### B. Scheduling and Calendar Features (Team)

#### B1. Coach-Driven Booking (Team Model)
**Description:** The Organizational Manager schedules lessons by viewing the athlete's availability and assigning an available coach based on their submitted schedule

**Workflow:**
1. Organizational Manager views athlete's submitted availability
2. System shows which coaches are available during those time slots
3. Manager assigns specific coach to lesson
4. System books lesson and notifies coach and parent
5. Lesson appears on coach's individual calendar

**Key Principle:** **Centralized control**—Head Coach makes all scheduling decisions for team

**User Actions (Head Coach):**
- View athlete availability
- See which coaches are available
- Assign coach to lesson
- Bulk schedule recurring lessons for team
- Reassign lesson to different coach

**User Actions (Secondary Coach):**
- View assigned lessons on own calendar
- Request schedule changes from Head Coach
- Mark availability

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### B2. Team Calendar View
**Description:** A centralized multi-calendar with strict, role-based visibility

**Views by Role:**

**Organizational Manager:**
- Can see:
  - All coaches' schedules (color-coded by coach)
  - All club ice reservations
  - All team lessons
  - Athlete availability
- Can switch between:
  - Master team calendar (all coaches overlaid)
  - Individual coach calendars
  - Athlete-specific schedules

**Secondary Coach:**
- Can see:
  - Only their own schedule
  - Their assigned lessons
  - Their earnings/billable hours
- Cannot see:
  - Other coaches' schedules
  - Team financial information

**Parent/Client:**
- Can see:
  - Only their student's schedule
  - Their assigned coach for each lesson
- Cannot see:
  - Other athletes' schedules
  - Coach availability or other lessons

**User Actions:**
- Switch between calendar views (based on role)
- Filter by coach, athlete, or date range
- Export calendar (PDF, iCal)

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### B3. External Calendar Sync (Team)
**Description:** One-way sync to external calendars for all coaches on the team

**Features:**
- Each coach can connect their own external calendar
- Only syncs their assigned lessons
- Head Coach can sync master team calendar
- Real-time updates when lessons are assigned/changed

**MVP Status:** 🔄 Post-MVP (Phase 5)

---

#### B4. Lesson Cancellation Rules & Billing (Team)
**Description:** Identical 24-hour window enforcement as Individual Coach model. Late cancellation notification is sent to the assigned coach, and the lesson is still billed.

**Team-Specific Considerations:**
- Cancellation notification goes to assigned coach
- Head Coach also notified of late cancellations
- Reassignment workflow: Head Coach can reassign cancelled slot to different coach
- Lesson remains billable to team (revenue protection)

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

### C. Communication and Notifications (Team)

#### C1. SMS Lesson Reminders (Team)
**Description:** The system sends automatic weekly SMS reminders to parents about their student's lesson times

**Team-Specific Features:**
- SMS sent from team's dedicated virtual number (not individual coach's number)
- Includes which coach they're working with
- Branded as team name (e.g., "Elite Skating Team")

**SMS Content:**
> "Hi [Parent Name], here are [Athlete Name]'s lessons this week:
> - Monday 4:00pm with Coach Sarah
> - Thursday 3:30pm with Coach Mike
> Reply STOP to unsubscribe. -Elite Skating Team"

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### C2. Dedicated SMS Number (Team)
**Description:** All notifications are sent from a non-personal, dedicated virtual phone number representing the team/club

**Team-Specific Features:**
- Single virtual number for entire team
- Display name is team/club name
- Two-way SMS goes to Head Coach inbox
- Head Coach can route messages to specific coaches
- Professional team branding

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

### D. Financial and Administrative (Team)

#### D1. Centralized Invoicing & Collection
**Description:** Manages all client billing for the entire team/club

**Features:**
- Head Coach controls all invoicing
- Invoices include lessons from multiple coaches
- Itemized breakdown by coach and date
- Team branding on invoices
- Centralized payment collection

**Invoice Structure:**
```
Elite Skating Team
Invoice #12345 - January 2025

Athlete: Sarah Johnson

Lessons with Coach Mike (Primary):
- 1/5/25, 4:00pm - 1 hour - $75
- 1/8/25, 4:00pm - 1 hour - $75

Lessons with Coach Lisa (Jump Specialist):
- 1/6/25, 5:00pm - 0.5 hours - $40

Total Hours: 2.5
Total Amount: $190.00
```

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### D2. Invoice Generation Scheduling (Team)
**Description:** Automated generation and sending of invoices with flexible scheduling (weekly, bi-weekly, or monthly)

**Team-Specific Features:**
- Single invoice per athlete (even if multiple coaches)
- Head Coach approves invoices before sending
- Bulk invoice generation for all athletes
- Track team-wide outstanding balances

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### D3. Secure Payment Link Options (Team)
**Description:** Invoices include links for both integrated credit card payment (Stripe) and direct Venmo payment

**Team-Specific Features:**
- Payments go to team/club Stripe account
- Head Coach manages payment processing
- Payment distribution to coaches handled separately (see Payout Calculation)

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### D4. Payout Calculation
**Description:** System for calculating the amount owed to each secondary coach based on logged lessons and pre-set coaching rates (for internal payroll)

**Features:**
- Track each coach's billable hours
- Apply coach-specific hourly rates
- Calculate total payout per coach
- Generate payout reports (bi-weekly, monthly)
- Track when coaches have been paid
- Handle different compensation models:
  - Hourly rate
  - Percentage split
  - Flat rate per lesson

**Payout Report Example:**
```
Coach Mike - January 2025 Payout

Total Lessons: 45
Total Hours: 45
Rate: $50/hour
Gross Earnings: $2,250

Status: Paid on 2/1/25 via Venmo
```

**User Actions (Head Coach):**
- Set coach compensation rates
- Generate payout report
- Mark coach as paid
- Export payout history
- Adjust payout for special circumstances

**User Actions (Secondary Coach):**
- View own earnings dashboard
- See breakdown of lessons and hours
- View payment history
- Export earnings for taxes

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

#### D5. Tracking Outstanding Payments (Team)
**Description:** Tracks payment status across the entire roster

**Team-Specific Features:**
- Team-wide outstanding balance dashboard
- Payment tracking per athlete
- Automatic payment reminders (sent from Head Coach)
- Aging reports for overdue invoices
- Flag high-risk accounts (multiple missed payments)

**Dashboard Metrics:**
- Total team revenue (month/year)
- Total outstanding balance
- Number of overdue invoices
- Payment collection rate
- Average days to payment

**MVP Status:** 🔄 Post-MVP (Phase 4 - Team Model)

---

## Feature Priority Matrix

| Feature | Individual Coach | Team Model | MVP Priority | Phase |
|---------|------------------|------------|--------------|-------|
| Athlete Profiles (Basic) | ✅ | ✅ | HIGH | 1 |
| Coach-Driven Scheduling | ✅ | ✅ | HIGH | 1 |
| Lesson Calendar View | ✅ | ✅ | HIGH | 1 |
| Post-Lesson Notes | ✅ | ✅ | HIGH | 1 |
| Cancellation Rules (24hr) | ✅ | ✅ | HIGH | 1 |
| Invoice Generation | ✅ | ✅ | HIGH | 1 |
| Stripe Payment Integration | ✅ | ✅ | HIGH | 1 |
| Outstanding Payment Tracking | ✅ | ✅ | HIGH | 1 |
| Recurring Lessons | ✅ | ✅ | MEDIUM | 2 |
| SMS Reminders | ✅ | ✅ | MEDIUM | 2 |
| Dedicated SMS Number | ✅ | ✅ | MEDIUM | 2 |
| Goal Tracking | ✅ | ✅ | LOW | 3 |
| Lesson Plan Creation | ✅ | ✅ | LOW | 3 |
| Lesson Templates | ✅ | ✅ | LOW | 3 |
| External Calendar Sync | ✅ | ✅ | LOW | 3 |
| Team RBAC | ❌ | ✅ | MEDIUM | 4 |
| Coach Availability Input | ❌ | ✅ | MEDIUM | 4 |
| Coach Handoff Notes | ❌ | ✅ | MEDIUM | 4 |
| Team Calendar View | ❌ | ✅ | MEDIUM | 4 |
| Payout Calculation | ❌ | ✅ | MEDIUM | 4 |
| Centralized Team Billing | ❌ | ✅ | MEDIUM | 4 |

---

## Related Documents
- [Product Overview](./01-product-overview.md)
- [Customer Personas](./02-customer-personas.md)
- [MVP Requirements](./04-mvp-requirements.md)
- [Technical Architecture](./05-technical-architecture.md)
