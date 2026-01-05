'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ClientForm from '@/components/ClientForm';
import type { Client } from '@/lib/types/client';

interface ClientWithBalance extends Client {
  unpaidBalance: number;
}

interface ClientsPageClientProps {
  coachId: string;
  clientsWithBalances: ClientWithBalance[];
}

export default function ClientsPageClient({ coachId, clientsWithBalances }: ClientsPageClientProps) {
  const router = useRouter();
  const [showClientForm, setShowClientForm] = useState(false);

  // Handle successful client creation
  const handleClientSuccess = () => {
    setShowClientForm(false);
    router.refresh(); // Refresh the page data
  };

  // Handle cancel
  const handleCancelClient = () => {
    setShowClientForm(false);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-800">
        {/* Header - Hidden on mobile (md and below) */}
        <header className="hidden md:block bg-white dark:bg-neutral-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Clients
              </h1>
              <button
                onClick={() => setShowClientForm(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Add New Client
              </button>
            </div>
          </div>
        </header>

        {/* Floating Add Button - Visible only on mobile */}
        <button
          onClick={() => setShowClientForm(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 bg-primary-600 hover:bg-primary-700 text-white font-semibold p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="Add New Client"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Empty State */}
          {clientsWithBalances.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-12 text-center">
              <div className="flex flex-col items-center justify-center space-y-6">
                {/* Icon */}
                <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-6">
                  <svg
                    className="w-16 h-16 text-primary-600 dark:text-primary-400"
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

                {/* Message */}
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    No Clients Yet
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
                    You have no clients yet. Start by adding your first one!
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => setShowClientForm(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Add Your First Client
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Clients Count */}
              <div className="mb-6">
                <p className="text-neutral-600 dark:text-neutral-400">
                  {clientsWithBalances.length} {clientsWithBalances.length === 1 ? 'Client' : 'Clients'}
                </p>
              </div>

              {/* Clients Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientsWithBalances.map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="block bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden group"
                  >
                    <div className="p-6">
                      {/* Client Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {client.first_name} {client.last_name ? `${client.last_name.charAt(0)}.` : ''}
                          </h3>
                        </div>
                        <svg
                          className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>

                      {/* Client Details */}
                      <div className="space-y-2">
                        {/* Email */}
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                          <svg
                            className="w-4 h-4 mr-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="truncate">{client.parent_email}</span>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                          <svg
                            className="w-4 h-4 mr-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>{client.parent_phone}</span>
                        </div>

                        {/* Outstanding Balance */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Outstanding Balance
                          </span>
                          <span className={`text-lg font-bold ${client.unpaidBalance > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400'}`}>
                            ${client.unpaidBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Client Form Modal */}
      {showClientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <ClientForm
              coachId={coachId}
              onSuccess={handleClientSuccess}
              onCancel={handleCancelClient}
            />
          </div>
        </div>
      )}
    </>
  );
}
