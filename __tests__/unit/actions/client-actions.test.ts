/**
 * Unit Tests for Client Actions
 *
 * Testing: app/actions/client-actions.ts
 * Focus: addClient() server action
 *
 * What this test does:
 * - Tests validation logic (required fields, rate > 0)
 * - Tests authentication checks (user must be logged in)
 * - Tests authorization (coach can only create for themselves)
 * - Tests database integration (mocked)
 */

import { addClient } from '@/app/actions/client-actions';

// Mock the Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock Next.js revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Import the mocked modules so we can control their behavior
import { createClient } from '@/lib/supabase/server';

describe('addClient Server Action', () => {
  // This runs before each test to reset all mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TEST 1: Authentication Check
   * Should reject when user is not authenticated
   */
  it('should return error when user is not authenticated', async () => {
    // ARRANGE: Set up mock to simulate no authenticated user
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // ACT: Call the function with valid data
    const result = await addClient({
      coach_id: 'coach-123',
      athlete_name: 'John Doe',
      parent_email: 'parent@example.com',
      parent_phone: '555-1234',
      hourly_rate: 75,
    });

    // ASSERT: Check that it returned an error
    expect(result.success).toBe(false);
    expect(result.error).toBe('You must be logged in to create a client.');
  });

  /**
   * TEST 2: Authorization Check
   * Should reject when coach_id doesn't match authenticated user
   */
  it('should return error when coach_id does not match authenticated user', async () => {
    // ARRANGE: Mock authenticated user with different ID
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'coach-123', email: 'coach@example.com' } },
          error: null,
        }),
      },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // ACT: Try to create client for DIFFERENT coach
    const result = await addClient({
      coach_id: 'different-coach-456', // <- This doesn't match coach-123
      athlete_name: 'John Doe',
      parent_email: 'parent@example.com',
      parent_phone: '555-1234',
      hourly_rate: 75,
    });

    // ASSERT: Should reject the request
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized: Cannot create clients for other coaches.');
  });

  /**
   * TEST 3: Required Field Validation - Athlete Name
   * Should reject when athlete_name is empty
   */
  it('should return error when athlete_name is empty', async () => {
    // ARRANGE: Mock authenticated user
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'coach-123', email: 'coach@example.com' } },
          error: null,
        }),
      },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // ACT: Call with empty athlete_name
    const result = await addClient({
      coach_id: 'coach-123',
      athlete_name: '', // <- EMPTY!
      parent_email: 'parent@example.com',
      parent_phone: '555-1234',
      hourly_rate: 75,
    });

    // ASSERT: Should return validation error
    expect(result.success).toBe(false);
    expect(result.error).toBe('All fields are required.');
  });

  /**
   * TEST 4: Hourly Rate Validation
   * Should reject when hourly_rate is 0 or negative
   */
  it('should return error when hourly_rate is zero or negative', async () => {
    // ARRANGE: Mock authenticated user
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'coach-123', email: 'coach@example.com' } },
          error: null,
        }),
      },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // ACT: Call with negative hourly_rate
    const result = await addClient({
      coach_id: 'coach-123',
      athlete_name: 'John Doe',
      parent_email: 'parent@example.com',
      parent_phone: '555-1234',
      hourly_rate: -10, // <- NEGATIVE!
    });

    // ASSERT: Should return validation error
    expect(result.success).toBe(false);
    expect(result.error).toBe('Hourly rate must be greater than 0.');
  });

  /**
   * TEST 5: Success Case
   * Should successfully create client with valid data
   */
  it('should successfully create client with valid data', async () => {
    // ARRANGE: Mock successful Supabase responses
    const mockClientData = {
      id: 'client-789',
      coach_id: 'coach-123',
      athlete_name: 'John Doe',
      parent_email: 'parent@example.com',
      parent_phone: '555-1234',
      hourly_rate: 75,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'coach-123', email: 'coach@example.com' } },
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

    // ACT: Call with valid data
    const result = await addClient({
      coach_id: 'coach-123',
      athlete_name: 'John Doe',
      parent_email: 'parent@example.com',
      parent_phone: '555-1234',
      hourly_rate: 75,
    });

    // ASSERT: Should return success with data
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockClientData);

    // VERIFY: Database insert was called with correct data
    expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    expect(mockSupabase.from('clients').insert).toHaveBeenCalledWith({
      coach_id: 'coach-123',
      athlete_name: 'John Doe',
      parent_email: 'parent@example.com',
      parent_phone: '555-1234',
      hourly_rate: 75,
      status: 'active',
    });
  });

  /**
   * TEST 6: Database Error Handling
   * Should handle database errors gracefully
   */
  it('should handle database errors gracefully', async () => {
    // ARRANGE: Mock database error
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'coach-123', email: 'coach@example.com' } },
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

    // ACT: Call with valid data
    const result = await addClient({
      coach_id: 'coach-123',
      athlete_name: 'John Doe',
      parent_email: 'parent@example.com',
      parent_phone: '555-1234',
      hourly_rate: 75,
    });

    // ASSERT: Should return error message
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to create client');
  });
});
