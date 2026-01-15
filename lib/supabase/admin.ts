import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client using the service role key
 *
 * SECURITY WARNING: This client bypasses Row Level Security!
 * Only use for:
 * - Audit logging (needs to write logs regardless of user context)
 * - Webhook handlers (no user session available)
 * - Admin operations that require elevated privileges
 *
 * NEVER expose this client to the browser or use in client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
