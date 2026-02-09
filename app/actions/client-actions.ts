'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CreateClientSchema, UpdateClientSchema } from '@/lib/validations/client';
import {
  logClientCreated,
  logClientUpdated,
  logClientDeleted,
} from '@/lib/audit-log';

/**
 * Server Action: Create a new client
 *
 * Security: Uses Supabase Server Client with RLS policies
 * Uses Zod validation to prevent SQL injection and XSS attacks
 */
export async function addClient(formData: unknown) {
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

    // SECURITY: Validate and sanitize all input using Zod
    // This prevents SQL injection, XSS attacks, and invalid data
    const validationResult = CreateClientSchema.safeParse(formData);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const validatedData = validationResult.data;

    // Insert the client into the database with validated data
    // Convert empty strings to null for optional fields
    const { data, error } = await supabase
      .from('clients')
      .insert({
        coach_id: user.id, // Always use authenticated user's ID for security
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        parent_email: validatedData.parent_email && validatedData.parent_email.trim() ? validatedData.parent_email : null,
        parent_phone: validatedData.parent_phone && validatedData.parent_phone.trim() ? validatedData.parent_phone : null,
        notes: validatedData.notes || null,
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

    // Log client creation (fire-and-forget)
    logClientCreated(
      user.id,
      data.id,
      `${data.first_name} ${data.last_name}`,
      {
        email: data.parent_email,
        phone: data.parent_phone,
      }
    );

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
 * Uses Zod validation to prevent SQL injection and XSS attacks
 */
export async function updateClient(clientId: string, formData: unknown) {
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

    // SECURITY: Validate clientId is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
      return {
        success: false,
        error: 'Invalid client ID format',
      };
    }

    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = UpdateClientSchema.safeParse(formData);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const validatedData = validationResult.data;

    // Fetch old values for audit log comparison
    const { data: oldClient } = await supabase
      .from('clients')
      .select('first_name, last_name, parent_email, parent_phone, notes')
      .eq('id', clientId)
      .single();

    // Update the client - RLS ensures user owns this client
    // Convert empty strings to null for optional fields
    const { data, error } = await supabase
      .from('clients')
      .update({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        parent_email: validatedData.parent_email && validatedData.parent_email.trim() ? validatedData.parent_email : null,
        parent_phone: validatedData.parent_phone && validatedData.parent_phone.trim() ? validatedData.parent_phone : null,
        notes: validatedData.notes || null,
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

    // Log client update (fire-and-forget)
    logClientUpdated(
      user.id,
      clientId,
      `${data.first_name} ${data.last_name}`,
      oldClient || {},
      {
        first_name: data.first_name,
        last_name: data.last_name,
        parent_email: data.parent_email,
        parent_phone: data.parent_phone,
        notes: data.notes,
      }
    );

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

    // Fetch client name before delete for audit log
    const { data: clientData } = await supabase
      .from('clients')
      .select('first_name, last_name')
      .eq('id', clientId)
      .single();

    // --- Clean up lessons before deleting client ---

    // Step 1: Find all lessons this client participates in
    const { data: participantRows } = await supabase
      .from('lesson_participants')
      .select('lesson_id')
      .eq('client_id', clientId);

    if (participantRows && participantRows.length > 0) {
      const lessonIds = participantRows.map((r) => r.lesson_id);

      // Step 2: Count participants per lesson
      const { data: allParticipants } = await supabase
        .from('lesson_participants')
        .select('lesson_id, client_id')
        .in('lesson_id', lessonIds);

      const participantCounts = new Map<string, number>();
      for (const p of allParticipants || []) {
        participantCounts.set(p.lesson_id, (participantCounts.get(p.lesson_id) || 0) + 1);
      }

      const multiParticipantLessonIds = lessonIds.filter((id) => (participantCounts.get(id) || 0) > 1);
      const singleParticipantLessonIds = lessonIds.filter((id) => (participantCounts.get(id) || 0) <= 1);

      // Step 3: Multi-participant lessons — remove this client, keep the lesson
      if (multiParticipantLessonIds.length > 0) {
        // Remove participant record
        await supabase
          .from('lesson_participants')
          .delete()
          .eq('client_id', clientId)
          .in('lesson_id', multiParticipantLessonIds);

        // Prevent FK cascade from deleting these lessons
        await supabase
          .from('lessons')
          .update({ client_id: null })
          .eq('client_id', clientId)
          .in('id', multiParticipantLessonIds);
      }

      // Step 4: Single-participant lessons with client_id = NULL — delete explicitly
      if (singleParticipantLessonIds.length > 0) {
        await supabase
          .from('lessons')
          .delete()
          .is('client_id', null)
          .in('id', singleParticipantLessonIds)
          .eq('coach_id', user.id);
      }
      // Single-participant lessons with client_id = clientId are handled by FK cascade below
    }

    // Step 5: Delete the client (FK cascade handles remaining single-client lessons)
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

    // Log client deletion (fire-and-forget)
    if (clientData) {
      logClientDeleted(
        user.id,
        clientId,
        `${clientData.first_name} ${clientData.last_name}`
      );
    }

    // Revalidate relevant pages
    revalidatePath('/clients');
    revalidatePath('/dashboard');
    revalidatePath('/calendar');

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
