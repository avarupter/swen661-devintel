import { useMemo } from 'react';
import CaregiverDashboard from './CaregiverDashboard';
import { getMessages } from '../data/messagesStore';

interface StoredDone { ids?: string[]; }
interface MealDetail { food?: string; notes?: string; }
interface StoredMealDetails { details?: Record<string, MealDetail>; }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function CaregiverEnhanced() {
  const summary = useMemo(() => {
    const outgoingMessages = getMessages().filter((message) => message.direction === 'outgoing').slice(-5).reverse();
    const done = readJson<StoredDone>('careconnect_schedule_done', { ids: [] });
    const mealDetails = readJson<StoredMealDetails>('careconnect_meal_details', { details: {} });
    const medicationNotes = readJson<Record<string, string>>('careconnect_medication_notes', {});
    const medicationFeedback = readJson<Record<string, string[]>>('careconnect_medication_feedback', {});

    const mealNotes = Object.entries(mealDetails.details ?? {}).map(([meal, detail]) => {
      const parts = [detail.food, detail.notes].filter(Boolean);
      return parts.length > 0 ? `${meal}: ${parts.join(' — ')}` : '';
    }).filter(Boolean);

    const medNotes = Object.entries(medicationNotes).map(([medication, note]) => note.trim() ? `${medication}: ${note.trim()}` : '').filter(Boolean);
    const medFeedback = Object.entries(medicationFeedback).map(([medication, feedback]) => feedback.length > 0 ? `${medication}: ${feedback.join(', ')}` : '').filter(Boolean);

    return { outgoingMessages, completedCount: done.ids?.length ?? 0, notes: [...mealNotes, ...medNotes, ...medFeedback].slice(0, 8) };
  }, []);

  return (
    <div className="space-y-6">
      <section className="card border-2 border-calm-200">
        <h2 className="text-xl font-bold text-neutral-800">Patient Daily Summary</h2>
        <p className="mt-2 text-neutral-600">My Day items completed: <strong>{summary.completedCount}</strong></p>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="text-xl font-bold text-neutral-800">Recent patient messages</h2>
          {summary.outgoingMessages.length > 0 ? <ul className="space-y-3 mt-4">{summary.outgoingMessages.map((message) => <li key={message.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"><p className="font-medium text-neutral-800">{message.body}</p><p className="mt-1 text-xs text-neutral-500">{new Date(message.timestamp).toLocaleString()}</p></li>)}</ul> : <p className="mt-3 text-neutral-500">No patient messages yet.</p>}
        </section>

        <section className="card">
          <h2 className="text-xl font-bold text-neutral-800">Patient notes</h2>
          {summary.notes.length > 0 ? <ul className="space-y-3 mt-4">{summary.notes.map((note) => <li key={note} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">{note}</li>)}</ul> : <p className="mt-3 text-neutral-500">No patient notes yet.</p>}
        </section>
      </div>

      <CaregiverDashboard />
    </div>
  );
}
