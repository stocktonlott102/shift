import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate Limiting Configuration
 *
 * SECURITY: Protects server actions from abuse, DDoS attacks, and credential stuffing
 * Uses Upstash Redis for distributed rate limiting across serverless functions
 *
 * Environment Variables Required:
 * - UPSTASH_REDIS_REST_URL: Redis REST endpoint
 * - UPSTASH_REDIS_REST_TOKEN: Redis authentication token
 */

// Initialize Redis client
// For development without Upstash, this will be undefined and rate limiting will be bypassed
let redis: Redis | undefined;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Rate limit configurations for different action types
 *
 * slidingWindow algorithm:
 * - Allows X requests per Y time window
 * - More accurate than fixed windows
 * - Prevents burst attacks
 */

// Strict limits for authentication actions (login, signup, password reset)
// Prevents credential stuffing and brute force attacks
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
      analytics: true,
      prefix: '@ratelimit/auth',
    })
  : null;

// Moderate limits for payment actions (creating checkout sessions)
// Prevents payment spam and fraudulent activity
export const paymentRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
      analytics: true,
      prefix: '@ratelimit/payment',
    })
  : null;

// Standard limits for lesson creation/modification
// Prevents spam lesson creation while allowing normal usage
export const lessonRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
      analytics: true,
      prefix: '@ratelimit/lesson',
    })
  : null;

// Lenient limits for read-only operations
// Allows normal browsing while preventing scraping
export const readRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
      prefix: '@ratelimit/read',
    })
  : null;

/**
 * Rate limit enforcement helper
 *
 * @param identifier - Unique identifier for rate limiting (user ID, IP address, etc.)
 * @param rateLimit - Rate limit configuration to apply
 * @returns Object with success status and optional error message
 */
export async function checkRateLimit(
  identifier: string,
  rateLimit: Ratelimit | null
): Promise<{ success: boolean; error?: string; remaining?: number }> {
  // If Redis is not configured (development), bypass rate limiting
  if (!rateLimit) {
    console.warn('Rate limiting bypassed: Redis not configured');
    return { success: true };
  }

  try {
    const { success, remaining, reset } = await rateLimit.limit(identifier);

    if (!success) {
      // Calculate minutes until reset
      const now = Date.now();
      const minutesUntilReset = Math.ceil((reset - now) / 1000 / 60);

      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}.`,
        remaining: 0,
      };
    }

    return { success: true, remaining };
  } catch (error) {
    // Log error but allow request to proceed (fail open for availability)
    console.error('Rate limit check failed:', error);
    return { success: true };
  }
}

/**
 * Get identifier for rate limiting
 * Priority: User ID > IP Address > Fallback
 *
 * @param userId - Authenticated user ID (if available)
 * @param request - Request object to extract IP (optional)
 * @returns Identifier string for rate limiting
 */
export function getRateLimitIdentifier(userId?: string, ipAddress?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  if (ipAddress) {
    return `ip:${ipAddress}`;
  }

  // Fallback for cases where neither is available
  // This is less secure but ensures rate limiting still works
  return 'anonymous';
}
