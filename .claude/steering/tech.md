# Technical Steering Document: Shift

**Last Updated:** 2025-10-24
**Version:** 1.0
**Status:** Active Development

---

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 14+ (App Router) | Full-stack React framework with server components |
| **Language** | TypeScript 5+ | Type safety and better developer experience |
| **Styling** | Tailwind CSS 3.4+ | Utility-first, mobile-first CSS framework |
| **Database** | Supabase (PostgreSQL) | Managed database with auth and RLS |
| **Authentication** | Supabase Auth | Secure email/password authentication |
| **Subscription Billing** | Stripe | Coach subscription payments (SaaS model) |
| **Email** | Resend or SendGrid | Transactional email delivery |
| **Deployment** | Vercel | Next.js hosting with edge functions |
| **Version Control** | Git + GitHub | Code collaboration and CI/CD |

---

## External Integrations

### Stripe (Subscription Billing ONLY)

**Purpose:** Process coach subscription payments for Shift platform access

**Use Cases:**
- ✅ Coach trial-to-paid subscription conversion
- ✅ Monthly recurring billing for Individual Coach Plan
- ✅ Monthly recurring billing for Team Plan (future)
- ✅ Subscription management (upgrades, downgrades, cancellations)
- ✅ Payment method storage and updates

**NOT Used For:**
- ❌ Client-to-coach lesson payments (handled via P2P links like Venmo)
- ❌ Invoice payment processing
- ❌ Any athlete/parent-facing payments

**Implementation Details:**
- **Stripe Checkout:** Hosted payment page for subscription signup
- **Stripe Customer Portal:** Self-service subscription management
- **Webhooks:** Automated subscription status updates
- **Price IDs:** Configured in Stripe Dashboard for each plan tier

**Key API Endpoints:**
- `POST /api/stripe/create-checkout-session` - Initiate subscription checkout
- `POST /api/webhooks/stripe` - Handle Stripe webhook events (subscription created, updated, cancelled)

**Environment Variables:**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

### Client-to-Coach Payments (P2P Links)

**Purpose:** Allow clients to pay coaches directly for lessons and services

**Method:** Peer-to-peer (P2P) payment links (Venmo, Zelle, PayPal, etc.)

**How It Works:**
1. Coach stores their Venmo link (or other P2P link) in their Shift profile settings
2. When coach generates an invoice in Shift, the invoice includes their P2P payment link
3. Invoice is sent to client via email with embedded payment link
4. Client clicks link → redirected to Venmo/Zelle → pays coach directly
5. Coach manually marks invoice as "paid" in Shift after receiving payment

**Why P2P Instead of Stripe:**
- No payment processing fees (coaches keep 100% of lesson payments)
- Simpler compliance and legal requirements
- Leverages existing P2P payment adoption
- Reduces platform liability for financial disputes
- Shift focuses on management/automation, not payment processing

**Database Storage:**
```sql
-- In profiles or users table
venmo_link TEXT; -- Example: "https://venmo.com/coach-brittlyn"
zelle_email TEXT; -- Example: "coach@example.com"
paypal_link TEXT; -- Example: "https://paypal.me/coachbrittlyn"
preferred_payment_method TEXT; -- "venmo", "zelle", "paypal"
```

**Invoice Email Template:**
```
Your invoice for $150.00 is ready!

Athlete: Sarah Johnson
Billing Period: Oct 1-15, 2025
Total Hours: 3.0 hours @ $50.00/hr

Total Due: $150.00

Pay Now: [Venmo Link Button]

Once payment is sent, please reply to this email with confirmation.
```

---

### Supabase (Database + Authentication)

**Purpose:** Managed PostgreSQL database with built-in authentication and Row Level Security

**Use Cases:**
- User authentication (coach signup, login, password reset)
- Database storage for all application data
- Real-time subscriptions (future: live calendar updates)
- Row Level Security (RLS) policies to ensure data isolation

**Tables:**
- `auth.users` - Managed by Supabase Auth
- `profiles` - Coach profile data (links to auth.users, stores subscription status)
- `clients` - Athlete/client roster
- `lessons` - Scheduled and completed lessons
- `invoices` - Generated invoices with payment tracking
- `invoice_line_items` - Line items for each invoice

**Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only
```

---

### Email Service (Resend or SendGrid)

**Purpose:** Send transactional emails to coaches and clients

**Use Cases:**
- Invoice delivery to clients (with P2P payment link)
- Lesson reminders to clients (automated SMS alternative for email)
- Subscription confirmation and billing receipts to coaches
- Trial ending reminders to coaches
- Password reset emails

**Email Templates:**
1. **Invoice Email** (to clients)
   - Invoice details with breakdown
   - Total amount due
   - Payment link (Venmo/Zelle)
   - Due date reminder

2. **Subscription Confirmation** (to coaches)
   - Welcome message after subscription
   - Billing details and next payment date
   - Link to customer portal

3. **Trial Ending Reminder** (to coaches)
   - Sent 30 days before trial ends
   - Sent 7 days before trial ends
   - Instructions to subscribe

**Environment Variables:**
```bash
RESEND_API_KEY=re_xxx # Server-side only
# OR
SENDGRID_API_KEY=SG.xxx # Server-side only
```

---

## Data Flow Architecture

### Subscription Flow (Coach Billing)

```
1. Coach completes 180-day trial
   └─> Shift triggers "trial ending" email reminder
       └─> Email includes "Subscribe Now" button

2. Coach clicks "Subscribe Now"
   └─> Client Component calls Server Action: createCheckoutSession()
       └─> Server Action creates Stripe Checkout Session
           └─> Returns session URL to client
               └─> Client redirects to Stripe Checkout

3. Coach enters payment details on Stripe Checkout
   └─> Stripe processes payment
       └─> On success: Stripe redirects to /dashboard?status=success
           └─> Stripe fires webhook: checkout.session.completed

4. Webhook received at /api/webhooks/stripe
   └─> Verifies webhook signature
       └─> Extracts customer_id and subscription_id
           └─> Updates profiles table:
               - stripe_customer_id
               - subscription_status = 'active'
               - trial_ends_at = NULL
           └─> Sends confirmation email to coach

5. Monthly recurring billing
   └─> Stripe automatically charges coach each month
       └─> On success: Webhook updates subscription_status
       └─> On failure: Webhook updates subscription_status = 'past_due'
           └─> Sends payment failure email to coach
```

---

### Client Payment Flow (Lesson Billing)

```
1. Coach logs lessons in Shift calendar
   └─> Marks lessons as "completed"

2. Coach generates invoice
   └─> Server Action creates invoice in database
       └─> Invoice includes:
           - Line items (lesson date, hours, rate)
           - Total amount due
           - Coach's Venmo link (from profile)
       └─> Invoice status: 'draft'

3. Coach sends invoice to client
   └─> Server Action triggers email via Resend/SendGrid
       └─> Email template includes:
           - Invoice details (PDF or HTML)
           - "Pay Now" button with Venmo link
       └─> Invoice status updated to: 'sent'

4. Client receives email
   └─> Clicks "Pay Now" button
       └─> Redirected to Venmo app/website
           └─> Client sends payment directly to coach via Venmo

5. Coach receives Venmo payment notification
   └─> Coach marks invoice as "paid" in Shift manually
       └─> Invoice status updated to: 'paid'
       └─> Payment date recorded
```

**IMPORTANT:** Shift does NOT process client-to-coach payments. All lesson payments are direct P2P transactions outside of Shift.

---

## Security Architecture

### Authentication & Authorization

**Supabase Auth:**
- Email/password authentication with secure password hashing
- Session cookies managed by Supabase (httpOnly, secure)
- Middleware refreshes session on every page load
- Protected routes redirect unauthenticated users to /login

**Row Level Security (RLS):**
- All database tables use RLS policies
- Coaches can only access their own data
- Enforced at database level (cannot be bypassed)

---

### Subscription Security

**Stripe Checkout:**
- PCI-compliant payment processing (Stripe handles card data)
- No credit card data stored in Shift database
- Stripe Customer Portal for self-service subscription management

**Webhook Security:**
- Webhook signature verification required (STRIPE_WEBHOOK_SECRET)
- Prevents unauthorized webhook spoofing
- Server-side validation of all webhook events

---

### Environment Variable Security

**Client-Safe Variables (NEXT_PUBLIC_*):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

**Server-Only Variables (NEVER expose to client):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` or `SENDGRID_API_KEY`

---

## Deployment Configuration

### Vercel Environment Variables

**Production:**
- All environment variables configured in Vercel Dashboard
- Separate Stripe keys for production (live mode)
- Production webhook endpoint: `https://app.shift.com/api/webhooks/stripe`

**Staging:**
- Separate Supabase project for staging environment
- Stripe test mode keys
- Staging webhook endpoint: `https://staging.shift.com/api/webhooks/stripe`

**Local Development:**
- `.env.local` file (never committed to Git)
- Stripe test mode keys
- Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## Monitoring & Analytics

### Subscription Metrics (Stripe Dashboard)

- Monthly Recurring Revenue (MRR)
- Trial conversion rate
- Churn rate
- Failed payment recovery rate

### Application Metrics (Vercel Analytics)

- Page load times
- API endpoint performance
- Error rates and stack traces

### Database Metrics (Supabase Dashboard)

- Query performance
- Connection pool usage
- RLS policy performance
- Storage usage

---

## Future Integrations (Out of Scope for MVP)

- **Twilio (SMS):** Automated lesson reminders via SMS
- **Google Calendar API:** Two-way calendar sync
- **QuickBooks API:** Accounting integration for invoices
- **Zapier:** Custom automation workflows
- **Mobile Push Notifications:** Native app reminders

---

## Related Documents

- [Product Steering Document](./product.md)
- [Database Schema](./db-schema.md)
- [PRD: Technical Architecture](../prd/05-technical-architecture.md)
