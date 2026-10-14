# axe-core scan: WCAG 2.1 Level A and AA

- Engine: axe-core 4.14.0 (the engine inside axe DevTools)
- Browser: Chromium 153.0.8010.12
- Page: http://localhost:5173/ (`npm run dev:web`, browser preview with synthetic data)
- Rules: tags wcag2a, wcag2aa, wcag21a, wcag21aa
- Viewport: 1440×900
- Run: 2026-10-14T00:17:07.322Z

| Screen or dialog | Violations | Passed rules | Needs review |
|---|---|---|---|
| Overview view | label-content-name-mismatch (6) | 24 | 0 |
| Schedule view | label-content-name-mismatch (1) | 24 | 0 |
| Patients view (Avery Park selected) | label-content-name-mismatch (14) | 33 | color-contrast (1) |
| Patients view, list searched for "riley" | label-content-name-mismatch (7) | 32 | 0 |
| Inbox view, first conversation open | label-content-name-mismatch (8) | 27 | 0 |
| Tasks view | label-content-name-mismatch (1) | 26 | 0 |
| Reports view | label-content-name-mismatch (1) | 24 | 0 |
| Resources view | label-content-name-mismatch (1) | 24 | 0 |
| Command palette (Ctrl+K), searching "pat" | label-content-name-mismatch (10) | 25 | color-contrast (7) |
| Keyboard shortcuts (Ctrl+/) | label-content-name-mismatch (1) | 27 | color-contrast (7) |
| Help (F1) | label-content-name-mismatch (1) | 22 | color-contrast (3) |
| Settings (Ctrl+,) | label-content-name-mismatch (1) | 21 | color-contrast (3) |
| New patient (Ctrl+N) after submitting it empty | label-content-name-mismatch (1) | 27 | color-contrast (3) |
| Add clinical note (N) | label-content-name-mismatch (1) | 22 | 0 |
| Edit care summary (E) | label-content-name-mismatch (1) | 23 | 0 |
| New message (Ctrl+Shift+M) | label-content-name-mismatch (1) | 23 | 0 |
| Reply in the Inbox (R) | label-content-name-mismatch (1) | 22 | 0 |

**17 screen(s) with violations.**

## Overview view

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `#nav-inbox`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `.stat-card--needs-review`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `.stat-card--open`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `.stat-card--completed`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `.stat-card--unread`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `.stat-card--tasks`: Fix any of the following:   Text inside the element is not included in the accessible name

## Schedule view

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `#nav-inbox`: Fix any of the following:   Text inside the element is not included in the accessible name

## Patients view (Avery Park selected)

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `#nav-inbox`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#toolbar-patient\.filter`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-avery-park`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-morgan-chen`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-riley-singh`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-taylor-lane`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-jamie-wu`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-alex-rivera`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-casey-morgan`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-drew-patel`: Fix any of the following:   Text inside the element is not included in the accessible name

## Patients view, list searched for "riley"

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `#nav-inbox`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#toolbar-patient\.filter`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-option-p-riley-singh`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-action-message`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#patient-action-more`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `button[aria-keyshortcuts="E"]`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `.patient-activity__add`: Fix any of the following:   Text inside the element is not included in the accessible name

## Inbox view, first conversation open

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `#nav-inbox`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#conversation-option-c-care-plan-question`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#conversation-option-c-lab-results`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#conversation-option-c-refill`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#conversation-option-c-home-monitoring`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#conversation-option-c-schedule-change`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#conversation-option-c-referral`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#inbox-reply`: Fix any of the following:   Text inside the element is not included in the accessible name

## Tasks view

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `#nav-inbox`: Fix any of the following:   Text inside the element is not included in the accessible name

## Reports view

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `#nav-inbox`: Fix any of the following:   Text inside the element is not included in the accessible name

## Resources view

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `#nav-inbox`: Fix any of the following:   Text inside the element is not included in the accessible name

## Command palette (Ctrl+K), searching "pat"

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.button--ghost`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-commands-patient-new`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-commands-patient-filter`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-commands-patient-sort`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-commands-patient-message`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-commands-patient-export`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-commands-patient-import`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-commands-patient-search`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-patients-p-drew-patel`: Fix any of the following:   Text inside the element is not included in the accessible name
  - `#_r_h_palette-destinations-navigate-patients`: Fix any of the following:   Text inside the element is not included in the accessible name

## Keyboard shortcuts (Ctrl+/)

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.button--ghost`: Fix any of the following:   Text inside the element is not included in the accessible name

## Help (F1)

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.button--ghost`: Fix any of the following:   Text inside the element is not included in the accessible name

## Settings (Ctrl+,)

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.button--ghost`: Fix any of the following:   Text inside the element is not included in the accessible name

## New patient (Ctrl+N) after submitting it empty

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.button--ghost`: Fix any of the following:   Text inside the element is not included in the accessible name

## Add clinical note (N)

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.button--ghost`: Fix any of the following:   Text inside the element is not included in the accessible name

## Edit care summary (E)

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.dialog__close`: Fix any of the following:   Text inside the element is not included in the accessible name

## New message (Ctrl+Shift+M)

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.button--ghost`: Fix any of the following:   Text inside the element is not included in the accessible name

## Reply in the Inbox (R)

- **label-content-name-mismatch** (serious): Elements must have their visible text as part of their accessible name. wcag21a, wcag253. https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=axeAPI
  - `.button--ghost`: Fix any of the following:   Text inside the element is not included in the accessible name

## Needs review (axe could not decide automatically)

- Patients view (Avery Park selected): **color-contrast**: Elements must meet minimum color contrast ratio thresholds (1 node(s)), e.g. `#patient-option-p-drew-patel > .patient-option__text > .patient-option__secondary`: Element's background color could not be determined because it's partially obscured by another element
- Command palette (Ctrl+K), searching "pat": **color-contrast**: Elements must meet minimum color contrast ratio thresholds (7 node(s)), e.g. `.palette__legend`: Element's background color could not be determined because it partially overlaps other elements
- Keyboard shortcuts (Ctrl+/): **color-contrast**: Elements must meet minimum color contrast ratio thresholds (7 node(s)), e.g. `table:nth-child(1) > tbody > tr:nth-child(7) > td:nth-child(3) > .shortcuts__key-list[aria-hidden="true"] > .shortcuts__caps > kbd:nth-child(1)`: Element content contains only non-text characters
- Help (F1): **color-contrast**: Elements must meet minimum color contrast ratio thresholds (3 node(s)), e.g. `ul[aria-label="Landmarks"] > li:nth-child(4)`: Element's background color could not be determined because it's partially obscured by another element
- Settings (Ctrl+,): **color-contrast**: Elements must meet minimum color contrast ratio thresholds (3 node(s)), e.g. `#_r_s_-hint`: Element's background color could not be determined because it partially overlaps other elements
- New patient (Ctrl+N) after submitting it empty: **color-contrast**: Elements must meet minimum color contrast ratio thresholds (3 node(s)), e.g. `legend`: Element's background color could not be determined because it's partially obscured by another element

