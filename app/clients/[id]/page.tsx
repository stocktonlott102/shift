import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getClientById } from '@/app/actions/client-actions';
import BackButton from './BackButton';
import ClientDetailClient from './ClientDetailClient';

/**
 * Client Detail Page (Protected Server Component)
 *
 * Security:
 * - Uses Supabase Server Client for authentication check
 * - Redirects unauthenticated users to /login
 * - Fetches client using server action with RLS enforcement
 * - RLS ensures coaches can only view their own clients
 *
 * Route: /clients/[id]
 */

export default async function ClientDetailPage({ params }: any) {
  const { id } = await params;
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

  // Fetch client details
  const result = await getClientById(id);

  // If client not found or error, show 404
  if (!result.success || !result.data) {
    notFound();
  }

  const client = result.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Client Details
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content - Delegate to Client Component for interactivity */}
      <ClientDetailClient client={client} coachId={user.id} />
    </div>
  );
}
