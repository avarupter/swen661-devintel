import { useState, useMemo } from 'react';
import {
  MapPin,
  Phone,
  Home,
  Building2,
  User2,
  CheckCircle2,
  CalendarDays,
  Clock,
  Info,
  PlusCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, Button } from '../components';
import { getAppointments } from '../data/apptStore';
import type { Appointment, AppointmentLocationType } from '../data/appointmentsData';

// ── Time / date helpers ────────────────────────────────────────────────────────

function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Full English date: "Thursday, 4 June" */
function formatFullDate(dateStr: string): string {
  // Use noon to avoid any daylight-saving edge cases
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Full combined label: "Thursday, 4 June — 2:30 pm" */
function formatDateTime(dateStr: string, time: string): string {
  return `${formatFullDate(dateStr)} — ${fmt12(time)}`;
}

/** ISO datetime string for <time> element */
function isoDateTime(dateStr: string, time: string): string {
  return `${dateStr}T${time}`;
}

/** Days between two "YYYY-MM-DD" strings (b − a) */
function diffDays(a: string, b: string): number {
  const msA = new Date(`${a}T12:00:00`).getTime();
  const msB = new Date(`${b}T12:00:00`).getTime();
  return Math.round((msB - msA) / 86_400_000);
}

/** Compare two appointments by date then time for chronological sort */
function chronoSort(a: Appointment, b: Appointment): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.time < b.time ? -1 : 1;
}

// ── Location icon and labels ───────────────────────────────────────────────────

const LOCATION_ICON: Record<AppointmentLocationType, LucideIcon> = {
  clinic:    MapPin,
  hospital:  Building2,
  telephone: Phone,
  home:      Home,
};

const LOCATION_TYPE_LABEL: Record<AppointmentLocationType, string> = {
  clinic:    'Clinic visit',
  hospital:  'Hospital visit',
  telephone: 'Telephone — no travel needed',
  home:      'Home visit — they come to you',
};

// ── Group divider ──────────────────────────────────────────────────────────────

function GroupDivider({
  id,
  label,
  sub,
  highlight = false,
}: {
  id: string;
  label: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3" aria-hidden="false">
      {highlight ? (
        <span
          id={id}
          className="flex-shrink-0 inline-flex items-center gap-1.5 bg-calm-600 text-white text-sm font-bold px-4 py-1.5 rounded-pill uppercase tracking-wide"
        >
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          {label}
        </span>
      ) : (
        <span
          id={id}
          className="flex-shrink-0 text-sm font-bold text-neutral-500 uppercase tracking-widest"
        >
          {label}
        </span>
      )}
      {sub && (
        <span className="text-base font-medium text-neutral-600 flex-shrink-0">{sub}</span>
      )}
      <span className="flex-1 h-px bg-neutral-200" aria-hidden="true" />
    </div>
  );
}

// ── Individual appointment card ────────────────────────────────────────────────

function AppointmentCard({
  appt,
  isToday,
  inMyDay,
  onAddToMyDay,
}: {
  appt: Appointment;
  isToday: boolean;
  inMyDay: boolean;
  onAddToMyDay: (id: string) => void;
}) {
  const LocIcon = LOCATION_ICON[appt.location.type];
  const canGetDirections =
    appt.location.type !== 'telephone' &&
    appt.location.type !== 'home' &&
    appt.location.address;

  const directionsUrl = canGetDirections
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${appt.location.name}, ${appt.location.address}`,
      )}`
    : null;

  return (
    <Card
      heading={appt.title}
      headingLevel={3}
      actions={
        isToday ? (
          // "Today" badge lives in the Card's top-right actions slot
          <span className="inline-flex items-center gap-1.5 bg-calm-100 text-calm-700 text-sm font-bold px-3 py-1 rounded-pill flex-shrink-0">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
            Today
          </span>
        ) : undefined
      }
      className={isToday ? 'border-calm-300' : ''}
    >
      <div className="space-y-4">

        {/* ── Date, day, and time — full words, no abbreviations ─────────── */}
        <div className="flex items-start gap-3">
          <Clock
            className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <time
            dateTime={isoDateTime(appt.date, appt.time)}
            className="text-lg font-bold text-neutral-800 leading-snug"
          >
            {formatDateTime(appt.date, appt.time)}
          </time>
        </div>

        {/* ── Location with icon ─────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <LocIcon
            className="w-5 h-5 text-calm-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-semibold text-neutral-800 leading-tight">
              {appt.location.name}
            </p>
            {appt.location.address && (
              <p className="text-sm text-neutral-500 mt-0.5">{appt.location.address}</p>
            )}
            <p className="text-sm text-neutral-400 mt-0.5 font-medium">
              {LOCATION_TYPE_LABEL[appt.location.type]}
            </p>
          </div>
        </div>

        {/* ── Who is taking me ───────────────────────────────────────────── */}
        {appt.caregiver && (
          <div className="flex items-center gap-3 bg-success-50 rounded-xl px-4 py-3 border border-success-200">
            <User2
              className="w-5 h-5 text-success-600 flex-shrink-0"
              aria-hidden="true"
            />
            <p className="text-base font-semibold text-success-800">
              <strong>{appt.caregiver.split(' ')[0]}</strong>{' '}
              <span className="font-normal text-success-700">is taking you to this appointment</span>
            </p>
          </div>
        )}

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        {appt.notes && (
          <div className="flex items-start gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
            <Info
              className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-base text-neutral-600 leading-relaxed">{appt.notes}</p>
          </div>
        )}

        {/* ── Actions row ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-neutral-100">
          {/* Get directions — only for physical locations */}
          {directionsUrl ? (
            <Button
              variant="secondary"
              icon={<MapPin className="w-4 h-4" />}
              onClick={() => window.open(directionsUrl, '_blank', 'noopener,noreferrer')}
              aria-label={`Get directions to ${appt.location.name}`}
            >
              Get directions
            </Button>
          ) : (
            /* Telephone / home: reassuring "no travel" note */
            <span className="inline-flex items-center gap-2 text-sm font-medium text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-2 min-h-[2.75rem]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              No travel needed
            </span>
          )}

          {/* "In My Day" indicator / "Add to My Day" button */}
          <div className="ml-auto">
            {inMyDay ? (
              <span
                className="inline-flex items-center gap-2 text-sm font-bold text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-2 min-h-[2.75rem]"
                aria-label="This appointment is already in your My Day schedule"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                In My Day
              </span>
            ) : (
              <button
                onClick={() => onAddToMyDay(appt.id)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-calm-700 bg-calm-50 border-2 border-calm-300 rounded-lg px-3 py-2 min-h-[2.75rem] hover:bg-calm-100 hover:border-calm-400 transition-colors"
                aria-label={`Add "${appt.title}" to My Day schedule`}
              >
                <PlusCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Add to My Day
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Appointments() {
  const appointments = useMemo(() => getAppointments(), []);

  const [myDaySet, setMyDaySet] = useState<Set<string>>(
    () => new Set(appointments.filter((a) => a.isInMyDay).map((a) => a.id)),
  );

  function addToMyDay(id: string) {
    setMyDaySet((prev) => new Set([...prev, id]));
  }

  const today = new Date().toISOString().split('T')[0];

  // Partition and sort in one pass
  const { todayAppts, thisWeekAppts, comingUpAppts } = useMemo(() => {
    const future = appointments.filter((a) => diffDays(today, a.date) >= 0);
    const sorted = [...future].sort(chronoSort);

    return {
      todayAppts:    sorted.filter((a) => diffDays(today, a.date) === 0),
      thisWeekAppts: sorted.filter((a) => {
        const d = diffDays(today, a.date);
        return d >= 1 && d <= 6;
      }),
      comingUpAppts: sorted.filter((a) => diffDays(today, a.date) >= 7),
    };
  }, [today]);

  const hasAny = todayAppts.length + thisWeekAppts.length + comingUpAppts.length > 0;
  const todayLabel = formatFullDate(today);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* ── Page heading ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-800 leading-tight">
          My Appointments
        </h1>
        <p className="mt-1 text-lg text-neutral-500">
          Upcoming visits, tests, and calls — all in one place
        </p>
      </div>

      {/* ── TODAY ─────────────────────────────────────────────────────── */}
      {todayAppts.length > 0 && (
        <section aria-labelledby="group-today" className="space-y-4">
          <GroupDivider
            id="group-today"
            label="Today"
            sub={todayLabel}
            highlight
          />
          <ul className="space-y-4 list-none p-0 m-0" role="list">
            {todayAppts.map((appt) => (
              <li key={appt.id}>
                <AppointmentCard
                  appt={appt}
                  isToday
                  inMyDay={myDaySet.has(appt.id)}
                  onAddToMyDay={addToMyDay}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── LATER THIS WEEK ───────────────────────────────────────────── */}
      {thisWeekAppts.length > 0 && (
        <section aria-labelledby="group-week" className="space-y-4">
          <GroupDivider id="group-week" label="Later this week" />
          <ul className="space-y-4 list-none p-0 m-0" role="list">
            {thisWeekAppts.map((appt) => (
              <li key={appt.id}>
                <AppointmentCard
                  appt={appt}
                  isToday={false}
                  inMyDay={myDaySet.has(appt.id)}
                  onAddToMyDay={addToMyDay}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── COMING UP ─────────────────────────────────────────────────── */}
      {comingUpAppts.length > 0 && (
        <section aria-labelledby="group-coming" className="space-y-4">
          <GroupDivider id="group-coming" label="Coming up" />
          <ul className="space-y-4 list-none p-0 m-0" role="list">
            {comingUpAppts.map((appt) => (
              <li key={appt.id}>
                <AppointmentCard
                  appt={appt}
                  isToday={false}
                  inMyDay={myDaySet.has(appt.id)}
                  onAddToMyDay={addToMyDay}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!hasAny && (
        <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-card p-10 text-center space-y-3">
          <span
            className="inline-flex w-16 h-16 rounded-full bg-success-100 items-center justify-center mx-auto"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-8 h-8 text-success-600" />
          </span>
          <p className="text-xl font-bold text-neutral-800">
            No upcoming appointments
          </p>
          <p className="text-base text-neutral-500">
            You're all clear. New appointments will appear here when they are booked.
          </p>
        </div>
      )}

      {/* ── Reassurance note ──────────────────────────────────────────── */}
      {hasAny && (
        <p className="text-sm text-neutral-400 text-center pb-2">
          Your caregiver can add or update appointments for you.
          <br />
          CareConnect never gives medical advice.
        </p>
      )}

    </div>
  );
}
