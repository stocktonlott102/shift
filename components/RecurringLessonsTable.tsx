'use client';

import { useState, useEffect } from 'react';
import { getRecurringSeriesForClient } from '@/app/actions/recurring-lesson-actions';

interface RecurringSeries {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  recurrence_end_date: string;
  lesson_count: number;
  future_lesson_count: number;
}

interface RecurringLessonsTableProps {
  clientId: string;
  onEditSeries?: (seriesId: string) => void;
}

export default function RecurringLessonsTable({
  clientId,
  onEditSeries,
}: RecurringLessonsTableProps) {
  const [series, setSeries] = useState<RecurringSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecurringSeries();
  }, [clientId]);

  const fetchRecurringSeries = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getRecurringSeriesForClient(clientId);

    if (result.success && result.data) {
      setSeries(result.data);
    } else {
      setError(result.error || 'Failed to load recurring lessons');
    }

    setIsLoading(false);
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading recurring lessons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <svg
          className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-gray-600 dark:text-gray-400">No recurring lessons scheduled</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl">↻</span>
          Recurring Lessons
        </h3>
        <p className="text-sm text-indigo-100 mt-1">
          {series.length} recurring {series.length === 1 ? 'series' : 'series'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Lesson Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {series.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                          {getDayOfWeek(s.start_time).slice(0, 3)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Every {getDayOfWeek(s.start_time)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getTime(s.start_time)} - {getTime(s.end_time)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {s.title}
                  </div>
                  {s.location && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {s.location}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {s.future_lesson_count} remaining
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      of {s.lesson_count} total
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Through {new Date(s.recurrence_end_date).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onEditSeries?.(s.id)}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                  >
                    Manage Series
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
