import { useState, useEffect } from 'react';
import {
  Activity,
  Pill,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { getActivityLog } from '../data/caregiverStore';
import type { ActivityEvent, ActivityEventKind } from '../data/caregiverStore';

// ── Kind config ────────────────────────────────────────────────────────────────

const KIND_CFG: Record<
  ActivityEventKind,
  { label: string; Icon: React.FC<{ className?: string }>; dot: string; border: string }
> = {
  med_taken: {
    label: 'Medication taken',
    Icon: Pill,
    dot:    'bg-success-500',
    border: 'border-success-200',
  },
  med_skipped: {
    label: 'Medication unmarked',
    Icon: AlertCircle,
    dot:    'bg-warm-500',
    border: 'border-warm-200',
  },
  schedule_done: {
    label: 'Task completed',
    Icon: CheckCircle2,
    dot:    'bg-calm-500',
    border: 'border-calm-200',
  },
  check_in: {
    label: 'Checked in',
    Icon: UserCheck,
    dot:    'bg-success-500',
    border: 'border-success-200',
  },
};

// ── Time helpers ───────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function groupByDay(events: ActivityEvent[]): [string, ActivityEvent[]][] {
  const groups: Record<string, ActivityEvent[]> = {};
  for (const e of events) {
    const key = new Date(e.timestamp).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return Object.entries(groups);
}

// ── Event row ──────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: ActivityEvent }) {
  const { label, Icon, dot, border } = KIND_CFG[event.kind];
  return (
    <li
      className={`flex items-start gap-4 py-4 border-b border-neutral-100 last:border-b-0`}
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0 mt-1">
        <span
          className={`w-3 h-3 rounded-full ${dot} ring-2 ring-white`}
          aria-hidden="true"
        />
      </div>

      {/* Icon badge */}
      <span
        className={`flex-shrink-0 w-9 h-9 rounded-lg border-2 ${border} bg-white flex items-center justify-center`}
        aria-hidden="true"
      >
        <Icon className="w-4 h-4 text-neutral-600" />
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-neutral-800 leading-tight text-sm">
          {event.label}
        </p>
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mt-0.5">
          {label}
        </p>
      </div>

      {/* Time */}
      <time
        dateTime={event.timestamp}
        className="text-sm font-semibold text-neutral-500 tabular-nums flex-shrink-0"
      >
        {formatTimestamp(event.timestamp)}
      </time>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityLog() {
  const [log, setLog] = useState<ActivityEvent[]>(getActivityLog);

  function refresh() {
    setLog(getActivityLog());
  }

  // Refresh on window focus
  useEffect(() => {
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const grouped = groupByDay(log);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 leading-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-calm-600" aria-hidden="true" />
            Activity log
          </h1>
          <p className="mt-1 text-lg text-neutral-500">
            Margaret's recent actions — medications taken, check-ins, and tasks
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 text-sm font-semibold text-calm-700 bg-calm-50 border-2 border-calm-300 rounded-lg px-4 py-2 min-h-[2.75rem] hover:bg-calm-100 hover:border-calm-400 transition-colors"
          aria-label="Refresh activity log"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap gap-3"
        role="list"
        aria-label="Activity type legend"
      >
        {(Object.entries(KIND_CFG) as [ActivityEventKind, typeof KIND_CFG[ActivityEventKind]][]).map(
          ([, { label, dot }]) => (
            <span
              key={label}
              role="listitem"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 bg-white border-2 border-neutral-200 rounded-pill px-3 py-1"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} aria-hidden="true" />
              {label}
            </span>
          )
        )}
      </div>

      {/* ── Log ───────────────────────────────────────────────────────────── */}
      {log.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-neutral-300 shadow-card p-12 text-center">
          <Info className="w-10 h-10 text-neutral-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-xl font-semibold text-neutral-700">No activity yet</p>
          <p className="text-neutral-500 mt-2 text-base">
            Events will appear here when Margaret takes medications, completes tasks, or checks in.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
          {grouped.map(([dateKey, events]) => (
            <section key={dateKey} aria-label={`Activity for ${formatDateGroup(events[0].timestamp)}`}>
              <h2 className="text-base font-bold text-neutral-500 uppercase tracking-widest mb-3 pb-2 border-b-2 border-neutral-200">
                {formatDateGroup(events[0].timestamp)}
                <span className="ml-2 text-sm font-semibold text-neutral-400 normal-case tracking-normal">
                  — {events.length} event{events.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <div className="bg-white rounded-xl border-2 border-neutral-300 shadow-card px-4">
                <ul
                  className="list-none p-0 m-0"
                  role="list"
                  aria-label={`Events for ${formatDateGroup(events[0].timestamp)}`}
                >
                  {events.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
}
