"use client";

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { LessonWithClient } from '@/lib/types/lesson';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarProps {
  lessons: LessonWithClient[];
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: { id: string; resource: LessonWithClient }) => void;
  onMoveEvent?: (event: { id: string; resource: LessonWithClient; newStart: Date; newEnd: Date }) => void;
  date?: Date;
}

// Configuration
const HOUR_HEIGHT_PX = 64; // pixels per hour (matches CSS var)
const SNAP_INTERVAL_MINUTES = 15; // Snap clicks to 15-minute intervals
const DEFAULT_SLOT_DURATION_MINUTES = 30; // Default lesson duration when clicking

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
  // Monday as start of week (day 1)
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  return days;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getMonthGrid(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from the first Sunday (or Monday) of the grid
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDayOfWeek);
  
  // Generate 42 days (6 weeks)
  const grid: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    grid.push(day);
  }
  
  return grid;
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
  column: number;
  totalColumns: number;
};

/**
 * Compute side-by-side layout for overlapping events.
 * Groups overlapping events and assigns each a column index.
 */
function computeOverlapLayout(rawEvents: Omit<EventBox, 'column' | 'totalColumns'>[]): EventBox[] {
  if (rawEvents.length === 0) return [];

  const sorted = [...rawEvents].sort((a, b) => {
    const diff = a.start.getTime() - b.start.getTime();
    if (diff !== 0) return diff;
    return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime());
  });

  // Build overlap groups (events that transitively overlap)
  const groups: (typeof sorted)[] = [];
  let currentGroup = [sorted[0]];
  let groupEnd = sorted[0].end.getTime();

  for (let i = 1; i < sorted.length; i++) {
    const ev = sorted[i];
    if (ev.start.getTime() < groupEnd) {
      currentGroup.push(ev);
      groupEnd = Math.max(groupEnd, ev.end.getTime());
    } else {
      groups.push(currentGroup);
      currentGroup = [ev];
      groupEnd = ev.end.getTime();
    }
  }
  groups.push(currentGroup);

  // Greedy column assignment per group
  const result: EventBox[] = [];
  for (const group of groups) {
    const columns: { end: number }[] = [];
    const assignments = new Map<string, number>();

    for (const ev of group) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        if (ev.start.getTime() >= columns[col].end) {
          columns[col].end = ev.end.getTime();
          assignments.set(ev.id, col);
          placed = true;
          break;
        }
      }
      if (!placed) {
        assignments.set(ev.id, columns.length);
        columns.push({ end: ev.end.getTime() });
      }
    }

    const totalColumns = columns.length;
    for (const ev of group) {
      result.push({ ...ev, column: assignments.get(ev.id) || 0, totalColumns });
    }
  }

  return result;
}

// Drag-to-move constants
const LONG_PRESS_DURATION = 500; // ms to trigger long press
const MOVE_THRESHOLD = 10; // px - if finger moves more than this before timer, cancel long press

export default function Calendar({ lessons, onSelectSlot, onSelectEvent, onMoveEvent, date = new Date() }: CalendarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(date);
  const [view, setView] = useState<CalendarView>('day');
  const [hoveredSlot, setHoveredSlot] = useState<{ top: number; dayIndex?: number } | null>(null);

  // Drag state for rendering
  const [isDragging, setIsDragging] = useState(false);
  const [dragEvent, setDragEvent] = useState<EventBox | null>(null);
  const [dragGhostPosition, setDragGhostPosition] = useState<{ top: number; dayIndex?: number } | null>(null);

  // Refs for touch handling (avoid stale closures in document-level handlers)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; dayIndex?: number } | null>(null);
  const dragStartOffsetRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'move' | 'place' | null>(null);
  const dragEventRef = useRef<EventBox | null>(null);
  const dragGhostRef = useRef<{ top: number; dayIndex?: number } | null>(null);
  const wasTouchRef = useRef(false);
  const justDraggedRef = useRef(false);
  const mouseDragRef = useRef<{ startX: number; startY: number; event: EventBox; activated: boolean } | null>(null);

  // Refs to access latest props/state from document-level handlers
  const viewRef = useRef(view);
  const weekDaysRef = useRef<Date[]>([]);
  const visibleStartRef = useRef<Date>(new Date());
  const onMoveEventRef = useRef(onMoveEvent);
  const onSelectSlotRef = useRef(onSelectSlot);

  // Week view specific data
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Month view specific data
  const monthGrid = useMemo(() => getMonthGrid(currentDate), [currentDate]);
  const monthSessionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    monthGrid.forEach(day => {
      const dayKey = day.toDateString();
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      const count = lessons.filter(l => {
        const s = new Date(l.start_time);
        return s >= dayStart && s <= dayEnd;
      }).length;
      
      counts.set(dayKey, count);
    });
    return counts;
  }, [monthGrid, lessons]);

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
    const rawEvents = lessons
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
        };
      })
      .filter(Boolean) as Omit<EventBox, 'column' | 'totalColumns'>[];

    return computeOverlapLayout(rawEvents);
  }, [lessons, visibleStart, visibleEnd]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // Keep refs in sync with latest props/state for document-level handlers
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { weekDaysRef.current = weekDays; }, [weekDays]);
  useEffect(() => { visibleStartRef.current = visibleStart; }, [visibleStart]);
  useEffect(() => { onMoveEventRef.current = onMoveEvent; }, [onMoveEvent]);
  useEffect(() => { onSelectSlotRef.current = onSelectSlot; }, [onSelectSlot]);

  // Calculate slot position from mouse/touch event
  const calculateSlotPosition = useCallback((clientY: number, dayIndex?: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();

    // Simply use clientY relative to the element's top position
    const y = clientY - rect.top;

    const minutesFromStart = (y / HOUR_HEIGHT_PX) * 60;
    const snapped = Math.round(minutesFromStart / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;
    const top = (snapped / 60) * HOUR_HEIGHT_PX;

    return { top, snapped, dayIndex };
  }, []);

  const handleGridClick = useCallback(
    (e: React.MouseEvent, dayIndex?: number) => {
      // Skip touch-generated clicks - on mobile, long press handles booking
      if (wasTouchRef.current) { wasTouchRef.current = false; return; }
      if (isDragging || justDraggedRef.current) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Simply use clientY relative to the element's top position
      const y = e.clientY - rect.top;

      const minutesFromStart = (y / HOUR_HEIGHT_PX) * 60;
      const snapped = Math.round(minutesFromStart / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;

      let slotStart: Date;
      if (view === 'week' && dayIndex !== undefined) {
        // Week view: use the specific day
        const targetDay = weekDays[dayIndex];
        slotStart = new Date(targetDay);
        slotStart.setHours(5, 30, 0, 0);
        slotStart.setMinutes(slotStart.getMinutes() + snapped);
      } else {
        // Day view: use current date
        slotStart = new Date(visibleStart.getTime() + snapped * 60 * 1000);
      }

      const slotEnd = new Date(slotStart.getTime() + DEFAULT_SLOT_DURATION_MINUTES * 60 * 1000);
      onSelectSlot?.({ start: slotStart, end: slotEnd });
    },
    [onSelectSlot, visibleStart, view, weekDays, isDragging]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent, dayIndex?: number) => {
    if (isDraggingRef.current) return; // Suppress hover during drag
    const position = calculateSlotPosition(e.clientY, dayIndex);
    if (position) {
      setHoveredSlot({ top: position.top, dayIndex: position.dayIndex });
    }
  }, [calculateSlotPosition]);

  const handleMouseLeave = useCallback(() => {
    if (isDraggingRef.current) return;
    setHoveredSlot(null);
  }, []);

  // --- Mouse drag handler (desktop: click+drag to move lessons) ---
  const handleEventMouseDown = useCallback((e: React.MouseEvent, ev: EventBox) => {
    if (e.button !== 0) return; // Only left click
    mouseDragRef.current = { startX: e.clientX, startY: e.clientY, event: ev, activated: false };
  }, []);

  // Document-level mouse drag listeners
  useEffect(() => {
    const onDocMouseMove = (e: MouseEvent) => {
      if (!mouseDragRef.current) return;

      const { startX, startY, event: ev, activated } = mouseDragRef.current;

      if (!activated) {
        // Check if mouse moved enough to start dragging
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;

        // Activate drag
        mouseDragRef.current.activated = true;
        isDraggingRef.current = true;
        dragModeRef.current = 'move';
        dragEventRef.current = ev;

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          dragStartOffsetRef.current = startY - rect.top - ev.top;
        }

        setDragEvent(ev);
        setIsDragging(true);
        setHoveredSlot(null);
      }

      // Update ghost position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top - dragStartOffsetRef.current;

        const minutesFromStart = (y / HOUR_HEIGHT_PX) * 60;
        const snapped = Math.round(minutesFromStart / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;
        const snappedTop = (snapped / 60) * HOUR_HEIGHT_PX;

        let dayIndex: number | undefined;
        if (viewRef.current === 'week') {
          const colWidth = rect.width / 7;
          const x = e.clientX - rect.left;
          dayIndex = Math.max(0, Math.min(6, Math.floor(x / colWidth)));
        }

        const newPos = { top: Math.max(0, snappedTop), dayIndex };
        dragGhostRef.current = newPos;
        setDragGhostPosition(newPos);
      }
    };

    const onDocMouseUp = () => {
      if (!mouseDragRef.current) return;

      if (mouseDragRef.current.activated && dragGhostRef.current) {
        const ghostPos = dragGhostRef.current;
        const ev = mouseDragRef.current.event;
        const minutesFromGridStart = (ghostPos.top / HOUR_HEIGHT_PX) * 60;

        let targetStart: Date;
        if (viewRef.current === 'week' && ghostPos.dayIndex !== undefined) {
          const targetDay = weekDaysRef.current[ghostPos.dayIndex];
          targetStart = new Date(targetDay);
          targetStart.setHours(5, 30, 0, 0);
          targetStart.setMinutes(targetStart.getMinutes() + minutesFromGridStart);
        } else {
          targetStart = new Date(visibleStartRef.current.getTime() + minutesFromGridStart * 60 * 1000);
        }

        const originalDurationMs = new Date(ev.resource.end_time).getTime()
          - new Date(ev.resource.start_time).getTime();
        const newEnd = new Date(targetStart.getTime() + originalDurationMs);

        onMoveEventRef.current?.({
          id: ev.id,
          resource: ev.resource,
          newStart: targetStart,
          newEnd,
        });

        justDraggedRef.current = true;
        setTimeout(() => { justDraggedRef.current = false; }, 300);
      }

      // Reset
      mouseDragRef.current = null;
      isDraggingRef.current = false;
      dragModeRef.current = null;
      dragEventRef.current = null;
      dragGhostRef.current = null;
      setIsDragging(false);
      setDragEvent(null);
      setDragGhostPosition(null);
    };

    document.addEventListener('mousemove', onDocMouseMove);
    document.addEventListener('mouseup', onDocMouseUp);

    return () => {
      document.removeEventListener('mousemove', onDocMouseMove);
      document.removeEventListener('mouseup', onDocMouseUp);
    };
  }, []);

  // --- Touch handlers (mobile: long press to place/move) ---

  // Grid long-press: hold on empty space to place a new lesson
  const handleGridTouchStart = useCallback((e: React.TouchEvent, dayIndex?: number) => {
    wasTouchRef.current = true;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, dayIndex };

    longPressTimerRef.current = setTimeout(() => {
      // Long press on empty space - enter place mode
      isDraggingRef.current = true;
      dragModeRef.current = 'place';
      dragStartOffsetRef.current = 0;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const y = touch.clientY - rect.top;
        const minutesFromStart = (y / HOUR_HEIGHT_PX) * 60;
        const snapped = Math.round(minutesFromStart / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;
        const snappedTop = (snapped / 60) * HOUR_HEIGHT_PX;

        const ghostPos = { top: Math.max(0, snappedTop), dayIndex };
        dragGhostRef.current = ghostPos;
        setDragGhostPosition(ghostPos);
      }

      dragEventRef.current = null;
      setDragEvent(null);
      setIsDragging(true);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);
  }, []);

  // Event long-press: hold on a lesson to move it
  const handleEventTouchStart = useCallback((e: React.TouchEvent, ev: EventBox) => {
    e.stopPropagation(); // Don't trigger grid touch start
    wasTouchRef.current = true;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      dragModeRef.current = 'move';
      dragEventRef.current = ev;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const touchYInGrid = touch.clientY - rect.top;
        dragStartOffsetRef.current = touchYInGrid - ev.top;
      }

      const ghostPos: { top: number; dayIndex?: number } = { top: ev.top };
      dragGhostRef.current = ghostPos;
      setDragGhostPosition(ghostPos);
      setDragEvent(ev);
      setIsDragging(true);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);
  }, []);

  // Document-level touch handlers (non-passive so preventDefault works)
  useEffect(() => {
    const onDocTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];

      // Before drag mode: check if finger moved too much, cancel long press
      if (!isDraggingRef.current && touchStartRef.current) {
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;
        if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          touchStartRef.current = null;
        }
        return;
      }

      // During drag: prevent scrolling and update ghost position
      if (isDraggingRef.current && containerRef.current) {
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const y = touch.clientY - rect.top - dragStartOffsetRef.current;

        const minutesFromStart = (y / HOUR_HEIGHT_PX) * 60;
        const snapped = Math.round(minutesFromStart / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES;
        const snappedTop = (snapped / 60) * HOUR_HEIGHT_PX;

        let dayIndex: number | undefined;
        if (viewRef.current === 'week') {
          const colWidth = rect.width / 7;
          const x = touch.clientX - rect.left;
          dayIndex = Math.max(0, Math.min(6, Math.floor(x / colWidth)));
        }

        const newPos = { top: Math.max(0, snappedTop), dayIndex };
        dragGhostRef.current = newPos;
        setDragGhostPosition(newPos);
      }
    };

    const onDocTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (isDraggingRef.current && dragGhostRef.current) {
        e.preventDefault(); // Prevent synthetic click after drag

        const ghostPos = dragGhostRef.current;
        const minutesFromGridStart = (ghostPos.top / HOUR_HEIGHT_PX) * 60;

        let targetStart: Date;
        if (viewRef.current === 'week' && ghostPos.dayIndex !== undefined) {
          const targetDay = weekDaysRef.current[ghostPos.dayIndex];
          targetStart = new Date(targetDay);
          targetStart.setHours(5, 30, 0, 0);
          targetStart.setMinutes(targetStart.getMinutes() + minutesFromGridStart);
        } else {
          targetStart = new Date(visibleStartRef.current.getTime() + minutesFromGridStart * 60 * 1000);
        }

        if (dragModeRef.current === 'move' && dragEventRef.current) {
          const originalDurationMs = new Date(dragEventRef.current.resource.end_time).getTime()
            - new Date(dragEventRef.current.resource.start_time).getTime();
          const newEnd = new Date(targetStart.getTime() + originalDurationMs);

          onMoveEventRef.current?.({
            id: dragEventRef.current.id,
            resource: dragEventRef.current.resource,
            newStart: targetStart,
            newEnd,
          });
        } else if (dragModeRef.current === 'place') {
          const slotEnd = new Date(targetStart.getTime() + DEFAULT_SLOT_DURATION_MINUTES * 60 * 1000);
          onSelectSlotRef.current?.({ start: targetStart, end: slotEnd });
        }

        justDraggedRef.current = true;
        setTimeout(() => { justDraggedRef.current = false; }, 300);
      }

      // Reset all drag state
      isDraggingRef.current = false;
      dragModeRef.current = null;
      dragEventRef.current = null;
      dragGhostRef.current = null;
      touchStartRef.current = null;
      setIsDragging(false);
      setDragEvent(null);
      setDragGhostPosition(null);
    };

    document.addEventListener('touchmove', onDocTouchMove, { passive: false });
    document.addEventListener('touchend', onDocTouchEnd);

    return () => {
      document.removeEventListener('touchmove', onDocTouchMove);
      document.removeEventListener('touchend', onDocTouchEnd);
    };
  }, []);

  // Toggle body scroll lock during drag
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('dragging-lesson');
    } else {
      document.body.classList.remove('dragging-lesson');
    }
    return () => {
      document.body.classList.remove('dragging-lesson');
    };
  }, [isDragging]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const nowTop = (() => {
    const m = minutesBetween(visibleStart, now);
    if (m < 0 || m > totalVisibleMinutes) return null;
    return (m / 60) * HOUR_HEIGHT_PX;
  })();

  // Week view: group events by day
  const weekEvents = useMemo(() => {
    if (view !== 'week') return [];
    
    return weekDays.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(5, 30, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(dayStart.getHours() + 24, 30, 0, 0);

      const dayLessons = lessons.filter((l) => {
        const s = new Date(l.start_time);
        const e = new Date(l.end_time);
        return !(e <= dayStart || s >= dayEnd);
      });

      const rawDayEvents = dayLessons.map((l) => {
        const s = new Date(l.start_time);
        const e = new Date(l.end_time);

        const clippedStart = s < dayStart ? dayStart : s;
        const clippedEnd = e > dayEnd ? dayEnd : e;

        const minutesFromStart = minutesBetween(dayStart, clippedStart);
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
        };
      });

      return computeOverlapLayout(rawDayEvents);
    });
  }, [view, weekDays, lessons]);

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

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Control Panel */}
      <div className="calendar-controls">
        {/* Mobile: Stacked layout, Desktop: Side by side */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          {/* Top row on mobile: Navigation arrows + Date */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleToday}
                className="today-button text-xs sm:text-sm"
              >
                Today
              </button>
              <button
                onClick={handlePrevious}
                className="nav-button"
                aria-label="Previous"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="nav-button"
                aria-label="Next"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <h2 className="date-header text-xs sm:text-base md:text-xl truncate">
              {formatDateHeader(currentDate, view)}
            </h2>
          </div>

          {/* View Switcher - Full width on mobile */}
          <div className="view-switcher w-full sm:w-auto">
            <button
              onClick={() => setView('day')}
              className={`view-button flex-1 sm:flex-none text-xs sm:text-sm ${view === 'day' ? 'active' : ''}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`view-button flex-1 sm:flex-none text-xs sm:text-sm ${view === 'week' ? 'active' : ''}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`view-button flex-1 sm:flex-none text-xs sm:text-sm ${view === 'month' ? 'active' : ''}`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {view === 'month' ? (
          // Month View
          <div className="flex flex-col h-full overflow-auto p-4">
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid (6 rows x 7 days = 42 cells) */}
            <div className="grid grid-cols-7 gap-1 flex-1 select-none">
              {monthGrid.map((day, idx) => {
                const isToday = isSameDay(day, now);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const sessionCount = monthSessionCounts.get(day.toDateString()) || 0;
                
                return (
                  <div
                    key={idx}
                    onClick={() => handleDateClick(day)}
                    className={`
                      relative border rounded-lg p-2 cursor-pointer transition-all hover:border-indigo-500
                      ${isToday ? 'border-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${sessionCount > 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
                    `}
                  >
                    {/* Date number */}
                    <div className={`text-sm sm:text-base font-semibold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                      {day.getDate()}
                    </div>
                    
                    {/* Session count indicator */}
                    {sessionCount > 0 && (
                      <div className="absolute bottom-1 right-1 text-xs font-medium px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                        {sessionCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : view === 'week' ? (
          // Week View
          <div className="flex flex-col h-full">
            {/* Week Grid with Header */}
            <div className="flex h-full overflow-auto relative">
              <div className="w-12 sm:w-16 flex-shrink-0 sticky left-0 z-10 bg-white dark:bg-gray-900">
                {/* Empty space for header alignment */}
                <div className="border-b border-gray-200 dark:border-gray-700" style={{ height: '60px' }} />
                
                {/* Time labels */}
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

              <div className="flex-1 flex flex-col min-w-0">
                {/* Week Header - inside scrollable area */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ height: '60px' }}>
                  {weekDays.map((day, idx) => {
                    const isToday = isSameDay(day, now);
                    return (
                      <div
                        key={idx}
                        className={`flex-1 text-center py-2 border-l border-gray-200 dark:border-gray-700 ${
                          isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        <div className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg sm:text-xl font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Week day columns */}
                <div className="flex" ref={containerRef}>
                  {weekDays.map((day, dayIdx) => {
                    const isToday = isSameDay(day, now);
                    const dayEventsForCol = weekEvents[dayIdx] || [];

                    return (
                      <div
                        key={dayIdx}
                        className={`flex-1 relative border-l border-gray-200 dark:border-gray-700 select-none ${
                          isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                        }`}
                        onClick={(e) => handleGridClick(e, dayIdx)}
                        onMouseMove={(e) => handleMouseMove(e, dayIdx)}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={(e) => handleGridTouchStart(e, dayIdx)}
                      >
                        {/* Time grid rows */}
                        {timeSlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="scheduler-row"
                            style={{ height: slot.isHalfSlot ? `${HOUR_HEIGHT_PX / 2}px` : `${HOUR_HEIGHT_PX}px` }}
                          />
                        ))}

                        {/* Hover indicator for this day column */}
                        {hoveredSlot && hoveredSlot.dayIndex === dayIdx && (
                          <div
                            className="absolute left-0 right-0 pointer-events-none rounded-md bg-primary-100/10 border-2 border-primary-300 dark:bg-primary-400/10 dark:border-primary-500"
                            style={{
                              top: `${hoveredSlot.top}px`,
                              height: `${(DEFAULT_SLOT_DURATION_MINUTES / 60) * HOUR_HEIGHT_PX}px`,
                            }}
                          />
                        )}

                        {/* Events for this day */}
                        {dayEventsForCol.map((ev) => {
                          const cls = `scheduler-event ${ev.height <= (HOUR_HEIGHT_PX * (20 / 60)) ? 'small' : ''} ${isDragging && dragEvent?.id === ev.id ? 'opacity-40' : ''}`;
                          const backgroundColor = ev.resource.lesson_type?.color || '#3B82F6';
                          const widthPercent = 100 / ev.totalColumns;
                          const leftPercent = (ev.column / ev.totalColumns) * 100;
                          return (
                            <div
                              key={ev.id}
                              className={cls}
                              style={{
                                top: ev.top,
                                height: ev.height,
                                backgroundColor,
                                left: ev.totalColumns === 1 ? '2px' : `calc(${leftPercent}% + 1px)`,
                                right: ev.totalColumns === 1 ? '2px' : 'auto',
                                width: ev.totalColumns === 1 ? undefined : `calc(${widthPercent}% - 2px)`,
                              }}
                              onMouseDown={(e) => handleEventMouseDown(e, ev)}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDragging && !justDraggedRef.current) {
                                  onSelectEvent?.({ id: ev.id, resource: ev.resource });
                                }
                              }}
                              onTouchStart={(e) => handleEventTouchStart(e, ev)}
                            >
                              <span className="flex items-center gap-1">
                                {ev.resource.is_recurring && <span className="text-xs">↻</span>}
                                <span>{ev.title}</span>
                              </span>
                            </div>
                          );
                        })}

                        {/* Drag ghost for this column */}
                        {isDragging && dragGhostPosition && dragGhostPosition.dayIndex === dayIdx && (
                          <div
                            className="absolute left-1 right-1 rounded-md border-2 border-dashed border-indigo-500 bg-indigo-200/50 dark:bg-indigo-700/30 pointer-events-none z-50"
                            style={{
                              top: `${dragGhostPosition.top}px`,
                              height: `${dragEvent ? dragEvent.height : (DEFAULT_SLOT_DURATION_MINUTES / 60) * HOUR_HEIGHT_PX}px`,
                            }}
                          >
                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 px-2 py-1">
                              {dragEvent ? dragEvent.resource.title : 'New Lesson'}
                            </span>
                          </div>
                        )}

                        {/* Current time line for today */}
                        {isToday && nowTop !== null && (
                          <div className="current-time-line" style={{ top: nowTop }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Day View
          <div className="flex h-full overflow-auto relative">
            <div className="w-12 sm:w-16 flex-shrink-0 sticky left-0 z-10 bg-white dark:bg-gray-900">
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

            <div className="flex-1 min-w-0">
              <div
                className="relative scheduler-grid"
                ref={containerRef}
                onClick={handleGridClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={(e) => handleGridTouchStart(e)}
              >
                <div>
                  {timeSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="scheduler-row"
                      style={{ height: slot.isHalfSlot ? `${HOUR_HEIGHT_PX / 2}px` : `${HOUR_HEIGHT_PX}px` }}
                    />
                  ))}
                </div>

                {/* Hover indicator */}
                {hoveredSlot && hoveredSlot.dayIndex === undefined && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none rounded-md bg-primary-100/10 border-2 border-primary-300 dark:bg-primary-400/10 dark:border-primary-500"
                    style={{
                      top: `${hoveredSlot.top}px`,
                      height: `${(DEFAULT_SLOT_DURATION_MINUTES / 60) * HOUR_HEIGHT_PX}px`,
                    }}
                  />
                )}

                {events.map((ev) => {
                  const cls = `scheduler-event ${ev.height <= (HOUR_HEIGHT_PX * (20 / 60)) ? 'small' : ''} ${isDragging && dragEvent?.id === ev.id ? 'opacity-40' : ''}`;
                  const backgroundColor = ev.resource.lesson_type?.color || '#3B82F6';
                  const widthPercent = 100 / ev.totalColumns;
                  const leftPercent = (ev.column / ev.totalColumns) * 100;
                  return (
                    <div
                      key={ev.id}
                      className={cls}
                      style={{
                        top: ev.top,
                        height: ev.height,
                        backgroundColor,
                        left: ev.totalColumns === 1 ? '2px' : `calc(${leftPercent}% + 1px)`,
                        right: ev.totalColumns === 1 ? '2px' : 'auto',
                        width: ev.totalColumns === 1 ? undefined : `calc(${widthPercent}% - 2px)`,
                      }}
                      onMouseDown={(e) => handleEventMouseDown(e, ev)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDragging && !justDraggedRef.current) {
                          onSelectEvent?.({ id: ev.id, resource: ev.resource });
                        }
                      }}
                      onTouchStart={(e) => handleEventTouchStart(e, ev)}
                    >
                      <span className="flex items-center gap-1">
                        {ev.resource.is_recurring && <span className="text-xs">↻</span>}
                        <span>{ev.title}</span>
                      </span>
                    </div>
                  );
                })}

                {/* Drag ghost for day view */}
                {isDragging && dragGhostPosition && dragGhostPosition.dayIndex === undefined && (
                  <div
                    className="absolute left-1 right-1 rounded-md border-2 border-dashed border-indigo-500 bg-indigo-200/50 dark:bg-indigo-700/30 pointer-events-none z-50"
                    style={{
                      top: `${dragGhostPosition.top}px`,
                      height: `${dragEvent ? dragEvent.height : (DEFAULT_SLOT_DURATION_MINUTES / 60) * HOUR_HEIGHT_PX}px`,
                    }}
                  >
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 px-2 py-1">
                      {dragEvent ? dragEvent.resource.title : 'New Lesson'}
                    </span>
                  </div>
                )}

                {nowTop !== null && <div className="current-time-line" style={{ top: nowTop }} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
