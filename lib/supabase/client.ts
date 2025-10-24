import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components
 * This client is used for browser-side operations like:
 * - User authentication
 * - Real-time subscriptions
 * - Client-side data fetching
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
