'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

/**
 * Dashboard Wrapper Client Component
 *
 * Purpose: Handles session refresh after Stripe redirect
 * - Checks for status=success or status=cancel query parameters
 * - Refreshes Supabase session to prevent logout after external redirect
 * - Displays temporary success/cancel messages
 * - Cleans up URL query parameters after handling
 *
 * Why this is needed:
 * When users are redirected from Stripe back to the dashboard, the session
 * cookie can become stale, causing them to be logged out. This component
 * explicitly refreshes the session to maintain authentication.
 */
export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleStripeRedirect = async () => {
      const status = searchParams.get('status');
      const sessionId = searchParams.get('session_id');

      // Only process if we have a status parameter
      if (!status) return;

      console.log('[DashboardWrapper] Stripe redirect detected:', { status, sessionId });
      setIsRefreshing(true);

      try {
        // Refresh the Supabase session to prevent logout
        const supabase = createClient();
        console.log('[DashboardWrapper] Refreshing session...');

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[DashboardWrapper] Session refresh error:', error);
          // If session refresh fails, try to get a new session
          await supabase.auth.refreshSession();
        } else {
          console.log('[DashboardWrapper] Session refreshed successfully:', !!session);
        }

        // Display appropriate message based on status
        if (status === 'success') {
          console.log('[DashboardWrapper] Subscription successful!');
          setMessage({
            type: 'success',
            text: 'Subscription confirmed! Your payment was successful. Welcome to Shift!',
          });
        } else if (status === 'cancel') {
          console.log('[DashboardWrapper] Checkout canceled');
          setMessage({
            type: 'error',
            text: 'Checkout canceled. No charges were made. You can subscribe anytime.',
          });
        }

        // Clean up URL by removing query parameters
        console.log('[DashboardWrapper] Cleaning up URL...');
        router.replace('/dashboard', { scroll: false });

        // Auto-dismiss message after 5 seconds
        setTimeout(() => {
          setMessage({ type: null, text: '' });
        }, 5000);

      } catch (error) {
        console.error('[DashboardWrapper] Error handling redirect:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    handleStripeRedirect();
  }, [searchParams, router]);

  return (
    <>
      {/* Success/Cancel Message Banner */}
      {message.type && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-down ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
          } border-2 rounded-lg shadow-xl p-4`}
        >
          <div className="flex items-start">
            {/* Icon */}
            {message.type === 'success' ? (
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}

            {/* Message Text */}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  message.type === 'success'
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-yellow-900 dark:text-yellow-100'
                }`}
              >
                {message.text}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setMessage({ type: null, text: '' })}
              className={`ml-3 flex-shrink-0 ${
                message.type === 'success'
                  ? 'text-green-600 dark:text-green-400 hover:text-green-800'
                  : 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay (optional - shown while refreshing) */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black bg-opacity-10 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 flex items-center space-x-3">
            <svg
              className="animate-spin h-5 w-5 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Verifying session...
            </span>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {children}
    </>
  );
}
