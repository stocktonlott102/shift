# Requirements Document

## Introduction

Shift needs a first-time onboarding experience for new users and a persistent help reference in Settings. When a coach logs in for the first time, a clean modal walkthrough introduces them to each core feature of the app. After dismissing, they can replay the tutorial or access quick feature explanations from the Settings page at any time.

## Requirements

### Requirement 1: First-Login Tutorial Modal

**User Story:** As a new coach, I want to see a guided introduction when I first log in, so that I understand what Shift does and how to navigate it without feeling lost.

#### Acceptance Criteria
1. WHEN a user logs in for the first time THEN the system SHALL display a full-screen modal overlay with a slide-based tutorial before any other interaction.
2. WHEN the tutorial modal is displayed THEN the system SHALL show 5 slides covering: Welcome, Calendar, Clients, Lesson Types, and Financials.
3. WHEN a user is on any slide THEN the system SHALL display a "Next" button to advance and a "Skip" button to dismiss the modal entirely.
4. WHEN a user reaches the last slide THEN the system SHALL replace "Next" with a "Get Started" button that dismisses the modal.
5. WHEN a user clicks "Skip" or "Get Started" THEN the system SHALL dismiss the modal and mark the tutorial as seen.
6. WHEN the tutorial is dismissed THEN the system SHALL NOT show the tutorial modal again on subsequent logins.
7. WHEN the tutorial modal is open THEN the system SHALL display progress dots indicating the current slide position.
8. WHEN the tutorial modal is open THEN the system SHALL prevent interaction with the underlying page content.

### Requirement 2: Tutorial State Persistence

**User Story:** As a returning coach, I want the tutorial to only appear once, so that I am not interrupted every time I log in.

#### Acceptance Criteria
1. WHEN a user dismisses the tutorial THEN the system SHALL store a `has_seen_tutorial` flag in the user's Supabase user metadata.
2. WHEN a user logs in and the `has_seen_tutorial` flag is true THEN the system SHALL NOT display the tutorial modal.
3. IF the `has_seen_tutorial` flag is missing or false THEN the system SHALL treat the user as a first-time user and display the tutorial.

### Requirement 3: Tutorial Replay from Settings

**User Story:** As a coach, I want to be able to replay the tutorial from Settings, so that I can revisit the walkthrough if I need a refresher.

#### Acceptance Criteria
1. WHEN a user navigates to the Settings page THEN the system SHALL display a "Help & Getting Started" section.
2. WHEN a user clicks "Replay Tutorial" in Settings THEN the system SHALL display the tutorial modal starting from slide 1.
3. WHEN the tutorial is replayed from Settings and dismissed THEN the system SHALL return the user to the Settings page.

### Requirement 4: Feature Reference in Settings

**User Story:** As a coach, I want quick explanations of each feature available in Settings, so that I can look up how something works without replaying the full tutorial.

#### Acceptance Criteria
1. WHEN a user views the "Help & Getting Started" Settings section THEN the system SHALL display 5 accordion items, one per core feature: Calendar, Dashboard, Clients, Lesson Types, and Financials.
2. WHEN a user clicks an accordion item THEN the system SHALL expand it to reveal a 2-3 sentence explanation of that feature and how to use it.
3. WHEN a user clicks an already-open accordion item THEN the system SHALL collapse it.
4. WHEN multiple accordion items are present THEN the system SHALL allow only one to be open at a time.

### Requirement 5: Tutorial Slide Content

**User Story:** As a new coach, I want each tutorial slide to be clear and concise, so that I can quickly understand each feature without reading a wall of text.

#### Acceptance Criteria
1. WHEN the tutorial displays slide 1 (Welcome) THEN the system SHALL show a welcome message, the Shift logo/brand, and a brief description of what Shift is for.
2. WHEN the tutorial displays slide 2 (Calendar) THEN the system SHALL show the calendar icon, a title, and 1-2 sentences explaining that this is the main workspace for scheduling lessons and time blocks.
3. WHEN the tutorial displays slide 3 (Clients) THEN the system SHALL show the clients icon, a title, and 1-2 sentences explaining how to build and manage a client roster.
4. WHEN the tutorial displays slide 4 (Lesson Types) THEN the system SHALL show the lesson types icon, a title, and 1-2 sentences explaining how to define services and rates.
5. WHEN the tutorial displays slide 5 (Financials) THEN the system SHALL show the financials icon, a title, and 1-2 sentences explaining how to track payments and outstanding balances.
6. WHEN any slide is displayed THEN the system SHALL use the existing app color palette (indigo, violet, emerald) consistent with the dashboard card colors.
