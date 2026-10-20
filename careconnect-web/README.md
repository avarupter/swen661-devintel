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

Two routes, no router:

- `/` — Patient Today
- `/#specimens` — the foundations sheet (the "Design system" link in the
  bottom-right corner of every page)

`#specimens` is read straight from `location.hash`. A router would add a
dependency and a build concept for one evidence page, and the five navigation
destinations are inert in this cut, so there is nothing else to route.

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

`npm run lint` is the static half. The behavioural half is a headless
Playwright script that loads both routes at seven widths — 393, 767, 768, 1024,
1199, 1200 and 1440 — and checks, at each one:

no text below 16px · targets ≥44px · buttons and fields ≥52px · mobile bar
destinations ≥72px · exactly one visible "Main" navigation landmark · exactly
one `aria-current="page"` · all five destinations present with the right
accessible names · all 18 parity strings present on Patient Today · computed
sRGB contrast of every visible text node · no horizontal overflow.

The boundary widths are the point: 767/768 and 1199/1200 are where a layout
hands over, and both sides of each are checked. All fourteen runs (7 widths ×
2 routes) pass against the dev server and against the production build.

The script is not committed — it lives with the team's other demo tooling
outside the repo, alongside the screenshots, per the convention set in week 4.

## What is done, and what is not

**Done**

- Design tokens — 14 colours, the Inter type scale with its mobile overrides,
  the 4px space scale, radii and control floors — as CSS custom properties.
- Eleven components, each one state-complete against the Figma board.
- Patient Today in all three layouts, from one DOM order.
- The foundations & component-states sheet, including real `:focus-visible`
  specimens rather than painted imitations of a ring.
- Accessibility work above, verified mechanically at seven widths.
- Production build verified, not just the dev server.

**Not done**

- **Nothing is wired.** Every control is a static specimen: "I'm ready" does not
  mark anything done, the five destinations do not navigate, and the message
  field does not send. The Figma handoff scopes this cut to the Patient Today
  screen, and inventing behaviour would mean inventing data.
- **One screen of five.** Medications, Appointments, Messages and Help exist as
  destinations only.
- **No tests.** The verification above is a Playwright script run by hand, not
  a suite in CI. It should become one.
- **No persistence, no data layer, no API.** All copy is a literal in
  `data/patientToday.js`.

## Where the implementation departs from the Figma boards

Three deliberate differences, each because the board's own rules conflict:

1. **Navigation items have no border.** The component-states board draws the
   default nav item as a bordered chip, but the border token is `--cc-border` at
   1.27:1 — and the same board says that token is decorative and cannot bound a
   control. The layout renders show the sidebar items borderless, so that is
   what is implemented; selection is carried by the tint plus `aria-current`,
   and focus by the ring.
2. **Disabled buttons use the native `disabled` attribute**, not
   `aria-disabled`. The board says "remains legible and is not actionable", and
   `aria-disabled` leaves the click handler live. The accepted cost is that the
   control leaves the tab order.
3. **The error field is not a live region.** With nothing wired there is no
   validation event to announce, and a live region here would announce on first
   render — worse than silence. It becomes a live region when the form is wired.
