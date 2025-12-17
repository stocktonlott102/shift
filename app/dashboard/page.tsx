import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SubscribeButton from '@/components/SubscribeButton';
import Navigation from '@/components/Navigation';
import DashboardWrapper from '@/components/DashboardWrapper';
import { checkSubscriptionStatus } from '@/app/actions/stripe-actions';
import { getOutstandingLessonsCount } from '@/app/actions/lesson-history-actions';

/**
 * Protected Dashboard Page (Server Component)
 *
 * Security:
 * - Uses Supabase Server Client for session verification
 * - Redirects unauthenticated users to /login
 * - All data fetching happens on the server
 * - Fetches subscription status to display trial banner or active status
 * - Wrapped with DashboardWrapper to handle session refresh after Stripe redirects
 *
 * Per PRD Technical Architecture:
 * "All sensitive data handling, database reads/writes, and authentication
 * checks for protected routes MUST use Server Components and the
 * Supabase Server Client (lib/supabase/server.ts)."
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If not authenticated or error, redirect to login
  if (error || !user) {
    redirect('/login');
  }

  // Fetch subscription status
  const subscriptionStatus = await checkSubscriptionStatus();

  // Fetch outstanding lessons count
  const outstandingLessonsResult = await getOutstandingLessonsCount();
  const outstandingCount = outstandingLessonsResult.success ? outstandingLessonsResult.data?.count || 0 : 0;

  // Extract subscription data
  const currentStatus = subscriptionStatus.success ? subscriptionStatus.subscriptionStatus : 'trial';
  const isActive = currentStatus === 'active';
  const isTrial = currentStatus === 'trial';
  const isCanceled = currentStatus === 'canceled';
  const isPastDue = currentStatus === 'past_due';
  const isIncomplete = currentStatus === 'incomplete';
  const isTrialExpired = subscriptionStatus.success && subscriptionStatus.isTrialExpired;
  const trialEndsAt = subscriptionStatus.success ? subscriptionStatus.trialEndsAt : null;

  // Determine if user needs to subscribe (any status that is NOT 'active')
  const needsSubscription = !isActive;

  // Calculate days remaining in trial
  let daysRemaining = 0;
  if (trialEndsAt && isTrial && !isTrialExpired) {
    const now = new Date();
    const trialEnd = new Date(trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Determine banner message and urgency based on status
  let bannerTitle = '180-Day Free Trial Active!';
  let bannerMessage = `You have ${daysRemaining} days remaining in your free trial.`;
  let bannerSubtext = 'Enjoy full access to all Shift features. Subscribe before your trial ends to continue using Shift.';
  let bannerColor = 'from-indigo-500 to-purple-600'; // Default gradient

  if (isCanceled) {
    bannerTitle = 'Subscription Canceled - Resubscribe Today!';
    bannerMessage = 'Your subscription has been canceled. Reactivate to continue using Shift.';
    bannerSubtext = 'Only $10/month to regain access to all coaching management features.';
    bannerColor = 'from-orange-500 to-red-600';
  } else if (isPastDue) {
    bannerTitle = 'Payment Failed - Update Payment Method';
    bannerMessage = 'Your last payment failed. Please update your payment method to continue.';
    bannerSubtext = 'Update your payment details to maintain access to Shift.';
    bannerColor = 'from-red-500 to-pink-600';
  } else if (isIncomplete) {
    bannerTitle = 'Complete Your Subscription';
    bannerMessage = 'Your subscription setup is incomplete. Complete checkout to activate.';
    bannerSubtext = 'Finish your subscription to unlock all Shift features.';
    bannerColor = 'from-yellow-500 to-orange-600';
  } else if (isTrial && isTrialExpired) {
    bannerTitle = 'Free Trial Ended - Subscribe Today!';
    bannerMessage = 'Your 180-day free trial has ended. Subscribe now to continue using Shift.';
    bannerSubtext = 'Only $10/month to keep managing your coaching business efficiently.';
    bannerColor = 'from-red-500 to-pink-600';
  } else if (isTrial && !isTrialExpired) {
    // Keep default trial message (already set above)
    bannerTitle = '180-Day Free Trial Active!';
    bannerMessage = `You have ${daysRemaining} days remaining in your free trial.`;
  }

  // Get Stripe Price ID from environment
  const stripePriceId = process.env.STRIPE_PRICE_ID || '';

  // User is authenticated, render the dashboard wrapped with session refresh handler
  return (
    <DashboardWrapper>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Subscription Status Banner - Only show for non-active users */}
        {needsSubscription && (
          <div className={`bg-gradient-to-r ${bannerColor} rounded-lg shadow-xl p-6 sm:p-8 mb-8 text-white`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-2xl font-bold">{bannerTitle}</h3>
                </div>
                <p className="text-white/90 mb-2 font-medium">
                  {bannerMessage}
                </p>
                <p className="text-sm text-white/80">
                  {bannerSubtext}
                </p>
              </div>
              <div className="flex-shrink-0">
                <SubscribeButton priceId={stripePriceId} />
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Outstanding Lessons Card */}
          <Link
            href="/outstanding-lessons"
            className="block bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Outstanding Lessons
              </h3>
              {outstandingCount > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                  {outstandingCount}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {outstandingCount}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lessons need confirmation
            </p>
          </Link>

          {/* Clients Card */}
          <Link
            href="/clients"
            className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Clients
              </h3>
              <svg
                className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Active clients
            </p>
          </Link>

          {/* Outstanding Payments Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Outstanding
              </h3>
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">$0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pending payments
            </p>
          </div>

          {/* Lesson Types Card */}
          <Link
            href="/lesson-types"
            className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Lesson Types
              </h3>
              <svg
                className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v12m6-6H6"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create, edit, and organize lesson types
            </p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/outstanding-lessons"
              className="flex flex-col items-center justify-center p-6 border-2 border-yellow-500 dark:border-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative"
            >
              {outstandingCount > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  {outstandingCount}
                </span>
              )}
              <svg
                className="w-10 h-10 text-yellow-600 dark:text-yellow-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                Confirm Lessons
              </span>
            </Link>

            <Link
              href="/clients/new"
              className="flex flex-col items-center justify-center p-6 border-2 border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <svg
                className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Add Client
              </span>
            </Link>

            <button className="flex flex-col items-center justify-center p-6 border-2 border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
              <svg
                className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Create Invoice
              </span>
            </button>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Shift is brand new! Please be patient with any bugs. If you encounter any issues, reach out to support.
            </p>
          </div>
        </div>
      </main>
    </div>
    </DashboardWrapper>
  );
}
