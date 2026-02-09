'use client';

import Link from 'next/link';
import type { ClientIncome } from '@/lib/types/financial';

interface ClientBreakdownProps {
  data: ClientIncome[];
  month: number;
  monthName: string;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function ClientBreakdown({ data, monthName }: ClientBreakdownProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Income by Client
      </h2>

      {data.length === 0 ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          No client data for this period.
        </p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 pr-3 font-medium text-neutral-500 dark:text-neutral-400">Client</th>
                  <th className="text-right py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">Lessons</th>
                  <th className="text-right py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">Hours</th>
                  <th className="text-right py-2 pl-2 font-medium text-neutral-500 dark:text-neutral-400">Paid</th>
                </tr>
              </thead>
              <tbody>
                {data.map((client) => (
                  <tr
                    key={client.clientId}
                    className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/clients/${client.clientId}`}
                        className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        {client.clientName}
                      </Link>
                    </td>
                    <td className="text-right py-2.5 px-2 text-neutral-700 dark:text-neutral-300">{client.lessonCount}</td>
                    <td className="text-right py-2.5 px-2 text-neutral-700 dark:text-neutral-300">{formatHours(client.hoursCoached)}</td>
                    <td className="text-right py-2.5 pl-2 text-green-600 dark:text-green-400 font-medium">${client.totalPaid.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {data.map((client) => (
              <Link
                key={client.clientId}
                href={`/clients/${client.clientId}`}
                className="block bg-neutral-50 dark:bg-neutral-700/30 rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <p className="font-medium text-neutral-900 dark:text-white mb-1">{client.clientName}</p>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{client.lessonCount} lessons</span>
                  <span>{formatHours(client.hoursCoached)}</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">${client.totalPaid.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
