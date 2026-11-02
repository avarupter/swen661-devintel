/**
 * ManageAppointments — the caregiver's appointment editor
 * (/app/manage-appointments). It adds, edits and deletes appointments in the
 * shared list (apptStore → localStorage) that the care recipient's
 * Appointments screen and the caregiver dashboard read.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import ManageAppointments from '../ManageAppointments';
import { appointments as DEFAULT_APPOINTMENTS } from '../../data/appointmentsData';
import { renderWithProviders } from '../../test/test-utils';
import {
  TODAY,
  appointment,
  dayFromToday,
  longDate,
  seedAppointments,
  storedAppointments,
  todayAt,
} from '../../test/caregiverFixtures';

function renderPage() {
  return renderWithProviders(<ManageAppointments />, { route: '/app/manage-appointments', role: 'caregiver' });
}

const addButton = () => screen.getByRole('button', { name: 'Add new appointment' });
const titles = () =>
  within(screen.getByRole('region', { name: 'All appointments' }))
    .queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);
const card = (title: string) => screen.getByRole('region', { name: title });

const titleField = () => screen.getByRole('textbox', { name: /^Appointment title/ });
const dateField = () => screen.getByLabelText(/^Date/);
const timeField = () => screen.getByLabelText(/^Time/);
const typeField = () => screen.getByRole('combobox', { name: /^Location type/ });
const placeField = () => screen.getByRole('textbox', { name: /^Location name/ });
const queryAddressField = () => screen.queryByRole('textbox', { name: 'Address' });
const caregiverField = () => screen.getByRole('textbox', { name: 'Assigned caregiver' });
const notesField = () => screen.getByRole('textbox', { name: 'Patient notes' });

interface Entry {
  title?: string;
  date?: string;
  time?: string;
  type?: string;
  place?: string;
  address?: string;
  caregiver?: string;
  notes?: string;
}

async function fillIn(user: UserEvent, entry: Entry) {
  if (entry.title !== undefined) await user.type(titleField(), entry.title);
  if (entry.date !== undefined) await user.type(dateField(), entry.date);
  if (entry.time !== undefined) await user.type(timeField(), entry.time);
  if (entry.type !== undefined) await user.selectOptions(typeField(), entry.type);
  if (entry.place !== undefined) await user.type(placeField(), entry.place);
  if (entry.address !== undefined) {
    const address = queryAddressField();
    if (!address) throw new Error('The Address field is not shown');
    await user.type(address, entry.address);
  }
  if (entry.caregiver !== undefined) await user.type(caregiverField(), entry.caregiver);
  if (entry.notes !== undefined) await user.type(notesField(), entry.notes);
}

/** The form's error summary (the inline field errors are alerts as well). */
function errorSummary(): HTMLElement {
  const summary = screen
    .queryAllByRole('alert')
    .find((alert) => alert.textContent?.startsWith('Please fix the following before saving:'));
  if (!summary) throw new Error('The error summary is not shown');
  return summary;
}

const DEFAULT_TITLES = DEFAULT_APPOINTMENTS.map((appt) => appt.title);

/** The appointment the page saved last (new ones are appended to the list). */
function lastSaved() {
  const saved = storedAppointments() ?? [];
  return saved[saved.length - 1];
}

beforeEach(() => {
  jest.useFakeTimers({ now: todayAt('09:00') });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the appointment list', () => {
  test('shows every appointment, soonest first', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Manage appointments' })).toBeInTheDocument();
    expect(screen.getByText("Add, edit, or remove Margaret's upcoming appointments")).toBeInTheDocument();
    expect(titles()).toEqual(DEFAULT_TITLES);
  });

  test('sorts by date, then time', () => {
    seedAppointments([
      appointment({ id: 'b', title: 'Later in the week', date: dayFromToday(2), time: '09:00' }),
      appointment({ id: 'a', title: 'Tomorrow afternoon', date: dayFromToday(1), time: '15:00' }),
      appointment({ id: 'c', title: 'Tomorrow morning', date: dayFromToday(1), time: '08:00' }),
    ]);
    renderPage();

    expect(titles()).toEqual(['Tomorrow morning', 'Tomorrow afternoon', 'Later in the week']);
  });

  test('each card says when and where, who is going and what to know', () => {
    renderPage();

    const today = card('Blood pressure check — Dr. Sharma');
    expect(within(today).getByText('Today')).toBeInTheDocument();
    expect(within(today).getByText(`${longDate(TODAY)} — 10:30 am`)).toHaveAttribute('datetime', `${TODAY}T10:30`);
    expect(within(today).getByText('Greenfield Surgery')).toBeInTheDocument();
    expect(within(today).getByText('— 12 Greenfield Road, Westfield')).toBeInTheDocument();
    expect(within(today).getByText('Joyce Adeyemi')).toBeInTheDocument();
    expect(within(today).getByText('is assigned')).toBeInTheDocument();
    expect(
      within(today).getByText('Joyce will collect you at 10:00. Remember to bring your medicines list with you.'),
    ).toBeInTheDocument();
    expect(within(today).getByRole('button', { name: 'Edit: Blood pressure check — Dr. Sharma' })).toBeInTheDocument();
    expect(within(today).getByRole('button', { name: 'Delete: Blood pressure check — Dr. Sharma' })).toBeInTheDocument();
  });

  test('only today’s appointments carry the "Today" badge', () => {
    renderPage();

    expect(within(card('Heart checkup — Dr. Lee')).getByText('Today')).toBeInTheDocument();
    expect(within(card('Blood test — fasting needed')).queryByText('Today')).toBeNull();
    expect(
      within(card('Blood test — fasting needed')).getByText(`${longDate(dayFromToday(1))} — 8:45 am`),
    ).toBeInTheDocument();
  });

  test('a telephone appointment with no one assigned shows just the call', () => {
    renderPage();

    const call = card('GP telephone review — Dr. Sharma');
    expect(within(call).getByText('Telephone — Dr. Sharma will call you')).toBeInTheDocument();
    expect(within(call).queryByText('is assigned')).toBeNull();
    expect(within(call).queryByText(/^—/)).toBeNull();
  });

  test('an appointment without notes has no notes box', () => {
    seedAppointments([
      appointment({ id: 'x1', title: 'Flu jab', caregiver: 'Maria Thompson' }),
      appointment({ id: 'x2', title: 'Covid booster', notes: 'Wear a short-sleeved top.' }),
    ]);
    renderPage();

    expect(within(card('Covid booster')).getByRole('paragraph')).toHaveTextContent('Wear a short-sleeved top.');
    expect(within(card('Flu jab')).getByText('Maria Thompson')).toBeInTheDocument();
    expect(within(card('Flu jab')).queryByRole('paragraph')).toBeNull();
  });

  test('with no appointments, it points to the Add button', () => {
    seedAppointments([]);
    renderPage();

    expect(screen.getByText('No appointments yet')).toBeInTheDocument();
    expect(
      screen.getByText('Use the "Add appointment" button above to schedule Margaret\'s first visit.'),
    ).toBeInTheDocument();
    expect(titles()).toEqual([]);
  });

  test('opens with keyboard focus on the last Delete button', () => {
    renderPage();

    // BUG: ConfirmDialog's "return focus to the trigger when closed" effect
    // (ConfirmDialog.tsx:95-99) also runs on mount, so each row's Delete
    // button grabs focus in turn and the last one keeps it.
    expect(screen.getByRole('button', { name: 'Delete: Annual health review — Dr. Sharma' })).toHaveFocus();
  });
});

describe('adding an appointment', () => {
  test('"Add appointment" swaps the list for an empty form', async () => {
    const { user } = renderPage();

    await user.click(addButton());

    expect(screen.getByRole('heading', { level: 2, name: 'Add new appointment' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'All appointments' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add new appointment' })).toBeNull();
    expect(titleField()).toHaveValue('');
    expect(titleField()).toHaveAccessibleDescription('Use plain language Margaret will recognise.');
    expect(dateField()).toHaveValue('');
    expect(dateField()).toHaveAttribute('min', TODAY);
    expect(timeField()).toHaveValue('');
    expect(screen.getByRole('group', { name: 'Location' })).toContainElement(typeField());
    expect(within(typeField()).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Select type…',
      'Clinic visit',
      'Hospital visit',
      'Telephone — no travel needed',
      'Home visit — they come to you',
    ]);
    expect(typeField()).toHaveValue('');
    expect(placeField()).toHaveValue('');
    expect(queryAddressField()).toBeNull();
    expect(caregiverField()).toHaveAccessibleDescription(
      "Optional — shown to Margaret as 'Joyce is taking you to this appointment'.",
    );
    expect(notesField()).toHaveAccessibleDescription(
      'Optional — shown in plain language on the patient appointments screen.',
    );
    expect(screen.getByRole('button', { name: 'Add appointment' })).toHaveAttribute('type', 'submit');
  });

  test('offers an address for places to travel to, but not for a telephone call', async () => {
    const { user } = renderPage();
    await user.click(addButton());
    expect(placeField()).toHaveAttribute('placeholder', 'e.g. Greenfield Surgery');

    await user.selectOptions(typeField(), 'Clinic visit');
    expect(queryAddressField()).toHaveAccessibleDescription(
      "Optional — used for the 'Get directions' button on the patient screen.",
    );

    await user.selectOptions(typeField(), 'Telephone — no travel needed');
    expect(queryAddressField()).toBeNull();
    expect(placeField()).toHaveAttribute('placeholder', 'e.g. Telephone — Dr. Sharma will call you');

    await user.selectOptions(typeField(), 'Home visit — they come to you');
    expect(queryAddressField()).toBeInTheDocument();
  });

  test('saves the new appointment in date order and stores it for the care recipient', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    await fillIn(user, {
      title: '  Dentist — check-up ',
      date: dayFromToday(2),
      time: '09:15',
      type: 'Clinic visit',
      place: 'Smile Dental',
      address: '1 Market Street, Westfield',
      caregiver: 'Maria Thompson',
      notes: 'Bring your denture case.',
    });
    await user.click(screen.getByRole('button', { name: 'Add appointment' }));

    expect(titles()).toEqual([...DEFAULT_TITLES.slice(0, 3), 'Dentist — check-up', ...DEFAULT_TITLES.slice(3)]);
    const added = card('Dentist — check-up');
    expect(within(added).getByText(`${longDate(dayFromToday(2))} — 9:15 am`)).toBeInTheDocument();
    expect(within(added).getByText('Smile Dental')).toBeInTheDocument();
    expect(within(added).getByText('— 1 Market Street, Westfield')).toBeInTheDocument();
    expect(within(added).getByText('Maria Thompson')).toBeInTheDocument();
    expect(within(added).getByText('Bring your denture case.')).toBeInTheDocument();

    expect(storedAppointments()).toHaveLength(DEFAULT_APPOINTMENTS.length + 1);
    expect(lastSaved()).toEqual({
      id: expect.stringMatching(/^appt-\d+$/),
      title: 'Dentist — check-up',
      date: dayFromToday(2),
      time: '09:15',
      location: { name: 'Smile Dental', address: '1 Market Street, Westfield', type: 'clinic' },
      caregiver: 'Maria Thompson',
      notes: 'Bring your denture case.',
      isInMyDay: false,
    });

    await waitFor(() => expect(addButton()).toHaveFocus());
  });

  test('the optional details can be left out', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    await fillIn(user, {
      title: 'Pharmacist call',
      date: dayFromToday(1),
      time: '16:00',
      type: 'Telephone — no travel needed',
      place: 'Telephone — the pharmacist will call',
    });
    await user.click(screen.getByRole('button', { name: 'Add appointment' }));

    expect(within(card('Pharmacist call')).queryByText('is assigned')).toBeNull();
    expect(lastSaved()).toEqual({
      id: expect.any(String),
      title: 'Pharmacist call',
      date: dayFromToday(1),
      time: '16:00',
      location: { name: 'Telephone — the pharmacist will call', type: 'telephone' },
      isInMyDay: false,
    });
  });

  test('an empty form lists what is missing and moves focus to that list', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    await user.click(screen.getByRole('button', { name: 'Add appointment' }));

    const summary = errorSummary();
    expect(within(summary).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Appointment title is required.',
      'Date is required.',
      'Time is required.',
      'Location name is required.',
      'Location type is required.',
    ]);
    await waitFor(() => expect(summary).toHaveFocus());

    expect(titleField()).toHaveAttribute('aria-invalid', 'true');
    // The error replaces the hint.
    expect(titleField()).toHaveAccessibleDescription('Appointment title is required.');
    expect(dateField()).toHaveAttribute('aria-invalid', 'true');
    expect(dateField()).toHaveAccessibleDescription('Date is required.');
    expect(timeField()).toHaveAttribute('aria-invalid', 'true');
    expect(timeField()).toHaveAccessibleDescription('Time is required.');
    expect(typeField()).toHaveAttribute('aria-invalid', 'true');
    expect(typeField()).toHaveAccessibleDescription('Location type is required.');
    expect(placeField()).toHaveAttribute('aria-invalid', 'true');
    expect(placeField()).toHaveAccessibleDescription('Location name is required.');
    expect(caregiverField()).not.toHaveAttribute('aria-invalid');

    expect(storedAppointments()).toBeNull();
  });

  test('only the missing fields are flagged, and fixing them lets it save', async () => {
    const { user } = renderPage();
    await user.click(addButton());
    await fillIn(user, { title: 'Chiropodist', date: dayFromToday(6), time: '11:30' });

    await user.click(screen.getByRole('button', { name: 'Add appointment' }));

    expect(within(errorSummary()).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Location name is required.',
      'Location type is required.',
    ]);
    expect(titleField()).not.toHaveAttribute('aria-invalid');

    await fillIn(user, { type: 'Home visit — they come to you', place: 'At home' });
    await user.click(screen.getByRole('button', { name: 'Add appointment' }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(titles()).toContain('Chiropodist');
  });

  test('a date in the past is accepted', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    await fillIn(user, {
      title: 'Already happened',
      date: '2020-01-01',
      time: '10:00',
      type: 'Clinic visit',
      place: 'Greenfield Surgery',
    });
    await user.click(screen.getByRole('button', { name: 'Add appointment' }));

    // BUG: the date field's min={todayStr()} (ManageAppointments.tsx:304) is
    // never enforced: the form is noValidate (line 283) and validate()
    // (lines 93-101) only checks that a date was given. A 2020 appointment is
    // saved and goes to the top of the list (and onto the patient's screen).
    expect(screen.queryByRole('alert')).toBeNull();
    expect(titles()[0]).toBe('Already happened');
    expect(lastSaved().date).toBe('2020-01-01');
  });

  test('a telephone appointment keeps an address typed before the type was changed', async () => {
    const { user } = renderPage();
    await user.click(addButton());
    await fillIn(user, {
      title: 'Hospital follow-up call',
      date: dayFromToday(4),
      time: '10:00',
      type: 'Hospital visit',
      address: '45 Hospital Way, Westfield',
    });

    await user.selectOptions(typeField(), 'Telephone — no travel needed');
    expect(queryAddressField()).toBeNull();
    await user.type(placeField(), 'Telephone — the ward will call');
    await user.click(screen.getByRole('button', { name: 'Add appointment' }));

    // BUG: choosing Telephone hides the Address field (ManageAppointments.tsx:
    // 362) but formToAppt still saves the address typed earlier (line 111).
    // The telephone call is listed with a street address, here and on the
    // care recipient's Appointments screen. Clear the address (or ignore it)
    // for telephone appointments.
    expect(within(card('Hospital follow-up call')).getByText('— 45 Hospital Way, Westfield')).toBeInTheDocument();
    expect(lastSaved().location).toEqual({
      name: 'Telephone — the ward will call',
      address: '45 Hospital Way, Westfield',
      type: 'telephone',
    });
  });
});

describe('editing an appointment', () => {
  test('"Edit" opens the form filled in with that appointment', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit: Heart checkup — Dr. Lee' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Edit appointment' })).toBeInTheDocument();
    expect(titleField()).toHaveValue('Heart checkup — Dr. Lee');
    expect(dateField()).toHaveValue(TODAY);
    expect(timeField()).toHaveValue('14:30');
    expect(typeField()).toHaveDisplayValue('Hospital visit');
    expect(placeField()).toHaveValue('City Heart Clinic');
    expect(queryAddressField()).toHaveValue('45 Hospital Way, Westfield');
    expect(caregiverField()).toHaveValue('Maria Thompson');
    expect(notesField()).toHaveValue('Your daughter Maria will drive you. Allow 20 minutes travel time from home.');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  test('a telephone appointment opens with no address field', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit: GP telephone review — Dr. Sharma' }));

    expect(typeField()).toHaveDisplayValue('Telephone — no travel needed');
    expect(queryAddressField()).toBeNull();
    expect(caregiverField()).toHaveValue('');
  });

  test('"Save changes" updates it in place, keeping its id and its place in My Day', async () => {
    const { user } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Edit: Heart checkup — Dr. Lee' }));

    await user.clear(timeField());
    await user.type(timeField(), '15:00');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(within(card('Heart checkup — Dr. Lee')).getByText(`${longDate(TODAY)} — 3:00 pm`)).toBeInTheDocument();
    expect(storedAppointments()).toEqual(
      DEFAULT_APPOINTMENTS.map((appt) => (appt.id === 'a2' ? { ...appt, time: '15:00' } : appt)),
    );
    await waitFor(() => expect(addButton()).toHaveFocus());
  });
});

describe('cancelling', () => {
  test.each(['Cancel', 'Cancel and close form'])(
    '"%s" closes the form without saving and returns focus to the Add button',
    async (cancel) => {
      const { user } = renderPage();
      await user.click(addButton());
      await fillIn(user, { title: 'Not saved' });

      await user.click(screen.getByRole('button', { name: cancel }));

      expect(titles()).toEqual(DEFAULT_TITLES);
      expect(storedAppointments()).toBeNull();
      await waitFor(() => expect(addButton()).toHaveFocus());
    },
  );
});

describe('deleting an appointment', () => {
  test('asks for confirmation first, naming the appointment', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete: Eye test — routine annual check' }));

    const dialog = screen.getByRole('dialog', { name: 'Delete appointment' });
    expect(dialog).toHaveAccessibleDescription(
      'Are you sure you want to delete "Eye test — routine annual check"? This cannot be undone.',
    );
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  test('Cancel keeps the appointment and returns focus to its Delete button', async () => {
    const { user } = renderPage();
    const del = screen.getByRole('button', { name: 'Delete: Eye test — routine annual check' });
    await user.click(del);

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(titles()).toEqual(DEFAULT_TITLES);
    expect(del).toHaveFocus();
  });

  test('"Yes, delete" removes it and saves the shorter list', async () => {
    const { user } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete: Eye test — routine annual check' }));

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(titles()).toEqual(DEFAULT_TITLES.filter((title) => title !== 'Eye test — routine annual check'));
    expect(storedAppointments()?.map((appt) => appt.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a8']);
  });

  test('after a delete, keyboard focus is lost', async () => {
    const { user } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete: Eye test — routine annual check' }));

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    // BUG: as on Manage medications, the Delete button that should get focus
    // back (ConfirmDialog.tsx:95-99) is removed along with the appointment
    // (ManageAppointments.tsx:527-529), so focus falls to <body>.
    expect(document.body).toHaveFocus();
  });

  test('deleting the only appointment shows the empty list', async () => {
    seedAppointments([appointment({ id: 'x1', title: 'Flu jab' })]);
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete: Flu jab' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(screen.getByText('No appointments yet')).toBeInTheDocument();
    expect(storedAppointments()).toEqual([]);
  });
});

describe('labels for assistive technology', () => {
  test('required fields say "required" twice', async () => {
    const { user } = renderPage();
    await user.click(addButton());

    // BUG: the labels already end in "(required)" (ManageAppointments.tsx:289,
    // 301, 310, 327, 349) and Field / SelectField add their own
    // screen-reader-only "(required)" (Field.tsx:121,
    // ManageAppointments.tsx:176).
    expect(titleField()).toHaveAccessibleName('Appointment title (required) (required)');
    expect(dateField()).toHaveAccessibleName('Date (required) (required)');
    expect(timeField()).toHaveAccessibleName('Time (required) (required)');
    expect(typeField()).toHaveAccessibleName('Location type (required) (required)');
    expect(placeField()).toHaveAccessibleName('Location name (required) (required)');
  });

  test('the Add button is named differently from what it shows', () => {
    renderPage();

    // BUG (WCAG 2.5.3 Label in Name): "Add new appointment"
    // (ManageAppointments.tsx:560) does not contain the visible "Add
    // appointment", so the speech command "click Add appointment" can miss it.
    expect(addButton()).toHaveTextContent('Add appointment');
  });
});
