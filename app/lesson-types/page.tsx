'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import {
  createLessonType,
  updateLessonType,
  deleteLessonType,
  getLessonTypes,
} from '@/app/actions/lesson-type-actions';
import type { LessonType } from '@/lib/types/lesson-type';

export default function LessonTypesPage() {
  const [types, setTypes] = useState<LessonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [color, setColor] = useState('#3B82F6');

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getLessonTypes();
        if (result.success && result.data) {
          setTypes(result.data);
        } else {
          setError(result.error || 'Failed to load lesson types');
        }
      } catch (e: any) {
        setError(e.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setName('');
    setHourlyRate('');
    setColor('#3B82F6');
    setShowDeleteConfirm(false);
    setIsModalOpen(true);
  }

  function openEditModal(t: LessonType) {
    setEditingId(t.id);
    setName(t.name);
    setHourlyRate(String(t.hourly_rate));
    setColor(t.color);
    setShowDeleteConfirm(false);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !hourlyRate) {
      setError('Name and hourly rate are required');
      return;
    }
    const rateNum = Number(hourlyRate);
    if (rateNum <= 0 || rateNum > 999) {
      setError('Hourly rate must be between 1 and 999');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      let result;
      if (editingId) {
        result = await updateLessonType(editingId, {
          name: name.trim(),
          hourly_rate: rateNum,
          color,
        });
      } else {
        result = await createLessonType({
          name: name.trim(),
          hourly_rate: rateNum,
          color,
        });
      }

      if (!result.success) {
        setError(result.error || 'Failed to save lesson type');
        setSaving(false);
        return;
      }

      if (result.data) {
        if (editingId) {
          setTypes((prev) =>
            prev
              .map((t) => (t.id === editingId ? result.data! : t))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        } else {
          setTypes((prev) =>
            [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      }

      setName('');
      setHourlyRate('');
      setColor('#3B82F6');
      setEditingId(null);
      setIsModalOpen(false);
    } catch (e: any) {
      setError(e.message || 'Unexpected error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const result = await deleteLessonType(editingId);
      if (!result.success) {
        setError(result.error || 'Failed to delete lesson type');
        setSaving(false);
        return;
      }
      setTypes((prev) => prev.filter((t) => t.id !== editingId));
      setIsModalOpen(false);
      setShowDeleteConfirm(false);
      setEditingId(null);
    } catch (e: any) {
      setError(e.message || 'Unexpected error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Lesson Types</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create, edit, and organize offerings</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Add Lesson Type
            </button>
          </div>
          {error && (
            <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {loading ? (
              <div className="p-6 text-gray-700 dark:text-gray-300">Loading...</div>
            ) : types.length === 0 ? (
              <div className="p-6 text-gray-700 dark:text-gray-300">No lesson types yet. Create one to get started.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {types.map((t) => (
                  (() => {
                    const displayName = t.name.replace(/\s*\{client_names\}/gi, '').trim();
                    return (
                  <li key={t.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: t.color }}></span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{displayName || t.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">${Number(t.hourly_rate)}/hr</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Edit
                    </button>
                    </li>
                    );
                  })()
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setIsModalOpen(false)}></div>
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Lesson Type</h2>
              <button
                type="button"
                onClick={() => !saving && setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  disabled={saving}
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
                    disabled={saving}
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
                  disabled={saving}
                />
              </div>
              {/* Delete confirmation */}
              {showDeleteConfirm && editingId && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 font-medium mb-3">
                    Are you sure you want to delete this lesson type? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-70"
                    >
                      {saving ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <div>
                  {editingId && !showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => !saving && setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || showDeleteConfirm}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
