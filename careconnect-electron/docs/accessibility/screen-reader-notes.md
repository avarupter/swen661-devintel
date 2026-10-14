# CareConnect desktop: screen reader testing notes

Team DevIntel · SWEN 661 · Week 9

These notes have three parts:
- the NVDA test script;
- what each step should announce;
- the observed NVDA output.

The expected speech is based on the accessibility tree Chromium builds for each screen ([axe/accessibility-tree/](axe/accessibility-tree/)). That tree is what NVDA reads.
The expected text is a prediction from the tree, not a recording. The [observed results](#observed-results) section holds what NVDA actually said.

## Setup

| | |
|---|---|
| Screen reader | NVDA on Windows 11, default settings, Speech Viewer on (NVDA menu → Tools → Speech Viewer) |
| App | The installed desktop app (`npm run dist:win`), or the same screens in Chrome at http://localhost:5173 (`npm run dev:web`) |
| Data | Synthetic demo data. The app opens on Patients with Avery Park selected. |

**Browse mode and focus mode.** CareConnect is a web document inside a desktop window, so NVDA starts in browse mode, where single letters move by element type (E for the next edit field, G for the next graphic).
NVDA switches to focus mode on its own in the patient list, the search field and form fields, so the app's single-key shortcuts (E, N, M, R, /, G then a letter) work there.
On buttons, press NVDA+Space to enter focus mode first, or use the Ctrl shortcuts, which work in both modes.
Screen reader users who don't want single-letter shortcuts can turn them off in Settings → Keyboard → Single-key shortcuts.

## Script and expected speech

| # | Keys | What CareConnect exposes (from the accessibility tree) | Expected NVDA speech, roughly |
|---|---|---|---|
| 1 | Open the app | Window title "Patients · CareConnect — Clinical workspace" | "Patients · CareConnect — Clinical workspace" |
| 2 | Tab, Tab, Tab | `link "Skip to main workspace"`, `link "Skip to patient list"`, `link "Skip to status"`. They appear on screen while one has focus. | "Skip to main workspace, link", "Skip to patient list, link", "Skip to status, link" |
| 3 | Shift+Tab, Enter | Focus moves into `listbox "Recent patients"`, on `option "Avery Park, Wellness follow-up · 10:30. Needs review" [selected]` | "Recent patients, list, Avery Park, Wellness follow-up · 10:30. Needs review, selected, 1 of 28" |
| 4 | Down arrow, Down arrow, Home | The selection moves, and the detail pane (`group "Riley Singh"`) follows. | "Morgan Chen, Care plan update · Today. Open, 2 of 28", "Riley Singh, Lab results · Yesterday. Completed, 3 of 28", then "Avery Park, … 1 of 28" |
| 5 | F6 five times, then Shift+F6 | Regions in order: the patient detail (`group "Avery Park"`), `contentinfo "Status"`, `navigation "Workspace"`, `toolbar "Patients tools"`, `listbox "Recent patients"`. F6 lands on the last control used in each region. | "Avery Park, grouping, Message Avery Park, button", "Status, content info, Keyboard help, button", "Workspace, navigation, … button", "Patients tools, tool bar, Search, button", "Recent patients, list, …"; Shift+F6 goes back to the toolbar |
| 6 | Ctrl+F, type "taylor", wait, Esc, Esc | `searchbox "Search list"`. After a 0.4 s pause the polite live region says the count, and focus stays in the field. | "Search list, edit", then "1 result". The first Esc clears the field; the second returns to the list. |
| 7 | Ctrl+K, type "pat", Down arrow, Esc | `dialog "Command palette"`. `combobox "Search commands" [expanded]`. Options such as `option "Filter patient list, Showing all patients"`, reached through `aria-activedescendant`. | "Command palette, dialog, Search commands, combo box, expanded", a result count, then "Filter patient list, Showing all patients". Esc closes the palette, and focus returns to where it was. |
| 8 | Ctrl+, then Tab, Tab, Tab, Space, Space, Esc | `dialog "Settings"`. Groups "Display", "Keyboard" and "Notifications". `switch "Single-key shortcuts" [checked]`, described by its hint. | "Settings, dialog, Display, grouping, Show shortcut hints, switch, on …". On the Keyboard switch: "Keyboard, grouping, Single-key shortcuts, switch, on, E, N, M, R, / and G-key sequences …". Space says "off", and the live region says "Single-key shortcuts off". Space again: "Single-key shortcuts on". |
| 9 | Ctrl+K, type "inb", Enter, then F6 until the conversation list, Space, R, type a reply, Ctrl+Enter | `listbox "Conversations"` with `option "Morgan Chen, Question about my care plan, 08:05"`. Then `dialog "Reply"` with `textbox "Message"`, and the status message after sending. | "Inbox · CareConnect …", "Conversations, list, Morgan Chen, Question about my care plan, 08:05", "Reply, dialog …", then "Message sent to Morgan Chen." |
| 10 | Ctrl+N, Tab to "Add patient", Enter | `dialog "New patient"`. On submit, focus moves to `alert "There are 3 problems"`, which lists links to each field. Each field is `[invalid]` and described by its error. | "New patient, dialog, Full name, edit, required". On submit: "There are 3 problems", followed by the three messages. Following the first link: "Full name, edit, invalid entry, required, Error: Enter the patient’s full name." |
| 11 | E, then Esc | `dialog "Edit care summary"`. Esc closes it and returns focus to the patient. | "Edit care summary …, dialog …", then back on "Avery Park, … selected" |

The desktop app adds three things the browser preview doesn't have:
- the native menu bar (Alt or F10);
- the tray icon;
- Windows notifications.

The operating system draws these, and NVDA reads them as standard Windows menus and toast notifications. The menu structure is listed in [keyboard/README.md](keyboard/README.md#native-menu-bar).

## What the automated tests already confirm

The NVDA run checks what is spoken. The parts that come from CareConnect's own markup are already checked in code:

- **Names and roles.** Jest computes the names of patient options, conversations, stat cards, toolbar buttons and palette options with the browser's accessible-name algorithm (`dom-accessibility-api`) and checks them against the expected text.
- **Live regions.** The keyboard walkthrough reads, in the running desktop app, the messages this script relies on:
  - "1 result" after the search;
  - "Note added for Avery Park.";
  - "Message sent to Morgan Chen.";
  - "Task marked done.";
  - "Sam Okoro added. Care ID CC-1137".

  Status messages go to the polite live region as well as the status bar. Errors go to the assertive one.
- **States.** The axe scans pass all `aria-*` rules on every screen, and the trees above show `[selected]`, `[checked]`, `[expanded]`, `[pressed]`, `[invalid]` and `[disabled]` where expected.

## Known behaviour

- In browse mode NVDA also reads the visually hidden reason next to a disabled control ("Only one clinic is available in this demo." after "Switch clinic"). The same text is the button's accessible description, so it is read in both modes. This is intended.
- Announcements are sent 50 ms after the change, and search counts after a 0.4 s pause in typing, so NVDA finishes reading the newly focused control first.
- Counts are read once, as part of the name. The sidebar's Inbox button reads "Inbox, 4 unread", not its visible text "Inbox 4 G I".

## Observed results

To be filled in from the team's NVDA run on Windows.
For each step above, paste the matching lines from the NVDA Speech Viewer log and note any difference from the expected speech.

| | |
|---|---|
| NVDA version | (from NVDA menu → Help → About) |
| Target | Installed app or Chrome at http://localhost:5173 |
| Date | |

| # | Observed speech (Speech Viewer) | Matches expected? | Notes or fixes |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |
| 11 | | | |
