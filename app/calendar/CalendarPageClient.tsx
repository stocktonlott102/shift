'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Calendar from '@/components/Calendar';
import BookLessonForm from '@/components/BookLessonForm';
import Navigation from '@/components/Navigation';
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
  const handleSelectEvent = (event: { id: string; resource: LessonWithClient }) => {
    // Navigate to lesson detail page
    router.push(`/lessons/${event.id}`);
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
    <>
      <Navigation />
      <main className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

        {/* Title and Book Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Lesson Calendar
          </h1>

          {/* Book Lesson Button */}
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl whitespace-nowrap text-sm sm:text-base"
          >
            + Book Lesson
          </button>
        </div>
      </div>

      {/* Calendar Component - fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <Calendar
          lessons={lessons}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
        />
      </div>
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
    </main>
    </>
  );
}
