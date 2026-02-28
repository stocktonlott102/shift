'use client';

import { useEffect, useState, FormEvent } from 'react';
import { updateCalendarBlock, deleteCalendarBlock } from '@/app/actions/calendar-block-actions';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import type { CalendarBlock } from '@/lib/types/calendar-block';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BLOCK_COLORS = [
  { hex: '#6B7280', label: 'Gray' },
  { hex: '#6366F1', label: 'Indigo' },
  { hex: '#0EA5E9', label: 'Sky' },
  { hex: '#10B981', label: 'Emerald' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#EF4444', label: 'Red' },
];

interface EditBlockFormProps {
  block: CalendarBlock;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditBlockForm({ block, onSuccess, onCancel }: EditBlockFormProps) {
  const [title, setTitle] = useState(block.title || '');
  const [notes, setNotes] = useState(block.notes || '');
  const [startTime, setStartTime] = useState<Date>(new Date(block.start_time));
  const [endTime, setEndTime] = useState<Date>(new Date(block.end_time));
  const [durationPreset, setDurationPreset] = useState<15 | 20 | 30 | 60 | 'custom'>('custom');
  const [color, setColor] = useState(block.color || '#6B7280');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Auto-calculate end time when start time or duration preset changes
  useEffect(() => {
    if (!startTime || durationPreset === 'custom') return;
    const end = new Date(startTime.getTime() + durationPreset * 60 * 1000);
    setEndTime(end);
  }, [startTime, durationPreset]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!title.trim()) {
      setError('Title is required.');
      setIsLoading(false);
      return;
    }

    if (!startTime || !endTime) {
      setError(ERROR_MESSAGES.LESSON.REQUIRED_FIELDS);
      setIsLoading(false);
      return;
    }

    if (endTime <= startTime) {
      setError(ERROR_MESSAGES.LESSON.INVALID_TIME_RANGE);
      setIsLoading(false);
      return;
    }

    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (durationMinutes < 5) {
      setError(ERROR_MESSAGES.LESSON.INVALID_DURATION);
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateCalendarBlock(block.id, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        color,
      });

      if (!result.success) {
        setError(result.error || ERROR_MESSAGES.CALENDAR_BLOCK.UPDATE_FAILED);
        setIsLoading(false);
        return;
      }

      setSuccessMessage(SUCCESS_MESSAGES.CALENDAR_BLOCK.UPDATED);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err) {
      console.error('Error updating block:', err);
      setError(ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteCalendarBlock(block.id);

      if (!result.success) {
        setError(result.error || ERROR_MESSAGES.CALENDAR_BLOCK.DELETE_FAILED);
        setIsLoading(false);
        return;
      }

      setSuccessMessage(SUCCESS_MESSAGES.CALENDAR_BLOCK.DELETED);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err) {
      console.error('Error deleting block:', err);
      setError(ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Event Block</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="blockTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="blockTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g. Prep time, Team meeting..."
            disabled={isLoading}
          />
        </div>

        {/* Start Time */}
        <div>
          <label htmlFor="blockStartTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Time <span className="text-red-500">*</span>
          </label>
          <DatePicker
            id="blockStartTime"
            selected={startTime}
            onChange={(date: Date | null) => date && setStartTime(date)}
            showTimeSelect
            timeFormat="h:mm aa"
            timeIntervals={5}
            dateFormat="MMMM d, yyyy h:mm aa"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {([15, 20, 30, 60] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDurationPreset(preset)}
                className={`py-3 px-2 text-sm font-medium rounded-lg transition-all ${
                  durationPreset === preset
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled={isLoading}
              >
                {preset < 60 ? `${preset} min` : '1 hour'}
              </button>
            ))}
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
              <label htmlFor="blockEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom End Time
              </label>
              <DatePicker
                id="blockEndTime"
                selected={endTime}
                onChange={(date: Date | null) => date && setEndTime(date)}
                showTimeSelect
                timeFormat="h:mm aa"
                timeIntervals={5}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
                minDate={startTime}
              />
            </div>
          )}
          {durationPreset !== 'custom' && startTime && endTime && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              End time: {endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="blockNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            id="blockNotes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            placeholder="Optional notes..."
            disabled={isLoading}
          />
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Block Color
          </label>
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {BLOCK_COLORS.map(({ hex, label }) => (
              <button
                key={hex}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => setColor(hex)}
                disabled={isLoading}
                className={`relative aspect-square rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${
                  color === hex
                    ? 'ring-[3px] ring-offset-2 ring-gray-700 dark:ring-white scale-110 shadow-md'
                    : 'hover:scale-105 hover:shadow-sm opacity-85 hover:opacity-100'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : (
              'Update Event'
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-red-800 hover:bg-red-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Event
          </button>

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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Event Block</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Are you sure you want to permanently delete this event block? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
