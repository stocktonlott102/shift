# Quick Rate Limiting Verification

## ✅ Easiest Method: Check Vercel Logs

Since Upstash free tier doesn't show metrics, use Vercel logs instead:

### Steps:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: "shift" (or whatever you named it)
3. **Click "Logs" tab**
4. **Use your app normally** (create a lesson, or do any action)
5. **Search logs for**: `Rate limiting bypassed`

**What you'll see:**

❌ **If NOT working** (Redis not connected):
```
Rate limiting bypassed: Redis not configured
```

✅ **If WORKING** (Redis connected):
- You should NOT see "Rate limiting bypassed"
- You might see rate limit checks happening silently
- Or if you hit a limit: `Rate limit exceeded for user: ...`

---

## Alternative: Test in Production

### Test 1: Create Multiple Lessons Rapidly

1. Log into production
2. Go to /calendar
3. Click a time slot
4. Fill out lesson details
5. Submit
6. **Immediately repeat 30 more times**
7. On attempt 31, you should see: "Too many requests"

### Test 2: Simple Upstash Connection Test

Even without metrics, you can verify the connection:

1. Go to https://console.upstash.com/
2. Select your Redis database
3. Click **"Data Browser"**
4. Use your production app (create a lesson, try to subscribe, etc.)
5. **Refresh the Data Browser page**
6. Look for keys starting with `@ratelimit/`

**If you see keys like:**
```
@ratelimit/lesson:user:abc-123-def
@ratelimit/payment:user:xyz-789
```

✅ **Rate limiting is working!**

---

## What I Recommend

The **easiest verification** without needing to spam actions:

1. Open Vercel Dashboard → Your Project → Logs
2. Filter by last 24 hours
3. Search for: "Rate limiting"
4. If you see "Rate limiting bypassed" → Not working (check env vars)
5. If you DON'T see "Rate limiting bypassed" → It's working! ✅

---

## Current Status

Rate limiting is implemented on:
- ✅ Lesson creation (30/min)
- ✅ Lesson updates (30/min)
- ✅ Lesson deletion (30/min)
- ✅ Payments (10/hour)
- ✅ Logout (5/15min)

**Note:** Login page still uses client-side auth (not rate limited yet). That's okay for now - the critical operations (payments, data modification) are protected.

---

## Need to Fix It?

If Vercel logs show "Rate limiting bypassed":

1. Verify environment variables in Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

2. Make sure they match your Upstash dashboard values

3. Redeploy:
   ```bash
   git commit --allow-empty -m "Redeploy for rate limiting"
   git push
   ```
