'use client';

import { useEffect, useState } from 'react';
import { LessonWithClient } from '@/lib/types/lesson';
import {
  getOutstandingLessons,
  confirmLesson,
  markLessonNoShow,
} from '@/app/actions/lesson-history-actions';
import { cancelLesson, deleteLesson } from '@/app/actions/lesson-actions';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface OutstandingLessonsClientProps {
  coachId: string;
}

export default function OutstandingLessonsClient({ coachId }: OutstandingLessonsClientProps) {
  const [lessons, setLessons] = useState<LessonWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  // Fetch outstanding lessons on mount
  useEffect(() => {
    fetchOutstandingLessons();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId && !target.closest('.relative')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchOutstandingLessons = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getOutstandingLessons();

    if (result.success && result.data) {
      setLessons(result.data);
    } else {
      setError(result.error || 'Failed to load outstanding lessons');
    }

    setIsLoading(false);
  };

  const handleConfirmLesson = async (lessonId: string) => {
    setActionLoading(lessonId);

    const result = await confirmLesson(lessonId);

    if (result.success) {
      // Optimistically remove lesson from list
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
    } else {
      setError(result.error || 'Failed to confirm lesson');
    }

    setActionLoading(null);
  };

  const handleMarkNoShow = async (lessonId: string) => {
    setActionLoading(lessonId);
    setOpenMenuId(null);

    const result = await markLessonNoShow(lessonId);

    if (result.success) {
      // Optimistically remove lesson from list
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
    } else {
      setError(result.error || 'Failed to mark lesson as no-show');
    }

    setActionLoading(null);
  };

  const handleMarkCancelled = async (lessonId: string) => {
    setActionLoading(lessonId);
    setOpenMenuId(null);

    const result = await cancelLesson(lessonId);

    if (result.success) {
      // Optimistically remove lesson from list
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
    } else {
      setError(result.error || 'Failed to cancel lesson');
    }

    setActionLoading(null);
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;

    setActionLoading(lessonToDelete);
    setShowDeleteDialog(false);

    const result = await deleteLesson(lessonToDelete);

    if (result.success) {
      // Optimistically remove lesson from list
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonToDelete));
    } else {
      setError(result.error || 'Failed to delete lesson');
    }

    setActionLoading(null);
    setLessonToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const formatTimeString = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return `${formatTimeString(start)} - ${formatTimeString(end)}`;
  };

  const formatCost = (rate: number) => {
    return `$${rate.toFixed(2)}`;
  };

  const getTotalCost = (lesson: LessonWithClient) => {
    // For multi-client lessons, sum participant amounts
    if (lesson.lesson_participants && lesson.lesson_participants.length > 0) {
      return lesson.lesson_participants.reduce((sum, p) => sum + Number(p.amount_owed), 0);
    }
    // For legacy single-client lessons, use rate_at_booking
    return lesson.rate_at_booking;
  };

  const getClientNames = (lesson: LessonWithClient): string[] => {
    // Multi-client lesson
    if (lesson.lesson_participants && lesson.lesson_participants.length > 0) {
      return lesson.lesson_participants.map(p =>
        `${p.client.first_name}${p.client.last_name ? ` ${p.client.last_name.charAt(0)}.` : ''}`
      );
    }
    // Legacy single-client lesson
    if (lesson.client) {
      return [
        `${lesson.client.first_name}${lesson.client.last_name ? ` ${lesson.client.last_name.charAt(0)}.` : ''}`
      ];
    }
    return [];
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Outstanding Lessons
                </h1>
                {lessons.length > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
                    {lessons.length}
                  </span>
                )}
              </div>
            </div>
          <p className="text-gray-600 dark:text-gray-400">
            Review and confirm lessons that have been completed
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                ✕
              </button>
            </div>
            <button
              onClick={fetchOutstandingLessons}
              className="mt-3 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {lessons.length === 0 && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              All Caught Up!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have no outstanding lessons to confirm.
            </p>
            <Link
              href="/calendar"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Calendar
            </Link>
          </div>
        )}

        {/* Lessons List */}
        {lessons.length > 0 && (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Lesson Info */}
                  <div className="flex-1">
                    {/* Client Names */}
                    <div className="mb-2">
                      {getClientNames(lesson).map((name, idx) => (
                        <h3 key={idx} className="text-xl font-semibold text-gray-900 dark:text-white">
                          {name}
                        </h3>
                      ))}
                    </div>

                    <div className="space-y-1 text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Date:</span>
                        {formatDate(lesson.start_time)}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Time:</span>
                        {formatTime(lesson.start_time, lesson.end_time)}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Service:</span>
                        {lesson.title}
                      </p>

                      {/* Cost breakdown for multi-client or single amount */}
                      {lesson.lesson_participants && lesson.lesson_participants.length > 0 ? (
                        <div className="mt-2">
                          <p className="font-medium mb-1">Per-Client Cost:</p>
                          <div className="ml-4 space-y-1">
                            {lesson.lesson_participants.map((participant) => (
                              <div key={participant.id} className="flex items-center gap-2">
                                <span className="text-sm">
                                  {participant.client.first_name}
                                  {participant.client.last_name ? ` ${participant.client.last_name.charAt(0)}.` : ''}:
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatCost(Number(participant.amount_owed))}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="flex items-center gap-2 mt-2">
                            <span className="font-medium">Total:</span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatCost(getTotalCost(lesson))}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Cost:</span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCost(lesson.rate_at_booking)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Primary Action: Mark Complete */}
                    <button
                      onClick={() => handleConfirmLesson(lesson.id)}
                      disabled={actionLoading === lesson.id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      {actionLoading === lesson.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Mark Complete</span>
                        </>
                      )}
                    </button>

                    {/* Three-dot menu for secondary actions */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === lesson.id ? null : lesson.id)}
                        disabled={actionLoading === lesson.id}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-100 text-gray-800 dark:text-gray-200 font-semibold px-4 py-3 rounded-lg transition-colors"
                        aria-label="More actions"
                      >
                        ⋮
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === lesson.id && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10">
                          <div className="py-2">
                            {/* Mark as No Show */}
                            <button
                              onClick={() => handleMarkNoShow(lesson.id)}
                              disabled={actionLoading === lesson.id}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                Mark as No Show
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Client will be charged
                              </div>
                            </button>

                            {/* Mark as Cancelled */}
                            <button
                              onClick={() => handleMarkCancelled(lesson.id)}
                              disabled={actionLoading === lesson.id}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                Mark as Cancelled
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Client will not be charged
                              </div>
                            </button>

                            {/* Delete Permanently */}
                            <button
                              onClick={() => {
                                setLessonToDelete(lesson.id);
                                setShowDeleteDialog(true);
                                setOpenMenuId(null);
                              }}
                              disabled={actionLoading === lesson.id}
                              className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 border-t border-gray-200 dark:border-gray-700"
                            >
                              <div className="font-medium text-red-600 dark:text-red-400">
                                Delete Permanently
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Remove from all records
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="w-12 h-12 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Lesson Permanently
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Are you sure you want to permanently delete this lesson? This will completely remove it from your records and calendar.
                  </p>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDeleteLesson}
                  disabled={actionLoading === lessonToDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === lessonToDelete ? 'Deleting...' : 'Yes, Delete Permanently'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setLessonToDelete(null);
                  }}
                  disabled={actionLoading === lessonToDelete}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
