import {
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  getMedications,
  saveMedications,
  pickColour,
} from '../medsStore.ts';


describe('medsStore', () => {

  beforeEach(() => {
    localStorage.clear();
  });


  it('returns default medications when storage is empty', () => {
    const result = getMedications();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });


  it('returns stored medications', () => {
    const meds = [
      {
        id: 'med-test',
        name: 'Test Medicine',
        dosage: '10 mg',
        times: ['08:00'],
        taken: {},
      },
    ];

    localStorage.setItem(
      'careconnect_medications_list',
      JSON.stringify(meds),
    );

    expect(getMedications()).toEqual(meds);
  });


  it('falls back to defaults for malformed storage', () => {
    localStorage.setItem(
      'careconnect_medications_list',
      '{invalid',
    );

    const result = getMedications();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });


  it('saves medications', () => {
    const meds = [
      {
        id: 'saved',
        name: 'Saved Medicine',
        dosage: '5 mg',
        times: ['12:00'],
        taken: {},
      },
    ];

    saveMedications(meds);

    expect(
      JSON.parse(
        localStorage.getItem(
          'careconnect_medications_list',
        ),
      ),
    ).toEqual(meds);
  });


  it('cycles medication colours', () => {
    expect(pickColour(0)).toBe('bg-calm-200');
    expect(pickColour(1)).toBe('bg-warm-200');
    expect(pickColour(5)).toBe('bg-neutral-200');
    expect(pickColour(6)).toBe('bg-calm-200');
  });

});