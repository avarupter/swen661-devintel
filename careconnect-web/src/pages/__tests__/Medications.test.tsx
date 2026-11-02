/**
 * Medications — "Medicines" at /app/medications: today's tracker. Each
 * medicine can be marked taken or not taken; a polite status message counts
 * what is left, and every change is saved for the caregiver (dashboard
 * adherence and activity log).
 *
 * The page reads the caregiver-managed list (medsStore), so edge cases are
 * seeded with saveMedications(), exactly as ManageMedications saves them.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Medications from '../Medications';
import { appointments } from '../../data/appointmentsData';
import { getActivityLog, getMedAdherence } from '../../data/caregiverStore';
import { saveMedications } from '../../data/medsStore';
import { renderWithProviders } from '../../test/test-utils';

// Medications.tsx and mockData stamp "today" when they are imported; keep
// that date and fix the time of day (jest.config.js pins TZ=UTC).
const TODAY = appointments[0].date;
const TAKEN_KEY = 'careconnect_meds_taken';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(`${TODAY}T09:00:00Z`) });
});

afterEach(() => {
  jest.useRealTimers();
});

function renderMedications() {
  return renderWithProviders(<Medications />, { route: '/app/medications', role: 'patient' });
}

const medicineList = () => screen.getByRole('region', { name: 'Medication list' });
/** A medicine's card: an <article> named "<name> <dosage> — taken / — not yet taken". */
const medicine = (name: string) => screen.getByRole('article', { name: new RegExp(`^${name} `) });
const savedDoses = () => JSON.parse(localStorage.getItem(TAKEN_KEY) ?? 'null');

describe('the tracker', () => {
  test('is headed Medicines', () => {
    renderMedications();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Medicines');
    expect(screen.getByText("Today's medication tracker")).toBeInTheDocument();
  });

  test("lists today's medicines, saying which are taken", () => {
    renderMedications();

    const expected = [
      'Amlodipine 5 mg — 1 tablet — taken',
      'Atorvastatin 20 mg — 1 tablet — not yet taken',
      'Sertraline 50 mg — 1 tablet — taken',
      'Vitamin D3 1000 IU — 1 capsule — not yet taken',
    ];
    const cards = within(medicineList()).getAllByRole('article');
    expect(cards).toHaveLength(expected.length);
    cards.forEach((card, i) => expect(card).toHaveAccessibleName(expected[i]));
  });

  test('each medicine shows its dose, when to take it and how', () => {
    renderMedications();

    const card = medicine('Atorvastatin');
    expect(within(card).getByText('Atorvastatin')).toBeInTheDocument();
    expect(within(card).getByText('20 mg — 1 tablet')).toBeInTheDocument();
    expect(within(card).getByText('8:00 pm')).toBeInTheDocument();
    expect(within(card).getByText('Take in the evening.')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Mark Atorvastatin as taken' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(within(medicine('Amlodipine')).getByRole('button', { name: 'Mark Amlodipine as not taken' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('a polite status message says how many are still to take', () => {
    renderMedications();

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('2 medicines still to take today.');
  });

  test('ends with a safety reminder', () => {
    renderMedications();

    expect(
      screen.getByText('Always take medicines as prescribed by your doctor. If unsure, ask your carer.'),
    ).toBeInTheDocument();
  });
});

describe('marking medicines', () => {
  test('marking one as taken updates the card and the count, and tells the caregiver', async () => {
    const { user } = renderMedications();

    await user.click(screen.getByRole('button', { name: 'Mark Atorvastatin as taken' }));

    expect(medicine('Atorvastatin')).toHaveAccessibleName('Atorvastatin 20 mg — 1 tablet — taken');
    expect(screen.getByRole('button', { name: 'Mark Atorvastatin as not taken' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 medicine still to take today.');
    expect(getActivityLog()).toEqual([
      expect.objectContaining({
        kind: 'med_taken',
        label: 'Marked Atorvastatin as taken',
        timestamp: `${TODAY}T09:00:00.000Z`,
      }),
    ]);
    expect(getMedAdherence()).toMatchObject({ takenCount: 3, totalCount: 4 });
    // BUG: Medications.tsx:9-22 and 42-48 save a plain { medId: taken } map with
    // no date, and Medications.tsx:37 applies whatever it finds to today. Opened
    // on a later day, the page (and getMedAdherence, which reads the same key)
    // shows yesterday's doses as taken today — a missed-dose risk. Today.tsx
    // saves { date, ids } and drops yesterday's list; this key needs a date too.
    expect(savedDoses()).toEqual({ m1: true, m2: true, m3: true, m4: false });
  });

  test.todo("ignores doses saved on an earlier day (needs a dated careconnect_meds_taken; see the BUG above)");

  test('marking one as not taken is logged too', async () => {
    const { user } = renderMedications();

    await user.click(screen.getByRole('button', { name: 'Mark Amlodipine as not taken' }));

    expect(medicine('Amlodipine')).toHaveAccessibleName('Amlodipine 5 mg — 1 tablet — not yet taken');
    expect(screen.getByRole('button', { name: 'Mark Amlodipine as taken' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('3 medicines still to take today.');
    expect(getActivityLog()).toEqual([
      expect.objectContaining({ kind: 'med_skipped', label: 'Unmarked Amlodipine (not taken)' }),
    ]);
    expect(savedDoses()).toEqual({ m1: false, m2: false, m3: true, m4: false });
  });

  test('once every medicine is taken, says well done', async () => {
    const { user } = renderMedications();

    await user.click(screen.getByRole('button', { name: 'Mark Atorvastatin as taken' }));
    await user.click(screen.getByRole('button', { name: 'Mark Vitamin D3 as taken' }));

    expect(screen.getByRole('status')).toHaveTextContent('All medicines taken for today. Well done!');
    expect(screen.queryByRole('button', { name: /as taken$/ })).toBeNull();
    expect(getActivityLog().map((event) => event.label)).toEqual([
      'Marked Vitamin D3 as taken',
      'Marked Atorvastatin as taken',
    ]);
  });
});

describe('saved doses', () => {
  test('are restored when the page is opened again', () => {
    localStorage.setItem(TAKEN_KEY, JSON.stringify({ m1: false, m2: true }));
    renderMedications();

    expect(medicine('Amlodipine')).toHaveAccessibleName('Amlodipine 5 mg — 1 tablet — not yet taken');
    expect(medicine('Atorvastatin')).toHaveAccessibleName('Atorvastatin 20 mg — 1 tablet — taken');
    // Medicines with nothing saved keep their recorded state.
    expect(medicine('Sertraline')).toHaveAccessibleName('Sertraline 50 mg — 1 tablet — taken');
    expect(screen.getByRole('status')).toHaveTextContent('2 medicines still to take today.');
  });

  test('unreadable saved data is ignored, and replaced', () => {
    localStorage.setItem(TAKEN_KEY, 'not json');
    renderMedications();

    expect(screen.getByRole('status')).toHaveTextContent('2 medicines still to take today.');
    expect(savedDoses()).toEqual({ m1: true, m2: false, m3: true, m4: false });
  });
});

describe("the caregiver's medicine list", () => {
  test('is what the page shows, with every dose time', () => {
    saveMedications([
      {
        id: 'm9',
        name: 'Paracetamol',
        dosage: '500 mg — 2 tablets',
        times: ['08:00', '12:00', '20:00'],
        colour: 'bg-calm-200',
        taken: {},
      },
    ]);
    renderMedications();

    const card = medicine('Paracetamol');
    expect(card).toHaveAccessibleName('Paracetamol 500 mg — 2 tablets — not yet taken');
    expect(within(card).getByText('8:00 am')).toBeInTheDocument();
    expect(within(card).getByText('12:00 pm')).toBeInTheDocument();
    expect(within(card).getByText('8:00 pm')).toBeInTheDocument();
    // No instructions: the name and the dosage are its only paragraphs.
    expect(within(card).getAllByRole('paragraph').map((p) => p.textContent)).toEqual([
      'Paracetamol',
      '500 mg — 2 tablets',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('1 medicine still to take today.');
  });

  test('when it is empty, the page congratulates the patient', () => {
    saveMedications([]);
    renderMedications();

    // BUG: Medications.tsx:71-105 — with no medicines, pendingCount is 0, so the
    // status says "All medicines taken for today. Well done!" above an empty
    // list. It should say that no medicines are set up for today.
    expect(screen.getByRole('status')).toHaveTextContent('All medicines taken for today. Well done!');
    expect(within(medicineList()).queryAllByRole('listitem')).toHaveLength(0);
  });
});
