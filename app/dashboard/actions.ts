'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Action to handle user logout
 * This is called from the LogoutButton client component
 * 
 * Clears all authentication tokens including:
 * - Access tokens (short-lived)
 * - Refresh tokens (persistent, 30-day tokens used for "Remember Me")
 * - Session cookies (HttpOnly, Secure, SameSite)
 * 
 * After logout, user must re-authenticate even if they had "Remember Me" enabled.
 */
export async function logout() {
  const supabase = await createClient();

  // Sign out the user - this invalidates and removes all tokens/cookies
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out:', error);
    throw new Error('Failed to log out');
  }

  // Revalidate the cache for the dashboard and root paths
  revalidatePath('/', 'layout');

  // Redirect to the home page
  redirect('/');
}
