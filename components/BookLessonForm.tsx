'use client';

import { useState, FormEvent } from 'react';
import { createLesson } from '@/app/actions/lesson-actions';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import type { Client } from '@/lib/types/client';

interface BookLessonFormProps {
  clients: Client[];
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultStartTime?: Date;
  defaultEndTime?: Date;
}

export default function BookLessonForm({
  clients,
  onSuccess,
  onCancel,
  defaultStartTime,
  defaultEndTime,
}: BookLessonFormProps) {
  // Form state
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(
    defaultStartTime ? formatDateTimeLocal(defaultStartTime) : ''
  );
  const [endTime, setEndTime] = useState(
    defaultEndTime ? formatDateTimeLocal(defaultEndTime) : ''
  );
  const [location, setLocation] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Client-side validation
    if (!clientId) {
      setError(ERROR_MESSAGES.LESSON.CLIENT_REQUIRED);
      setIsLoading(false);
      return;
    }

    if (!title.trim()) {
      setError(ERROR_MESSAGES.LESSON.TITLE_REQUIRED);
      setIsLoading(false);
      return;
    }

    if (!startTime || !endTime) {
      setError(ERROR_MESSAGES.LESSON.REQUIRED_FIELDS);
      setIsLoading(false);
      return;
    }

    // Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError(ERROR_MESSAGES.LESSON.INVALID_TIME_RANGE);
      setIsLoading(false);
      return;
    }

    // Validate minimum duration (15 minutes)
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes < 15) {
      setError(ERROR_MESSAGES.LESSON.INVALID_DURATION);
      setIsLoading(false);
      return;
    }

    try {
      const result = await createLesson({
        client_id: clientId,
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        location: location.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error || ERROR_MESSAGES.LESSON.CREATE_FAILED);
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccessMessage(SUCCESS_MESSAGES.LESSON.CREATED);

      // Reset form
      setClientId('');
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setLocation('');

      // Call success callback after a brief delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error creating lesson:', err);
      setError(ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Book New Lesson
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

        {/* Client Selection */}
        <div>
          <label
            htmlFor="clientId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Select Client <span className="text-red-500">*</span>
          </label>
          <select
            id="clientId"
            name="clientId"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            disabled={isLoading}
          >
            <option value="">Choose a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.athlete_name} - ${client.hourly_rate}/hr
              </option>
            ))}
          </select>
          {clients.length === 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              No clients found. Please add a client first.
            </p>
          )}
        </div>

        {/* Lesson Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Lesson Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            placeholder="e.g., Private Lesson, Jump Technique, Program Run-Through"
            disabled={isLoading}
          />
        </div>

        {/* Start Time */}
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            id="startTime"
            name="startTime"
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* End Time */}
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            id="endTime"
            name="endTime"
            type="datetime-local"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum lesson duration: 15 minutes
          </p>
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            placeholder="e.g., Main Rink, Ice Surface 2"
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Notes/Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
            placeholder="Optional notes about this lesson (e.g., skills to focus on, equipment needed)"
            disabled={isLoading}
          />
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || clients.length === 0}
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
                Booking Lesson...
              </span>
            ) : (
              'Book Lesson'
            )}
          </button>

          {/* Cancel Button */}
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

// Helper function to format Date to datetime-local input format
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
