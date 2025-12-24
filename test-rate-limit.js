/**
 * Rate Limiting Test Script
 *
 * This script tests if rate limiting is working by making multiple rapid requests
 * to your production login endpoint.
 *
 * Expected behavior:
 * - First 5 requests: Should succeed (or fail with "Invalid credentials")
 * - 6th request onwards: Should fail with "Rate limit exceeded"
 */

const testRateLimit = async () => {
  const PRODUCTION_URL = 'https://shift-one-rouge.vercel.app'; // Update if different
  const TEST_EMAIL = 'test-rate-limit@example.com'; // Fake email for testing
  const TEST_PASSWORD = 'TestPassword123'; // Fake password

  console.log('🧪 Testing Rate Limiting...\n');
  console.log(`Target: ${PRODUCTION_URL}`);
  console.log(`Auth limit: 5 requests per 15 minutes\n`);
  console.log('Making 7 rapid login attempts...\n');

  for (let i = 1; i <= 7; i++) {
    try {
      const response = await fetch(`${PRODUCTION_URL}/api/test-rate-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });

      const data = await response.json();
      const status = response.status;

      if (i <= 5) {
        console.log(`✓ Request ${i}: ${status} - ${data.message || 'Allowed (expected)'}`);
      } else {
        if (status === 429 || (data.error && data.error.includes('rate limit'))) {
          console.log(`🛡️  Request ${i}: BLOCKED - Rate limit working! ✅`);
          console.log(`   Message: "${data.error || data.message}"`);
        } else {
          console.log(`⚠️  Request ${i}: ${status} - Rate limit may not be working`);
        }
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Request ${i} failed:`, error.message);
    }
  }

  console.log('\n📊 Test Complete!');
  console.log('\nWhat to look for:');
  console.log('- First 5 requests should go through (may fail auth, but not rate limited)');
  console.log('- Request 6+ should be blocked with rate limit error');
  console.log('\nIf requests 6-7 were blocked, rate limiting is working! ✅');
};

// Run the test
testRateLimit().catch(console.error);
