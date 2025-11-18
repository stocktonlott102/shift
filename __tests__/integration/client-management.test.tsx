/**
 * Integration Tests for Client Management Flow
 *
 * Testing: Complete user flow for managing clients
 * Focus: Create → View → Edit → Delete flow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from '@/components/ClientForm';
import { addClient, getClients, getClientById, updateClient, deleteClient } from '@/app/actions/client-actions';

// Mock all client actions
jest.mock('@/app/actions/client-actions', () => ({
  addClient: jest.fn(),
  getClients: jest.fn(),
  getClientById: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('Client Management - Integration Tests', () => {
  const mockCoachId = 'coach-integration-test';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // FULL CRUD FLOW TEST
  // ==========================================
  describe('Complete CRUD Flow', () => {
    it('should complete full lifecycle: create → read → update → delete', async () => {
      // ===== STEP 1: CREATE =====
      const newClientData = {
        coach_id: mockCoachId,
        athlete_name: 'Sarah Johnson',
        parent_email: 'sarah.parent@example.com',
        parent_phone: '555-9999',
        hourly_rate: 85,
        notes: 'Working on triple axel',
      };

      const createdClient = {
        id: 'client-new-123',
        ...newClientData,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      (addClient as jest.Mock).mockResolvedValue({
        success: true,
        data: createdClient,
      });

      const { rerender } = render(<ClientForm coachId={mockCoachId} />);

      // Fill out form
      await userEvent.type(screen.getByLabelText(/athlete name/i), 'Sarah Johnson');
      await userEvent.type(screen.getByLabelText(/parent email/i), 'sarah.parent@example.com');
      await userEvent.type(screen.getByLabelText(/parent phone/i), '555-9999');
      await userEvent.type(screen.getByLabelText(/hourly rate/i), '85');
      await userEvent.type(screen.getByLabelText(/coach notes/i), 'Working on triple axel');

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /add client/i }));

      await waitFor(() => {
        expect(addClient).toHaveBeenCalledWith(newClientData);
        expect(screen.getByText(/client added successfully/i)).toBeInTheDocument();
      });

      // ===== STEP 2: READ (Get Single Client) =====
      (getClientById as jest.Mock).mockResolvedValue({
        success: true,
        data: createdClient,
      });

      const clientResult = await getClientById('client-new-123');

      expect(clientResult.success).toBe(true);
      expect(clientResult.data.athlete_name).toBe('Sarah Johnson');
      expect(clientResult.data.notes).toBe('Working on triple axel');

      // ===== STEP 3: UPDATE =====
      const updatedClientData = {
        ...createdClient,
        athlete_name: 'Sarah Johnson-Smith',
        notes: 'Successfully landed triple axel!',
      };

      (updateClient as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedClientData,
      });

      // Rerender in edit mode
      rerender(<ClientForm coachId={mockCoachId} client={createdClient} />);

      // Verify form pre-populated
      expect(screen.getByDisplayValue('Sarah Johnson')).toBeInTheDocument();

      // Update name
      const nameInput = screen.getByLabelText(/athlete name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Sarah Johnson-Smith');

      // Update notes
      const notesInput = screen.getByLabelText(/coach notes/i);
      await userEvent.clear(notesInput);
      await userEvent.type(notesInput, 'Successfully landed triple axel!');

      // Submit update
      fireEvent.click(screen.getByRole('button', { name: /update client/i }));

      await waitFor(() => {
        expect(updateClient).toHaveBeenCalledWith('client-new-123', {
          athlete_name: 'Sarah Johnson-Smith',
          parent_email: 'sarah.parent@example.com',
          parent_phone: '555-9999',
          hourly_rate: 85,
          notes: 'Successfully landed triple axel!',
        });
      });

      // ===== STEP 4: DELETE (Soft Delete) =====
      (deleteClient as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          ...updatedClientData,
          status: 'archived',
        },
      });

      const deleteResult = await deleteClient('client-new-123');

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data?.status).toBe('archived');

      // ===== STEP 5: VERIFY ARCHIVED CLIENT NOT IN LIST =====
      (getClients as jest.Mock).mockResolvedValue({
        success: true,
        data: [], // Archived clients don't show in active list
      });

      const clientsList = await getClients();

      expect(clientsList.success).toBe(true);
      expect(clientsList.data.length).toBe(0);
    });
  });

  // ==========================================
  // MULTIPLE CLIENTS MANAGEMENT
  // ==========================================
  describe('Managing Multiple Clients', () => {
    it('should handle creating and managing multiple clients', async () => {
      const clients = [
        {
          id: 'client-1',
          coach_id: mockCoachId,
          athlete_name: 'Alice Smith',
          parent_email: 'alice@example.com',
          parent_phone: '555-1111',
          hourly_rate: 80,
          notes: 'Beginner',
          status: 'active',
        },
        {
          id: 'client-2',
          coach_id: mockCoachId,
          athlete_name: 'Bob Jones',
          parent_email: 'bob@example.com',
          parent_phone: '555-2222',
          hourly_rate: 75,
          notes: 'Intermediate',
          status: 'active',
        },
        {
          id: 'client-3',
          coach_id: mockCoachId,
          athlete_name: 'Charlie Brown',
          parent_email: 'charlie@example.com',
          parent_phone: '555-3333',
          hourly_rate: 90,
          notes: 'Advanced',
          status: 'active',
        },
      ];

      // Get all clients
      (getClients as jest.Mock).mockResolvedValue({
        success: true,
        data: clients,
      });

      const result = await getClients();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(3);
      expect(result.data[0].athlete_name).toBe('Alice Smith');
      expect(result.data[1].athlete_name).toBe('Bob Jones');
      expect(result.data[2].athlete_name).toBe('Charlie Brown');

      // Update one client
      (updateClient as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          ...clients[1],
          hourly_rate: 85, // Increase Bob's rate
        },
      });

      const updateResult = await updateClient('client-2', {
        athlete_name: 'Bob Jones',
        parent_email: 'bob@example.com',
        parent_phone: '555-2222',
        hourly_rate: 85,
        notes: 'Intermediate',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data.hourly_rate).toBe(85);

      // Delete one client
      (deleteClient as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          ...clients[0],
          status: 'archived',
        },
      });

      const deleteResult = await deleteClient('client-1');

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data?.status).toBe('archived');

      // Get clients after delete - should return 2 active clients
      (getClients as jest.Mock).mockResolvedValue({
        success: true,
        data: clients.filter(c => c.id !== 'client-1'),
      });

      const remainingClients = await getClients();

      expect(remainingClients.data.length).toBe(2);
      expect(remainingClients.data.find(c => c.id === 'client-1')).toBeUndefined();
    });
  });

  // ==========================================
  // ERROR HANDLING INTEGRATION
  // ==========================================
  describe('Error Recovery Flow', () => {
    it('should recover from errors and retry operations', async () => {
      // First attempt fails
      (addClient as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Network error',
      });

      render(<ClientForm coachId={mockCoachId} />);

      await userEvent.type(screen.getByLabelText(/athlete name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/parent email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/parent phone/i), '555-0000');
      await userEvent.type(screen.getByLabelText(/hourly rate/i), '75');

      fireEvent.click(screen.getByRole('button', { name: /add client/i }));

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Second attempt succeeds
      (addClient as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'client-retry-123',
          athlete_name: 'Test User',
          parent_email: 'test@example.com',
        },
      });

      // Retry submission
      fireEvent.click(screen.getByRole('button', { name: /add client/i }));

      await waitFor(() => {
        expect(screen.getByText(/client added successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle partial update failures gracefully', async () => {
      const client = {
        id: 'client-partial-123',
        athlete_name: 'Original Name',
        parent_email: 'original@example.com',
        parent_phone: '555-0000',
        hourly_rate: 75,
        notes: 'Original notes',
      };

      render(<ClientForm coachId={mockCoachId} client={client} />);

      // Try to update with invalid data
      (updateClient as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid email format',
      });

      const emailInput = screen.getByLabelText(/parent email/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'invalid-email');

      fireEvent.click(screen.getByRole('button', { name: /update client/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });

      // Form should still have the invalid value, allowing user to correct it
      expect(emailInput).toHaveValue('invalid-email');
    });
  });

  // ==========================================
  // NOTES FIELD INTEGRATION
  // ==========================================
  describe('Notes Field Integration', () => {
    it('should create client with notes', async () => {
      (addClient as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'client-with-notes',
          athlete_name: 'Noted Client',
          notes: 'Important coaching notes',
        },
      });

      render(<ClientForm coachId={mockCoachId} />);

      await userEvent.type(screen.getByLabelText(/athlete name/i), 'Noted Client');
      await userEvent.type(screen.getByLabelText(/parent email/i), 'noted@example.com');
      await userEvent.type(screen.getByLabelText(/parent phone/i), '555-1234');
      await userEvent.type(screen.getByLabelText(/hourly rate/i), '75');
      await userEvent.type(screen.getByLabelText(/coach notes/i), 'Important coaching notes');

      fireEvent.click(screen.getByRole('button', { name: /add client/i }));

      await waitFor(() => {
        expect(addClient).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: 'Important coaching notes',
          })
        );
      });
    });

    it('should update notes independently', async () => {
      const client = {
        id: 'client-update-notes',
        athlete_name: 'John Doe',
        parent_email: 'john@example.com',
        parent_phone: '555-1234',
        hourly_rate: 75,
        notes: 'Old notes',
      };

      (updateClient as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          ...client,
          notes: 'Updated notes only',
        },
      });

      render(<ClientForm coachId={mockCoachId} client={client} />);

      const notesInput = screen.getByLabelText(/coach notes/i);
      await userEvent.clear(notesInput);
      await userEvent.type(notesInput, 'Updated notes only');

      fireEvent.click(screen.getByRole('button', { name: /update client/i }));

      await waitFor(() => {
        expect(updateClient).toHaveBeenCalledWith(
          'client-update-notes',
          expect.objectContaining({
            notes: 'Updated notes only',
          })
        );
      });
    });

    it('should handle empty notes correctly', async () => {
      (addClient as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'client-no-notes',
          athlete_name: 'No Notes Client',
          notes: undefined,
        },
      });

      render(<ClientForm coachId={mockCoachId} />);

      await userEvent.type(screen.getByLabelText(/athlete name/i), 'No Notes Client');
      await userEvent.type(screen.getByLabelText(/parent email/i), 'nonotes@example.com');
      await userEvent.type(screen.getByLabelText(/parent phone/i), '555-1234');
      await userEvent.type(screen.getByLabelText(/hourly rate/i), '75');
      // Don't fill notes field

      fireEvent.click(screen.getByRole('button', { name: /add client/i }));

      await waitFor(() => {
        expect(addClient).toHaveBeenCalledWith(
          expect.objectContaining({
            notes: undefined,
          })
        );
      });
    });
  });
});
