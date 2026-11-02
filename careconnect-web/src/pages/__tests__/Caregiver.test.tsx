/**
 * Caregiver — the caregiver notes log (/app/caregiver): notes grouped by day,
 * newest first, and a form to add one with a priority.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { screen, within } from '@testing-library/react';
import Caregiver from '../Caregiver';
import * as mockData from '../../data/mockData';
import { renderWithProviders } from '../../test/test-utils';
import type { RenderWithProvidersOptions } from '../../test/test-utils';
import { dayFromToday, longDate, todayAt } from '../../test/caregiverFixtures';

function renderNotes(options: RenderWithProvidersOptions = {}) {
  return renderWithProviders(<Caregiver />, { route: '/app/caregiver', role: 'caregiver', ...options });
}

const addNoteButton = () => screen.getByRole('button', { name: 'Add note' });
const composeForm = () => screen.queryByRole('region', { name: 'Add a new caregiver note' });
const priorityGroup = () => within(screen.getByRole('group', { name: 'Priority' }));
const noteField = () => screen.getByRole('textbox', { name: 'Note' });
const saveButton = () => screen.getByRole('button', { name: 'Save note' });
const notesFor = (day: string) => screen.getByRole('region', { name: `Notes for ${day}` });
const notesOn = (day: string) => within(notesFor(day)).getAllByRole('article');

beforeEach(() => {
  jest.useFakeTimers({ now: todayAt('09:00') });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('notes list', () => {
  test('groups the notes by day, newest day first', () => {
    renderNotes();

    expect(screen.getByRole('heading', { level: 1, name: 'Caregiver Notes' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('region', { name: /^Notes for / }).map((section) => section.getAttribute('aria-label')),
    ).toEqual(['Notes for Today', `Notes for ${longDate('2026-06-03')}`, `Notes for ${longDate('2026-06-02')}`]);
    expect(within(notesFor('Today')).getByRole('heading', { level: 2, name: 'Today' })).toBeInTheDocument();
    expect(notesOn('Today')).toHaveLength(2);
  });

  test('each note shows who wrote it, its priority and the note', () => {
    renderNotes();

    const [note] = notesOn(longDate('2026-06-03'));
    expect(note).toHaveAccessibleName('Routine note from Maria Thompson');
    expect(within(note).getByText('Maria Thompson')).toBeInTheDocument();
    expect(within(note).getByText('Routine')).toBeInTheDocument();
    expect(within(note).getByText(/^Had a lovely video call with Mum yesterday\./)).toBeInTheDocument();
  });

  test('a medium-priority note is announced as "Note note from …"', () => {
    renderNotes();

    const [, second] = notesOn('Today');
    expect(within(second).getByText('Note')).toBeInTheDocument();
    // BUG (minor): the article name is built as `${label} note from …`
    // (Caregiver.tsx:163) and the medium priority's label is "Note"
    // (Caregiver.tsx:11), so screen readers hear "Note note from Joyce
    // Adeyemi". A label such as "Worth noting" or "Medium" would read cleanly.
    expect(second).toHaveAccessibleName('Note note from Joyce Adeyemi');
  });

  test('the notes are about "Dorothy", though the care recipient is Margaret everywhere else', () => {
    renderNotes();

    // BUG: the subtitle (Caregiver.tsx:68) and the mock notes
    // (mockData.ts:182, 189, 203) name the care recipient "Dorothy", while the
    // header ("Viewing Margaret's care plan"), the dashboard and every other
    // screen say Margaret.
    expect(screen.getByText("Daily observations for Dorothy's care team")).toBeInTheDocument();
    expect(within(notesFor('Today')).getByText(/^Good morning\. Dorothy had a restful night\./)).toBeInTheDocument();
  });

  test('yesterday’s notes are headed "Yesterday"', () => {
    jest.setSystemTime(todayAt('09:00', dayFromToday(1)));
    renderNotes();

    expect(notesOn('Yesterday')).toHaveLength(2);
    expect(screen.queryByRole('region', { name: 'Notes for Today' })).toBeNull();
  });

  test('with no notes at all it invites the first one', async () => {
    jest.replaceProperty(mockData, 'caregiverNotes', []);
    const { user } = renderNotes();

    expect(screen.getByText('No notes yet. Add the first one above.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).toBeNull();

    await user.click(addNoteButton());
    await user.type(noteField(), 'First visit went well.');
    await user.click(saveButton());

    expect(screen.queryByText('No notes yet. Add the first one above.')).toBeNull();
    expect(within(notesOn('Today')[0]).getByText('First visit went well.')).toBeInTheDocument();
  });
});

describe('adding a note', () => {
  test('"Add note" shows and hides the form it controls', async () => {
    const { user } = renderNotes();
    expect(addNoteButton()).toHaveAttribute('aria-expanded', 'false');
    expect(composeForm()).toBeNull();

    await user.click(addNoteButton());

    const form = composeForm();
    expect(form).not.toBeNull();
    expect(addNoteButton()).toHaveAttribute('aria-expanded', 'true');
    expect(addNoteButton()).toHaveAttribute('aria-controls', form?.id);
    expect(within(form as HTMLElement).getByRole('heading', { level: 2, name: 'New note' })).toBeInTheDocument();
    expect(noteField()).toBeRequired();

    await user.click(addNoteButton());

    expect(composeForm()).toBeNull();
    expect(addNoteButton()).toHaveAttribute('aria-expanded', 'false');
  });

  test('"Save note" stays disabled until something is written', async () => {
    const { user } = renderNotes();
    await user.click(addNoteButton());
    expect(saveButton()).toBeDisabled();

    await user.type(noteField(), '   ');
    expect(saveButton()).toBeDisabled();
    expect(saveButton()).toHaveAttribute('aria-disabled', 'true');

    await user.type(noteField(), 'Ate well');
    expect(saveButton()).toBeEnabled();
    expect(saveButton()).toHaveAttribute('aria-disabled', 'false');
  });

  test('the priority buttons are a single choice, Routine by default', async () => {
    const { user } = renderNotes();
    await user.click(addNoteButton());
    expect(priorityGroup().getByRole('button', { pressed: true })).toHaveAccessibleName('Routine');

    await user.click(priorityGroup().getByRole('button', { name: 'Urgent' }));

    expect(priorityGroup().getByRole('button', { pressed: true })).toHaveAccessibleName('Urgent');
    expect(priorityGroup().getByRole('button', { name: 'Routine' })).toHaveAttribute('aria-pressed', 'false');
    expect(priorityGroup().getByRole('button', { name: 'Note' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('saving puts the note at the top of today’s notes and closes the form', async () => {
    const { user } = renderNotes();
    await user.click(addNoteButton());
    await user.click(priorityGroup().getByRole('button', { name: 'Urgent' }));
    await user.type(noteField(), '  Margaret had a fall in the kitchen. No injury, but please call.  ');

    await user.click(saveButton());

    expect(composeForm()).toBeNull();
    expect(addNoteButton()).toHaveAttribute('aria-expanded', 'false');
    const today = notesOn('Today');
    expect(today).toHaveLength(3);
    expect(today[0]).toHaveAccessibleName('Urgent note from Joyce Adeyemi');
    expect(within(today[0]).getByText('Urgent')).toBeInTheDocument();
    expect(
      within(today[0]).getByText('Margaret had a fall in the kitchen. No injury, but please call.'),
    ).toBeInTheDocument();
  });

  test('after saving, the next note starts empty and Routine again', async () => {
    const { user } = renderNotes();
    await user.click(addNoteButton());
    await user.click(priorityGroup().getByRole('button', { name: 'Urgent' }));
    await user.type(noteField(), 'Needs new slippers.');
    await user.click(saveButton());

    await user.click(addNoteButton());

    expect(noteField()).toHaveValue('');
    expect(priorityGroup().getByRole('button', { pressed: true })).toHaveAccessibleName('Routine');
  });

  test('Cancel closes the form without saving; the unsaved text is kept for next time', async () => {
    const { user } = renderNotes();
    await user.click(addNoteButton());
    await user.type(noteField(), 'Half-written thought');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(composeForm()).toBeNull();
    expect(notesOn('Today')).toHaveLength(2);
    expect(screen.queryByText('Half-written thought')).toBeNull();

    await user.click(addNoteButton());
    expect(noteField()).toHaveValue('Half-written thought');
  });

  test('a new note is signed by Joyce Adeyemi, whoever is signed in', async () => {
    const { user, account } = renderNotes();
    expect(account?.name).toBe('Sam Taylor');
    await user.click(addNoteButton());
    await user.type(noteField(), 'Changed the bed linen.');

    await user.click(saveButton());

    // BUG: addNote hard-codes the author (Caregiver.tsx:47), so a note written
    // by the signed-in caregiver (Sam Taylor) is credited to Joyce Adeyemi.
    // It should use the signed-in user's name from useAuth().
    expect(notesOn('Today')[0]).toHaveAccessibleName('Routine note from Joyce Adeyemi');
    expect(screen.queryByText('Sam Taylor')).toBeNull();
  });

  test.each(['Save note', 'Cancel'])('closing the form with "%s" drops keyboard focus', async (button) => {
    const { user } = renderNotes();
    await user.click(addNoteButton());
    await user.type(noteField(), 'Short walk after lunch.');

    await user.click(screen.getByRole('button', { name: button }));

    // BUG: the focused button unmounts with the form (Caregiver.tsx:52-54,
    // 137) and nothing moves focus back, so keyboard and screen-reader users
    // are dropped to the top of the document. Focus should return to "Add
    // note" (as the Manage pages do with their Add button).
    expect(document.body).toHaveFocus();
    expect(addNoteButton()).not.toHaveFocus();
  });

  test('new notes are not kept: they are gone when the page is opened again', async () => {
    const { user, unmount } = renderNotes();
    await user.click(addNoteButton());
    await user.type(noteField(), 'Doctor changed the evening dose.');
    await user.click(saveButton());
    expect(screen.getByText('Doctor changed the evening dose.')).toBeInTheDocument();

    unmount();
    renderNotes();

    // BUG: notes live only in component state, seeded from the mock data
    // (Caregiver.tsx:37). Leaving the screen (or reloading) loses every note
    // the caregiver wrote. Medications and appointments are saved to
    // localStorage (medsStore / apptStore); notes need the same.
    expect(screen.queryByText('Doctor changed the evening dose.')).toBeNull();
    expect(notesOn('Today')).toHaveLength(2);
  });
});
