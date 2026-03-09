# Implementation Plan

- [x] 1. Create the useTutorial hook
  - Create `hooks/useTutorial.ts`
  - On mount, call `supabase.auth.getUser()` and read `user.user_metadata.has_seen_tutorial`
  - Set `showTutorial = true` if flag is missing or false, default to false on error
  - `closeTutorial` calls `supabase.auth.updateUser({ data: { has_seen_tutorial: true } })` then sets `showTutorial = false`
  - `openTutorial` sets `showTutorial = true` without touching metadata
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Build the TutorialModal component
  - Create `components/TutorialModal.tsx`
  - Define the 5 slides as a static array (Welcome, Calendar, Clients, Lesson Types, Financials) with title, description, and color
  - Manage `currentSlide` state (0-4)
  - Render dark backdrop (`bg-black/60 backdrop-blur-sm`) that blocks page interaction
  - Render centered card with colored icon circle, title, description
  - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 2.1 Add slide navigation and progress dots to TutorialModal
  - Render progress dots - filled for current/past, outline for future
  - Show "Skip" button on slides 0-3, calling `onClose`
  - Show "Next" button on slides 0-3, advancing `currentSlide`
  - Show "Get Started" button on slide 4, calling `onClose`
  - _Requirements: 1.3, 1.4, 1.5, 1.7, 1.8_

- [x] 3. Integrate TutorialModal into CalendarPageClient
  - Import `useTutorial` hook and `TutorialModal` into `app/calendar/CalendarPageClient.tsx`
  - Render `<TutorialModal onClose={closeTutorial} />` when `showTutorial` is true
  - _Requirements: 1.1, 1.6_

- [x] 4. Build the AccordionFAQ component
  - Create `components/AccordionFAQ.tsx`
  - Accept `items: { id, title, content }[]` as props
  - Manage `openItem: string | null` state
  - Clicking an item toggles it open; clicking an open item closes it
  - Only one item open at a time
  - Use a chevron icon that rotates when open
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Add Help & Getting Started section to SettingsClient
  - Add local `showTutorial` state to `app/settings/SettingsClient.tsx`
  - Add a new card below the Account card titled "Help & Getting Started"
  - Add "Replay Tutorial" button that sets `showTutorial = true`
  - Render `<TutorialModal onClose={() => setShowTutorial(false)} />` when `showTutorial` is true
  - Render `<AccordionFAQ items={faqItems} />` below the replay button with the 5 feature FAQ items
  - _Requirements: 3.1, 3.2, 3.3, 4.1_
