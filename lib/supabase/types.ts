/**
 * Supabase Database Types
 *
 * To generate types from your Supabase database schema, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
 *
 * Or use the Supabase CLI:
 * supabase gen types typescript --linked > lib/supabase/types.ts
 *
 * For now, this file contains placeholder types.
 * Replace with your actual generated types once your database schema is ready.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Add your table types here
      // Example:
      // users: {
      //   Row: {
      //     id: string;
      //     email: string;
      //     created_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     email: string;
      //     created_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     email?: string;
      //     created_at?: string;
      //   };
      // };
    };
    Views: {
      // Add your view types here
    };
    Functions: {
      // Add your function types here
    };
    Enums: {
      // Add your enum types here
    };
  };
}
