# CareConnect desktop: WCAG 2.1 Level AA conformance

Team DevIntel · SWEN 661 · reviewed Tuesday, October 13, 2026

| | |
|---|---|
| Product | CareConnect desktop (`careconnect-electron/`): Electron 44.5.1 with a React 19 renderer, on Windows 11. The renderer was also run in Chrome for the axe scans. |
| Standard | WCAG 2.1, Levels A and AA: all 50 success criteria |
| Result | **42 supported, 8 not applicable, 0 partially supported, 0 not supported** |
| Still to confirm | The NVDA run for 1.3.1, 4.1.2 and 4.1.3. Code checks and the accessibility tree support all three, and the observed speech will be added to [screen-reader-notes.md](screen-reader-notes.md). |
| Method | axe-core 4.14.0 in Chromium 153 on 18 screens and dialogs. A keyboard-only walkthrough of the built app. Reflow and text-spacing checks. 2,092 Jest tests with jest-axe. A review of each criterion against the code. Details in the [testing report](README.md). |

**Status terms.** *Supports*: the criterion is met everywhere in the app. *Not applicable*: the app has no content of the kind the criterion covers.
**Evidence links.** [axe](axe/README.md) · [keyboard](keyboard/README.md) · [layout](layout/README.md) · [accessibility trees](axe/accessibility-tree/) · [screen reader](screen-reader-notes.md)
**Fix numbers** refer to the issues table in the [testing report](README.md#issues-found-and-fixed).

## 1. Perceivable

| Criterion | Level | Status | How CareConnect meets it | Evidence |
|---|---|---|---|---|
| 1.1.1 Non-text Content | A | Supports | Icons are decorative SVGs (`aria-hidden`, `focusable="false"`) beside a text label. Every icon-only button has a text name. Avatars show initials beside the person's name and are hidden from screen readers. Report bars are decorative; their numbers are in the table. | axe `button-name` passes on every screen; [accessibility trees](axe/accessibility-tree/) |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Not applicable | No audio or video | — |
| 1.2.2 Captions (Prerecorded) | A | Not applicable | No video | — |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Not applicable | No video | — |
| 1.2.4 Captions (Live) | AA | Not applicable | No live media | — |
| 1.2.5 Audio Description (Prerecorded) | AA | Not applicable | No video | — |
| 1.3.1 Info and Relationships | A | Supports (NVDA check pending) | Structure is in the markup:<br>• landmarks: the "Workspace" navigation, main, labelled regions, the status footer<br>• one `h1` per view and headings for sections<br>• tables with `th` scope and captions<br>• `fieldset` and `legend` for Settings groups<br>• labels tied to every field<br>• listbox, option and toolbar roles<br>• `aria-describedby` linking hints and errors | axe `list`, `listitem`, `label`, `th-has-data-cells`, `td-headers-attr`, `aria-required-children`/`-parent` and `definition-list` pass; [accessibility trees](axe/accessibility-tree/); [screen reader](screen-reader-notes.md) |
| 1.3.2 Meaningful Sequence | A | Supports | Source order is reading order: navigation, toolbar, list, detail, status, matching the screen at every width. | [Tab order](keyboard/README.md#tab-order-from-launch-first-40-stops); [layout screenshots](layout/screenshots/) |
| 1.3.3 Sensory Characteristics | A | Supports | Instructions name the control or key ("Press F6", "Hold Alt", "Full name … are required"). Where Help mentions a position ("search above them"), it also names the region. | Help and form text in the app |
| 1.3.4 Orientation | AA | Supports | Nothing locks orientation, and the layout adapts to any window shape down to 320 × 256. | [layout](layout/README.md) |
| 1.3.5 Identify Input Purpose | AA | Not applicable | This criterion covers fields that collect information *about the user*. CareConnect's forms hold patient records and messages, not the clinician's own details. The patient name fields use `autocomplete="off"` so the browser never offers the clinician's own name for a patient. | `NewPatientDialog.tsx`; axe `autocomplete-valid` passes |
| 1.4.1 Use of Color | A | Supports | Colour is never the only cue:<br>• status chips are words ("Needs review")<br>• unread conversations are bold with a "New" chip<br>• errors are text with an icon<br>• switches say "On" or "Off"<br>• the shortcuts reference marks "(this computer)" in words<br>• the focus ring is a 3 px outline | [axe screenshots](axe/screenshots/) |
| 1.4.2 Audio Control | A | Not applicable | The app plays no audio. Desktop notifications use the operating system's sound settings. | — |
| 1.4.3 Contrast (Minimum) | AA | Supports | axe `color-contrast` passes on every screen. It left 23 text nodes for review, over the dialog backdrop or in scroll areas. The scan measured them against the nearest solid background, and all meet 4.5:1, or 3:1 for large text. The in-app high contrast theme passes too. | [axe: contrast measured](axe/README.md#needs-review-colour-contrast-measured); colour ratios noted in `src/renderer/src/styles/tokens.css` |
| 1.4.4 Resize text | AA | Supports | View → Zoom In, Zoom Out and Actual Size (Ctrl+=, Ctrl+- and Ctrl+0) scale the whole window. At 400% (320 CSS px) nothing is lost, which covers 200%. | `src/main/__tests__/menu.test.ts` (zoom items); [layout](layout/README.md) |
| 1.4.5 Images of Text | AA | Supports | There are no images of text. The clinic badge, keycaps and report labels are real text. | — |
| 1.4.10 Reflow | AA | Supports | All 7 views and 9 dialogs fit 320 × 256 CSS px with no sideways scrolling: the sidebar moves above the content and panes stack. Fixes 5 and 6 corrected the Reports tables, Keyboard shortcuts and Help. | [layout](layout/README.md): 16 of 16 reflow checks pass |
| 1.4.11 Non-text Contrast | AA | Supports | Measured ratios:<br>• the focus ring (#008F89) sits on a white halo: 3.97:1<br>• rings drawn inside rows sit on the row colour: at least 3.46:1<br>• field and switch borders (#7A8899): 3.61:1 on white, 3.34:1 on the page grey<br>• a switch that is on (#1A73E8): 4.51:1 on white<br>• the high contrast theme ring (black on yellow): 14.67:1 | Ratios computed from `tokens.css` with the WCAG luminance formula |
| 1.4.12 Text Spacing | AA | Supports | With line height 1.5, paragraph spacing 2, letter spacing 0.12 and word spacing 0.16 forced on, no text is cut off on any view, dialog or the skip links (fix 7). The one-line message preview in the Inbox list is shortened at normal spacing too, as a design choice. The full message is in the reading pane and in the conversation's description. | [layout](layout/README.md): 17 of 17 text-spacing checks pass |
| 1.4.13 Content on Hover or Focus | AA | Supports | No custom tooltips or hover pop-ups. When a control is unavailable, the reason is in its accessible description. The browser's own `title` tooltip also shows it; the browser controls that tooltip. Skip links appear only while focused and stay until focus leaves them. Menus open on click or keys and close with Esc. | — |

## 2. Operable

| Criterion | Level | Status | How CareConnect meets it | Evidence |
|---|---|---|---|---|
| 2.1.1 Keyboard | A | Supports | Every function works from the keyboard:<br>• toolbars and lists use arrow keys<br>• Shift+F10 or the Menu key opens context menus<br>• Alt or F10 opens the native menus<br>• Ctrl+Shift+A attaches a file<br>• Ctrl+Enter sends or saves | [keyboard](keyboard/README.md): 12 of 12 tasks with keys only |
| 2.1.2 No Keyboard Trap | A | Supports | Tab moves through all 21 stops and wraps. A dialog keeps focus inside while it is open, as modal dialogs should. Esc or Close always leaves, and focus returns to the opener. | Keyboard tasks 7 and 12; Dialog tests |
| 2.1.4 Character Key Shortcuts | A | Supports | Settings → Keyboard → "Single-key shortcuts" turns off E, N, M, R, / and the G-sequences (fix 3). They never fire while typing in a field. Ctrl/⌘ shortcuts and function keys always work. | `useKeyboardShortcuts` and `SettingsDialog` tests |
| 2.2.1 Timing Adjustable | A | Supports | Nothing in CareConnect has a time limit: no session time-out, and messages stay until replaced or dismissed. The one timed interaction is the 1.5 s wait for the second key of a G-sequence. The same views open with no timing from the sidebar, the Navigate menu and the command palette, and the sequences can be turned off. | `SEQUENCE_TIMEOUT_MS` in `useKeyboardShortcuts.ts` |
| 2.2.2 Pause, Stop, Hide | A | Supports | Nothing moves, blinks, scrolls or updates by itself. Transitions are brief. Settings → Reduce motion, or the system's reduced-motion setting, turns them off. | `base.css` (`prefers-reduced-motion`); Settings tests |
| 2.3.1 Three Flashes or Below Threshold | A | Supports | Nothing flashes. | — |
| 2.4.1 Bypass Blocks | A | Supports | Three skip links: main workspace, patient list, status. F6 and Shift+F6 move between regions, and landmarks are labelled. | axe `bypass`; keyboard tasks 1 and 2 |
| 2.4.2 Page Titled | A | Supports | The window title names the view ("Patients · CareConnect — Clinical workspace"). Each dialog is named by its heading. | axe `document-title`; `App.tsx` |
| 2.4.3 Focus Order | A | Supports | Focus moves in reading order through the regions. Dialogs take focus and return it on close. After a filter or a new record, focus lands on a sensible item. F6 returns to the last control used in each region (fix 2). | [Tab order](keyboard/README.md#tab-order-from-launch-first-40-stops); keyboard tasks 2 and 7; `regions` tests |
| 2.4.4 Link Purpose (In Context) | A | Supports | Each link names its destination and says it "opens in your browser". | axe `link-name`; Resources view and Help |
| 2.4.5 Multiple Ways | AA | Supports | Every view opens from the sidebar, the Navigate menu, G-sequences and the command palette. Patients can also be found by search. | Keyboard tasks 8 and 10 |
| 2.4.6 Headings and Labels | AA | Supports | Each view's `h1` names it, each dialog has a title, and field labels say what to enter ("Full name", "Reason for visit"). | [accessibility trees](axe/accessibility-tree/) |
| 2.4.7 Focus Visible | AA | Supports | A 3 px teal outline with a white halo shows on every focusable element. Windows High Contrast uses the system Highlight colour. | Outline recorded at every [Tab stop](keyboard/README.md#tab-order-from-launch-first-40-stops); [focus screenshots](keyboard/screenshots/) |
| 2.5.1 Pointer Gestures | A | Supports | Every pointer action is a single click. There are no multi-finger or path-based gestures. | — |
| 2.5.2 Pointer Cancellation | A | Supports | Buttons act on release (`click`). Dialog backdrops close on release, and moving off before letting go cancels (fix 4). | Dialog and palette tests |
| 2.5.3 Label in Name | A | Supports | No control overrides its visible text with an `aria-label`. Where the name adds detail, it starts with the visible words (fix 1). | axe: 57 violations before, 0 now ([before](axe/before-fixes.md), [after](axe/README.md)); computed-name tests |
| 2.5.4 Motion Actuation | A | Not applicable | Nothing responds to device motion. | — |

## 3. Understandable

| Criterion | Level | Status | How CareConnect meets it | Evidence |
|---|---|---|---|---|
| 3.1.1 Language of Page | A | Supports | `<html lang="en">` | axe `html-has-lang`, `html-lang-valid` |
| 3.1.2 Language of Parts | AA | Supports | All text is English. There are no passages in another language. | — |
| 3.2.1 On Focus | A | Supports | Focus alone never opens or submits anything. In the patient list, arrow keys select a patient and the detail pane updates beside it. That changes content, not context, and focus stays in the list. | Keyboard task 4 |
| 3.2.2 On Input | A | Supports | Changing a setting, filter or sort updates content in place and announces it. Forms submit only from their button or Ctrl+Enter. | Settings and patients tests |
| 3.2.3 Consistent Navigation | AA | Supports | The sidebar, toolbar position and status bar are the same, in the same order, on every view. | [axe screenshots](axe/screenshots/) |
| 3.2.4 Consistent Identification | AA | Supports | Each command has one name, icon and shortcut from a single table, shared by the toolbar, menus, palette and the shortcuts reference. | `src/shared/commands.ts`, `src/shared/shortcuts.ts` |
| 3.3.1 Error Identification | A | Supports | A missing or invalid field gets a text message next to it, `aria-invalid` and `aria-describedby`. Focus moves to the error summary, and the error is announced. | axe on New patient with errors showing; dialog tests |
| 3.3.2 Labels or Instructions | A | Supports | Every field has a visible label. Required fields are listed above the form and marked `required`. Hints explain what to enter where it isn't obvious. | axe `label`, `form-field-multiple-labels` |
| 3.3.3 Error Suggestion | AA | Supports | Messages say how to fix the problem: "Enter the patient's full name." "Enter a visit date that is today or later." | `newPatient.ts`, `composeModel.ts` |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Supports | CareConnect changes records, but nothing legal or financial, and nothing can be deleted. Each change goes through a dialog that checks the input and can be cancelled with Esc. Completing a task can be undone with Space. | Dialog tests |

## 4. Robust

| Criterion | Level | Status | How CareConnect meets it | Evidence |
|---|---|---|---|---|
| 4.1.1 Parsing | A | Supports | React generates the markup, and IDs are unique. W3C's 2023 erratum to WCAG 2.1 treats this criterion as always satisfied for HTML. | axe `duplicate-id-aria` |
| 4.1.2 Name, Role, Value | A | Supports (NVDA check pending) | Native controls are used wherever they exist. Custom widgets follow the ARIA patterns:<br>• listbox and option with `aria-selected`<br>• combobox with `aria-expanded` and `aria-activedescendant`<br>• `role="switch"` on checkboxes<br>• a toolbar with roving `tabindex`<br>• `aria-pressed` toggles and `aria-haspopup` menus<br>• `aria-disabled` with the reason as a description | axe `aria-*`, `button-name`, `nested-interactive` pass; computed-name tests; [accessibility trees](axe/accessibility-tree/); [screen reader](screen-reader-notes.md) |
| 4.1.3 Status Messages | AA | Supports (NVDA check pending) | Results and confirmations go to a polite live region without moving focus ("1 result", "Note added for Avery Park.", "Message sent to Morgan Chen."). Errors go to an assertive region. | Keyboard tasks 5, 6, 9, 10 and 11; Announcer tests; [screen reader](screen-reader-notes.md) |
