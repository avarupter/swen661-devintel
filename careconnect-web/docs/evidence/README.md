# careconnect-web: Week 11 evidence

Captured on October 27, 2026 with Playwright 1.63.0 (Chromium 153), axe-core 4.14.0 and Lighthouse 13.5.0. Every test and audit ran against the production build, served under `/swen661-devintel/`, the path GitHub Pages will use. All PNGs are 2× resolution.

## End-to-end tests (Playwright)

**55 passed, 0 failed, 2 skipped.** The 320px reflow check runs once, in the desktop project, so it is skipped in the other two. Screenshot: `e2e-report.png`.

The suite runs in all three layouts:
- desktop, 1440×900, with the sidebar;
- tablet, 1024×768, with the top tabs;
- mobile, a Pixel 7, with the bottom bar.

What the tests check:

- **The tabs.** Each of the five tabs (Home, Medications, Appointments, Messages, Help):
  - opens its page and sets the browser title;
  - marks itself as the current page, with exactly one current tab.
- **Focus.**
  - After a tab is used, keyboard focus moves to the new page's heading, but not on first load.
  - Browser Back and Forward restore the page, its title and the current tab.
  - Deep links open the right page.
  - In-page anchors such as `#main`, and unknown addresses, never change the page.
- **Keyboard.**
  - "Skip to main content" is the first Tab stop. Enter moves focus into the main content and keeps the current page.
  - Every tab can be reached and opened with the keyboard alone.
- **Layout.** No page scrolls sideways at 320px (WCAG 1.4.10).
- **Navigation names.** Mobile labels such as "Meds" are read as "Meds (Medications)", and Messages is read with its unread count, "Messages, 2 unread".
- **Content.** Patient Today shows the day's numbers. The Design system page opens from the footer and leads back.
- **Storage.**
  - If saved data is corrupt, the app still loads the demo with no errors.
  - If the browser blocks storage, a banner on every page says changes can't be saved.
- **Accessibility.** axe-core finds 0 WCAG 2.1 A/AA violations on all six pages, in all three layouts.

## Lighthouse

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile | 99 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Screenshots: `lighthouse-mobile.png` and `lighthouse-desktop.png`. The full reports are in `lighthouse/`, as HTML and JSON. Lighthouse 12 and later no longer has a PWA category.

## Screenshots

| File | Shows |
|---|---|
| `home-mobile.png`, `home-tablet.png`, `home-desktop.png` | Patient Today in its three layouts: the bottom bar, the top tabs and the sidebar |
| `medications-mobile.png`, `-tablet.png`, `-desktop.png` | The Medications page opened from its tab, with "Meds" marked current in the mobile bar |
| `appointments-mobile.png`, `-tablet.png`, `-desktop.png` | The Appointments page opened from its tab ("Visits" on mobile) |
| `messages-mobile.png`, `-tablet.png`, `-desktop.png` | The Messages page opened from its tab ("Inbox" on mobile), with the unread count on the tab |
| `help-mobile.png`, `-tablet.png`, `-desktop.png` | The Help page opened from its tab |
| `design-system-mobile.png`, `-tablet.png`, `-desktop.png` | The design-system sheet of colours, type and component states, opened from the footer link |
| `keyboard-skip-link.png` | The first Tab press shows "Skip to main content" |
| `keyboard-tab-focus.png` | Keyboard focus on the Medications tab, shown by the dark focus ring |
| `keyboard-heading-focus.png` | After Enter, the Medications page opens and focus moves to its heading |
| `storage-banner.png` | With storage blocked by the browser, the banner explains that changes can't be saved |
| `e2e-report.png` | The Playwright report: 55 passed, 0 failed |
| `lighthouse-mobile.png`, `lighthouse-desktop.png` | The Lighthouse scores in the table above |

## Fixed during this pass

- **The built app showed a blank page under the GitHub Pages path.** Its scripts were requested from the site root and returned 404, and Lighthouse reported "no content painted". Setting Vite's base to relative (`base: "./"`) fixed it.
- **A missing favicon and meta description** cost 4 points in Best Practices and 10 in SEO. With both added, all four categories reach 99–100.

## Re-running

```bash
cd careconnect-web
npm run test:e2e    # the three-layout suite (builds and serves the app itself)
npm run evidence    # rewrites the PNGs in this folder
```

AI use: Claude Code (Anthropic) wrote the Playwright tests, ran the Lighthouse audits and captured these screenshots at Shane Cray's direction.
