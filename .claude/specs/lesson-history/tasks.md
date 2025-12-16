# Implementation Plan: Lesson History Feature

## Phase 1: Foundation & Server Actions

- [ ] 1. Create TypeScript type definitions for Lesson History feature
  - Create `/lib/types/lesson-history.ts` file with interfaces for `OutstandingLesson`, `LessonHistoryEntry`, `LessonHistorySummary`, `LessonHistoryFilters`, and `LessonHistorySortOptions`
  - Export all types for use across the application
  - _Requirements: 1.3, 2.3, 3.1-3.6_

- [ ] 2. Add error and success messages for Lesson History operations
  - Update `/lib/constants/messages.ts` with `LESSON_HISTORY` and `PAYMENT` message constants
  - Add error messages for fetch failures, confirmation failures, and payment update failures
  - Add success messages for confirmations and payment updates
  - _Requirements: All requirements - error handling_

- [ ] 3. Create lesson-history-actions.ts with getOutstandingLessons server action
  - Create `/app/actions/lesson-history-actions.ts` file with 'use server' directive
  - Implement `getOutstandingLessons()` function that queries lessons table for status='Scheduled' and end_time < NOW()
  - Include client relationship data in query using Supabase join syntax
  - Add authentication check and RLS filtering by coach_id
  - Return standardized response object with success/error/data fields
  - Write unit tests for successful query, empty results, and error cases
  - _Requirements: 1.2, 1.3, 2.1_

- [ ] 4. Implement confirmLesson server action
  - Add `confirmLesson(lessonId: string)` function to `/app/actions/lesson-history-actions.ts`
  - Validate lesson status is 'Scheduled' before confirmation
  - Update lesson status to 'Completed' in database
  - Verify coach ownership before allowing update
  - Return success response with message
  - Write unit tests for successful confirmation, validation failures, and authorization failures
  - _Requirements: 1.5, 2.2, 2.3_

- [ ] 5. Implement markLessonNoShow server action
  - Add `markLessonNoShow(lessonId: string)` function to `/app/actions/lesson-history-actions.ts`
  - Update lesson status to 'No Show' in database
  - Update associated invoice status to 'Canceled'
  - Verify coach ownership before allowing update
  - Return success response with message
  - Write unit tests for successful no-show marking and authorization checks
  - _Requirements: 1.6, 2.4_

## Phase 2: Outstanding Lessons Dashboard

- [ ] 6. Create Outstanding Lessons page structure
  - Create `/app/outstanding-lessons/page.tsx` as Server Component
  - Implement authentication check using `createClient()` from Supabase
  - Redirect to /login if user is not authenticated
  - Pass authenticated coach's user ID to client component
  - _Requirements: 1.1, 1.2_

- [ ] 7. Build OutstandingLessonsClient component
  - Create `/app/outstanding-lessons/OutstandingLessonsClient.tsx` as Client Component
  - Set up state management for lessons list, loading state, and error state
  - Implement useEffect to fetch outstanding lessons on mount using getOutstandingLessons server action
  - Display loading spinner during data fetch
  - Display error message if fetch fails with retry button
  - _Requirements: 1.2, 1.3_

- [ ] 8. Implement outstanding lessons card display
  - In OutstandingLessonsClient, map over lessons array to render individual lesson cards
  - Display client name, formatted date/time, service type (lesson title), and cost for each lesson
  - Use Tailwind classes: card container with `bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4`
  - Format currency values to 2 decimal places with dollar sign
  - Display empty state message when no outstanding lessons exist
  - _Requirements: 1.3, 1.4_

- [ ] 9. Add Confirm and No-Show action buttons
  - Add "Confirm Lesson Occurred" button to each lesson card with `bg-indigo-600 hover:bg-indigo-700` styling
  - Add "Mark No-Show" secondary button with `bg-gray-200 hover:bg-gray-300` styling
  - Implement onClick handlers that call confirmLesson and markLessonNoShow server actions
  - Show loading state on buttons during action execution (disable + spinner)
  - Optimistically remove lesson from UI on successful action
  - Display toast notification for success/error messages
  - Revalidate data on error to ensure UI consistency
  - _Requirements: 1.4, 1.5, 1.6_

- [ ] 10. Integrate Outstanding Lessons link in Dashboard
  - Update `/app/dashboard/page.tsx` to add Outstanding Lessons card to Quick Actions section
  - Create link to `/outstanding-lessons` route
  - Use yellow/amber background color scheme to distinguish from other cards
  - Add heading "Outstanding Lessons" with descriptive subtext
  - _Requirements: 1.1_

- [ ] 11. Implement outstanding lessons notification badge
  - Create helper function `getOutstandingLessonsCount()` in lesson-history-actions.ts that returns count only
  - Call this function in Dashboard server component to get count
  - Display red circular badge with count number next to Outstanding Lessons heading
  - Only show badge when count > 0
  - Use Tailwind classes: `bg-red-500 text-white rounded-full px-2 py-1 text-sm`
  - _Requirements: 2.5_

## Phase 3: Lesson History Display in Client Profile

- [ ] 12. Create getLessonHistory server action
  - Add `getLessonHistory(clientId: string, filters?: LessonHistoryFilters)` to `/app/actions/lesson-history-actions.ts`
  - Query lessons table with JOIN to invoices table to get payment_status and paid_at
  - Filter by client_id and status='Completed'
  - Apply optional payment status filter if provided in filters parameter
  - Apply optional date range filters if provided
  - Order results by start_time descending (newest first)
  - Verify coach ownership of client before returning data
  - Return array of LessonHistoryEntry objects
  - Write unit tests for query with various filter combinations
  - _Requirements: 3.1-3.6, 4.1, 4.2, 5.1-5.5_

- [ ] 13. Create calculateUnpaidBalance server action
  - Add `calculateUnpaidBalance(clientId: string)` to `/app/actions/lesson-history-actions.ts`
  - Query invoices table for client_id with payment_status IN ('Pending', 'Overdue')
  - Sum the amount_due values from all matching invoices
  - Return total as number with 2 decimal precision
  - Verify coach ownership before calculation
  - Write unit tests for various scenarios including zero balance
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 14. Create LessonHistoryTable component
  - Create `/components/LessonHistoryTable.tsx` as Client Component
  - Define component props interface accepting lessons array, client ID, and callback functions
  - Set up state for filtered data, sort options, and selected lesson
  - Render table structure with headers: Date, Time, Service Type, Duration, Rate/Cost, Payment Status, Actions
  - Use Tailwind responsive table classes with horizontal scroll on mobile
  - Map over lessons data to render table rows
  - Display empty state message when no lessons exist
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 15. Implement payment status filter controls
  - Add filter dropdown above table with options: All, Pending, Paid, Overdue
  - Store selected filter in component state
  - Implement filter logic that updates displayed lessons when filter changes
  - Apply filter by comparing lesson paymentStatus to selected filter value
  - Reset to "All" filter should show complete unfiltered list
  - Style dropdown with Tailwind form control classes
  - _Requirements: 5.1-5.5_

- [ ] 16. Implement sorting controls
  - Add sort controls above table with options for sort field (Date, Status) and order (Ascending, Descending)
  - Store sort configuration in component state
  - Implement sort logic using JavaScript array sort method
  - Sort by date should use ISO timestamp comparison
  - Sort by status should use alphabetical order of status strings
  - Apply sort after filtering but before rendering
  - Style controls with Tailwind classes matching filter dropdown
  - _Requirements: 6.1-6.4_

- [ ] 17. Display unpaid balance summary
  - Add summary section above the lesson history table
  - Call calculateUnpaidBalance on component mount and after payment status changes
  - Display "Outstanding Balance: $XX.XX" with bold styling
  - Show $0.00 when no unpaid lessons exist
  - Use green text color when balance is zero, amber/yellow when balance exists
  - Update balance reactively when payment status changes
  - _Requirements: 7.1-7.4_

- [ ] 18. Integrate Lesson History section into Client Profile
  - Update `/app/clients/[id]/ClientDetailClient.tsx` to import and render LessonHistoryTable component
  - Add new section below existing client details with heading "Lesson History"
  - Fetch lesson history data using getLessonHistory server action in useEffect
  - Pass lessons data and clientId as props to LessonHistoryTable
  - Add loading state while fetching data
  - Handle errors with error message display
  - _Requirements: 4.1_

## Phase 4: Payment Management

- [ ] 19. Implement markLessonAsPaid server action
  - Add `markLessonAsPaid(lessonId: string)` to `/app/actions/lesson-history-actions.ts`
  - Query invoices table to find invoice with matching lesson_id
  - Update payment_status to 'Paid' and set paid_at to current timestamp
  - Validate that lesson status is 'Completed' before allowing payment update
  - Verify coach ownership before allowing update
  - Return success response with updated invoice data
  - Write unit tests for successful payment marking and validation failures
  - _Requirements: 9.1-9.5_

- [ ] 20. Add Mark as Paid buttons to lesson history table
  - Add "Mark as Paid" button to Actions column for each lesson row where paymentStatus is 'Pending'
  - Style button with `bg-green-600 hover:bg-green-700 text-white` classes
  - Implement onClick handler that calls markLessonAsPaid server action
  - Show loading state on button during action (disable + spinner)
  - Optimistically update lesson paymentStatus in UI on success
  - Trigger unpaid balance recalculation after successful update
  - Display success toast notification
  - Handle errors by reverting optimistic update and showing error message
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 21. Implement markAllLessonsPaid server action
  - Add `markAllLessonsPaid(clientId: string)` to `/app/actions/lesson-history-actions.ts`
  - Query all invoices for client with payment_status='Pending'
  - Calculate total amount to be marked as paid for confirmation
  - Update all matching invoices to payment_status='Paid' and paid_at=NOW() in single transaction
  - Verify coach ownership before bulk update
  - Return success response with count of updated invoices and total amount
  - Write unit tests for successful bulk update and transaction rollback on error
  - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [ ] 22. Create bulk payment confirmation dialog component
  - Create `/components/BulkPaymentConfirmDialog.tsx` as Client Component
  - Define props interface accepting total amount, lesson count, onConfirm, and onCancel callbacks
  - Render modal overlay with semi-transparent backdrop
  - Display confirmation message with total amount and number of lessons
  - Show two buttons: "Confirm" (primary) and "Cancel" (secondary)
  - Call onConfirm callback when Confirm button clicked
  - Call onCancel callback when Cancel button or backdrop clicked
  - Use Tailwind modal styling classes
  - _Requirements: 10.2_

- [ ] 23. Add Mark All Paid button with confirmation dialog
  - Add "Mark All Paid" button in summary section next to unpaid balance display
  - Only show button when unpaid balance > 0, hide when balance is $0
  - Style with `bg-green-600 hover:bg-green-700 text-white font-semibold` classes
  - Implement onClick that opens BulkPaymentConfirmDialog with calculated total and count
  - On dialog confirmation, call markAllLessonsPaid server action
  - Show loading state during action execution
  - On success, update all pending lessons to paid status in UI
  - Update unpaid balance to $0.00
  - Display success toast with count of updated lessons
  - On error, show error message and keep UI unchanged
  - _Requirements: 10.1, 10.2, 10.5, 10.6_

- [ ] 24. Display payment confirmation date in lesson details
  - Update LessonHistoryTable to show paid_at timestamp when lesson is paid
  - Format date as "Paid on: MMM DD, YYYY" below payment status
  - Only display for lessons with paymentStatus='Paid'
  - Use muted text color (gray) for the payment date
  - _Requirements: 9.6_

## Phase 5: Lesson Details & Notes

- [ ] 25. Create LessonDetailModal component structure
  - Create `/components/LessonDetailModal.tsx` as Client Component
  - Define props interface accepting lesson data, isOpen boolean, onClose callback, and onSaveNote callback
  - Render modal overlay with backdrop that closes on click
  - Create modal content container with white background and rounded corners
  - Add close button (X) in top-right corner
  - Display all lesson fields: client name, date, time, duration, service type, location, rate, payment status
  - Use Tailwind modal styling with `fixed inset-0 z-50` for overlay
  - _Requirements: 8.1, 8.2_

- [ ] 26. Implement notes display and editing in modal
  - Add textarea field in modal for lesson notes
  - Pre-populate textarea with existing notes from lesson data
  - Make textarea editable with appropriate styling
  - Add "Save Note" button below textarea
  - Implement button onClick that calls onSaveNote callback with new note text
  - Show loading state on button during save
  - Display success message when note is saved
  - _Requirements: 8.3, 8.4_

- [ ] 27. Create saveLessonNote server action
  - Add `saveLessonNote(lessonId: string, note: string)` to `/app/actions/lesson-history-actions.ts`
  - Update lessons table description field with provided note text
  - Verify coach ownership before allowing update
  - Return success response with message
  - Write unit tests for successful note save and authorization checks
  - _Requirements: 8.4_

- [ ] 28. Add View Details action to lesson history table
  - Add "View Details" button or link to Actions column in each table row
  - Style as secondary button or text link with `text-indigo-600 hover:text-indigo-800`
  - Implement onClick that opens LessonDetailModal with selected lesson data
  - Pass lesson data to modal component
  - Handle modal close by setting isOpen state to false
  - Connect onSaveNote callback to saveLessonNote server action
  - Refresh lesson history data after note is saved
  - _Requirements: 8.1_

## Phase 6: Testing & Polish

- [ ] 29. Write integration tests for Outstanding Lessons workflow
  - Create test file `/tests/integration/outstanding-lessons.test.ts`
  - Test complete flow: schedule lesson → time passes → appears in outstanding → confirm → appears in history
  - Test no-show flow: schedule lesson → mark no-show → does not appear in history
  - Test authorization: verify coach A cannot see coach B's outstanding lessons
  - Use Jest and testing-library for assertions
  - _Requirements: All Phase 1-2 requirements_

- [ ] 30. Write integration tests for Payment Status workflow
  - Create test file `/tests/integration/payment-tracking.test.ts`
  - Test individual payment: confirm lesson → mark as paid → balance updates
  - Test bulk payment: multiple unpaid → mark all paid → balance = $0
  - Test filter and sort: verify filtering by status and sorting by date
  - Test payment date display after marking paid
  - _Requirements: All Phase 4 requirements_

- [ ] 31. Write component tests for OutstandingLessonsClient
  - Create test file `/tests/components/OutstandingLessonsClient.test.tsx`
  - Test loading state renders spinner
  - Test lessons list displays correctly with proper formatting
  - Test confirm button calls server action and updates UI
  - Test no-show button calls server action and updates UI
  - Test empty state displays when no lessons
  - Test error state displays with retry button
  - _Requirements: 1.2-1.6, 2.5_

- [ ] 32. Write component tests for LessonHistoryTable
  - Create test file `/tests/components/LessonHistoryTable.test.tsx`
  - Test table renders with correct columns and data
  - Test filter dropdown changes displayed results
  - Test sort controls reorder table rows correctly
  - Test unpaid balance displays correctly
  - Test Mark as Paid button updates UI and balance
  - Test Mark All Paid shows confirmation dialog
  - Test View Details opens modal
  - _Requirements: 4.1-4.4, 5.1-5.5, 6.1-6.4, 7.1-7.4_

- [ ] 33. Implement responsive design for mobile devices
  - Update LessonHistoryTable to use horizontal scroll on mobile screens
  - Update outstanding lessons cards to stack vertically on small screens
  - Adjust button sizes for touch targets on mobile
  - Test layout on viewport widths: 320px, 375px, 768px, 1024px, 1440px
  - Use Tailwind responsive breakpoints: sm:, md:, lg:, xl:
  - Ensure modals are properly sized and centered on all screen sizes
  - _Requirements: All UI requirements - responsive design constraint_

- [ ] 34. Add loading skeletons for better UX
  - Create skeleton loader components for outstanding lessons cards
  - Create skeleton loader for lesson history table
  - Display skeletons during initial data fetch
  - Use Tailwind animate-pulse class for shimmer effect
  - Match skeleton shapes to actual content layout
  - _Requirements: User experience improvement_

- [ ] 35. Implement optimistic UI updates for all actions
  - Update confirmLesson action to optimistically remove lesson from UI before server response
  - Update markLessonAsPaid to optimistically change status to Paid before server response
  - Update markAllLessonsPaid to optimistically update all lessons before server response
  - Implement rollback logic for all optimistic updates if server action fails
  - Show subtle loading indicators during optimistic updates
  - _Requirements: Performance and UX constraints_

- [ ] 36. Add error boundary for graceful error handling
  - Create `/app/outstanding-lessons/error.tsx` error boundary component
  - Create `/components/ErrorBoundary.tsx` reusable error boundary
  - Wrap LessonHistoryTable and OutstandingLessonsClient in error boundaries
  - Display user-friendly error messages with retry options
  - Log errors to console for debugging
  - _Requirements: Error handling across all requirements_

- [ ] 37. Performance optimization: Add pagination to lesson history
  - Implement pagination controls in LessonHistoryTable (Previous/Next buttons)
  - Update getLessonHistory to accept limit and offset parameters
  - Fetch lessons in pages of 20 items
  - Show current page indicator and total pages
  - Maintain filter and sort state across page changes
  - Only implement if performance testing shows need (client has 100+ lessons)
  - _Requirements: Performance constraint for 100+ entries_

- [ ] 38. Add database indexes for query optimization
  - Add composite index on lessons table: (coach_id, status, end_time)
  - Add composite index on lessons table: (client_id, status, start_time)
  - Add composite index on invoices table: (client_id, payment_status)
  - Create migration file in `/supabase/migrations/` with index creation SQL
  - Test query performance before and after index addition
  - _Requirements: Performance constraints_

- [ ] 39. Implement real-time updates for outstanding lessons count
  - Set up Supabase Realtime subscription for lessons table changes
  - Subscribe to INSERT, UPDATE, DELETE events where coach_id matches
  - Update outstanding lessons count badge in real-time when lessons are confirmed
  - Implement subscription cleanup on component unmount
  - Handle reconnection logic for dropped connections
  - _Requirements: Real-time synchronization constraint_

- [ ] 40. Final end-to-end testing and bug fixes
  - Test complete user journey: Dashboard → Outstanding Lessons → Confirm → Client Profile → Mark Paid
  - Test all edge cases: zero-cost lessons, late confirmations, accidental payments
  - Verify all error messages display correctly
  - Verify all success messages display correctly
  - Test dark mode styling on all components
  - Fix any bugs discovered during testing
  - Verify accessibility: keyboard navigation, screen reader compatibility
  - _Requirements: All requirements final validation_
