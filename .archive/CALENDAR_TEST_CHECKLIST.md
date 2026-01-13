# Calendar Baseline Testing Checklist

## Pre-Test Setup
- [ ] Ensure dev server is running: `npm run dev`
- [ ] Open browser to `http://localhost:3000`
- [ ] Log in as a coach
- [ ] Navigate to the Calendar page

## 1. Visual Rendering Tests

### Time Display
- [ ] Calendar displays hourly time labels (5 AM, 6 AM, 7 AM, etc.)
- [ ] Time range is 5:00 AM to 2:00 AM (next day)
- [ ] No 2:00 AM - 5:00 AM gap visible
- [ ] Hourly grid lines are visible and clean
- [ ] No 15-minute grid lines visible (only hourly)

### Dark Mode
- [ ] Switch to dark mode (system preference or browser devtools)
- [ ] Grid lines are soft and visible in dark mode
- [ ] Background colors are appropriate for dark mode
- [ ] Text is readable (time labels, event titles)
- [ ] Current time indicator (red line) is visible

### Color Scheme
- [ ] Scheduled lessons appear in Blue (#3B82F6)
- [ ] Completed lessons appear in Teal (#14B8A6)
- [ ] Cancelled lessons appear in Rose (#F43F5E)
- [ ] No Show lessons appear in Amber (#FBBF24) with dark text

### Current Time Indicator
- [ ] Red line appears at current time (if current time is between 5 AM - 2 AM)
- [ ] Line updates every 30 seconds
- [ ] Line is positioned accurately

## 2. Functional Tests

### Navigation
- [ ] "Back to Dashboard" button works
- [ ] Navigates to `/dashboard`
- [ ] Button has hover animation

### Booking New Lessons
- [ ] Click "+ Book Lesson" button opens modal
- [ ] Modal displays BookLessonForm
- [ ] Modal has overlay background
- [ ] Modal is scrollable if content is long

### Clicking Time Slots
- [ ] Click on an empty time slot opens booking modal
- [ ] Start and end times are pre-filled correctly
- [ ] Times snap to 15-minute intervals
- [ ] Can click anywhere in the calendar grid

### Clicking Existing Lessons
- [ ] Click on an existing lesson navigates to lesson detail page
- [ ] URL changes to `/lessons/[lesson-id]`
- [ ] Event click doesn't trigger time slot selection

### Booking Form
- [ ] Can select a client from dropdown
- [ ] Can enter lesson title
- [ ] Can set start and end times
- [ ] Can set location (optional)
- [ ] Can add notes/description (optional)
- [ ] Validation error shows if required fields missing
- [ ] Success message appears after booking
- [ ] Calendar refreshes with new lesson
- [ ] Modal closes after successful booking
- [ ] "Cancel" button closes modal without saving

## 3. Data Display Tests

### Empty State
- [ ] If no lessons exist, empty state message displays
- [ ] Empty state has icon and "Book Your First Lesson" button
- [ ] Clicking button opens booking modal

### Lesson Display
- [ ] Lessons appear at correct time positions
- [ ] Lesson height matches duration (60 minutes = 64px)
- [ ] Lesson title is visible
- [ ] Lessons don't overlap visually (if same time)
- [ ] Multi-hour lessons span correct height

### Time Calculations
- [ ] Lessons starting at 5 AM appear at top
- [ ] Lessons ending at 2 AM appear at bottom
- [ ] Lessons spanning midnight display correctly
- [ ] Lessons outside 5 AM - 2 AM range are clipped or hidden

## 4. Responsive Design Tests

### Desktop
- [ ] Calendar fills appropriate width
- [ ] Time gutter is 80px wide (w-20)
- [ ] Calendar grid is scrollable vertically
- [ ] Max height prevents page overflow

### Mobile/Tablet
- [ ] Calendar layout adapts to smaller screens
- [ ] Touch interactions work (tap to select slot)
- [ ] Modal is responsive and scrollable
- [ ] Header buttons stack on mobile

## 5. Performance Tests

### Load Time
- [ ] Calendar renders within 2 seconds
- [ ] No visible lag when loading lessons
- [ ] Loading spinner displays while fetching data

### Interactions
- [ ] Clicking time slots responds immediately
- [ ] Clicking events responds immediately
- [ ] Modal opens/closes smoothly
- [ ] No console errors in browser DevTools

## 6. Edge Cases

### Boundary Conditions
- [ ] Lesson at exactly 5:00 AM displays correctly
- [ ] Lesson ending at exactly 2:00 AM displays correctly
- [ ] 15-minute lesson displays (minimum height 8px)
- [ ] 8-hour lesson displays correctly

### Error Handling
- [ ] If fetch fails, error message displays
- [ ] Retry button allows re-fetching
- [ ] Error doesn't crash the page

### No Clients
- [ ] If no clients exist, booking form shows warning
- [ ] "No clients found" message appears
- [ ] Book Lesson button is disabled

## 7. Integration Tests

### After Booking
- [ ] New lesson appears on calendar immediately
- [ ] Lesson has correct time, title, and status
- [ ] Calendar doesn't require manual refresh
- [ ] Lesson is persisted in database (check by refreshing page)

### Navigation Flow
- [ ] Dashboard → Calendar → Lesson Detail → Back to Calendar
- [ ] All navigation works smoothly
- [ ] State is preserved appropriately

## Test Results

**Date Tested**: _______________
**Tested By**: _______________
**Browser**: _______________
**Device**: _______________

### Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Notes:
_______________________________________________
_______________________________________________
_______________________________________________
