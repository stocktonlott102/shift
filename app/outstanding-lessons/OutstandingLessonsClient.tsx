'use client';

import { useEffect, useState } from 'react';
import { LessonWithClient } from '@/lib/types/lesson';
import { 
  getOutstandingLessons, 
  confirmLesson, 
  markLessonNoShow,
  markParticipantPaid,
  markLessonParticipantsPaid,
} from '@/app/actions/lesson-history-actions';
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

  // Fetch outstanding lessons on mount
  useEffect(() => {
    fetchOutstandingLessons();
  }, []);

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

    const result = await markLessonNoShow(lessonId);

    if (result.success) {
      // Optimistically remove lesson from list
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
    } else {
      setError(result.error || 'Failed to mark lesson as no-show');
    }

    setActionLoading(null);
  };

  const handleMarkParticipantPaid = async (lessonId: string, clientId: string) => {
    const actionKey = `participant-${lessonId}-${clientId}`;
    setActionLoading(actionKey);
    setError(null);

    const result = await markParticipantPaid(lessonId, clientId);

    if (result.success) {
      // Update the lesson to remove this participant's amount
      setLessons((prev) =>
        prev.map((lesson) => {
          if (lesson.id === lessonId && lesson.lesson_participants) {
            return {
              ...lesson,
              lesson_participants: lesson.lesson_participants.map((p) =>
                p.client_id === clientId ? { ...p, amount_owed: 0 } : p
              ),
            };
          }
          return lesson;
        })
      );
    } else {
      setError(result.error || 'Failed to mark participant as paid');
    }

    setActionLoading(null);
  };

  const handleMarkAllParticipantsPaid = async (lessonId: string) => {
    const actionKey = `all-paid-${lessonId}`;
    setActionLoading(actionKey);
    setError(null);

    const result = await markLessonParticipantsPaid(lessonId);

    if (result.success) {
      // Update the lesson to mark all participants as paid
      setLessons((prev) =>
        prev.map((lesson) => {
          if (lesson.id === lessonId && lesson.lesson_participants) {
            return {
              ...lesson,
              lesson_participants: lesson.lesson_participants.map((p) => ({
                ...p,
                amount_owed: 0,
              })),
            };
          }
          return lesson;
        })
      );
    } else {
      setError(result.error || 'Failed to mark participants as paid');
    }

    setActionLoading(null);
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
      return lesson.lesson_participants.map(p => p.client.athlete_name);
    }
    // Legacy single-client lesson
    if (lesson.client) {
      return [lesson.client.athlete_name];
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
                          <div className="ml-4 space-y-2">
                            {lesson.lesson_participants.map((participant) => (
                              <div key={participant.id} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{participant.client.athlete_name}:</span>
                                  <span className={`text-sm font-semibold ${
                                    Number(participant.amount_owed) === 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {formatCost(Number(participant.amount_owed))}
                                  </span>
                                </div>
                                {Number(participant.amount_owed) > 0 && (
                                  <button
                                    onClick={() => handleMarkParticipantPaid(lesson.id, participant.client_id)}
                                    disabled={actionLoading?.startsWith('participant-' + lesson.id)}
                                    className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    {actionLoading === `participant-${lesson.id}-${participant.client_id}` ? 'Marking...' : 'Mark Paid'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="flex items-center gap-2 mt-2">
                            <span className="font-medium">Total:</span>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatCost(getTotalCost(lesson))}
                            </span>
                          </p>
                          {lesson.lesson_participants.some((p) => Number(p.amount_owed) > 0) && (
                            <button
                              onClick={() => handleMarkAllParticipantsPaid(lesson.id)}
                              disabled={actionLoading?.startsWith('all-paid-')}
                              className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors"
                            >
                              {actionLoading === `all-paid-${lesson.id}` ? 'Processing...' : 'Mark All Paid'}
                            </button>
                          )}
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
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleConfirmLesson(lesson.id)}
                      disabled={actionLoading === lesson.id}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === lesson.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Confirm Occurred</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleMarkNoShow(lesson.id)}
                      disabled={actionLoading === lesson.id}
                      className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-100 text-gray-800 dark:text-gray-200 font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === lesson.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 dark:border-gray-200"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>✕</span>
                          <span>Mark No-Show</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
