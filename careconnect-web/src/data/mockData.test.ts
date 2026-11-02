import { describe, test, expect } from '@jest/globals';
import { caregiverNotes, contacts, medications, memoryCards, scheduleItems } from './mockData';

// mockData stamps "today" when it is imported (as a UTC date: toISOString()).
const TODAY = new Date().toISOString().split('T')[0];
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

function ids(items: { id: string }[]) {
  return items.map((item) => item.id);
}

describe('scheduleItems', () => {
  test('is a full day of unique items in time order', () => {
    const times = scheduleItems.map((item) => item.time);

    expect(new Set(ids(scheduleItems)).size).toBe(scheduleItems.length);
    expect(times.every((time) => HH_MM.test(time))).toBe(true);
    expect([...times].sort()).toEqual(times);
  });

  test('starts with the morning routine already done', () => {
    expect(scheduleItems.filter((item) => item.done).map((item) => item.label)).toEqual([
      'Wake up & stretch',
      'Breakfast',
      'Morning medications',
    ]);
  });
});

describe('medications', () => {
  test('every medicine has a name, a dosage and valid times', () => {
    for (const med of medications) {
      expect(med.name).not.toBe('');
      expect(med.dosage).not.toBe('');
      expect(med.times.length).toBeGreaterThan(0);
      expect(med.times.every((time) => HH_MM.test(time))).toBe(true);
    }
  });

  test("records today's doses: Amlodipine and Sertraline taken, the others not", () => {
    const takenToday = Object.fromEntries(medications.map((med) => [med.name, med.taken[TODAY]]));

    expect(takenToday).toEqual({
      Amlodipine: true,
      Atorvastatin: false,
      Sertraline: true,
      'Vitamin D3': false,
    });
  });
});

describe('memoryCards', () => {
  test('have unique ids and secure image links', () => {
    expect(new Set(ids(memoryCards)).size).toBe(memoryCards.length);
    for (const card of memoryCards) {
      expect(card.imageUrl).toMatch(/^https:\/\//);
    }
  });

  test('pin the family, home and pet cards', () => {
    expect(memoryCards.filter((card) => card.pinned).map((card) => card.category)).toEqual([
      'family',
      'place',
      'pet',
    ]);
  });
});

describe('contacts', () => {
  test('the emergency contacts include the 999 emergency services', () => {
    const emergency = contacts.filter((contact) => contact.isEmergency);

    expect(emergency.map((contact) => contact.name)).toEqual([
      'Maria Thompson',
      'Joyce Adeyemi',
      'Emergency Services',
    ]);
    expect(emergency.find((contact) => contact.role === 'emergency')?.phone).toBe('999');
  });

  test("the caregiver's number matches the header's call button (tel:07700900456)", () => {
    const caregiver = contacts.find((contact) => contact.role === 'caregiver');

    expect(caregiver?.phone.replace(/\s/g, '')).toBe('07700900456');
  });
});

describe('caregiverNotes', () => {
  test("the first two notes are from today's shift", () => {
    expect(caregiverNotes.filter((note) => note.date === TODAY).map((note) => note.id)).toEqual([
      'n1',
      'n2',
    ]);
  });

  test('use known priorities', () => {
    for (const note of caregiverNotes) {
      expect(['low', 'medium', 'high']).toContain(note.priority);
    }
  });
});
