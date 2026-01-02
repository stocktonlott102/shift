import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Creates a Supabase client for use in Next.js Middleware
 * This ensures user sessions are refreshed on every request
 *
 * Add this to your middleware.ts file in the root of your project
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            // Check for remember_me preference in cookies
            const rememberMeCookie = request.cookies.get('shift_remember_me');
            const shouldPersist = rememberMeCookie?.value === 'true';

            // Set cookies with proper expiration based on Remember Me preference
            const cookieOptions = {
              ...options,
              // If Remember Me is checked: 7 days, otherwise: session cookie (no maxAge)
              maxAge: shouldPersist ? (options?.maxAge || 60 * 60 * 24 * 7) : undefined,
            };
            supabaseResponse.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  // Refreshing the auth token
  // This will refresh the user's session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabaseResponse;
}
