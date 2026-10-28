/**
 * The shell's own copy: the document title of every view, and the notices the
 * shell shows above every page.
 *
 * Titles follow the pattern index.html already uses, "<view> · CareConnect",
 * with the most specific part first, so a screen reader and a crowded tab strip
 * both lead with what tells two views apart (content-messages-help.md §4.7).
 */

export const TITLES = {
  home: 'Patient Today · CareConnect',
  medications: 'Medications · CareConnect',
  appointments: 'Appointments · CareConnect',
  messages: 'Messages · CareConnect',
  help: 'Help · CareConnect',
  sheet: 'Design system · CareConnect',
};

/** A conversation's title: its subject, inside Messages. */
export const threadTitle = (subject) => `${subject} · Messages · CareConnect`;

export const COMPOSE_TITLE = 'New message · Messages · CareConnect';

/**
 * Shown in the banner region under the app bar, on every page, for as long as
 * the browser refuses to store anything (private mode, a full quota). Nothing
 * is lost straight away, because the demo keeps working in memory, so this
 * says what will be lost and when. It replaces the Messages-only note in the
 * content spec (R3): marks and sends are both affected, so every page says so.
 */
export const STORAGE_BANNER =
  "Changes can't be saved on this device. Anything you mark or send will be gone when you close this page.";
