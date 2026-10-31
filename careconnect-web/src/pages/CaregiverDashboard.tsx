import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Pill,
  CalendarDays,
  UserCheck,
  Activity,
  ArrowRight,
  AlertCircle,
  ClipboardList,
  Info,
} from 'lucide-react';
import { Card } from '../components';
import {
  getMedAdherence,
  getScheduleAdherence,
  getCheckInStatus,
  getNextAppointment,
  getUpcomingAlerts,
  getActivityLog,
} from '../data/caregiverStore';
import type { MedAdherence, CheckInStatus, NextAppointment, UpcomingAlert, ActivityEvent } from '../data/caregiverStore';

// ── Time helpers ───────────────────────────────────────────────────────────────

function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function relativeDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return formatFullDate(dateStr);
}

function relativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Status summary card ────────────────────────────────────────────────────────

function StatusSummaryCard({
  medAdherence,
  checkIn,
  nextAppt,
}: {
  medAdherence: MedAdherence;
  checkIn: CheckInStatus;
  nextAppt: NextAppointment | null;
}) {
  const { takenCount, totalCount } = medAdherence;
  const allTaken = takenCount === totalCount;

  return (
    <Card heading="Margaret's status today" headingLevel={2}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Medication adherence */}
        <div
          className={`rounded-xl p-4 border-2 ${
            allTaken
              ? 'bg-success-50 border-success-200'
              : 'bg-warm-50 border-warm-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Pill
              className={`w-5 h-5 flex-shrink-0 ${allTaken ? 'text-success-600' : 'text-warm-600'}`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
              Medications
            </span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${allTaken ? 'text-success-700' : 'text-warm-700'}`}>
            {takenCount} of {totalCount}
          </p>
          <p className="text-sm font-medium text-neutral-600 mt-0.5">
            {allTaken ? 'All taken today' : 'taken today'}
          </p>
        </div>

        {/* Check-in */}
        <div
          className={`rounded-xl p-4 border-2 ${
            checkIn.checkedIn
              ? 'bg-success-50 border-success-200'
              : 'bg-neutral-100 border-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <UserCheck
              className={`w-5 h-5 flex-shrink-0 ${checkIn.checkedIn ? 'text-success-600' : 'text-neutral-400'}`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
              Check-in
            </span>
          </div>
          {checkIn.checkedIn ? (
            <>
              <p className="text-2xl font-bold text-success-700">Done</p>
              <p className="text-sm font-medium text-neutral-600 mt-0.5">
                at {checkIn.time}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-neutral-500">Not yet</p>
              <p className="text-sm font-medium text-neutral-500 mt-0.5">
                Awaiting check-in
              </p>
            </>
          )}
        </div>

        {/* Next appointment */}
        <div className="rounded-xl p-4 border-2 bg-calm-50 border-calm-200">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 flex-shrink-0 text-calm-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
              Next appointment
            </span>
          </div>
          {nextAppt ? (
            <>
              <p className="text-base font-bold text-neutral-800 leading-tight line-clamp-2">
                {nextAppt.title}
              </p>
              <p className="text-sm font-semibold text-calm-700 mt-1">
                {relativeDate(nextAppt.date)} — {fmt12(nextAppt.time)}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                {nextAppt.locationName}
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-success-700">All clear</p>
              <p className="text-sm text-neutral-500 mt-0.5">No upcoming appointments</p>
            </>
          )}
        </div>

      </div>
    </Card>
  );
}

// ── Alert item ─────────────────────────────────────────────────────────────────

function AlertItem({
  icon,
  title,
  detail,
  severity,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  severity: 'high' | 'medium';
}) {
  const colours =
    severity === 'high'
      ? 'bg-alert-50 border-alert-300 text-alert-800'
      : 'bg-warm-50 border-warm-300 text-warm-800';
  const detailColour = severity === 'high' ? 'text-alert-700' : 'text-warm-700';

  return (
    <li
      className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 ${colours}`}
    >
      <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-semibold leading-tight">{title}</p>
        <p className={`text-sm mt-0.5 ${detailColour}`}>{detail}</p>
      </div>
    </li>
  );
}

// ── Activity event row ─────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  ActivityEvent['kind'],
  { label: string; iconClass: string; rowClass: string }
> = {
  med_taken: {
    label: 'Medication taken',
    iconClass: 'text-success-600',
    rowClass: 'border-success-200',
  },
  med_skipped: {
    label: 'Medication unmarked',
    iconClass: 'text-warm-600',
    rowClass: 'border-warm-200',
  },  schedule_done: {
    label: 'Task completed',
    iconClass: 'text-calm-600',
    rowClass: 'border-calm-200',
  },
  check_in: {
    label: 'Checked in',
    iconClass: 'text-success-600',
    rowClass: 'border-success-200',
  },
};

const EVENT_ICON: Record<ActivityEvent['kind'], React.ReactNode> = {
  med_taken:     <Pill className="w-4 h-4" />,
  med_skipped:   <AlertCircle className="w-4 h-4" />,
  schedule_done: <CheckCircle2 className="w-4 h-4" />,
  check_in:      <UserCheck className="w-4 h-4" />,
};

function ActivityRow({ event }: { event: ActivityEvent }) {
  const cfg = EVENT_CONFIG[event.kind];
  return (
    <li
      className={`flex items-start gap-3 py-3 border-l-4 pl-4 ${cfg.rowClass}`}
    >
      <span className={`flex-shrink-0 mt-0.5 ${cfg.iconClass}`} aria-hidden="true">
        {EVENT_ICON[event.kind]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-700 leading-tight">
          {event.label}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5 font-medium uppercase tracking-wide">
          {cfg.label}
        </p>
      </div>
      <time
        dateTime={event.timestamp}
        className="text-xs text-neutral-400 tabular-nums flex-shrink-0 mt-0.5"
      >
        {relativeTime(event.timestamp)}
      </time>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CaregiverDashboard() {
  const [medAdherence, setMedAdherence] = useState<MedAdherence>(getMedAdherence);
  const [schedAdherence, setSchedAdherence] = useState(getScheduleAdherence);
  const [checkIn, setCheckIn] = useState<CheckInStatus>(getCheckInStatus);
  const [nextAppt, setNextAppt] = useState<NextAppointment | null>(getNextAppointment);
  const [upcomingAlerts, setUpcomingAlerts] = useState<UpcomingAlert[]>(getUpcomingAlerts);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>(getActivityLog);

  // Refresh data on focus (caregiver may return after patient has acted)
  useEffect(() => {
    function refresh() {
      setMedAdherence(getMedAdherence());
      setSchedAdherence(getScheduleAdherence());
      setCheckIn(getCheckInStatus());
      setNextAppt(getNextAppointment());
      setUpcomingAlerts(getUpcomingAlerts());
      setActivityLog(getActivityLog());
    }
    window.addEventListener('focus', refresh);
    // Also poll every 30 s for same-tab updates
    const id = setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener('focus', refresh);
      clearInterval(id);
    };
  }, []);

  const hasMissedMeds = medAdherence.missedMeds.length > 0;
  const hasAlerts = hasMissedMeds || upcomingAlerts.length > 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 leading-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-lg text-neutral-500">
            Margaret's care overview — {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
        </div>
        {/* Adherence quick-stat pill */}
        <div
          className="inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold border-2"
          style={{ borderColor: 'transparent' }}
          aria-label={`Schedule: ${schedAdherence.doneCount} of ${schedAdherence.totalCount} tasks done`}
        >
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-sm font-bold ${
            schedAdherence.doneCount === schedAdherence.totalCount
              ? 'bg-success-100 text-success-700'
              : 'bg-neutral-100 text-neutral-600'
          }`}>
            <ClipboardList className="w-4 h-4" aria-hidden="true" />
            {schedAdherence.doneCount}/{schedAdherence.totalCount} tasks done
          </span>
        </div>
      </div>

      {/* ── Status summary ────────────────────────────────────────────────── */}
      <StatusSummaryCard
        medAdherence={medAdherence}
        checkIn={checkIn}
        nextAppt={nextAppt}
      />

      {/* ── ALERTS ───────────────────────────────────────────────────────── */}
      <section
        role="region"
        aria-label="Alerts"
        aria-live="polite"
        aria-atomic="false"
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warm-600" aria-hidden="true" />
            Alerts
            {hasAlerts && (
              <span
                className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-alert-100 text-alert-700 text-xs font-bold"
                aria-label={`${medAdherence.missedMeds.length + upcomingAlerts.length} alerts`}
              >
                {medAdherence.missedMeds.length + upcomingAlerts.length}
              </span>
            )}
          </h2>
        </div>

        {hasAlerts ? (
          <ul className="space-y-3 list-none p-0 m-0" role="list">
            {/* Missed medications — high severity */}
            {medAdherence.missedMeds.map((med) => (
              <AlertItem
                key={med.id}
                icon={<Pill className="w-5 h-5 text-alert-600" />}
                title={`${med.name} — overdue`}
                detail={`${med.dosage} was due at ${fmt12(med.scheduledTime)} and has not been taken`}
                severity="high"
              />
            ))}
            {/* Upcoming appointments — medium severity */}
            {upcomingAlerts.map((appt) => (
              <AlertItem
                key={appt.id}
                icon={<CalendarDays className="w-5 h-5 text-warm-600" />}
                title={`Appointment ${relativeDate(appt.date).toLowerCase()}`}
                detail={`${appt.title} at ${fmt12(appt.time)}`}
                severity="medium"
              />
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 bg-success-50 border-2 border-success-200 rounded-xl px-5 py-4">
            <CheckCircle2 className="w-6 h-6 text-success-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-success-800">No alerts right now</p>
              <p className="text-sm text-success-700 mt-0.5">
                All medications on track and no urgent appointments in the next 24 hours.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Two-column: Activity + Quick links ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity timeline — takes 2/3 of width on desktop */}
        <section
          aria-labelledby="activity-heading"
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="activity-heading" className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-calm-600" aria-hidden="true" />
              Recent activity
            </h2>
            <Link
              to="/app/activity"
              className="text-sm font-semibold text-calm-600 no-underline hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border-2 border-neutral-300 shadow-card overflow-hidden">
            {activityLog.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Info className="w-8 h-8 text-neutral-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-neutral-500 font-medium">No activity recorded yet.</p>
                <p className="text-sm text-neutral-400 mt-1">
                  Activity appears here when Margaret takes medications or checks in.
                </p>
              </div>
            ) : (
              <ul
                className="divide-y divide-neutral-100 list-none p-0 m-0 px-4"
                role="list"
                aria-label="Recent activity timeline"
              >
                {activityLog.slice(0, 8).map((event) => (
                  <ActivityRow key={event.id} event={event} />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Quick actions — 1/3 */}
        <section aria-labelledby="quicklinks-heading">
          <h2
            id="quicklinks-heading"
            className="text-xl font-semibold text-neutral-800 mb-4"
          >
            Quick links
          </h2>
          <div className="space-y-3">
            <Link
              to="/app/manage-medications"
              className="flex items-center gap-4 bg-white rounded-xl border-2 border-neutral-300 shadow-card px-5 py-4 no-underline group hover:border-calm-400 hover:shadow-card-hover transition-all"
              aria-label="Manage medications"
            >
              <span
                className="w-11 h-11 rounded-xl bg-warm-100 flex items-center justify-center flex-shrink-0 group-hover:bg-warm-200 transition-colors"
                aria-hidden="true"
              >
                <Pill className="w-6 h-6 text-warm-700" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-800 leading-tight">
                  Manage medications
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {medAdherence.takenCount}/{medAdherence.totalCount} taken today
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-calm-600 transition-colors flex-shrink-0" aria-hidden="true" />
            </Link>

            <Link
              to="/app/manage-appointments"
              className="flex items-center gap-4 bg-white rounded-xl border-2 border-neutral-300 shadow-card px-5 py-4 no-underline group hover:border-calm-400 hover:shadow-card-hover transition-all"
              aria-label="Manage appointments"
            >
              <span
                className="w-11 h-11 rounded-xl bg-calm-100 flex items-center justify-center flex-shrink-0 group-hover:bg-calm-200 transition-colors"
                aria-hidden="true"
              >
                <CalendarDays className="w-6 h-6 text-calm-700" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-800 leading-tight">
                  Manage appointments
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {upcomingAlerts.length > 0
                    ? `${upcomingAlerts.length} in the next 24 h`
                    : 'View upcoming visits'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-calm-600 transition-colors flex-shrink-0" aria-hidden="true" />
            </Link>

            <Link
              to="/app/caregiver"
              className="flex items-center gap-4 bg-white rounded-xl border-2 border-neutral-300 shadow-card px-5 py-4 no-underline group hover:border-calm-400 hover:shadow-card-hover transition-all"
              aria-label="View caregiver notes"
            >
              <span
                className="w-11 h-11 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0 group-hover:bg-success-200 transition-colors"
                aria-hidden="true"
              >
                <ClipboardList className="w-6 h-6 text-success-700" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-800 leading-tight">
                  Caregiver notes
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Daily observations log
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-calm-600 transition-colors flex-shrink-0" aria-hidden="true" />
            </Link>

            <Link
              to="/app/activity"
              className="flex items-center gap-4 bg-white rounded-xl border-2 border-neutral-300 shadow-card px-5 py-4 no-underline group hover:border-calm-400 hover:shadow-card-hover transition-all"
              aria-label="View full activity log"
            >
              <span
                className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-200 transition-colors"
                aria-hidden="true"
              >
                <Activity className="w-6 h-6 text-neutral-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-800 leading-tight">
                  Full activity log
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {activityLog.length > 0
                    ? `${activityLog.length} events recorded`
                    : 'No events yet today'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-calm-600 transition-colors flex-shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </section>

      </div>

      <p className="text-xs text-neutral-400 text-center pb-2">
        Data refreshes when you return to this tab. Last seen adherence reflects Margaret's most recent actions.
      </p>

    </div>
  );
}
