'use client';

import type { TaxSummary as TaxSummaryType, LessonExportRow } from '@/lib/types/financial';

interface TaxSummaryProps {
  data: TaxSummaryType | null;
  lessonDetails: LessonExportRow[];
  year: number;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function exportTaxCSV(lessonDetails: LessonExportRow[], year: number) {
  const paidLessons = lessonDetails.filter((d) => d.paymentStatus === 'Paid');

  if (paidLessons.length === 0) {
    alert(`No paid lessons to export for ${year}.`);
    return;
  }

  const headers = ['Date', 'Client Name', 'Lesson Type', 'Duration (hours)', 'Amount Paid', 'Payment Status'];
  const rows = paidLessons.map((d) => [
    d.date,
    `"${d.clientName}"`,
    `"${d.lessonType}"`,
    d.durationHours.toFixed(2),
    d.amountPaid.toFixed(2),
    d.paymentStatus,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `shift-income-${year}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function TaxSummary({ data, lessonDetails, year }: TaxSummaryProps) {
  if (!data) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Tax Summary — {year}
        </h2>
        <button
          onClick={() => exportTaxCSV(lessonDetails, year)}
          className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Export for Tax Preparer
        </button>
      </div>

      {/* Gross Income */}
      <div className="mb-6">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Gross Income</p>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
          ${data.grossIncome.toFixed(2)}
        </p>
      </div>

      {/* Quarterly Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {data.quarterlyBreakdown.map((q) => (
          <div
            key={q.quarter}
            className="bg-neutral-50 dark:bg-neutral-700/30 rounded-lg p-3"
          >
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{q.label}</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
              ${q.income.toFixed(2)}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Due: {q.deadline}
            </p>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Lessons</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{data.totalLessons}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Hours Coached</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{formatHours(data.totalHoursCoached)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Unique Clients</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white">{data.uniqueClientsServed}</p>
        </div>
      </div>
    </div>
  );
}
