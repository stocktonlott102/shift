import { z } from 'zod';

/**
 * Validation schemas for Stripe server actions
 * Prevents injection attacks and ensures data integrity
 */

/**
 * Schema for creating a checkout session
 * Validates Stripe Price ID format
 */
export const CreateCheckoutSessionSchema = z.object({
  priceId: z
    .string()
    .min(1, 'Price ID is required')
    .startsWith('price_', 'Invalid Stripe Price ID format')
    .regex(/^price_[A-Za-z0-9]+$/, 'Price ID contains invalid characters'),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
