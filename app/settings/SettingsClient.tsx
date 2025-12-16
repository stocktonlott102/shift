'use client';

import { User } from '@supabase/supabase-js';
import Navigation from '@/components/Navigation';
import LogoutButton from '@/components/LogoutButton';

interface SettingsClientProps {
  user: User;
}

export default function SettingsClient({ user }: SettingsClientProps) {
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

          {/* Account Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Account
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Email Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 px-4 py-3 rounded-lg">
                  {user.email}
                </div>
              </div>

              {/* User ID (for debugging/support) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User ID
                </label>
                <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-4 py-3 rounded-lg font-mono text-xs">
                  {user.id}
                </div>
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

          {/* Placeholder for Future Sections */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0"
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
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  More Settings Coming Soon
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Additional settings like notifications, business preferences, and appearance options will be available in future updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
