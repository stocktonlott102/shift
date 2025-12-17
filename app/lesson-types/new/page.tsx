'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import Navigation from '@/components/Navigation';

export default function NewLessonTypePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }
      if (!name.trim() || !hourlyRate) {
        setError('Name and hourly rate are required');
        setLoading(false);
        return;
      }
      const rateNum = Number(hourlyRate);
      if (rateNum <= 0 || rateNum > 999) {
        setError('Hourly rate must be between 1 and 999');
        setLoading(false);
        return;
      }
      const { error: insertError } = await supabase.from('lesson_types').insert({
        coach_id: user.id,
        name: name.trim(),
        hourly_rate: rateNum,
        color,
        is_active: true,
      });
      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
      router.push('/lesson-types');
    } catch (e: any) {
      setError(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">New Lesson Type</h1>
          {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Hourly Rate</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">$</span>
                <input
                  aria-label="Hourly rate"
                  type="number"
                  min={1}
                  max={999}
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 p-0 border rounded"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {loading ? 'Saving...' : 'Create Type'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
