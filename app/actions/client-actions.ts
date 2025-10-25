'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Create a new client
 *
 * Security: Uses Supabase Server Client with RLS policies
 * The coach_id is automatically set to auth.uid() on the server
 *
 * Enhanced for Vercel Production with comprehensive logging
 */
export async function addClient(formData: {
  coach_id: string;
  athlete_name: string;
  parent_email: string;
  parent_phone: string;
  hourly_rate: number;
}) {
  try {
    // === ENTRY POINT LOGGING ===
    console.log('=== [addClient] SERVER ACTION STARTED ===');
    console.log('[addClient] Timestamp:', new Date().toISOString());
    console.log('[addClient] Environment:', process.env.NODE_ENV);
    console.log('[addClient] Vercel Environment:', process.env.VERCEL_ENV || 'local');

    // Log form data (sanitized)
    console.log('[addClient] Form data received:', {
      athlete_name: formData.athlete_name,
      parent_email: formData.parent_email,
      parent_phone: formData.parent_phone ? '***' + formData.parent_phone.slice(-4) : 'none',
      hourly_rate: formData.hourly_rate,
      hasCoachId: !!formData.coach_id,
      coachIdLength: formData.coach_id?.length || 0
    });

    // === VALIDATE REQUIRED FIELDS EARLY ===
    if (!formData.athlete_name || !formData.parent_email || !formData.parent_phone) {
      console.error('[addClient] Validation failed: Missing required fields', {
        hasAthleteName: !!formData.athlete_name,
        hasParentEmail: !!formData.parent_email,
        hasParentPhone: !!formData.parent_phone
      });
      return {
        success: false,
        error: 'All fields are required.',
      };
    }

    if (formData.hourly_rate <= 0) {
      console.error('[addClient] Validation failed: Invalid hourly rate', formData.hourly_rate);
      return {
        success: false,
        error: 'Hourly rate must be greater than 0.',
      };
    }

    // === SUPABASE CLIENT INITIALIZATION ===
    console.log('[addClient] Initializing Supabase server client...');

    // Verify environment variables are present
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('[addClient] Environment variables check:', {
      hasSupabaseUrl,
      hasSupabaseKey,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0
    });

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.error('[addClient] CRITICAL: Missing Supabase environment variables');
      return {
        success: false,
        error: 'Server configuration error: Missing Supabase credentials.',
      };
    }

    let supabase;
    try {
      supabase = await createClient();
      console.log('[addClient] Supabase client created successfully');
    } catch (clientError: any) {
      console.error('[addClient] CRITICAL: Failed to create Supabase client', {
        error: clientError.message,
        stack: clientError.stack
      });
      return {
        success: false,
        error: 'Failed to initialize database connection.',
      };
    }

    // === AUTHENTICATION VERIFICATION ===
    console.log('[addClient] Verifying user authentication...');

    let user;
    try {
      const {
        data: { user: authenticatedUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('[addClient] Authentication error:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
        return {
          success: false,
          error: 'Authentication failed. Please log in again.',
        };
      }

      if (!authenticatedUser) {
        console.error('[addClient] No authenticated user found');
        return {
          success: false,
          error: 'You must be logged in to create a client.',
        };
      }

      user = authenticatedUser;
      console.log('[addClient] User authenticated successfully:', {
        userId: user.id,
        email: user.email,
        hasSession: true
      });

    } catch (authException: any) {
      console.error('[addClient] Exception during authentication:', {
        message: authException.message,
        stack: authException.stack
      });
      return {
        success: false,
        error: 'Authentication verification failed.',
      };
    }

    // === SECURITY CHECK: COACH ID VALIDATION ===
    console.log('[addClient] Validating coach_id against authenticated user...');
    if (formData.coach_id !== user.id) {
      console.error('[addClient] SECURITY: Coach ID mismatch detected', {
        formCoachId: formData.coach_id,
        authenticatedUserId: user.id,
        match: false
      });
      return {
        success: false,
        error: 'Unauthorized: Cannot create clients for other coaches.',
      };
    }
    console.log('[addClient] Coach ID validation passed');

    // === DATABASE INSERT OPERATION ===
    console.log('[addClient] Preparing to insert client into database...');
    const insertPayload = {
      coach_id: formData.coach_id,
      athlete_name: formData.athlete_name,
      parent_email: formData.parent_email,
      parent_phone: formData.parent_phone,
      hourly_rate: formData.hourly_rate,
      status: 'active',
    };
    console.log('[addClient] Insert payload:', {
      ...insertPayload,
      parent_phone: '***' + insertPayload.parent_phone.slice(-4)
    });

    let insertResult;
    try {
      insertResult = await supabase
        .from('clients')
        .insert(insertPayload)
        .select()
        .single();

      console.log('[addClient] Database insert completed', {
        hasData: !!insertResult.data,
        hasError: !!insertResult.error
      });

    } catch (insertException: any) {
      console.error('[addClient] EXCEPTION during database insert:', {
        message: insertException.message,
        stack: insertException.stack,
        name: insertException.name
      });
      return {
        success: false,
        error: `Database insert failed: ${insertException.message}`,
      };
    }

    // === CHECK INSERT RESULT ===
    const { data, error } = insertResult;

    if (error) {
      console.error('[addClient] Database error creating client:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        errorObject: JSON.stringify(error, null, 2)
      });

      // Provide specific error messages based on error code
      let userFriendlyError = `Failed to create client: ${error.message}`;

      if (error.code === '23505') {
        userFriendlyError = 'A client with this information already exists.';
      } else if (error.code === '42501') {
        userFriendlyError = 'Permission denied. Please check your account permissions.';
      } else if (error.code === '23503') {
        userFriendlyError = 'Invalid coach ID or foreign key constraint failed.';
      }

      return {
        success: false,
        error: userFriendlyError,
      };
    }

    if (!data) {
      console.error('[addClient] UNEXPECTED: No data returned from insert (but no error either)');
      return {
        success: false,
        error: 'Client creation failed: No data returned.',
      };
    }

    // === SUCCESS ===
    console.log('[addClient] ✅ Client created successfully:', {
      clientId: data.id,
      athleteName: data.athlete_name,
      coachId: data.coach_id
    });

    // === REVALIDATE CACHE ===
    console.log('[addClient] Revalidating paths...');
    try {
      revalidatePath('/dashboard/clients');
      revalidatePath('/clients');
      revalidatePath('/dashboard');
      console.log('[addClient] Cache revalidation completed');
    } catch (revalidateError: any) {
      console.error('[addClient] Warning: Cache revalidation failed', {
        message: revalidateError.message
      });
      // Don't fail the request if revalidation fails
    }

    console.log('=== [addClient] SERVER ACTION COMPLETED SUCCESSFULLY ===');
    return {
      success: true,
      data,
    };

  } catch (error: any) {
    // === GLOBAL ERROR HANDLER ===
    console.error('=== [addClient] CRITICAL UNEXPECTED ERROR ===');
    console.error('[addClient] Error name:', error.name);
    console.error('[addClient] Error message:', error.message);
    console.error('[addClient] Error stack:', error.stack);
    console.error('[addClient] Error object:', JSON.stringify(error, null, 2));
    console.error('[addClient] Timestamp:', new Date().toISOString());

    return {
      success: false,
      error: `An unexpected error occurred: ${error.message || 'Please try again.'}`,
    };
  }
}

/**
 * Server Action: Get all clients for the authenticated coach
 *
 * Enhanced for Vercel Production with comprehensive logging
 */
export async function getClients() {
  try {
    console.log('=== [getClients] SERVER ACTION STARTED ===');
    console.log('[getClients] Timestamp:', new Date().toISOString());

    // Initialize Supabase client
    console.log('[getClients] Creating Supabase client...');
    const supabase = await createClient();

    // Verify the user is authenticated
    console.log('[getClients] Verifying authentication...');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('[getClients] Authentication error:', authError.message);
      return {
        success: false,
        error: 'You must be logged in to view clients.',
        data: [],
      };
    }

    if (!user) {
      console.error('[getClients] No authenticated user');
      return {
        success: false,
        error: 'You must be logged in to view clients.',
        data: [],
      };
    }

    console.log('[getClients] User authenticated:', user.id);

    // Query clients - RLS automatically filters to only this coach's clients
    console.log('[getClients] Fetching clients from database...');
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getClients] Database error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return {
        success: false,
        error: 'Failed to fetch clients.',
        data: [],
      };
    }

    console.log('[getClients] ✅ Clients fetched successfully:', {
      count: data?.length || 0
    });

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    console.error('[getClients] UNEXPECTED ERROR:', {
      message: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: 'An unexpected error occurred.',
      data: [],
    };
  }
}
