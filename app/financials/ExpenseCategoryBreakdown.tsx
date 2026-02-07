'use client';

import type { CategoryBreakdown } from '@/lib/types/expense';

interface ExpenseCategoryBreakdownProps {
  data: CategoryBreakdown[];
  year: number;
}

export default function ExpenseCategoryBreakdown({ data, year }: ExpenseCategoryBreakdownProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Expenses by Category — {year}
      </h2>

      {data.length === 0 ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          No expense data for this year.
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((cat) => (
            <div
              key={cat.category}
              className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700/50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {cat.category}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                  ({cat.expenseCount})
                </span>
              </div>
              <span className="text-sm font-medium text-neutral-900 dark:text-white ml-3 flex-shrink-0">
                ${cat.totalAmount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
