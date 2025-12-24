'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/app/actions/stripe-actions';

interface SubscribeButtonProps {
  priceId: string;
}

/**
 * Subscribe Button Client Component
 *
 * Purpose: Handles Stripe Checkout Session creation and redirect
 * - Calls createCheckoutSession server action
 * - Redirects user to Stripe Checkout page
 * - Shows loading state during checkout creation
 * - Displays error messages if checkout fails
 *
 * Security: Server action handles all authentication and Stripe API calls
 */
export default function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call server action to create Stripe Checkout Session
      const result = await createCheckoutSession({ priceId });

      if (result.success && result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl;
      } else {
        // Show error message
        setError(result.error || 'Failed to start checkout. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error starting checkout:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            Starting Checkout...
          </span>
        ) : (
          'Subscribe Now - $10/month'
        )}
      </button>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
