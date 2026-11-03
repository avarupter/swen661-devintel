# CareConnect web (careconnect-web): accessibility baseline, before the fixes

WCAG 2.1 AA baseline of the web app at commit e79a08c (Jonay's TypeScript app), measured on 2 November 2026 before any fix. The matching "after" set will be in `../after/`.

## Test conditions

- **App:** careconnect-web @ e79a08c (vite build, served by vite preview on http://localhost:4310)
- **axe:** axe-core 4.14.0 (runOnly wcag2a,wcag2aa,wcag21a,wcag21aa + label-content-name-mismatch)
- **lighthouse:** Lighthouse 13.5.0, Chrome for Testing 153.0.8010.12 headless=new, simulated throttling
- **playwright:** playwright-core 1.63.0
- **axe and keyboard clock:** America/New_York, fixed at 2026-11-02T12:00:00-05:00
- **Lighthouse window:** 2026-11-02T22:49:46.829Z to 2026-11-02T22:59:26.982Z. real clock; local date == UTC date during the run
- **Sign-in:** UI sign-up via /signup (Margaret Thompson / margaret@example.com or Joyce Adeyemi / joyce@example.com, password audit123) -> /role tile; storage states saved as Playwright storageState

## Lighthouse (13.5.0)

Accessibility ranges from **94 to 100** across all 48 runs; the requirement is 90 or above.

| State | Route | Mobile: Perf / A11y / BP / SEO | Desktop: Perf / A11y / BP / SEO | Accessibility audits failed |
|---|---|---|---|---|
| caregiver | `/app` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| caregiver | `/app/activity` | 100 / **100** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| caregiver | `/app/appointments` | 100 / **94** / 100 / 91 | 100 / **94** / 100 / 91 | color-contrast, heading-order |
| caregiver | `/app/caregiver` | 100 / **100** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| caregiver | `/app/contacts` | 100 / **100** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| caregiver | `/app/manage-appointments` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| caregiver | `/app/manage-medications` | 100 / **100** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| caregiver | `/app/medications` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| caregiver | `/app/memories` | 100 / **100** / 100 / 92 | 100 / **96** / 100 / 92 | color-contrast |
| caregiver | `/app/schedule` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| norole | `/role` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| patient | `/app` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| patient | `/app/activity` | 100 / **100** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| patient | `/app/appointments` | 100 / **94** / 100 / 91 | 100 / **94** / 100 / 91 | color-contrast, heading-order |
| patient | `/app/caregiver` | 100 / **100** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| patient | `/app/contacts` | 100 / **100** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| patient | `/app/manage-appointments` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| patient | `/app/manage-medications` | 100 / **100** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| patient | `/app/medications` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| patient | `/app/memories` | 100 / **100** / 77 / 92 | 100 / **96** / 100 / 92 | color-contrast |
| patient | `/app/schedule` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |
| signedout | `/` | 100 / **100** / 100 / 91 | 100 / **100** / 100 / 91 | none |
| signedout | `/signin` | 100 / **100** / 100 / 91 | 100 / **100** / 100 / 91 | none |
| signedout | `/signup` | 100 / **96** / 100 / 91 | 100 / **96** / 100 / 91 | color-contrast |

## axe-core 4.14.0

**Page loads:** 48 runs, 6 with no violations.

| Rule | WCAG | Runs affected | Elements |
|---|---|---|---|
| color-contrast | wcag143 | 34 | 200 |
| label-content-name-mismatch | wcag253 | 36 | 74 |

**Interactive states:** 28 runs, 2 with no violations.

| Rule | WCAG | Runs affected | Elements |
|---|---|---|---|
| color-contrast | wcag143 | 19 | 136 |
| label-content-name-mismatch | wcag253 | 24 | 46 |
| scrollable-region-focusable | wcag211, wcag213 | 4 | 4 |

## Issue screenshots (`issues/`)

2x PNGs, with the problem outlined in magenta.

| File | What it shows |
|---|---|
| [01-landing-label-content-name-mismatch.png](issues/01-landing-label-content-name-mismatch.png) | Landing, 1280px. Hero CTAs: visible text 'Get started — it's free' / 'I already have an account' is not in their accessible names 'Sign up for CareConnect' / 'Sign in to CareConnect' (axe label-content-name-mismatch, WCAG 2.5.3). Landing.tsx:124-138. |
| [02-signup-color-contrast.png](issues/02-signup-color-contrast.png) | Sign up, 1280px. Privacy note text-xs text-neutral-400 on white = 2.84:1, needs 4.5:1 (WCAG 1.4.3). SignUp.tsx:171. |
| [03-role-color-contrast.png](issues/03-role-color-contrast.png) | Role chooser, 1280px. Two helper lines text-sm text-neutral-400 on neutral-50 = 2.68:1 (WCAG 1.4.3). RoleChooser.tsx:62, 90. |
| [04-patient-app-color-contrast.png](issues/04-patient-app-color-contrast.png) | Care recipient Today, 1280px. 'NEXT THING TO DO' label 2.84:1 (Today.tsx:175) and the desktop footer text 2.84:1 (Layout.tsx:432) (WCAG 1.4.3). |
| [05-patient-app-label-content-name-mismatch.png](issues/05-patient-app-label-content-name-mismatch.png) | Care recipient header, every route. Visible 'Call my caregiver' vs accessible name 'Call your caregiver: Joyce — 07700 900 456' (WCAG 2.5.3). Layout.tsx:275-282. |
| [06-patient-app-schedule-color-contrast.png](issues/06-patient-app-schedule-color-contrast.png) | My Day, 1280px. Done items sit in opacity-60 cards: titles 1.76:1, descriptions 2.44:1, badges 2.6-2.95:1, times 3.13:1; hint 'Tap the circle…' 2.68:1 (WCAG 1.4.3). Schedule.tsx:86-114, 164. |
| [07-patient-app-appointments-color-contrast.png](issues/07-patient-app-appointments-color-contrast.png) | My Appointments, 1280px. Location-type labels (2.84:1) and the reassurance note (2.68:1) use text-neutral-400 (WCAG 1.4.3). Appointments.tsx:185, 391. |
| [08-patient-app-appointments-label-content-name-mismatch.png](issues/08-patient-app-appointments-label-content-name-mismatch.png) | My Appointments. 'Add to My Day' buttons are named 'Add "<title>" to My Day schedule', so the visible label is not contained (WCAG 2.5.3). Appointments.tsx:247-254. |
| [09-patient-app-medications-color-contrast.png](issues/09-patient-app-medications-color-contrast.png) | Medicines, 1280px. Taken medicines sit in opacity-60 cards (1.76-2.95:1) and the disclaimer is 2.68:1 (WCAG 1.4.3). Medications.tsx:116-145, 167. |
| [10-patient-app-manage-medications-label-content-name-mismatch.png](issues/10-patient-app-manage-medications-label-content-name-mismatch.png) | Manage medications. 'Add medication' button is named 'Add new medication' (WCAG 2.5.3). ManageMedications.tsx:407-415. |
| [11-patient-app-manage-appointments-color-contrast.png](issues/11-patient-app-manage-appointments-color-contrast.png) | Manage appointments, 1280px. Addresses in text-neutral-400 on white = 2.84:1 (WCAG 1.4.3). ManageAppointments.tsx:452. |
| [12-caregiver-app-color-contrast.png](issues/12-caregiver-app-color-contrast.png) | Caregiver Dashboard, 1280px. Empty-activity hint (text-sm) and the refresh footnote (text-xs) in text-neutral-400, 2.84:1 / 2.68:1 (WCAG 1.4.3). CaregiverDashboard.tsx:424, 547. |
| [13-caregiver-app-label-content-name-mismatch.png](issues/13-caregiver-app-label-content-name-mismatch.png) | Caregiver Dashboard. Four quick-link cards whose aria-label drops the visible sub-text, plus the sidebar 'Switch to patient' button named 'Switch to care recipient role' (WCAG 2.5.3). CaregiverDashboard.tsx:451-541, Layout.tsx:372-379. |
| [14-landing-scrollable-region-focusable-chat-open.png](issues/14-landing-scrollable-region-focusable-chat-open.png) | Landing with the assistant open (replies are the scripted fallback; with VITE_SUPABASE_URL unset each message POSTs to /undefined/functions/v1/chat-assistant and gets a 404). The conversation list scrolls but contains nothing focusable, so keyboard users cannot scroll earlier messages (axe scrollable-region-focusable, WCAG 2.1.1). ChatBot.tsx:267-270. |
| [15-patient-app-schedule-color-contrast-all-done.png](issues/15-patient-app-schedule-color-contrast-all-done.png) | My Day after every task is ticked: the whole list drops below contrast minimums (41 nodes) because done cards use opacity-60. Schedule.tsx:86-88. |
| [16-patient-app-medications-color-contrast-all-taken.png](issues/16-patient-app-medications-color-contrast-all-taken.png) | Medicines after every medicine is ticked: 19 contrast failures from opacity-60 cards. Medications.tsx:116. |
| [17-caregiver-app-manage-medications-label-content-name-mismatch-add-form.png](issues/17-caregiver-app-manage-medications-label-content-name-mismatch-add-form.png) | Add medication form. 'Add another time' button is named 'Add another scheduled time' (WCAG 2.5.3). ManageMedications.tsx:261-269. |
| [18-caregiver-app-color-contrast-with-events.png](issues/18-caregiver-app-color-contrast-with-events.png) | Caregiver Dashboard with activity events: event-type labels and 'Nh ago' times are text-xs text-neutral-400, 2.84:1 (WCAG 1.4.3). CaregiverDashboard.tsx:254, 260. |
| [19-caregiver-app-activity-color-contrast-with-events.png](issues/19-caregiver-app-activity-color-contrast-with-events.png) | Activity log with events: event-kind labels (text-xs) and the per-day count (text-sm) in text-neutral-400 (WCAG 1.4.3). ActivityLog.tsx:108, 200. |
| [20-landing-focus-on-load-chat-launcher.png](issues/20-landing-focus-on-load-chat-launcher.png) | Landing on load: focus is already on the chat launcher (bottom-right), so the first Tab leaves the page and the skip link is not the first stop (WCAG 2.4.3). ChatBot.tsx:129-135. |
| [21-landing-hero-cta-focus-invisible.png](issues/21-landing-hero-cta-focus-invisible.png) | Landing: 'Get started — it's free' has keyboard focus (magenta box marks the CTA group). The 3px #146488 ring sits on the calm-700→600 gradient at about 1.1-1.3:1 and cannot be seen (WCAG 2.4.7, 1.4.11). index.css:49-53, Landing.tsx:96-139. |
| [22-landing-hero-secondary-cta-focus-invisible.png](issues/22-landing-hero-secondary-cta-focus-invisible.png) | Landing: 'I already have an account' has keyboard focus; same invisible ring on the gradient (WCAG 2.4.7, 1.4.11). |
| [23-patient-app-install-prompt-over-content-mobile.png](issues/23-patient-app-install-prompt-over-content-mobile.png) | Today at 390px with the install banner, rendered by a synthetic beforeinstallprompt event (headless Chromium never fires the real one). Header + banner + bottom nav leave about 100px of content; Esc / Not now / Install drop focus to <body>. InstallPrompt.tsx:109-118. |
| [24-patient-app-header-icon-only-buttons-sm-breakpoint.png](issues/24-patient-app-header-icon-only-buttons-sm-breakpoint.png) | Header at 1280px: the wordmark and the 'Switch role' / 'Sign out' labels never render because tailwind.config.js defines no sm breakpoint, so these are icon-only at every width. tailwind.config.js:6-9, Layout.tsx:181, 214, 223. |
| [25-caregiver-manage-medications-focus-stolen-on-load.png](issues/25-caregiver-manage-medications-focus-stolen-on-load.png) | Manage medications on load: focus jumps to the last 'Delete' button and the page scrolls to it (WCAG 2.4.3). ConfirmDialog.tsx:95-99 runs its focus-return effect on mount for every danger Button (Button.tsx:116-125). |
| [26-caregiver-manage-medications-delete-dialog-buttons-mobile.png](issues/26-caregiver-manage-medications-delete-dialog-buttons-mobile.png) | Delete dialog at 390px: opens off-centre with Cancel below the fold; 'Yes, delete' is stacked above 'Cancel' at every width (flex-col-reverse, dead sm:). ConfirmDialog.tsx:117-123, 179. |
| [27-caregiver-manage-appointments-focus-stolen-on-load.png](issues/27-caregiver-manage-appointments-focus-stolen-on-load.png) | Manage appointments on load: focus jumps to the last 'Delete' button, page scrolled about 1566px (WCAG 2.4.3). Same cause as 25. |
| [28-caregiver-manage-appointments-delete-dialog-buttons-mobile.png](issues/28-caregiver-manage-appointments-delete-dialog-buttons-mobile.png) | Delete appointment dialog at 390px: same off-centre placement and stacked destructive-first buttons as 26. |
| [29-patient-app-schedule-toggle-icon-non-text-contrast.png](issues/29-patient-app-schedule-toggle-icon-non-text-contrast.png) | My Day: unchecked task toggles are text-neutral-300 (#c4cad5) circles on white, 1.6:1; the only visual cue for the control needs 3:1 (WCAG 1.4.11). Schedule.tsx:128, Medications.tsx:157. |
| [30-caregiver-app-contacts-sidebar-under-sticky-header.png](issues/30-caregiver-app-contacts-sidebar-under-sticky-header.png) | Caregiver desktop scrolled 600px: the sidebar slides under the 222px sticky header (it is a stretched flex item, so lg:sticky never engages, and --header-h is never set). Layout.tsx:323-339. |
| [31-landing-320px-reflow-header-signup-clipped.png](issues/31-landing-320px-reflow-header-signup-clipped.png) | Landing at 320px (400% zoom): header nav runs to 410px; 'Sign up' is clipped by html/body overflow-x: clip and 'Sign in' wraps (WCAG 1.4.10). Landing.tsx:54-88, index.css:22-26. |
| [32-caregiver-app-caregiver-320px-reflow-add-note-clipped.png](issues/32-caregiver-app-caregiver-320px-reflow-add-note-clipped.png) | Caregiver Notes at 320px: 'Add note' button extends to 374px and is cut off (WCAG 1.4.10). Caregiver.tsx:62-79. |
| [33-caregiver-app-manage-appointments-320px-reflow-heading-clipped.png](issues/33-caregiver-app-manage-appointments-320px-reflow-heading-clipped.png) | Manage appointments at 320px: the h1 'Manage appointments' is 341px wide and its end is clipped (WCAG 1.4.10). ManageAppointments.tsx:546-549. |
| [34-patient-app-focus-obscured.png](issues/34-patient-app-focus-obscured.png) | Today at 1280px: Tab reaches the footer link 'View contacts', which is fully behind the fixed bottom nav. The care-recipient footer is never visible at ≥1024px (WCAG 2.4.7). Layout.tsx:313, 386-441. |
| [35-patient-app-contacts-focus-obscured.png](issues/35-patient-app-contacts-focus-obscured.png) | Contacts at 1280px: focused 'Call Dr. Priya Sharma' link is scrolled to the viewport edge and fully hidden by the bottom nav (WCAG 2.4.7). |
| [36-patient-app-schedule-focus-obscured-mobile.png](issues/36-patient-app-schedule-focus-obscured-mobile.png) | My Day at 390px: the focused toggle for 'Breakfast' is two-thirds behind the fixed bottom nav (partly hidden = WCAG 2.2 SC 2.4.11, not a 2.1 failure); the next stop, 'Lunch', is fully hidden (WCAG 2.1 SC 2.4.7). |
| [37-patient-app-medications-focus-obscured-mobile.png](issues/37-patient-app-medications-focus-obscured-mobile.png) | Medicines at 390px: focused 'Mark Atorvastatin as taken' is fully behind the bottom nav (WCAG 2.4.7). |
| [38-caregiver-app-contacts-focus-obscured.png](issues/38-caregiver-app-contacts-focus-obscured.png) | Caregiver Contacts at 1280px: Tab moves from the page into the sidebar; the focused 'Dashboard', 'Medications' and 'Appointments' links are under the sticky header and invisible (WCAG 2.4.7). |
| [39-patient-app-400pct-zoom-320x256-chrome-covers-content.png](issues/39-patient-app-400pct-zoom-320x256-chrome-covers-content.png) | Care recipient at 320x256 CSS px (a 1280x1024 window at 400% zoom): 403px sticky header + 70px fixed bottom nav, so 0px of page content is visible at any scroll position (WCAG 1.4.10). Layout.tsx:163-166, 386-389. |
| [40-caregiver-app-400pct-zoom-320x256-chrome-covers-content.png](issues/40-caregiver-app-400pct-zoom-320x256-chrome-covers-content.png) | Caregiver at 320x256 CSS px (1280x1024 at 400% zoom): the 353px sticky header fills the viewport; 0px of content visible (WCAG 1.4.10). |
| [41-caregiver-manage-appointments-dialog-not-fixed-to-viewport.png](issues/41-caregiver-manage-appointments-dialog-not-fixed-to-viewport.png) | Delete dialog opened by pointer from the top of the list at 1280px: the page jumps 704px, the backdrop dims only <main> (the sidebar is outside the backdrop) and the sticky header scrolls away. <main class='page-enter'> keeps transform: translateY(0) after its animation (fill-mode forwards), so the position:fixed dialog is laid out against <main>, not the viewport. index.css:202-207, Layout.tsx:309, ConfirmDialog.tsx:118. |
| [42-caregiver-manage-appointments-dialog-not-fixed-to-viewport-mobile.png](issues/42-caregiver-manage-appointments-dialog-not-fixed-to-viewport-mobile.png) | Same at 390px: page jumps 2015px and the dialog's bottom (Cancel) is below the fold. |

## Folder contents

| Path | Contents |
|---|---|
| `issues/` | 42 issue screenshots (table above) |
| `lighthouse-png/` | 48 Lighthouse score headers, one per run, named `<state>__<route>__<mobile/desktop>.png` |
| `lighthouse-reports-html.zip` | All 48 full Lighthouse HTML reports; unzip and open in a browser |
| `axe/` | 76 full axe-core JSON results: 48 page loads and 28 interactive states |
| `summary.json` | Every score and count above, in machine-readable form |
