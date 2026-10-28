import { useState } from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Info, PlusCircle, type LucideIcon } from 'lucide-react';
import { caregiverNotes as initialNotes } from '../data/mockData';
import type { CaregiverNote, Priority } from '../types';

const priorityConfig: Record<
  Priority,
  { label: string; badgeClass: string; Icon: LucideIcon }
> = {
  low:    { label: 'Routine',  badgeClass: 'badge-neutral',  Icon: Info },
  medium: { label: 'Note',     badgeClass: 'badge-warning',  Icon: AlertCircle },
  high:   { label: 'Urgent',   badgeClass: 'badge-alert',    Icon: AlertTriangle },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Group notes by date
function groupByDate(notes: CaregiverNote[]) {
  const groups: Record<string, CaregiverNote[]> = {};
  for (const note of notes) {
    if (!groups[note.date]) groups[note.date] = [];
    groups[note.date].push(note);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function Caregiver() {
  const [notes, setNotes] = useState<CaregiverNote[]>(initialNotes);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftPriority, setDraftPriority] = useState<Priority>('low');

  function addNote() {
    if (!draft.trim()) return;
    const newNote: CaregiverNote = {
      id: `n${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: 'Joyce Adeyemi',
      note: draft.trim(),
      priority: draftPriority,
    };
    setNotes((prev) => [newNote, ...prev]);
    setDraft('');
    setDraftPriority('low');
    setComposing(false);
  }

  const grouped = groupByDate(notes);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-calm-600" aria-hidden="true" />
            Caregiver Notes
          </h1>
          <p className="text-neutral-500 mt-1">Daily observations for Dorothy's care team</p>
        </div>
        <button
          onClick={() => setComposing((v) => !v)}
          className="btn-primary text-sm px-4 py-2 min-h-0 h-11 flex-shrink-0"
          aria-expanded={composing}
          aria-controls="note-compose"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Add note
        </button>
      </div>

      {/* ── Compose area ─────────────────────────────────────────────────── */}
      {composing && (
        <section
          id="note-compose"
          aria-label="Add a new caregiver note"
          className="card border-calm-200 bg-calm-50 space-y-4"
        >
          <h2 className="font-semibold text-neutral-800">New note</h2>

          {/* Priority selector */}
          <fieldset>
            <legend className="text-sm font-medium text-neutral-600 mb-2">Priority</legend>
            <div className="flex gap-2 flex-wrap" role="group">
              {(Object.entries(priorityConfig) as [Priority, typeof priorityConfig[Priority]][]).map(
                ([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setDraftPriority(key)}
                    className={`btn text-sm px-4 py-2 min-h-0 h-10 ${
                      draftPriority === key ? 'btn-primary' : 'btn-secondary'
                    }`}
                    aria-pressed={draftPriority === key}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </fieldset>

          {/* Text area */}
          <div>
            <label htmlFor="note-text" className="text-sm font-medium text-neutral-600 block mb-1.5">
              Note
            </label>
            <textarea
              id="note-text"
              rows={4}
              className="w-full rounded-lg border-2 border-neutral-300 px-4 py-3 text-base text-neutral-800 placeholder:text-neutral-400 focus:border-calm-600 focus:outline-none transition-colors resize-none"
              placeholder="Describe any observations, concerns, or updates…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-required="true"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={addNote}
              className="btn-primary"
              disabled={!draft.trim()}
              aria-disabled={!draft.trim()}
            >
              Save note
            </button>
            <button onClick={() => setComposing(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* ── Notes list ───────────────────────────────────────────────────── */}
      {grouped.length === 0 ? (
        <div className="card text-center py-14 text-neutral-500">
          <p className="text-lg font-medium">No notes yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
          {grouped.map(([date, dayNotes]) => (
            <section key={date} aria-label={`Notes for ${formatDate(date)}`}>
              <h2 className="text-base font-semibold text-neutral-500 uppercase tracking-wide mb-3 border-b border-neutral-200 pb-2">
                {formatDate(date)}
              </h2>
              <ul className="space-y-3 list-none p-0 m-0" role="list">
                {dayNotes.map((note) => {
                  const { label, badgeClass, Icon } = priorityConfig[note.priority];
                  return (
                    <li key={note.id}>
                      <article
                        className="card p-5 space-y-3"
                        aria-label={`${label} note from ${note.author}`}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700 flex-shrink-0"
                              aria-hidden="true"
                            >
                              {note.author
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                            <span className="font-semibold text-neutral-700 text-sm">
                              {note.author}
                            </span>
                          </div>
                          <span className={`badge text-xs ${badgeClass}`}>
                            <Icon className="w-3 h-3" aria-hidden="true" />
                            {label}
                          </span>
                        </div>
                        <p className="text-neutral-700 leading-relaxed">{note.note}</p>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
