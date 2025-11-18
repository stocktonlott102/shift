'use client';

import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState, useMemo, useCallback } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { LessonWithClient } from '@/lib/types/lesson';

// Configure date-fns localizer for React Big Calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarProps {
  lessons: LessonWithClient[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  defaultView?: View;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: LessonWithClient;
}

export default function Calendar({
  lessons,
  onSelectSlot,
  onSelectEvent,
  defaultView = 'week',
}: CalendarProps) {
  const [view, setView] = useState<View>(defaultView);
  const [date, setDate] = useState(new Date());

  // Convert lessons to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title, // Display only lesson title (not client name)
      start: new Date(lesson.start_time),
      end: new Date(lesson.end_time),
      resource: lesson,
    }));
  }, [lessons]);

  // Custom event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const lesson = event.resource;

    let backgroundColor = '#4F46E5'; // Default indigo

    switch (lesson.status) {
      case 'Scheduled':
        backgroundColor = '#4F46E5'; // Indigo
        break;
      case 'Completed':
        backgroundColor = '#10B981'; // Green
        break;
      case 'Cancelled':
        backgroundColor = '#EF4444'; // Red
        break;
      case 'No Show':
        backgroundColor = '#F59E0B'; // Amber
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.875rem',
        padding: '4px 8px',
      },
    };
  }, []);

  // Handle slot selection (clicking empty time slot)
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; action: string }) => {
      if (onSelectSlot && slotInfo.action === 'click') {
        onSelectSlot(slotInfo);
      }
    },
    [onSelectSlot]
  );

  // Handle event selection (clicking existing lesson)
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (onSelectEvent) {
        onSelectEvent(event);
      }
    },
    [onSelectEvent]
  );

  return (
    <div className="h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title" // Explicitly use title field for event display
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        defaultView={defaultView}
        step={30} // 30-minute increments
        timeslots={2} // 2 slots per step = 15-minute granularity
        showMultiDayTimes // Show times on multi-day events
        getNow={() => new Date()} // Enable current time indicator
        style={{ height: '100%' }}
        className="dark:text-gray-200"
        formats={{
          timeGutterFormat: 'h:mm a',
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'h:mm a', culture)} - ${localizer?.format(end, 'h:mm a', culture)}`,
          agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'h:mm a', culture)} - ${localizer?.format(end, 'h:mm a', culture)}`,
        }}
      />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-600"></div>
          <span className="text-gray-700 dark:text-gray-300">No Show</span>
        </div>
      </div>
    </div>
  );
}
