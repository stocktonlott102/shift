# Shift Application - Architecture Diagrams

**Date:** November 21, 2025
**Purpose:** Visual representation of complete application architecture
**For:** Technical interviews, documentation, and onboarding

---

## Table of Contents
1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Detailed Application Architecture](#2-detailed-application-architecture)
3. [Authentication Flow](#3-authentication-flow)
4. [Payment Flow (Stripe Integration)](#4-payment-flow-stripe-integration)
5. [Data Flow - Add Client](#5-data-flow---add-client)
6. [Database Schema & Relationships](#6-database-schema--relationships)
7. [Technology Stack](#7-technology-stack)
8. [Deployment Architecture](#8-deployment-architecture)

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Users"
        U1[Coach - Desktop Browser]
        U2[Coach - Mobile Browser]
    end

    subgraph "CDN & Edge Network"
        CF[Vercel Edge Network<br/>Global CDN]
    end

    subgraph "Application Layer - Vercel Serverless"
        direction TB
        MW[Middleware<br/>Session Refresh]
        SSR[Server Components<br/>Pages & Routes]
        SA[Server Actions<br/>Business Logic]
        API[API Routes<br/>Webhooks]
    end

    subgraph "External Services"
        direction TB
        SB[(Supabase<br/>PostgreSQL + Auth)]
        ST[Stripe<br/>Payment Processing]
        EM[Email Service<br/>Planned]
    end

    subgraph "Storage & Persistence"
        direction TB
        DB[(Database<br/>6 Tables)]
        AUTH[(Auth Users<br/>Supabase Auth)]
    end

    U1 -->|HTTPS| CF
    U2 -->|HTTPS| CF
    CF -->|Route Request| MW
    MW -->|Verify Session| SB
    MW --> SSR
    SSR -->|Data Fetch| SA
    SSR -->|Display| CF
    SA -->|CRUD Operations| SB
    SA -->|Subscription Mgmt| ST
    API -->|Process Webhooks| ST
    API -->|Update DB| SB
    SB --> DB
    SB --> AUTH
    ST -.->|Async Webhooks| API
    SA -.->|Future: Send Emails| EM

    style CF fill:#4A90E2
    style SB fill:#3ECF8E
    style ST fill:#635BFF
    style DB fill:#F39C12
    style AUTH fill:#E74C3C
```

---

## 2. Detailed Application Architecture

```mermaid
graph TB
    subgraph "Browser - Client Side"
        direction TB
        LP[Landing Page<br/>Marketing]
        LG[Login/Signup<br/>Authentication]
        DASH[Dashboard<br/>Overview]
        CLI[Clients Pages<br/>Roster Management]
        CAL[Calendar<br/>Lesson Scheduling]

        subgraph "Reusable Components"
            CF[ClientForm]
            BLF[BookLessonForm]
            CALW[Calendar Widget]
            SB[SubscribeButton]
        end
    end

    subgraph "Next.js Server - Vercel"
        direction TB

        subgraph "Middleware Layer"
            MW[middleware.ts<br/>Session Refresh]
        end

        subgraph "Server Components"
            DASHP[dashboard/page.tsx]
            CLIP[clients/page.tsx]
            CALP[calendar/page.tsx]
        end

        subgraph "Server Actions"
            CA[client-actions.ts<br/>CRUD Clients]
            LA[lesson-actions.ts<br/>Manage Lessons]
            STA[stripe-actions.ts<br/>Subscriptions]
        end

        subgraph "API Routes"
            WH[/api/webhooks/stripe<br/>Stripe Events]
        end
    end

    subgraph "Supabase - Backend Services"
        direction TB

        subgraph "Authentication"
            SBAUTH[Supabase Auth API<br/>Email/Password]
        end

        subgraph "Database - PostgreSQL"
            T1[(auth.users)]
            T2[(profiles)]
            T3[(clients)]
            T4[(lessons)]
            T5[(invoices)]
            T6[(invoice_line_items)]
        end

        subgraph "Security"
            RLS[Row Level Security<br/>Policies]
        end
    end

    subgraph "Stripe"
        CHECKOUT[Checkout Sessions<br/>Hosted Payment]
        PORTAL[Customer Portal<br/>Manage Subscription]
        WHSRV[Webhook Server<br/>Events]
    end

    %% User Interactions
    LP -->|Navigate| LG
    LG -->|Submit| SBAUTH
    SBAUTH -->|Session Cookie| DASH
    DASH -->|View| CLI
    CLI -->|Add Client| CF
    CF -->|Submit| CA

    %% Server Flow
    MW -->|Check Auth| SBAUTH
    DASHP -->|Fetch Data| CA
    CLIP -->|Fetch Data| CA
    CA -->|Query| T3
    CA -->|Filter| RLS

    %% Subscription Flow
    SB -->|Create Session| STA
    STA -->|API Call| CHECKOUT
    CHECKOUT -->|Redirect| DASH
    WHSRV -->|POST Event| WH
    WH -->|Update Status| T2

    %% Database Relationships
    T1 -.->|1:1| T2
    T2 -.->|1:many| T3
    T3 -.->|1:many| T4
    T3 -.->|1:many| T5
    T5 -.->|1:many| T6
    T4 -.->|1:1| T6

    style SBAUTH fill:#3ECF8E
    style CHECKOUT fill:#635BFF
    style RLS fill:#E74C3C
    style MW fill:#F39C12
```

---

## 3. Authentication Flow

```mermaid
sequenceDiagram
    actor User as Coach
    participant Browser
    participant LoginPage as Login Page<br/>(Client Component)
    participant SupabaseClient as Supabase Client<br/>(Browser)
    participant SupabaseAuth as Supabase Auth API
    participant AuthDB as auth.users<br/>Database
    participant Middleware
    participant Dashboard

    User->>Browser: Navigate to /login
    Browser->>LoginPage: Render login form
    LoginPage-->>User: Display form

    User->>LoginPage: Enter email & password
    User->>LoginPage: Click "Log In"

    LoginPage->>LoginPage: Validate input (client-side)
    LoginPage->>SupabaseClient: signInWithPassword(email, password)

    SupabaseClient->>SupabaseAuth: POST /auth/v1/token
    SupabaseAuth->>AuthDB: Query user by email
    AuthDB-->>SupabaseAuth: User record

    SupabaseAuth->>SupabaseAuth: Compare password hash (bcrypt)

    alt Password Valid
        SupabaseAuth->>SupabaseAuth: Generate JWT tokens<br/>(access_token + refresh_token)
        SupabaseAuth->>SupabaseAuth: Create session
        SupabaseAuth-->>SupabaseClient: Session data + tokens
        SupabaseClient->>Browser: Set cookies<br/>(sb-access-token, sb-refresh-token)
        SupabaseClient-->>LoginPage: Success
        LoginPage->>Browser: Navigate to /dashboard

        Browser->>Middleware: GET /dashboard
        Middleware->>Middleware: Read session cookie
        Middleware->>SupabaseAuth: Verify & refresh token
        SupabaseAuth-->>Middleware: Valid session
        Middleware->>Dashboard: Continue to page
        Dashboard->>Dashboard: Fetch user data
        Dashboard-->>User: Show dashboard
    else Password Invalid
        SupabaseAuth-->>SupabaseClient: Error: Invalid credentials
        SupabaseClient-->>LoginPage: Error
        LoginPage-->>User: Display error message
    end

    Note over User,Dashboard: Session valid for 1 hour<br/>Middleware refreshes on each request
```

---

## 4. Payment Flow (Stripe Integration)

```mermaid
sequenceDiagram
    actor User as Coach
    participant Dashboard
    participant SubscribeBtn as Subscribe Button
    participant ServerAction as stripe-actions.ts<br/>createCheckoutSession()
    participant Supabase as Supabase DB
    participant StripeAPI as Stripe API
    participant StripeCheckout as Stripe Checkout<br/>(External)
    participant StripeWebhook as Stripe Servers
    participant WebhookAPI as /api/webhooks/stripe
    participant ProfilesDB as profiles table

    User->>Dashboard: View trial banner
    Dashboard-->>User: Show "Subscribe" button
    User->>SubscribeBtn: Click "Subscribe Now"

    SubscribeBtn->>ServerAction: Call createCheckoutSession(priceId)

    rect rgb(200, 220, 240)
        Note over ServerAction,Supabase: Server-Side Verification
        ServerAction->>Supabase: Verify user authentication
        Supabase-->>ServerAction: User authenticated
        ServerAction->>Supabase: Fetch profile (check existing subscription)
        Supabase-->>ServerAction: Profile data
        ServerAction->>ServerAction: Verify not already subscribed
    end

    ServerAction->>StripeAPI: Create checkout session<br/>{customer_email, line_items, metadata}
    StripeAPI->>StripeAPI: Generate session ID
    StripeAPI-->>ServerAction: {id, url: "https://checkout.stripe.com/..."}
    ServerAction-->>SubscribeBtn: {success: true, sessionUrl}

    SubscribeBtn->>Browser: window.location.href = sessionUrl
    Browser->>StripeCheckout: Redirect to Stripe
    StripeCheckout-->>User: Show payment form

    User->>StripeCheckout: Enter credit card details
    User->>StripeCheckout: Click "Pay $10.00"

    StripeCheckout->>StripeCheckout: Validate card with bank
    StripeCheckout->>StripeCheckout: Create Customer & Subscription
    StripeCheckout->>StripeCheckout: Charge $10.00

    StripeCheckout->>Browser: Redirect to /dashboard?status=success
    Browser->>Dashboard: Navigate back
    Dashboard-->>User: Show "Processing..." message

    par Async Webhook (1-5 seconds later)
        StripeWebhook->>WebhookAPI: POST /api/webhooks/stripe<br/>Event: checkout.session.completed
        WebhookAPI->>WebhookAPI: Verify webhook signature
        WebhookAPI->>WebhookAPI: Parse event data
        WebhookAPI->>ProfilesDB: UPDATE profiles SET<br/>subscription_status='active',<br/>stripe_customer_id='cus_...',<br/>subscription_id='sub_...'
        ProfilesDB-->>WebhookAPI: Success
        WebhookAPI-->>StripeWebhook: 200 OK
    end

    User->>Dashboard: Refresh page
    Dashboard->>Supabase: Check subscription status
    Supabase-->>Dashboard: subscription_status='active'
    Dashboard-->>User: Show "Subscription Active!" banner

    Note over User,ProfilesDB: Webhooks may take 1-5 seconds<br/>Stripe retries for 72 hours if webhook fails
```

---

## 5. Data Flow - Add Client

```mermaid
sequenceDiagram
    actor User as Coach
    participant Browser
    participant ClientForm as ClientForm.tsx<br/>(Client Component)
    participant Validation as client-validation.ts
    participant ServerAction as client-actions.ts<br/>addClient()
    participant Supabase as Supabase Server Client
    participant RLS as Row Level Security
    participant ClientsDB as clients table
    participant Cache as Next.js Cache

    User->>Browser: Navigate to /clients/new
    Browser->>ClientForm: Render form
    ClientForm-->>User: Display empty form

    User->>ClientForm: Type athlete name
    User->>ClientForm: Type parent email
    User->>ClientForm: Type parent phone
    User->>ClientForm: Type hourly rate
    User->>ClientForm: Type notes (optional)
    User->>ClientForm: Click "Add Client"

    rect rgb(220, 240, 220)
        Note over ClientForm,Validation: Client-Side Validation
        ClientForm->>Validation: validateClientData(formData)
        Validation->>Validation: Check required fields
        Validation->>Validation: Validate email format
        Validation->>Validation: Check hourly rate > 0
        alt Validation Fails
            Validation-->>ClientForm: Errors array
            ClientForm-->>User: Show error message
        else Validation Passes
            Validation-->>ClientForm: No errors
        end
    end

    ClientForm->>ServerAction: await addClient(formData)

    rect rgb(240, 220, 220)
        Note over ServerAction,Supabase: Server-Side Security & Validation
        ServerAction->>Supabase: auth.getUser()
        Supabase-->>ServerAction: {user: {id: "uuid"}}

        alt Not Authenticated
            ServerAction-->>ClientForm: {success: false, error: "Not logged in"}
            ClientForm-->>User: Show error
        end

        ServerAction->>ServerAction: Verify coach_id === user.id

        alt Authorization Failed
            ServerAction-->>ClientForm: {success: false, error: "Unauthorized"}
            ClientForm-->>User: Show error
        end

        ServerAction->>Validation: validateClientData(formData)
        Validation-->>ServerAction: Validation result

        alt Validation Fails
            ServerAction-->>ClientForm: {success: false, error: "Invalid data"}
            ClientForm-->>User: Show error
        end
    end

    rect rgb(220, 220, 240)
        Note over ServerAction,ClientsDB: Database Insert with RLS
        ServerAction->>Supabase: INSERT INTO clients
        Supabase->>RLS: Check RLS policy
        RLS->>RLS: Verify auth.uid() = coach_id
        RLS-->>Supabase: Policy passed
        Supabase->>ClientsDB: INSERT row
        ClientsDB-->>Supabase: New client row
        Supabase-->>ServerAction: {data: client, error: null}
    end

    ServerAction->>Cache: revalidatePath('/clients')
    Cache->>Cache: Clear cached data

    ServerAction-->>ClientForm: {success: true, data: client}
    ClientForm->>ClientForm: Show success message
    ClientForm->>ClientForm: Reset form fields
    ClientForm-->>User: "Client created successfully!"

    opt Navigate to client list
        ClientForm->>Browser: Navigate to /clients
        Browser->>Browser: Fetch fresh data (cache cleared)
        Browser-->>User: Show updated client list
    end

    Note over User,ClientsDB: Total Time: ~300-500ms<br/>Security: 3 layers (client, server, database)
```

---

## 6. Database Schema & Relationships

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1"
    PROFILES ||--o{ CLIENTS : "1:many (coach has many clients)"
    PROFILES ||--o{ LESSONS : "1:many (coach has many lessons)"
    PROFILES ||--o{ INVOICES : "1:many (coach has many invoices)"
    CLIENTS ||--o{ LESSONS : "1:many (client has many lessons)"
    CLIENTS ||--o{ INVOICES : "1:many (client has many invoices)"
    INVOICES ||--o{ INVOICE_LINE_ITEMS : "1:many (invoice has many line items)"
    LESSONS ||--|| INVOICE_LINE_ITEMS : "1:1 (lesson billed once)"

    AUTH_USERS {
        uuid id PK "User ID"
        varchar email UK "Email address"
        varchar encrypted_password "Bcrypt hash"
        timestamp email_confirmed_at "Email verification"
        timestamp created_at "Account creation"
        timestamp last_sign_in_at "Last login"
    }

    PROFILES {
        uuid id PK,FK "References auth.users.id"
        varchar email "Cached email"
        varchar stripe_customer_id "Stripe customer (cus_...)"
        varchar subscription_id "Stripe subscription (sub_...)"
        varchar subscription_status "trial|active|canceled|past_due"
        timestamp trial_ends_at "Trial expiration (NULL if subscribed)"
        varchar venmo_link "Venmo profile URL"
        varchar zelle_link "Zelle email/phone"
        varchar preferred_payment_method "venmo|zelle"
        timestamp created_at "Profile creation"
        timestamp updated_at "Last update"
    }

    CLIENTS {
        uuid id PK "Client ID"
        uuid coach_id FK "References auth.users.id"
        varchar athlete_name "Skater name"
        varchar parent_email "Parent email (invoices)"
        varchar parent_phone "Parent phone (SMS)"
        numeric hourly_rate "Coach rate ($75.00)"
        text notes "Private coach notes"
        varchar status "active|archived (soft delete)"
        timestamp created_at "Client added date"
        timestamp updated_at "Last update"
    }

    LESSONS {
        uuid id PK "Lesson ID"
        uuid coach_id FK "References auth.users.id"
        uuid client_id FK "References clients.id"
        timestamp scheduled_at "Lesson date/time"
        integer duration_minutes "Length (30,45,60,90)"
        varchar status "scheduled|completed|canceled|no_show"
        text notes "Lesson notes"
        timestamp created_at "Scheduled date"
        timestamp updated_at "Last update"
    }

    INVOICES {
        uuid id PK "Invoice ID"
        uuid coach_id FK "References auth.users.id"
        uuid client_id FK "References clients.id"
        varchar invoice_number UK "INV-2025-001"
        numeric total_amount "Total ($300.00)"
        varchar status "draft|sent|paid|overdue"
        text payment_link "Venmo/Zelle deep link"
        timestamp sent_at "Email sent date"
        timestamp paid_at "Payment received date"
        timestamp due_at "Due date"
        timestamp created_at "Invoice created"
        timestamp updated_at "Last update"
    }

    INVOICE_LINE_ITEMS {
        uuid id PK "Line item ID"
        uuid invoice_id FK "References invoices.id"
        uuid lesson_id FK "References lessons.id (nullable)"
        text description "1-hour lesson on Nov 15"
        numeric quantity "Usually 1"
        numeric unit_price "Hourly rate ($75.00)"
        numeric total_price "quantity × unit_price"
        timestamp created_at "Line item added"
    }
```

---

## 7. Technology Stack

```mermaid
graph TB
    subgraph "Frontend - Browser"
        direction LR
        F1[React 19.0.0<br/>UI Library]
        F2[TypeScript 5.x<br/>Type Safety]
        F3[Tailwind CSS 3.4.1<br/>Styling]
        F4[date-fns 4.1.0<br/>Date Utilities]
    end

    subgraph "Framework - Next.js 15.1.6"
        direction LR
        N1[App Router<br/>File-based Routing]
        N2[Server Components<br/>SSR]
        N3[Server Actions<br/>Backend Functions]
        N4[Middleware<br/>Session Refresh]
    end

    subgraph "Backend Services"
        direction LR
        B1[Supabase 2.45.7<br/>PostgreSQL + Auth]
        B2[Stripe 19.1.0<br/>Payments]
        B3[Supabase SSR 0.5.2<br/>Session Management]
    end

    subgraph "Development Tools"
        direction LR
        D1[Jest 30.2.0<br/>Testing]
        D2[React Testing Library<br/>Component Tests]
        D3[ESLint 9.x<br/>Linting]
        D4[PostCSS + Autoprefixer<br/>CSS Processing]
    end

    subgraph "Infrastructure"
        direction LR
        I1[Vercel<br/>Serverless Hosting]
        I2[Vercel Edge<br/>CDN]
        I3[Supabase Cloud<br/>Database Hosting]
    end

    F1 & F2 & F3 & F4 --> N1
    N1 & N2 & N3 & N4 --> B1
    N3 --> B2
    N4 --> B3
    D1 & D2 & D3 & D4 -.->|Dev Only| N1
    N1 --> I1
    I1 --> I2
    B1 --> I3

    style F1 fill:#61DAFB
    style N1 fill:#000000,color:#FFFFFF
    style B1 fill:#3ECF8E
    style B2 fill:#635BFF
    style I1 fill:#000000,color:#FFFFFF
```

---

## 8. Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV[Developer<br/>Local Machine]
        GIT[Git Repository<br/>GitHub]
    end

    subgraph "CI/CD Pipeline"
        direction TB
        VB[Vercel Build<br/>next build]
        VT[Vercel Tests<br/>npm test]
        VD[Vercel Deploy<br/>Serverless Functions]
    end

    subgraph "Production - Vercel Edge"
        direction TB
        EDGE1[Edge Location<br/>US East]
        EDGE2[Edge Location<br/>US West]
        EDGE3[Edge Location<br/>Europe]
        LB[Load Balancer<br/>Automatic]
    end

    subgraph "Vercel Serverless"
        direction TB
        SF1[Function Instance 1<br/>Middleware + Pages]
        SF2[Function Instance 2<br/>Server Actions]
        SF3[Function Instance N<br/>Auto-scaled]
    end

    subgraph "Supabase Cloud"
        direction TB
        SBPRI[Primary Database<br/>PostgreSQL]
        SBREP[Read Replicas<br/>Future]
        SBBACK[Automated Backups<br/>Every 6 hours]
    end

    subgraph "Stripe"
        STAPI[Stripe API<br/>Payment Processing]
        STWH[Stripe Webhooks<br/>Event Delivery]
    end

    DEV -->|git push| GIT
    GIT -->|Trigger Deploy| VB
    VB --> VT
    VT -->|Build Success| VD
    VD --> LB

    LB --> EDGE1
    LB --> EDGE2
    LB --> EDGE3

    EDGE1 --> SF1
    EDGE2 --> SF2
    EDGE3 --> SF3

    SF1 & SF2 & SF3 --> SBPRI
    SBPRI -.->|Replicate| SBREP
    SBPRI -.->|Backup| SBBACK

    SF2 --> STAPI
    STWH -.->|Async| SF2

    style GIT fill:#181717,color:#FFFFFF
    style VD fill:#000000,color:#FFFFFF
    style SBPRI fill:#3ECF8E
    style STAPI fill:#635BFF
```

---

## Comprehensive System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        USER[User Browser]
    end

    subgraph "Edge Layer - CDN"
        CDN[Vercel Edge Network<br/>Static Assets + SSR]
    end

    subgraph "Application Layer - Next.js"
        direction TB
        MW[Middleware<br/>Session Check]

        subgraph "Presentation"
            PAGES[Server Components<br/>Pages]
            COMPS[Client Components<br/>Interactive UI]
        end

        subgraph "Business Logic"
            SA[Server Actions<br/>CRUD Operations]
            API[API Routes<br/>Webhooks]
        end
    end

    subgraph "Data Layer"
        direction TB
        SUPABASE[(Supabase<br/>PostgreSQL)]

        subgraph "Tables"
            T1[(auth.users)]
            T2[(profiles)]
            T3[(clients)]
            T4[(lessons)]
            T5[(invoices)]
            T6[(invoice_line_items)]
        end
    end

    subgraph "External Services"
        STRIPE[Stripe<br/>Payments]
        EMAIL[Email Service<br/>Planned]
    end

    subgraph "Security Layer"
        AUTH[Supabase Auth<br/>JWT Tokens]
        RLS[Row Level Security<br/>Database Policies]
    end

    USER -->|HTTPS Request| CDN
    CDN -->|Route| MW
    MW -->|Verify Session| AUTH
    MW --> PAGES
    PAGES --> COMPS
    COMPS -->|User Action| SA
    SA -->|Query| SUPABASE
    SUPABASE --> T1 & T2 & T3 & T4 & T5 & T6
    SA -->|Payment| STRIPE
    STRIPE -.->|Webhook| API
    API -->|Update| SUPABASE
    SUPABASE -->|Enforce| RLS
    SA -.->|Future| EMAIL

    style CDN fill:#4A90E2
    style AUTH fill:#E74C3C
    style RLS fill:#E74C3C
    style SUPABASE fill:#3ECF8E
    style STRIPE fill:#635BFF
    style MW fill:#F39C12
```

---

## Key Architectural Decisions

### 1. Server-First Architecture
**Decision:** Use Server Components by default, Client Components only when needed

**Reasoning:**
- Better performance (less JavaScript sent to browser)
- Improved SEO (fully rendered HTML)
- Enhanced security (sensitive logic on server)
- Cost savings (less client processing)

**Trade-offs:**
- Steeper learning curve for developers
- Some interactivity requires client components
- More complex state management

---

### 2. Server Actions vs REST API
**Decision:** Use Server Actions for all mutations, minimal API routes

**Reasoning:**
- Less boilerplate code
- Type-safe across client/server boundary
- Automatic serialization/deserialization
- Better developer experience

**Trade-offs:**
- Vendor lock-in (Next.js specific)
- Cannot call from mobile apps (future consideration)
- Less familiar to traditional backend developers

---

### 3. Supabase for Database + Auth
**Decision:** Use Supabase instead of separate database and auth providers

**Reasoning:**
- Single service for multiple needs
- Built-in Row Level Security
- Real-time capabilities (future use)
- PostgreSQL (battle-tested, scalable)
- Free tier for early stage

**Trade-offs:**
- Vendor lock-in (migration effort if needed)
- Less control over infrastructure
- Must trust third-party with data

---

### 4. Serverless Deployment (Vercel)
**Decision:** Deploy to Vercel serverless instead of traditional servers

**Reasoning:**
- Auto-scaling (handle traffic spikes)
- Pay per use (cost-effective at low scale)
- Zero DevOps (focus on product)
- Global edge network (fast worldwide)

**Trade-offs:**
- Cold starts (50-200ms delay after idle)
- Vendor lock-in
- Limited control over server environment
- Cost scales with usage

---

### 5. Stripe for Coach Subscriptions Only
**Decision:** Use Stripe for coach billing, P2P links for client payments

**Reasoning:**
- PCI compliance handled by Stripe
- Robust subscription management
- No transaction fees on P2P payments
- Coaches keep 100% of lesson revenue

**Trade-offs:**
- Two payment systems to manage
- Manual reconciliation for client payments
- No automated payment tracking for lessons

---

## Interview Talking Points

### System Design Strengths

1. **Scalability:** Serverless architecture auto-scales from 1 to 10,000 users without code changes

2. **Security:** Three layers of security (client validation, server checks, database RLS)

3. **Performance:** Server-side rendering + edge CDN = <100ms page loads globally

4. **Cost Efficiency:** Pay-per-use model keeps costs low during growth phase

5. **Developer Velocity:** Server Actions reduce boilerplate by ~50% vs traditional REST APIs

6. **Type Safety:** TypeScript across frontend/backend catches bugs at compile time

7. **Separation of Concerns:** Clear layers (presentation, business logic, data access)

8. **Database Security:** Row Level Security enforced at database level (cannot be bypassed)

### Potential Improvements

1. **Caching Layer:** Add Redis for frequently accessed data (subscription status, client lists)

2. **Database Replication:** Add read replicas for better read performance

3. **Monitoring:** Implement Sentry for error tracking, Vercel Analytics for performance

4. **Feature Flags:** Use LaunchDarkly or Vercel Edge Config for gradual rollouts

5. **API Layer:** Add REST API for future mobile app (in addition to Server Actions)

6. **Background Jobs:** Implement queue system for email sending, invoice generation

7. **Search:** Add full-text search with Algolia or Elasticsearch for large client rosters

8. **Offline Support:** Implement service workers for offline client list viewing

---

**Document Last Updated:** November 21, 2025
**Mermaid Version:** Compatible with GitHub, GitLab, and Mermaid Live Editor
**Usage:** Copy any diagram into Mermaid Live Editor (https://mermaid.live) to edit or export as PNG/SVG
