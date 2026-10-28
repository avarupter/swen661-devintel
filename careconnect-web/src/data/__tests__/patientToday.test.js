import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "@jest/globals";
import Icon from "../../components/Icon.jsx";
import {
  CURRENT_DESTINATION,
  DESTINATIONS,
  patientToday,
} from "../patientToday.js";

/**
 * The data contract, not the copy.
 *
 * patientToday.js is the single source the three layouts read, which is what
 * makes "same content and same destinations at every width" a fact rather than
 * a promise. These tests pin the SHAPE that the pages and components depend on
 * — a missing field renders as `undefined` or as an empty element, neither of
 * which throws, so nothing else in the suite would notice.
 *
 * Deliberately not tested here: the wording of any string. Copy is the design
 * board's to change, and a test that restates it would fail on an approved edit
 * while catching no defect. What IS tested is every structural promise another
 * module relies on, including the ones that are only visible by crossing two
 * fields (a React key that must be unique, a percentage that must agree with
 * the label beside it, a breadcrumb that must name the current destination).
 *
 * Icon names are checked by rendering through Icon itself rather than against a
 * hard-coded list: Icon returns null for a name it does not implement, so a
 * renamed path in Icon.jsx turns these red, which a duplicated list would not.
 */

/** True when Icon actually draws something for `name`. */
function iconRenders(name) {
  const { container, unmount } = render(createElement(Icon, { name }));
  const drew = container.querySelector("svg") !== null;
  unmount();
  return drew;
}

const isFilledString = (v) => typeof v === "string" && v.trim().length > 0;

describe("DESTINATIONS", () => {
  it("declares five destinations with unique ids", () => {
    expect(DESTINATIONS).toHaveLength(5);

    const ids = DESTINATIONS.map((d) => d.id);
    expect(ids.filter((id) => !isFilledString(id))).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every destination a full label, a short label and an icon", () => {
    const incomplete = DESTINATIONS.filter(
      (d) =>
        !isFilledString(d.label) ||
        !isFilledString(d.shortLabel) ||
        !isFilledString(d.icon),
    ).map((d) => d.id);

    expect(incomplete).toEqual([]);
  });

  it("keeps every label unique, so one destination answers to one accessible name", () => {
    // Nav renders `label` as the accessible name in all three variants. Two
    // destinations sharing one would make getByRole('link', {name}) ambiguous
    // for a test and the destination ambiguous for a screen reader.
    const labels = DESTINATIONS.map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("abbreviates at least one destination, and never to something longer", () => {
    // The mobile bar swaps `label` for `shortLabel`; an abbreviation that is
    // not shorter is the one case where the swap buys nothing but still costs
    // the extra visually-hidden span.
    const longer = DESTINATIONS.filter(
      (d) => d.shortLabel.length > d.label.length,
    ).map((d) => d.id);
    expect(longer).toEqual([]);

    const abbreviated = DESTINATIONS.filter((d) => d.shortLabel !== d.label);
    expect(abbreviated.length).toBeGreaterThan(0);
  });

  it("names only icons that Icon implements", () => {
    const unimplemented = DESTINATIONS.filter(
      (d) => !iconRenders(d.icon),
    ).map((d) => `${d.id}:${d.icon}`);

    expect(unimplemented).toEqual([]);
  });

  it("carries at least one unread count, each a positive whole number", () => {
    // Nav renders the count only when it is truthy, so a stray `badgeCount: 0`
    // is dead weight: a field that reads as a count and displays as nothing.
    //
    // WHICH destination carries one is the board's to change, so it is not
    // pinned here — Nav renders the ", N unread" suffix inside that
    // destination's own link, so a second badged destination announces
    // "Appointments, 3 unread" correctly rather than doubling anything up. What
    // is pinned is that at least one count exists, which is the only reason the
    // field belongs in a structural test: it is what keeps Nav's
    // `d.badgeCount ? ... : null` branch fed by real data.
    const counted = DESTINATIONS.filter((d) => Object.hasOwn(d, "badgeCount"));
    expect(counted.length).toBeGreaterThan(0);

    const unusable = counted
      .filter((d) => !Number.isInteger(d.badgeCount) || d.badgeCount <= 0)
      .map((d) => `${d.id}: ${d.badgeCount}`);
    expect(unusable).toEqual([]);
  });

  it("keeps every id clear of the hashes App reserves", () => {
    // Nav renders href={`#${d.id}`} and App reads location.hash, where
    // "#specimens" selects the foundations sheet and "#main" is the skip link's
    // fragment target. A destination called either one is not a broken link, it
    // is a worse thing: "specimens" swaps the page to the design-system sheet
    // while the bar still reports itself as the current page, and "main" is a
    // destination that silently does nothing at all.
    const RESERVED = ["specimens", "main"];

    const shadowed = DESTINATIONS.filter((d) => RESERVED.includes(d.id)).map(
      (d) => d.id,
    );
    expect(shadowed).toEqual([]);
  });
});

describe("CURRENT_DESTINATION", () => {
  it("names one of the declared destinations", () => {
    // Nav marks aria-current="page" by comparing against this id. A typo here
    // marks nothing at all, and every layout quietly loses its current page.
    expect(DESTINATIONS.map((d) => d.id)).toContain(CURRENT_DESTINATION);
  });
});

describe("patientToday copy", () => {
  // Every path the shell, the page and the cards read. Grouped by the component
  // that consumes it so a deletion points at what breaks.
  const REQUIRED_PATHS = [
    "appName", // App
    "account.name",
    "account.role",
    "account.initials",
    "header.meta", // PatientToday header
    "header.greeting",
    "header.callAction",
    "plan.heading", // plan section
    "plan.progressLabel",
    "plan.encouragement",
    "next.eyebrow", // AppointmentCard
    "next.badge",
    "next.kindLabel",
    "next.time",
    "next.title",
    "next.detail",
    "next.readiness",
    "next.action",
    "later.heading", // LaterItem list
    "glance.heading", // GlanceCard
    "careTeam.heading", // CareTeamCard
    "careTeam.availability",
    "careTeam.body",
    "careTeam.action",
    "privacy",
  ];

  const at = (path) =>
    path.split(".").reduce((value, key) => (value == null ? value : value[key]), patientToday);

  it("carries every string the screen renders, none of them blank", () => {
    const missing = REQUIRED_PATHS.filter((path) => !isFilledString(at(path)));
    expect(missing).toEqual([]);
  });

  it("gives each later-today item the fields its card renders", () => {
    const items = patientToday.later.items;
    expect(items.length).toBeGreaterThan(0);

    const incomplete = items.filter(
      (item) =>
        !isFilledString(item.id) ||
        !isFilledString(item.time) ||
        !isFilledString(item.title) ||
        !isFilledString(item.detail) ||
        !iconRenders(item.icon),
    ).map((item) => item.id ?? "(no id)");
    expect(incomplete).toEqual([]);

    // `id` is the React key for the list.
    const ids = items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives each glance row a label, a value and an implemented icon", () => {
    const items = patientToday.glance.items;
    expect(items.length).toBeGreaterThan(0);

    const incomplete = items.filter(
      (item) =>
        !isFilledString(item.id) ||
        !isFilledString(item.label) ||
        !isFilledString(item.value) ||
        !iconRenders(item.icon),
    ).map((item) => item.id ?? "(no id)");
    expect(incomplete).toEqual([]);

    const ids = items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("states a progress percentage that agrees with the label beside it", () => {
    // ProgressBar clamps the number and prints it next to the label, so a
    // percentage that disagrees with "3 of 10" is not a crash — it is a bar
    // that lies, which is exactly the defect no reviewer catches by eye.
    const { progressLabel, progressPercent } = patientToday.plan;

    expect(Number.isInteger(progressPercent)).toBe(true);
    expect(progressPercent).toBeGreaterThanOrEqual(0);
    expect(progressPercent).toBeLessThanOrEqual(100);

    const counted = /(\d+)\s+of\s+(\d+)/.exec(progressLabel);
    expect(counted).not.toBeNull();

    const done = Number(counted[1]);
    const total = Number(counted[2]);
    expect(total).toBeGreaterThan(0);
    expect(done).toBeLessThanOrEqual(total);
    expect(Math.round((done / total) * 100)).toBe(progressPercent);
  });

  it("ends the breadcrumb at the current destination", () => {
    // PatientToday marks the last crumb aria-current="page" and Nav marks the
    // current destination the same way. If they name different pages the screen
    // claims to be in two places at once.
    const crumbs = patientToday.header.breadcrumb;
    expect(Array.isArray(crumbs)).toBe(true);
    expect(crumbs.filter((crumb) => !isFilledString(crumb))).toEqual([]);

    // Each crumb is its own React key.
    expect(new Set(crumbs).size).toBe(crumbs.length);

    const current = DESTINATIONS.find((d) => d.id === CURRENT_DESTINATION);
    expect(crumbs.at(-1)).toBe(current.label);
  });

  it("derives the avatar initials from the account name", () => {
    // The avatar is aria-hidden, so initials that no longer match the name
    // would be wrong in silence for every assistive-technology user and every
    // test that queries by text.
    const expected = patientToday.account.name
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

    expect(patientToday.account.initials.toUpperCase()).toBe(expected);
  });
});
