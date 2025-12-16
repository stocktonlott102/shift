"use client";

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { LessonWithClient } from '@/lib/types/lesson';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarProps {
  lessons: LessonWithClient[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: { id: string; resource: LessonWithClient }) => void;
  date?: Date;
}

// Configuration
const HOUR_HEIGHT_PX = 64; // pixels per hour (matches CSS var)
const MINUTES_PER_SLOT = 15;

function buildVisibleRange(date: Date) {
  const start = new Date(date);
  // Start at 5:30 AM - grid begins 30 minutes before first label (6:00 AM)
  start.setHours(5, 30, 0, 0);

  const end = new Date(start);
  // Add 24 hours to complete the cycle
  end.setHours(start.getHours() + 24, start.getMinutes(), 0, 0);

  return { start, end };
}

function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 60000;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as start of week
  return new Date(d.setDate(diff));
}

function formatDateHeader(date: Date, view: CalendarView): string {
  if (view === 'day') {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } else if (view === 'week') {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}

type EventBox = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  top: number;
  height: number;
  status: string;
  resource: LessonWithClient;
};

export default function Calendar({ lessons, onSelectSlot, onSelectEvent, date = new Date() }: CalendarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(date);
  const [view, setView] = useState<CalendarView>('day');

  const { start: visibleStart, end: visibleEnd } = useMemo(() => buildVisibleRange(currentDate), [currentDate]);

  // Time slots: First slot is 30min (5:30-6:00), then 24 full hours (6:00-6:00 next day)
  const timeSlots = useMemo(() => {
    const arr: Array<{ hour: number; isHalfSlot: boolean }> = [];

    // First half-slot (5:30-6:00) - no label needed
    arr.push({ hour: 5, isHalfSlot: true });

    // Then 24 full hour slots starting from 6:00 AM
    for (let i = 0; i < 24; i++) {
      const hour = (6 + i) % 24;
      arr.push({ hour, isHalfSlot: false });
    }

    return arr;
  }, []);

  const totalVisibleMinutes = useMemo(() => minutesBetween(visibleStart, visibleEnd), [visibleStart, visibleEnd]);

  const events: EventBox[] = useMemo(() => {
    return lessons
      .map((l) => {
        const s = new Date(l.start_time);
        const e = new Date(l.end_time);

        // If event is completely outside visible range, skip
        if (e <= visibleStart || s >= visibleEnd) return null;

        const clippedStart = s < visibleStart ? visibleStart : s;
        const clippedEnd = e > visibleEnd ? visibleEnd : e;

        const minutesFromStart = minutesBetween(visibleStart, clippedStart);
        const durationMinutes = Math.max(1, minutesBetween(clippedStart, clippedEnd));

        const top = (minutesFromStart / 60) * HOUR_HEIGHT_PX;
        const height = (durationMinutes / 60) * HOUR_HEIGHT_PX;

        return {
          id: l.id,
          title: l.title,
          start: clippedStart,
          end: clippedEnd,
          top,
          height: Math.max(8, height),
          status: l.status,
          resource: l,
        } as EventBox;
      })
      .filter(Boolean) as EventBox[];
  }, [lessons, visibleStart, visibleEnd]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top; // px from top

      const minutesFromStart = (y / HOUR_HEIGHT_PX) * 60;
      const snapped = Math.round(minutesFromStart / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;

      const slotStart = new Date(visibleStart.getTime() + snapped * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + MINUTES_PER_SLOT * 60 * 1000);

      onSelectSlot?.({ start: slotStart, end: slotEnd });
    },
    [onSelectSlot, visibleStart]
  );

  const nowTop = (() => {
    const m = minutesBetween(visibleStart, now);
    if (m < 0 || m > totalVisibleMinutes) return null;
    return (m / 60) * HOUR_HEIGHT_PX;
  })();

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="scheduler p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Control Panel */}
      <div className="calendar-controls">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="today-button"
          >
            Today
          </button>
          <button
            onClick={handlePrevious}
            className="nav-button"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="nav-button"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="date-header">
            {formatDateHeader(currentDate, view)}
          </h2>
        </div>

        {/* View Switcher */}
        <div className="view-switcher">
          <button
            onClick={() => setView('day')}
            className={`view-button ${view === 'day' ? 'active' : ''}`}
          >
            Day
          </button>
          <button
            onClick={() => setView('week')}
            className={`view-button ${view === 'week' ? 'active' : ''}`}
          >
            Week
          </button>
          <button
            onClick={() => setView('month')}
            className={`view-button ${view === 'month' ? 'active' : ''}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="scheduler">
        <div className="flex gap-2">
          <div className="w-16 time-gutter">
            {timeSlots.map((slot, i) => (
              <div
                key={i}
                className="time-label"
                style={{ height: slot.isHalfSlot ? `${HOUR_HEIGHT_PX / 2}px` : `${HOUR_HEIGHT_PX}px` }}
              >
                {!slot.isHalfSlot && new Date(0, 0, 0, slot.hour).toLocaleTimeString([], { hour: 'numeric' }).replace(':00', '')}
              </div>
            ))}
          </div>

          <div className="flex-1 relative scheduler-grid overflow-auto" ref={containerRef} onClick={handleGridClick} style={{ maxHeight: `calc(var(--scheduler-hour-height) * ${timeSlots.length - 0.5})` }}>
            <div>
              {timeSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="scheduler-row"
                  style={{ height: slot.isHalfSlot ? `${HOUR_HEIGHT_PX / 2}px` : `${HOUR_HEIGHT_PX}px` }}
                />
              ))}
            </div>

            {events.map((ev) => {
              const cls = `scheduler-event ${ev.status === 'Completed' ? 'completed' : ev.status === 'Cancelled' ? 'cancelled' : ev.status === 'No Show' ? 'noshow' : 'scheduled'}`;
              return (
                <div
                  key={ev.id}
                  className={cls}
                  style={{ top: ev.top, height: ev.height }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent?.({ id: ev.id, resource: ev.resource });
                  }}
                >
                  {ev.title}
                </div>
              );
            })}

            {nowTop !== null && <div className="current-time-line" style={{ top: nowTop }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
