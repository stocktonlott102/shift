"use client";

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { LessonWithClient } from '@/lib/types/lesson';

interface CalendarProps {
  lessons: LessonWithClient[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: { id: string; resource: LessonWithClient }) => void;
  date?: Date;
}

// Configuration
const VISIBLE_START_HOUR = 5; // 5:00 AM
const VISIBLE_END_HOUR_NEXT_DAY = 2; // 2:00 AM next day
const HOUR_HEIGHT_PX = 64; // pixels per hour (matches CSS var)
const MINUTES_PER_SLOT = 15;

function buildVisibleRange(date: Date) {
  const start = new Date(date);
  start.setHours(VISIBLE_START_HOUR, 0, 0, 0);

  const end = new Date(start);
  const hoursUntilMidnight = 24 - VISIBLE_START_HOUR;
  const totalHours = hoursUntilMidnight + VISIBLE_END_HOUR_NEXT_DAY;
  end.setHours(start.getHours() + totalHours, 0, 0, 0);

  return { start, end };
}

function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 60000;
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

  const { start: visibleStart, end: visibleEnd } = useMemo(() => buildVisibleRange(date), [date]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = VISIBLE_START_HOUR; h < 24; h++) arr.push(h);
    for (let h = 0; h <= VISIBLE_END_HOUR_NEXT_DAY; h++) arr.push(h);
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

  return (
    <div className="scheduler p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex gap-4">
        <div className="w-20 time-gutter">
          {hours.map((h, i) => (
            <div key={i} className="time-label">
              {new Date(0, 0, 0, h).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
          ))}
        </div>

        <div className="flex-1 relative scheduler-grid overflow-auto" ref={containerRef} onClick={handleGridClick} style={{ maxHeight: `calc(var(--scheduler-hour-height) * ${hours.length})` }}>
          <div>
            {hours.map((_, idx) => (
              <div key={idx} className="scheduler-row" style={{ height: HOUR_HEIGHT_PX }} />
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
  );
}
"use client";

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { LessonWithClient } from '@/lib/types/lesson';

interface CalendarProps {
  lessons: LessonWithClient[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: { id: string; resource: LessonWithClient }) => void;
  date?: Date;
}

// Configuration
const VISIBLE_START_HOUR = 5; // 5:00 AM
const VISIBLE_END_HOUR_NEXT_DAY = 2; // 2:00 AM next day
const HOUR_HEIGHT_PX = 64; // pixels per hour (matches CSS var)
const MINUTES_PER_SLOT = 15;

function buildVisibleMinutesRange(date: Date) {
  const start = new Date(date);
  start.setHours(VISIBLE_START_HOUR, 0, 0, 0);

  const end = new Date(start);
  // Add hours until next-day end
  const hoursUntilMidnight = 24 - VISIBLE_START_HOUR;
  const totalHours = hoursUntilMidnight + VISIBLE_END_HOUR_NEXT_DAY;
  end.setHours(start.getHours() + totalHours, 0, 0, 0);

  return { start, end };
}
"use client";

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { LessonWithClient } from '@/lib/types/lesson';

interface CalendarProps {
  lessons: LessonWithClient[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: { id: string; resource: LessonWithClient }) => void;
  date?: Date;
}

// Configuration
const VISIBLE_START_HOUR = 5; // 5:00 AM
const VISIBLE_END_HOUR_NEXT_DAY = 2; // 2:00 AM next day
const HOUR_HEIGHT_PX = 64; // pixels per hour (matches CSS var)
const MINUTES_PER_SLOT = 15;

function buildVisibleRange(date: Date) {
  const start = new Date(date);
  start.setHours(VISIBLE_START_HOUR, 0, 0, 0);

  const end = new Date(start);
  const hoursUntilMidnight = 24 - VISIBLE_START_HOUR;
  const totalHours = hoursUntilMidnight + VISIBLE_END_HOUR_NEXT_DAY;
  end.setHours(start.getHours() + totalHours, 0, 0, 0);

  return { start, end };
}

function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 60000;
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

  const { start: visibleStart, end: visibleEnd } = useMemo(() => buildVisibleRange(date), [date]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = VISIBLE_START_HOUR; h < 24; h++) arr.push(h);
    for (let h = 0; h <= VISIBLE_END_HOUR_NEXT_DAY; h++) arr.push(h);
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

  return (
    <div className="scheduler p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex gap-4">
        <div className="w-20 time-gutter">
          {hours.map((h, i) => (
            <div key={i} className="time-label">
              {new Date(0, 0, 0, h).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
          ))}
        </div>

        <div className="flex-1 relative scheduler-grid overflow-auto" ref={containerRef} onClick={handleGridClick} style={{ maxHeight: `calc(var(--scheduler-hour-height) * ${hours.length})` }}>
          <div>
            {hours.map((_, idx) => (
              <div key={idx} className="scheduler-row" style={{ height: HOUR_HEIGHT_PX }} />
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
  );
}
