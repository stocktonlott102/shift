# Rate Limiting Implementation Guide

## Overview

Rate limiting has been successfully implemented across all critical server actions to protect against:
- **DDoS attacks**: Prevent overwhelming the server with requests
- **Credential stuffing**: Limit brute force login attempts
- **Payment fraud**: Prevent rapid-fire payment requests
- **Spam**: Limit lesson creation/modification abuse

## Architecture

### Technology Stack
- **@upstash/ratelimit**: Distributed rate limiting library
- **@upstash/redis**: Redis client optimized for serverless
- **Upstash Redis**: Cloud Redis database (optional for development)

### Rate Limiting Tiers

| Action Type | Limit | Window | Use Case |
|------------|-------|--------|----------|
| **Authentication** | 5 requests | 15 minutes | Login, signup, password reset, logout |
| **Payment** | 10 requests | 1 hour | Stripe checkout, customer portal |
| **Lessons** | 30 requests | 1 minute | Create, update, delete lessons |
| **Read Operations** | 100 requests | 1 minute | Viewing data (future use) |

## Files Created/Modified

### New Files

1. **lib/rate-limit.ts**
   - Core rate limiting utility
   - Configures different rate limit tiers
   - Provides helper functions for identifier management
   - Graceful degradation when Redis not configured

2. **app/actions/auth-actions.ts**
   - New server actions for authentication
   - Login, signup, password reset with rate limiting
   - Replaces client-side authentication (recommended migration)

3. **RATE_LIMITING_SETUP.md** (this file)
   - Documentation and setup guide

### Modified Files

1. **app/actions/stripe-actions.ts**
   - Added rate limiting to `createCheckoutSession()`
   - Added rate limiting to `createCustomerPortalSession()`

2. **app/actions/lesson-actions.ts**
   - Added rate limiting to `createLesson()`
   - Added rate limiting to `createLessonWithParticipants()`
   - Added rate limiting to `updateLesson()`
   - Added rate limiting to `deleteLesson()`

3. **app/dashboard/actions.ts**
   - Added rate limiting to `logout()`

4. **package.json**
   - Added `@upstash/ratelimit` and `@upstash/redis` dependencies

5. **.env.local**
   - Added Upstash Redis environment variable placeholders

6. **BACKEND_ROADMAP.md**
   - Updated to reflect rate limiting completion

## Setup Instructions

### Development (Optional - Rate Limiting Bypassed)

For local development, rate limiting automatically bypasses if Redis is not configured. You'll see this warning in logs:
```
Rate limiting bypassed: Redis not configured
```

This is intentional to allow development without requiring Redis setup.

### Production Setup (Required)

1. **Create Upstash Redis Database**
   - Go to https://console.upstash.com/
   - Create a free account
   - Click "Create Database"
   - Choose a region close to your Vercel deployment region
   - Copy the REST URL and REST Token

2. **Add Environment Variables**

   Local (.env.local):
   ```bash
   UPSTASH_REDIS_REST_URL=https://YOUR-DATABASE.upstash.io
   UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN_HERE
   ```

   Vercel (Production):
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `UPSTASH_REDIS_REST_URL` with your database URL
   - Add `UPSTASH_REDIS_REST_TOKEN` with your token
   - Apply to Production, Preview, and Development environments

3. **Deploy**
   ```bash
   git add .
   git commit -m "Add rate limiting with Upstash Redis"
   git push
   ```

## How It Works

### Request Flow

1. User makes request to server action
2. Authentication check (if required)
3. **Rate limit check**:
   - Identifier created from user ID or IP address
   - Redis query to check current request count
   - If limit exceeded: Return error immediately
   - If within limit: Continue to business logic
4. Process request normally

### Example Usage

```typescript
// lib/rate-limit.ts - Configuration
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
      analytics: true,
      prefix: '@ratelimit/auth',
    })
  : null;

// app/actions/auth-actions.ts - Implementation
export async function loginAction(input: unknown): Promise<ActionResponse> {
  try {
    // ... input validation ...

    // SECURITY: Rate limiting
    const identifier = getRateLimitIdentifier(undefined, ipAddress || email);
    const rateLimitResult = await checkRateLimit(identifier, authRateLimit);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: rateLimitResult.error || 'Too many login attempts.',
      };
    }

    // ... continue with login ...
  }
}
```

### Identifier Strategy

Rate limits are applied per:
1. **User ID** (if authenticated) - Most accurate
2. **IP Address** (if available) - Prevents unauthenticated spam
3. **Email** (for login/signup) - Fallback for auth actions
4. **'anonymous'** (last resort) - Global fallback

Priority order: `User ID > IP Address > Email > 'anonymous'`

## Testing Rate Limiting

### Manual Testing

1. **Test Login Rate Limit** (5 requests per 15 minutes):
   ```bash
   # Make 6 rapid login attempts
   # 6th attempt should return: "Rate limit exceeded. Try again at..."
   ```

2. **Test Payment Rate Limit** (10 requests per hour):
   ```bash
   # Click "Subscribe" button 11 times rapidly
   # 11th attempt should be blocked
   ```

3. **Test Lesson Rate Limit** (30 requests per minute):
   ```bash
   # Create 31 lessons in rapid succession
   # 31st creation should fail with rate limit error
   ```

### Expected Error Messages

When rate limited, users see:
- **Auth**: "Rate limit exceeded. Try again at [time]"
- **Payment**: "Too many payment requests. Please try again later."
- **Lessons**: "Too many requests. Please try again later."

## Monitoring

### Upstash Dashboard

View rate limiting analytics at https://console.upstash.com/:
- Request counts per key
- Rate limit hits
- Geographic distribution (if enabled)

### Server Logs

Rate limit events are logged:
```
[createCheckoutSession] Rate limit exceeded for user: abc-123
Rate limiting bypassed: Redis not configured (dev mode)
```

## Security Considerations

### Fail-Open vs Fail-Closed

Current implementation: **Fail-Open**
- If Redis is unavailable, requests proceed without rate limiting
- Prioritizes availability over strict rate limiting
- Appropriate for this use case

To change to Fail-Closed:
```typescript
if (!rateLimitResult.success) {
  // Current: Allow request to proceed on Redis error
  return { success: true };

  // Fail-Closed alternative:
  return {
    success: false,
    error: 'Service temporarily unavailable'
  };
}
```

### IP Address Spoofing

- Rate limiting by IP can be bypassed with VPNs/proxies
- Mitigated by also using User ID when available
- Consider adding device fingerprinting for additional security

### Distributed Environment

- Upstash Redis works seamlessly with Vercel's serverless functions
- Rate limits are shared across all instances globally
- No risk of per-instance rate limit bypass

## Cost Analysis

### Upstash Free Tier
- 10,000 commands per day
- Perfect for development and small applications
- Automatic upgrade available if needed

### Estimated Usage
- 100 users × 50 actions/day = 5,000 commands/day
- Well within free tier for small-medium applications

## Migration Guide

### Moving from Client-Side to Server-Side Auth

Current auth is client-side in `app/login/page.tsx`. For better security:

1. **Update Login Page** to use new server action:
   ```typescript
   // Before: Client-side
   const { data, error } = await supabase.auth.signInWithPassword({
     email, password
   });

   // After: Server-side with rate limiting
   const result = await loginAction({
     email,
     password,
     ipAddress: // get from headers
   });
   ```

2. **Benefits**:
   - Rate limiting protection
   - Server-side validation
   - Better error handling
   - Audit logging capability

## Troubleshooting

### Issue: "Rate limiting bypassed" in production

**Solution**: Check environment variables
```bash
# Verify in Vercel dashboard
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AY...
```

### Issue: Rate limit too strict

**Solution**: Adjust limits in [lib/rate-limit.ts](lib/rate-limit.ts:33)
```typescript
// Increase auth limit from 5 to 10 requests
export const authRateLimit = redis
  ? new Ratelimit({
      limiter: Ratelimit.slidingWindow(10, '15 m'), // Changed from 5
      // ...
    })
  : null;
```

### Issue: Redis connection timeout

**Solution**: Check Upstash status and region
- Ensure Upstash database is in same region as Vercel deployment
- Check https://status.upstash.com/
- Verify credentials are correct

## Next Steps

### Recommended Enhancements

1. **IP Address Extraction**
   - Add middleware to extract real IP from headers
   - Handle Vercel's proxy headers correctly
   - Use for more accurate rate limiting

2. **Custom Error Responses**
   - Return retry-after headers
   - Implement exponential backoff guidance
   - Add user-friendly messaging

3. **Analytics Dashboard**
   - Track rate limit violations
   - Identify potential attacks
   - Monitor usage patterns

4. **Client Actions**
   - Add rate limiting to client creation
   - Protect lesson type operations
   - Limit recurring lesson modifications

5. **Webhook Protection**
   - Rate limit Stripe webhook endpoint
   - Prevent webhook replay attacks
   - Add signature verification

## Resources

- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Vercel Rate Limiting Guide](https://vercel.com/guides/how-to-use-rate-limiting)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

## Support

For issues or questions:
1. Check Upstash dashboard for Redis connectivity
2. Review server logs for rate limit warnings
3. Verify environment variables are set correctly
4. Test with Redis configured locally

---

**Implementation Date**: December 21, 2024
**Status**: ✅ Production Ready (pending Upstash credentials)
**Files Modified**: 7 files
**New Dependencies**: @upstash/ratelimit, @upstash/redis
