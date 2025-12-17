/**
 * Application-wide Constants
 *
 * Centralized error messages, validation patterns, and other constants
 */

export const ERROR_MESSAGES = {
  AUTH: {
    NOT_LOGGED_IN: 'You must be logged in to perform this action.',
    UNAUTHORIZED: 'Unauthorized: Cannot perform this action.',
    COACH_MISMATCH: 'Unauthorized: Cannot create clients for other coaches.',
  },
  CLIENT: {
    REQUIRED_FIELDS: 'All fields are required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    INVALID_RATE: 'Hourly rate must be greater than 0.',
    NAME_REQUIRED: 'Athlete name is required.',
    EMAIL_REQUIRED: 'Parent email is required.',
    PHONE_REQUIRED: 'Parent phone is required.',
    CREATE_FAILED: 'Failed to create client',
    UPDATE_FAILED: 'Failed to update client',
    DELETE_FAILED: 'Failed to delete client',
    FETCH_FAILED: 'Failed to fetch clients.',
    FETCH_SINGLE_FAILED: 'Failed to fetch client details.',
    NOT_FOUND: 'Client not found.',
  },
  LESSON: {
    REQUIRED_FIELDS: 'All required fields must be filled out.',
    INVALID_TIME_RANGE: 'End time must be after start time.',
    INVALID_DURATION: 'Lesson duration must be at least 15 minutes.',
    CLIENT_REQUIRED: 'Please select a client for this lesson.',
    TITLE_REQUIRED: 'Lesson title is required.',
    TYPE_NOT_FOUND: 'Lesson type not found or inactive.',
    INVALID_RATE: 'Please enter a valid hourly rate.',
    PARTICIPANTS_CREATE_FAILED: 'Failed to add lesson participants.',
    CREATE_FAILED: 'Failed to create lesson',
    UPDATE_FAILED: 'Failed to update lesson',
    DELETE_FAILED: 'Failed to delete lesson',
    CANCEL_FAILED: 'Failed to cancel lesson',
    FETCH_FAILED: 'Failed to fetch lessons.',
    FETCH_SINGLE_FAILED: 'Failed to fetch lesson details.',
    NOT_FOUND: 'Lesson not found.',
    ALREADY_CANCELLED: 'This lesson has already been cancelled.',
    ALREADY_COMPLETED: 'Cannot modify a completed lesson.',
  },
  INVOICE: {
    CREATE_FAILED: 'Failed to create invoice',
    UPDATE_FAILED: 'Failed to update invoice',
    FETCH_FAILED: 'Failed to fetch invoices.',
    NOT_FOUND: 'Invoice not found.',
    ALREADY_PAID: 'This invoice has already been paid.',
  },
  LESSON_HISTORY: {
    FETCH_FAILED: 'Failed to load lesson history. Please try again.',
    CONFIRM_FAILED: 'Failed to confirm lesson. Please try again.',
    NO_OUTSTANDING: 'No outstanding lessons to confirm.',
    INVALID_STATUS: 'Only scheduled lessons can be confirmed.',
    FUTURE_LESSON: 'Cannot confirm a lesson that has not ended yet.',
    NOT_SCHEDULED: 'This lesson is not in scheduled status.',
  },
  PAYMENT: {
    MARK_PAID_FAILED: 'Failed to mark lesson as paid. Please try again.',
    BULK_UPDATE_FAILED: 'Failed to update payment status for some lessons.',
    REVERT_FAILED: 'Failed to revert payment status. Please contact support.',
    NOT_COMPLETED: 'Only completed lessons can be marked as paid.',
    CALCULATE_FAILED: 'Failed to calculate unpaid balance.',
  },
  GENERIC: {
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  },
} as const;

export const SUCCESS_MESSAGES = {
  CLIENT: {
    CREATED: 'Client added successfully!',
    UPDATED: 'Client updated successfully!',
    DELETED: 'Client deleted successfully!',
  },
  LESSON: {
    CREATED: 'Lesson booked successfully!',
    UPDATED: 'Lesson updated successfully!',
    CANCELLED: 'Lesson cancelled successfully!',
    COMPLETED: 'Lesson marked as completed!',
  },
  INVOICE: {
    CREATED: 'Invoice created successfully!',
    UPDATED: 'Invoice updated successfully!',
    PAID: 'Invoice marked as paid!',
  },
  LESSON_HISTORY: {
    CONFIRMED: 'Lesson confirmed successfully!',
    MARKED_NO_SHOW: 'Lesson marked as no-show.',
  },
  PAYMENT: {
    MARKED_PAID: 'Lesson marked as paid.',
    BULK_PAID: (count: number) => `${count} lesson${count > 1 ? 's' : ''} marked as paid.`,
    NOTE_SAVED: 'Note saved successfully!',
  },
} as const;

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\(\)\+]+$/,
} as const;
