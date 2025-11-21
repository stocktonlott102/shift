'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Calendar from '@/components/Calendar';
import BookLessonForm from '@/components/BookLessonForm';
import { getLessons } from '@/app/actions/lesson-actions';
import { getClients } from '@/app/actions/client-actions';
import type { LessonWithClient } from '@/lib/types/lesson';
import type { Client } from '@/lib/types/client';

interface CalendarPageClientProps {
  coachId: string;
}

export default function CalendarPageClient({ coachId }: CalendarPageClientProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [lessonsResult, clientsResult] = await Promise.all([
          getLessons(),
          getClients(),
        ]);

        if (!lessonsResult.success) {
          setError(lessonsResult.error || 'Failed to fetch lessons');
          return;
        }

        if (!clientsResult.success) {
          setError(clientsResult.error || 'Failed to fetch clients');
          return;
        }

        setLessons(lessonsResult.data);
        setClients(clientsResult.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle selecting a time slot (for booking new lesson)
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setShowBookingForm(true);
  };

  // Handle selecting an existing lesson
  const handleSelectEvent = (event: { resource: LessonWithClient }) => {
    // Navigate to lesson detail page
    router.push(`/lessons/${event.resource.id}`);
  };

  // Handle successful lesson booking
  const handleBookingSuccess = async () => {
    setShowBookingForm(false);
    setSelectedSlot(null);

    // Re-fetch lessons
    const result = await getLessons();
    if (result.success) {
      setLessons(result.data);
    }
    router.refresh();
  };

  // Handle cancel booking
  const handleCancelBooking = () => {
    setShowBookingForm(false);
    setSelectedSlot(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
            Error Loading Calendar
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with prominent Back Button */}
      <div className="mb-6">
        {/* Back to Dashboard Button - Prominent Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center mb-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
        >
          <svg
            className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Back to Dashboard</span>
        </Link>

        {/* Title and Book Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Lesson Calendar
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Schedule and manage your coaching sessions
            </p>
          </div>

          {/* Book Lesson Button */}
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            + Book Lesson
          </button>
        </div>
      </div>

      {/* Calendar Component */}
      <Calendar
        lessons={lessons}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
      />

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <BookLessonForm
              clients={clients}
              onSuccess={handleBookingSuccess}
              onCancel={handleCancelBooking}
              defaultStartTime={selectedSlot?.start}
              defaultEndTime={selectedSlot?.end}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {lessons.length === 0 && !showBookingForm && (
        <div className="mt-12 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No lessons scheduled
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Get started by booking your first lesson
          </p>
          <button
            onClick={() => setShowBookingForm(true)}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Book Your First Lesson
          </button>
        </div>
      )}
    </main>
  );
}
