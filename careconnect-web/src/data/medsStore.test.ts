import { describe, test, expect } from '@jest/globals';
import { getMedications, pickColour, saveMedications } from './medsStore';
import { medications as defaults } from './mockData';
import type { Medication } from '../types';

const LS_KEY = 'careconnect_medications_list';

const paracetamol: Medication = {
  id: 'x1',
  name: 'Paracetamol',
  dosage: '500 mg — 2 tablets',
  times: ['12:00'],
  colour: 'bg-calm-200',
  taken: {},
};

describe('getMedications', () => {
  test('returns the demo medicines until a caregiver saves a list', () => {
    expect(getMedications()).toEqual(defaults);
  });

  test('returns a copy, so changing the list does not change the demo data', () => {
    getMedications().push(paracetamol);

    expect(getMedications()).toEqual(defaults);
  });

  test('falls back to the demo medicines when the stored list is corrupt', () => {
    localStorage.setItem(LS_KEY, 'undefined');

    expect(getMedications()).toEqual(defaults);
  });
});

describe('saveMedications', () => {
  test('stores the list that getMedications returns from then on', () => {
    saveMedications([paracetamol]);

    expect(getMedications()).toEqual([paracetamol]);
    expect(JSON.parse(localStorage.getItem(LS_KEY) ?? 'null')).toEqual([paracetamol]);
  });
});

describe('pickColour', () => {
  test('gives new medicines the palette colours in turn, then starts again', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 13].map(pickColour)).toEqual([
      'bg-calm-200',
      'bg-warm-200',
      'bg-success-200',
      'bg-warning-200',
      'bg-alert-200',
      'bg-neutral-200',
      'bg-calm-200',
      'bg-warm-200',
    ]);
  });
});
