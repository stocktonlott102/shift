# Shift - Launch Roadmap
**Last Updated:** March 7, 2026
**Status:** Pre-launch / App store prep

---

## Security Status
- ✅ Profiles RLS - confirmed applied (rowsecurity = true)
- ✅ Rate limiting with Upstash Redis - applied to all server actions
- ✅ Zod validation - applied to all server actions
- ✅ Database indexes - applied
- ✅ Audit logging system - built
- ⚠️ Verify `get_lesson_participants()` RLS fix is applied (run in Supabase SQL Editor):
  ```sql
  SELECT * FROM get_lesson_participants('00000000-0000-0000-0000-000000000000');
  -- Should return: ERROR: Access denied: You do not own this lesson
  ```
- ✅ Security headers - added to next.config.ts
- ❌ Sentry error monitoring - not set up

---

## Must-Do Before Launch

### ~~1. Security Headers~~ ✅ Done
HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy added to `next.config.ts`.

### 2. Sentry Error Monitoring
Zero visibility into production errors right now. Free tier, ~1 hour to set up with Next.js. Need this before real users are on the app.

### ~~3. Privacy Policy & Terms of Service Pages~~ ✅ Done
Pages at `/privacy-policy` and `/terms`. Linked from Settings footer and signup page.

---

## App Store Launch

### Decision: PWA First, React Native Later
Ship the existing web app as a PWA to get into the App Store quickly. No second codebase. Once live and users give mobile feedback, build React Native (Expo) for a native app.

### PWA Setup
- Add `manifest.json` with app name, icons, theme color
- Add service worker for offline calendar viewing (read-only)
- Add "Add to Home Screen" prompt
- Submit via Capacitor or PWABuilder

### What the App Store Requires
- [ ] Privacy Policy page (URL required on submission)
- [ ] Terms of Service page
- [ ] App icon in all required sizes
- [ ] App Store screenshots (at least 3 per device size)
- [ ] App description copy
- [ ] Apple Developer account ($99/year) - if not already active
- [ ] Push notifications for lesson reminders

### Push Notifications
Once PWA or React Native is set up, add push notifications for:
- Upcoming lesson reminders (day before)
- Payment marked as received

---

## High-Impact UX Improvements

### Empty States
Several pages show nothing (or a plain message) when there's no data. New users will feel the app is broken. Need illustrated empty states with clear CTAs on:
- Calendar (no lessons yet)
- Clients (no clients yet)
- Lesson Types (no types yet - partially done)
- Financials (no data for selected month)

---

## Phase 2 (After Launch - Evaluate Based on User Feedback)

### iCal / Calendar Export
Coaches will want their Shift schedule in Apple Calendar or Google Calendar. One-way iCal export is simple and covers 80% of the need.

### Invoice Generation (On Pause)
PDF invoice generation was in the original PRD. Paused for now - revisit after launch based on user demand.

---

## Dropped / Not Doing
- Conflict detection / double-booking warnings - not needed
- Post-lesson notes in lesson flow - not needed
- Expanded client profile fields (phone, parent names, availability) - not needed
- SMS reminders via Twilio - not wanted
- Team/multi-coach model - not in scope

---

## React Native App (Future)
After the PWA is live and validated, build a proper React Native app with Expo. This shares all the Supabase/API logic with the web app. Better native feel, better performance, proper push notifications. This is the right long-term end state for the app store.
