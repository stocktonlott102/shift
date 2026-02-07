'use client';

import type { Expense } from '@/lib/types/expense';
import { EXPENSE_CATEGORY_COLORS } from '@/lib/constants/expense-categories';

interface ExpenseListProps {
  expenses: Expense[];
  monthName: string;
  onEditExpense: (expense: Expense) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMileageAmount(expense: Expense): string {
  if (expense.isMileage && expense.milesDriven) {
    return `${expense.milesDriven} mi — $${expense.amount.toFixed(2)}`;
  }
  return `$${expense.amount.toFixed(2)}`;
}

export default function ExpenseList({ expenses, monthName, onEditExpense }: ExpenseListProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Expenses — {monthName}
      </h2>

      {expenses.length === 0 ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
          No expenses recorded for {monthName}. Tap &ldquo;+ Add Expense&rdquo; to get started.
        </p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 pr-3 font-medium text-neutral-500 dark:text-neutral-400">Date</th>
                  <th className="text-left py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">Category</th>
                  <th className="text-left py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">Description</th>
                  <th className="text-right py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">Amount</th>
                  <th className="text-left py-2 pl-2 font-medium text-neutral-500 dark:text-neutral-400">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    onClick={() => onEditExpense(exp)}
                    className="border-b border-neutral-100 dark:border-neutral-700/50 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                  >
                    <td className="py-2.5 pr-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[exp.category] || '#9CA3AF' }}
                        />
                        <span className="text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          {exp.category}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-neutral-700 dark:text-neutral-300 max-w-[200px] truncate">
                      {exp.description}
                      {exp.isRecurring && (
                        <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">(recurring)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                      {formatMileageAmount(exp)}
                    </td>
                    <td className="py-2.5 pl-2 text-neutral-400 dark:text-neutral-500 max-w-[120px] truncate text-xs">
                      {exp.receiptReference || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                onClick={() => onEditExpense(exp)}
                className="bg-neutral-50 dark:bg-neutral-700/30 rounded-lg p-3 cursor-pointer active:bg-neutral-100 dark:active:bg-neutral-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[exp.category] || '#9CA3AF' }}
                    />
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {exp.category}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    {formatDate(exp.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-900 dark:text-white truncate mr-3">
                    {exp.description}
                    {exp.isRecurring && (
                      <span className="ml-1 text-xs text-neutral-400 dark:text-neutral-500">(recurring)</span>
                    )}
                  </p>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                    {formatMileageAmount(exp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
