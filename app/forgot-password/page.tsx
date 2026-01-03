'use client';

import { useState, FormEvent } from 'react';
import { requestPasswordResetAction } from '@/app/actions/auth-actions';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validation
    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const result = await requestPasswordResetAction({
        email,
      });

      if (!result.success && result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Show success message
      setSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Check your email
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We&apos;ve sent a password reset link to <span className="font-semibold">{email}</span>
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full px-4 py-3 text-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Back to Login
              </Link>

              <button
                onClick={() => setSuccess(false)}
                className="block w-full px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Didn&apos;t receive the email?
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
