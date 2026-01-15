import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  logSubscriptionCreated,
  logSubscriptionUpdated,
  logSubscriptionCancelled,
  logSubscriptionPaymentFailed,
} from '@/lib/audit-log';

/**
 * Stripe Webhook Handler
 *
 * Route: POST /api/webhooks/stripe
 *
 * Purpose:
 * - Listens for Stripe webhook events (checkout.session.completed, etc.)
 * - Verifies webhook signature for security
 * - Updates coach subscription status in profiles table
 *
 * Security:
 * - Webhook signature verification prevents unauthorized requests
 * - Uses Supabase Service Role for privileged database access
 * - Only updates subscription status, no other profile data
 *
 * Setup Instructions:
 * --------------------
 * 1. Add STRIPE_WEBHOOK_SECRET to environment variables:
 *    - Local: Get from Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 *    - Production: Get from Stripe Dashboard → Webhooks → Add endpoint
 *
 * 2. Configure webhook endpoint in Stripe Dashboard:
 *    - URL: https://yourdomain.com/api/webhooks/stripe
 *    - Events to listen for:
 *      * checkout.session.completed
 *      * customer.subscription.updated
 *      * customer.subscription.deleted
 *
 * 3. Add SUPABASE_SERVICE_ROLE_KEY to environment variables:
 *    - Get from Supabase Dashboard → Settings → API → service_role key
 *    - WARNING: Keep this secret! Never expose to client.
 */

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Initialize Supabase Admin Client (Service Role)
// This bypasses Row Level Security for privileged operations
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * POST /api/webhooks/stripe
 *
 * Handles incoming Stripe webhook events
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  // Verify webhook signature
  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  // Log the event for debugging
  console.log(`Received Stripe event: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing webhook event:', error);
    return NextResponse.json(
      { error: 'Error processing webhook event' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 *
 * Triggered when a coach successfully completes the Stripe Checkout
 * - Updates subscription_status to 'active'
 * - Stores Stripe customer_id and subscription_id
 * - Clears trial_ends_at (trial is over)
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  // Extract user_id from metadata or client_reference_id
  const userId = session.client_reference_id || session.metadata?.user_id;

  if (!userId) {
    console.error('No user_id found in checkout session:', session.id);
    return;
  }

  // Extract subscription details
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Update profile in database
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      subscription_id: subscriptionId,
      subscription_status: 'active',
      trial_ends_at: null, // Clear trial end date
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Error updating profile after checkout:', error);
    throw error;
  }

  // Log subscription creation (fire-and-forget)
  logSubscriptionCreated(userId, subscriptionId, customerId);

  console.log(`Successfully activated subscription for user ${userId}`);
  console.log('Updated profile:', data);
}

/**
 * Handle customer.subscription.updated
 *
 * Triggered when subscription status changes (e.g., payment method updated, plan changed)
 * - Updates subscription_status based on Stripe subscription status
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  const userId = subscription.metadata?.user_id;
  const customerId = subscription.customer as string;

  // If no user_id in metadata, try to find user by customer_id
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !profile) {
      console.error('Could not find user for customer:', customerId);
      return;
    }

    targetUserId = profile.id;
  }

  // Map Stripe subscription status to our subscription_status
  let subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'incomplete';

  switch (subscription.status) {
    case 'active':
      subscriptionStatus = 'active';
      break;
    case 'past_due':
      subscriptionStatus = 'past_due';
      break;
    case 'canceled':
    case 'unpaid':
      subscriptionStatus = 'canceled';
      break;
    case 'incomplete':
    case 'incomplete_expired':
      subscriptionStatus = 'incomplete';
      break;
    default:
      subscriptionStatus = 'active'; // Default to active for other statuses
  }

  // Update profile
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscriptionStatus,
      subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)
    .select();

  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }

  // Log subscription update (fire-and-forget)
  logSubscriptionUpdated(targetUserId, subscription.id, subscriptionStatus);

  console.log(`Updated subscription status to ${subscriptionStatus} for user ${targetUserId}`);
  console.log('Updated profile:', data);
}

/**
 * Handle customer.subscription.deleted
 *
 * Triggered when subscription is canceled/deleted
 * - Updates subscription_status to 'canceled'
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  const customerId = subscription.customer as string;

  // Find user by customer_id
  const { data: profile, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (findError || !profile) {
    console.error('Could not find user for customer:', customerId);
    return;
  }

  // Update profile to canceled status
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .select();

  if (error) {
    console.error('Error updating subscription to canceled:', error);
    throw error;
  }

  // Log subscription cancellation (fire-and-forget)
  logSubscriptionCancelled(profile.id, subscription.id);

  console.log(`Subscription canceled for user ${profile.id}`);
  console.log('Updated profile:', data);
}

/**
 * Handle invoice.payment_failed
 *
 * Triggered when automatic payment fails
 * - Updates subscription_status to 'past_due'
 * - Could send email notification to coach (future)
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  const customerId = invoice.customer as string;

  // Find user by customer_id
  const { data: profile, error: findError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (findError || !profile) {
    console.error('Could not find user for customer:', customerId);
    return;
  }

  // Update profile to past_due status
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .select();

  if (error) {
    console.error('Error updating subscription to past_due:', error);
    throw error;
  }

  // Log subscription payment failure (fire-and-forget)
  logSubscriptionPaymentFailed(profile.id, invoice.id);

  console.log(`Payment failed for user ${profile.id} - marked as past_due`);
  console.log('Updated profile:', data);

  // TODO: Send email notification to coach about failed payment
}
