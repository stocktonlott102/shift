# Requirements Document

## Introduction

This feature integrates the existing audit logging infrastructure ([lib/audit-log.ts](../../../lib/audit-log.ts)) with all server actions in the application. The audit logging database table and helper functions are already fully implemented but currently have zero integrations - this work connects them to capture security-critical events across authentication, client management, lesson management, and payment operations.

## Requirements

### Requirement 1: Authentication Event Logging

**User Story:** As a system administrator, I want all authentication events logged, so that I can detect unauthorized access attempts and investigate security incidents.

#### Acceptance Criteria
1. WHEN a user successfully logs in THEN the system SHALL log an `auth.logged_in` event with user ID and email
2. WHEN a user login attempt fails THEN the system SHALL log an `auth.login_failed` event with the attempted email (no password)
3. WHEN a user signs up THEN the system SHALL log an `auth.signup` event with user ID and email
4. WHEN a user logs out THEN the system SHALL log an `auth.logged_out` event with user ID
5. WHEN a user requests a password reset THEN the system SHALL log an `auth.password_reset_requested` event with email
6. WHEN a user successfully updates their password THEN the system SHALL log an `auth.password_updated` event with user ID

### Requirement 2: Client Management Logging

**User Story:** As a coach, I want client data changes logged, so that I have a complete audit trail of my client records.

#### Acceptance Criteria
1. WHEN a client is created THEN the system SHALL log a `client.created` event with client ID, name, and creation details
2. WHEN a client is updated THEN the system SHALL log a `client.updated` event with client ID, old values, and new values
3. WHEN a client is deleted THEN the system SHALL log a `client.deleted` event with client ID and client name

### Requirement 3: Lesson Management Logging

**User Story:** As a coach, I want lesson changes logged, so that I can track scheduling history and resolve disputes.

#### Acceptance Criteria
1. WHEN a lesson is created THEN the system SHALL log a `lesson.created` event with lesson ID, title, scheduled time, and participants
2. WHEN a lesson is updated THEN the system SHALL log a `lesson.updated` event with lesson ID, old values, and new values
3. WHEN a lesson is cancelled THEN the system SHALL log a `lesson.cancelled` event with lesson ID, title, and cancellation reason
4. WHEN a lesson is deleted THEN the system SHALL log a `lesson.deleted` event with lesson ID and title
5. WHEN recurring lessons are created THEN the system SHALL log a `recurring_lessons.created` event with count and parent lesson ID
6. WHEN a lesson is marked as completed THEN the system SHALL log a `lesson.completed` event with lesson ID

### Requirement 4: Lesson Type Logging

**User Story:** As a coach, I want lesson type changes logged, so that I can track rate and configuration history.

#### Acceptance Criteria
1. WHEN a lesson type is created THEN the system SHALL log a `lesson_type.created` event with lesson type ID, name, and rate
2. WHEN a lesson type is updated THEN the system SHALL log a `lesson_type.updated` event with old and new values
3. WHEN a lesson type is deleted THEN the system SHALL log a `lesson_type.deleted` event with lesson type ID and name

### Requirement 5: Payment Logging

**User Story:** As a coach, I want payment status changes logged, so that I have a complete financial audit trail.

#### Acceptance Criteria
1. WHEN a payment is marked as paid THEN the system SHALL log a `payment.marked_paid` event with participant ID, client name, and amount
2. WHEN bulk payments are marked as paid THEN the system SHALL log a `payments.bulk_marked_paid` event with client ID, count, and total amount
3. WHEN a lesson confirmation changes payment status THEN the system SHALL log the appropriate payment event

### Requirement 6: Stripe/Subscription Logging

**User Story:** As a system administrator, I want subscription events logged, so that I can track billing history and investigate payment issues.

#### Acceptance Criteria
1. WHEN a checkout session is created THEN the system SHALL log a `subscription.checkout_created` event
2. WHEN a subscription is created via webhook THEN the system SHALL log a `subscription.created` event with subscription details
3. WHEN a subscription is updated via webhook THEN the system SHALL log a `subscription.updated` event with change details
4. WHEN a subscription is cancelled via webhook THEN the system SHALL log a `subscription.cancelled` event

### Requirement 7: Non-Blocking Audit Logging

**User Story:** As a system administrator, I want audit logging to never block main operations, so that the application remains reliable even if logging fails.

#### Acceptance Criteria
1. IF audit logging fails THEN the system SHALL continue with the main operation and log the failure to console
2. WHEN logging an audit event THEN the system SHALL NOT await the log operation in the critical path (use fire-and-forget pattern where appropriate)
3. IF the database is unavailable THEN audit logging failures SHALL NOT cause user-facing errors

### Requirement 8: Missing Auth Actions in Audit Constants

**User Story:** As a developer, I want all authentication actions defined in the AuditActions constants, so that logging is consistent.

#### Acceptance Criteria
1. WHEN adding new auth logging THEN the system SHALL add missing actions to AuditActions constant:
   - `auth.login_failed`
   - `auth.password_reset_requested`
   - `auth.password_updated`
2. WHEN adding subscription logging THEN the system SHALL add subscription actions to AuditActions constant:
   - `subscription.checkout_created`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
3. WHEN adding lesson completion logging THEN the system SHALL add `lesson.completed` to AuditActions constant
