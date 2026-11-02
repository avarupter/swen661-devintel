import { describe, test, expect } from '@jest/globals';
import { appointments } from './appointmentsData';

const DAY = 24 * 60 * 60 * 1000;

// The demo dates are computed relative to the day the module is imported.
const IMPORT_DAY = new Date().toISOString().split('T')[0];

function daysAfterImport(date: string) {
  return Math.round((Date.parse(date) - Date.parse(IMPORT_DAY)) / DAY);
}

describe('appointments', () => {
  test('has eight appointments with unique ids', () => {
    expect(appointments.map((a) => a.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8']);
  });

  test('keeps the demo current: two today, three this week, three later', () => {
    expect(appointments.map((a) => daysAfterImport(a.date))).toEqual([0, 0, 1, 3, 5, 9, 14, 18]);
  });

  test('is listed in date and time order', () => {
    const keys = appointments.map((a) => `${a.date} ${a.time}`);

    expect([...keys].sort()).toEqual(keys);
  });

  test('uses ISO dates and 24-hour times', () => {
    for (const appt of appointments) {
      expect(appt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(appt.time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    }
  });

  test("only today's appointments are already in My Day", () => {
    expect(appointments.filter((a) => a.isInMyDay).map((a) => a.id)).toEqual(['a1', 'a2']);
  });

  test('a telephone appointment has no address to travel to', () => {
    const phoneCall = appointments.find((a) => a.location.type === 'telephone');

    expect(phoneCall?.location.address).toBeUndefined();
    expect(appointments.filter((a) => a.location.type !== 'telephone').every((a) => a.location.address)).toBe(true);
  });

  // BUG (time zones), not reproducible under jest.config.js's TZ=UTC: every
  // "today" in the mock data is a UTC date — daysFromNow (appointmentsData.ts:34)
  // and TODAY (mockData.ts:9, caregiverStore.ts:15) use toISOString() — while
  // times of day use local hours (caregiverStore.ts:78, 149). From 7 pm EST /
  // 8 pm EDT the UTC date is already tomorrow, so on a US evening (e.g. at
  // 20:00 New York time, 2026-11-02) "today's" appointments are dated
  // 2026-11-03 and the next appointment / missed-medicine logic compares
  // tomorrow's date with this evening's clock.
  test.todo('derives "today" from the local date, so US evening demos show the right day');
});
