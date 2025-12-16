'use client';

import { useState, useEffect, useMemo } from 'react';
import { LessonHistoryEntry } from '@/lib/types/lesson-history';
import { markLessonAsPaid, markAllLessonsPaid } from '@/app/actions/lesson-history-actions';

interface LessonHistoryTableProps {
  lessons: LessonHistoryEntry[];
  unpaidBalance: number;
  clientId: string;
  onRefresh?: () => void;
}

type PaymentStatusFilter = 'All' | 'Pending' | 'Paid' | 'Overdue';
type SortField = 'date' | 'status' | 'amount';
type SortOrder = 'asc' | 'desc';

export default function LessonHistoryTable({
  lessons,
  unpaidBalance,
  clientId,
  onRefresh,
}: LessonHistoryTableProps) {
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter lessons based on payment status
  const filteredLessons = useMemo(() => {
    if (paymentFilter === 'All') {
      return lessons;
    }
    return lessons.filter((lesson) => lesson.paymentStatus === paymentFilter);
  }, [lessons, paymentFilter]);

  // Sort filtered lessons
  const sortedLessons = useMemo(() => {
    const sorted = [...filteredLessons];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          break;
        case 'status':
          comparison = a.paymentStatus.localeCompare(b.paymentStatus);
          break;
        case 'amount':
          comparison = a.rate - b.rate;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredLessons, sortField, sortOrder]);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Count pending lessons for bulk action
  const pendingCount = useMemo(() => {
    return lessons.filter((l) => l.paymentStatus === 'Pending').length;
  }, [lessons]);

  // Handle marking single lesson as paid
  const handleMarkPaid = async (lessonId: string) => {
    setActionLoading(lessonId);
    setError(null);
    setSuccessMessage(null);

    const result = await markLessonAsPaid(lessonId);

    if (result.success) {
      setSuccessMessage(result.message || 'Lesson marked as paid');
      onRefresh?.();
    } else {
      setError(result.error || 'Failed to mark lesson as paid');
    }

    setActionLoading(null);
  };

  // Handle bulk payment confirmation
  const handleBulkPayment = async () => {
    setBulkActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await markAllLessonsPaid(clientId);

    if (result.success) {
      setSuccessMessage(result.message || `${result.data?.count} lessons marked as paid`);
      setShowBulkConfirm(false);
      onRefresh?.();
    } else {
      setError(result.error || 'Failed to update payment status');
    }

    setBulkActionLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getLessonStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'No Show':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Canceled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Canceled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (lessons.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Lesson History
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Confirmed lessons will appear here once they have been completed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Lesson History
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {lessons.length} total lesson{lessons.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Balance</p>
              <p
                className={`text-2xl font-bold ${
                  unpaidBalance > 0
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {formatCurrency(unpaidBalance)}
              </p>
            </div>
            {unpaidBalance > 0 && (
              <button
                onClick={() => setShowBulkConfirm(true)}
                disabled={pendingCount === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Mark All Paid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Sort Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter:
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentStatusFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="All">All Lessons</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="date">Date</option>
              <option value="status">Payment Status</option>
              <option value="amount">Amount</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Lessons Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Lesson Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedLessons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No lessons match the selected filter
                  </td>
                </tr>
              ) : (
                sortedLessons.map((lesson) => (
                  <tr
                    key={lesson.lessonId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(lesson.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(lesson.startTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {lesson.serviceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {lesson.duration.toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(lesson.rate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLessonStatusColor(
                          lesson.lessonStatus
                        )}`}
                      >
                        {lesson.lessonStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lesson.lessonStatus === 'Completed' ? (
                        <>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                              lesson.paymentStatus
                            )}`}
                          >
                            {lesson.paymentStatus}
                          </span>
                          {lesson.paidAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Paid: {formatDate(lesson.paidAt)}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                          Not applicable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-2">
                        {lesson.lessonStatus === 'Completed' && lesson.paymentStatus === 'Pending' && (
                          <button
                            onClick={() => handleMarkPaid(lesson.lessonId)}
                            disabled={actionLoading === lesson.lessonId}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium px-3 py-1 rounded transition-colors disabled:cursor-not-allowed text-xs"
                          >
                            {actionLoading === lesson.lessonId ? 'Updating...' : 'Mark Paid'}
                          </button>
                        )}
                        <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Payment Confirmation Dialog */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Bulk Payment
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              You are about to mark <span className="font-bold">{pendingCount}</span> lesson
              {pendingCount !== 1 ? 's' : ''} as paid.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Total amount: <span className="font-bold text-lg">{formatCurrency(unpaidBalance)}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBulkPayment}
                disabled={bulkActionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {bulkActionLoading ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowBulkConfirm(false)}
                disabled={bulkActionLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
