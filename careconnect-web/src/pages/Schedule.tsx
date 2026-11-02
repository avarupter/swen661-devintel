import { useState } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { scheduleItems as initialItems } from '../data/mockData';
import type { ScheduleItem } from '../types';

const categoryLabel: Record<ScheduleItem['category'], string> = {
  meal: 'Meal',
  medication: 'Medicine',
  activity: 'Activity',
  appointment: 'Appointment',
  rest: 'Rest',
};

const categoryColour: Record<ScheduleItem['category'], string> = {
  meal:        'bg-warm-100 text-warm-700',
  medication:  'bg-calm-100 text-calm-700',
  activity:    'bg-success-100 text-success-700',
  appointment: 'bg-neutral-200 text-neutral-700',
  rest:        'bg-neutral-100 text-neutral-600',
};

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function Schedule() {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  function toggleDone(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">My Day</h1>
        <p className="text-neutral-500 mt-1 text-base">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
      </div>

      {/* ── Progress ────────────────────────────────────────────────────── */}
      <section aria-label="Day progress">
        <div className="card p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-neutral-700">
                {doneCount} of {items.length} tasks complete
              </span>
              <span className="text-sm font-bold text-calm-700">{progress}%</span>
            </div>
            <div
              className="h-3 bg-neutral-200 rounded-pill overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress}% of today's tasks complete`}
            >
              <div
                className="h-full bg-calm-600 rounded-pill transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Schedule list ───────────────────────────────────────────────── */}
      <section aria-label="Today's schedule">
        <h2 className="sr-only">Today's schedule</h2>
        <ol className="space-y-3 list-none p-0 m-0" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <article
                className={`card card-hover flex items-start gap-4 p-4 transition-opacity duration-200 ${
                  item.done ? 'opacity-60' : ''
                }`}
                aria-label={`${formatTime(item.time)}: ${item.label}${item.done ? ' — done' : ''}`}
              >
                {/* Time */}
                <time
                  dateTime={item.time}
                  className="text-calm-700 font-semibold tabular-nums text-sm w-14 flex-shrink-0 pt-0.5"
                >
                  {formatTime(item.time)}
                </time>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`font-semibold text-base leading-tight ${
                        item.done ? 'line-through text-neutral-400' : 'text-neutral-800'
                      }`}
                    >
                      {item.label}
                    </p>
                    <span className={`badge text-xs ${categoryColour[item.category]}`}>
                      {categoryLabel[item.category]}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-neutral-500 mt-1">{item.description}</p>
                  )}
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => toggleDone(item.id)}
                  className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-neutral-100 focus-visible:bg-neutral-100"
                  aria-label={item.done ? `Mark "${item.label}" as not done` : `Mark "${item.label}" as done`}
                  aria-pressed={item.done}
                >
                  {item.done ? (
                    <CheckCircle2 className="w-7 h-7 text-success-600" aria-hidden="true" />
                  ) : (
                    <Circle className="w-7 h-7 text-neutral-300" aria-hidden="true" />
                  )}
                </button>
              </article>
            </li>
          ))}
        </ol>
      </section>

      {/* ── All done state ────────────────────────────────────────────────── */}
      {doneCount === items.length && (
        <div
          role="status"
          aria-live="polite"
          className="card text-center py-10 border-success-200 bg-success-50"
        >
          <CheckCircle2 className="w-12 h-12 text-success-600 mx-auto mb-3" aria-hidden="true" />
          <p className="text-xl font-bold text-success-700">Wonderful job today!</p>
          <p className="text-neutral-600 mt-1">Every task is complete. Enjoy your evening.</p>
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <section aria-label="Category legend">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Category key
        </h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryLabel) as ScheduleItem['category'][]).map((cat) => (
            <span key={cat} className={`badge ${categoryColour[cat]}`}>
              {categoryLabel[cat]}
            </span>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <Clock className="w-4 h-4" aria-hidden="true" />
        <span>Tap the circle to mark a task done</span>
      </div>
    </div>
  );
}
