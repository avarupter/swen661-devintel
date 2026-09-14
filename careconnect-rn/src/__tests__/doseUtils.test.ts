// src/__tests__/doseUtils.test.ts
import { groupDoses, dosesTakenPercent, Dose } from '../utils/doseUtils';

const sampleDoses: Dose[] = [
  { id: '1', status: 'due' },
  { id: '2', status: 'taken' },
  { id: '3', status: 'later' },
  { id: '4', status: 'taken' },
  { id: '5', status: 'due' },
];

describe('groupDoses', () => {
  test('splits doses into due, taken, and later', () => {
    const result = groupDoses(sampleDoses);
    expect(result.due).toHaveLength(2);
    expect(result.taken).toHaveLength(2);
    expect(result.later).toHaveLength(1);
  });

  test('handles empty input', () => {
    const result = groupDoses([]);
    expect(result.due).toEqual([]);
    expect(result.taken).toEqual([]);
    expect(result.later).toEqual([]);
  });
});

describe('dosesTakenPercent', () => {
  test('calculates correct percentage', () => {
    expect(dosesTakenPercent(sampleDoses)).toBe(40);
  });

  test('returns 0 for empty list', () => {
    expect(dosesTakenPercent([])).toBe(0);
  });

  test('returns 100 when all taken', () => {
    const allTaken: Dose[] = [
      { id: '1', status: 'taken' },
      { id: '2', status: 'taken' },
    ];
    expect(dosesTakenPercent(allTaken)).toBe(100);
  });
});