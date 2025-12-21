'use client';

import { useState, FormEvent, useEffect } from 'react';
import { addClient, updateClient } from '@/app/actions/client-actions';
import { Client } from '@/lib/types/client';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import { validateClientData } from '@/lib/validation/client-validation';

interface ClientFormProps {
  coachId: string;
  client?: Client; // Optional: for edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ClientForm({ coachId, client, onSuccess, onCancel }: ClientFormProps) {
  const isEditMode = !!client;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pre-populate form in edit mode
  useEffect(() => {
    if (client) {
      setFirstName(client.first_name);
      setLastName(client.last_name);
      setParentEmail(client.parent_email);
      setParentPhone(client.parent_phone);
      setNotes(client.notes || '');
    }
  }, [client]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Client-side validation using shared validator
    const validationErrors = validateClientData({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      parent_email: parentEmail.trim().toLowerCase(),
      parent_phone: parentPhone.trim(),
    });

    if (validationErrors.length > 0) {
      setError(validationErrors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      let result;

      // Build base payload
      const basePayload: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        parent_email: parentEmail.trim().toLowerCase(),
        parent_phone: parentPhone.trim(),
      };

      // Only include notes if not empty
      if (notes.trim()) {
        basePayload.notes = notes.trim();
      }

      if (isEditMode && client) {
        // Update existing client
        result = await updateClient(client.id, basePayload);
      } else {
        // Create new client - add coach_id
        result = await addClient({
          coach_id: coachId,
          ...basePayload,
        });
      }

      if (!result.success) {
        setError(result.error || `Failed to ${isEditMode ? 'update' : 'create'} client.`);
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccessMessage(isEditMode ? SUCCESS_MESSAGES.CLIENT.UPDATED : SUCCESS_MESSAGES.CLIENT.CREATED);

      if (!isEditMode) {
        // Reset form only in create mode
        setFirstName('');
        setLastName('');
        setParentEmail('');
        setParentPhone('');
        setNotes('');
      }

      // Call success callback after a brief delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);

    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} client:`, err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isEditMode ? 'Edit Client' : 'Add New Client'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* First Name */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            placeholder="Sarah"
            disabled={isLoading}
          />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            placeholder="Johnson"
            disabled={isLoading}
          />
        </div>

        {/* Parent Email */}
        <div>
          <label
            htmlFor="parentEmail"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Parent Email <span className="text-red-500">*</span>
          </label>
          <input
            id="parentEmail"
            name="parentEmail"
            type="email"
            required
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            placeholder="parent@example.com"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Used for invoices and payment communications
          </p>
        </div>

        {/* Parent Phone */}
        <div>
          <label
            htmlFor="parentPhone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Parent Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="parentPhone"
            name="parentPhone"
            type="tel"
            required
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            placeholder="(555) 123-4567"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Used for automated SMS lesson reminders
          </p>
        </div>

        {/* Notes Field */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Coach Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
            placeholder="Private notes about this athlete (goals, skill level, parent preferences, etc.)"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            These notes are private and only visible to you
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isEditMode ? 'Updating Client...' : 'Adding Client...'}
              </span>
            ) : (
              isEditMode ? 'Update Client' : 'Add Client'
            )}
          </button>

          {/* Cancel Button (if callback provided) */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
