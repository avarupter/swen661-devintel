# Final presentation: accessibility demo run-sheet

This is the run-sheet for the mandatory accessibility demonstration in the final presentation. It covers all four apps, with about 2 to 3 minutes each. For each app it gives how to launch it live, which accessibility features to show, the exact steps, and what to say.

The features listed here come from each app's source and docs:

- `careconnect-web/ACCESSIBILITY.md`
- `careconnect-electron/docs/accessibility/`
- `careconnect-rn/README.md`
- `careconnect_mobile/README.md`
- the root `README.md`

This run-sheet was written from commit `e79a08c` (2 November 2026). Where a number comes from an earlier week, it says which week. Replace every `__` with this week's measured value before presenting.

## Running order (about 11 minutes)

| Order | App | What runs live | Time | Presenter |
|---|---|---|---|---|
| 0 | Opening: one sentence on what we tested and how | | 0:15 | |
| 1 | Web app (`careconnect-web`) | Chrome on Windows with NVDA | 3:00 | __ |
| 2 | Desktop app (`careconnect-electron`) | The installed Windows app with NVDA | 3:00 | __ |
| 3 | Flutter mobile app (`careconnect_mobile`) | An Android phone with TalkBack, mirrored to the PC | 2:30 | __ |
| 4 | React Native mobile app (`careconnect-rn`) | Expo Go on Android (TalkBack) or iPhone (VoiceOver), mirrored | 2:00 | __ |
| 5 | Closing | | 0:15 | |

## Pre-flight (30 minutes before)

Every app should already be running, signed in and on its first screen before the talk starts.

### Shared setup

- **Share the screen.** Share the whole Windows screen, not a single window, so the NVDA Speech Viewer can be seen next to the app. Turn on "share computer sound" so the audience hears the screen readers.
- **NVDA.**
  - Start NVDA with Ctrl+Alt+N.
  - Open the Speech Viewer: NVDA+N → Tools → *Speech Viewer*. Put it beside the app window.
  - Turn on the focus box: NVDA+N → Preferences → Settings → Vision → *Enable highlighting*.
  - Set a moderate speech rate.
- **Phones.** Mirror the phone to the PC.
  - Android: use [scrcpy](https://github.com/Genymobile/scrcpy), which also forwards the phone's audio on Android 11 and later.
  - iPhone: use QuickTime on a Mac, or AirPlay.
  - Optional: to show TalkBack's words on screen, turn on TalkBack settings → Advanced settings → Developer settings → *Display speech output*.
- **Do not disturb.** Turn it on for every device, and close chat apps.
- **Backup recordings.** Record one good take of each segment the day before. If a live demo fails, switch to the recording and say so. The Flutter app already has a walkthrough video: https://youtu.be/evf689ZirIE.

### Web (`careconnect-web`)

1. In WSL, start the app:

   ```bash
   cd careconnect-web
   npm install
   npm run dev
   ```

2. **Window 1** (Chrome on Windows):
   1. Open http://localhost:5173.
   2. Press F12, then Application → *Clear site data*.
   3. Sign up as `Margaret Whitfield`, `margaret@example.com`, password `careconnect`.
   4. Choose **I am the Care Recipient**, and leave it on Today.
3. **Window 2** (a Chrome Incognito window, which keeps its own storage, so it stays signed out): open http://localhost:5173/signin. This window is for the form-error demo.
4. **Keep the evidence ready:**
   - the final Lighthouse report (DevTools → Lighthouse → Accessibility; target 90 or higher);
   - the WAVE before and after counts (`docs/final-week/wave-checklist.md`).
5. **Don't use GitHub Pages for this app.** It uses `BrowserRouter` with absolute paths such as `/app` (`src/App.tsx:81-100`). Those paths have not been checked under the `/swen661-devintel/` subpath.
6. **Rehearse around the known screen-reader issues** in `docs/final-week/screen-reader-procedure.md` section 5:
   - R1: on Manage medications, focus jumps to a Delete button.
   - R2: on Landing, focus jumps to the chat button.
   - R3: page changes are silent.

   If they are fixed by presentation day, show the fixed behaviour; "this is what we found, and this is the fix" is a strong story.

### Desktop (`careconnect-electron`)

- Install `careconnect-electron/dist/CareConnect-Setup-1.0.0.exe` on Windows. To build it again from WSL, run `npm run dist:win:docker`.
- Run the **installed** app, not `npm run dev` under WSLg. NVDA and Windows High Contrast cannot read WSLg windows.
- Optional, to reset the demo data: quit CareConnect, then delete `%APPDATA%\CareConnect\careconnect-workspace.json`.
- Start it from the Start menu and maximise the window. It opens on Patients, with Avery Park selected.

### Flutter (`careconnect_mobile`)

- Connect an Android phone with USB debugging turned on, then run:

  ```bash
  cd careconnect_mobile
  flutter create .      # only on a fresh clone: the platform folders are gitignored
  flutter pub get
  flutter run
  ```

  As a fallback, install the APK linked in `careconnect_mobile/README.md`. First check that it was built from current code.
- TalkBack must be on the device. Use a physical phone, or an emulator image with Google Play, because that image includes TalkBack. Turn it on with Settings → Accessibility → TalkBack, and learn the on/off shortcut before the talk.
- Sign up or sign in with any details (the authentication is mocked), choose **Patient**, and leave it on Patient Today.
- Set the phone's font size back to the default before you start.

### React Native (`careconnect-rn`)

- Run:

  ```bash
  cd careconnect-rn
  npm install
  npx expo start --go
  ```

  Then scan the QR code with **Expo Go for SDK 56** (the app needs that exact SDK version).
- From WSL, the phone often cannot reach the dev server. If so, use `npx expo start --go --tunnel` instead.
- Have TalkBack (Android) or VoiceOver (iPhone) ready, and leave the app on the Landing screen.

## 1. Web app: `careconnect-web` (3:00)

Code references are relative to `careconnect-web/`.

| Time | Feature | Steps | What to say |
|---|---|---|---|
| 0:00–0:40 | Keyboard only | 1. In window 1, on Today, press Tab once: **Skip to main content** appears. Press Enter.<br>2. Tab through **Quick actions**: each tile gets a thick blue focus ring.<br>3. Tab on to the bottom bar's **Medicines** and press Enter. | "Everything works from the keyboard. The skip link is the first stop on every screen (`src/components/Layout.tsx:152-154`). Keyboard focus always shows a 3 px outline (`src/index.css:47-58`). The main content comes before the navigation in Tab order, even where the navigation is drawn first (`src/components/Layout.tsx:287-292`)." |
| 0:40–1:40 | Screen reader (NVDA) | 1. On Medicines, press Ctrl+Home, then B until NVDA says "Mark Atorvastatin as taken, toggle button, not pressed", then press Space. NVDA says "pressed", then "1 medicine still to take today."<br>2. Switch to window 2 (Sign in). Press **Sign in** with both fields empty. NVDA reads the error summary and the field errors.<br>3. Press Shift+Tab to the email field: "invalid entry, Please enter your email address." | "Status changes are spoken without moving focus: the medicine count is a polite status region (`src/pages/Medications.tsx:83-105`). Errors are tied to their fields with `aria-invalid` and `aria-describedby` (`src/components/Field.tsx:89-104`)." If R8 or R11 from the procedure is still open, say so: "we found this, and here's the fix." |
| 1:40–2:15 | Zoom and reflow | 1. In window 1, press Ctrl+Plus up to 400%. On a 1280 px window that is 320 CSS px: one column, the bottom bar, and no sideways scrolling.<br>2. Press Ctrl+0. | "WCAG 1.4.10, Reflow. All sizes are in rem on an 18 px base (`src/index.css:10-12`, `tailwind.config.js:15-23`). An overflow guard stops sideways scrolling at 320 px (`src/index.css:18-26`)." |
| 2:15–2:30 | Large targets | Point at the Quick action tiles and the bottom bar. | "Buttons and form fields have a 2.75 rem minimum, about 50 px on our 18 px base, which is above the 44 px AAA target (`src/index.css:82-96`). The bottom-bar items are 3.5 rem (`src/components/Layout.tsx:407`)." Don't say "every control": the Memories "Read more" button removes its minimum (`src/pages/Memories.tsx:176`). |
| 2:30–2:45 | Reduced motion and high contrast | Say it rather than show it, unless you rehearsed it. | "With 'reduce motion' turned on in the operating system, page transitions and smooth scrolling switch off (`src/index.css:28-38`). In Windows High Contrast we checked __ (fill this in from the dry run)." |
| 2:45–3:00 | Evidence | Show the Lighthouse report, then the WAVE table. | "Lighthouse Accessibility: __. WAVE errors went from __ to __. We also tested with axe DevTools, NVDA and VoiceOver, and documented each fix." |

**App-specific points to mention, if there is time:**

- An orientation bar on every screen shows the day, the live time, a greeting and the current screen name (`src/components/Layout.tsx:228-284`). This is for users with short-term memory loss.
- Status is always a word plus an icon, never colour alone (`src/pages/Today.tsx:92-117`).
- "Call my caregiver" is on every care-recipient screen (`src/components/Layout.tsx:273-283`).
- The landing assistant refuses medical questions (`src/components/ChatBot.tsx:21-26`).

**Before you claim High Contrast support for the web app:**

- There is no `forced-colors` CSS in `src/index.css`.
- The bottom bar shows the current page by colour alone (`src/components/Layout.tsx:410-413`), and forced colours remove that.
- Do a dry run with Left Alt+Left Shift+Print Screen. Only show what holds up.

## 2. Desktop app: `careconnect-electron` (3:00)

This is a short version of `careconnect-electron/docs/accessibility-demo-script.md`.

| Time | Feature | Steps | What to say |
|---|---|---|---|
| 0:00–0:50 | Keyboard only | 1. Press Tab: the skip links appear (*Skip to main workspace*, *Skip to patient list*, *Skip to status*).<br>2. Press F6 a few times to move between regions, then Shift+F6 to go back.<br>3. In the patient list, press Down and Up.<br>4. Press Ctrl+/ to open the shortcuts reference, then Esc. | "Keyboard first. F6 moves between regions. Toolbars and lists are one Tab stop each, and the arrow keys move inside them. One table drives the menus, the shortcuts and this reference, so they can't disagree (`careconnect-electron/README.md`, Architecture)." |
| 0:50–1:50 | NVDA | 1. Press NVDA+T: NVDA reads the window title, "Patients · CareConnect — Clinical workspace".<br>2. In the patient list, NVDA reads "Recent patients, list, Avery Park, … Needs review, selected, 1 of 28". NVDA switches to focus mode in the list, so the single-key shortcuts work there.<br>3. With focus in the list, press N (Add clinical note), then submit the note empty. Focus moves to "There is a problem: Enter the note text". Activate the link: focus goes to the field, which says "invalid entry".<br>4. Type a note and press Ctrl+Enter: "Note added for Avery Park."<br>5. Press Ctrl+K, type `inb` and press Enter. The result count is spoken as you type, and the Inbox opens. | "Errors move focus to a summary that links to each field. Success is announced through a polite live region, and the message stays in the status bar until it is dismissed (`careconnect-electron/docs/accessibility/screen-reader-notes.md`)." |
| 1:50–2:30 | High contrast, in-app theme, reduced motion | 1. Press Left Alt+Left Shift+Print Screen. Focus becomes the system highlight colour, and the status chips keep their icon and word. Turn it off again.<br>2. Press Ctrl+, (Settings). Toggle *High contrast theme* and *Reduce motion*; each switch announces its new state. | "We follow Windows High Contrast with `forced-colors` styles (`careconnect-electron/src/renderer/src/styles/base.css:722`). We also offer our own theme and a reduce-motion setting (`base.css:697`)." |
| 2:30–2:50 | Zoom | Press Ctrl+= eight times, to 207%. The panes stack and nothing is clipped. Then press Ctrl+0. | "It reflows down to 320 CSS px. In Week 9, 33 of 33 reflow and text-spacing checks passed." |
| 2:50–3:00 | Speech-input safety | Settings → Keyboard → *Single-key shortcuts* switch. | "WCAG 2.1.4: speech-input users can turn single-letter shortcuts off." |

**Numbers to quote.** These are the Week 9 results from `careconnect-electron/docs/accessibility/README.md:21-32`, tested on 13 October:

- 0 axe violations on 18 screens and dialogs, after fixing 57 Label in Name issues;
- 12 of 12 keyboard-only tasks passed;
- 2,092 tests, with 99.18% statement coverage.

Say "as of Week 9", unless you re-run the tests this week. If the "Observed results" table in `screen-reader-notes.md` is still empty, today's NVDA run is that evidence: save the Speech Viewer text.

## 3. Flutter: `careconnect_mobile` (2:30)

| Time | Feature | Steps | What to say |
|---|---|---|---|
| 0:00–1:00 | TalkBack | 1. On Patient Today, swipe right onto a dose card. TalkBack reads one sentence: the medicine, dose, time, whether you took it, and the instructions.<br>2. Swipe right again to reach the card's button, "Mark <medicine> <dose> at <time> as taken". Double-tap it.<br>3. TalkBack re-reads the progress card, and the button now says "Undo. Mark … as not taken". | "Each dose card is one sentence plus a separate button: three focus stops, no fragments (`careconnect_mobile/lib/widgets/dose_tile.dart:66-69`, `lib/models/dose.dart:288-297`). The progress card is a live region, so TalkBack confirms the tick (`lib/screens/patient_today_screen.dart:127-133`). Undo is a permanent button, not a message that disappears. That matters for short-term memory loss." |
| 1:00–1:30 | Headings | 1. Open TalkBack's reading controls and choose *Headings*.<br>2. Swipe down to jump through "Take these now", "Later today" and "Already done". | "The sections are real headings, so you can jump straight to 'Already done' (`lib/widgets/section_header.dart:17-20`, `lib/screens/patient_today_screen.dart:193-201`)." |
| 1:30–2:10 | Large text | 1. Settings → Display → set *Font size* (and *Display size*) to the largest.<br>2. Return to the app: the text wraps and nothing overflows. Then set the size back. | "Every patient screen is tested at twice the normal text size, with no overflow allowed (`careconnect_mobile/test/accessibility_test.dart:131`)." |
| 2:10–2:30 | Targets and contrast | Point at the buttons. | "Every target is at least 48 dp, and the main dose buttons are 56 dp (`lib/theme/app_colors.dart:129`, root `README.md`). Contrast ratios are computed from the hex values inside the tests. That is how we found our own brand blue, #1A73E8, fails AA for body text, so we only use it as a fill." |

**Be honest about the gaps** (from `careconnect_mobile/README.md` and the root `README.md`, *Known issues*):

- There is no explicit handling of the system high-contrast or reduce-motion settings, so don't claim it.
- The caregiver screens show static content.
- The Profile screen's Sign Out button announces only "Sign Out".

## 4. React Native: `careconnect-rn` (2:00)

Code references are relative to `careconnect-rn/`.

| Time | Feature | Steps | What to say |
|---|---|---|---|
| 0:00–0:50 | Screen reader | 1. With TalkBack or VoiceOver on, on Landing, swipe to "Sign in to your existing account, button" and "Create a new account, button" (`src/screens/LandingScreen.tsx:25-36`).<br>2. Sign in with any details. On Role Selection: "Select patient role, manage your own care, button" (`src/screens/RoleSelectionScreen.tsx:39-40`).<br>3. On the Medications tab, each card is read as one label: the name, its purpose, and today's doses (`src/screens/PatientMedicationsScreen.tsx:123-124`). | "Every control has a role and a label, so screen readers say what it is and what it does." |
| 0:50–1:15 | Large targets | Point at the buttons. | "The landing buttons are 56 dp tall and the role cards 88 dp (`src/screens/LandingScreen.tsx:88, 107`, `src/screens/RoleSelectionScreen.tsx:95`)." |
| 1:15–1:35 | Large text | Turn up the system font size. React Native text follows that setting by default. | Show this only if you rehearsed it: React Native was never tested at large text sizes. |
| 1:35–2:00 | The honest comparison | | "React Native reproduced the screens and the labels, but not Flutter's discipline. There are no design tokens, no measured contrast, and no accessibility test. Its testing library has no layout engine, so it cannot check target size or contrast at all (`careconnect-rn/COMPARISON.md`)." |

**Don't demo:**

- **"Mark as taken" on Today.** It is a stub: it logs to the console and nothing changes (`src/screens/PatientTodayScreen.tsx:69`; README *Known issues*).
- **The dose card's button.** The "Mark as taken" button sits inside another button (`src/screens/PatientTodayScreen.tsx:166`, `:186`), so a screen reader may not be able to reach it on its own.
- **Heading navigation.** Only one screen marks its title as a header (`src/screens/AddEditPatientScreen.tsx:66`).
- **High contrast or reduce motion.** There is no handling for either, so don't claim them.

## Closing (0:15)

"On all four platforms we applied the same rules:

- controls have real names and roles;
- status is never shown by colour alone;
- targets are large.

We measured what we could rather than assuming it. We fixed what the tools and the screen readers found, and we listed what is still open."

## Backup plan

| If this fails | Do this |
|---|---|
| The web dev server won't start, or the port is taken | Use the URL Vite prints (5174, and so on). If it still fails, play the recorded web segment. |
| NVDA is silent | Press Ctrl+Alt+N to restart NVDA, and check that it has an audio output device. Narrator (Win+Ctrl+Enter) is the fallback for the desktop app. |
| The phone can't reach Expo | Restart with `npx expo start --go --tunnel`. If that also fails, play the recording. |
| TalkBack gestures misfire on camera | Narrate from the "Display speech output" captions, or play the recording. |
| Windows High Contrast looks broken in the web app | Say that it is a known limitation, and show the desktop app's forced-colours support instead. |

## Likely questions

- **"What did the tools miss?"** Focus moves and screen-reader announcements. That is why we ran NVDA and VoiceOver by hand (`screen-reader-procedure.md` section 5).
- **"Why only 2.1 AA?"** It was the course target. The web app's buttons and fields also meet the 44 px AAA target (2.5.5), with one exception to fix, and the desktop app follows the 2.2 AA design spec.
- **"How do you know the contrast passes?"** The ratios are calculated from the hex values, not judged by eye. The Flutter and desktop apps assert them in tests. For the web app, the same calculation found the grey text that fails (`wave-checklist.md` section 6).
