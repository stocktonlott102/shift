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

  // Convert lessons to calendar events - Display only lesson title
  const events: CalendarEvent[] = useMemo(() => {
    return lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title, // Clean display - lesson title only
      start: new Date(lesson.start_time),
      end: new Date(lesson.end_time),
      resource: lesson,
    }));
  }, [lessons]);

  // Event styling with updated color scheme
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const lesson = event.resource;

    // Modern, clean color palette
    const colorMap: Record<string, string> = {
      'Scheduled': '#3B82F6',  // Bright Blue
      'Completed': '#14B8A6',  // Soft Teal/Mint
      'Cancelled': '#F43F5E',  // Rose Red
      'No Show': '#FBBF24',    // Amber/Yellow
    };

    const backgroundColor = colorMap[lesson.status] || '#3B82F6';

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
        fontWeight: '500',
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
        titleAccessor="title"
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
  // Configuration for 15-minute booking precision and hourly visual lines
  // Use a 15-minute step so selections work at 15-minute granularity.
  // We'll render hourly visual lines via CSS so the grid looks clean.
  step={15}        // 15-minute step for selectable precision
  timeslots={1}    // keep single timeslot per group; CSS will display hourly boundaries
  // Scroll initial view to 5:00 AM on load (user's preferred start of day)
  scrollToTime={new Date(1970, 1, 1, 5, 0, 0)}
        showMultiDayTimes
        getNow={() => new Date()} // Enable red current time indicator
        style={{ height: '100%' }}
        className="dark:text-gray-200"
        // Explicit formats - force hourly-looking gutter labels
        formats={{
          timeGutterFormat: 'h:mm a',
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'h:mm a', culture)} - ${localizer?.format(end, 'h:mm a', culture)}`,
          agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'h:mm a', culture)} - ${localizer?.format(end, 'h:mm a', culture)}`,
        }}
      />

      {/* Legend - Updated with new color scheme */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-teal-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-rose-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-400"></div>
          <span className="text-gray-700 dark:text-gray-300">No Show</span>
        </div>
      </div>
    </div>
  );
}
