import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewClientPageClient from './NewClientPageClient';
import Link from 'next/link';

/**
 * Client Creation Page
 *
 * Security: Protected Server Component
 * - Verifies user authentication before rendering
 * - Redirects unauthenticated users to /login
 * - Passes authenticated coach_id to ClientForm component
 *
 * Route: /clients/new
 */
export default async function NewClientPage() {
  // Create Supabase server client
  const supabase = await createClient();

  // Check authentication status
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Shift</h1>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <Link
            href="/clients"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Clients
          </Link>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Athlete Profile
          </h2>
          <p className="text-gray-600">
            Add a new athlete and parent/guardian contact information to your coaching roster.
          </p>
        </div>

        {/* Client Form Card - Client Component with Router */}
        <NewClientPageClient coachId={user.id} />

        {/* Help Text */}
        <div className="mt-6 text-sm text-gray-500">
          <p>
            All fields are required. The hourly rate will be used for billing and invoicing.
          </p>
        </div>
      </main>
    </div>
  );
}
