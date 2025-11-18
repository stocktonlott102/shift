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
} as const;

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\(\)\+]+$/,
} as const;
