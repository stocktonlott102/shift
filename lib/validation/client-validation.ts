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
  athlete_name: string;
  parent_email: string;
  parent_phone: string;
  hourly_rate: number;
}) {
  const errors: ValidationError[] = [];

  if (!data.athlete_name || !data.athlete_name.trim()) {
    errors.push({ field: 'athlete_name', message: ERROR_MESSAGES.CLIENT.NAME_REQUIRED });
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

  if (typeof data.hourly_rate !== 'number' || data.hourly_rate <= 0) {
    errors.push({ field: 'hourly_rate', message: ERROR_MESSAGES.CLIENT.INVALID_RATE });
  }

  return errors;
}
