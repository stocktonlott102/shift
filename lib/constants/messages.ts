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
} as const;

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\(\)\+]+$/,
} as const;
