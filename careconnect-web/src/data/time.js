import { DEMO_NOW } from "./demo.js";

/**
 * Times as relative words, computed from the demo clock (D5, D6).
 *
 * Pure: every `now` defaults to DEMO_NOW and nothing reads the real clock.
 *
 * Dates are wall-clock strings with no zone ("2026-06-04", or
 * "2026-06-03T19:42" for a message), and only their calendar day counts. Day
 * arithmetic goes through Date.UTC so the answer cannot depend on the machine's
 * time zone or on a daylight-saving change between the two dates; parsing
 * "2026-06-04" with new Date() would read it as UTC and then report the local
 * day, which is the day before anywhere west of Greenwich.
 *
 * The words are here, with the helpers that assemble them, so they stay in
 * src/data with the rest of the copy.
 */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WORDS = {
  today: "Today",
  tomorrow: "Tomorrow",
  yesterday: "Yesterday",
  am: "am",
  pm: "pm",
  inDays: (n, day) => `In ${n} days (${day})`,
  daysAgo: (n, day) => `${n} days ago (${day})`,
  when: (day, clock) => `${day} at ${clock}`,
  threadTime: (day, clock) => `${day}, ${clock}`,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Midnight UTC of the calendar day an ISO date or local datetime names. */
function utcDay(iso) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function weekdayOf(iso) {
  return WEEKDAYS[new Date(utcDay(iso)).getUTCDay()];
}

/** "June 22", "May 5". */
function monthDayOf(iso) {
  const [, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

/** The "HH:MM" part of a local datetime string. */
function clockOf(at) {
  return at.slice(11, 16);
}

/**
 * "05:38" -> "5:38 am", "15:00" -> "3:00 pm", "12:00" -> "12:00 pm",
 * "00:15" -> "12:15 am". Lowercase, as Patient Today writes its times.
 */
export function formatClock(hhmm) {
  const [hours, minutes] = hhmm.split(":");
  const h = Number(hours);
  return `${h % 12 || 12}:${minutes} ${h < 12 ? WORDS.am : WORDS.pm}`;
}

/**
 * Whole calendar days from `now`'s date to `isoDate`'s: positive ahead, negative
 * behind, 0 on the same day whatever the times. Either argument may be a date
 * or a datetime.
 */
export function dayOffset(isoDate, now = DEMO_NOW) {
  return Math.round((utcDay(isoDate) - utcDay(now)) / MS_PER_DAY);
}

/**
 * The D5 day wording: "Today", "Tomorrow", "Yesterday", "In 4 days (Monday)",
 * "In 18 days (Monday, June 22)", "3 days ago (Monday)",
 * "30 days ago (Tuesday, May 5)". From 7 days either way the weekday alone is
 * ambiguous, so the date joins it.
 */
export function relativeDay(isoDate, now = DEMO_NOW) {
  const offset = dayOffset(isoDate, now);
  if (offset === 0) return WORDS.today;
  if (offset === 1) return WORDS.tomorrow;
  if (offset === -1) return WORDS.yesterday;

  const days = Math.abs(offset);
  const weekday = weekdayOf(isoDate);
  const day = days < 7 ? weekday : `${weekday}, ${monthDayOf(isoDate)}`;
  return offset > 0 ? WORDS.inDays(days, day) : WORDS.daysAgo(days, day);
}

/** "Tomorrow at 5:30 pm", "In 4 days (Monday) at 10:00 am". */
export function whenLabel(isoDate, hhmm, now = DEMO_NOW) {
  return WORDS.when(relativeDay(isoDate, now), formatClock(hhmm));
}

/**
 * The day part of a message time (content-messages-help.md §1.1): "Today",
 * "Yesterday", the weekday for 2 to 6 days ago, otherwise "May 28". It counts
 * calendar days only, never the time elapsed, so a message stamped later than
 * `now` on the same day still reads "Today". A future day, which the frozen
 * clock never produces, gets the plain date.
 */
function messageDay(at, now) {
  const offset = dayOffset(at, now);
  if (offset === 0) return WORDS.today;
  if (offset === -1) return WORDS.yesterday;
  if (offset <= -2 && offset >= -6) return weekdayOf(at);
  return monthDayOf(at);
}

/** The conversation list's time: "2:14 pm" today, else "Yesterday", "Monday" or "May 28". */
export function listTime(at, now = DEMO_NOW) {
  return dayOffset(at, now) === 0 ? formatClock(clockOf(at)) : messageDay(at, now);
}

/** A thread's time: "Today, 2:14 pm", "Yesterday, 7:42 pm", "Monday, 6:02 pm", "May 28, 9:00 am". */
export function threadTime(at, now = DEMO_NOW) {
  return WORDS.threadTime(messageDay(at, now), formatClock(clockOf(at)));
}
