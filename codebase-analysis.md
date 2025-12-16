# Codebase Analysis: Shift - Figure Skating Coaching Management Platform

**Date:** November 21, 2025
**Project:** Shift Next.js Application
**For:** Beginner engineers on the fast track to world-class development

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Complete Directory Structure](#complete-directory-structure)
3. [Understanding File Roles](#understanding-file-roles)
4. [Frontend vs Backend vs Configuration](#frontend-vs-backend-vs-configuration)
5. [Lines of Code Breakdown](#lines-of-code-breakdown)
6. [Technology Stack Explained](#technology-stack-explained)
7. [Key Concepts for Beginners](#key-concepts-for-beginners)
8. [Learning Path Recommendations](#learning-path-recommendations)

---

## Project Overview

**What is Shift?**
Shift is a web application that helps figure skating coaches manage their business. Think of it like a digital assistant that handles scheduling, client management, and billing automatically - all the boring admin work that keeps coaches at the rink longer than they need to be.

**Core Problem It Solves:**
Coaches spend too much time chasing payments, managing schedules, and tracking clients. For less than the cost of a coffee per month, Shift automates these tasks so coaches can leave the rink on time.

**Key Features:**
- Client roster management (keep track of all your skaters)
- Lesson scheduling (calendar-based booking system)
- Automated invoicing (generate and send payment reminders)
- Subscription billing (coaches pay monthly to use Shift)
- Secure authentication (login/signup system)

---

## Complete Directory Structure

Here's every folder and file in your project, organized like a filing cabinet:

```
nextjs-app/                          # Root folder (the entire project lives here)
│
├── .claude/                          # Documentation & AI assistant configuration
│   ├── prd/                          # Product Requirements Documents
│   │   ├── 01-product-overview.md
│   │   ├── 02-customer-personas.md
│   │   ├── 03-feature-blueprint.md
│   │   ├── 04-mvp-requirements.md
│   │   ├── 05-technical-architecture.md
│   │   └── README.md
│   ├── steering/                     # AI context documents
│   │   ├── product.md                # Product strategy
│   │   ├── tech.md                   # Technical details
│   │   └── db-schema.md              # Database structure
│   └── settings.local.json           # Local AI settings
│
├── __tests__/                        # Automated tests (quality assurance)
│   ├── unit/                         # Tests for individual components
│   │   ├── actions/
│   │   │   └── client-actions.test.ts
│   │   └── components/
│   │       └── ClientForm.test.tsx
│   └── integration/                  # Tests for complete workflows
│       └── client-management.test.tsx
│
├── app/                              # Next.js App Router (pages & API logic)
│   ├── actions/                      # Server Actions (backend logic)
│   │   ├── client-actions.ts         # CRUD for clients
│   │   ├── lesson-actions.ts         # Lesson management
│   │   └── stripe-actions.ts         # Payment processing
│   ├── api/                          # API endpoints
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts          # Stripe webhook handler
│   ├── calendar/                     # Calendar page
│   │   ├── page.tsx
│   │   └── CalendarPageClient.tsx
│   ├── clients/                      # Client management pages
│   │   ├── page.tsx                  # Client list
│   │   ├── [id]/                     # Dynamic client detail page
│   │   │   ├── page.tsx
│   │   │   └── ClientDetailClient.tsx
│   │   └── new/                      # New client form
│   │       ├── page.tsx
│   │       └── NewClientPageClient.tsx
│   ├── dashboard/                    # Coach dashboard
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── login/                        # Login page
│   │   └── page.tsx
│   ├── signup/                       # Registration page
│   │   └── page.tsx
│   ├── layout.tsx                    # Root layout (wraps all pages)
│   ├── page.tsx                      # Home/landing page
│   └── globals.css                   # Global styles
│
├── components/                       # Reusable UI components
│   ├── BookLessonForm.tsx            # Lesson booking form
│   ├── Calendar.tsx                  # Calendar display
│   ├── ClientForm.tsx                # Client creation/editing
│   ├── DashboardWrapper.tsx          # Dashboard layout
│   ├── LandingPage.tsx               # Marketing page
│   ├── LogoutButton.tsx              # Logout functionality
│   ├── SubscribeButton.tsx           # Stripe subscription
│   └── README.md                     # Component docs
│
├── lib/                              # Shared utilities & libraries
│   ├── supabase/                     # Database client setup
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   ├── middleware.ts             # Session management
│   │   └── types.ts                  # Database types
│   ├── types/                        # TypeScript type definitions
│   │   ├── client.ts
│   │   └── lesson.ts
│   ├── constants/                    # App constants
│   │   └── messages.ts
│   ├── validation/                   # Form validation rules
│   │   └── client-validation.ts
│   └── README.md
│
├── hooks/                            # Custom React hooks (currently empty)
│   └── README.md
│
├── public/                           # Static assets (images, fonts, etc.)
│   └── .gitkeep
│
├── node_modules/                     # Dependencies (DO NOT EDIT)
├── .next/                            # Build output (DO NOT EDIT)
│
├── .eslintrc.json                    # Code quality rules
├── .gitignore                        # Files Git should ignore
├── jest.config.ts                    # Testing configuration
├── jest.setup.ts                     # Test environment setup
├── middleware.ts                     # Next.js middleware
├── next.config.ts                    # Next.js configuration
├── next-env.d.ts                     # Next.js TypeScript types
├── package.json                      # Project metadata & dependencies
├── postcss.config.js                 # CSS processing config
├── README.md                         # Project documentation
├── tailwind.config.ts                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration
```

---

## Understanding File Roles

### 1. Frontend Files (What Users See)

These files control the user interface - everything users click, see, and interact with.

#### Pages (app/ directory)
- **[app/page.tsx](app/page.tsx)** - Landing page (first thing visitors see)
- **[app/signup/page.tsx](app/signup/page.tsx)** - User registration form
- **[app/login/page.tsx](app/login/page.tsx)** - Login page
- **[app/dashboard/page.tsx](app/dashboard/page.tsx)** - Coach dashboard (main hub after login)
- **[app/clients/page.tsx](app/clients/page.tsx)** - List of all clients
- **[app/clients/new/page.tsx](app/clients/new/page.tsx)** - Form to add new client
- **[app/clients/[id]/page.tsx](app/clients/[id]/page.tsx)** - Individual client details
- **[app/calendar/page.tsx](app/calendar/page.tsx)** - Calendar view for lessons

**Why pages matter:**
Each file in the `app/` directory becomes a URL route automatically. For example:
- `app/dashboard/page.tsx` → `yoursite.com/dashboard`
- `app/clients/[id]/page.tsx` → `yoursite.com/clients/123`

#### Components (components/ directory)
- **[components/LandingPage.tsx](components/LandingPage.tsx)** - Marketing homepage content
- **[components/ClientForm.tsx](components/ClientForm.tsx)** - Reusable form for adding/editing clients
- **[components/Calendar.tsx](components/Calendar.tsx)** - Calendar widget
- **[components/BookLessonForm.tsx](components/BookLessonForm.tsx)** - Form to schedule lessons
- **[components/DashboardWrapper.tsx](components/DashboardWrapper.tsx)** - Layout wrapper for dashboard
- **[components/LogoutButton.tsx](components/LogoutButton.tsx)** - Button to sign out
- **[components/SubscribeButton.tsx](components/SubscribeButton.tsx)** - Stripe payment button

**Why components matter:**
Components are like LEGO blocks. Instead of rewriting the same code everywhere, you create a component once and use it in multiple places. For example, `ClientForm` is used on both the "new client" page and "edit client" page.

#### Styles
- **[app/globals.css](app/globals.css)** - Global styles applied to entire app
- **[tailwind.config.ts](tailwind.config.ts)** - Tailwind CSS customization (colors, fonts, animations)

---

### 2. Backend Files (Server Logic)

These files run on the server and handle data processing, database operations, and business logic.

#### Server Actions (app/actions/)
- **[app/actions/client-actions.ts](app/actions/client-actions.ts)** - Create, read, update, delete clients
- **[app/actions/lesson-actions.ts](app/actions/lesson-actions.ts)** - Schedule and manage lessons
- **[app/actions/stripe-actions.ts](app/actions/stripe-actions.ts)** - Process subscription payments

**What are Server Actions?**
Think of server actions as the "behind-the-scenes workers." When a user submits a form, the frontend sends the data to a server action. The server action validates it, saves it to the database, and sends back a response. This keeps sensitive operations (like database writes) secure on the server.

**Example Flow:**
1. User fills out "Add Client" form
2. Frontend calls `createClient()` server action
3. Server action validates data
4. Server action saves to database
5. Server action returns success/error
6. Frontend shows confirmation message

#### API Routes (app/api/)
- **[app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts)** - Receives events from Stripe (e.g., "payment succeeded")

**What are API Routes?**
API routes are URLs that external services can call. For example, when a coach subscribes via Stripe, Stripe sends a webhook (notification) to `/api/webhooks/stripe` to tell your app "Payment successful, activate subscription."

#### Database Configuration (lib/supabase/)
- **[lib/supabase/client.ts](lib/supabase/client.ts)** - Database client for browser
- **[lib/supabase/server.ts](lib/supabase/server.ts)** - Database client for server
- **[lib/supabase/middleware.ts](lib/supabase/middleware.ts)** - Session refresh logic
- **[lib/supabase/types.ts](lib/supabase/types.ts)** - Database type definitions

**Why two database clients?**
- **Client** (browser): Used when frontend needs data (e.g., displaying client list)
- **Server**: Used in server actions for secure operations (e.g., creating new user)

---

### 3. Configuration Files

These files tell tools and frameworks how to behave. You won't edit these often, but they're critical.

#### Core Configuration
- **[package.json](package.json)** - Lists all dependencies (libraries), project metadata, and scripts
- **[tsconfig.json](tsconfig.json)** - TypeScript compiler settings
- **[next.config.ts](next.config.ts)** - Next.js framework settings
- **[tailwind.config.ts](tailwind.config.ts)** - Tailwind CSS customization
- **[jest.config.ts](jest.config.ts)** - Testing framework settings
- **[.eslintrc.json](.eslintrc.json)** - Code quality/style rules
- **[middleware.ts](middleware.ts)** - Runs before every request (session refresh)

**Analogy:**
Configuration files are like the settings menu in a video game. You set preferences once, and the game (or in this case, your app) behaves accordingly.

---

### 4. Utility & Helper Files (lib/)

These files contain reusable functions and definitions that don't fit in components or actions.

#### Type Definitions (lib/types/)
- **[lib/types/client.ts](lib/types/client.ts)** - TypeScript types for Client data structure
- **[lib/types/lesson.ts](lib/types/lesson.ts)** - TypeScript types for Lesson data structure

**What are types?**
Types tell TypeScript what shape data should have. For example:
```typescript
type Client = {
  id: string
  name: string
  email: string
  hourlyRate: number
}
```
This prevents bugs like trying to add a number to a client's name.

#### Validation (lib/validation/)
- **[lib/validation/client-validation.ts](lib/validation/client-validation.ts)** - Rules for validating client form data

**Why separate validation?**
Validation logic (e.g., "email must be valid format") is reused across frontend and backend, so it lives in one place.

#### Constants (lib/constants/)
- **[lib/constants/messages.ts](lib/constants/messages.ts)** - User-facing message strings

**Why use constants?**
Instead of writing "Client created successfully" in 5 places, you write it once as `MESSAGES.CLIENT_CREATED` and reference it everywhere. If you want to change the wording, you update one file.

---

### 5. Test Files (__tests__/)

Tests automatically verify that your code works correctly.

- **[__tests__/unit/components/ClientForm.test.tsx](__tests__/unit/components/ClientForm.test.tsx)** - Tests ClientForm component
- **[__tests__/unit/actions/client-actions.test.ts](__tests__/unit/actions/client-actions.test.ts)** - Tests client server actions
- **[__tests__/integration/client-management.test.tsx](__tests__/integration/client-management.test.tsx)** - Tests complete user workflows

**Why write tests?**
Tests catch bugs before users do. For example, a test might simulate a user submitting an invalid email and verify that the form shows an error message.

**Unit vs Integration Tests:**
- **Unit Tests:** Test one thing in isolation (e.g., "Does the email validation function work?")
- **Integration Tests:** Test multiple things together (e.g., "Can a user successfully create a client from start to finish?")

---

### 6. Documentation Files

- **.claude/prd/** - Product requirements (what features to build and why)
- **.claude/steering/** - AI context documents (help AI assistants understand your project)
- **README.md files** - Explain how to use each module

---

## Frontend vs Backend vs Configuration

### Frontend (User Interface)
**What it is:** Everything users see and interact with
**Technologies:** React, TypeScript, Tailwind CSS
**Files:** `app/*/page.tsx`, `components/*.tsx`, `app/globals.css`

**Example:** The login form where users enter email/password

### Backend (Server Logic)
**What it is:** Business logic, database operations, security
**Technologies:** Next.js Server Actions, Supabase, Stripe API
**Files:** `app/actions/*.ts`, `app/api/**/*.ts`, `lib/supabase/*.ts`

**Example:** The server action that verifies email/password and creates a session

### Configuration (Project Settings)
**What it is:** Rules and settings for tools/frameworks
**Technologies:** TypeScript, Jest, ESLint, Tailwind
**Files:** `*.config.ts`, `tsconfig.json`, `.eslintrc.json`

**Example:** `tsconfig.json` tells TypeScript to use strict type checking

### How They Work Together
```
User clicks "Add Client" button
    ↓
Frontend (ClientForm.tsx) collects form data
    ↓
Frontend calls server action (createClient in client-actions.ts)
    ↓
Backend validates data using validation rules (client-validation.ts)
    ↓
Backend saves to database using Supabase client (lib/supabase/server.ts)
    ↓
Backend returns success/error
    ↓
Frontend shows confirmation message
```

---

## Lines of Code Breakdown

Here's how much code exists in each category:

### Summary Table

| Category              | Files | Lines | Percentage |
|-----------------------|-------|-------|------------|
| App Router Pages      |  12   | 1,857 | 45.5%      |
| Components            |   7   | 1,187 | 29.1%      |
| Tests                 |   2   |   789 | 19.4%      |
| Configuration Files   |   4   |   142 |  3.5%      |
| Styles                |   1   |   102 |  2.5%      |
| **TOTAL**             |  26   | 4,077 | 100%       |

### What This Means

1. **App Router Pages (45.5%)** - Most code is in page files, which makes sense for a web app
2. **Components (29.1%)** - Solid amount of reusable UI components
3. **Tests (19.4%)** - Strong test coverage (professional projects aim for 15-30%)
4. **Configuration (3.5%)** - Minimal config means clean, modern setup
5. **Styles (2.5%)** - Using Tailwind CSS means less custom CSS

### File Type Breakdown

- **TypeScript/TSX Files:** 21 files, 3,933 lines (96.5%)
- **Configuration (TS):** 4 files, 142 lines (3.5%)
- **CSS Files:** 1 file, 102 lines (2.5%)

### Key Observations

- **4,077 total lines** is a well-scoped MVP (Minimum Viable Product)
- **26 source files** means the codebase is focused and maintainable
- **Strong typing** (96.5% TypeScript) reduces bugs and improves code quality
- **Test coverage** includes both unit and integration tests

---

## Technology Stack Explained

### Core Technologies

#### 1. Next.js 15.1.6 (The Framework)
**What it is:** A React framework that handles routing, server rendering, and more
**Why it matters:** Simplifies building fast, SEO-friendly web apps
**Analogy:** If React is like building with LEGO bricks, Next.js is like a LEGO instruction manual that shows you how to build specific things faster

**Key Features Used:**
- **App Router:** File-based routing (file in `app/dashboard/` becomes `/dashboard` URL)
- **Server Components:** Components that render on server for better performance
- **Server Actions:** Backend functions you can call directly from frontend

#### 2. React 19.0.0 (The UI Library)
**What it is:** JavaScript library for building user interfaces
**Why it matters:** Makes it easy to create interactive, dynamic UIs
**Analogy:** React is like building a house with prefab sections instead of brick-by-brick

**Key Concepts:**
- **Components:** Reusable UI pieces (like `<ClientForm />`)
- **State:** Data that changes over time (like form inputs)
- **Props:** Data passed from parent to child components

#### 3. TypeScript 5 (The Programming Language)
**What it is:** JavaScript with type checking
**Why it matters:** Catches errors before runtime, improves code quality
**Analogy:** JavaScript lets you put anything in any box. TypeScript labels boxes ("only numbers go here") to prevent mistakes

**Example:**
```typescript
// JavaScript (no type checking)
function addNumbers(a, b) {
  return a + b
}
addNumbers(5, "hello") // Returns "5hello" (bug!)

// TypeScript (with type checking)
function addNumbers(a: number, b: number): number {
  return a + b
}
addNumbers(5, "hello") // Error: "hello" is not a number
```

#### 4. Supabase (The Database)
**What it is:** PostgreSQL database with built-in authentication
**Why it matters:** Handles data storage and user login/signup
**Analogy:** Supabase is like a filing cabinet with a built-in security guard (authentication) and librarian (API for accessing data)

**Key Features:**
- **PostgreSQL Database:** Stores clients, lessons, invoices
- **Row Level Security (RLS):** Coaches can only see their own data
- **Authentication:** Email/password login system

#### 5. Stripe (Payment Processing)
**What it is:** Payment processing platform for subscriptions
**Why it matters:** Handles coach subscription billing (NOT client-to-coach payments)
**Analogy:** Stripe is like a cashier that handles all payment transactions securely

**Used For:**
- Coach monthly subscriptions ($8-10/month)
- PCI-compliant payment processing (never touches credit card data)
- Webhook notifications when payments succeed/fail

#### 6. Tailwind CSS (Styling)
**What it is:** Utility-first CSS framework
**Why it matters:** Styles components quickly with pre-made classes
**Analogy:** Instead of writing custom CSS every time, Tailwind gives you building blocks like `bg-blue-500` (blue background), `p-4` (padding)

**Example:**
```tsx
// Without Tailwind (custom CSS)
<button className="my-button">Click me</button>
// styles.css: .my-button { background: blue; padding: 10px; ... }

// With Tailwind (utility classes)
<button className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
  Click me
</button>
```

#### 7. Jest & React Testing Library (Testing)
**What it is:** Testing frameworks for automated tests
**Why it matters:** Verifies code works correctly before deployment
**Analogy:** Jest is like a robot QA tester that checks your app 24/7

---

### Supporting Technologies

#### date-fns 4.1.0
**Purpose:** Date manipulation and formatting
**Example:** Format lesson dates like "Jan 15, 2025, 3:00 PM"

#### ESLint 9
**Purpose:** Code quality and style enforcement
**Example:** Warns you if you forget to close a tag or use an unused variable

#### PostCSS & Autoprefixer
**Purpose:** Process CSS for browser compatibility
**Example:** Automatically adds `-webkit-` prefixes for older browsers

---

## Key Concepts for Beginners

### 1. Server Components vs Client Components

**Server Components (default in Next.js 15):**
- Render on the server
- Can access database directly
- Cannot use interactivity (clicks, state)
- Example: Dashboard page that fetches data from database

**Client Components (marked with "use client"):**
- Render in the browser
- Can use interactivity (clicks, forms, animations)
- Cannot access database directly
- Example: ClientForm with form validation and submission

**When to use which:**
- **Server Component:** Displaying data, static content, authentication checks
- **Client Component:** Forms, buttons, modals, animations

**Example:**
```tsx
// Server Component (app/dashboard/page.tsx)
export default async function DashboardPage() {
  const clients = await getClients() // Direct database call
  return <div>Total clients: {clients.length}</div>
}

// Client Component (components/ClientForm.tsx)
"use client" // This directive makes it a client component
export default function ClientForm() {
  const [name, setName] = useState("")
  return <input value={name} onChange={e => setName(e.target.value)} />
}
```

---

### 2. Server Actions

**What they are:** Functions that run on the server but can be called from the client
**Why they're powerful:** No need to create API routes manually

**Example:**
```tsx
// app/actions/client-actions.ts (Server)
"use server"
export async function createClient(data: ClientData) {
  // This runs on the server
  const client = await database.insert(data)
  return client
}

// components/ClientForm.tsx (Client)
"use client"
import { createClient } from "@/app/actions/client-actions"

export default function ClientForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createClient(formData) // Calls server function
    console.log("Client created:", result)
  }
  return <form action={handleSubmit}>...</form>
}
```

---

### 3. File-Based Routing

**Concept:** File structure in `app/` directory becomes URL structure

**Examples:**
- `app/page.tsx` → `/` (home page)
- `app/dashboard/page.tsx` → `/dashboard`
- `app/clients/page.tsx` → `/clients`
- `app/clients/[id]/page.tsx` → `/clients/123` (dynamic route)

**Dynamic Routes:**
```tsx
// app/clients/[id]/page.tsx
export default function ClientPage({ params }: { params: { id: string } }) {
  // params.id contains the URL parameter
  // If URL is /clients/123, params.id = "123"
  return <div>Client ID: {params.id}</div>
}
```

---

### 4. TypeScript Types

**Purpose:** Define the shape of data to prevent bugs

**Example:**
```typescript
// lib/types/client.ts
export type Client = {
  id: string
  name: string
  email: string
  hourlyRate: number
  phone?: string // Optional field (? means optional)
}

// Usage in a component
function ClientCard({ client }: { client: Client }) {
  // TypeScript knows client has name, email, hourlyRate
  return (
    <div>
      <h2>{client.name}</h2>
      <p>{client.email}</p>
      <p>${client.hourlyRate}/hour</p>
    </div>
  )
}
```

**Benefits:**
- Autocomplete in your editor
- Catches typos (`client.nmae` → Error: Did you mean `name`?)
- Documents your code (you can see what fields are available)

---

### 5. Environment Variables

**What they are:** Configuration values stored outside your code
**Why they matter:** Keep secrets (API keys, database passwords) secure

**Example `.env.local` file:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-secret-key-here (server-only)
STRIPE_SECRET_KEY=sk_test_xxx (server-only)
```

**Rules:**
- Variables starting with `NEXT_PUBLIC_` are visible to the browser (safe for public)
- Variables without `NEXT_PUBLIC_` are server-only (secrets)

**Usage:**
```typescript
// Accessing environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const stripeKey = process.env.STRIPE_SECRET_KEY // Only works on server
```

---

### 6. Authentication Flow

**How users log in:**

1. **User visits `/login`**
2. **User enters email/password**
3. **Frontend calls Supabase auth:**
   ```typescript
   await supabase.auth.signInWithPassword({ email, password })
   ```
4. **Supabase verifies credentials**
5. **If valid, Supabase creates session (stored in cookie)**
6. **Middleware on every request checks session:**
   ```typescript
   // middleware.ts
   export async function middleware(request: NextRequest) {
     const { user } = await supabase.auth.getUser()
     if (!user) redirect("/login") // Not logged in
   }
   ```
7. **If session valid, user accesses protected pages**
8. **If invalid/expired, redirect to `/login`**

---

### 7. Subscription Billing Flow (Stripe)

**How coach subscriptions work:**

1. **Coach clicks "Subscribe" button**
2. **Frontend calls server action:**
   ```typescript
   const url = await createCheckoutSession()
   ```
3. **Server creates Stripe Checkout session:**
   ```typescript
   const session = await stripe.checkout.sessions.create({
     customer: coach.stripeCustomerId,
     line_items: [{ price: "price_monthly_plan", quantity: 1 }],
     mode: "subscription",
     success_url: "/dashboard?success=true",
     cancel_url: "/dashboard?canceled=true"
   })
   ```
4. **User redirected to Stripe checkout page**
5. **User enters payment info on Stripe (NOT your app)**
6. **Stripe processes payment**
7. **Stripe redirects back to your app**
8. **Stripe sends webhook to `/api/webhooks/stripe`:**
   ```typescript
   // Webhook event: checkout.session.completed
   if (event.type === "checkout.session.completed") {
     // Update coach's subscription status in database
     await updateCoachSubscription(coachId, "active")
   }
   ```
9. **Coach sees "Subscription Active" in dashboard**

**Important:** Your app NEVER touches credit card data. Stripe handles all payment processing.

---

## Learning Path Recommendations

### Phase 1: Foundation (Week 1-2)
**Goal:** Understand core technologies

1. **JavaScript Basics**
   - Variables, functions, arrays, objects
   - Async/await for asynchronous operations
   - ES6+ features (arrow functions, destructuring, spread operator)

2. **React Fundamentals**
   - Components, props, state
   - JSX syntax
   - Event handling (onClick, onChange)
   - Conditional rendering
   - Lists and keys

3. **TypeScript Basics**
   - Basic types (string, number, boolean)
   - Interfaces and types
   - Type annotations for functions

**Practice:** Build a simple to-do list app with React and TypeScript

---

### Phase 2: Next.js Essentials (Week 3-4)
**Goal:** Master Next.js patterns

1. **App Router**
   - File-based routing
   - Layouts and nested routes
   - Dynamic routes with `[id]`

2. **Server vs Client Components**
   - When to use each
   - "use client" directive
   - Data fetching patterns

3. **Server Actions**
   - Creating server actions
   - Form submission with server actions
   - Error handling

**Practice:** Build a blog with Next.js (list posts, view post, create post)

---

### Phase 3: Database & Authentication (Week 5-6)
**Goal:** Connect to backend services

1. **Supabase Basics**
   - Create database tables
   - Row Level Security (RLS) policies
   - CRUD operations (Create, Read, Update, Delete)

2. **Authentication**
   - Sign up / sign in
   - Session management
   - Protected routes

**Practice:** Add user authentication to your blog (only logged-in users can create posts)

---

### Phase 4: Testing (Week 7-8)
**Goal:** Write automated tests

1. **Jest Fundamentals**
   - Test structure (describe, it, expect)
   - Assertions (expect(x).toBe(y))
   - Mocking dependencies

2. **React Testing Library**
   - Rendering components
   - Simulating user interactions (click, type)
   - Querying elements (getByRole, getByText)

**Practice:** Write tests for your blog app (test form submission, authentication)

---

### Phase 5: Advanced Features (Week 9-10)
**Goal:** Learn production-ready patterns

1. **State Management**
   - Context API for global state
   - When to lift state up

2. **Form Validation**
   - Client-side validation
   - Server-side validation
   - Error messaging

3. **Payments (Stripe)**
   - Create checkout sessions
   - Handle webhooks
   - Subscription management

**Practice:** Add a premium subscription tier to your blog

---

### Phase 6: Deployment & DevOps (Week 11-12)
**Goal:** Deploy to production

1. **Environment Variables**
   - Local vs production config
   - Securing secrets

2. **Vercel Deployment**
   - Connecting GitHub repo
   - Automatic deployments
   - Preview deployments for PRs

3. **Monitoring**
   - Error tracking (Sentry)
   - Analytics (Vercel Analytics)
   - Performance monitoring

**Practice:** Deploy your blog to Vercel

---

## Recommended Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs) - Official Next.js documentation
- [React Docs](https://react.dev) - Official React documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - Official TypeScript guide
- [Supabase Docs](https://supabase.com/docs) - Database and auth documentation
- [Stripe Docs](https://stripe.com/docs) - Payment processing guide
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Styling framework

### Tutorials
- [Next.js Learn](https://nextjs.org/learn) - Interactive Next.js tutorial
- [React Tutorial](https://react.dev/learn) - Official React tutorial
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) - Quick TypeScript intro

### YouTube Channels
- **Web Dev Simplified** - Clear, beginner-friendly tutorials
- **Fireship** - Quick overviews of technologies (5-10 min videos)
- **Theo - t3.gg** - Advanced Next.js patterns
- **Traversy Media** - Full-stack JavaScript tutorials

---

## Common Patterns in This Codebase

### Pattern 1: Server Page + Client Component

**Structure:**
```
app/clients/new/
├── page.tsx (Server Component)
└── NewClientPageClient.tsx (Client Component)
```

**Why:**
- `page.tsx` fetches data on server (fast, SEO-friendly)
- Passes data to `NewClientPageClient.tsx` for interactivity

**Example:**
```tsx
// page.tsx (Server)
export default async function NewClientPage() {
  const coaches = await getCoaches() // Server-only data fetch
  return <NewClientPageClient coaches={coaches} />
}

// NewClientPageClient.tsx (Client)
"use client"
export default function NewClientPageClient({ coaches }) {
  const [selected, setSelected] = useState(coaches[0])
  return <select onChange={e => setSelected(e.target.value)}>...</select>
}
```

---

### Pattern 2: Server Actions for Mutations

**Structure:**
```
app/actions/
├── client-actions.ts
├── lesson-actions.ts
└── stripe-actions.ts
```

**Why:** Centralize backend logic in reusable functions

**Example:**
```tsx
// app/actions/client-actions.ts
"use server"
export async function createClient(formData: FormData) {
  const name = formData.get("name")
  const email = formData.get("email")

  // Validate
  if (!email.includes("@")) {
    return { error: "Invalid email" }
  }

  // Save to database
  const client = await db.clients.insert({ name, email })
  revalidatePath("/clients") // Refresh client list
  return { success: true, client }
}

// components/ClientForm.tsx
"use client"
export default function ClientForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createClient(formData)
    if (result.error) alert(result.error)
    else alert("Client created!")
  }
  return <form action={handleSubmit}>...</form>
}
```

---

### Pattern 3: Type Safety Across Frontend/Backend

**Structure:**
```
lib/types/
├── client.ts
└── lesson.ts
```

**Why:** Share type definitions between frontend and backend

**Example:**
```typescript
// lib/types/client.ts
export type Client = {
  id: string
  name: string
  email: string
  hourlyRate: number
}

// app/actions/client-actions.ts (Backend)
"use server"
export async function createClient(data: Client): Promise<Client> {
  return await db.clients.insert(data)
}

// components/ClientCard.tsx (Frontend)
import { Client } from "@/lib/types/client"
export default function ClientCard({ client }: { client: Client }) {
  return <div>{client.name}</div>
}
```

Now TypeScript ensures that if you change the `Client` type, both frontend and backend update automatically.

---

## Debugging Tips

### 1. Console.log is Your Friend
```typescript
console.log("Debug: user data", user)
console.log("Debug: form submitted", formData)
```

### 2. Check Network Tab (Browser DevTools)
- Open DevTools (F12)
- Go to Network tab
- Refresh page
- See all requests (API calls, images, CSS)
- Click on a request to see details (headers, response, timing)

### 3. Use TypeScript Errors
- Red squiggly lines are your friend
- Hover over them to see the error
- Fix types until errors disappear

### 4. Check Server Logs
```bash
npm run dev
```
- Server errors appear in terminal
- Client errors appear in browser console

### 5. Use React DevTools
- Install React DevTools browser extension
- Inspect component tree
- See props and state for each component

---

## Next Steps

### To Get Started with This Project:

1. **Clone the repository** (if not already done)
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` (if exists)
   - Add your Supabase and Stripe keys
4. **Run development server:**
   ```bash
   npm run dev
   ```
5. **Open browser to** `http://localhost:3000`

### To Start Coding:

1. **Pick a small task** (e.g., "Add phone number field to client form")
2. **Find the relevant file** (e.g., `components/ClientForm.tsx`)
3. **Make the change**
4. **Test it manually**
5. **Write a test** (e.g., `__tests__/unit/components/ClientForm.test.tsx`)
6. **Run tests:**
   ```bash
   npm test
   ```
7. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add phone number field to client form"
   ```

---

## Glossary of Terms

- **API (Application Programming Interface):** A way for programs to talk to each other
- **Component:** Reusable piece of UI (like a button or form)
- **CRUD:** Create, Read, Update, Delete (basic database operations)
- **Environment Variable:** Configuration value stored outside code (like API keys)
- **Frontend:** The part of the app users see and interact with
- **Backend:** The part of the app that handles data and logic (server)
- **Hook:** Special React function that adds functionality (like `useState`, `useEffect`)
- **JSX:** JavaScript syntax extension that looks like HTML
- **Middleware:** Code that runs before a request is processed
- **Props:** Data passed from parent component to child component
- **Server Action:** Function that runs on server but can be called from client
- **Server Component:** React component that renders on server (no interactivity)
- **Client Component:** React component that renders in browser (interactive)
- **State:** Data that changes over time in a component
- **Type:** TypeScript definition of what shape data should have
- **Webhook:** HTTP callback (one app notifies another when something happens)

---

## Summary

You now have a complete understanding of your Shift codebase:

1. **4,077 lines of code** across 26 source files
2. **3 main categories:** Frontend (pages, components), Backend (server actions, API routes), Configuration
3. **Modern tech stack:** Next.js 15, React 19, TypeScript 5, Supabase, Stripe, Tailwind CSS
4. **Well-structured:** Clear separation of concerns, reusable components, comprehensive tests
5. **Production-ready:** Authentication, payments, database, testing, deployment

As a beginner engineer, focus on:
- Understanding how data flows (user clicks → frontend → server action → database → response)
- Learning one technology at a time (start with React, then Next.js, then TypeScript)
- Writing tests for everything you build
- Reading documentation when stuck
- Asking questions (no question is too simple)

Remember: Every world-class engineer started as a beginner. The key is consistency and curiosity. Keep building, keep learning, and don't be afraid to break things (that's what Git is for!).

Happy coding! 🚀

---

**Document Last Updated:** November 21, 2025
**Questions?** Refer to the [official Next.js docs](https://nextjs.org/docs) or reach out to your team.
