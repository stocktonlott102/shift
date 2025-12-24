# How to Verify Rate Limiting is Working

## Method 1: Upstash Dashboard (Recommended)

1. Go to https://console.upstash.com/
2. Sign in and select your Redis database
3. Click **"Data Browser"** or **"Metrics"**
4. Look for keys like:
   ```
   @ratelimit/auth:user:YOUR_USER_ID
   @ratelimit/auth:ip:YOUR_IP_ADDRESS
   @ratelimit/payment:user:YOUR_USER_ID
   @ratelimit/lesson:user:YOUR_USER_ID
   ```
5. If you see these keys appearing, rate limiting is active! ✅

## Method 2: Quick Browser Test (Easiest)

### Test Login Rate Limiting:

1. **Open your production app**: https://shift-one-rouge.vercel.app (or your Vercel URL)

2. **Navigate to**: /login

3. **Rapid test** - Try logging in 6 times with fake credentials:
   - Email: `fake@test.com`
   - Password: `WrongPassword123`
   - Click "Log In" button repeatedly (6 times)

4. **Expected Results**:
   ```
   Attempt 1: ❌ "Invalid email or password"
   Attempt 2: ❌ "Invalid email or password"
   Attempt 3: ❌ "Invalid email or password"
   Attempt 4: ❌ "Invalid email or password"
   Attempt 5: ❌ "Invalid email or password"
   Attempt 6: 🛡️ "Rate limit exceeded. Try again at [TIME]" ✅
   ```

5. **If attempt 6 shows rate limit error** → Rate limiting is working! ✅

### Test Payment Rate Limiting:

1. **Log into your app** (use real credentials)
2. **Go to**: /dashboard or /settings (wherever Subscribe button is)
3. **Click "Subscribe"** 11 times rapidly
4. **Expected**: 11th click should show "Too many payment requests"

## Method 3: Vercel Function Logs

1. Go to https://vercel.com/dashboard
2. Select your **shift** project
3. Click **"Logs"** tab
4. Filter by: "Rate limit" or "checkRateLimit"
5. Look for entries like:
   ```
   Rate limiting bypassed: Redis not configured ❌ (BAD - means not working)

   OR

   [createCheckoutSession] Rate limit exceeded for user: abc-123 ✅ (GOOD - means working)
   ```

## Method 4: Check Network Tab

1. Open your production site
2. Open browser DevTools (F12 or Cmd+Option+I on Mac)
3. Go to **Network** tab
4. Try logging in 6 times with fake credentials
5. On the 6th attempt, click the `/login` request in Network tab
6. Look at **Response** - should see:
   ```json
   {
     "success": false,
     "error": "Rate limit exceeded. Try again at 11:45:30 AM"
   }
   ```

## What Success Looks Like

✅ **Rate limiting IS working if you see:**
- Keys in Upstash dashboard with `@ratelimit/` prefix
- "Rate limit exceeded" errors after hitting limits
- No "Rate limiting bypassed" in production logs
- 429 status codes or rate limit error messages

❌ **Rate limiting NOT working if you see:**
- "Rate limiting bypassed: Redis not configured" in logs
- Can make unlimited rapid requests without errors
- No keys appearing in Upstash dashboard

## Troubleshooting

### If rate limiting is NOT working:

1. **Check Vercel Environment Variables**:
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify you have:
     - `UPSTASH_REDIS_REST_URL` = https://your-db.upstash.io
     - `UPSTASH_REDIS_REST_TOKEN` = AYxxxxx...

2. **Verify credentials are correct**:
   - Copy URL and Token from Upstash dashboard
   - Paste into Vercel (make sure no extra spaces)

3. **Redeploy**:
   ```bash
   git commit --allow-empty -m "Trigger redeploy for rate limiting"
   git push
   ```

4. **Check Upstash database region**:
   - Should be in same region as Vercel deployment (preferably)
   - US East (iad1) if deploying to Vercel US East

## Quick Test Commands

If you want to test from terminal:

```bash
# Test login rate limit (run 6 times)
curl -X POST https://YOUR-VERCEL-URL.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fake@test.com","password":"wrong"}'
```

## What the Limits Are

| Action | Limit | Window |
|--------|-------|--------|
| Login/Signup | 5 requests | 15 minutes |
| Password Reset | 5 requests | 15 minutes |
| Logout | 5 requests | 15 minutes |
| Payment (Subscribe) | 10 requests | 1 hour |
| Customer Portal | 10 requests | 1 hour |
| Create Lesson | 30 requests | 1 minute |
| Update Lesson | 30 requests | 1 minute |
| Delete Lesson | 30 requests | 1 minute |

---

**TL;DR**: Open your production app, try logging in 6 times with fake email/password. If the 6th attempt says "Rate limit exceeded", it's working! ✅
