import { DEMO_DATE, DEMO_NOW } from "./demo.js";
import { DOSE_SLOTS, MEDICATIONS, medicationsPage, todayProgress } from "./medications.js";
import { dayOffset } from "./time.js";

/**
 * Doses: which exist on a day, what state each is in, and what Patient Today
 * says about them. Pure: nothing here reads the real clock or storage.
 *
 * A dose log maps a dose id to `{ taken: true, at: "HH:MM" }`. A dose with no
 * entry, or with `{ taken: false }`, has not been taken.
 */

/**
 * The due window, from Flutter's DoseWindowPolicy (dose.dart): a dose is due
 * from 60 minutes before its slot to 120 minutes after, both ends included.
 */
const DUE_FROM_MINUTES_BEFORE = 60;
const DUE_UNTIL_MINUTES_AFTER = 120;
const MINUTES_PER_DAY = 24 * 60;

/** The sections Medications shows, in page order (D4). */
const GROUPS = ["now", "later", "done"];

/** Which section a dose belongs in when nothing pins it. */
const GROUP_FOR_STATUS = { due: "now", missed: "now", upcoming: "later", taken: "done" };

function slotById(slotId) {
  return DOSE_SLOTS.find((slot) => slot.id === slotId);
}

function isTaken(log, id) {
  return log?.[id]?.taken === true;
}

/** "HH:MM" -> minutes since midnight. */
function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

/** "memantine|2026-06-04|18:00": one dose of one medicine in one slot on one day. */
export function doseId(medicationId, date, slotTime) {
  return `${medicationId}|${date}|${slotTime}`;
}

/** The date part of a dose's id, so a dose needs no separate date field. */
function dateOfDose(dose) {
  return dose.id.split("|")[1];
}

/**
 * Every scheduled dose on `date`, as `{ id, medication, slot }`, ordered by
 * slot time and then by medicine name. As-needed medicines have no slots, so
 * they never appear.
 */
export function dosesFor(date = DEMO_DATE) {
  const doses = MEDICATIONS.flatMap((medication) =>
    medication.slots.map((slotId) => {
      const slot = slotById(slotId);
      return { id: doseId(medication.id, date, slot.time), medication, slot };
    }),
  );

  // "HH:MM" sorts as text; names go through localeCompare.
  return doses.sort((a, b) =>
    a.slot.time === b.slot.time
      ? a.medication.name.localeCompare(b.medication.name)
      : a.slot.time < b.slot.time ? -1 : 1,
  );
}

/**
 * "taken" when the log says so. Otherwise it depends on `now`: "upcoming"
 * before the due window opens, "due" inside it, and "missed" once it has
 * closed. A missed dose can still be marked: marking is allowed at any time.
 */
export function doseStatus(dose, log, now = DEMO_NOW) {
  if (isTaken(log, dose.id)) return "taken";

  const minutesUntilSlot =
    dayOffset(dateOfDose(dose), now) * MINUTES_PER_DAY +
    toMinutes(dose.slot.time) -
    toMinutes(now.slice(11, 16) || "00:00");

  if (minutesUntilSlot > DUE_FROM_MINUTES_BEFORE) return "upcoming";
  if (minutesUntilSlot < -DUE_UNTIL_MINUTES_AFTER) return "missed";
  return "due";
}

/**
 * Splits doses into Medications' sections: `now` ("Take these now": due or
 * missed), `later` ("Later today": upcoming) and `done` ("Already done"),
 * keeping the input order inside each.
 *
 * `pinned` maps a dose id to the group name it must stay in: "now", "later" or
 * "done". A row the user has just marked or undone keeps its place until the
 * page is next opened (STML: nothing moves under the user's hand). The page
 * records the group a dose was in when it was first changed, e.g.
 * `{ "atorvastatin|2026-06-04|18:00": "later" }`, and drops its pins when it
 * unmounts. Any other value is ignored.
 */
export function groupDoses(doses, log, now = DEMO_NOW, pinned = {}) {
  const groups = { now: [], later: [], done: [] };
  for (const dose of doses) {
    const pin = pinned[dose.id];
    const group = GROUPS.includes(pin) ? pin : GROUP_FOR_STATUS[doseStatus(dose, log, now)];
    groups[group].push(dose);
  }
  return groups;
}

/**
 * Patient Today's counts from the log (D10): `remaining` ("2 remaining"),
 * `thingsDone` ("3 things done"), `plan` ("3 of 10 things done today") and
 * `percent` (30). Things done are the doses taken on `date`.
 */
export function todayDerived(log, date = DEMO_DATE) {
  const doses = dosesFor(date);
  const taken = doses.filter((dose) => isTaken(log, dose.id)).length;
  const { total } = todayProgress;

  return {
    remaining: todayProgress.remaining(doses.length - taken),
    thingsDone: todayProgress.thingsDone(taken),
    plan: todayProgress.plan(taken, total),
    percent: Math.round((taken / total) * 100),
  };
}

/**
 * The status line on a medicine's card: "Taken today", "1 of 2 taken today",
 * "Not yet taken", or "Not needed today" for an as-needed medicine.
 */
export function medicationTodayStatus(medication, log, date = DEMO_DATE) {
  const { todayStatus } = medicationsPage.list;
  if (medication.asNeeded || medication.slots.length === 0) return todayStatus.asNeeded;

  const ids = medication.slots.map((slotId) => doseId(medication.id, date, slotById(slotId).time));
  const taken = ids.filter((id) => isTaken(log, id)).length;

  if (taken === ids.length) return todayStatus.all;
  if (taken === 0) return todayStatus.none;
  return todayStatus.some(taken, ids.length);
}
