'use client';

import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import LogoutButton from '@/components/LogoutButton';
import TutorialModal from '@/components/TutorialModal';
import AccordionFAQ from '@/components/AccordionFAQ';
import { updateEmailAction } from '@/app/actions/auth-actions';

const faqItems = [
  {
    id: 'calendar',
    title: 'Calendar',
    content: 'The Calendar is your main workspace. Tap any time slot to book a lesson or add a time block. Lessons appear color-coded and you can tap them to view details, edit, or mark payment.',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    content: 'The Dashboard gives you a snapshot of your business. See how many active clients you have, how many lesson types are set up, and your current pending balance at a glance.',
  },
  {
    id: 'clients',
    title: 'Clients',
    content: 'Clients is your roster. Add a new client with their name and contact info, then view their full lesson history and any outstanding balance from their profile page.',
  },
  {
    id: 'lesson-types',
    title: 'Lesson Types',
    content: 'Lesson Types define your services. Create types like "60-min Private" or "Group Session" with a default rate, then select them when booking so pricing fills in automatically.',
  },
  {
    id: 'financials',
    title: 'Financials',
    content: 'Financials tracks what you are owed. See a breakdown of pending payments across all clients and mark lessons as paid once you collect.',
  },
];

interface SettingsClientProps {
  user: User;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const searchParams = useSearchParams();
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if email was just confirmed via URL parameter
  useEffect(() => {
    if (searchParams.get('email_confirmed') === 'true') {
      setEmailConfirmed(true);
      // Clear the URL parameter
      window.history.replaceState(null, '', '/settings');
    }
  }, [searchParams]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await updateEmailAction({ newEmail });

      if (!result.success) {
        setError(result.error || 'Failed to update email');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        'Verification email sent! Please check your inbox (and spam folder) for the confirmation link.'
      );
      setIsEditingEmail(false);
      setNewEmail('');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingEmail(false);
    setNewEmail('');
    setError(null);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Email Confirmed Success Banner */}
          {emailConfirmed && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mr-3"
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
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Your email address has been successfully updated!
                </p>
              </div>
            </div>
          )}

          {/* Account Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Account
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5"
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
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {successMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Email Display/Edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                {isEditingEmail ? (
                  <form onSubmit={handleEmailChange} className="space-y-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Current: {user.email}
                    </div>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      A verification email will be sent to your new email address.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isLoading || !newEmail}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {isLoading ? 'Sending...' : 'Send Verification Email'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 px-4 py-3 rounded-lg flex-grow">
                      {user.email}
                    </div>
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member Since
                </label>
                <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 px-4 py-3 rounded-lg">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Sign Out
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sign out of your account on this device
                    </p>
                  </div>
                </div>
                <LogoutButton />
              </div>
            </div>
          </div>

          {/* Help & Getting Started Section */}
          {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Help & Getting Started
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  New to Shift? Replay the tutorial to get a quick overview of all the features.
                </p>
                <button
                  onClick={() => setShowTutorial(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Replay Tutorial
                </button>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feature Guide
                </h3>
                <AccordionFAQ items={faqItems} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
