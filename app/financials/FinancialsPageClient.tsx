'use client';

import { useState, useMemo } from 'react';
import { getFinancialSummary } from '@/app/actions/financial-actions';
import MonthlyIncomeChart from './MonthlyIncomeChart';
import ClientBreakdown from './ClientBreakdown';
import LessonTypeBreakdown from './LessonTypeBreakdown';
import TaxSummary from './TaxSummary';
import type { FinancialData } from '@/lib/types/financial';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface FinancialsPageClientProps {
  initialData: FinancialData | null;
  initialYear: number;
  initialMonth: number;
  initialError: string | null;
}

export default function FinancialsPageClient({
  initialData,
  initialYear,
  initialMonth,
  initialError,
}: FinancialsPageClientProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(initialData);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  // Year options: current year back to 5 years ago
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Get month-scoped data from the year data
  const monthData = useMemo(() => {
    if (!financialData) return null;
    return financialData.monthlyIncome[selectedMonth] || null;
  }, [financialData, selectedMonth]);

  // Filter client breakdown by selected month
  const monthClientBreakdown = useMemo(() => {
    if (!financialData) return [];
    // Re-derive from lessonDetails for the selected month
    const monthDetails = financialData.lessonDetails.filter((d) => {
      const date = new Date(d.date);
      return date.getMonth() === selectedMonth;
    });

    const map = new Map<string, { clientName: string; lessonCount: number; hoursCoached: number; totalPaid: number; outstandingBalance: number }>();
    for (const d of monthDetails) {
      if (!map.has(d.clientName)) {
        map.set(d.clientName, { clientName: d.clientName, lessonCount: 0, hoursCoached: 0, totalPaid: 0, outstandingBalance: 0 });
      }
      const entry = map.get(d.clientName)!;
      entry.lessonCount++;
      entry.hoursCoached += d.durationHours;
      if (d.paymentStatus === 'Paid') {
        entry.totalPaid += d.amountPaid;
      } else {
        entry.outstandingBalance += d.amountPaid || 0;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [financialData, selectedMonth]);

  // YTD income: sum of all paid months up to current month in year
  const ytdIncome = useMemo(() => {
    if (!financialData) return 0;
    return financialData.monthlyIncome.reduce((sum, m) => sum + m.totalPaid, 0);
  }, [financialData]);

  const handleYearChange = async (year: number) => {
    setSelectedYear(year);
    setIsLoading(true);
    setError(null);

    try {
      const result = await getFinancialSummary(year);
      if (result.success && result.data) {
        setFinancialData(result.data);
      } else {
        setError(result.error || 'Failed to load financial data.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  if (error && !financialData) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
            Error Loading Financials
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => handleYearChange(selectedYear)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              Financials
            </h1>

            {/* Time Period Selectors */}
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">Loading financial data...</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* YTD Income */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              YTD Income
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              ${ytdIncome.toFixed(2)}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{selectedYear}</p>
          </div>

          {/* Monthly Income */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              {MONTH_NAMES[selectedMonth]} Income
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
              ${(monthData?.totalPaid || 0).toFixed(2)}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Paid</p>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Outstanding
            </p>
            <p className={`text-2xl font-bold mt-1 ${(financialData?.outstandingBalance || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white'}`}>
              ${(financialData?.outstandingBalance || 0).toFixed(2)}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">All time</p>
          </div>

          {/* Lessons This Month */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Lessons
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
              {monthData?.lessonCount || 0}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{MONTH_NAMES[selectedMonth]}</p>
          </div>

          {/* Hours Coached This Month */}
          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Hours Coached
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
              {(monthData?.hoursCoached || 0).toFixed(1)}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{MONTH_NAMES[selectedMonth]}</p>
          </div>
        </div>

        {/* Monthly Income Chart */}
        <MonthlyIncomeChart
          data={financialData?.monthlyIncome || []}
          year={selectedYear}
        />

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientBreakdown
            data={financialData?.clientBreakdown || []}
            month={selectedMonth}
            monthName={MONTH_NAMES[selectedMonth]}
          />
          <LessonTypeBreakdown
            data={financialData?.lessonTypeBreakdown || []}
          />
        </div>

        {/* Tax Summary */}
        <TaxSummary
          data={financialData?.taxSummary || null}
          lessonDetails={financialData?.lessonDetails || []}
          year={selectedYear}
        />
      </main>
    </div>
  );
}
