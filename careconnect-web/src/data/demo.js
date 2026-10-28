/**
 * The demo's frozen instant: the moment the Patient Today header shows
 * ("Thursday, June 4 · 5:38 AM", patientToday.header.meta).
 *
 * Every status, every relative-day label and every timestamp the app records
 * is computed from these values, never from Date.now(). Otherwise "Today",
 * "Due now" and "Missed" would change with the wall clock and contradict the
 * static header, and the tests would pass or fail by time of day.
 *
 * Local wall-clock strings with no time zone, so "5:38 am" reads the same on
 * every device.
 */
export const DEMO_DATE = '2026-06-04'; // a Thursday
export const DEMO_TIME = '05:38';
export const DEMO_NOW = `${DEMO_DATE}T${DEMO_TIME}`; // '2026-06-04T05:38'
