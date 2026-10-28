import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Pill, AlertCircle } from 'lucide-react';
import { getMedications } from '../data/medsStore';
import { appendActivityEvent } from '../data/caregiverStore';
import type { Medication } from '../types';

const TODAY = new Date().toISOString().split('T')[0];

const LS_MEDS_KEY = 'careconnect_meds_taken';

function loadTakenFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_MEDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTakenToStorage(takenMap: Record<string, boolean>) {
  localStorage.setItem(LS_MEDS_KEY, JSON.stringify(takenMap));
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function Medications() {
  const [meds, setMeds] = useState<Medication[]>(() => {
    const stored = loadTakenFromStorage();
    return getMedications().map((m) => ({
      ...m,
      taken: {
        ...m.taken,
        ...(stored[m.id] !== undefined ? { [TODAY]: stored[m.id] } : {}),
      },
    }));
  });

  useEffect(() => {
    const takenMap: Record<string, boolean> = {};
    meds.forEach((m) => {
      if (m.taken[TODAY] !== undefined) takenMap[m.id] = m.taken[TODAY];
    });
    saveTakenToStorage(takenMap);
  }, [meds]);

  function toggleTaken(id: string) {
    setMeds((prev) => {
      const updated = prev.map((m) =>
        m.id === id
          ? { ...m, taken: { ...m.taken, [TODAY]: !m.taken[TODAY] } }
          : m
      );
      const med = updated.find((m) => m.id === id);
      if (med) {
        appendActivityEvent({
          kind: med.taken[TODAY] ? 'med_taken' : 'med_skipped',
          label: med.taken[TODAY]
            ? `Marked ${med.name} as taken`
            : `Unmarked ${med.name} (not taken)`,
          timestamp: new Date().toISOString(),
        });
      }
      return updated;
    });
  }

  const takenCount = meds.filter((m) => m.taken[TODAY]).length;
  const pendingCount = meds.length - takenCount;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Medicines</h1>
        <p className="text-neutral-500 mt-1">Today's medication tracker</p>
      </div>

      {/* ── Status summary ───────────────────────────────────────────────── */}
      {pendingCount > 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="card border-warm-300 bg-warm-50 flex items-center gap-3 p-4"
        >
          <AlertCircle className="w-6 h-6 text-warm-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-warm-800 font-medium">
            {pendingCount} medicine{pendingCount > 1 ? 's' : ''} still to take today.
          </p>
        </div>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="card border-success-200 bg-success-50 flex items-center gap-3 p-4"
        >
          <CheckCircle2 className="w-6 h-6 text-success-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-success-800 font-medium">
            All medicines taken for today. Well done!
          </p>
        </div>
      )}

      {/* ── Medication cards ─────────────────────────────────────────────── */}
      <section aria-label="Medication list">
        <h2 className="sr-only">Medication list</h2>
        <ul className="space-y-4 list-none p-0 m-0" role="list">
          {meds.map((med) => {
            const taken = med.taken[TODAY] ?? false;
            return (
              <li key={med.id}>
                <article
                  className={`card card-hover flex items-start gap-4 p-5 transition-opacity duration-200 ${taken ? 'opacity-60' : ''}`}
                  aria-label={`${med.name} ${med.dosage}${taken ? ' — taken' : ' — not yet taken'}`}
                >
                  {/* Pill colour swatch */}
                  <div
                    className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${med.colour}`}
                    aria-hidden="true"
                  >
                    <Pill className="w-6 h-6 text-neutral-600" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg leading-tight ${taken ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                      {med.name}
                    </p>
                    <p className="text-neutral-600 text-sm mt-0.5">{med.dosage}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {med.times.map((t) => (
                        <span key={t} className="badge badge-calm text-xs">
                          {formatTime(t)}
                        </span>
                      ))}
                    </div>
                    {med.instructions && (
                      <p className="text-sm text-neutral-500 mt-2 italic">
                        {med.instructions}
                      </p>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleTaken(med.id)}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-neutral-100"
                    aria-label={taken ? `Mark ${med.name} as not taken` : `Mark ${med.name} as taken`}
                    aria-pressed={taken}
                  >
                    {taken ? (
                      <CheckCircle2 className="w-7 h-7 text-success-600" aria-hidden="true" />
                    ) : (
                      <Circle className="w-7 h-7 text-neutral-300" aria-hidden="true" />
                    )}
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm text-neutral-400 text-center">
        Always take medicines as prescribed by your doctor. If unsure, ask your carer.
      </p>
    </div>
  );
}
