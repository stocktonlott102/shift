'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { updateLesson, cancelLesson } from '@/app/actions/lesson-actions';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import type { LessonWithClient } from '@/lib/types/lesson';
import type { Client } from '@/lib/types/client';

interface EditLessonFormProps {
  lesson: LessonWithClient;
  clients: Client[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper: Format Date to datetime-local input format
function formatDateTimeLocal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditLessonForm({
  lesson,
  clients,
  onSuccess,
  onCancel,
}: EditLessonFormProps) {
  // Form state
  const [title, setTitle] = useState(lesson.title || '');
  const [description, setDescription] = useState(lesson.description || '');
  const [startTime, setStartTime] = useState(formatDateTimeLocal(lesson.start_time));
  const [endTime, setEndTime] = useState(formatDateTimeLocal(lesson.end_time));
  const [durationPreset, setDurationPreset] = useState<15 | 20 | 30 | 60 | 'custom'>('custom');
  const [location, setLocation] = useState(lesson.location || '');
  const [status, setStatus] = useState(lesson.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-calculate end time when start time or duration preset changes
  useEffect(() => {
    if (!startTime || durationPreset === 'custom') return;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationPreset * 60 * 1000);
    setEndTime(formatDateTimeLocal(end));
  }, [startTime, durationPreset]);

  const durationHours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }, [startTime, endTime]);

  // Get client names for display
  const clientNames = useMemo(() => {
    if (lesson.lesson_participants && lesson.lesson_participants.length > 0) {
      return lesson.lesson_participants
        .map((p) => p.client.athlete_name)
        .join(', ');
    }
    return lesson.client?.athlete_name || 'Unknown Client';
  }, [lesson]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Validation
    if (!startTime || !endTime) {
      setError(ERROR_MESSAGES.LESSON.REQUIRED_FIELDS);
      setIsLoading(false);
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError(ERROR_MESSAGES.LESSON.INVALID_TIME_RANGE);
      setIsLoading(false);
      return;
    }

    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 5) {
      setError(ERROR_MESSAGES.LESSON.INVALID_DURATION);
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateLesson(lesson.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location: location.trim() || undefined,
        status,
      });

      if (!result.success) {
        setError(result.error || 'Failed to update lesson.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage(SUCCESS_MESSAGES.LESSON.UPDATED);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err) {
      console.error('Error updating lesson:', err);
      setError(ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  const handleCancelLesson = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await cancelLesson(lesson.id, {
        cancelled_reason: cancelReason.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error || 'Failed to cancel lesson.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Lesson cancelled successfully!');
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err) {
      console.error('Error cancelling lesson:', err);
      setError(ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Edit Lesson
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Client Info (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client(s)
          </label>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
            {clientNames}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Cannot change clients for existing lessons
          </p>
        </div>

        {/* Start Time */}
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            id="startTime"
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
        </div>

        {/* Lesson Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lesson Duration <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2 mb-3">
            <button
              type="button"
              onClick={() => setDurationPreset(15)}
              className={`py-3 px-2 text-sm font-medium rounded-lg transition-all ${
                durationPreset === 15
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              15 min
            </button>
            <button
              type="button"
              onClick={() => setDurationPreset(20)}
              className={`py-3 px-2 text-sm font-medium rounded-lg transition-all ${
                durationPreset === 20
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              20 min
            </button>
            <button
              type="button"
              onClick={() => setDurationPreset(30)}
              className={`py-3 px-2 text-sm font-medium rounded-lg transition-all ${
                durationPreset === 30
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              30 min
            </button>
            <button
              type="button"
              onClick={() => setDurationPreset(60)}
              className={`py-3 px-2 text-sm font-medium rounded-lg transition-all ${
                durationPreset === 60
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              1 hour
            </button>
            <button
              type="button"
              onClick={() => setDurationPreset('custom')}
              className={`py-3 px-2 text-sm font-medium rounded-lg transition-all ${
                durationPreset === 'custom'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              disabled={isLoading}
            >
              Custom
            </button>
          </div>
          {durationPreset === 'custom' && (
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom End Time
              </label>
              <input
                id="endTime"
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {durationPreset !== 'custom' && startTime && endTime && (
              <>End time: {new Date(endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</>
            )}
            {durationPreset === 'custom' && <>Minimum lesson duration: 5 minutes</>}
          </p>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>
        </div>

        {/* Additional Options (collapsible) */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Additional Options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-6 pl-6 border-l-2 border-indigo-200 dark:border-indigo-800">
              {/* Lesson Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Auto-generates based on lesson type and clients"
                  disabled={isLoading}
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes/Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Lesson'
            )}
          </button>

          {lesson.status !== 'Cancelled' && (
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel Lesson
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
          )}
        </div>
      </form>

      {/* Cancel Lesson Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cancel Lesson
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to cancel this lesson? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (optional)
              </label>
              <textarea
                id="cancelReason"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Why are you cancelling this lesson?"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelLesson}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                }}
                disabled={isLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
