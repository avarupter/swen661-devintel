import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  PlusCircle,
  type LucideIcon,
} from 'lucide-react';
import { caregiverNotes as initialNotes } from '../data/mockData';
import { useAuth } from '../auth/AuthContext';
import { useApp } from '../context/AppContext';
import type { CaregiverNote, Priority } from '../types';

const NOTES_STORAGE_KEY = 'careconnect_caregiver_notes';

const priorityConfig: Record<
  Priority,
  { label: string; badgeClass: string; Icon: LucideIcon }
> = {
  low: { label: 'Routine', badgeClass: 'badge-neutral', Icon: Info },
  medium: { label: 'Note', badgeClass: 'badge-warning', Icon: AlertCircle },
  high: { label: 'Urgent', badgeClass: 'badge-alert', Icon: AlertTriangle },
};

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function groupByDate(notes: CaregiverNote[]) {
  const groups: Record<string, CaregiverNote[]> = {};

  for (const note of notes) {
    if (!groups[note.date]) groups[note.date] = [];
    groups[note.date].push(note);
  }

  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function loadNotes(): CaregiverNote[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return initialNotes;

    const stored = JSON.parse(raw) as CaregiverNote[];
    return Array.isArray(stored) ? stored : initialNotes;
  } catch {
    return initialNotes;
  }
}

export default function Caregiver() {
  const { user } = useAuth();
  const { patient } = useApp();

  const [notes, setNotes] = useState<CaregiverNote[]>(loadNotes);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftPriority, setDraftPriority] = useState<Priority>('low');

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const signedInName = user?.name?.trim();
    if (!signedInName) return;

    setNotes((current) => {
      let changed = false;

      const corrected = current.map((note) => {
        const userCreatedNote = /^n\d{10,}$/.test(note.id);

        if (userCreatedNote && note.author === 'Joyce Adeyemi') {
          changed = true;
          return { ...note, author: signedInName };
        }

        return note;
      });

      return changed ? corrected : current;
    });
  }, [user?.name]);

  function addNote() {
    if (!draft.trim()) return;

    const newNote: CaregiverNote = {
      id: `n${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: user?.name?.trim() || 'Caregiver',
      note: draft.trim(),
      priority: draftPriority,
    };

    setNotes((previous) => [newNote, ...previous]);
    setDraft('');
    setDraftPriority('low');
    setComposing(false);
  }

  const grouped = groupByDate(notes);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-calm-600" aria-hidden="true" />
            Caregiver Notes
          </h1>
          <p className="text-neutral-500 mt-1">
            Daily observations for {patient.name}&apos;s care team
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposing((value) => !value)}
          className="btn-primary text-sm px-4 py-2 min-h-0 h-11 flex-shrink-0"
          aria-expanded={composing}
          aria-controls="note-compose"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Add note
        </button>
      </div>

      {composing && (
        <section
          id="note-compose"
          aria-label="Add a new caregiver note"
          className="card border-calm-200 bg-calm-50 space-y-4"
        >
          <h2 className="font-semibold text-neutral-800">New note</h2>

          <p className="text-sm text-neutral-600">
            This note will be saved as <strong>{user?.name || 'Caregiver'}</strong>.
          </p>

          <fieldset>
            <legend className="text-sm font-medium text-neutral-600 mb-2">
              Priority
            </legend>
            <div className="flex gap-2 flex-wrap" role="group">
              {(
                Object.entries(priorityConfig) as [
                  Priority,
                  (typeof priorityConfig)[Priority],
                ][]
              ).map(([key, { label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraftPriority(key)}
                  className={`btn text-sm px-4 py-2 min-h-0 h-10 ${
                    draftPriority === key ? 'btn-primary' : 'btn-secondary'
                  }`}
                  aria-pressed={draftPriority === key}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="note-text"
              className="text-sm font-medium text-neutral-600 block mb-1.5"
            >
              Note
            </label>
            <textarea
              id="note-text"
              rows={4}
              className="w-full rounded-lg border-2 border-neutral-300 px-4 py-3 text-base text-neutral-800 placeholder:text-neutral-400 focus:border-calm-600 focus:outline-none transition-colors resize-none"
              placeholder="Describe any observations, concerns, or updates…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-required="true"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={addNote}
              className="btn-primary"
              disabled={!draft.trim()}
              aria-disabled={!draft.trim()}
            >
              Save note
            </button>
            <button
              type="button"
              onClick={() => setComposing(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

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
                  const displayedNote = note.note.replace(/\bDorothy\b/g, patient.name);

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
                                .map((name) => name[0])
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

                        <p className="text-neutral-700 leading-relaxed">{displayedNote}</p>
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
