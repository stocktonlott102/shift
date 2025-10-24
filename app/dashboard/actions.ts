'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Action to handle user logout
 * This is called from the LogoutButton client component
 */
export async function logout() {
  const supabase = await createClient();

  // Sign out the user
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
