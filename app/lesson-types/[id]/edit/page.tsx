'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLessonTypeById, updateLessonType, deleteLessonType } from '@/app/actions/lesson-type-actions';
import { LESSON_TYPE_CONSTRAINTS } from '@/lib/types/lesson-type';

export default function EditLessonTypePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(60);
  const [color, setColor] = useState<string>(LESSON_TYPE_CONSTRAINTS.DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const res = await getLessonTypeById(id);
      if (!res.success || !res.data) {
        setError(res.error || 'Not found');
      } else {
        const t = res.data;
        setName(t.name);
        setHourlyRate(t.hourly_rate);
        setColor(t.color);
      }
      setLoading(false);
    })();
  }, [id]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    const res = await updateLessonType(id, {
      name,
      hourly_rate: hourlyRate,
      color,
    });
    if (!res.success) {
      setError(res.error || 'Update failed');
      return;
    }
    router.push('/lesson-types');
  };

  const onDelete = async () => {
    if (!id) return;
    const res = await deleteLessonType(id);
    if (res.success) router.push('/lesson-types');
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Lesson Type</h1>
      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} maxLength={LESSON_TYPE_CONSTRAINTS.NAME_MAX_LENGTH} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hourly Rate (USD)</label>
          <input type="number" step="0.01" min={LESSON_TYPE_CONSTRAINTS.MIN_HOURLY_RATE} max={LESSON_TYPE_CONSTRAINTS.MAX_HOURLY_RATE} className="w-full border rounded px-3 py-2" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <input type="color" className="w-16 h-10 p-0 border rounded" value={color} onChange={e => setColor(e.target.value)} />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
          <button type="button" onClick={onDelete} className="border border-red-600 text-red-600 px-4 py-2 rounded">Delete</button>
        </div>
      </form>
    </div>
  );
}
