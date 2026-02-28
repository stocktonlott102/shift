import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getClients } from '@/app/actions/client-actions';
import { getClientBalancesBatch } from '@/app/actions/lesson-history-actions';
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

  // Fetch all unpaid balances in a single batch (2 queries regardless of client count)
  // instead of the previous N+1 pattern (2 queries × number of clients).
  const clientIds = clients.map((c) => c.id);
  const balancesResult = await getClientBalancesBatch(clientIds);
  const balanceMap = balancesResult.success && balancesResult.data ? balancesResult.data : new Map<string, number>();

  const clientsWithBalances = clients.map((client) => ({
    ...client,
    unpaidBalance: balanceMap.get(client.id) ?? 0,
  }));

  return <ClientsPageClient coachId={user.id} clientsWithBalances={clientsWithBalances} />;
}
