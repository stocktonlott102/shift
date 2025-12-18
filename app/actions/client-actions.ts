'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateClientData } from '@/lib/validation/client-validation';
import { ERROR_MESSAGES } from '@/lib/constants/messages';

/**
 * Server Action: Create a new client
 *
 * Security: Uses Supabase Server Client with RLS policies
 * The coach_id is automatically set to auth.uid() on the server
 */
export async function addClient(formData: {
  coach_id: string;
  first_name: string;
  last_name: string;
  parent_email: string;
  parent_phone: string;
  notes?: string;
}) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return {
        success: false,
        error: 'You must be logged in to create a client.',
      };
    }

    // Ensure the coach_id matches the authenticated user (security check)
    if (formData.coach_id !== user.id) {
      console.error('Coach ID mismatch');
      return {
        success: false,
        error: 'Unauthorized: Cannot create clients for other coaches.',
      };
    }

    // Server-side validation using shared validator
    const validationErrors = validateClientData({
      first_name: formData.first_name,
      last_name: formData.last_name,
      parent_email: formData.parent_email,
      parent_phone: formData.parent_phone,
    });

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors[0].message || ERROR_MESSAGES.CLIENT.CREATE_FAILED,
      };
    }

    // Insert the client into the database
    const { data, error } = await supabase
      .from('clients')
      .insert({
        coach_id: formData.coach_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        parent_email: formData.parent_email,
        parent_phone: formData.parent_phone,
        notes: formData.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating client:', error);
      return {
        success: false,
        error: `Failed to create client: ${error.message}`,
      };
    }

    // Revalidate the clients page to show the new client
    revalidatePath('/dashboard/clients');
    revalidatePath('/clients');

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Unexpected error:', error);
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
      .order('first_name', { ascending: true });

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

/**
 * Server Action: Get a single client by ID
 */
export async function getClientById(clientId: string) {
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
        error: 'You must be logged in to view client details.',
      };
    }

    // Query single client - RLS automatically ensures it belongs to this coach
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      // Check if this is a "no rows returned" error (which is expected behavior)
      if (error.code === 'PGRST116' || (!error.code && !error.message)) {
        // Silent failure - client doesn't exist or user doesn't have access
        // This is normal and will result in a 404 page
        console.debug('Client not found for ID:', clientId);
        return {
          success: false,
          error: 'Client not found.',
        };
      }
      // Log other errors
      console.error('Database error fetching client:', error);
      return {
        success: false,
        error: `Failed to fetch client details: ${error.message || 'Unknown error'}`,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Client not found.',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Unexpected error fetching client:', error);
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message || 'Please try again.'}`,
    };
  }
}

/**
 * Server Action: Update an existing client
 */
export async function updateClient(
  clientId: string,
  formData: {
    first_name: string;
    last_name: string;
    parent_email: string;
    parent_phone: string;
    notes?: string;
  }
) {
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
        error: 'You must be logged in to update a client.',
      };
    }

    // Server-side validation using shared validator
    const validationErrors = validateClientData({
      first_name: formData.first_name,
      last_name: formData.last_name,
      parent_email: formData.parent_email,
      parent_phone: formData.parent_phone,
    });

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors[0].message || ERROR_MESSAGES.CLIENT.UPDATE_FAILED,
      };
    }

    // Update the client - RLS ensures user owns this client
    const { data, error } = await supabase
      .from('clients')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        parent_email: formData.parent_email,
        parent_phone: formData.parent_phone,
        notes: formData.notes || null,
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating client:', error);
      return {
        success: false,
        error: `Failed to update client: ${error.message}`,
      };
    }

    // Revalidate relevant pages
    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Unexpected error updating client:', error);
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message || 'Please try again.'}`,
    };
  }
}

/**
 * Server Action: Delete a client
 *
 * Permanently deletes the client record from the database.
 * Related lessons and lesson_participants will be cascade deleted.
 */
export async function deleteClient(clientId: string) {
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
        error: 'You must be logged in to delete a client.',
      };
    }

    // Delete the client (cascade will handle related records)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('coach_id', user.id);

    if (error) {
      console.error('Database error deleting client:', error);
      return {
        success: false,
        error: `Failed to delete client: ${error.message}`,
      };
    }

    // Revalidate relevant pages
    revalidatePath('/clients');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Client deleted successfully',
    };
  } catch (error: any) {
    console.error('Unexpected error deleting client:', error);
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message || 'Please try again.'}`,
    };
  }
}
