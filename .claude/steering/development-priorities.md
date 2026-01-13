# Morning Development Todo List
**Priority Order Based on User Requirements**

---

## PART 1: Understanding Performance & Scalability Concepts

Before implementing, let's clarify the concepts you asked about:

### 1. Database Query Optimization & Indexing
**What it does**: Makes your database searches lightning-fast by creating "shortcuts" to frequently accessed data.

**Current state**: Your Supabase database doesn't have custom indexes yet.

**When you need it**:
- When you notice lesson history taking >1 second to load
- When you have 100+ lessons per client
- When calendar view with hundreds of lessons loads slowly

**How to implement** (2-3 hours):
```sql
-- Add these indexes to speed up common queries
CREATE INDEX idx_lessons_coach_id ON lessons(coach_id);
CREATE INDEX idx_lessons_start_time ON lessons(start_time);
CREATE INDEX idx_lessons_client_id ON lessons(client_id);
CREATE INDEX idx_lesson_participants_lesson_id ON lesson_participants(lesson_id);
CREATE INDEX idx_lesson_participants_client_id ON lesson_participants(client_id);
```

**My recommendation**: Implement this within next 2 weeks as your data grows.

---

### 2. Caching Layer (Redis/Upstash)
**What it does**: Stores frequently accessed data in super-fast memory so you don't have to query the database every time.

**Current state**: You don't have caching - every page load queries Supabase.

**When you need it**:
- When you have 50+ active coaches
- When dashboard loads the same client/lesson data repeatedly
- When you notice database queries slowing down

**Example**: Instead of fetching client list from database 10 times per minute, cache it for 5 minutes.

**How to implement** (4-6 hours):
- Sign up for Upstash Redis (free tier)
- Install `@upstash/redis` package
- Wrap common queries with cache logic

**My recommendation**: Wait until you have 20+ active coaches. Not urgent now.

---

### 3. Rate Limiting on API Endpoints
**What it does**: Prevents abuse by limiting how many requests a user can make per minute.

**Current state**: No rate limiting - someone could spam your server 1000x per second.

**When you need it**: ASAP for security.

**Example**: Limit lesson creation to 10 lessons per minute per user.

**How to implement** (2-3 hours):
- Use Vercel's rate limiting middleware
- Or use `@upstash/ratelimit` package

**My recommendation**: Implement this as part of security hardening (HIGH PRIORITY).

---

### 4. Monitoring & Observability (Sentry, LogRocket)
**What it does**: Alerts you when errors happen in production and shows you exactly what users were doing when it broke.

**Current state**: You probably only know about bugs when users tell you.

**When you need it**: Before you have 10+ active coaches.

**What you get**:
- **Sentry**: Catches all JavaScript errors, server errors, database errors
- **LogRocket**: Records video replays of user sessions when bugs happen

**How to implement** (2 hours):
- Sign up for Sentry (free tier)
- Add Sentry SDK to your Next.js app
- Get instant email/Slack alerts when errors occur

**My recommendation**: Implement within next month before you have too many users.

---

## PART 2: HIGH PRIORITY - Ship These Features

### Priority 1: Recurring Lesson Support (8-12 hours)
**User requirement**: "every Tuesday at 3pm" functionality

**Database changes needed**:
```sql
-- Add columns to lessons table
ALTER TABLE lessons ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE lessons ADD COLUMN recurrence_rule TEXT; -- Store RRULE format
ALTER TABLE lessons ADD COLUMN recurrence_parent_id UUID REFERENCES lessons(id);
```

**Implementation approach**:
1. Add recurrence options to BookLessonForm
2. Generate series of lessons when recurring is selected
3. Allow editing single instance vs. entire series
4. Show recurring indicator in calendar

**Subtasks**:
- [ ] Design recurrence rule format (weekly, bi-weekly, monthly)
- [ ] Update database schema with recurrence fields
- [ ] Add recurrence UI to BookLessonForm
- [ ] Create server action to generate recurring lessons
- [ ] Add "Edit Series" vs "Edit This Instance" option to EditLessonForm
- [ ] Show recurring indicator (↻ icon) in calendar events
- [ ] Add "End Recurrence" option
- [ ] Test edge cases (holidays, skipped weeks)

---

### Priority 2: Conflict Detection with Alerts (4-6 hours)
**User requirement**: Alert coach when double-booking happens, but DON'T prevent it

**Implementation approach**:
1. Check for overlapping lessons when booking
2. Show yellow warning banner if conflict exists
3. Allow coach to proceed anyway
4. Highlight conflicting lessons in calendar with yellow border

**Subtasks**:
- [ ] Create `checkForConflicts` server action
- [ ] Add conflict detection to BookLessonForm
- [ ] Show dismissible warning banner when conflicts detected
- [ ] Display conflicting lesson details (time, client name)
- [ ] Add yellow border to conflicting events in calendar
- [ ] Update EditLessonForm with same conflict detection
- [ ] Add "View Conflicts" button to show all overlapping lessons

**Database query needed**:
```typescript
// Check if new lesson overlaps with existing lessons
const conflicts = await supabase
  .from('lessons')
  .select('*')
  .eq('coach_id', coachId)
  .gte('end_time', newLessonStart)
  .lte('start_time', newLessonEnd);
```

---

### Priority 3: Client Schedules - Brainstorming & Implementation (6-10 hours)

**Let's brainstorm the best approach:**

#### Option A: Weekly Availability Grid (Recommended)
**UI/UX**: Similar to when2meet - grid showing each client's typical weekly schedule

**Pros**:
- Visual at-a-glance view
- Easy to see patterns
- Helps coach avoid suggesting bad times

**Cons**:
- Doesn't handle one-off exceptions well

**Implementation**:
```sql
-- New table for client availability
CREATE TABLE client_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc.
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**UI mockup concept**:
```
Client: John Smith
┌─────────┬────────────────────────────────────┐
│ Monday  │ █████████░░░░░░░░░░█████████████   │ Available 9am-12pm, 3pm-6pm
│ Tuesday │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │ Not available
│ Wed     │ █████████████████████████████████   │ Available all day
└─────────┴────────────────────────────────────┘
```

#### Option B: Blackout Times (Simpler)
**UI/UX**: Just mark times when client is NOT available

**Pros**:
- Simpler to implement
- Easier for clients to understand
- Works well with exceptions

**Cons**:
- Requires marking unavailable times instead of available

#### Option C: Preferred Times + Blackout Times (Best of Both)
**Recommended approach**: Combine both - mark preferred times AND blackout times

**Database schema**:
```sql
CREATE TABLE client_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  preference_type TEXT, -- 'preferred' or 'blackout'
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**UI integration with scheduling**:
1. When booking lesson, show client's preferences in sidebar
2. Highlight preferred times in green on calendar
3. Shade out blackout times in red/gray
4. Still allow coach to book during blackout times (with warning)

**Subtasks**:
- [ ] Decide on approach (A, B, or C)
- [ ] Design database schema for client schedules
- [ ] Create migration to add client_preferences table
- [ ] Build ClientScheduleEditor component
- [ ] Add "Edit Schedule" button to client detail page
- [ ] Show client preferences in BookLessonForm sidebar
- [ ] Highlight preferred/blackout times in calendar
- [ ] Add warning when booking during blackout time
- [ ] Allow bulk-editing schedules for multiple clients

**My recommendation**: Start with Option C - it's the most flexible and gives best UX.

---

### Priority 4: Security Hardening (6-8 hours)

**Critical security issues to fix**:

#### 4.1 Input Sanitization (SQL Injection Prevention)
**Current risk**: HIGH - Supabase client library handles most of this, but need to verify

**Action items**:
- [ ] Audit all server actions for direct SQL queries
- [ ] Use parameterized queries everywhere
- [ ] Add input validation with Zod schemas
- [ ] Sanitize user-provided text (notes, descriptions)

#### 4.2 XSS Protection in Form Inputs
**Current risk**: MEDIUM - User notes/descriptions could contain malicious scripts

**Action items**:
- [ ] Install `dompurify` for sanitizing HTML content
- [ ] Sanitize all user-provided text before rendering
- [ ] Use `dangerouslySetInnerHTML` only with sanitized content
- [ ] Add Content Security Policy headers

#### 4.3 CSRF Token Implementation
**Current risk**: MEDIUM - Next.js server actions have some built-in protection

**Action items**:
- [ ] Verify Next.js CSRF protection is enabled
- [ ] Add CSRF tokens to critical forms (delete, payment)
- [ ] Test cross-origin request blocking

#### 4.4 Rate Limiting to Prevent Abuse
**Current risk**: HIGH - No rate limiting on any endpoints

**Action items**:
- [ ] Install `@upstash/ratelimit` package
- [ ] Add rate limiting middleware to server actions
- [ ] Limit lesson booking to 20/minute per user
- [ ] Limit client creation to 10/minute per user
- [ ] Limit API calls to 100/minute per IP address

#### 4.5 Security Headers Configuration
**Current risk**: MEDIUM - Missing security headers

**Action items**:
- [ ] Add `next.config.js` security headers
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Add X-Frame-Options to prevent clickjacking
- [ ] Add X-Content-Type-Options
- [ ] Configure CSP (Content Security Policy)

**Example `next.config.js`**:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

#### 4.6 Audit Logging for Sensitive Operations
**Current risk**: LOW - But critical for compliance later

**Action items**:
- [ ] Create `audit_logs` table
- [ ] Log all client deletions
- [ ] Log all lesson cancellations
- [ ] Log all hourly rate changes
- [ ] Log all payment-related actions
- [ ] Add "View Audit Log" page for coaches

---

### Priority 5: Revenue Reports (4-6 hours)

**User requirement**: Daily/weekly/monthly revenue reports

**Implementation approach**:

#### Database view for revenue calculations:
```sql
CREATE VIEW revenue_summary AS
SELECT
  coach_id,
  DATE_TRUNC('day', start_time) as report_date,
  COUNT(*) as total_lessons,
  SUM(rate_at_booking * duration_minutes / 60.0) as revenue,
  SUM(CASE WHEN status = 'completed' THEN rate_at_booking * duration_minutes / 60.0 ELSE 0 END) as completed_revenue,
  SUM(CASE WHEN status = 'cancelled' THEN rate_at_booking * duration_minutes / 60.0 ELSE 0 END) as lost_revenue
FROM lessons
GROUP BY coach_id, DATE_TRUNC('day', start_time);
```

**UI Components needed**:
1. Revenue dashboard page (`/revenue`)
2. Date range picker (daily/weekly/monthly/custom)
3. Revenue chart (using recharts or similar)
4. Breakdown by client
5. Breakdown by lesson type
6. Export to CSV option

**Subtasks**:
- [ ] Create revenue dashboard page
- [ ] Add date range picker component
- [ ] Create `getRevenueReport` server action
- [ ] Build revenue chart with daily/weekly/monthly views
- [ ] Show total revenue, completed revenue, pending revenue
- [ ] Add breakdown by client (top 5 revenue-generating clients)
- [ ] Add breakdown by lesson type
- [ ] Add "Export to CSV" button
- [ ] Show comparison to previous period (% change)

---

## PART 3: FUTURE/PAUSED FEATURES

These are explicitly marked as DO NOT IMPLEMENT yet:

- [ ] ~~Invoice generation & payment tracking~~ (PAUSED)
- [ ] ~~Email notifications~~ (PAUSED)
- [ ] ~~Payment processing (Stripe)~~ (PAUSED)
- [ ] ~~Timezone handling~~ (PAUSED)
- [ ] ~~No-show penalty/fee system~~ (PAUSED)
- [ ] ~~Late cancellation policies~~ (PAUSED)
- [ ] ~~Package deals~~ (PAUSED)
- [ ] ~~Discount codes~~ (PAUSED)
- [ ] ~~Waitlist functionality~~ (PAUSED)
- [ ] ~~Client notes/progress tracking~~ (PAUSED)
- [ ] ~~Coach availability/block-out times~~ (PAUSED - doing client schedules instead)
- [ ] ~~Advanced reporting~~ (PAUSED - only revenue reports for now)

---

## PART 4: MAYBE LATER (Good to Have)

### PWA Features (6-8 hours)
**What it gives you**: App-like experience on mobile, offline support, push notifications

**When to implement**: After you have 50+ active coaches and they're requesting it

**Implementation**:
- [ ] Add manifest.json for PWA
- [ ] Configure service worker for offline support
- [ ] Add "Add to Home Screen" prompt
- [ ] Enable push notifications for lesson reminders
- [ ] Cache calendar data for offline viewing

---

## RECOMMENDED IMPLEMENTATION ORDER FOR TOMORROW

### Morning Session (3-4 hours):
1. **Security Hardening** (Priority 4) - Start here since it's critical
   - Implement rate limiting (1 hour)
   - Add security headers to next.config.js (30 min)
   - Add input validation with Zod (1 hour)
   - XSS protection with DOMPurify (1 hour)

### Afternoon Session (4-5 hours):
2. **Client Schedules** (Priority 3) - Brainstorm and start implementation
   - Design database schema (30 min)
   - Create migration (30 min)
   - Build ClientScheduleEditor component (2 hours)
   - Integrate with BookLessonForm (1 hour)

### Evening Session (3-4 hours):
3. **Conflict Detection** (Priority 2) - Quick win
   - Create checkForConflicts server action (1 hour)
   - Add warning banner to forms (1 hour)
   - Highlight conflicts in calendar (1 hour)

### Day 2:
4. **Revenue Reports** (Priority 5)
5. **Recurring Lessons** (Priority 1) - Most complex, save for when you have momentum

---

## ESTIMATED TIME TO COMPLETE ALL HIGH PRIORITY ITEMS
- Security Hardening: 6-8 hours
- Conflict Detection: 4-6 hours
- Client Schedules: 6-10 hours
- Revenue Reports: 4-6 hours
- Recurring Lessons: 8-12 hours

**Total: 28-42 hours** (3-5 full days of focused development)

---

## QUICK REFERENCE CHECKLIST

**Week 1 Goals**:
- [x] Edit lesson functionality ✅ (DONE)
- [ ] Security hardening (rate limiting, headers, input validation)
- [ ] Client schedules (database + basic UI)
- [ ] Conflict detection with alerts

**Week 2 Goals**:
- [ ] Revenue reports (daily/weekly/monthly)
- [ ] Recurring lesson support
- [ ] PWA setup (if time allows)

**Week 3+ Goals**:
- [ ] Database indexing for performance
- [ ] Monitoring setup (Sentry)
- [ ] Advanced security (audit logging, CSRF)

---

## NOTES & REMINDERS

**Important constraints to remember**:
- Conflict detection should ALERT but NOT PREVENT booking
- Client schedules are for CLIENTS, not coach availability
- Status field stays visible in EditLessonForm (outside collapsible section)
- Rate limiting should limit but not block legitimate use
- Revenue reports are the ONLY reporting feature to implement now

**Questions to answer before implementing client schedules**:
1. Should clients fill out their own schedules, or does coach do it?
2. How often do schedules change? (Weekly, monthly, seasonally?)
3. Do we need recurring schedule exceptions? (e.g., "not available on December 25")
4. Should scheduling preferences affect calendar color coding?

**Questions to answer before implementing recurring lessons**:
1. What recurrence patterns do we support? (Weekly, bi-weekly, monthly, custom?)
2. How far in advance should we generate recurring lessons? (3 months? 6 months?)
3. What happens when you edit a recurring series - update all future instances or just one?
4. Should recurring lessons respect client blackout dates?

---

## SUCCESS METRICS

**You'll know you're ready to ship when**:
- ✅ Double-booking shows yellow warning but allows booking
- ✅ Client schedules display during lesson booking
- ✅ Revenue reports show accurate daily/weekly/monthly totals
- ✅ Recurring lessons generate correctly and show in calendar
- ✅ Rate limiting prevents spam without blocking normal use
- ✅ No security vulnerabilities in OWASP top 10

**Performance targets**:
- Calendar loads in <2 seconds with 100 lessons
- Lesson history loads in <1 second with 50 lessons per client
- Revenue report generates in <3 seconds for 1 month of data
- Conflict detection runs in <500ms

---

Good luck with your morning development session! Start with security hardening to get the critical stuff out of the way, then move to the more fun features like client schedules and conflict detection.
