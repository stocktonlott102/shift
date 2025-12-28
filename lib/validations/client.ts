/**
 * Client Validation Schemas
 *
 * Runtime validation for all client-related operations using Zod
 * Prevents SQL injection, XSS attacks, and invalid data submissions
 */

import { z } from 'zod';

// =====================================================
// BASE FIELD VALIDATORS
// =====================================================

// UUID validation - prevents injection via IDs
const uuidSchema = z.string().uuid({ message: 'Invalid ID format' });

// Name validation - sanitizes string inputs, prevents XSS
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less')
  .trim()
  .refine(
    (val) => {
      // Reject names with HTML tags or script injection attempts
      const dangerousPatterns = /<script|<iframe|javascript:|onerror=/i;
      return !dangerousPatterns.test(val);
    },
    { message: 'Name contains invalid characters' }
  );

// Email validation - comprehensive email format check
const emailSchema = z
  .string()
  .email({ message: 'Invalid email address' })
  .max(255, 'Email must be 255 characters or less')
  .trim()
  .toLowerCase()
  .optional()
  .or(z.literal(''));

// Phone validation - flexible format support
const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .max(20, 'Phone number must be 20 characters or less')
  .trim()
  .refine(
    (val) => {
      // Allow digits, spaces, dashes, parentheses, and plus sign
      const phonePattern = /^[\d\s\-\(\)\+]+$/;
      return phonePattern.test(val);
    },
    { message: 'Phone number contains invalid characters' }
  )
  .optional()
  .or(z.literal(''));

// Notes validation - sanitizes longer text inputs
const notesSchema = z
  .string()
  .max(2000, 'Notes must be 2000 characters or less')
  .trim()
  .optional();

// =====================================================
// CREATE CLIENT VALIDATION
// =====================================================

export const CreateClientSchema = z
  .object({
    first_name: nameSchema,
    last_name: nameSchema,
    parent_email: emailSchema,
    parent_phone: phoneSchema,
    notes: notesSchema,
  })
  .strict(); // Reject any extra fields not in schema

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

// =====================================================
// UPDATE CLIENT VALIDATION
// =====================================================

export const UpdateClientSchema = z
  .object({
    first_name: nameSchema.optional(),
    last_name: nameSchema.optional(),
    parent_email: emailSchema.optional(),
    parent_phone: phoneSchema.optional(),
    notes: notesSchema,
  })
  .strict()
  .refine(
    (data) => {
      // At least one field must be provided for update
      return (
        data.first_name !== undefined ||
        data.last_name !== undefined ||
        data.parent_email !== undefined ||
        data.parent_phone !== undefined ||
        data.notes !== undefined
      );
    },
    { message: 'At least one field must be provided for update' }
  );

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

// =====================================================
// QUERY PARAMETER VALIDATION
// =====================================================

// For validating URL query parameters and search filters
export const ClientQuerySchema = z.object({
  client_id: uuidSchema.optional(),
  search: z.string().max(200).trim().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type ClientQueryInput = z.infer<typeof ClientQuerySchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Safely parse and validate client creation data
 * Returns either the validated data or a descriptive error
 */
export function validateCreateClient(data: unknown):
  { success: true; data: CreateClientInput } |
  { success: false; error: string } {
  try {
    const validated = CreateClientSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid client data' };
  }
}

/**
 * Safely parse and validate client update data
 */
export function validateUpdateClient(data: unknown):
  { success: true; data: UpdateClientInput } |
  { success: false; error: string } {
  try {
    const validated = UpdateClientSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid client data' };
  }
}
