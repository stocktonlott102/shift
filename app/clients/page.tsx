import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getClients } from '@/app/actions/client-actions';
import { calculateUnpaidBalance } from '@/app/actions/lesson-history-actions';
import ClientsPageClient from './ClientsPageClient';

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

  return <ClientsPageClient coachId={user.id} clientsWithBalances={clientsWithBalances} />;
}
