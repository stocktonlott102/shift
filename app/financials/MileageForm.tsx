'use client';

import { useState, FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createExpense } from '@/app/actions/expense-actions';
import { IRS_MILEAGE_RATE } from '@/lib/constants/expense-categories';

interface MileageFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MileageForm({ onSuccess, onCancel }: MileageFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [miles, setMiles] = useState('');
  const [purpose, setPurpose] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedMiles = parseFloat(miles) || 0;
  const deduction = Math.round(parsedMiles * IRS_MILEAGE_RATE * 100) / 100;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!date || parsedMiles <= 0 || !purpose.trim()) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const result = await createExpense({
      date: dateStr,
      amount: deduction,
      category: 'Transportation',
      description: purpose.trim(),
      receipt_reference: null,
      is_recurring: false,
      is_mileage: true,
      miles_driven: parsedMiles,
    });

    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || 'Failed to add mileage entry.');
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-lg my-auto">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Add Mileage
            </h2>
            <button
              onClick={onCancel}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={date}
                onChange={(d: Date | null) => d && setDate(d)}
                dateFormat="MM/dd/yyyy"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Miles Driven */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Miles Driven <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {parsedMiles > 0 && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Deduction: ${deduction.toFixed(2)} ({parsedMiles} mi &times; ${IRS_MILEAGE_RATE.toFixed(2)})
                </p>
              )}
            </div>

            {/* Purpose / Destination */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Purpose / Destination <span className="text-red-500">*</span>
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="e.g., Lesson at Smith residence, Tournament at City Park"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Add Mileage
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
