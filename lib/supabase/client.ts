import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components
 * This client is used for browser-side operations like:
 * - User authentication
 * - Real-time subscriptions
 * - Client-side data fetching
 * 
 * Session persistence is controlled at login via the persistSession option.
 * When enabled, Supabase stores tokens in localStorage with automatic refresh.
 * Tokens expire after 1 hour by default, but refresh tokens last 30 days.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Store session in localStorage (persists across browser restarts when persistSession=true)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Auto-refresh tokens before expiry
        autoRefreshToken: true,
        // Persist session across page refreshes
        persistSession: true,
        // Detect when user opens multiple tabs
        detectSessionInUrl: true,
      },
    }
  );
}
