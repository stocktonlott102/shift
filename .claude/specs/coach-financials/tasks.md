# Implementation Plan

## Phase 1 — Income & Tax Reporting (Complete)

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

---

## Phase 2 — Business Expense Tracking

- [ ] 11. Create the expenses database migration
  - Create `supabase/migrations/20260207_create_expenses.sql` with `expenses` table (id, coach_id, date, amount, category, description, receipt_reference, is_recurring, is_mileage, miles_driven, created_at, updated_at)
  - Add `CHECK (amount > 0)` constraint
  - Add indexes: `idx_expenses_coach_id`, `idx_expenses_date`, `idx_expenses_coach_date`
  - Enable RLS with four policies: SELECT, INSERT, UPDATE, DELETE (all scoped to `coach_id = auth.uid()`)
  - Add `updated_at` auto-update trigger using `moddatetime`
  - Run the migration against the Supabase project
  - _Requirements: 8, 10_

- [ ] 12. Create expense type definitions and constants
  - Create `lib/types/expense.ts` with interfaces: `Expense`, `ExpenseData`, `MonthlyExpense`, `CategoryBreakdown`, `ExpenseExportRow`, plus `EXPENSE_CATEGORIES` const array and `ExpenseCategory` type
  - Create `lib/constants/expense-categories.ts` with `EXPENSE_CATEGORY_COLORS` color map and `IRS_MILEAGE_RATE` constant ($0.70)
  - Add `EXPENSE` section to `ERROR_MESSAGES` and `SUCCESS_MESSAGES` in `lib/constants/messages.ts`
  - _Requirements: 8, 9, 10_

- [ ] 13. Create expense Zod validation schemas
  - Create `lib/validations/expense.ts` with `CreateExpenseSchema` (date, amount, category, description, receipt_reference, is_recurring), `CreateMileageSchema` (date, miles_driven, purpose), and `UpdateExpenseSchema` (partial of CreateExpense)
  - Add helper functions `validateCreateExpense()` and `validateCreateMileage()` following the pattern in `lib/validations/lesson.ts`
  - _Requirements: 8, 10_

- [ ] 14. Create expense server actions
  - Create `app/actions/expense-actions.ts` with four server actions:
    - `getExpenseSummary(year)` — fetch all expenses for the year, aggregate into `ExpenseData` (monthly totals, category breakdown, mileage totals)
    - `createExpense(input)` — validate with Zod, insert into `expenses` table
    - `updateExpense(id, input)` — validate with Zod, update WHERE id AND coach_id match
    - `deleteExpense(id)` — delete WHERE id AND coach_id match
  - All actions: authenticate user, return `{ success, error?, data? }` pattern
  - _Requirements: 8, 9, 10_

- [ ] 15. Create the ExpenseForm component
  - Create `app/financials/ExpenseForm.tsx` as a modal form (same overlay pattern as lesson edit modal)
  - Fields: Date (DatePicker), Amount (number input with $ prefix), Category (select dropdown from `EXPENSE_CATEGORIES`), Description (textarea), Receipt Reference (text input), Recurring (checkbox)
  - When `editingExpense` prop is provided: pre-populate fields, show "Delete Expense" button with confirmation dialog
  - On submit: call `createExpense()` or `updateExpense()`, show loading state, display errors inline
  - On success: call `onSuccess` callback to close modal and refresh data
  - _Requirements: 8.4, 8.5_

- [ ] 16. Create the MileageForm component
  - Create `app/financials/MileageForm.tsx` as a modal form
  - Fields: Date (DatePicker), Miles Driven (number input), Purpose/Destination (textarea)
  - Display auto-calculated deduction below miles input: "Deduction: $X.XX (Y mi x $0.70)"
  - On submit: call `createExpense()` with `category: 'Transportation'`, `is_mileage: true`, `miles_driven`, `amount: miles * IRS_MILEAGE_RATE`, `description: purpose`
  - _Requirements: 10.1, 10.2_

- [ ] 17. Create the ExpenseList component
  - Create `app/financials/ExpenseList.tsx` with responsive layout
  - Desktop: table with columns (Date, Category with color dot, Description, Amount, Receipt Ref)
  - Mobile: compact cards with date, category pill, description, and amount
  - For mileage entries: display "32 mi — $22.40" format
  - Each row/card tappable — calls `onEditExpense(expense)` callback
  - Sorted by date descending
  - Empty state: "No expenses recorded for {month}. Tap '+ Add Expense' to get started."
  - _Requirements: 8.2, 8.3, 8.7, 10.3_

- [ ] 18. Create the ExpenseCategoryBreakdown component
  - Create `app/financials/ExpenseCategoryBreakdown.tsx`
  - Card container with year-scoped category totals sorted by amount descending
  - Each row: color dot (from `EXPENSE_CATEGORY_COLORS`), category name, expense count, total amount
  - Compact table on desktop, stacked rows on mobile
  - _Requirements: 9_

- [ ] 19. Add tab bar and expenses tab to FinancialsPageClient
  - Add `activeTab` state (`'income' | 'expenses'`) and `expenseData` state to `FinancialsPageClient.tsx`
  - Add `initialExpenseData` to props interface
  - Add tab bar UI between header and main content (two pill-style buttons)
  - Wrap existing income content in conditional `{activeTab === 'income' && ...}`
  - Add expenses tab content: summary cards (YTD Expenses, Monthly Expenses, Mileage), action buttons ("+ Add Expense", "+ Add Mileage"), `ExpenseList`, `ExpenseCategoryBreakdown`
  - Add expense modal state and render `ExpenseForm` / `MileageForm` modals
  - On year change: fetch both income and expense data in parallel
  - Month filtering for expenses: `useMemo` filter on `expenseData.expenses` by month
  - On expense create/update/delete success: re-fetch expense data for current year
  - _Requirements: 8.1, 8.6, 8.7_

- [ ] 20. Update the server page to fetch expense data
  - Modify `app/financials/page.tsx` to call `getExpenseSummary(currentYear)` in parallel with `getFinancialSummary(currentYear)` via `Promise.all`
  - Pass `initialExpenseData` to `FinancialsPageClient`
  - _Requirements: 8.1_

- [x] 21. Update TaxSummary with expense data, net profit, and combined CSV
  - Add `expenseData: ExpenseData | null` prop to `TaxSummary`
  - Below existing quarterly breakdown, add new sections (only when expenses exist):
    - Total Expenses + Net Profit row (gross income minus expenses, red if negative)
    - Expense category breakdown (compact list with category totals)
    - Mileage summary (total miles + total deduction, only when mileage entries exist)
  - Update `exportTaxCSV` to include expense rows in a separate section below income rows, separated by a blank row. Change filename to `shift-tax-summary-{year}.csv`
  - _Requirements: 11.1, 11.2, 11.3, 10.4_

- [x] 22. Build verification and final polish
  - Run `npx next build` to verify no type errors or build failures
  - Verify dark mode styling across all new expense components
  - Test mobile responsiveness: expense form modals scroll properly, cards stack, tab bar is touch-friendly
  - Test full CRUD flow: create expense, edit it, delete it
  - Test mileage flow: add mileage entry, verify auto-calculation, verify it appears in expense list and tax summary
  - Test CSV export with both income and expense data
  - _Requirements: 8, 9, 10, 11, Mobile Responsiveness_
