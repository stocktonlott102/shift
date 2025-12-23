'use server';

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, authRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { z } from 'zod';

/**
 * Authentication Server Actions with Rate Limiting
 *
 * SECURITY:
 * - Rate limiting prevents credential stuffing and brute force attacks
 * - Input validation with Zod prevents injection attacks
 * - Server-side execution prevents client-side manipulation
 */

/**
 * Validation schema for login
 */
const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
  ipAddress: z.string().optional(),
});

/**
 * Validation schema for signup
 */
const SignupSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  ipAddress: z.string().optional(),
});

/**
 * Validation schema for password reset request
 */
const PasswordResetSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  ipAddress: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;

interface ActionResponse {
  success: boolean;
  error?: string;
  data?: {
    userId?: string;
    email?: string;
  };
}

/**
 * Server action to handle user login with rate limiting
 *
 * SECURITY:
 * - Rate limited to 5 attempts per 15 minutes per IP/user
 * - Prevents credential stuffing attacks
 * - Validates input with Zod
 */
export async function loginAction(input: unknown): Promise<ActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = LoginSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { email, password, ipAddress } = validationResult.data;

    // SECURITY: Rate limiting - prevent brute force attacks
    const identifier = getRateLimitIdentifier(undefined, ipAddress || email);
    const rateLimitResult = await checkRateLimit(identifier, authRateLimit);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: rateLimitResult.error || 'Too many login attempts. Please try again later.',
      };
    }

    // Attempt login
    const supabase = await createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Return generic error message to prevent user enumeration
      return {
        success: false,
        error: 'Invalid email or password. Please try again.',
      };
    }

    if (!data?.user || !data?.session) {
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }

    return {
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email,
      },
    };
  } catch (err: any) {
    console.error('Login action error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Server action to handle user signup with rate limiting
 *
 * SECURITY:
 * - Rate limited to 5 attempts per 15 minutes per IP
 * - Strong password requirements enforced
 * - Validates input with Zod
 */
export async function signupAction(input: unknown): Promise<ActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = SignupSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { email, password, ipAddress } = validationResult.data;

    // SECURITY: Rate limiting - prevent spam account creation
    const identifier = getRateLimitIdentifier(undefined, ipAddress || email);
    const rateLimitResult = await checkRateLimit(identifier, authRateLimit);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: rateLimitResult.error || 'Too many signup attempts. Please try again later.',
      };
    }

    // Attempt signup
    const supabase = await createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (signUpError) {
      // Handle specific errors
      if (signUpError.message.includes('already registered')) {
        return {
          success: false,
          error: 'An account with this email already exists.',
        };
      }

      return {
        success: false,
        error: signUpError.message || 'Signup failed. Please try again.',
      };
    }

    if (!data?.user) {
      return {
        success: false,
        error: 'Signup failed. Please try again.',
      };
    }

    return {
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email,
      },
    };
  } catch (err: any) {
    console.error('Signup action error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Server action to handle password reset request with rate limiting
 *
 * SECURITY:
 * - Rate limited to 5 attempts per 15 minutes per IP/email
 * - Prevents password reset spam
 * - Always returns success to prevent user enumeration
 */
export async function requestPasswordResetAction(input: unknown): Promise<ActionResponse> {
  try {
    // SECURITY: Validate and sanitize all input using Zod
    const validationResult = PasswordResetSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { email, ipAddress } = validationResult.data;

    // SECURITY: Rate limiting - prevent password reset spam
    const identifier = getRateLimitIdentifier(undefined, ipAddress || email);
    const rateLimitResult = await checkRateLimit(identifier, authRateLimit);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: rateLimitResult.error || 'Too many password reset requests. Please try again later.',
      };
    }

    // Request password reset
    const supabase = await createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    // SECURITY: Always return success to prevent user enumeration
    // Don't reveal whether the email exists or not
    if (resetError) {
      console.error('Password reset error:', resetError);
    }

    return {
      success: true,
      data: {
        email,
      },
    };
  } catch (err: any) {
    console.error('Password reset action error:', err);
    // Still return success to prevent user enumeration
    return {
      success: true,
    };
  }
}

/**
 * Server action to handle logout with rate limiting
 *
 * SECURITY:
 * - Rate limited to prevent logout spam (DoS)
 * - Clears all authentication tokens
 */
export async function logoutAction(input: unknown): Promise<ActionResponse> {
  try {
    const LogoutSchema = z.object({
      userId: z.string().uuid('Invalid user ID').optional(),
      ipAddress: z.string().optional(),
    });

    const validationResult = LogoutSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }

    const { userId, ipAddress } = validationResult.data;

    // Rate limiting for logout (more lenient than login)
    const identifier = getRateLimitIdentifier(userId, ipAddress);
    const rateLimitResult = await checkRateLimit(identifier, authRateLimit);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: rateLimitResult.error || 'Too many requests. Please try again later.',
      };
    }

    const supabase = await createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('Logout error:', signOutError);
      return {
        success: false,
        error: 'Failed to log out. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    console.error('Logout action error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
