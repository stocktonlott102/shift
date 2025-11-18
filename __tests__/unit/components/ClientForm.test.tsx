/**
 * Component Tests for ClientForm
 *
 * Testing: components/ClientForm.tsx
 * Focus: Form validation, user interactions, create/edit modes
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from '@/components/ClientForm';
import { addClient, updateClient } from '@/app/actions/client-actions';

// Mock the server actions
jest.mock('@/app/actions/client-actions', () => ({
  addClient: jest.fn(),
  updateClient: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('ClientForm Component', () => {
  const mockCoachId = 'coach-123';
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // CREATE MODE TESTS
  // ==========================================
  describe('Create Mode', () => {
    it('should render form in create mode with correct title', () => {
      render(<ClientForm coachId={mockCoachId} />);

      expect(screen.getByText('Add New Client')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument();
    });

    it('should show all required form fields', () => {
      render(<ClientForm coachId={mockCoachId} />);

      expect(screen.getByLabelText(/athlete name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/parent email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/parent phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hourly rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/coach notes/i)).toBeInTheDocument();
    });

    it('should display validation error when athlete name is empty', async () => {
      render(<ClientForm coachId={mockCoachId} />);

      const submitButton = screen.getByRole('button', { name: /add client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/athlete name is required/i)).toBeInTheDocument();
      });
    });

    it('should display validation error for invalid email', async () => {
      render(<ClientForm coachId={mockCoachId} />);

      const nameInput = screen.getByLabelText(/athlete name/i);
      const emailInput = screen.getByLabelText(/parent email/i);
      const phoneInput = screen.getByLabelText(/parent phone/i);
      const rateInput = screen.getByLabelText(/hourly rate/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.type(phoneInput, '555-1234');
      await userEvent.type(rateInput, '75');

      const submitButton = screen.getByRole('button', { name: /add client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should display validation error for invalid phone', async () => {
      render(<ClientForm coachId={mockCoachId} />);

      const nameInput = screen.getByLabelText(/athlete name/i);
      const emailInput = screen.getByLabelText(/parent email/i);
      const phoneInput = screen.getByLabelText(/parent phone/i);
      const rateInput = screen.getByLabelText(/hourly rate/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.type(phoneInput, 'abc-defg');
      await userEvent.type(rateInput, '75');

      const submitButton = screen.getByRole('button', { name: /add client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
      });
    });

    it('should display validation error for invalid hourly rate', async () => {
      render(<ClientForm coachId={mockCoachId} />);

      const nameInput = screen.getByLabelText(/athlete name/i);
      const emailInput = screen.getByLabelText(/parent email/i);
      const phoneInput = screen.getByLabelText(/parent phone/i);
      const rateInput = screen.getByLabelText(/hourly rate/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.type(phoneInput, '555-1234');
      await userEvent.type(rateInput, '0');

      const submitButton = screen.getByRole('button', { name: /add client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hourly rate must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('should successfully submit form with valid data', async () => {
      (addClient as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'client-123', athlete_name: 'John Doe' },
      });

      render(<ClientForm coachId={mockCoachId} onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/athlete name/i);
      const emailInput = screen.getByLabelText(/parent email/i);
      const phoneInput = screen.getByLabelText(/parent phone/i);
      const rateInput = screen.getByLabelText(/hourly rate/i);
      const notesInput = screen.getByLabelText(/coach notes/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.type(phoneInput, '555-1234');
      await userEvent.type(rateInput, '75');
      await userEvent.type(notesInput, 'Working on axel jump');

      const submitButton = screen.getByRole('button', { name: /add client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(addClient).toHaveBeenCalledWith({
          coach_id: mockCoachId,
          athlete_name: 'John Doe',
          parent_email: 'parent@example.com',
          parent_phone: '555-1234',
          hourly_rate: 75,
          notes: 'Working on axel jump',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/client added successfully/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display error message when server action fails', async () => {
      (addClient as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      render(<ClientForm coachId={mockCoachId} />);

      const nameInput = screen.getByLabelText(/athlete name/i);
      const emailInput = screen.getByLabelText(/parent email/i);
      const phoneInput = screen.getByLabelText(/parent phone/i);
      const rateInput = screen.getByLabelText(/hourly rate/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.type(phoneInput, '555-1234');
      await userEvent.type(rateInput, '75');

      const submitButton = screen.getByRole('button', { name: /add client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(<ClientForm coachId={mockCoachId} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // EDIT MODE TESTS
  // ==========================================
  describe('Edit Mode', () => {
    const mockClient = {
      id: 'client-123',
      athlete_name: 'Jane Smith',
      parent_email: 'jane@example.com',
      parent_phone: '555-5678',
      hourly_rate: 80,
      notes: 'Advanced skater',
    };

    it('should render form in edit mode with correct title', () => {
      render(<ClientForm coachId={mockCoachId} client={mockClient} />);

      expect(screen.getByText('Edit Client')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update client/i })).toBeInTheDocument();
    });

    it('should pre-populate form fields with client data', () => {
      render(<ClientForm coachId={mockCoachId} client={mockClient} />);

      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('555-5678')).toBeInTheDocument();
      expect(screen.getByDisplayValue('80')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Advanced skater')).toBeInTheDocument();
    });

    it('should successfully update client with modified data', async () => {
      (updateClient as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockClient, athlete_name: 'Jane Doe Updated' },
      });

      render(<ClientForm coachId={mockCoachId} client={mockClient} onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/athlete name/i);

      // Clear and update the name
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Jane Doe Updated');

      const submitButton = screen.getByRole('button', { name: /update client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(updateClient).toHaveBeenCalledWith('client-123', {
          athlete_name: 'Jane Doe Updated',
          parent_email: 'jane@example.com',
          parent_phone: '555-5678',
          hourly_rate: 80,
          notes: 'Advanced skater',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/client updated successfully/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display error when update fails', async () => {
      (updateClient as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Update failed',
      });

      render(<ClientForm coachId={mockCoachId} client={mockClient} />);

      const submitButton = screen.getByRole('button', { name: /update client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });

    it('should handle empty notes field correctly', async () => {
      const clientWithoutNotes = { ...mockClient, notes: null };

      render(<ClientForm coachId={mockCoachId} client={clientWithoutNotes} />);

      const notesInput = screen.getByLabelText(/coach notes/i);
      expect(notesInput).toHaveValue('');
    });
  });

  // ==========================================
  // LOADING STATE TESTS
  // ==========================================
  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      (addClient as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      );

      render(<ClientForm coachId={mockCoachId} />);

      const nameInput = screen.getByLabelText(/athlete name/i);
      const emailInput = screen.getByLabelText(/parent email/i);
      const phoneInput = screen.getByLabelText(/parent phone/i);
      const rateInput = screen.getByLabelText(/hourly rate/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.type(phoneInput, '555-1234');
      await userEvent.type(rateInput, '75');

      const submitButton = screen.getByRole('button', { name: /add client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/adding client.../i)).toBeInTheDocument();
      });
    });

    it('should disable all inputs during submission', async () => {
      (addClient as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      );

      render(<ClientForm coachId={mockCoachId} />);

      const nameInput = screen.getByLabelText(/athlete name/i);
      const emailInput = screen.getByLabelText(/parent email/i);
      const phoneInput = screen.getByLabelText(/parent phone/i);
      const rateInput = screen.getByLabelText(/hourly rate/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.type(phoneInput, '555-1234');
      await userEvent.type(rateInput, '75');

      const submitButton = screen.getByRole('button', { name: /add client/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(nameInput).toBeDisabled();
        expect(emailInput).toBeDisabled();
        expect(phoneInput).toBeDisabled();
        expect(rateInput).toBeDisabled();
      });
    });
  });
});
