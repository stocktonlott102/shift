# Requirements Document

## Introduction

Coaches need financial visibility into their lesson-based income to manage their business and prepare for yearly taxes. This feature adds a dedicated **Financials** section to the app with income summaries, breakdowns by client and lesson type, visual charts, and tax-oriented reporting. The primary goal is to give coaches the data they need for Schedule C filing and quarterly estimated tax payments without needing external spreadsheets.

Eventually this section will also support business expense tracking (Phase 2), enabling coaches to calculate net profit and identify deductions.

The existing data model already captures `rate_at_booking` on lessons, `amount_owed` and `payment_status` on lesson participants, and invoices with `amount_due` and `paid_at`. This feature surfaces that data through reporting and analytics.

---

## Requirements

### 1. Financials Page & Navigation

**User Story:** As a coach, I want a dedicated Financials section in my app so that I can view all my income data in one place.

#### Acceptance Criteria
1. WHEN a coach navigates to `/financials` THEN the system SHALL display a financial overview page with income summaries and charts.
2. WHEN the dashboard loads THEN the system SHALL display a "Financials" card in the overview card grid (alongside Outstanding Lessons, Clients, Lesson Types) that links to `/financials`. The existing Statistics section on the dashboard SHALL be removed (its "Outstanding Payments" data moves to the Financials page).
3. WHEN the coach is not authenticated THEN the system SHALL redirect to the login page.

---

### 2. Income Summary Cards

**User Story:** As a coach, I want to see high-level income numbers at a glance so that I can quickly understand my financial position.

#### Acceptance Criteria
1. WHEN the Financials page loads THEN the system SHALL display summary cards showing:
   - **Total Income (Year-to-Date):** Sum of all `amount_owed` where `payment_status = 'Paid'` for the current calendar year.
   - **Total Income (Selected Month):** Same calculation scoped to the selected month.
   - **Outstanding Balance:** Sum of all `amount_owed` where `payment_status = 'Pending'` or `'Overdue'`.
   - **Lessons This Month:** Count of lessons in the selected month (any status except Cancelled).
   - **Hours Coached This Month:** Total duration of lessons in the selected month (calculated from `start_time` and `end_time`).
2. WHEN a coach changes the selected month THEN the system SHALL update all month-scoped cards to reflect the new month.
3. IF no income data exists for the selected period THEN the system SHALL display $0.00 / 0 with an empty-state message.

---

### 3. Monthly Income Chart

**User Story:** As a coach, I want to see a chart of my monthly income over time so that I can identify trends in my business.

#### Acceptance Criteria
1. WHEN the Financials page loads THEN the system SHALL display a bar chart showing monthly income (paid amounts) for the current calendar year.
2. WHEN the coach selects a different year THEN the system SHALL update the chart to show that year's monthly data.
3. WHEN the coach taps/hovers on a bar THEN the system SHALL display the exact dollar amount for that month.
4. IF a month has no income THEN the system SHALL display a bar with $0 height.

---

### 4. Income by Client Breakdown

**User Story:** As a coach, I want to see how much income each client has generated so that I can understand my revenue distribution.

#### Acceptance Criteria
1. WHEN the coach views the client income breakdown THEN the system SHALL display a list/table of clients sorted by total paid amount (descending) for the selected time period.
2. WHEN displaying each client row THEN the system SHALL show:
   - Client name
   - Number of lessons
   - Total time coached (hours and minutes)
   - Total amount paid
   - Outstanding balance for that client
3. WHEN the coach selects a different time period (month or year) THEN the system SHALL update the client breakdown accordingly.
4. WHEN the coach taps on a client row THEN the system SHALL navigate to that client's detail page.

---

### 5. Income by Lesson Type Breakdown

**User Story:** As a coach, I want to see income grouped by lesson type so that I can understand which services are most profitable.

#### Acceptance Criteria
1. WHEN the coach views the lesson type breakdown THEN the system SHALL display a list/table of lesson types sorted by total paid amount (descending) for the selected time period.
2. WHEN displaying each lesson type row THEN the system SHALL show:
   - Lesson type name (with color indicator)
   - Number of lessons
   - Total time coached (hours and minutes)
   - Total income (paid)
   - Average rate per lesson
3. WHEN the coach selects a different time period THEN the system SHALL update the breakdown accordingly.
4. IF a lesson has no associated lesson type THEN the system SHALL group it under "Uncategorized."

---

### 6. Tax Summary

**User Story:** As a coach, I want a yearly tax summary so that I can easily prepare my Schedule C and estimate quarterly tax payments.

#### Acceptance Criteria
1. WHEN the coach views the tax summary THEN the system SHALL display:
   - **Total Gross Income:** Sum of all paid amounts for the selected tax year.
   - **Quarterly Breakdown:** Income totals for Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec) with estimated tax payment deadlines (Apr 15, Jun 15, Sep 15, Jan 15).
   - **Total Lessons Given:** Count of completed lessons for the year.
   - **Total Hours Coached:** Sum of lesson durations for the year.
   - **Total Unique Clients Served:** Count of distinct clients with at least one completed lesson.
2. WHEN the coach selects a different year THEN the system SHALL update the tax summary accordingly.
3. WHEN the coach clicks "Export for Tax Preparer" THEN the system SHALL download a CSV file containing a row-by-row breakdown of all paid lessons for the selected year with columns: Date, Client Name, Lesson Type, Duration (hours), Amount Paid, Payment Status. This allows coaches to share their income records with an accountant or CPA for Schedule C preparation.

---

### 7. Time Period Selection

**User Story:** As a coach, I want to filter my financial data by different time periods so that I can analyze specific ranges.

#### Acceptance Criteria
1. WHEN the Financials page loads THEN the system SHALL default to showing the current month and current year.
2. WHEN the coach changes the month selector THEN the system SHALL update all month-scoped data (monthly income card, lessons/hours cards, breakdowns).
3. WHEN the coach changes the year selector THEN the system SHALL update all year-scoped data (YTD income, monthly chart, tax summary).
4. The system SHALL allow selecting any month/year combination back to the coach's account creation date.

---

### 8. Business Expense Tracking

**User Story:** As a coach, I want to track business expenses so that I can deduct them during tax preparation and calculate my net profit.

#### Acceptance Criteria
1. WHEN the Financials page loads THEN the system SHALL display an "Income" / "Expenses" tab toggle at the top of the page. The Income tab shows the existing income sections (Requirements 2-5). The Expenses tab shows expense management.
2. WHEN the coach views the Expenses tab THEN the system SHALL display a list of recorded expenses for the selected time period, sorted by date descending.
3. WHEN displaying each expense row THEN the system SHALL show: date, category (with color indicator), description, and amount. On mobile, expenses SHALL display as compact cards.
4. WHEN the coach taps "+ Add Expense" THEN the system SHALL display a form capturing:
   - **Date** (required, defaults to today)
   - **Amount** (required, positive number, USD)
   - **Category** (required, select from pre-defined list):
     - Equipment & Supplies
     - Professional Development
     - Technology & Software
     - Transportation
     - Facility & Venue Rental
     - Insurance
     - Marketing & Advertising
     - Other
   - **Description** (required, free text — serves as the business purpose record for IRS compliance)
   - **Receipt Reference** (optional, free text — e.g., "Amazon order #123", "Chase statement 1/15")
   - **Recurring** (optional checkbox — marks the expense as a monthly recurring cost for reference only; does not auto-generate future entries)
5. WHEN the coach taps on an existing expense THEN the system SHALL allow editing or deleting the expense.
6. WHEN the coach changes the month or year selector THEN the system SHALL update the expense list to show only expenses within the selected time period.
7. IF no expenses exist for the selected period THEN the system SHALL display an empty-state message encouraging the coach to add their first expense.

---

### 9. Expense Category Breakdown

**User Story:** As a coach, I want to see my expenses grouped by category so that I can understand where my money goes and identify deductions for Schedule C.

#### Acceptance Criteria
1. WHEN the coach views the Expenses tab THEN the system SHALL display a category breakdown card showing total spent per category for the selected year, sorted by amount descending.
2. WHEN displaying each category THEN the system SHALL show: category name (with color indicator), number of expenses, and total amount.
3. WHEN the coach changes the year THEN the system SHALL update the category breakdown accordingly.

---

### 10. Mileage Tracking

**User Story:** As a coach who travels to clients, I want to log my business mileage so that I can claim the IRS standard mileage deduction on my taxes.

#### Acceptance Criteria
1. WHEN the coach taps "+ Add Mileage" on the Expenses tab THEN the system SHALL display a mileage entry form capturing:
   - **Date** (required, defaults to today)
   - **Miles Driven** (required, positive number)
   - **Purpose / Destination** (required, free text — e.g., "Lesson at Smith residence", "Tournament at City Park")
2. WHEN the coach submits a mileage entry THEN the system SHALL automatically calculate the deduction amount using the IRS standard mileage rate ($0.70/mile for 2026) and save it as an expense under the "Transportation" category.
3. WHEN displaying a mileage-created expense in the expense list THEN the system SHALL show the miles driven and auto-calculated amount (e.g., "32 mi — $22.40").
4. WHEN the coach views the Tax Summary THEN the system SHALL display a mileage summary showing: total miles driven for the year and total mileage deduction amount.

---

### 11. Updated Tax Summary with Expenses

**User Story:** As a coach, I want my tax summary to include both income and expenses so that I can see my net profit for Schedule C filing.

#### Acceptance Criteria
1. WHEN the coach views the tax summary and expenses exist for the selected year THEN the system SHALL display:
   - **Total Gross Income** (unchanged from Requirement 6)
   - **Total Expenses:** Sum of all expenses for the selected year
   - **Net Profit:** Gross income minus total expenses (Schedule C Line 31)
   - **Expense Category Breakdown:** Totals per category aligned with Schedule C line items
   - **Mileage Summary:** Total miles driven and deduction amount for the year
2. WHEN the coach clicks "Export for Tax Preparer" THEN the system SHALL download a CSV containing both income rows AND expense rows. Expense rows SHALL include columns: Date, Category, Description, Amount, Receipt Reference. The CSV SHALL clearly separate the income and expense sections.
3. IF no expenses exist THEN the tax summary SHALL show $0 for expenses and net profit SHALL equal gross income (existing behavior preserved).

---

### 9. Mobile Responsiveness

**User Story:** As a coach, I want the financial reports to work well on my phone so that I can check my numbers on the go.

#### Acceptance Criteria
1. WHEN viewing the Financials page on mobile THEN the system SHALL stack summary cards vertically and make charts horizontally scrollable or responsive.
2. WHEN viewing breakdowns on mobile THEN the system SHALL display a compact card layout instead of wide tables.
3. WHEN interacting with charts on mobile THEN the system SHALL support tap interactions (not just hover).

---

## Constraints & Considerations

- **Data source:** All income calculations derive from `lesson_participants.amount_owed` and `payment_status`, joined with lessons for dates and types. For lessons without participants (legacy data), fall back to `rate_at_booking` on the lesson itself.
- **Currency:** All amounts displayed in USD. No multi-currency support needed.
- **Performance:** Financial queries may span large date ranges. Consider server-side aggregation rather than fetching all raw records to the client.
- **Privacy:** Financial data is coach-specific. RLS policies already enforce this at the database level.
- **Security:** A dedicated PIN/passcode for the Financials section was considered but rejected. The app already requires authentication (Supabase auth), and device-level security (phone lock, Face ID/Touch ID) provides adequate protection. Adding a second auth layer would create friction for a frequently-accessed section without meaningful security gain. If this becomes a user request, it can be revisited.
- **Chart library:** Use a lightweight, React-compatible charting library (e.g., Recharts) to keep bundle size manageable.
- **Navigation placement:** Financials is accessed via a card on the Dashboard (the coach's main hub), keeping the nav bar and mobile tab bar unchanged. The existing Statistics section on the dashboard is removed since its data (outstanding payments) will live in the Financials page.
- **Phase 2 scope:** Expense tracking requires a new `expenses` database table and migration but should not block Phase 1 delivery. The expense categories should align with IRS Schedule C line items for easy tax prep.
