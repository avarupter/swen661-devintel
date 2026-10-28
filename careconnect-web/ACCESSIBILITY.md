# CareConnect — Accessibility Documentation

**SWEN 661 — Human Factors in Software Development**

This document describes the semantic HTML and ARIA patterns implemented in CareConnect,
and maps the app's features to the WCAG 2.1 Level A / AA success criteria they satisfy.
Every pattern described here is taken from the current source code; file references are
given so each claim can be traced back to the implementation.

CareConnect is a daily-companion app for **care recipients** (people who benefit from a
clear, low-pressure view of their day — including those living with short-term memory
loss) and their **caregivers**. Accessibility is therefore not an add-on but a core design
constraint: the primary user may have low vision, reduced dexterity, and impaired recall.

---

## 1. Landmark Structure

Every screen is built from HTML5 landmark regions so screen-reader users can jump directly
to the part they need. Two distinct shells exist: the **public shell** (marketing / auth)
and the **app shell** (the authenticated experience in `src/components/Layout.tsx`).

### 1.1 App shell — patient and caregiver (`src/components/Layout.tsx`)

The authenticated layout renders, in DOM order:

| Order | Element | Landmark / role | How it is labeled |
|------:|---------|-----------------|-------------------|
| 1 | `<a class="skip-link">` | — (first focusable) | Visible text "Skip to main content", targets `#main-content` |
| 2 | `<header role="banner">` | `banner` | Implicit; sticky orientation bar (logo, role pill, controls, date/time, greeting, screen title) |
| 3 | `<main id="main-content" tabindex="-1" aria-label="Main content">` | `main` | `aria-label="Main content"` |
| 4 | `<nav aria-label="Main navigation">` | `navigation` | `aria-label="Main navigation"` |
| 5 | `<footer role="contentinfo">` | `contentinfo` | Implicit (desktop only, `hidden lg:block`) |

- The **patient** navigation is a fixed bottom nav (`<nav aria-label="Main navigation">`),
  rendered after `<main>` in the DOM so the keyboard focus order is content-first.
- The **caregiver** navigation is the same labeled landmark, rendered as a left sidebar on
  desktop (`lg:order-1`, visually left) while remaining **after** `<main>` (`lg:order-2`)
  in source order — see the comments in `Layout.tsx` ("tab stop #3 / #4"). This keeps the
  reading/focus order logical (main content before navigation) while the layout reads
  left-to-right visually.
- `<main>` carries `tabindex="-1"` so the skip link can move focus to it programmatically.

### 1.2 Regions inside `<main>`

Page content is divided into labeled regions rather than anonymous `<div>`s:

- Pages use `<section aria-label="…">` or `<section aria-labelledby="…">` for each block
  (e.g. `src/pages/Today.tsx` — `aria-label="Next thing to do"`, `aria-labelledby="later-heading"`,
  `aria-labelledby="actions-heading"`).
- The reusable **Card** component (`src/components/Card.tsx`) renders a
  `<section aria-label={heading}>`, so every card is a self-contained, named region with a
  real heading element inside it.
- The caregiver **Alerts** block (`src/pages/CaregiverDashboard.tsx`) is an explicit
  `role="region"` with `aria-label="Alerts"` **and** a live region (see §3.1).
- Lists use `<ul role="list">` / `<ol role="list">` with `list-none` so the list semantics
  survive the CSS reset (Safari/VoiceOver drops list role when `list-style: none`).

### 1.3 Public shell — landing page (`src/pages/Landing.tsx`)

| Element | Landmark | Label |
|---------|----------|-------|
| `<a class="skip-link">` | — | "Skip to main content" → `#main-content` |
| `<header role="banner">` | `banner` | Contains `<nav aria-label="Account navigation">` (Sign in / Sign up) |
| `<main id="main-content" tabindex="-1" aria-label="Main content">` | `main` | `aria-label="Main content"` |
| `<section aria-labelledby="hero-heading">` … | regions | Each marketing section labeled by its own heading id (`hero-heading`, `features-heading`, `audiences-heading`, `cta-heading`) |
| `<footer role="contentinfo">` | `contentinfo` | Implicit |
| `<ChatBot>` | `dialog` (when open) | Floating assistant, labeled by its panel heading |

### 1.4 Auth screens (`src/pages/SignIn.tsx`, `SignUp.tsx`)

- `<header role="banner">` with a logo link (`aria-label="CareConnect home"`).
- `<main id="main-content" aria-label="Sign in">` containing the form card.
- The form region itself is described in §3.3.

---

## 2. Heading Outline (h1–h3)

Headings are nested without skipping levels. There is exactly **one `<h1>` per screen**.
Global heading styles live in `src/index.css` (`h1`→`text-3xl`, `h2`→`text-2xl`, `h3`→`text-xl`).

### 2.1 Patient "Today" screen (`src/pages/Today.tsx`)

```
h1  Here's your day, Margaret
├─ h2  Later today                     (id="later-heading")
│   ├─ h3  [schedule item label]       (one per RemainingCard, via Card headingLevel={3})
│   ├─ h3  [schedule item label]
│   └─ …
└─ h2  Quick actions                   (id="actions-heading")
```

Notes:
- The featured "Next thing to do" card uses styled `<p>` text rather than a heading, so it
  does not introduce a competing top-level heading; the item title is conveyed by the
  surrounding `<section aria-label="Next thing to do">`.
- The "Checked in" confirmation is a `Banner` (a live status region, §3.1), not a heading.

### 2.2 Caregiver "Dashboard" screen (`src/pages/CaregiverDashboard.tsx`)

```
h1  Dashboard
├─ h2  Margaret's status today          (Card headingLevel={2})
├─ h2  Alerts                           (with alert count badge)
├─ h2  Recent activity                  (id="activity-heading")
└─ h2  Quick links                      (id="quicklinks-heading")
```

The status summary's three sub-tiles (Medications / Check-in / Next appointment) use
`<span>` labels rather than headings, keeping the outline flat and scannable — a single
level of `<h2>` sections under the page `<h1>`.

---

## 3. ARIA Patterns

### 3.1 Live regions — `status` (polite) vs `alert` (assertive)

The distinction is centralized in the **Banner** component (`src/components/Banner.tsx`):

| Variant | `role` | `aria-live` | Intent |
|---------|--------|-------------|--------|
| `info`, `success`, `warning` | `status` | `polite` | Announced after current speech finishes — non-interrupting confirmations (e.g. "Checked in") |
| `error` | `alert` | `assertive` | Announced immediately, interrupts speech — used only for blocking errors |

All banners set `aria-atomic="true"` so the entire message is re-read on change.

Other live regions in the app:

- **Medication status summary** (`src/pages/Medications.tsx`): `role="status" aria-live="polite"`
  announces "N medicines still to take" / "All medicines taken" as the count changes.
- **Schedule all-done state** (`src/pages/Schedule.tsx`): `role="status" aria-live="polite"`.
- **Caregiver Alerts** (`src/pages/CaregiverDashboard.tsx`): `role="region" aria-label="Alerts"`
  with `aria-live="polite"` and `aria-atomic="false"` so newly added alerts are announced
  without re-reading the whole list.
- **Chat transcript** (`src/components/ChatBot.tsx`): a visually hidden
  `aria-live="polite" aria-relevant="additions"` region announces each new assistant reply;
  the typing indicator is `role="status" aria-label="Assistant is typing"`.
- **Form error summary** (`src/pages/SignIn.tsx` / `SignUp.tsx`): `role="alert"
  aria-live="assertive" aria-atomic="true"` — see §3.3.

This is the basis for **4.1.3 Status Messages**: status changes are exposed without moving
focus.

### 3.2 Modal dialog — `ConfirmDialog` (`src/components/ConfirmDialog.tsx`)

The confirmation dialog implements the full WAI-ARIA modal dialog pattern:

- **Role & modality**: `role="dialog"` with `aria-modal="true"`.
- **Accessible name & description**: `aria-labelledby` points to the `<h2>` title id;
  `aria-describedby` points to the description paragraph id (omitted when there is no
  description). Ids are generated per-instance to avoid collisions.
- **Focus management on open**: focus is moved to the first tabbable element inside the
  dialog (`firstFocusable?.focus()`).
- **Focus trap**: a `keydown` handler cycles `Tab` / `Shift+Tab` between the first and last
  tabbable elements so focus cannot leave the dialog while it is open.
- **Dismissal**: `Escape` calls `onCancel`; the backdrop (`role="presentation"`) closes on
  outside click; an explicit "Close dialog" button (`aria-label`) is provided.
- **Focus restoration**: on close, focus returns to the triggering button via `triggerRef`.
- **Background inertness**: `document.body.style.overflow` is locked while open; the dark
  overlay is `aria-hidden="true"`.

This dialog is invoked automatically by the `danger` variant of the **Button** component
(`src/components/Button.tsx`), so every destructive action is gated behind a confirm step.

> The **ChatBot** panel also uses `role="dialog"` + `aria-labelledby`, but is intentionally
> **non-modal** (no focus trap — the user may `Tab` out freely; `Escape` closes and focus
> returns to the launcher). The launcher exposes `aria-expanded` and `aria-controls`.

### 3.3 Form error pattern (`src/components/Field.tsx`, `src/pages/SignIn.tsx`)

The reusable **Field** component wires labels, hints, and errors together:

- **Always-visible label**: `<label htmlFor={inputId}>` — never a placeholder-only field.
  Required fields show a visual `*` (`aria-hidden`) plus a screen-reader-only "(required)"
  and `aria-required="true"`.
- **Invalid state**: when an `error` is present, the input gets `aria-invalid="true"` and a
  red 2px border (color is not the only signal).
- **Programmatic association**: `aria-describedby` is built from whichever of the hint id and
  error id exist, so assistive tech reads the helper text and the error with the field.
- **Inline error**: the error message renders as `<p role="alert">` directly below the field
  (not as a tooltip), prefixed by an `aria-hidden` "!" with the text available to readers.

At the form level (`SignIn.tsx` / `SignUp.tsx`):

- The `<form>` uses `noValidate` and validates on submit, then renders an **error summary**
  (`role="alert" aria-live="assertive" aria-atomic="true"`); the form references it via
  `aria-describedby`.
- Error messages are **suggestive**, not just identifying — e.g. "Please enter a valid email
  address." (supports 3.3.3).
- Inputs declare `autoComplete` (`email`, `current-password`, `new-password`) to reduce
  required input.

### 3.4 Navigation labeling & state

- Both the patient bottom nav and the caregiver sidebar are `<nav aria-label="Main navigation">`.
- The landing header nav is `<nav aria-label="Account navigation">`, distinguishing the two
  navigations for screen-reader users.
- Active links set `aria-current="page"` (and the CSS active style), so the current location
  is exposed by name/role/value.
- Icon-only controls always carry an `aria-label` (e.g. "Switch to caregiver role", "Sign out
  of CareConnect", "Call your caregiver: …"), and all decorative Lucide icons are
  `aria-hidden="true"`.

### 3.5 Other name/role/value details

- Toggle buttons for completing tasks/medications expose `aria-pressed` (`Schedule.tsx`,
  `Medications.tsx`) and a state-specific `aria-label` ("Mark … as done" / "… as not done").
- The day-progress meter uses `role="progressbar"` with `aria-valuenow/min/max` and an
  `aria-label` (`Schedule.tsx`).
- Disabled submit buttons set both `disabled` and `aria-disabled`.

---

## 4. WCAG 2.1 A / AA Conformance Map

The table maps each targeted success criterion to the concrete CareConnect feature(s) that
satisfy it.

| SC | Name | Level | How CareConnect satisfies it |
|----|------|:-----:|------------------------------|
| **1.1.1** | Non-text Content | A | All Lucide icons are `aria-hidden="true"` and paired with visible text or an `aria-label`; decorative color swatches and avatars are `aria-hidden`; icon-only buttons (close, sign-out, send, task toggles) have `aria-label`s. |
| **1.3.1** | Info and Relationships | A | HTML5 landmarks (`banner`/`main`/`nav`/`contentinfo`); proper heading nesting; `Card` → `<section>`; `<label htmlFor>`; `aria-describedby` for hints/errors; `role="list"` on reset lists; `<time datetime>` for times. |
| **1.4.1** | Use of Color | A | Status is never color-only: every status carries an icon **and** a text word — see `STATUS_CFG` in `Today.tsx` (Done/Now/Coming up), the badge labels, and the `Banner` titles. |
| **1.4.3** | Contrast (Minimum) | AA | Color tokens in `tailwind.config.js` are chosen and annotated for ≥4.5:1 body text and ≥3:1 large text/UI (e.g. `neutral-500` 4.8:1, `calm-600` 6.2:1). |
| **1.4.4** | Resize Text | AA | All sizing is rem/`em`-based on an 18px root (`src/index.css`); the type scale in `tailwind.config.js` uses `rem`, so text scales with browser zoom without clipping. |
| **1.4.10** | Reflow | AA | Mobile-first layout (`md`/`lg` breakpoints) reflows to a single column; verified no horizontal scrolling at 320px; an `overflow-x: clip` guard on `html, body` (`index.css`) prevents stray overflow. |
| **1.4.11** | Non-text Contrast | AA | 2px component borders, a 3px high-contrast focus ring (`calm-600`), and bordered inputs/cards meet ≥3:1 against adjacent surfaces (documented in `Card.tsx`). |
| **2.1.1** | Keyboard | A | All interactive elements are native `<button>`/`<a>`/`<input>`; toggles, dialogs, nav, and chat are fully keyboard operable; `Enter` sends a chat message. |
| **2.1.2** | No Keyboard Trap | A | The modal `ConfirmDialog` trap is escapable via `Escape`/Cancel and restores focus; non-modal surfaces (ChatBot) allow `Tab`-out; no other element traps focus. |
| **2.2.1** | Timing Adjustable | A | No time limits anywhere: the header clock is display-only, there is no session timeout, and task/medication/check-in state persists in `localStorage` so nothing expires. |
| **2.4.1** | Bypass Blocks | A | A "Skip to main content" link is the first focusable element on every shell, targeting `#main-content`. |
| **2.4.3** | Focus Order | A | DOM order is content-first; the caregiver sidebar is placed visually left via CSS `order` while remaining after `<main>` in source (documented in `Layout.tsx`); dialogs move and restore focus deliberately. |
| **2.4.6** | Headings and Labels | AA | Descriptive headings (§2) and descriptive control labels; the header shows the current screen title; cards and sections are named by their headings. |
| **2.4.7** | Focus Visible | AA | A global `*:focus-visible` rule draws a 3px `calm-600` outline with offset (`index.css`); default outlines are only removed when `:focus-visible` is supported. |
| **3.2.3** | Consistent Navigation | AA | The same `Main navigation` landmark, item set, and ordering appear on every app screen (`Layout.tsx`); only the presentation (bottom bar vs sidebar) adapts to viewport/role. |
| **3.2.4** | Consistent Identification | AA | Shared components (`Button`, `Card`, `Field`, `Banner`) give the same icon + label to the same function everywhere (e.g. the heart logo, the "Call my caregiver" action). |
| **3.3.1** | Error Identification | A | Invalid fields set `aria-invalid` and show an inline `role="alert"` message; a form-level error summary (`role="alert"`) lists what to fix. |
| **3.3.2** | Labels or Instructions | A | `Field` always renders a visible `<label>`, optional hint text, a required marker, and `autoComplete` hints. |
| **3.3.3** | Error Suggestion | A | Error text suggests the correction ("Please enter a valid email address.", "Please enter your password.") rather than only flagging failure. |
| **4.1.2** | Name, Role, Value | A | `aria-pressed` on toggles, `aria-expanded`/`aria-controls` on the chat launcher, `aria-current="page"` on active nav, `role="dialog"`+`aria-modal`, `role="progressbar"` with values, `aria-disabled` on disabled buttons. |
| **4.1.3** | Status Messages | AA | `role="status"`/`aria-live="polite"` for medication, schedule, and check-in updates and chat replies; `role="alert"`/`aria-live="assertive"` for blocking errors (§3.1) — all without moving focus. |

### Exceeding AA — Target Size

| SC | Name | Level | Note |
|----|------|:-----:|------|
| **2.5.5** | Target Size | AAA | **Exceeds AA.** Every interactive element meets a **44×44px** minimum target. This is enforced globally in `src/index.css` (`button, [role="button"], input, select, summary { min-height/min-width: 2.75rem }`) and reinforced per-component (`min-h-[2.75rem] min-w-[2.75rem]` on buttons, nav links, and the `Field` inputs; bottom-nav items use `min-h-[3.5rem]`). WCAG 2.1's AA target-size criterion (2.5.5) is Level AAA at 44px; CareConnect meets the larger 44px target throughout, comfortably exceeding the WCAG 2.2 AA minimum (2.5.8, 24px). |

---

## 5. Designing for Short-Term Memory Loss

Beyond conformance, several decisions specifically support care recipients with short-term
memory impairment. Each reduces cognitive load and is grounded in a WCAG principle (POUR).

| Decision | What it does | Where | WCAG principle |
|----------|--------------|-------|----------------|
| **Persistent orientation bar** | The sticky header always shows the **day, date, live time, a greeting by name, and the current screen title**, so the user never has to remember "where/when am I?" | `Layout.tsx` (orientation bar) | **Understandable** — predictable, always-present context (supports 3.2 Predictable; aids 2.4.6) |
| **Recognition over recall** | The UI surfaces choices instead of asking the user to remember them: a single "Next thing to do" card, large labeled action tiles, icon+word badges, and memory cards for people/places. Nothing relies on remembered commands. | `Today.tsx`, `BigActionTile`, badges | **Understandable** — consistent, recognizable identification (3.2.4) |
| **Undo / reversible actions** | Marking a task or medication done is a `aria-pressed` toggle that can be reversed at any time; destructive actions are gated behind a confirmation dialog with focus restoration. The user can never get "stuck" after a mistaken tap. | `Schedule.tsx`, `Medications.tsx`, `ConfirmDialog.tsx` | **Operable / Understandable** — error prevention & reversal (aligns with 3.3 Input Assistance; informs 3.3.4) |
| **No time pressure** | There are no countdowns, auto-advancing screens, or session timeouts. The clock is informational only, and all progress persists in `localStorage`, so a user can step away and return without losing state or being logged out. | `Today.tsx`, `Medications.tsx` (persistence); header clock | **Operable** — Enough Time (2.2.1 Timing Adjustable) |

Together these choices implement the project's guiding principle: a **calm, low-pressure
interface that supports the user's memory rather than testing it** — which is also what makes
the WCAG criteria above hold up in real use, not just on paper.

---

*Generated for the SWEN 661 submission. All references point to the current CareConnect
source tree (`src/`). Where a criterion is satisfied by a shared component, the component is
named so a reviewer can verify the behavior in one place.*
