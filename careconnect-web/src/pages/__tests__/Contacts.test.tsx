/**
 * Contacts — /app/contacts: the people who help the care recipient, with
 * emergency contacts first and a one-tap call link for each.
 */
import { describe, test, expect, jest } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Contacts from '../Contacts';
import * as mockData from '../../data/mockData';
import { renderWithProviders } from '../../test/test-utils';

function renderContacts() {
  return renderWithProviders(<Contacts />, { route: '/app/contacts', role: 'patient' });
}

/** The contact cards (articles named "<name>, <role>") in a section. */
function contactsIn(section: string) {
  return within(screen.getByRole('region', { name: section })).getAllByRole('article');
}

function expectNames(cards: HTMLElement[], names: string[]) {
  expect(cards).toHaveLength(names.length);
  cards.forEach((card, i) => expect(card).toHaveAccessibleName(names[i]));
}

describe('the contact list', () => {
  test('is headed Contacts', () => {
    renderContacts();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Contacts');
    expect(screen.getByText('People who are here to help you')).toBeInTheDocument();
  });

  test('puts the emergency contacts first', () => {
    renderContacts();

    const emergency = screen.getByRole('region', { name: 'Emergency contacts' });
    expect(within(emergency).getByRole('heading', { level: 2 })).toHaveTextContent('Emergency contacts');
    expectNames(contactsIn('Emergency contacts'), [
      'Maria Thompson, Family',
      'Joyce Adeyemi, Carer',
      'Emergency Services, Emergency',
    ]);
    expectNames(screen.getAllByRole('region'), ['Emergency contacts', 'Other contacts']);
  });

  test('lists everyone else under Other contacts', () => {
    renderContacts();

    const others = screen.getByRole('region', { name: 'Other contacts' });
    expect(within(others).getByRole('heading', { level: 2 })).toHaveTextContent('Other contacts');
    expectNames(contactsIn('Other contacts'), ['Dr. Priya Sharma, Doctor', 'Tom Thompson, Family']);
  });

  test.each([
    ['Maria Thompson', 'Family', 'Your daughter. Calls every Tuesday and Sunday.', '07700 900 123', 'tel:07700900123'],
    ['Joyce Adeyemi', 'Carer', 'Your daytime carer. Visits Monday to Friday, 9am–1pm.', '07700 900 456', 'tel:07700900456'],
    ['Emergency Services', 'Emergency', 'Call 999 for police, fire, or ambulance.', '999', 'tel:999'],
    ['Dr. Priya Sharma', 'Doctor', 'Your GP at the Greenfield Surgery. Call for appointments.', '01234 567 890', 'tel:01234567890'],
    ['Tom Thompson', 'Family', "Maria's husband. Can help in emergencies.", '07700 900 789', 'tel:07700900789'],
  ])('%s (%s) can be called with one tap', (name, role, note, phone, href) => {
    renderContacts();

    const card = screen.getByRole('article', { name: `${name}, ${role}` });
    expect(within(card).getByText(name)).toBeInTheDocument();
    expect(within(card).getByText(role)).toBeInTheDocument();
    expect(within(card).getByRole('paragraph')).toHaveTextContent(note);

    const call = within(card).getByRole('link', { name: `Call ${name} on ${phone}` });
    // The dialled number has its spaces removed.
    expect(call).toHaveAttribute('href', href);
    // The link shows the number on wide screens and "Call" on narrow ones.
    expect(within(call).getByText(phone)).toBeInTheDocument();
    expect(within(call).getByText('Call')).toBeInTheDocument();
  });

  test('a contact without a note shows just their name and role', () => {
    jest.replaceProperty(mockData, 'contacts', [
      {
        id: 'x1',
        name: 'Dr. Ade Lee',
        role: 'doctor',
        phone: '01234 000 111',
        avatarInitials: 'AL',
        avatarColour: 'bg-warm-600',
        isEmergency: false,
      },
    ]);
    renderContacts();

    const card = screen.getByRole('article', { name: 'Dr. Ade Lee, Doctor' });
    expect(within(card).getByText('Dr. Ade Lee')).toBeInTheDocument();
    expect(within(card).getByText('Doctor')).toBeInTheDocument();
    expect(within(card).queryByRole('paragraph')).toBeNull(); // no note
    expect(within(card).getByRole('link', { name: 'Call Dr. Ade Lee on 01234 000 111' })).toHaveAttribute(
      'href',
      'tel:01234000111',
    );
  });

  test('with no contacts, both headings stand over empty lists', () => {
    jest.replaceProperty(mockData, 'contacts', []);
    renderContacts();

    // BUG: (minor) Contacts.tsx:28-55 has no empty state, so an empty group is a
    // heading over an empty list ("list, 0 items" in a screen reader). It cannot
    // happen while contacts are static mock data; if they become editable, say
    // e.g. "No emergency contacts yet — ask your caregiver to add one."
    for (const section of ['Emergency contacts', 'Other contacts']) {
      const region = screen.getByRole('region', { name: section });
      expect(within(region).getByRole('list')).toBeInTheDocument();
      expect(within(region).queryAllByRole('listitem')).toHaveLength(0);
    }
  });
});
