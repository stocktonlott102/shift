'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { createLesson, createLessonWithParticipants } from '@/app/actions/lesson-actions';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/messages';
import type { Client } from '@/lib/types/client';
import ClientMultiPicker from './ClientMultiPicker';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { LessonType } from '@/lib/supabase/types';

interface BookLessonFormProps {
  clients: Client[];
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultStartTime?: Date;
  defaultEndTime?: Date;
}

// Helper: Format Date to datetime-local input format
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function BookLessonForm({
  clients,
  onSuccess,
  onCancel,
  defaultStartTime,
  defaultEndTime,
}: BookLessonFormProps) {
  // Form state
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
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
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [selectedLessonTypeId, setSelectedLessonTypeId] = useState<string>('');
  const [customRate, setCustomRate] = useState<string>('');

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('lesson_types')
          .select('*')
          .eq('coach_id', user.id)
          .eq('is_active', true)
          .order('name');
        if (!error && data) setLessonTypes(data as LessonType[]);
      } catch (e) {
        // silent fail
      }
    };
    loadTypes();
  }, []);

  const durationHours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }, [startTime, endTime]);

  const effectiveRate = useMemo(() => {
    if (selectedLessonTypeId === 'custom') {
      return Number(customRate) || 0;
    }
    const lt = lessonTypes.find((t) => t.id === selectedLessonTypeId);
    return lt ? Number(lt.hourly_rate) : 0;
  }, [selectedLessonTypeId, customRate, lessonTypes]);

  const totalAmount = useMemo(() => {
    return Math.round(durationHours * effectiveRate * 100) / 100;
  }, [durationHours, effectiveRate]);

  const perClientAmount = useMemo(() => {
    const count = selectedClientIds.length || 1;
    return Math.round((totalAmount / count) * 100) / 100;
  }, [totalAmount, selectedClientIds.length]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Validation
    if (selectedClientIds.length === 0) {
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

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError(ERROR_MESSAGES.LESSON.INVALID_TIME_RANGE);
      setIsLoading(false);
      return;
    }

    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 15) {
      setError(ERROR_MESSAGES.LESSON.INVALID_DURATION);
      setIsLoading(false);
      return;
    }

    try {
      let result;
      if (selectedClientIds.length === 1) {
        // Backward-compatible single-client booking
        result = await createLesson({
          client_id: selectedClientIds[0],
          title: title.trim(),
          description: description.trim() || undefined,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          location: location.trim() || undefined,
        });
      } else {
        // Multi-client booking with lesson type or custom rate
        const rate = effectiveRate;
        if (!rate || rate <= 0) {
          setError(ERROR_MESSAGES.LESSON.INVALID_RATE);
          setIsLoading(false);
          return;
        }
        result = await createLessonWithParticipants({
          title: title.trim(),
          description: description.trim() || undefined,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          location: location.trim() || undefined,
          client_ids: selectedClientIds,
          lesson_type_id: selectedLessonTypeId && selectedLessonTypeId !== 'custom' ? selectedLessonTypeId : undefined,
          custom_hourly_rate: selectedLessonTypeId === 'custom' ? rate : undefined,
        });
      }

      if (!result.success) {
        setError(result.error || ERROR_MESSAGES.LESSON.CREATE_FAILED);
        setIsLoading(false);
        return;
      }

      setSuccessMessage(SUCCESS_MESSAGES.LESSON.CREATED);

      // Reset form
      setSelectedClientIds([]);
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setSelectedLessonTypeId('');
      setCustomRate('');

      setTimeout(() => onSuccess?.(), 1500);
    } catch (err) {
      console.error('Error creating lesson:', err);
      setError(ERROR_MESSAGES.GENERIC.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Book New Lesson
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

        {/* Client Selection (chips + searchable panel) */}
        <ClientMultiPicker
          clients={clients}
          value={selectedClientIds}
          onChange={setSelectedClientIds}
          disabled={isLoading}
        />

        {/* Lesson Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lesson Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Private Lesson, Jump Technique"
            disabled={isLoading}
          />
        </div>

        {/* Lesson Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lesson Type
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedLessonTypeId}
              onChange={(e) => setSelectedLessonTypeId(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            >
              <option value="">Choose a type…</option>
              {lessonTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} - ${Number(lt.hourly_rate)}/hr
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {selectedLessonTypeId === 'custom' && (
              <input
                type="number"
                min={1}
                max={999}
                step="0.01"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="Hourly rate"
                className="sm:w-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
            )}
          </div>
          {selectedClientIds.length > 0 && durationHours > 0 && effectiveRate > 0 && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Total: ${totalAmount} — Split: ${perClientAmount} per client
            </p>
          )}
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

        {/* End Time */}
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Time <span className="text-red-500">*</span>
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum lesson duration: 15 minutes
          </p>
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
            placeholder="e.g., Main Rink, Ice Surface 2"
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
            placeholder="Optional notes (e.g., skills to focus on)"
            disabled={isLoading}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || clients.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Booking...
              </span>
            ) : (
              'Book Lesson'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
