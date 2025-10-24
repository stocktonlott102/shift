'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Create a new client
 *
 * Security: Uses Supabase Server Client with RLS policies
 * The coach_id is automatically set to auth.uid() on the server
 */
export async function addClient(formData: {
  coach_id: string;
  athlete_name: string;
  parent_email: string;
  parent_phone: string;
  hourly_rate: number;
}) {
  try {
    console.log('[addClient] Starting client creation');
    console.log('[addClient] Form data:', {
      athlete_name: formData.athlete_name,
      parent_email: formData.parent_email,
      hourly_rate: formData.hourly_rate,
      hasCoachId: !!formData.coach_id
    });

    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[addClient] Authentication error:', authError);
      return {
        success: false,
        error: 'You must be logged in to create a client.',
      };
    }

    console.log('[addClient] User authenticated:', user.id);

    // Ensure the coach_id matches the authenticated user (security check)
    if (formData.coach_id !== user.id) {
      console.error('[addClient] Coach ID mismatch:', {
        formCoachId: formData.coach_id,
        userCoachId: user.id
      });
      return {
        success: false,
        error: 'Unauthorized: Cannot create clients for other coaches.',
      };
    }

    // Validate required fields
    if (!formData.athlete_name || !formData.parent_email || !formData.parent_phone) {
      return {
        success: false,
        error: 'All fields are required.',
      };
    }

    if (formData.hourly_rate <= 0) {
      return {
        success: false,
        error: 'Hourly rate must be greater than 0.',
      };
    }

    // Insert the client into the database
    console.log('[addClient] Inserting client into database...');
    const { data, error } = await supabase
      .from('clients')
      .insert({
        coach_id: formData.coach_id,
        athlete_name: formData.athlete_name,
        parent_email: formData.parent_email,
        parent_phone: formData.parent_phone,
        hourly_rate: formData.hourly_rate,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('[addClient] Database error creating client:', error);
      console.error('[addClient] Error details:', JSON.stringify(error));
      console.error('[addClient] Error code:', error.code);
      console.error('[addClient] Error message:', error.message);
      return {
        success: false,
        error: `Failed to create client: ${error.message}`,
      };
    }

    console.log('[addClient] Client created successfully:', data?.id);

    // Revalidate the clients page to show the new client
    revalidatePath('/dashboard/clients');
    revalidatePath('/clients');

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('[addClient] UNEXPECTED ERROR:', error);
    console.error('[addClient] Error message:', error.message);
    console.error('[addClient] Error stack:', error.stack);
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message || 'Please try again.'}`,
    };
  }
}

/**
 * Server Action: Get all clients for the authenticated coach
 */
export async function getClients() {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view clients.',
        data: [],
      };
    }

    // Query clients - RLS automatically filters to only this coach's clients
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching clients:', error);
      return {
        success: false,
        error: 'Failed to fetch clients.',
        data: [],
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    console.error('Unexpected error fetching clients:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
      data: [],
    };
  }
}
