import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquareText,
  Pill,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { getMedications } from '../data/medsStore';
import { appendActivityEvent } from '../data/caregiverStore';
import type { Medication } from '../types';

const TODAY = new Date().toISOString().split('T')[0];

const LS_MEDS_KEY = 'careconnect_meds_taken';
const LS_NOTES_KEY = 'careconnect_medication_notes';
const LS_FEEDBACK_KEY = 'careconnect_medication_feedback';

const FEEDBACK_CHOICES = [
  'Feel better',
  'No change',
  'Could not sleep well',
  'Loss of appetite',
  'Felt tired',
  'Other concern',
] as const;

type MedicationStatus =
  | 'taken'
  | 'upcoming'
  | 'dueSoon'
  | 'overdue';

type NotesMap = Record<string, string>;
type FeedbackMap = Record<string, string[]>;

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadTakenFromStorage(): Record<string, boolean> {
  return loadStored<Record<string, boolean>>(
    LS_MEDS_KEY,
    {},
  );
}

function saveTakenToStorage(
  takenMap: Record<string, boolean>,
) {
  saveStored(LS_MEDS_KEY, takenMap);
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';

  return `${h % 12 || 12}:${String(m).padStart(
    2,
    '0',
  )} ${suffix}`;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time
    .split(':')
    .map(Number);

  return hours * 60 + minutes;
}

function getCurrentMinutes(): number {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
}

function getMedicationStatus(
  medication: Medication,
  taken: boolean,
  nowMinutes: number,
): MedicationStatus {
  if (taken) {
    return 'taken';
  }

  const doseTimes = medication.times
    .map(toMinutes)
    .sort((a, b) => a - b);

  if (doseTimes.length === 0) {
    return 'dueSoon';
  }

  const firstDose = doseTimes[0];
  const lastDose =
    doseTimes[doseTimes.length - 1];

  if (nowMinutes < firstDose - 60) {
    return 'upcoming';
  }

  if (nowMinutes <= lastDose + 30) {
    return 'dueSoon';
  }

  return 'overdue';
}

const STATUS_CONFIG: Record<
  MedicationStatus,
  {
    label: string;
    className: string;
    Icon: LucideIcon;
  }
> = {
  taken: {
    label: 'Taken',
    className:
      'bg-success-100 text-success-700 border-success-200',
    Icon: CheckCircle2,
  },

  upcoming: {
    label: 'Upcoming',
    className:
      'bg-calm-100 text-calm-700 border-calm-200',
    Icon: Clock,
  },

  dueSoon: {
    label: 'Due soon',
    className:
      'bg-warm-100 text-warm-700 border-warm-300',
    Icon: Clock,
  },

  overdue: {
    label: 'Overdue',
    className:
      'bg-alert-100 text-alert-700 border-alert-300',
    Icon: AlertCircle,
  },
};

export default function Medications() {
  const [meds, setMeds] =
    useState<Medication[]>(() => {
      const stored =
        loadTakenFromStorage();

      return getMedications().map(
        (medication) => ({
          ...medication,

          taken: {
            ...medication.taken,

            ...(stored[
              medication.id
            ] !== undefined
              ? {
                  [TODAY]:
                    stored[
                      medication.id
                    ],
                }
              : {}),
          },
        }),
      );
    });

  const [notes, setNotes] =
    useState<NotesMap>(() =>
      loadStored<NotesMap>(
        LS_NOTES_KEY,
        {},
      ),
    );

  const [feedback, setFeedback] =
    useState<FeedbackMap>(() =>
      loadStored<FeedbackMap>(
        LS_FEEDBACK_KEY,
        {},
      ),
    );

  const [nowMinutes, setNowMinutes] =
    useState(getCurrentMinutes);

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setNowMinutes(
          getCurrentMinutes(),
        );
      },
      60_000,
    );

    return () =>
      window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const takenMap: Record<
      string,
      boolean
    > = {};

    meds.forEach((medication) => {
      if (
        medication.taken[
          TODAY
        ] !== undefined
      ) {
        takenMap[medication.id] =
          medication.taken[TODAY];
      }
    });

    saveTakenToStorage(takenMap);
  }, [meds]);

  useEffect(() => {
    saveStored(
      LS_NOTES_KEY,
      notes,
    );
  }, [notes]);

  useEffect(() => {
    saveStored(
      LS_FEEDBACK_KEY,
      feedback,
    );
  }, [feedback]);

  function toggleTaken(id: string) {
    setMeds((previous) => {
      const updated =
        previous.map(
          (medication) =>
            medication.id === id
              ? {
                  ...medication,

                  taken: {
                    ...medication.taken,

                    [TODAY]:
                      !medication
                        .taken[
                        TODAY
                      ],
                  },
                }
              : medication,
        );

      const medication =
        updated.find(
          (item) =>
            item.id === id,
        );

      if (medication) {
        appendActivityEvent({
          kind: medication
            .taken[TODAY]
            ? 'med_taken'
            : 'med_skipped',

          label: medication
            .taken[TODAY]
            ? `Marked ${medication.name} as taken`
            : `Unmarked ${medication.name} (not taken)`,

          timestamp:
            new Date().toISOString(),
        });
      }

      return updated;
    });
  }

  function updateNote(
    id: string,
    value: string,
  ) {
    setNotes((previous) => ({
      ...previous,
      [id]: value,
    }));
  }

  function toggleFeedback(
    id: string,
    choice: string,
  ) {
    setFeedback(
      (previous) => {
        const current =
          previous[id] ?? [];

        const selected =
          current.includes(choice);

        return {
          ...previous,

          [id]: selected
            ? current.filter(
                (item) =>
                  item !== choice,
              )
            : [
                ...current,
                choice,
              ],
        };
      },
    );
  }

  const takenCount =
    meds.filter(
      (medication) =>
        medication.taken[TODAY],
    ).length;

  const pendingCount =
    meds.length - takenCount;

  const overdueCount =
    meds.filter(
      (medication) => {
        const taken =
          medication.taken[
            TODAY
          ] ?? false;

        return (
          getMedicationStatus(
            medication,
            taken,
            nowMinutes,
          ) === 'overdue'
        );
      },
    ).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          Medicines
        </h1>

        <p className="text-neutral-500 mt-1">
          Today's medication tracker
        </p>
      </div>

      {pendingCount > 0 ? (
        <div
          role="status"
          aria-live="polite"
          className={`card flex items-center gap-3 p-4 ${
            overdueCount > 0
              ? 'border-alert-300 bg-alert-50'
              : 'border-warm-300 bg-warm-50'
          }`}
        >
          <AlertCircle
            className={`w-6 h-6 flex-shrink-0 ${
              overdueCount > 0
                ? 'text-alert-600'
                : 'text-warm-600'
            }`}
            aria-hidden="true"
          />

          <p
            className={
              overdueCount > 0
                ? 'text-alert-700 font-medium'
                : 'text-warm-700 font-medium'
            }
          >
            {pendingCount}{' '}
            medicine
            {pendingCount > 1
              ? 's'
              : ''}{' '}
            still to take today.

            {overdueCount > 0
              ? ` ${overdueCount} ${
                  overdueCount === 1
                    ? 'is'
                    : 'are'
                } overdue.`
              : ''}
          </p>
        </div>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="card border-success-200 bg-success-50 flex items-center gap-3 p-4"
        >
          <CheckCircle2
            className="w-6 h-6 text-success-600 flex-shrink-0"
            aria-hidden="true"
          />

          <p className="text-success-700 font-medium">
            All medicines taken
            for today. Well done!
          </p>
        </div>
      )}

      <section aria-label="Medication list">
        <h2 className="sr-only">
          Medication list
        </h2>

        <ul
          className="space-y-5 list-none p-0 m-0"
          role="list"
        >
          {meds.map(
            (medication) => {
              const taken =
                medication.taken[
                  TODAY
                ] ?? false;

              const status =
                getMedicationStatus(
                  medication,
                  taken,
                  nowMinutes,
                );

              const statusConfig =
                STATUS_CONFIG[
                  status
                ];

              const StatusIcon =
                statusConfig.Icon;

              const selectedFeedback =
                feedback[
                  medication.id
                ] ?? [];

              return (
                <li
                  key={
                    medication.id
                  }
                >
                  <article
                    className={`card card-hover p-5 space-y-5 ${
                      status ===
                      'overdue'
                        ? 'border-alert-300'
                        : status ===
                            'taken'
                          ? 'border-success-200'
                          : ''
                    }`}
                    aria-label={`${medication.name}, ${medication.dosage}, status: ${statusConfig.label}`}
                  >
                    <div className="flex items-start gap-4">

                      <div
                        className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${medication.colour}`}
                        aria-hidden="true"
                      >
                        <Pill className="w-6 h-6 text-neutral-600" />
                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="flex items-start justify-between gap-3 flex-wrap">

                          <div>
                            <p
                              className={`font-bold text-lg leading-tight ${
                                taken
                                  ? 'text-success-700'
                                  : 'text-neutral-800'
                              }`}
                            >
                              {
                                medication.name
                              }
                            </p>

                            <p className="text-neutral-600 text-sm mt-0.5">
                              {
                                medication.dosage
                              }
                            </p>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm font-bold ${statusConfig.className}`}
                          >
                            <StatusIcon
                              className="w-4 h-4"
                              aria-hidden="true"
                            />

                            {
                              statusConfig.label
                            }
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {medication.times.map(
                            (
                              time,
                            ) => (
                              <span
                                key={
                                  time
                                }
                                className="badge badge-calm text-xs"
                              >
                                {formatTime(
                                  time,
                                )}
                              </span>
                            ),
                          )}
                        </div>

                        {medication.instructions && (
                          <p className="text-sm text-neutral-500 mt-3">
                            {
                              medication.instructions
                            }
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleTaken(
                            medication.id,
                          )
                        }
                        className={`flex-shrink-0 min-w-[2.75rem] min-h-[2.75rem] flex items-center justify-center rounded-full border-2 transition-colors ${
                          taken
                            ? 'border-success-500 bg-success-50'
                            : 'border-neutral-300 bg-white hover:bg-neutral-50'
                        }`}
                        aria-label={
                          taken
                            ? `Mark ${medication.name} as not taken`
                            : `Mark ${medication.name} as taken`
                        }
                        aria-pressed={
                          taken
                        }
                      >
                        {taken ? (
                          <CheckCircle2
                            className="w-7 h-7 text-success-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="w-7 h-7 text-neutral-500"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </div>

                    <div className="border-t border-neutral-200 pt-4 space-y-3">

                      <div className="flex items-center gap-2">
                        <MessageSquareText
                          className="w-5 h-5 text-calm-600"
                          aria-hidden="true"
                        />

                        <h3 className="font-semibold text-neutral-800">
                          How are you
                          feeling?
                        </h3>
                      </div>

                      <div
                        role="group"
                        aria-label={`Feedback after taking ${medication.name}`}
                        className="flex flex-wrap gap-2"
                      >
                        {FEEDBACK_CHOICES.map(
                          (
                            choice,
                          ) => {
                            const selected =
                              selectedFeedback.includes(
                                choice,
                              );

                            return (
                              <button
                                key={
                                  choice
                                }
                                type="button"
                                onClick={() =>
                                  toggleFeedback(
                                    medication.id,
                                    choice,
                                  )
                                }
                                aria-pressed={
                                  selected
                                }
                                className={`rounded-lg border-2 px-3 py-2 min-h-[2.75rem] text-sm font-medium transition-colors ${
                                  selected
                                    ? 'bg-calm-100 border-calm-600 text-calm-700'
                                    : 'bg-white border-neutral-300 text-neutral-700 hover:border-calm-400'
                                }`}
                              >
                                {
                                  choice
                                }
                              </button>
                            );
                          },
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={`med-note-${medication.id}`}
                          className="block text-sm font-semibold text-neutral-700 mb-1.5"
                        >
                          Notes for
                          caregiver
                        </label>

                        <textarea
                          id={`med-note-${medication.id}`}
                          value={
                            notes[
                              medication.id
                            ] ?? ''
                          }
                          onChange={(
                            event,
                          ) =>
                            updateNote(
                              medication.id,
                              event
                                .target
                                .value,
                            )
                          }
                          rows={3}
                          placeholder="Add an optional note about how you feel or anything your caregiver should know."
                          className="w-full rounded-lg border-2 border-neutral-300 px-3 py-2 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
                        />

                        <p className="mt-1 text-xs text-neutral-500">
                          Notes and
                          feedback are
                          saved
                          automatically
                          on this
                          device.
                        </p>
                      </div>
                    </div>
                  </article>
                </li>
              );
            },
          )}
        </ul>
      </section>

      <p className="text-sm text-neutral-500 text-center">
        Always take medicines as
        prescribed by your doctor.
        If you are unsure about a
        medicine, contact your
        caregiver, pharmacist, or
        doctor.
      </p>
    </div>
  );
}