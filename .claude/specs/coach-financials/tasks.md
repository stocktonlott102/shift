# Implementation Plan

- [x] 1. Install Recharts and create financial type definitions
  - Run `npm install recharts` and add `@types/recharts` if needed
  - Create `lib/types/financial.ts` with all interfaces: `FinancialData`, `MonthlyIncome`, `ClientIncome`, `LessonTypeIncome`, `TaxSummary`, `QuarterlyIncome`, `LessonExportRow`
  - _Requirements: 2, 3, 4, 5, 6_

- [x] 2. Create the financial server action
  - Create `app/actions/financial-actions.ts` with `getFinancialSummary(year: number)` server action
  - Authenticate user, query lessons for the given year joined with `lesson_participants`, `lesson_types`, and `clients`
  - Aggregate raw rows into `FinancialData` shape (monthly income, client breakdown, lesson type breakdown, tax summary, lesson details for CSV)
  - Handle legacy lessons without `lesson_participants` by falling back to `rate_at_booking` and legacy `client_id`
  - Calculate outstanding balance (all-time, not year-scoped)
  - _Requirements: 2, 3, 4, 5, 6, 7_

- [x] 3. Create the Financials server page
  - Create `app/financials/page.tsx` as a server component
  - Authenticate user (redirect to `/login` if not authenticated)
  - Call `getFinancialSummary()` with current year
  - Render `Navigation` + `FinancialsPageClient` with initial data as props
  - _Requirements: 1.1, 1.3_

- [x] 4. Create the FinancialsPageClient component with time period selectors and summary cards
  - Create `app/financials/FinancialsPageClient.tsx` as a client component
  - Implement year selector (dropdown) and month selector (dropdown, 0-11)
  - On year change: call `getFinancialSummary(year)` server action and update state
  - On month change: filter existing year data client-side
  - Render 5 summary cards: YTD Income, Monthly Income, Outstanding Balance, Lessons This Month, Hours This Month
  - Show `$0.00` / `0` with empty-state text when no data
  - Responsive grid: stacks on mobile, horizontal on desktop
  - _Requirements: 2, 7, 9.1_

- [x] 5. Create the MonthlyIncomeChart component
  - Create Recharts `<BarChart>` with 12 bars (Jan-Dec) inside a `<ResponsiveContainer>`
  - Add `<Tooltip>` for hover/tap showing exact dollar amount
  - Show `$0` bars for months with no income
  - Wrap in a styled card container matching app design
  - _Requirements: 3, 9.3_

- [x] 6. Create the ClientBreakdown component
  - Desktop: table layout with columns (Client Name, Lessons, Hours, Paid, Outstanding)
  - Mobile: stacked card layout for each client
  - Sorted by total paid descending
  - Rows clickable, navigating to `/clients/[clientId]`
  - _Requirements: 4, 9.2_

- [x] 7. Create the LessonTypeBreakdown component
  - Same layout pattern as ClientBreakdown (table on desktop, cards on mobile)
  - Show color dot indicator next to lesson type name
  - "Uncategorized" row for lessons without a type
  - Show: name, lesson count, hours, total paid, average rate
  - _Requirements: 5, 9.2_

- [x] 8. Create the TaxSummary component with CSV export
  - Render gross income, quarterly breakdown grid (4 quarters with income + IRS deadline), and summary stats (total lessons, hours, unique clients)
  - "Export for Tax Preparer" button generates CSV client-side from `lessonDetails` data
  - CSV columns: Date, Client Name, Lesson Type, Duration (hours), Amount Paid, Payment Status
  - Download as `shift-income-{year}.csv`
  - Show alert if no paid lessons to export
  - _Requirements: 6_

- [x] 9. Update the Dashboard page
  - Add a 4th "Financials" card to the overview card grid with a dollar sign icon and green theme, linking to `/financials`
  - Update grid classes to accommodate 4 cards (`sm:grid-cols-2 lg:grid-cols-4`)
  - Remove the entire Statistics section (lines 237-265 in current `page.tsx`)
  - Remove the `calculateUnpaidBalance` import and the outstanding payments calculation logic that is no longer needed
  - _Requirements: 1.2_

- [x] 10. Build verification and final polish
  - Run `npx next build` to verify no type errors or build failures
  - Verify dark mode styling across all new components
  - Test mobile responsiveness at common breakpoints
  - _Requirements: 9_
