'use client';

import type { TaxSummary as TaxSummaryType, LessonExportRow } from '@/lib/types/financial';
import type { ExpenseData } from '@/lib/types/expense';
import { EXPENSE_CATEGORY_COLORS } from '@/lib/constants/expense-categories';

interface TaxSummaryProps {
  data: TaxSummaryType | null;
  lessonDetails: LessonExportRow[];
  expenseData: ExpenseData | null;
  year: number;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function exportTaxCSV(lessonDetails: LessonExportRow[], expenseData: ExpenseData | null, year: number) {
  const paidLessons = lessonDetails.filter((d) => d.paymentStatus === 'Paid');
  const expenses = expenseData?.expenses || [];

  if (paidLessons.length === 0 && expenses.length === 0) {
    alert(`No income or expense data to export for ${year}.`);
    return;
  }

  const sections: string[] = [];

  // Income section
  if (paidLessons.length > 0) {
    const incomeHeaders = ['Date', 'Client Name', 'Lesson Type', 'Duration (hours)', 'Amount Paid', 'Payment Status'];
    const incomeRows = paidLessons.map((d) => [
      d.date,
      `"${d.clientName}"`,
      `"${d.lessonType}"`,
      d.durationHours.toFixed(2),
      d.amountPaid.toFixed(2),
      d.paymentStatus,
    ]);
    sections.push('INCOME');
    sections.push(incomeHeaders.join(','));
    sections.push(...incomeRows.map((r) => r.join(',')));
  }

  // Expense section
  if (expenses.length > 0) {
    if (sections.length > 0) {
      sections.push(''); // blank row separator
    }
    const expenseHeaders = ['Date', 'Category', 'Description', 'Amount', 'Receipt Reference'];
    const expenseRows = expenses.map((exp) => [
      exp.date,
      `"${exp.category}"`,
      `"${exp.description}"`,
      exp.amount.toFixed(2),
      exp.receiptReference ? `"${exp.receiptReference}"` : '',
    ]);
    sections.push('EXPENSES');
    sections.push(expenseHeaders.join(','));
    sections.push(...expenseRows.map((r) => r.join(',')));
  }

  const csvContent = sections.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `shift-tax-summary-${year}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function TaxSummary({ data, lessonDetails, expenseData, year }: TaxSummaryProps) {
  if (!data && !expenseData) {
    return null;
  }

  const grossIncome = data?.grossIncome || 0;
  const totalExpenses = expenseData?.totalExpenses || 0;
  const netProfit = grossIncome - totalExpenses;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Tax Summary &mdash; {year}
        </h2>
        <button
          onClick={() => exportTaxCSV(lessonDetails, expenseData, year)}
          className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Export for Tax Preparer
        </button>
      </div>

      {/* Gross Income */}
      {data && (
        <div className="mb-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Gross Income</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            ${grossIncome.toFixed(2)}
          </p>
        </div>
      )}

      {/* Total Expenses + Net Profit */}
      {totalExpenses > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalExpenses.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Net Profit <span className="text-xs">(Schedule C Line 31)</span>
            </p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {netProfit < 0 ? '-' : ''}${Math.abs(netProfit).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Quarterly Breakdown */}
      {data && (
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
      )}

      {/* Expense Category Breakdown */}
      {expenseData && expenseData.categoryBreakdown.length > 0 && (
        <div className="mb-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            Expense Categories
          </h3>
          <div className="space-y-2">
            {expenseData.categoryBreakdown
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[cat.category] || '#9CA3AF' }}
                    />
                    <span className="text-neutral-700 dark:text-neutral-300">{cat.category}</span>
                  </div>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    ${cat.totalAmount.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mileage Summary */}
      {expenseData && expenseData.totalMilesDriven > 0 && (
        <div className="mb-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Mileage Deduction
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Miles Driven</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {expenseData.totalMilesDriven.toFixed(0)} mi
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Mileage Deduction</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ${expenseData.totalMileageDeduction.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {data && (
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
      )}
    </div>
  );
}
