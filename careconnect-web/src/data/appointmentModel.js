import { DEMO_NOW } from "./demo.js";
import { dayOffset } from "./time.js";

/**
 * Appointment status and grouping, computed from the demo clock. Pure.
 *
 * Status follows careconnect-rn's status type: cancelled wins, then the
 * calendar day decides. An appointment earlier today is still "today".
 */
export function appointmentStatus(a, now = DEMO_NOW) {
  if (a.cancelled) return "cancelled";
  const offset = dayOffset(a.date, now);
  if (offset === 0) return "today";
  return offset > 0 ? "upcoming" : "past";
}

/** Earliest first by date, then time. ISO strings sort as text. */
function byStart(a, b) {
  const x = `${a.date}T${a.time}`;
  const y = `${b.date}T${b.time}`;
  return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * Appointments by status: `today`, `upcoming` and `cancelled` in date order,
 * `past` newest first (the one that just happened is the one being asked
 * about). Returns new arrays; `list` is not changed.
 */
export function groupAppointments(list, now = DEMO_NOW) {
  const groups = { today: [], upcoming: [], cancelled: [], past: [] };
  for (const appointment of list) groups[appointmentStatus(appointment, now)].push(appointment);

  groups.today.sort(byStart);
  groups.upcoming.sort(byStart);
  groups.cancelled.sort(byStart);
  groups.past.sort((a, b) => byStart(b, a));
  return groups;
}
