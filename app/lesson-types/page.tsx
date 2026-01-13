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
    if (rateNum < 0 || rateNum > 999) {
      setError('Hourly rate must be between 0 and 999');
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-800">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Lesson Types</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Create, edit, and organize offerings</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              Add Lesson Type
            </button>
          </div>
          {error && (
            <div className="mb-4 text-error-600 dark:text-error-400">{error}</div>
          )}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md">
            {loading ? (
              <div className="p-6 text-neutral-700 dark:text-neutral-300">Loading...</div>
            ) : types.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Icon */}
                  <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-6">
                    <svg className="w-16 h-16 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>

                  {/* Message */}
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                      No Lesson Types Yet
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 max-w-md mb-4">
                      Lesson types help you organize your services and track earnings. Each type appears on your calendar in a unique color.
                    </p>

                    {/* Examples */}
                    <div className="text-left bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Examples to get started:</p>
                      <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <li className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded" style={{backgroundColor: '#3B82F6'}}></span>
                          Private Session - $50/hr
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded" style={{backgroundColor: '#10B981'}}></span>
                          Group Training - $30/hr
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded" style={{backgroundColor: '#8B5CF6'}}></span>
                          Evaluation - $0/hr
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={openCreateModal}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    Create Your First Lesson Type
                  </button>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {types.map((t) => (
                  (() => {
                    const displayName = t.name.replace(/\s*\{client_names\}/gi, '').trim();
                    return (
                  <li key={t.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: t.color }}></span>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">{displayName || t.name}</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">${Number(t.hourly_rate)}/hr</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="text-primary-600 dark:text-primary-400 hover:underline"
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
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Add Lesson Type</h2>
              <button
                type="button"
                onClick={() => !saving && setIsModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-white"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                  placeholder="e.g., Private Session, Group Training"
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  What you call this service
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Hourly Rate</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200">$</span>
                  <input
                    aria-label="Hourly rate"
                    type="number"
                    min={0}
                    max={999}
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Your rate for this service
                </p>
                {Number(hourlyRate) === 0 && hourlyRate !== '' && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 rounded px-2 py-1.5">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Free sessions are great for evaluations, trials, or community outreach</span>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-20 h-10 p-0 border rounded cursor-pointer"
                    disabled={saving}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Calendar preview</label>
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded p-2 bg-white dark:bg-neutral-900">
                    <div
                      className="px-2 py-1 rounded text-white text-xs font-medium"
                      style={{backgroundColor: color}}
                    >
                      {name ? (
                        <>
                          <span className="italic">Client Name</span> - {name}
                        </>
                      ) : (
                        'Your Lesson Type'
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Delete confirmation */}
              {showDeleteConfirm && editingId && (
                <div className="mb-4 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                  <p className="text-error-800 dark:text-error-200 font-medium mb-3">
                    Are you sure you want to delete this lesson type? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-error-600 text-white hover:bg-error-700 disabled:opacity-70"
                    >
                      {saving ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
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
                      className="px-4 py-2 rounded-lg text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => !saving && setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || showDeleteConfirm}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-70"
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
