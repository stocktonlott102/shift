'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import type { Client } from '@/lib/types/client';

type Props = {
  clients: Client[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export default function ClientMultiPicker({ clients, value, onChange, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedClients = useMemo(
    () => clients.filter((c) => selectedSet.has(c.id)),
    [clients, selectedSet]
  );
  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.athlete_name.toLowerCase().includes(q));
  }, [clients, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  function toggleClient(id: string) {
    if (disabled) return;
    const set = new Set(value);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    onChange(Array.from(set));
  }

  function removeClient(id: string) {
    if (disabled) return;
    const next = value.filter((v) => v !== id);
    onChange(next);
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Clients <span className="text-red-500">*</span>
      </label>

      {/* Selected chips */}
      <div className="min-h-[48px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 flex flex-wrap gap-2">
        {selectedClients.length === 0 ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">No clients selected</span>
        ) : (
          selectedClients.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
            >
              {c.athlete_name}
              <button
                type="button"
                aria-label={`Remove ${c.athlete_name}`}
                onClick={() => removeClient(c.id)}
                disabled={disabled}
                className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800"
              >
                ×
              </button>
            </span>
          ))
        )}

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          disabled={disabled}
          className="ml-auto text-sm px-2 py-1 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-800"
        >
          {isOpen ? 'Close' : 'Add clients'}
        </button>
      </div>

      {/* Selection panel */}
      {isOpen && (
        <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={disabled}
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No clients found</div>
            ) : (
              <ul role="listbox" aria-label="Clients" className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((c) => {
                  const checked = selectedSet.has(c.id);
                  return (
                    <li key={c.id} role="option" aria-selected={checked}>
                      <button
                        type="button"
                        onClick={() => toggleClient(c.id)}
                        disabled={disabled}
                        className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {c.athlete_name}
                          {c.hourly_rate ? (
                            <span className="ml-2 text-gray-500 dark:text-gray-400">${c.hourly_rate}/hr</span>
                          ) : null}
                        </span>
                        <span
                          className={
                            'ml-3 inline-block w-4 h-4 rounded border ' +
                            (checked
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-gray-400 dark:border-gray-500')
                          }
                        ></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
