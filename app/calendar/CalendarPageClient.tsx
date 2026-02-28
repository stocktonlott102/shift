'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Calendar from '@/components/Calendar';
import BookLessonForm from '@/components/BookLessonForm';
import EditLessonForm from '@/components/EditLessonForm';
import EditBlockForm from '@/components/EditBlockForm';
import Navigation from '@/components/Navigation';
import { getLessons, updateLesson } from '@/app/actions/lesson-actions';
import { getClients } from '@/app/actions/client-actions';
import { getCalendarBlocks, updateCalendarBlock } from '@/app/actions/calendar-block-actions';
import type { LessonWithClient } from '@/lib/types/lesson';
import type { Client } from '@/lib/types/client';
import type { CalendarBlock } from '@/lib/types/calendar-block';

// Fetch lessons within a 2-year window (1 year back, 1 year forward).
// This avoids loading a coach's entire history on every calendar mount
// while still covering all practical navigation ranges.
function getCalendarDateRange() {
  const now = new Date();
  return {
    start_date: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString(),
    end_date: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
  };
}

interface CalendarPageClientProps {
  coachId: string;
}

export default function CalendarPageClient({ coachId }: CalendarPageClientProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEditBlockForm, setShowEditBlockForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonWithClient | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [lessonsResult, clientsResult, blocksResult] = await Promise.all([
          getLessons(getCalendarDateRange()),
          getClients(),
          getCalendarBlocks(getCalendarDateRange()),
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
        setBlocks(blocksResult.data || []);
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
    setSelectedLesson(event.resource);
    setShowEditForm(true);
  };

  // Handle cancel booking
  const handleCancelBooking = () => {
    setShowBookingForm(false);
    setSelectedSlot(null);
  };

  // Handle successful lesson edit
  const handleEditSuccess = async () => {
    setShowEditForm(false);
    setSelectedLesson(null);

    // Re-fetch lessons
    const result = await getLessons(getCalendarDateRange());
    if (result.success) {
      setLessons(result.data);
    }
    router.refresh();
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setShowEditForm(false);
    setSelectedLesson(null);
  };

  // Handle moving a lesson via long-press drag-and-drop
  const handleMoveEvent = async (event: {
    id: string;
    resource: LessonWithClient;
    newStart: Date;
    newEnd: Date;
  }) => {
    try {
      const result = await updateLesson(event.id, {
        start_time: event.newStart.toISOString(),
        end_time: event.newEnd.toISOString(),
      });

      if (result.success) {
        const lessonsResult = await getLessons(getCalendarDateRange());
        if (lessonsResult.success) {
          setLessons(lessonsResult.data);
        }
        router.refresh();
      } else {
        console.error('Failed to move lesson:', result.error);
      }
    } catch (err) {
      console.error('Error moving lesson:', err);
    }
  };

  // Handle selecting a block on the calendar
  const handleSelectBlock = (block: CalendarBlock) => {
    setSelectedBlock(block);
    setShowEditBlockForm(true);
  };

  // Handle moving a block via drag-and-drop
  const handleMoveBlock = async (block: CalendarBlock, newStart: Date, newEnd: Date) => {
    try {
      const result = await updateCalendarBlock(block.id, {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      });

      if (result.success) {
        const blocksResult = await getCalendarBlocks(getCalendarDateRange());
        setBlocks(blocksResult.data || []);
        router.refresh();
      } else {
        console.error('Failed to move block:', result.error);
      }
    } catch (err) {
      console.error('Error moving block:', err);
    }
  };

  // Handle successful block edit or creation
  const handleBlockSuccess = async () => {
    setShowEditBlockForm(false);
    setSelectedBlock(null);
    const blocksResult = await getCalendarBlocks(getCalendarDateRange());
    setBlocks(blocksResult.data || []);
    router.refresh();
  };

  // Handle cancel block edit
  const handleCancelBlock = () => {
    setShowEditBlockForm(false);
    setSelectedBlock(null);
  };

  // Handle booking success — re-fetch both lessons and blocks (block creation also uses this)
  const handleBookingSuccessWithBlocks = async () => {
    setShowBookingForm(false);
    setSelectedSlot(null);
    const [lessonsResult, blocksResult] = await Promise.all([getLessons(getCalendarDateRange()), getCalendarBlocks(getCalendarDateRange())]);
    if (lessonsResult.success) setLessons(lessonsResult.data);
    setBlocks(blocksResult.data || []);
    router.refresh();
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
      <main className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-900">
        {/* Header - Hidden on mobile */}
        <div className="hidden md:flex flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">

        {/* Title and Book Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
            Lesson Calendar
          </h1>

          {/* Book Lesson Button */}
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            + Book Lesson
          </button>
        </div>
      </div>

      {/* Floating Book Button - Mobile only */}
      <button
        onClick={() => setShowBookingForm(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 bg-primary-600 hover:bg-primary-700 text-white font-semibold p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title="Book Lesson"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Calendar Component - fills remaining space */}
      <div className="flex-1 overflow-hidden pb-20 md:pb-0">
        <Calendar
          lessons={lessons}
          blocks={blocks}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onSelectBlock={handleSelectBlock}
          onMoveEvent={handleMoveEvent}
          onMoveBlock={handleMoveBlock}
        />
      </div>
      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <BookLessonForm
              clients={clients}
              onSuccess={handleBookingSuccessWithBlocks}
              onCancel={handleCancelBooking}
              defaultStartTime={selectedSlot?.start}
              defaultEndTime={selectedSlot?.end}
            />
          </div>
        </div>
      )}

      {/* Edit Lesson Form Modal */}
      {showEditForm && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <EditLessonForm
              lesson={selectedLesson}
              clients={clients}
              onSuccess={handleEditSuccess}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {/* Edit Block Form Modal */}
      {showEditBlockForm && selectedBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <EditBlockForm
              block={selectedBlock}
              onSuccess={handleBlockSuccess}
              onCancel={handleCancelBlock}
            />
          </div>
        </div>
      )}
    </main>
    </>
  );
}
