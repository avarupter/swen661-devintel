import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pill,
  Calendar,
  PhoneCall,
  CheckCircle2,
  Clock,
  Activity,
  Moon,
  Utensils,
  Phone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BigActionTile, Banner, Card } from '../components';
import { scheduleItems } from '../data/mockData';
import { appendActivityEvent } from '../data/caregiverStore';
import type { ScheduleItem } from '../types';

// ── Time helpers ───────────────────────────────────────────────────────────────

const TODAY_DATE = new Date().toISOString().split('T')[0];
const LS_DONE_KEY    = 'careconnect_schedule_done';
const LS_CHECKIN_KEY = 'careconnect_checkin';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function currentTimeLabel(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Item status ────────────────────────────────────────────────────────────────

type ItemStatus = 'done' | 'now' | 'upcoming';

function computeStatus(item: ScheduleItem, nowMin: number): ItemStatus {
  if (item.done) return 'done';
  const delta = toMinutes(item.time) - nowMin;
  // "Now" = item is within the past 30 min or the next 60 min
  return delta >= -30 && delta <= 60 ? 'now' : 'upcoming';
}

// ── Category configs ───────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<ScheduleItem['category'], LucideIcon> = {
  medication:  Pill,
  meal:        Utensils,
  activity:    Activity,
  appointment: Phone,
  rest:        Moon,
};

const CATEGORY_LABEL: Record<ScheduleItem['category'], string> = {
  medication:  'Medicine',
  meal:        'Meal',
  activity:    'Activity',
  appointment: 'Appointment',
  rest:        'Rest time',
};

// Category icon theme for the large featured card
const ICON_THEME: Record<ScheduleItem['category'], { bg: string; fg: string }> = {
  medication:  { bg: 'bg-calm-100',    fg: 'text-calm-700' },
  meal:        { bg: 'bg-warm-100',    fg: 'text-warm-700' },
  activity:    { bg: 'bg-success-100', fg: 'text-success-700' },
  appointment: { bg: 'bg-calm-100',    fg: 'text-calm-700' },
  rest:        { bg: 'bg-neutral-100', fg: 'text-neutral-600' },
};

// Action button label per category
const ACTION_LABEL: Record<ScheduleItem['category'], string> = {
  medication:  'Mark as taken',
  meal:        "I've had this",
  activity:    'Mark as done',
  appointment: "I'm ready",
  rest:        'Resting now',
};

// ── Status badge config ────────────────────────────────────────────────────────
// Every status shows BOTH a word AND an icon — color is never the only indicator.

const STATUS_CFG: Record<
  ItemStatus,
  { word: string; Icon: LucideIcon; badge: string; cardBorder: string }
> = {
  done: {
    word:       'Done',
    Icon:       CheckCircle2,
    badge:      'bg-success-100 text-success-700',
    cardBorder: 'border-success-200',
  },
  now: {
    word:       'Now',
    Icon:       Clock,
    badge:      'bg-warm-100 text-warm-700',
    cardBorder: 'border-warm-300',
  },
  upcoming: {
    word:       'Coming up',
    Icon:       Calendar,
    badge:      'bg-calm-100 text-calm-700',
    cardBorder: 'border-calm-200',
  },
};

// ── Status badge atom ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ItemStatus }) {
  const { word, Icon, badge } = STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-bold ${badge}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      {word}
    </span>
  );
}

// ── All-done card ──────────────────────────────────────────────────────────────

function AllDoneCard() {
  return (
    <div className="bg-success-50 rounded-2xl border-2 border-success-200 p-8 text-center space-y-4">
      <span
        className="inline-flex w-20 h-20 rounded-full bg-success-100 items-center justify-center mx-auto"
        aria-hidden="true"
      >
        <CheckCircle2 className="w-10 h-10 text-success-600" />
      </span>
      <div>
        <p className="text-2xl font-bold text-success-800">All done for today!</p>
        <p className="text-base text-success-700 mt-2">
          You've completed everything on your list. What a wonderful day, Margaret.
        </p>
      </div>
    </div>
  );
}

// ── Featured "Next thing to do" card ──────────────────────────────────────────

function NextThingCard({
  item,
  status,
  onDone,
}: {
  item: ScheduleItem;
  status: ItemStatus;
  onDone: () => void;
}) {
  const CatIcon = CATEGORY_ICON[item.category];
  const theme   = ICON_THEME[item.category];
  const cfg     = STATUS_CFG[status];

  return (
    <div
      className={`bg-white rounded-2xl border-2 ${cfg.cardBorder} shadow-card-hover p-6 space-y-5`}
    >
      {/* Top row: "Next thing to do" label + status badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
          Next thing to do
        </p>
        <StatusBadge status={status} />
      </div>

      {/* Main content row: large icon + details */}
      <div className="flex items-start gap-5">

        {/* Category icon — large, in a rounded square */}
        <span
          className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${theme.bg}`}
          aria-hidden="true"
        >
          <CatIcon className={`w-8 h-8 ${theme.fg}`} />
        </span>

        <div className="flex-1 min-w-0">
          {/* Category type + time */}
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-neutral-500">
              {CATEGORY_LABEL[item.category]}
            </span>
            <time
              dateTime={item.time}
              className="text-base font-bold text-calm-600 tabular-nums"
            >
              {fmt12(item.time)}
            </time>
          </div>

          {/* Label — very large for low vision / memory support */}
          <p className="text-2xl font-bold text-neutral-800 leading-tight">
            {item.label}
          </p>

          {/* Plain-language description */}
          {item.description && (
            <p className="mt-2 text-base text-neutral-600 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Primary action button — full-width, large tap target */}
      <button
        onClick={onDone}
        className="w-full inline-flex items-center justify-center gap-3 font-bold rounded-xl px-6 py-4 min-h-[3.5rem] text-lg bg-calm-600 text-white border-2 border-calm-600 hover:bg-calm-700 active:bg-calm-800 transition-colors"
        aria-label={`${ACTION_LABEL[item.category]}: ${item.label}`}
      >
        <CheckCircle2 className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
        {ACTION_LABEL[item.category]}
      </button>
    </div>
  );
}

// ── Remaining item card ────────────────────────────────────────────────────────
// Uses the Card component from the library: semantic <section> with <h3>.

function RemainingCard({
  item,
  status,
}: {
  item: ScheduleItem;
  status: ItemStatus;
}) {
  const CatIcon = CATEGORY_ICON[item.category];

  return (
    <Card
      heading={item.label}
      headingLevel={3}
      actions={
        // Time in the Card's top-right "actions" slot
        <time
          dateTime={item.time}
          className="text-lg font-bold text-neutral-700 tabular-nums flex-shrink-0"
        >
          {fmt12(item.time)}
        </time>
      }
    >
      <div className="space-y-2.5">
        {/* Category + status — both shown, no color-only meaning */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500">
            <CatIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {CATEGORY_LABEL[item.category]}
          </span>
          <StatusBadge status={status} />
        </div>

        {/* Plain-language description */}
        {item.description && (
          <p className="text-base text-neutral-600 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
    </Card>
  );
}

// ── Today page ─────────────────────────────────────────────────────────────────

export default function Today() {
  const navigate = useNavigate();

  // Persist done IDs to localStorage so the caregiver dashboard can read adherence
  const [localDone, setLocalDone] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LS_DONE_KEY);
      const stored: { date: string; ids: string[] } = raw ? JSON.parse(raw) : null;
      if (stored?.date === TODAY_DATE) return new Set(stored.ids);
    } catch { /* empty */ }
    return new Set<string>();
  });

  // Persist check-in to localStorage
  const [checkedIn, setCheckedIn] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(LS_CHECKIN_KEY);
      const stored: { date: string; time: string } = raw ? JSON.parse(raw) : null;
      return stored?.date === TODAY_DATE;
    } catch { return false; }
  });
  const [checkInTime, setCheckInTime] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(LS_CHECKIN_KEY);
      const stored: { date: string; time: string } = raw ? JSON.parse(raw) : null;
      return stored?.date === TODAY_DATE ? stored.time : '';
    } catch { return ''; }
  });

  // Write done IDs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      LS_DONE_KEY,
      JSON.stringify({ date: TODAY_DATE, ids: [...localDone] }),
    );
  }, [localDone]);

  // Current time in minutes past midnight — computed once per render
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  // Merge static done flags with session-level done actions
  const items = useMemo(
    () => scheduleItems.map(item => ({
      ...item,
      done: item.done || localDone.has(item.id),
    })),
    [localDone],
  );

  // Featured: the first undone medication or appointment (highest cognitive priority)
  const featured = items.find(
    item => !item.done && (item.category === 'medication' || item.category === 'appointment'),
  );

  // Remaining: all other undone items, max 4 visible
  const remaining = items
    .filter(item => !item.done && item !== featured)
    .slice(0, 4);

  const doneCount = items.filter(i => i.done).length;

  function markDone(id: string) {
    setLocalDone(prev => new Set([...prev, id]));
  }

  function handleCheckIn() {
    if (checkedIn) return;
    const t = currentTimeLabel();
    setCheckedIn(true);
    setCheckInTime(t);
    localStorage.setItem(LS_CHECKIN_KEY, JSON.stringify({ date: TODAY_DATE, time: t }));
    appendActivityEvent({
      kind: 'check_in',
      label: `Checked in at ${t}`,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-8 max-w-3xl lg:max-w-5xl mx-auto">
      {/* Centered, comfortably-wide container so content is balanced rather
          than jammed to the left on desktop. Widens on lg for two columns. */}

      {/* ── Page heading ─────────────────────────────────────────────── */}
      {/* This page has its own h1; the orientation bar already provides the
          date/time/name context, so the h1 here is the primary page title. */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-800 leading-tight">
          Here's your day, Margaret
        </h1>
        <p className="mt-1 text-lg text-neutral-500">
          {doneCount} of {items.length} things done today
        </p>
      </div>

      {/* ── Check-in success banner (polite announcement) ─────────────── */}
      {checkedIn && (
        <Banner variant="success" title="Checked in">
          You checked in at {checkInTime}. Your caregiver can see you're doing well.
        </Banner>
      )}

      {/* ── Desktop (lg+) two-column layout; single column on mobile/tablet.
          DOM order is unchanged (Next thing → Later today → Quick actions),
          so the tab/focus order is preserved. ────────────────────────── */}
      <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">

        {/* Left column: the next task and the rest of today */}
        <div className="space-y-8">

          {/* ── Next thing to do ─────────────────────────────────────── */}
          <section aria-label="Next thing to do">
            {featured ? (
              <NextThingCard
                item={featured}
                status={computeStatus(featured, nowMin)}
                onDone={() => markDone(featured.id)}
              />
            ) : (
              <AllDoneCard />
            )}
          </section>

          {/* ── Remaining items — max 4, no scroll/carousel ──────────── */}
          {remaining.length > 0 && (
            <section aria-labelledby="later-heading">
              <h2 id="later-heading" className="text-xl font-semibold text-neutral-800 mb-4">
                Later today
              </h2>
              <ul className="space-y-3 list-none p-0 m-0" role="list">
                {remaining.map(item => (
                  <li key={item.id}>
                    <RemainingCard
                      item={item}
                      status={computeStatus(item, nowMin)}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-right">
                <Link to="/app/schedule" className="text-calm-600 font-semibold">
                  See full day schedule
                </Link>
              </p>
            </section>
          )}
        </div>

        {/* Right column: quick-action tiles */}
        <section aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="text-xl font-semibold text-neutral-800 mb-4">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <BigActionTile
              icon={<Pill className="w-9 h-9" />}
              label="Medications"
              description="View and mark today's medicines"
              colour="calm"
              onClick={() => navigate('/app/medications')}
            />
            <BigActionTile
              icon={<Calendar className="w-9 h-9" />}
              label="Appointments"
              description="See your upcoming visits and calls"
              colour="warm"
              onClick={() => navigate('/app/appointments')}
            />
            <BigActionTile
              icon={<CheckCircle2 className="w-9 h-9" />}
              label={checkedIn ? 'Checked In' : 'Check In'}
              description={
                checkedIn
                  ? `Checked in at ${checkInTime}`
                  : "Let your caregiver know you're well"
              }
              colour={checkedIn ? 'success' : 'neutral'}
              onClick={handleCheckIn}
              disabled={checkedIn}
            />
            <BigActionTile
              icon={<PhoneCall className="w-9 h-9" />}
              label="Call Caregiver"
              description="Call Joyce — 07700 900 456"
              colour="success"
              onClick={() => { window.location.href = 'tel:07700900456'; }}
            />
          </div>
        </section>

      </div>
    </div>
  );
}
