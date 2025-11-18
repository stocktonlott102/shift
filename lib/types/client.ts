/**
 * Client Type Definitions
 *
 * Centralized type definitions for client/athlete management
 */

export interface Client {
  id: string;
  coach_id: string;
  athlete_name: string;
  parent_email: string;
  parent_phone: string;
  hourly_rate: number;
  notes?: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Form data for creating or updating a client
 * (excludes system-managed fields like id, timestamps)
 */
export interface ClientFormData {
  athlete_name: string;
  parent_email: string;
  parent_phone: string;
  hourly_rate: number;
  notes?: string;
}

/**
 * Data required to create a new client
 * (includes coach_id which is required for creation)
 */
export interface CreateClientData extends ClientFormData {
  coach_id: string;
}
