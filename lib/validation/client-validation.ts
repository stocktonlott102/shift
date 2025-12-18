/**
 * Client validation utilities
 * Reusable validation logic for client create/update both on client and server
 */
import { ERROR_MESSAGES, VALIDATION_PATTERNS } from '@/lib/constants/messages';

export type ValidationError = {
  field: string;
  message: string;
};

export function validateClientData(data: {
  first_name: string;
  last_name: string;
  parent_email: string;
  parent_phone: string;
}) {
  const errors: ValidationError[] = [];

  if (!data.first_name || !data.first_name.trim()) {
    errors.push({ field: 'first_name', message: 'First name is required.' });
  }

  if (!data.last_name || !data.last_name.trim()) {
    errors.push({ field: 'last_name', message: 'Last name is required.' });
  }

  if (!data.parent_email || !data.parent_email.trim()) {
    errors.push({ field: 'parent_email', message: ERROR_MESSAGES.CLIENT.EMAIL_REQUIRED });
  } else if (!VALIDATION_PATTERNS.EMAIL.test(data.parent_email)) {
    errors.push({ field: 'parent_email', message: ERROR_MESSAGES.CLIENT.INVALID_EMAIL });
  }

  if (!data.parent_phone || !data.parent_phone.trim()) {
    errors.push({ field: 'parent_phone', message: ERROR_MESSAGES.CLIENT.PHONE_REQUIRED });
  } else if (!VALIDATION_PATTERNS.PHONE.test(data.parent_phone)) {
    errors.push({ field: 'parent_phone', message: ERROR_MESSAGES.CLIENT.INVALID_PHONE });
  }

  return errors;
}
