# Lesson Types Feature - Product Requirements Document

**Feature**: Lesson Types with Multi-Client Support and Rate Splitting
**Created**: 2025-12-16
**Status**: Implementation Planning

---

## Executive Summary

Replace the current client-based hourly rate system with a flexible **Lesson Types** system that allows coaches to:
- Define reusable lesson types with custom rates and colors
- Add multiple clients to any lesson (automatic rate splitting)
- Create custom one-off lessons with unique rates
- Manage lesson types from the Dashboard

---

## Current System vs. New System

### Current System
- Each client has an `hourly_rate` field
- Lesson title is free-form text input
- One client per lesson
- Rate pulled from client profile at booking time

### New System
- **Lesson Types** define rates (no client-specific rates)
- Lesson type selected from dropdown (with "Custom" option)
- Multiple clients can be added to any lesson
- Rate automatically splits among participants
- Auto-generated lesson titles (editable)

---

## Core Requirements

### 1. Lesson Type Structure

**Database Schema** (`lesson_types` table):
```sql
- id: uuid (primary key)
- coach_id: uuid (foreign key to auth.users)
- name: text (e.g., "Private Lesson", "Group Session", "Clinic")
- hourly_rate: decimal (base rate per hour for this lesson type)
- color: text (hex color for calendar display, e.g., "#3B82F6")
- title_template: text (e.g., "Private Lesson with {client_names}")
- is_active: boolean (for soft deletes/archiving)
- created_at: timestamp
- updated_at: timestamp
```

**Key Rules**:
- Rate is **total for the lesson**, split among participants
- Example: $60/hour lesson type with 2 clients for 30 min = $15 per client
- Coaches can add multiple clients to ANY lesson type (no restriction)
- Lesson types can be edited (affects future lessons only)
- Lesson types can be deleted/archived

### 2. Rate Calculation Logic

**Formula**:
```
total_lesson_cost = hourly_rate × (duration_minutes / 60)
per_client_cost = total_lesson_cost / number_of_clients
```

**Example 1**: Private Lesson
- Lesson Type: "Private Lesson" ($60/hour)
- Duration: 30 minutes
- Clients: 1 (Johnny)
- Total Cost: $30
- Per Client: $30

**Example 2**: Group Lesson
- Lesson Type: "Group Session" ($60/hour)
- Duration: 30 minutes
- Clients: 2 (Johnny, Sarah)
- Total Cost: $30
- Per Client: $15 each

**Example 3**: Custom Lesson
- Lesson Type: "Custom"
- Duration: 45 minutes
- Custom Rate: $80/hour
- Clients: 3 (Johnny, Sarah, Mike)
- Total Cost: $60
- Per Client: $20 each

### 3. Lesson Title Auto-Generation

**Template System**:
- Coaches set a title template in lesson type (e.g., "Private Lesson with {client_names}")
- System replaces `{client_names}` with actual client names
- Title is editable per lesson after generation

**Multiple Client Handling**:
- 1 client: "Private Lesson with Johnny"
- 2 clients: "Private Lesson with Johnny and Sarah"
- 3+ clients: "Private Lesson with Johnny, Sarah and 2 others"
- **Length cap**: Max 100 characters (truncate with "... and X others")

**Custom Lesson Type**:
- No template, coach enters title manually during booking

### 4. Lesson Booking Flow (Updated)

**Old Flow**:
1. Select client
2. Enter lesson title (free text)
3. Select date/time
4. Rate auto-filled from client profile

**New Flow**:
1. Select lesson type from dropdown (or "Custom")
2. If "Custom": Enter custom rate + custom title
3. Select client(s) - multi-select dropdown
4. Select date/time
5. Title auto-generated (editable)
6. Rate calculated and displayed

### 5. Multi-Client Support

**Requirements**:
- Any lesson can have 1+ clients (no minimum/maximum)
- Rate splits evenly among all clients
- Each client sees their portion in Outstanding Lessons
- Calendar shows all client names (or truncated list)

**Outstanding Lessons Display**:
- Each participant gets a separate entry with their split cost
- Example: Group lesson with Johnny ($15) and Sarah ($15) shows as:
  - Johnny sees: "Group Session - $15.00"
  - Sarah sees: "Group Session - $15.00"

### 6. Lesson Type Management UI

**Location**: Dashboard → "Manage Lesson Types" button/card

**CRUD Operations**:
- **Create**: Name, hourly rate, color picker, title template
- **Read**: List all active lesson types
- **Update**: Edit name, rate, color, template (affects future lessons only)
- **Delete**: Soft delete (mark `is_active = false`)

**Validation**:
- Name: Required, max 50 characters
- Hourly Rate: Required, positive number, max $999/hour
- Color: Required, valid hex color
- Title Template: Required, max 100 characters, must contain `{client_names}`

**Built-in Lesson Type**:
- "Custom" is a system-reserved type (cannot be edited/deleted)
- Always available in booking dropdown

### 7. Calendar Display Updates

**Requirements**:
- Lessons display with lesson type color
- Show lesson title (truncated if needed)
- Show all client names or "X clients" for groups
- Clicking lesson shows full details

### 8. Migration Strategy

**Database Changes**:
1. Create `lesson_types` table
2. Add `lesson_type_id` column to `lessons` table (nullable initially)
3. Create junction table `lesson_participants` (many-to-many)
4. Remove `client_id` from `lessons` table (replaced by junction table)
5. Keep `rate_at_booking` in `lessons` table (for historical data)

**Data Migration**:
- **Option C Selected**: Require coaches to set up lesson types before booking
- Do NOT migrate existing client hourly rates
- Remove `hourly_rate` field from client profiles
- Existing lessons keep their historical `rate_at_booking` and single client

**Client Profile Changes**:
- Remove "Hourly Rate" field from client creation/edit forms
- Remove hourly rate display from client list/detail pages
- Keep all other client fields unchanged

### 9. Affected Pages/Components

**Pages to Update**:
1. `/app/dashboard/page.tsx` - Add "Manage Lesson Types" card
2. `/app/lesson-types/*` - New pages for CRUD operations
3. `/app/calendar/*` - Update booking form to use lesson types
4. `/app/clients/*` - Remove hourly rate fields
5. `/app/outstanding-lessons/*` - Show split rates per participant

**Components to Create**:
1. `LessonTypeSelector` - Dropdown with lesson types
2. `ClientMultiSelect` - Multi-select for clients
3. `LessonTypeForm` - Create/edit lesson types
4. `LessonTypeList` - Display all lesson types

**Database Actions to Create**:
1. `lesson-type-actions.ts` - CRUD for lesson types
2. Update `lesson-actions.ts` - Handle multi-client bookings
3. Update `lesson-history-actions.ts` - Handle split rate calculations

---

## Implementation Phases

### Phase 1: Database & Core Infrastructure
- [ ] Create `lesson_types` table with RLS policies
- [ ] Create `lesson_participants` junction table
- [ ] Add `lesson_type_id` to `lessons` table
- [ ] Create TypeScript types for lesson types
- [ ] Create server actions for lesson type CRUD

### Phase 2: Lesson Type Management UI
- [ ] Create `/app/lesson-types/page.tsx` - List view
- [ ] Create `/app/lesson-types/new/page.tsx` - Create form
- [ ] Create `/app/lesson-types/[id]/edit/page.tsx` - Edit form
- [ ] Add "Manage Lesson Types" card to Dashboard
- [ ] Implement color picker component
- [ ] Add validation and error handling

### Phase 3: Update Client Management
- [ ] Remove `hourly_rate` from client schema
- [ ] Update client creation form (remove rate field)
- [ ] Update client edit form (remove rate field)
- [ ] Update client list display (remove rate display)
- [ ] Update client detail page (remove rate display)

### Phase 4: Update Lesson Booking
- [ ] Update calendar booking form to use lesson types
- [ ] Implement lesson type selector dropdown
- [ ] Implement multi-client selector
- [ ] Add custom lesson type handling (custom rate + title)
- [ ] Implement auto-title generation logic
- [ ] Update rate calculation to split among participants
- [ ] Update booking validation

### Phase 5: Update Calendar & Outstanding Lessons
- [ ] Update calendar display to show lesson type colors
- [ ] Update calendar event details to show all participants
- [ ] Update outstanding lessons to show split rates per client
- [ ] Create separate outstanding lesson entries per participant
- [ ] Update lesson confirmation to mark all participants

### Phase 6: Testing & Polish
- [ ] Test rate splitting calculations
- [ ] Test multi-client booking flow
- [ ] Test lesson type editing (ensure past lessons unchanged)
- [ ] Test lesson type deletion
- [ ] Test title truncation for large groups
- [ ] Test custom lesson type flow
- [ ] Add loading states and error handling

---

## Technical Specifications

### Database Schema

**`lesson_types` Table**:
```sql
CREATE TABLE lesson_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate > 0),
  color TEXT NOT NULL DEFAULT '#3B82F6',
  title_template TEXT NOT NULL DEFAULT '{client_names}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE lesson_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own lesson types"
  ON lesson_types FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create own lesson types"
  ON lesson_types FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own lesson types"
  ON lesson_types FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own lesson types"
  ON lesson_types FOR DELETE
  USING (auth.uid() = coach_id);
```

**`lesson_participants` Junction Table**:
```sql
CREATE TABLE lesson_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount_owed DECIMAL(10,2) NOT NULL CHECK (amount_owed >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id, client_id)
);

-- RLS Policies
ALTER TABLE lesson_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own lesson participants"
  ON lesson_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      WHERE lessons.id = lesson_participants.lesson_id
      AND lessons.coach_id = auth.uid()
    )
  );

-- Similar policies for INSERT, UPDATE, DELETE
```

**Update `lessons` Table**:
```sql
-- Add lesson_type_id column
ALTER TABLE lessons
  ADD COLUMN lesson_type_id UUID REFERENCES lesson_types(id) ON DELETE SET NULL;

-- Remove client_id (replaced by junction table)
-- NOTE: This is a breaking change, requires data migration
ALTER TABLE lessons DROP COLUMN client_id;

-- Keep rate_at_booking for historical records
-- (already exists, no changes needed)
```

### TypeScript Types

```typescript
// lib/types/lesson-type.ts
export interface LessonType {
  id: string;
  coach_id: string;
  name: string;
  hourly_rate: number;
  color: string;
  title_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLessonTypeInput {
  name: string;
  hourly_rate: number;
  color: string;
  title_template: string;
}

export interface UpdateLessonTypeInput {
  name?: string;
  hourly_rate?: number;
  color?: string;
  title_template?: string;
}

// lib/types/lesson.ts (updated)
export interface LessonParticipant {
  id: string;
  lesson_id: string;
  client_id: string;
  amount_owed: number;
  client?: Client; // Joined data
}

export interface Lesson {
  id: string;
  coach_id: string;
  lesson_type_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  rate_at_booking: number;
  status: 'scheduled' | 'completed' | 'no_show' | 'canceled';
  participants?: LessonParticipant[]; // Joined data
  lesson_type?: LessonType; // Joined data
}
```

### Rate Calculation Function

```typescript
// lib/utils/rate-calculator.ts
export function calculateLessonCost(
  hourlyRate: number,
  startTime: Date,
  endTime: Date
): number {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return hourlyRate * durationHours;
}

export function calculatePerClientCost(
  totalCost: number,
  numClients: number
): number {
  if (numClients === 0) return 0;
  return totalCost / numClients;
}

export function calculateSplitRates(
  hourlyRate: number,
  startTime: Date,
  endTime: Date,
  numClients: number
): { totalCost: number; perClient: number } {
  const totalCost = calculateLessonCost(hourlyRate, startTime, endTime);
  const perClient = calculatePerClientCost(totalCost, numClients);
  return { totalCost, perClient };
}
```

### Title Generation Function

```typescript
// lib/utils/title-generator.ts
const MAX_TITLE_LENGTH = 100;

export function generateLessonTitle(
  template: string,
  clientNames: string[]
): string {
  if (clientNames.length === 0) {
    return template.replace('{client_names}', 'Unknown');
  }

  let clientText: string;

  if (clientNames.length === 1) {
    clientText = clientNames[0];
  } else if (clientNames.length === 2) {
    clientText = `${clientNames[0]} and ${clientNames[1]}`;
  } else {
    // 3+ clients: "Name1, Name2 and X others"
    const remaining = clientNames.length - 2;
    clientText = `${clientNames[0]}, ${clientNames[1]} and ${remaining} other${remaining > 1 ? 's' : ''}`;
  }

  let title = template.replace('{client_names}', clientText);

  // Truncate if too long
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.substring(0, MAX_TITLE_LENGTH - 3) + '...';
  }

  return title;
}
```

---

## User Stories

### US-1: Coach Creates Lesson Type
**As a** coach
**I want to** create a lesson type with a name, rate, and color
**So that** I can reuse it when booking lessons

**Acceptance Criteria**:
- Coach can navigate to "Manage Lesson Types" from Dashboard
- Coach can create a new lesson type with name, hourly rate, color, and title template
- System validates all required fields
- Lesson type appears in booking dropdown immediately
- Success message shown after creation

### US-2: Coach Books Lesson with Multiple Clients
**As a** coach
**I want to** add multiple clients to a single lesson
**So that** I can run group sessions and split the cost

**Acceptance Criteria**:
- Coach can select multiple clients from dropdown
- System calculates and displays split rate per client
- Title auto-generates with all client names (or truncated)
- Each client sees their portion in Outstanding Lessons
- Calendar shows all participants or "X clients"

### US-3: Coach Edits Lesson Type Rate
**As a** coach
**I want to** update the hourly rate for a lesson type
**So that** future lessons use the new rate without affecting past lessons

**Acceptance Criteria**:
- Coach can edit existing lesson type
- Rate change only affects lessons booked AFTER the update
- Past lessons retain their original `rate_at_booking`
- System shows confirmation before saving changes

### US-4: Coach Books Custom Lesson
**As a** coach
**I want to** create a one-off lesson with a custom rate and title
**So that** I can handle special situations

**Acceptance Criteria**:
- Coach selects "Custom" from lesson type dropdown
- System prompts for custom hourly rate and title
- Coach can add multiple clients (rate still splits)
- Custom lesson does not create a new lesson type
- Lesson saved with custom values

### US-5: Client Views Split Cost in Outstanding Lessons
**As a** client (coach viewing client data)
**I want to** see only my portion of a group lesson cost
**So that** I know exactly what I owe

**Acceptance Criteria**:
- Client sees their individual portion (not total lesson cost)
- Outstanding Lessons shows "Group Session - $15.00" (not $30)
- Confirming payment only marks that client as paid
- Other participants remain in Outstanding until confirmed

---

## Open Questions & Future Enhancements

### Answered Questions
- ✅ **Q**: Should lesson types restrict number of clients?
  **A**: No, any lesson can have multiple clients

- ✅ **Q**: Should clients have individual rates?
  **A**: No, remove client `hourly_rate` field entirely

- ✅ **Q**: How to handle existing client rates?
  **A**: Option C - Require lesson type setup before booking

- ✅ **Q**: How to calculate group lesson rates?
  **A**: Total lesson cost divided evenly among participants

### Future Enhancements
- [ ] Option to set per-participant rates for specific lesson types
- [ ] Discount codes or promotional pricing
- [ ] Recurring lesson templates (e.g., "Every Tuesday at 3pm")
- [ ] Lesson packages (e.g., "Buy 10 lessons, get 1 free")
- [ ] Waitlist functionality for group lessons
- [ ] Maximum capacity limits for group lessons
- [ ] Client-specific rate overrides (opt-in feature)

---

## Success Metrics

**Launch Criteria**:
- Coaches can create at least 1 lesson type before booking
- Coaches can book lessons with 1+ clients
- Rate splitting works correctly for all scenarios
- Outstanding Lessons shows individual portions
- No regression on existing lesson functionality

**Post-Launch Metrics**:
- % of coaches using multiple lesson types (target: >50%)
- % of lessons booked as group sessions (target: >20%)
- Average number of lesson types per coach (target: 3+)
- User satisfaction with new booking flow (survey)

---

## Technical Debt & Considerations

**Breaking Changes**:
- Removes `client.hourly_rate` field (affects client forms/displays)
- Changes `lessons` table structure (removes `client_id`, adds `lesson_type_id`)
- Requires new junction table for multi-client support

**Backward Compatibility**:
- Existing lessons retain their original structure
- Historical data preserved with `rate_at_booking`
- Old lessons won't have lesson type (nullable `lesson_type_id`)

**Performance Considerations**:
- Junction table adds complexity to queries (use JOINs efficiently)
- Calendar may need optimization for lessons with many participants
- Consider pagination for lesson type list if coaches create many types

**Security Considerations**:
- RLS policies ensure coaches only see/edit their own lesson types
- Validate that all selected clients belong to the authenticated coach
- Prevent rate manipulation on the client side (server-side validation)

---

**End of PRD**
