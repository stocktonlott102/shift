/**
 * Unit Tests for Client Actions
 *
 * Testing: app/actions/client-actions.ts
 * Focus: All client CRUD operations
 *
 * What this test suite covers:
 * - addClient(): Creating new clients with validation
 * - getClients(): Fetching all active clients for a coach
 * - getClientById(): Fetching a single client
 * - updateClient(): Updating client information
 * - deleteClient(): Soft-deleting (archiving) clients
 */

import { addClient, getClients, getClientById, updateClient, deleteClient } from '@/app/actions/client-actions';

// Mock the Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock Next.js revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('Client Actions - CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // ADD CLIENT TESTS
  // ==========================================
  describe('addClient()', () => {
    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await addClient({
        coach_id: 'coach-123',
        athlete_name: 'John Doe',
        parent_email: 'parent@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must be logged in to create a client.');
    });

    it('should return error when coach_id does not match authenticated user', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await addClient({
        coach_id: 'different-coach-456',
        athlete_name: 'John Doe',
        parent_email: 'parent@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Cannot create clients for other coaches.');
    });

    it('should return error when required fields are missing', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await addClient({
        coach_id: 'coach-123',
        athlete_name: '',
        parent_email: 'parent@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('All fields are required.');
    });

    it('should return error when hourly_rate is zero or negative', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await addClient({
        coach_id: 'coach-123',
        athlete_name: 'John Doe',
        parent_email: 'parent@example.com',
        parent_phone: '555-1234',
        hourly_rate: -10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hourly rate must be greater than 0.');
    });

    it('should successfully create client with valid data and notes', async () => {
      const mockClientData = {
        id: 'client-789',
        coach_id: 'coach-123',
        athlete_name: 'John Doe',
        parent_email: 'parent@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
        notes: 'Working on axel jump',
        status: 'active',
        created_at: new Date().toISOString(),
      };

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockClientData,
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await addClient({
        coach_id: 'coach-123',
        athlete_name: 'John Doe',
        parent_email: 'parent@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
        notes: 'Working on axel jump',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClientData);
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await addClient({
        coach_id: 'coach-123',
        athlete_name: 'John Doe',
        parent_email: 'parent@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create client');
    });
  });

  // ==========================================
  // GET CLIENTS TESTS
  // ==========================================
  describe('getClients()', () => {
    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getClients();

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must be logged in to view clients.');
      expect(result.data).toEqual([]);
    });

    it('should return all active clients for authenticated user', async () => {
      const mockClients = [
        {
          id: 'client-1',
          coach_id: 'coach-123',
          athlete_name: 'Alice Smith',
          parent_email: 'alice@example.com',
          parent_phone: '555-1111',
          hourly_rate: 80,
          notes: null,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'client-2',
          coach_id: 'coach-123',
          athlete_name: 'Bob Jones',
          parent_email: 'bob@example.com',
          parent_phone: '555-2222',
          hourly_rate: 75,
          notes: 'Advanced skater',
          status: 'active',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockClients,
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getClients();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClients);
      expect(result.data.length).toBe(2);
    });

    it('should return empty array when no clients exist', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getClients();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  // ==========================================
  // GET CLIENT BY ID TESTS
  // ==========================================
  describe('getClientById()', () => {
    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getClientById('client-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must be logged in to view client details.');
    });

    it('should return client data when found', async () => {
      const mockClient = {
        id: 'client-123',
        coach_id: 'coach-123',
        athlete_name: 'Alice Smith',
        parent_email: 'alice@example.com',
        parent_phone: '555-1111',
        hourly_rate: 80,
        notes: 'Working on triple jumps',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockClient,
                error: null,
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getClientById('client-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockClient);
    });

    it('should return error when client not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await getClientById('nonexistent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch client details.');
    });
  });

  // ==========================================
  // UPDATE CLIENT TESTS
  // ==========================================
  describe('updateClient()', () => {
    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await updateClient('client-123', {
        athlete_name: 'Updated Name',
        parent_email: 'updated@example.com',
        parent_phone: '555-9999',
        hourly_rate: 90,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must be logged in to update a client.');
    });

    it('should return error when required fields are missing', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await updateClient('client-123', {
        athlete_name: '',
        parent_email: 'test@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('All fields are required.');
    });

    it('should return error when hourly rate is invalid', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await updateClient('client-123', {
        athlete_name: 'John Doe',
        parent_email: 'test@example.com',
        parent_phone: '555-1234',
        hourly_rate: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hourly rate must be greater than 0.');
    });

    it('should successfully update client with valid data', async () => {
      const updatedClient = {
        id: 'client-123',
        coach_id: 'coach-123',
        athlete_name: 'Updated Name',
        parent_email: 'updated@example.com',
        parent_phone: '555-9999',
        hourly_rate: 90,
        notes: 'Updated notes',
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedClient,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await updateClient('client-123', {
        athlete_name: 'Updated Name',
        parent_email: 'updated@example.com',
        parent_phone: '555-9999',
        hourly_rate: 90,
        notes: 'Updated notes',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedClient);
    });
  });

  // ==========================================
  // DELETE CLIENT TESTS
  // ==========================================
  describe('deleteClient()', () => {
    it('should return error when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await deleteClient('client-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must be logged in to delete a client.');
    });

    it('should successfully soft-delete (archive) client', async () => {
      const archivedClient = {
        id: 'client-123',
        coach_id: 'coach-123',
        athlete_name: 'John Doe',
        parent_email: 'john@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
        notes: null,
        status: 'archived',
        updated_at: new Date().toISOString(),
      };

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: archivedClient,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await deleteClient('client-123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('archived');
    });

    it('should handle database errors during delete', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'coach-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Delete failed' },
                }),
              }),
            }),
          }),
        }),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await deleteClient('client-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete client');
    });
  });
});
