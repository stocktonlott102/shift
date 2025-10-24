'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

/**
 * Stripe Server Actions
 *
 * IMPORTANT: Before using these actions, ensure you have set up the following environment variables:
 *
 * Required Environment Variables:
 * --------------------------------
 * 1. STRIPE_SECRET_KEY - Your Stripe secret key (sk_test_... or sk_live_...)
 *    - Get this from: https://dashboard.stripe.com/apikeys
 *    - Add to .env.local: STRIPE_SECRET_KEY=sk_test_xxx
 *    - Add to Vercel: Environment Variables → STRIPE_SECRET_KEY
 *
 * 2. NEXT_PUBLIC_APP_URL - Your app's URL
 *    - Local: NEXT_PUBLIC_APP_URL=http://localhost:3000
 *    - Production: NEXT_PUBLIC_APP_URL=https://app.shift.com
 *
 * 3. STRIPE_PRICE_ID - Your Stripe Price ID for the subscription plan
 *    - Create a product and price in Stripe Dashboard
 *    - Example: price_1ABC123def456GHI
 *    - Add to .env.local: STRIPE_PRICE_ID=price_xxx
 *
 * Setup Instructions:
 * -------------------
 * 1. Install Stripe SDK: npm install stripe
 * 2. Create a Stripe account: https://dashboard.stripe.com/register
 * 3. Get your test API keys from: https://dashboard.stripe.com/test/apikeys
 * 4. Create a product in Stripe Dashboard:
 *    - Go to Products → Add Product
 *    - Name: "Individual Coach Plan"
 *    - Pricing: Recurring, $10/month
 *    - Copy the Price ID (starts with price_)
 * 5. Add environment variables to .env.local
 */

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'Missing STRIPE_SECRET_KEY environment variable. Please add it to your .env.local file.'
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

/**
 * Create Stripe Checkout Session
 *
 * Security:
 * - Uses Supabase Server Client to verify authentication
 * - Only authenticated coaches can create checkout sessions
 * - Session URLs expire after 24 hours
 * - Customer email is pre-filled from authenticated user
 *
 * @param priceId - Stripe Price ID for the subscription plan
 * @returns Object with session URL or error message
 */
export async function createCheckoutSession(priceId: string) {
  try {
    console.log('[createCheckoutSession] Starting checkout session creation');
    console.log('[createCheckoutSession] Price ID:', priceId);

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[createCheckoutSession] Authentication error:', authError);
      return {
        success: false,
        error: 'You must be logged in to subscribe.',
      };
    }

    console.log('[createCheckoutSession] User authenticated:', user.id);

    // Validate required environment variables
    // Use runtime environment variable that works on Vercel
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    console.log('[createCheckoutSession] App URL:', appUrl);

    if (!appUrl) {
      console.error('[createCheckoutSession] Missing NEXT_PUBLIC_APP_URL environment variable');
      console.error('[createCheckoutSession] Available env vars:', Object.keys(process.env));
      return {
        success: false,
        error: 'Server configuration error. Please contact support.',
      };
    }

    // Validate priceId parameter
    if (!priceId || !priceId.startsWith('price_')) {
      return {
        success: false,
        error: 'Invalid price ID provided.',
      };
    }

    // Check if user already has a Stripe customer ID
    console.log('[createCheckoutSession] Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[createCheckoutSession] Error fetching user profile:', profileError);
      console.error('[createCheckoutSession] Profile error details:', JSON.stringify(profileError));
      return {
        success: false,
        error: 'Unable to fetch user profile.',
      };
    }

    console.log('[createCheckoutSession] Profile fetched:', {
      hasCustomerId: !!profile?.stripe_customer_id,
      status: profile?.subscription_status
    });

    // Prevent active subscribers from creating new checkout sessions
    if (profile?.subscription_status === 'active') {
      return {
        success: false,
        error: 'You already have an active subscription.',
      };
    }

    // Create Stripe Checkout Session
    console.log('[createCheckoutSession] Creating Stripe session...');
    const session = await stripe.checkout.sessions.create({
      customer: profile?.stripe_customer_id || undefined, // Reuse existing customer if available
      customer_email: profile?.stripe_customer_id ? undefined : user.email, // Only set email if new customer
      client_reference_id: user.id, // Link session to our user ID
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?status=cancel`,
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
      metadata: {
        user_id: user.id,
        user_email: user.email || '',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    console.log('[createCheckoutSession] Stripe session created:', session.id);
    console.log('[createCheckoutSession] Session URL:', session.url);

    // Return the session URL to redirect the user
    return {
      success: true,
      sessionUrl: session.url,
      sessionId: session.id,
    };
  } catch (error: any) {
    console.error('[createCheckoutSession] ERROR - Full error object:', error);
    console.error('[createCheckoutSession] ERROR - Error message:', error.message);
    console.error('[createCheckoutSession] ERROR - Error type:', error.type);
    console.error('[createCheckoutSession] ERROR - Error stack:', error.stack);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      console.error('[createCheckoutSession] Stripe invalid request error');
      return {
        success: false,
        error: 'Invalid request to Stripe. Please check your configuration.',
      };
    }

    return {
      success: false,
      error: `Failed to create checkout session: ${error.message || 'Please try again.'}`,
    };
  }
}

/**
 * Get Stripe Customer Portal URL
 *
 * Allows coaches to manage their subscription (update payment method, cancel, etc.)
 *
 * @returns Object with portal URL or error message
 */
export async function createCustomerPortalSession() {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to access the customer portal.',
      };
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return {
        success: false,
        error: 'No subscription found. Please subscribe first.',
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return {
        success: false,
        error: 'Server configuration error. Please contact support.',
      };
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });

    return {
      success: true,
      portalUrl: portalSession.url,
    };
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return {
      success: false,
      error: 'Failed to access customer portal. Please try again.',
    };
  }
}

/**
 * Check Subscription Status
 *
 * Helper function to check if user's trial has expired and needs to subscribe
 *
 * @returns Object with subscription status information
 */
export async function checkSubscriptionStatus() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in.',
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: 'Unable to fetch subscription status.',
      };
    }

    const now = new Date();
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const isTrialExpired = trialEndsAt && trialEndsAt < now;

    return {
      success: true,
      subscriptionStatus: profile.subscription_status,
      trialEndsAt: profile.trial_ends_at,
      isTrialExpired,
      hasAccess: profile.subscription_status === 'active' || !isTrialExpired,
    };
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return {
      success: false,
      error: 'Failed to check subscription status.',
    };
  }
}
