// src/__tests__/dateUtils.test.ts
import {
  formatFriendlyDate,
  isToday,
  relativeDayLabel,
  greetingForHour,
} from '../utils/dateUtils';

describe('formatFriendlyDate', () => {
  test('formats a date as weekday, month, day', () => {
    const date = new Date('2026-09-14T12:00:00');
    expect(formatFriendlyDate(date)).toBe('Monday, September 14');
  });
});

describe('isToday', () => {
  test('returns true for today', () => {
    const now = new Date('2026-09-14T10:00:00');
    expect(isToday(new Date('2026-09-14T15:00:00'), now)).toBe(true);
  });

  test('returns false for tomorrow', () => {
    const now = new Date('2026-09-14T10:00:00');
    expect(isToday(new Date('2026-09-15T10:00:00'), now)).toBe(false);
  });
});

describe('relativeDayLabel', () => {
  const now = new Date('2026-09-14T10:00:00');

  test('returns Today for the same day', () => {
    expect(relativeDayLabel(new Date('2026-09-14T15:00:00'), now)).toBe('Today');
  });

  test('returns Tomorrow for the next day', () => {
    expect(relativeDayLabel(new Date('2026-09-15T10:00:00'), now)).toBe('Tomorrow');
  });

  test('returns Yesterday for the previous day', () => {
    expect(relativeDayLabel(new Date('2026-09-13T10:00:00'), now)).toBe('Yesterday');
  });

  test('returns In X days for the near future', () => {
    expect(relativeDayLabel(new Date('2026-09-17T10:00:00'), now)).toBe('In 3 days');
  });
});

describe('greetingForHour', () => {
  test('morning before noon', () => {
    expect(greetingForHour(9)).toBe('Good morning');
  });

  test('afternoon before 6pm', () => {
    expect(greetingForHour(14)).toBe('Good afternoon');
  });

  test('evening after 6pm', () => {
    expect(greetingForHour(20)).toBe('Good evening');
  });
});