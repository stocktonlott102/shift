import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getClients } from '@/app/actions/client-actions';
import { calculateUnpaidBalance } from '@/app/actions/lesson-history-actions';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

/**
 * Clients List Page (Protected Server Component)
 *
 * Security:
 * - Uses Supabase Server Client for authentication check
 * - Redirects unauthenticated users to /login
 * - Fetches clients using server action with RLS enforcement
 *
 * Per PRD US-5: View Athlete Profile
 */
export default async function ClientsPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to login
  if (error || !user) {
    redirect('/login');
  }

  // Fetch clients for this coach using server action
  const result = await getClients();

  const clients = result.success ? result.data : [];

  // Fetch unpaid balances for all clients
  const clientsWithBalances = await Promise.all(
    clients.map(async (client) => {
      const balanceResult = await calculateUnpaidBalance({ clientId: client.id });
      const balance = balanceResult.success && balanceResult.data ? balanceResult.data.balance : 0;
      return { ...client, unpaidBalance: balance };
    })
  );

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Clients
              </h1>
              <Link
                href="/clients/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Add New Client
              </Link>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Empty State */}
        {clientsWithBalances.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Icon */}
              <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-6">
                <svg
                  className="w-16 h-16 text-indigo-600 dark:text-indigo-400"
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Clients Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  You have no clients yet. Start by adding your first one!
                </p>
              </div>

              {/* CTA Button */}
              <Link
                href="/clients/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Add Your First Client
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Clients Count */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {clientsWithBalances.length} {clientsWithBalances.length === 1 ? 'Client' : 'Clients'}
              </p>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientsWithBalances.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    {/* Client Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {client.first_name} {client.last_name ? `${client.last_name.charAt(0)}.` : ''}
                        </h3>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
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
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
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
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
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
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Outstanding Balance
                        </span>
                        <span className={`text-lg font-bold ${client.unpaidBalance > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
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
    </>
  );
}
