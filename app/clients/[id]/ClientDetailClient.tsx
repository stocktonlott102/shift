'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientForm from '@/components/ClientForm';
import LessonHistoryTable from '@/components/LessonHistoryTable';
import { deleteClient } from '@/app/actions/client-actions';
import { getLessonHistory, calculateUnpaidBalance } from '@/app/actions/lesson-history-actions';
import { Client } from '@/lib/types/client';
import { LessonHistoryEntry } from '@/lib/types/lesson-history';

interface ClientDetailClientProps {
  client: Client;
  coachId: string;
}

export default function ClientDetailClient({ client, coachId }: ClientDetailClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [lessonHistory, setLessonHistory] = useState<LessonHistoryEntry[]>([]);
  const [unpaidBalance, setUnpaidBalance] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const router = useRouter();

  // Fetch lesson history and unpaid balance on mount
  useEffect(() => {
    fetchLessonData();
  }, [client.id]);

  const fetchLessonData = async () => {
    setIsLoadingHistory(true);

    // Fetch lesson history
    const historyResult = await getLessonHistory(client.id);
    if (historyResult.success && historyResult.data) {
      setLessonHistory(historyResult.data);
    }

    // Fetch unpaid balance
    const balanceResult = await calculateUnpaidBalance(client.id);
    if (balanceResult.success && balanceResult.data) {
      setUnpaidBalance(balanceResult.data.balance);
    }

    setIsLoadingHistory(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteClient(client.id);

    if (!result.success) {
      setDeleteError(result.error || 'Failed to delete client.');
      setIsDeleting(false);
      return;
    }

    // Success - redirect to clients list
    router.push('/clients');
  };

  const handleEditSuccess = () => {
    setIsEditMode(false);
    router.refresh(); // Refresh to get updated data
  };

  if (isEditMode) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientForm
          coachId={coachId}
          client={client}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditMode(false)}
        />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Client Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header Section with Actions */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 sm:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {client.athlete_name}
              </h2>
              <p className="text-indigo-100 text-sm">
                Client since {new Date(client.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="px-6 py-6 sm:px-8 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Parent Email
              </label>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href={`mailto:${client.parent_email}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {client.parent_email}
                </a>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Parent Phone
              </label>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href={`tel:${client.parent_phone}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {client.parent_phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="px-6 py-6 sm:px-8 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Billing
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Hourly Rate
            </label>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              ${parseFloat(client.hourly_rate.toString()).toFixed(2)}
              <span className="text-lg text-gray-500 dark:text-gray-400 font-normal ml-2">
                / hour
              </span>
            </div>
          </div>
        </div>

        {/* Coach Notes */}
        <div className="px-6 py-6 sm:px-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Coach Notes
          </h3>
          {client.notes ? (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No notes added yet
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-6 sm:px-8 bg-gray-50 dark:bg-gray-700/30 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsEditMode(true)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            Edit Client
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex-1 sm:flex-none bg-white hover:bg-red-50 dark:bg-gray-700 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold py-3 px-6 rounded-lg border-2 border-red-600 dark:border-red-400 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Delete Client
          </button>
        </div>
      </div>

      {/* Lesson History Section */}
      <div className="mt-8">
        {isLoadingHistory ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading lesson history...</p>
          </div>
        ) : (
          <LessonHistoryTable
            lessons={lessonHistory}
            unpaidBalance={unpaidBalance}
            clientId={client.id}
            onRefresh={fetchLessonData}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete Client
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <span className="font-semibold">{client.athlete_name}</span>?
                  This will archive the client and they will no longer appear in your active clients list.
                </p>
                {deleteError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                    {deleteError}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteError(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
