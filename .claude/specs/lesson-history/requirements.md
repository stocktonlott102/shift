# Requirements Document

## Introduction
The Lesson History feature establishes a critical data connection between the Calendar and Client Profile systems to support future invoicing capabilities. This feature implements a two-step workflow: first, coaches confirm that scheduled lessons actually occurred through an Outstanding Lessons dashboard; second, confirmed lessons are logged to the client's payment history where coaches can track and manage payment status. The system provides coaches with comprehensive visibility into unpaid lessons at both the global level (all clients) and individual client level, with streamlined tools for marking payments as complete.

## Requirements

### Requirement 1: Outstanding Lessons Dashboard
**User Story:** As a coach, I want to see all scheduled lessons that need confirmation in a central dashboard, so that I can review and confirm which sessions actually occurred before they appear in payment tracking.

#### Acceptance Criteria
1. WHEN navigating to the main menu THEN the system SHALL display an "Outstanding Lessons" section
2. WHEN viewing Outstanding Lessons THEN the system SHALL show all scheduled lessons that have passed their scheduled time but have not been confirmed
3. WHEN displaying an outstanding lesson THEN the system SHALL show the client name, date, time, service type, and cost
4. WHEN viewing Outstanding Lessons THEN the system SHALL provide a "Confirm Lesson Occurred" action for each entry
5. WHEN a lesson is confirmed THEN the system SHALL remove it from Outstanding Lessons and add it to the client's Lesson History with payment status "Pending"
6. IF a lesson did not occur THEN the system SHALL provide an option to mark it as "Cancelled" or "No-Show"

### Requirement 2: Lesson Confirmation Workflow
**User Story:** As a coach, I want to manually confirm that scheduled lessons actually occurred, so that only real sessions are tracked for payment purposes.

#### Acceptance Criteria
1. WHEN a scheduled lesson's end time passes THEN the system SHALL automatically add it to the Outstanding Lessons queue
2. WHEN confirming a lesson occurred THEN the system SHALL create a new entry in the corresponding client's Lesson History section
3. WHEN a lesson is confirmed THEN the system SHALL capture the date, time, service type, duration, rate/cost, and set payment status to "Pending"
4. IF a lesson is marked as cancelled or no-show THEN the system SHALL remove it from Outstanding Lessons without adding to payment history
5. WHEN Outstanding Lessons exist THEN the system SHALL display a notification badge with the count of unconfirmed lessons

### Requirement 3: Complete Data Capture
**User Story:** As a coach, I want each lesson entry to contain all billing-relevant information, so that I can generate accurate invoices in the future.

#### Acceptance Criteria
1. WHEN a lesson is logged THEN the system SHALL record the exact date and time of the lesson
2. WHEN a lesson is logged THEN the system SHALL capture the service type (e.g., '60 min training', '90 min consultation')
3. WHEN a lesson is logged THEN the system SHALL calculate and store the duration from start/end time
4. WHEN a lesson is logged THEN the system SHALL record the rate/cost applied to that specific lesson
5. WHEN a lesson is logged THEN the system SHALL set an initial payment status with default value of 'Pending'
6. IF any required data point is missing THEN the system SHALL prevent the lesson from being marked as complete

### Requirement 4: Lesson History Table Display
**User Story:** As a coach, I want to view a client's complete lesson history in a clear table format, so that I can quickly review their session and payment records.

#### Acceptance Criteria
1. WHEN viewing a Client Profile THEN the system SHALL display a Lesson History section containing a table of all logged lessons
2. WHEN the Lesson History table is displayed THEN the system SHALL show columns for Date, Time, Service Type, Duration, Rate/Cost, and Payment Status
3. WHEN the Lesson History is empty THEN the system SHALL display a message indicating no lessons have been logged yet
4. WHEN displaying the table THEN the system SHALL show the most recent lessons first by default

### Requirement 5: Payment Status Filtering
**User Story:** As a coach, I want to filter lesson history by payment status, so that I can quickly identify which lessons need to be invoiced.

#### Acceptance Criteria
1. WHEN viewing the Lesson History THEN the system SHALL provide a filter option for Payment Status
2. WHEN a payment status filter is selected THEN the system SHALL display only lessons matching that status
3. WHEN the filter is set to 'Pending' or 'Unpaid' THEN the system SHALL show all lessons that have not been paid
4. WHEN the filter is set to 'Paid' THEN the system SHALL show only completed payment transactions
5. WHEN filters are cleared THEN the system SHALL return to showing all lesson entries

### Requirement 6: History Sorting Capabilities
**User Story:** As a coach, I want to sort lesson history by date and payment status, so that I can organize the information in the most useful way for my needs.

#### Acceptance Criteria
1. WHEN viewing the Lesson History THEN the system SHALL allow sorting by Date (newest/oldest first)
2. WHEN viewing the Lesson History THEN the system SHALL allow sorting by Payment Status
3. WHEN a sort option is selected THEN the system SHALL reorder the table entries accordingly
4. WHEN multiple sort criteria are applied THEN the system SHALL apply them in the order selected

### Requirement 7: Unpaid Balance Summary
**User Story:** As a coach, I want to see a running total of unpaid lesson costs for each client, so that I know exactly how much they owe at a glance.

#### Acceptance Criteria
1. WHEN viewing the Lesson History section THEN the system SHALL display a summary showing the total dollar value of all unpaid lessons
2. WHEN calculating the unpaid total THEN the system SHALL include all lessons with payment status 'Pending' or 'Unpaid'
3. WHEN a lesson's payment status changes from unpaid to paid THEN the system SHALL update the unpaid total immediately
4. WHEN there are no unpaid lessons THEN the system SHALL display the unpaid total as $0.00

### Requirement 8: Session Detail Access
**User Story:** As a coach, I want to view detailed information or add notes to individual lesson entries, so that I can maintain comprehensive records for each session.

#### Acceptance Criteria
1. WHEN viewing a lesson entry in the history table THEN the system SHALL provide a 'View Session Details' action link or button
2. WHEN the 'View Session Details' link is clicked THEN the system SHALL display complete information about that specific lesson
3. WHEN viewing session details THEN the system SHALL provide an option to 'Add Note' to the lesson record
4. WHEN a note is added THEN the system SHALL save it and associate it with that specific lesson entry

### Requirement 9: Individual Lesson Payment Confirmation
**User Story:** As a coach, I want to manually mark individual lessons as paid, so that I can track payment status as clients pay for sessions.

#### Acceptance Criteria
1. WHEN viewing a lesson entry in the history table THEN the system SHALL allow the coach to mark the lesson as paid
2. WHEN marking a lesson as paid THEN the system SHALL provide a "Mark as Paid" button or action
3. WHEN a lesson is marked as paid THEN the system SHALL update the payment status from 'Pending' to 'Paid'
4. WHEN payment status is changed to paid THEN the system SHALL update the unpaid balance summary immediately
5. WHEN payment status is changed THEN the system SHALL record the date and time of the status change
6. WHEN viewing lesson details THEN the system SHALL display the payment confirmation date if the lesson has been paid

### Requirement 10: Bulk Payment Confirmation for Client
**User Story:** As a coach, I want to mark all outstanding lessons for a specific client as paid with one action, so that I can quickly update payment status when a client pays their full balance.

#### Acceptance Criteria
1. WHEN viewing a client's Lesson History section THEN the system SHALL provide a "Mark All Paid" button
2. WHEN the "Mark All Paid" button is clicked THEN the system SHALL display a confirmation dialog showing the total amount and number of lessons to be marked as paid
3. WHEN the bulk payment action is confirmed THEN the system SHALL update all lessons with payment status 'Pending' to 'Paid' for that specific client
4. WHEN bulk payment is processed THEN the system SHALL record the same payment confirmation date for all updated lessons
5. WHEN bulk payment is complete THEN the system SHALL update the unpaid balance summary to $0.00
6. IF there are no unpaid lessons THEN the "Mark All Paid" button SHALL be disabled or hidden

## Edge Cases and Constraints

### Edge Cases
1. **Overlapping Sessions**: If two lessons for the same client overlap in time, both should be logged separately
2. **Zero-Cost Lessons**: Complimentary or promotional sessions with $0 cost should still be logged in history but not affect unpaid balance calculations
3. **Late Confirmation**: Coaches may confirm lessons days or weeks after they occurred - system should handle backdated confirmations
4. **Accidental Payment Marking**: If a lesson is accidentally marked as paid, there should be a way to revert it back to pending
5. **Bulk Payment Partial Completion**: If bulk payment action fails midway, system should maintain consistency
6. **Outstanding Lessons Accumulation**: If coach doesn't confirm lessons regularly, the Outstanding Lessons list could grow very large
7. **Historical Data**: Lessons completed before this feature is implemented will need manual entry or migration

### Constraints
1. **Data Integrity**: Lesson History entries must remain immutable once created (except for status updates and notes)
2. **Performance**: Outstanding Lessons dashboard should load efficiently even with 50+ unconfirmed lessons
3. **Performance**: Lesson History table should load efficiently even with clients who have 100+ lesson entries
4. **Synchronization**: Calendar and Lesson History data must remain synchronized in real-time
5. **User Permissions**: Only the coach who owns the client relationship should see/edit that client's lesson history
6. **Currency**: All monetary values must be stored and displayed consistently (assumed USD with 2 decimal places)
7. **Confirmation Window**: System should automatically queue lessons for confirmation shortly after their scheduled end time (e.g., within 1 hour)
