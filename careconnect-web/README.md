# CareConnect — responsive web implementation

A React implementation of the CareConnect responsive design system. This cut
covers the **Patient Today** screen in all three layouts (mobile, tablet,
desktop) and a **foundations & component-states sheet** that renders every
state the Figma handoff specifies, using the same components the screen uses.

## Install and run

Requires Node 20 or newer (developed on Node 26).

```bash
cd careconnect-web
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build — worth doing, see "Cascade layers" below |
| `npm run lint` | `oxlint` for JS, then `scripts/lint-tokens.mjs` for the stylesheets |
| `npm test` | The Jest suite, once |
| `npm run test:watch` | The suite in watch mode |
| `npm run coverage` | The suite with Istanbul coverage; fails below 90% on any metric |

Two routes, no router:

- `/` — Patient Today
- `/#specimens` — the foundations sheet (the "Design system" link in the
  bottom-right corner of every page)

`#specimens` is read straight from `location.hash`. A router would add a
dependency and a build concept for one evidence page, and the five navigation
destinations are inert in this cut, so there is nothing else to route.

One wrinkle worth knowing before you touch `App.jsx`: the hash is not only a
route. `#main` is the skip link's target. Treating every hash as a route meant
that skipping to the main content while the sheet was open navigated straight
off it — the first control a keyboard user reaches was the one that threw away
their place. So a hash naming a *fragment* leaves the route alone, and only a
hash naming a *view* changes it.

## Responsive behaviour

Three layouts, two breakpoints, mobile-first. Both queries are `min-width`, so
there is no width that matches neither or both:

| | Mobile `< 768px` | Tablet `768–1199px` | Desktop `≥ 1200px` |
|---|---|---|---|
| Navigation | Fixed bottom bar, 5 destinations, 72px targets | Top tab row, full labels | 264px left sidebar |
| Page | Single column | Single column, support cards paired | Fluid plan + 324px support column |
| Page inset | 16px | 40px | 40px |
| Nav labels | Abbreviated — Meds, Visits, Inbox | Full | Full |

**Reflow, don't reduce.** No breakpoint shrinks text to make something fit. The
display heading reflows from 36px to 28px on mobile and gets *heavier* (400 to
600) rather than smaller, and 16px is a hard floor for all body and control
text. Where something cannot fit, it wraps or stacks.

**One DOM order.** All three layouts render the same markup in the same order;
only CSS differs. The support cards are placed into the second grid column at
desktop rather than being moved in the DOM, so tab order still follows reading
order. All three navigation presentations are always rendered and CSS hides two
of them with `display: none`, which also removes them from the accessibility
tree — so there is exactly one "Main" navigation landmark at any width, not
three, and the current page is marked once.

## Accessibility

Targeted at WCAG 2.1 AA, verified mechanically rather than by eye (see
"Verification"):

- Every rendered text node meets 4.5:1 against its effective background. The
  one exception is the disabled button label (3.86:1), which 1.4.3 exempts for
  inactive controls and which is `--cc-muted` rather than a lighter grey so it
  stays readable anyway.
- `--cc-border` (#DCE5F0) is decorative only — 1.27:1 on white. No control is
  bounded by it alone; input edges use `--cc-muted`, which measures 4.76:1.
- `--cc-brand` (#1A73E8) is 4.51:1 on white and clears AA by 0.01, so it is
  restricted to the mark and the progress fill. Actions and links use
  `--cc-primary` (#1565C0) at 5.75:1.
- Interactive targets are at least 44px; buttons and fields at least 52px;
  mobile bar destinations 72px.
- The mobile bar shows "Meds" but announces "Medications": the abbreviation is
  `aria-hidden` and the full destination is in a visually hidden span, so one
  name reaches assistive technology instead of both. The Messages count reads
  after the destination — "Messages, 2 unread", not "2 unread messages Messages".
- Selection is `aria-current="page"`, not just the tint. Focus is a dark 3px
  ring with an offset, so it sits on the surrounding surface and stays visible
  on the primary fill and on the selected tint.
- Field errors are stated in words ("Error: Enter a subject before sending."),
  not by colour alone, and wired with `aria-describedby`.

## Project layout

```
src/
  App.jsx                 shell: skip link, app bar, 3 nav presentations, routes
  data/
    patientToday.js       every user-visible string + the destination list
    foundations.js        specimen copy; no colour or type values (see below)
  components/             Button, TextField, Badge, Card, ProgressBar, Icon, Nav,
                          AppointmentCard, LaterItem, GlanceCard, CareTeamCard
  pages/
    PatientToday.jsx      the screen
    Specimens.jsx         the foundations & component-states sheet
  styles/
    index.css             the single entry point — layer order lives here
    reset / tokens / type / components / layout / a11y .css
```

`data/patientToday.js` is the only place a user-visible string or a destination
is written down. Three layouts reading one list is what makes "same content,
same destinations at every width" a fact rather than a promise.

`data/foundations.js` deliberately holds **no** hex values and **no** type
metrics. The sheet reads those from the live computed styles at render, so a
swatch cannot claim a colour the stylesheet no longer uses.

## Cascade layers

`src/styles/index.css` declares the layer order once:

```css
@layer reset, tokens, base, components, layout, a11y;
```

Reading it matters because **a later layer beats an earlier one no matter how
specific either selector is**, which is the opposite of the usual specificity
intuition:

- `base` holds the 44px/52px target *floors*. They are floors precisely because
  `components` and `layout` come later and can raise them — that is how the
  mobile bar reaches 72px with an ordinary class and no `!important`.
- `layout` beats `components` so a breakpoint can rearrange a component.
- `a11y` is last so nothing downstream can accidentally remove a focus ring.

One trap worth knowing: in a production build the CSS minifier **drops** that
statement as redundant, and the bundle's layer order then comes from the order
the layers first appear in — that is, from the `@import` order. The imports are
listed in the same order as the statement for exactly that reason. If you
reorder one, reorder both, or `npm run build` will stop matching `npm run dev`.

`scripts/lint-tokens.mjs` enforces the rest: stylesheets must live in
`src/styles/`, every rule must be inside a `@layer`, colours must come from
`tokens.css`, and spacing must come from the 4px scale.

## Verification

Three layers, and they deliberately do not overlap.

### 1. `npm run lint` — static

`oxlint` for the JavaScript, then `scripts/lint-tokens.mjs` for the
stylesheets: no stylesheet outside `src/styles/`, no rule outside a `@layer`,
no colour outside `tokens.css`, no spacing off the 4px scale, no `font-size`
below the 16px floor, no `outline: none`.

### 2. `npm run coverage` — the Jest suite

406 tests across 17 files, in jsdom. **100% of statements, branches, functions
and lines**, with the gate set at 90% so the run fails below it. Nothing is
excluded from the report to get there — the last two uncovered branches were
server-rendering guards that `createRoot` can never execute, and they were
deleted rather than tested around.

Coverage is collected from every source file, through `collectCoverageFrom` in
`jest.config.js`. That setting is the point: without it a source file with no
test file of its own is simply absent from the report rather than counted at
zero, and the percentage stops meaning anything about completeness.

**What these tests deliberately do not claim.** jsdom has no layout engine and
the suite loads no CSS (`jest.config.js` stubs every `.css` import), so no unit
test here can tell you a target is 72px, which of the three layouts is showing,
what a contrast ratio computes to, or whether an element is visually hidden.
Tests that assert a class name as a proxy for any of that would pass with the
stylesheet deleted, so they are not written. Where a test names a modifier
class it is pinning that the prop reached the markup, and it says so. The
pixels are layer 3's job.

### 3. The browser sweep — Chromium, via Playwright

Loads both routes at seven widths — 393, 767, 768, 1024, 1199, 1200, 1440 —
and measures eighteen things at each from the live DOM:

no text below 16px · targets ≥44px · buttons and fields ≥52px · mobile bar
destinations ≥72px · exactly one visible "Main" landmark · the right number of
`aria-current="page"` for the route · all five destinations present with the
right accessible names · the mobile bar really showing abbreviations while
tablet and desktop show full labels · all 20 content-parity strings · the
appointment card genuinely rearranging at 768 (read from computed
`grid-template-columns` and `flex-direction`, so a renamed layout class cannot
pass) · the current destination's computed background differing from an
unselected one · no text clipped by its own box · the progress fill painting
the width its text claims · every swatch on the sheet resolving to a real
colour and a six-digit hex · the skip link being the first tab stop and Enter
really moving focus into `<main>` · computed sRGB contrast of every visible
text node · no horizontal overflow · and, scrolled to the very bottom, nothing
carrying text sitting underneath the fixed mobile bar.

All fourteen runs (7 widths × 2 routes) pass against the production build as
well as the dev server. The script is not committed — it lives with the team's
other demo tooling outside the repo, per the convention set in week 4.

Two things about that list are worth copying into the next project. The
boundary widths are the point: 767/768 and 1199/1200 are where a layout hands
over, and the reference widths alone would not catch a handover that is off by
a pixel. And every check in it was probe-tested against the bug it describes —
re-break the thing, confirm the check goes red — because a check that cannot
fail is worse than no check, and two of the checks here were found to be
exactly that. The probe scripts live beside `verify.mjs`.

The sweep also earns its keep against the BUILD specifically. The swatch check
was added and immediately failed in production only: the CSS minifier rewrites
`#ffffff` as `#fff`, so the foundations sheet was printing `#FFF` beside
`#F7F9FC`. No unit test could have seen it — Jest never runs the minifier.

## What is done, and what is not

**Done**

- Design tokens — 14 colours, the Inter type scale with its mobile overrides,
  the 4px space scale, radii and control floors — as CSS custom properties.
- Eleven components, each one state-complete against the Figma board.
- Patient Today in all three layouts, from one DOM order.
- The foundations & component-states sheet, including real `:focus-visible`
  specimens rather than painted imitations of a ring.
- Accessibility work above, verified mechanically at seven widths.
- 406 unit tests at 100% coverage, plus an 18-check browser sweep.
- Production build verified, not just the dev server.

**Not done**

- **Nothing is wired.** Every control is a static specimen: "I'm ready" does not
  mark anything done, the five destinations do not navigate, and the message
  field does not send. The Figma handoff scopes this cut to the Patient Today
  screen, and inventing behaviour would mean inventing data.
- **One screen of five.** Medications, Appointments, Messages and Help exist as
  destinations only.
- **The browser sweep is not in CI.** It exits non-zero and is ready to be, but
  today it is run by hand. Only the unit suite runs on demand.
- **No persistence, no data layer, no API.** All copy is a literal in
  `data/patientToday.js`.

## Where the implementation departs from the Figma boards

Two deliberate differences, each because the board's own rules conflict:

1. **Navigation items have no border.** The component-states board draws the
   default nav item as a bordered chip, but the border token is `--cc-border` at
   1.27:1 — and the same board says that token is decorative and cannot bound a
   control. The layout renders show the sidebar items borderless, so that is
   what is implemented; selection is carried by the tint plus `aria-current`,
   and focus by the ring.
2. **The error field is not a live region.** With nothing wired there is no
   validation event to announce, and a live region here would announce on first
   render — worse than silence. It becomes a live region when the form is wired.

### One asymmetry that is not a departure

`Button` uses `aria-disabled` with the click handler detached; `TextField` uses
the native `disabled` attribute. Both match the board, and the difference is
deliberate.

The usual objection to `aria-disabled` is that it leaves the handler live — so
the button does not pass one. What it buys is that the control stays in the tab
order: a keyboard user reaches it and hears "unavailable" rather than having it
vanish silently from the sequence, and the disabled specimen on the foundations
sheet can actually be focused to show that its label still reads. A disabled
input is a different case: it must also be skipped by form submission and must
not be editable, and only the native attribute gives that.
