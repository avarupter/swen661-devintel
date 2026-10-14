# axe-core scan: WCAG 2.1 Level A and AA

- Engine: axe-core 4.14.0 (the engine inside axe DevTools)
- Browser: Chromium 153.0.8010.12
- Page: http://localhost:5173/ (`npm run dev:web`, browser preview with synthetic data)
- Rules: tags wcag2a, wcag2aa, wcag21a, wcag21aa
- Viewport: 1440×900
- Run: 2026-10-14T00:36:36.702Z

| Screen or dialog | Violations | Passed rules | Needs review |
|---|---|---|---|
| Overview view | 0 | 24 | 0 |
| Schedule view | 0 | 24 | 0 |
| Patients view (Avery Park selected) | 0 | 32 | color-contrast (1) |
| Patients view, list searched for "riley" | 0 | 31 | 0 |
| Inbox view, first conversation open | 0 | 26 | 0 |
| Tasks view | 0 | 26 | 0 |
| Reports view | 0 | 24 | 0 |
| Resources view | 0 | 24 | 0 |
| Patients view with the in-app high contrast theme (Settings) | 0 | 32 | color-contrast (1) |
| Command palette (Ctrl+K), searching "pat" | 0 | 25 | color-contrast (7) |
| Keyboard shortcuts (Ctrl+/) | 0 | 27 | color-contrast (7) |
| Help (F1) | 0 | 22 | color-contrast (3) |
| Settings (Ctrl+,) | 0 | 21 | color-contrast (3) |
| New patient (Ctrl+N) after submitting it empty | 0 | 27 | color-contrast (3) |
| Add clinical note (N) | 0 | 22 | 0 |
| Edit care summary (E) | 0 | 23 | 0 |
| New message (Ctrl+Shift+M) | 0 | 23 | 0 |
| Reply in the Inbox (R) | 0 | 22 | 0 |

**No WCAG 2.1 A/AA violations.**

## Needs review: colour contrast measured

axe could not see one solid background for these nodes (text inside a scroll container or over a dialog backdrop), so the scan measures them itself: computed text colour against the nearest opaque background.

**All 25 measured nodes meet their contrast minimum.**

| Screen | Element | Text | Colour | Background | Ratio | Minimum |
|---|---|---|---|---|---|---|
| Patients view (Avery Park selected) | `#patient-option-p-drew-patel > .patient-option__text[aria-hidden="true"] > .patient-option__secondary` | Blood pressure check · Oct 2 | rgb(71, 85, 105) | rgb(255, 255, 255) | 7.58:1 ✓ | 4.5:1 |
| Patients view with the in-app high contrast theme (Settings) | `#patient-option-p-drew-patel > .patient-option__text[aria-hidden="true"] > .patient-option__secondary` | Blood pressure check · Oct 2 | rgb(0, 0, 0) | rgb(255, 255, 255) | 21:1 ✓ | 4.5:1 |
| Command palette (Ctrl+K), searching "pat" | `.palette__legend` | ↑↓ move · Enter open | rgb(90, 107, 127) | rgb(255, 255, 255) | 5.46:1 ✓ | 4.5:1 |
| Command palette (Ctrl+K), searching "pat" | `.palette__legend > kbd:nth-child(1)` | ↑ | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Command palette (Ctrl+K), searching "pat" | `.palette__legend > kbd:nth-child(2)` | ↓ | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Command palette (Ctrl+K), searching "pat" | `#_r_t_palette-patients-p-drew-patel > .palette__option-text[aria-hidden="true"] > .palette__option-subtitle` | CC-1076 · Blood pressure check · Completed | rgb(71, 85, 105) | rgb(255, 255, 255) | 7.58:1 ✓ | 4.5:1 |
| Command palette (Ctrl+K), searching "pat" | `#_r_t_palette-listbox-destinations` | Destinations | rgb(90, 107, 127) | rgb(255, 255, 255) | 5.46:1 ✓ | 4.5:1 |
| Command palette (Ctrl+K), searching "pat" | `#_r_t_palette-destinations-navigate-patients > .palette__option-text[aria-hidden="true"] > .palette__option-title` | Open Patients | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Command palette (Ctrl+K), searching "pat" | `#_r_t_palette-destinations-navigate-patients > .palette__option-text[aria-hidden="true"] > .palette__option-subtitle` | Navigate to patient workspace | rgb(71, 85, 105) | rgb(255, 255, 255) | 7.58:1 ✓ | 4.5:1 |
| Keyboard shortcuts (Ctrl+/) | `table:nth-child(1) > tbody > tr:nth-child(7) > td:nth-child(3) > .shortcuts__key-list[aria-hidden="true"] > .shortcuts__caps > kbd:nth-child(1)` | ⇧ | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Keyboard shortcuts (Ctrl+/) | `table:nth-child(2) > tbody > tr:nth-child(1) > td:nth-child(3) > .shortcuts__key-list[aria-hidden="true"] > .shortcuts__caps > kbd:nth-child(1)` | ⌘ | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Keyboard shortcuts (Ctrl+/) | `table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(3) > .shortcuts__key-list[aria-hidden="true"] > .shortcuts__caps:nth-child(1) > kbd:nth-child(1)` | ⌘ | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Keyboard shortcuts (Ctrl+/) | `table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(3) > .shortcuts__key-list[aria-hidden="true"] > .shortcuts__caps > kbd:nth-child(1)` | ⌘ | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Keyboard shortcuts (Ctrl+/) | `table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(3) > .shortcuts__key-list[aria-hidden="true"] > .shortcuts__caps > kbd:nth-child(2)` | ⇧ | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Keyboard shortcuts (Ctrl+/) | `table:nth-child(2) > tbody > tr:nth-child(4) > th[scope="row"]` | Edit care summary | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Keyboard shortcuts (Ctrl+/) | `table:nth-child(2) > tbody > tr:nth-child(5) > th[scope="row"]` | Add clinical note | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Help (F1) | `ul[aria-label="Landmarks"] > li:nth-child(4)` | Recent patients (region): the patient list, on the Patients  | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Help (F1) | `ul[aria-label="Landmarks"] > li:nth-child(5)` | Patient list (search): the patient search, on the Patients v | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Help (F1) | `li:nth-child(6)` | Care summary (region): the selected patient’s alert and curr | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| Settings (Ctrl+,) | `#_r_18_-hint` | Shows shortcut keys beside buttons and the search field. Hol | rgb(90, 107, 127) | rgb(255, 255, 255) | 5.46:1 ✓ | 4.5:1 |
| Settings (Ctrl+,) | `.settings__system > .field__hint` | CareConnect follows the Windows contrast theme automatically | rgb(90, 107, 127) | rgb(255, 255, 255) | 5.46:1 ✓ | 4.5:1 |
| Settings (Ctrl+,) | `#_r_1b_-hint` | One notification when CareConnect opens, listing patients wi | rgb(90, 107, 127) | rgb(255, 255, 255) | 5.46:1 ✓ | 4.5:1 |
| New patient (Ctrl+N) after submitting it empty | `legend` | Status | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| New patient (Ctrl+N) after submitting it empty | `.choice:nth-child(1)` | Open | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |
| New patient (Ctrl+N) after submitting it empty | `.choice:nth-child(2)` | Needs review | rgb(15, 23, 42) | rgb(255, 255, 255) | 17.85:1 ✓ | 4.5:1 |

