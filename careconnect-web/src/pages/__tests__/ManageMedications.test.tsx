/**
 * ManageMedications — the caregiver's medication editor
 * (/app/manage-medications). It adds, edits and deletes medications in the
 * shared list (medsStore → localStorage) that the care recipient's Medicines
 * screen and the caregiver dashboard read.
 */
import { describe, test, expect } from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import ManageMedications from '../ManageMedications';
import { medications as DEFAULT_MEDS } from '../../data/mockData';
import { renderWithProviders } from '../../test/test-utils';
import { medication, seedMedications, storedMedications } from '../../test/caregiverFixtures';

function renderPage() {
  return renderWithProviders(<ManageMedications />, { route: '/app/manage-medications', role: 'caregiver' });
}

const addButton = () => screen.getByRole('button', { name: 'Add new medication' });
const queryList = () => screen.queryByRole('region', { name: 'Current medications' });
const medNames = () =>
  within(screen.getByRole('region', { name: 'Current medications' }))
    .queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
const medCard = (name: string) => screen.getByRole('region', { name });

const nameField = () => screen.getByRole('textbox', { name: /^Medication name/ });
const doseField = () => screen.getByRole('textbox', { name: /^Dose/ });
const instructionsField = () => screen.getByRole('textbox', { name: /^Instructions \/ notes/ });
const timeField = (label = 'Time') => screen.getByLabelText(label);

/** The form's error summary (the inline field errors are alerts as well). */
function errorSummary(): HTMLElement {
  const summary = screen
    .queryAllByRole('alert')
    .find((alert) => alert.textContent?.startsWith('Please fix the following before saving:'));
  if (!summary) throw new Error('The error summary is not shown');
  return summary;
}

async function fillIn(
  user: UserEvent,
  { name, dose, time, instructions }: { name?: string; dose?: string; time?: string; instructions?: string },
) {
  if (name !== undefined) await user.type(nameField(), name);
  if (dose !== undefined) await user.type(doseField(), dose);
  if (time !== undefined) await user.type(timeField(), time);
  if (instructions !== undefined) await user.type(instructionsField(), instructions);
}

describe('the medication list', () => {
  test('shows every medication with its dose, times and instructions', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Manage medications' })).toBeInTheDocument();
    expect(screen.getByText("Add, edit, or remove Margaret's prescriptions")).toBeInTheDocument();
    expect(medNames()).toEqual(['Amlodipine', 'Atorvastatin', 'Sertraline', 'Vitamin D3']);

    const amlodipine = medCard('Amlodipine');
    expect(within(amlodipine).getByText('5 mg — 1 tablet')).toBeInTheDocument();
    expect(within(amlodipine).getByText('8:30 am')).toBeInTheDocument();
    expect(within(amlodipine).getByText('Take with food.')).toBeInTheDocument();
    expect(within(amlodipine).getByRole('button', { name: 'Edit Amlodipine' })).toBeInTheDocument();
    expect(within(amlodipine).getByRole('button', { name: 'Delete Amlodipine' })).toBeInTheDocument();
    expect(within(medCard('Atorvastatin')).getByText('8:00 pm')).toBeInTheDocument();
  });

  test('shows the list as last saved', () => {
    seedMedications([medication({ id: 'x1', name: 'Metformin', times: ['07:45', '19:45'] })]);
    renderPage();

    expect(medNames()).toEqual(['Metformin']);
    expect(within(medCard('Metformin')).getByText('7:45 am')).toBeInTheDocument();
    expect(within(medCard('Metformin')).getByText('7:45 pm')).toBeInTheDocument();
  });

  test('with no medications, it points to the Add button', () => {
    seedMedications([]);
    renderPage();

    expect(screen.getByText('No medications added yet')).toBeInTheDocument();
    expect(
      screen.getByText('Use the "Add medication" button above to add Margaret\'s first prescription.'),
    ).toBeInTheDocument();
    expect(medNames()).toEqual([]);
  });

  test('opens with keyboard focus on the last Delete button', () => {
    renderPage();

    // BUG: every danger Button mounts a ConfirmDialog whose "return focus to
    // the trigger when closed" effect (ConfirmDialog.tsx:95-99) also runs on
    // mount, while the dialog is closed. Each Delete button grabs focus in
    // turn and the last one keeps it, so the page opens focused on "Delete
    // Vitamin D3", one Enter away from a destructive dialog.
    expect(screen.getByRole('button', { name: 'Delete Vitamin D3' })).toHaveFocus();
  });
});

describe('adding a medication', () => {
  test('"Add medication" swaps the list for an empty form', async () => {
    const { user } = renderPage();

    await user.click(addButton());

    expect(screen.getByRole('heading', { level: 2, name: 'Add new medication' })).toBeInTheDocument();
    expect(queryList()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add new medication' })).toBeNull();
    expect(nameField()).toHaveValue('');
    expect(doseField()).toHaveValue('');
    expect(doseField()).toHaveAccessibleDescription('Include strength, form, and quantity.');
    expect(timeField()).toHaveValue('');
    expect(instructionsField()).toHaveAccessibleDescription(
      'Optional — patient-facing instructions shown on the medicines screen.',
    );
    expect(screen.getByRole('group', { name: /^Schedule times/ })).toContainElement(timeField());
    expect(screen.getByRole('button', { name: 'Add medication' })).toHaveAttribute('type', 'submit');
  });

  test('saves the new medication, lists it and stores it for the care recipient', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    await fillIn(user, {
      name: '  Metformin ',
      dose: '500 mg — 1 tablet',
      time: '07:45',
      instructions: 'Take with breakfast.',
    });
    await user.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(medNames()).toEqual(['Amlodipine', 'Atorvastatin', 'Sertraline', 'Vitamin D3', 'Metformin']);
    expect(within(medCard('Metformin')).getByText('500 mg — 1 tablet')).toBeInTheDocument();
    expect(within(medCard('Metformin')).getByText('7:45 am')).toBeInTheDocument();
    expect(within(medCard('Metformin')).getByText('Take with breakfast.')).toBeInTheDocument();

    const saved = storedMedications();
    expect(saved).toHaveLength(5);
    expect(saved?.[4]).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^med-\d+$/),
        name: 'Metformin',
        dosage: '500 mg — 1 tablet',
        times: ['07:45'],
        instructions: 'Take with breakfast.',
        taken: {},
      }),
    );
    expect(saved?.slice(0, 4)).toEqual(DEFAULT_MEDS);

    await waitFor(() => expect(addButton()).toHaveFocus());
  });

  test('instructions are optional', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    await fillIn(user, { name: 'Ibuprofen', dose: '200 mg — 1 tablet', time: '12:00' });
    await user.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(within(medCard('Ibuprofen')).getByText('12:00 pm')).toBeInTheDocument();
    expect(storedMedications()?.[4]).not.toHaveProperty('instructions');
  });

  test('takes several times a day; extra rows can be removed again', async () => {
    const { user } = renderPage();
    await user.click(addButton());
    expect(screen.queryByRole('button', { name: /^Remove time/ })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Add another scheduled time' }));
    await user.click(screen.getByRole('button', { name: 'Add another scheduled time' }));

    expect(screen.getAllByRole('button', { name: /^Remove time/ }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Remove time 1',
      'Remove time 2',
      'Remove time 3',
    ]);
    await user.type(timeField('Time 1'), '08:00');
    await user.type(timeField('Time 2'), '13:00');
    await user.type(timeField('Time 3'), '20:00');

    await user.click(screen.getByRole('button', { name: 'Remove time 2' }));

    expect(timeField('Time 1')).toHaveValue('08:00');
    expect(timeField('Time 2')).toHaveValue('20:00');
    expect(screen.queryByLabelText('Time 3')).toBeNull();

    await fillIn(user, { name: 'Paracetamol', dose: '500 mg — 2 tablets' });
    await user.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(within(medCard('Paracetamol')).getByText('8:00 am')).toBeInTheDocument();
    expect(within(medCard('Paracetamol')).getByText('8:00 pm')).toBeInTheDocument();
    expect(storedMedications()?.[4].times).toEqual(['08:00', '20:00']);
  });

  test('back to one time, the row is plain "Time" again with no Remove button', async () => {
    const { user } = renderPage();
    await user.click(addButton());
    await user.click(screen.getByRole('button', { name: 'Add another scheduled time' }));

    await user.click(screen.getByRole('button', { name: 'Remove time 1' }));

    expect(timeField('Time')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove time/ })).toBeNull();
  });

  test('blank extra time rows are left out when saving', async () => {
    const { user } = renderPage();
    await user.click(addButton());
    await fillIn(user, { name: 'Omeprazole', dose: '20 mg — 1 capsule', time: '07:00' });

    await user.click(screen.getByRole('button', { name: 'Add another scheduled time' }));
    await user.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(storedMedications()?.[4].times).toEqual(['07:00']);
  });

  test('an empty form lists what is missing and moves focus to that list', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    await user.click(screen.getByRole('button', { name: 'Add medication' }));

    const summary = errorSummary();
    expect(within(summary).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Medication name is required.',
      'Dosage is required.',
      'At least one scheduled time is required.',
    ]);
    await waitFor(() => expect(summary).toHaveFocus());

    expect(nameField()).toHaveAttribute('aria-invalid', 'true');
    expect(nameField()).toHaveAccessibleDescription('Medication name is required.');
    expect(doseField()).toHaveAttribute('aria-invalid', 'true');
    // The error replaces the hint.
    expect(doseField()).toHaveAccessibleDescription('Dosage is required.');
    expect(timeField()).toHaveAttribute('aria-invalid', 'true');
    expect(timeField()).toHaveAccessibleDescription('At least one scheduled time is required.');
    expect(instructionsField()).not.toHaveAttribute('aria-invalid');

    expect(screen.getByRole('heading', { level: 2, name: 'Add new medication' })).toBeInTheDocument();
    expect(storedMedications()).toBeNull();
  });

  test('only the missing fields are flagged', async () => {
    const { user } = renderPage();
    await user.click(addButton());
    await fillIn(user, { name: 'Ramipril' });

    await user.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(within(errorSummary()).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Dosage is required.',
      'At least one scheduled time is required.',
    ]);
    expect(nameField()).not.toHaveAttribute('aria-invalid');
    expect(doseField()).toHaveAttribute('aria-invalid', 'true');
  });

  test('once the problems are fixed it saves', async () => {
    const { user } = renderPage();
    await user.click(addButton());
    await user.click(screen.getByRole('button', { name: 'Add medication' }));
    expect(errorSummary()).toBeInTheDocument();

    await fillIn(user, { name: 'Ramipril', dose: '2.5 mg — 1 capsule', time: '09:00' });
    await user.click(screen.getByRole('button', { name: 'Add medication' }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(medNames()).toContain('Ramipril');
  });
});

describe('editing a medication', () => {
  test('"Edit" opens the form filled in with that medication', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit Atorvastatin' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Edit medication' })).toBeInTheDocument();
    expect(nameField()).toHaveValue('Atorvastatin');
    expect(doseField()).toHaveValue('20 mg — 1 tablet');
    expect(timeField()).toHaveValue('20:00');
    expect(instructionsField()).toHaveValue('Take in the evening.');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  test('"Save changes" updates it in place and keeps its id, colour and taken history', async () => {
    const { user } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Edit Atorvastatin' }));

    await user.clear(doseField());
    await user.type(doseField(), '40 mg — 1 tablet');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(medNames()).toEqual(['Amlodipine', 'Atorvastatin', 'Sertraline', 'Vitamin D3']);
    expect(within(medCard('Atorvastatin')).getByText('40 mg — 1 tablet')).toBeInTheDocument();
    expect(storedMedications()).toEqual(
      DEFAULT_MEDS.map((med) => (med.id === 'm2' ? { ...med, dosage: '40 mg — 1 tablet' } : med)),
    );
    await waitFor(() => expect(addButton()).toHaveFocus());
  });

  test('a medication saved without times or instructions opens with blank fields', async () => {
    seedMedications([medication({ id: 'x1', name: 'Salbutamol inhaler', times: [], instructions: undefined })]);
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit Salbutamol inhaler' }));

    expect(timeField()).toHaveValue('');
    expect(instructionsField()).toHaveValue('');
  });
});

describe('cancelling', () => {
  test.each(['Cancel', 'Cancel and close form'])(
    '"%s" closes the form without saving and returns focus to the Add button',
    async (cancel) => {
      const { user } = renderPage();
      await user.click(addButton());
      await fillIn(user, { name: 'Not saved' });

      await user.click(screen.getByRole('button', { name: cancel }));

      expect(medNames()).toEqual(['Amlodipine', 'Atorvastatin', 'Sertraline', 'Vitamin D3']);
      expect(storedMedications()).toBeNull();
      await waitFor(() => expect(addButton()).toHaveFocus());
    },
  );

  test('cancelling an edit leaves the medication as it was', async () => {
    const { user } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Edit Amlodipine' }));
    await user.clear(nameField());
    await user.type(nameField(), 'Renamed');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(medNames()).toContain('Amlodipine');
    expect(medNames()).not.toContain('Renamed');
  });
});

describe('deleting a medication', () => {
  test('asks for confirmation first, naming the medication', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete Sertraline' }));

    const dialog = screen.getByRole('dialog', { name: 'Delete medication' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(
      "Are you sure you want to delete Sertraline? This cannot be undone and will remove it from Margaret's medicines list.",
    );
    expect(within(dialog).getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  test.each([
    ['the Cancel button', (user: UserEvent) => user.click(screen.getByRole('button', { name: 'Cancel' }))],
    ['Escape', (user: UserEvent) => user.keyboard('{Escape}')],
  ])('%s keeps the medication', async (_how, cancel) => {
    const { user } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete Sertraline' }));

    await cancel(user);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(medNames()).toContain('Sertraline');
    expect(storedMedications()).toBeNull();
    expect(screen.getByRole('button', { name: 'Delete Sertraline' })).toHaveFocus();
  });

  test('"Yes, delete" removes it and saves the shorter list', async () => {
    const { user } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete Sertraline' }));

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(medNames()).toEqual(['Amlodipine', 'Atorvastatin', 'Vitamin D3']);
    expect(storedMedications()?.map((med) => med.id)).toEqual(['m1', 'm2', 'm4']);
  });

  test('after a delete, keyboard focus is lost', async () => {
    const { user } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete Sertraline' }));

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    // BUG: the Delete button that should get focus back (ConfirmDialog.tsx:
    // 95-99) is removed along with the medication (ManageMedications.tsx:
    // 384-386), so focus falls to <body>. It should move to a neighbouring
    // card or the Add button.
    expect(document.body).toHaveFocus();
  });

  test('deleting the last medication shows the empty list', async () => {
    seedMedications([medication({ id: 'x1', name: 'Metformin' })]);
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete Metformin' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(screen.getByText('No medications added yet')).toBeInTheDocument();
    expect(storedMedications()).toEqual([]);
  });
});

describe('labels for assistive technology', () => {
  test('required fields say "required" twice', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    // BUG: the labels already end in "(required)" (ManageMedications.tsx:193,
    // 204) and Field adds its own screen-reader-only "(required)"
    // (Field.tsx:121), so screen readers read "Medication name required
    // required" (and aria-required adds a third "required").
    expect(nameField()).toHaveAccessibleName('Medication name (required) (required)');
    expect(doseField()).toHaveAccessibleName('Dose (required) (required)');
    expect(nameField()).toBeRequired();
  });

  test('two buttons are named differently from what they show', async () => {
    const { user } = renderPage();

    // BUG (WCAG 2.5.3 Label in Name): the accessible name must contain the
    // visible label, so a speech user saying "click Add medication" can hit
    // it. "Add new medication" (ManageMedications.tsx:411) and "Add another
    // scheduled time" (ManageMedications.tsx:265) do not contain "Add
    // medication" / "Add another time".
    expect(addButton()).toHaveTextContent('Add medication');
    await user.click(addButton());
    expect(screen.getByRole('button', { name: 'Add another scheduled time' })).toHaveTextContent('Add another time');
  });
});
