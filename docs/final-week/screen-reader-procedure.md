# Screen-reader test procedure: CareConnect web app

This is the screen-reader test for `careconnect-web`. It covers NVDA with Chrome on Windows, and VoiceOver with Safari on macOS and on iOS. It gives:

- the setup;
- the key commands for each screen reader;
- a script for each key flow, with the announcement to expect at every step;
- the risks: places where the markup suggests a screen reader will **not** say something it should;
- a results table to fill in.

This procedure was written from the code at commit `e79a08c` (master, 2 November 2026).

- The expected announcements come from the markup: roles, names, headings, states and live regions. Each step cites the source as `file:line`, relative to `careconnect-web/`.
- Fixes landing this week will move line numbers and may change URLs, for example to `#/app/...` hash routes. If `git log -1 --format=%h` shows a newer commit, use the URL in the address bar, and re-check a citation with `grep -n` before relying on it.
- A step marked with a risk number (**R1**, **R2**, ...) is a candidate fix. Section 5 explains each risk.

## 1. How to read the steps

- **Expected (roughly)** gives the name, then the role, then the state, for example "Sign out of CareConnect, button". NVDA and VoiceOver word things differently, and the wording also changes with the version and verbosity settings. **Judge the name, role and state, not the exact words.**
- **The data depends on the clock.** These all change with the time of day:
  - which item is featured on Today;
  - the "Now" and "Coming up" badges;
  - overdue alerts;
  - which appointments count as "today".

  The app takes "today" from the UTC date, so EST evenings and JST mornings can be a day off. Don't fail a step because an item name, time or count differs from this script.
- **Pass** means you heard the expected name, role and state. **Fail** means something was missing or wrong, or the step's risk happened. Write what you heard in the Notes column.
- **Order matters.** Flows B and C (care recipient) create the activity that Flows G and J (caregiver) read.
- **After a page change, press Ctrl+Home before H.** Focus usually stays where it was, often in the navigation, which comes after the main content. H only searches forward, so without Ctrl+Home it finds nothing.

## 2. Setup

### 2.1 The app and the test data

1. Start the app:

   ```bash
   cd careconnect-web
   npm install        # first time only
   npm run dev
   ```

   - **NVDA:** open the `Local:` URL in Chrome on Windows (normally http://localhost:5173/). Windows Chrome reaches a server in WSL on `localhost`.
   - **macOS:** run the same commands on the Mac.
   - **iOS:** run `npm run dev -- --host` on a Mac or a Windows machine on the same Wi-Fi, then open the `Network:` URL in Safari on the iPhone. A server inside WSL usually can't be reached from a phone.
2. **Start clean.** Open DevTools, then Application → Storage → *Clear site data*. In Safari on a Mac, use Settings → Privacy → Manage Website Data, and remove `localhost`. On an iPhone, use Settings → Safari → Advanced → Website Data.
3. **Mock sign-in facts.** Sign in only accepts an email that has signed up in this browser. Any password works for sign in. Sign up needs a password of at least 6 characters (`src/auth/mockAuth.ts:77-88`, `src/pages/SignUp.tsx:22-39`). Flow A creates the account `margaret@example.com` with the password `careconnect`.
4. **Window.** Use Chrome at 100% zoom, at least 1280 px wide.

### 2.2 NVDA with Chrome (Windows)

- Install NVDA from https://www.nvaccess.org/ and update Chrome. Start NVDA with Ctrl+Alt+N.
- "NVDA" in a command means the NVDA key, which is Insert by default.
- **Speech Viewer (your transcript):**
  1. Press NVDA+N, then Tools → *Speech Viewer*. A window shows everything NVDA says.
  2. To save a flow, click in that window, press Ctrl+A, then Ctrl+C, and paste the text under the flow in your results file.
  3. Tick *Show Speech Viewer on startup* if you'll restart NVDA.
- **Optional, for the video:** NVDA+N → Preferences → Settings → Vision → *Enable highlighting*. This draws a box around NVDA's focus.
- **Browse mode and focus mode.** NVDA starts in browse mode, where single letters jump around the page: H for headings, D for landmarks, B for buttons, K for links, F for form fields. Moving into a form field switches to focus mode, so you can type. NVDA+Space switches modes by hand.
- **Article labels.** NVDA may not report articles with its default settings. To check, open NVDA+N → Preferences → Settings → Document formatting, and look for *Articles*. Keep NVDA's default settings for the test; the steps say where this matters.

### 2.3 VoiceOver with Safari (macOS)

- Turn VoiceOver on and off with Cmd+F5. "VO" means Control+Option.
- **Tab key:** in Safari Settings → Advanced, tick *Press Tab to highlight each item on a webpage*. Otherwise Tab skips links.
- **Transcript:** the caption panel at the bottom of the screen shows what VoiceOver says, so screenshot it or screen-record it. VoiceOver can also copy its last spoken phrase to the clipboard. This is VO+Shift+C on recent macOS; press VO+H and open the Commands menu to confirm it on your version.
- **Rotor:** VO+U lists headings, landmarks, links and form controls. Use Left and Right arrows to change the list.

### 2.4 VoiceOver with Safari (iOS)

- Settings → Accessibility → VoiceOver. Set Settings → Accessibility → *Accessibility Shortcut* to VoiceOver, so a triple-click of the side button turns it on and off.
- **Caption Panel:** Settings → Accessibility → VoiceOver → *Caption Panel* shows the speech on screen. A screen recording made from Control Center captures VoiceOver's voice.
- iOS VoiceOver may not follow focus that the page moves itself. Risks R1, R2 and R4 may therefore sound different on an iPhone. Write down what happens.

### 2.5 Key commands

| What you want | NVDA + Chrome | VoiceOver, macOS | VoiceOver, iOS |
|---|---|---|---|
| Stop speech | Ctrl | Control | Two-finger tap |
| Read from here | NVDA+Down arrow | VO+A | Two-finger swipe down (swipe up reads from the top) |
| Next or previous item | Down or Up arrow | VO+Right or VO+Left | Swipe right or left |
| Next control | Tab, Shift+Tab | Tab (with the Safari setting above) | Swipe right |
| Activate | Enter or Space | VO+Space | Double-tap |
| Next heading | H, Shift+H back; 1 to 6 for a level | VO+Cmd+H | Rotor: *Headings*, then swipe down |
| Next landmark | D, Shift+D | VO+U, then *Landmarks* | Rotor: *Landmarks* |
| Next link, button, form field | K, B, F (E for text fields) | VO+Cmd+L; VO+Cmd+J for form controls | Rotor: *Links*, *Form Controls* |
| List of headings, links, landmarks | NVDA+F7 | VO+U | Rotor |
| Read the page or window title | NVDA+T | VO+F2 (describes the window) | (read only when a page first loads) |
| What has focus | NVDA+Tab | VO+F4 | (the item in the VoiceOver cursor) |
| Close a dialog | Esc | Esc | Two-finger scrub (a quick "Z") |
| Open a select (combo box) | Alt+Down arrow, then arrows and Enter | VO+Space, then arrows and VO+Space | Double-tap, then the picker |
| Switch browse and focus mode | NVDA+Space | (no modes) | (no modes) |

The steps below give NVDA keys. Use the table to translate them for VoiceOver. VoiceOver commands vary a little between macOS versions; VO+H opens VoiceOver Help, which lists the ones your Mac uses.

VoiceOver words some states differently from NVDA:

- "selected" or "on" instead of "pressed";
- "dimmed" instead of "unavailable";
- "invalid data" instead of "invalid entry".

## 3. Checks on every page

Run these once on any signed-in page, for example Today.

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| X1 | NVDA+T on several pages | "CareConnect — Your Daily Companion". It should change per page, but **it is the same on every page**. | `index.html:7`. Nothing in `src/` sets `document.title`. | R3 |
| X2 | Ctrl+Home, then Tab | "Skip to main content, link". Press Enter: "Main content, main landmark". | `src/components/Layout.tsx:152-154`, `:302-305` | |
| X3 | NVDA+F7, then *Landmarks* | banner; main "Main content"; navigation "Main navigation"; content info (only at 1024 px and wider); **plus one region for every card on the page** | `src/components/Layout.tsx:163-166, 302-305, 322-325, 387-389, 428-431`; `src/components/Card.tsx:46-47` | R15 |
| X4 | Activate any navigation link | Expected: something tells you the new page has loaded. In this markup nothing does: focus stays on the link, and you may hear only "current page". | `src/components/Layout.tsx:347-365, 399-420` | R3 |

## 4. Flow scripts

### Flow A: Landing, then sign in, then choose a role

Start signed out, on a clean browser (section 2.1).

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| A1 | Open http://localhost:5173/ with NVDA running | The title "CareConnect — Your Daily Companion", then NVDA starts reading the page from the top. Because of R2, you may hear "Need help getting started? Open assistant, button, collapsed" instead. | `index.html:7`; `src/components/ChatBot.tsx:129-135, 198-203` | **R2** |
| A2 | NVDA+F7, then *Landmarks* | banner; navigation "Account navigation"; main "Main content"; regions "Your daily companion for calm, confident care.", "How CareConnect helps", one per feature card, "Made for two kinds of people", "Ready to get started?"; content info | `src/pages/Landing.tsx:53, 69, 93, 96-99, 145-148, 164, 181-184, 238-241, 289-292` | R15 |
| A3 | Ctrl+Home, then H repeatedly | "Your daily companion for calm, confident care., heading level 1"; "How CareConnect helps, heading level 2"; three level-3 card headings, such as "Stay on top of medications"; "Made for two kinds of people, level 2"; "For care recipients, level 3"; "For caregivers, level 3"; "Ready to get started?, level 2" | `src/pages/Landing.tsx:109-115, 151-156, 164, 186-191, 199, 219, 243-248` | |
| A4 | Ctrl+Home, then Tab | "Skip to main content, link". Press Enter: "Main content, main landmark". If focus started on the chat button, the first Tab goes to Chrome's toolbar; keep pressing Tab. | `src/pages/Landing.tsx:46-48, 93` | R2 |
| A5 | Keep tabbing through the header and hero | "Account navigation, navigation, list with 2 items, Sign in, link"; "Sign up, link"; then "Sign up for CareConnect, link" and "Sign in to CareConnect, link". These two names replace the visible words "Get started — it's free" and "I already have an account". | `src/pages/Landing.tsx:69-88, 124-138` | (section 6) |
| A6 | Optional: B to the chat button, then Enter | "CareConnect Assistant, dialog", then "Type your question and press Enter to send, edit" | `src/components/ChatBot.tsx:198-203, 223-227, 246-248, 129-132, 342-352` | |
| A7 | Type `how do I sign up`, then Enter | After a moment, read out politely: "To sign up, click the 'Sign up' or 'Get started' button on this page…". Nothing says "Assistant is typing" while you wait. The text box is disabled while it waits, so focus may leave it; you may have to Tab back. | `src/components/ChatBot.tsx:272-282, 47-49, 317-331, 351` | R4, R6 |
| A8 | Esc | The panel closes. "Need help getting started? Open assistant, button, collapsed" | `src/components/ChatBot.tsx:143-153, 133` | |
| A9 | K to "Sign in, link", then Enter. Then Ctrl+Home and H. | The page change itself is silent. H: "Welcome back, heading level 1" | `src/pages/SignIn.tsx:73` | R3 |
| A10 | Tab through the form | "Email address (required), edit, required" (the placeholder "you@example.com" may follow); "Password (required), protected edit, required, Any password works — this is a demonstration app."; "Sign in, button" | `src/pages/SignIn.tsx:99-129`; `src/components/Field.tsx:89-91, 112-121` | R13 |
| A11 | Press Sign in with both fields empty | Alert: "Please correct the errors below to continue.", and the field alerts "Please enter your email address." and "Please enter your password." Focus stays on the button. | `src/pages/SignIn.tsx:78-90`; `src/components/Field.tsx:158-168` | R11 |
| A12 | Shift+Tab back to the email field | "Email address (required), edit, invalid entry, required, Please enter your email address." | `src/components/Field.tsx:102-104, 158-161` | |
| A13 | Email `nobody@example.com`, any password, Enter | Alert: "We couldn't find an account with that email. Please sign up first." | `src/auth/mockAuth.ts:84-86`; `src/pages/SignIn.tsx:37-40, 78-90` | |
| A14 | K to "Sign up for free, link", Enter, then Ctrl+Home and H | Silent page change. H: "Create your account, heading level 1" | `src/pages/SignIn.tsx:135-137`; `src/pages/SignUp.tsx:87` | R3 |
| A15 | Fill in `Margaret Whitfield`, `margaret@example.com`, password `123`, confirm `123`; press Create account | Alerts: "Please correct the errors below to continue." and "Password must be at least 6 characters." | `src/pages/SignUp.tsx:30-33, 94-106` | R11 |
| A16 | Change both passwords to `careconnect`, then Create account | The role chooser loads in silence. H: "Welcome, Margaret!, heading level 1" | `src/pages/SignUp.tsx:56`; `src/pages/RoleChooser.tsx:56-58` | R3, R4 |
| A17 | B, then B again | "Choose your role, grouping, I am the Care Recipient — View your daily schedule, medicines, memory aids, and contacts, button"; then "I am the Caregiver — Manage the care plan, add shift notes, and track medicines, button" | `src/pages/RoleChooser.tsx:68-86`; `src/components/BigActionTile.tsx:64, 71` | |
| A18 | Enter on "I am the Care Recipient" | Today loads in silence. H: "Here's your day, Margaret, heading level 1" | `src/pages/RoleChooser.tsx:12-17`; `src/pages/Today.tsx:369-371` | R3, R4 |

### Flow B: Care recipient, Today (`/app`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| B1 | Ctrl+Home, then Down arrow through the header | "Skip to main content, link"; banner; "CareConnect — go to home, link"; "Care recipient"; "Switch to caregiver role, button"; "Sign out of CareConnect, button"; the date, for example "Monday 2 November"; the time, for example "3:05 PM"; "Good afternoon, Margaret"; "Home"; "Call your caregiver: Joyce — 07700 900 456, link". The time and the screen name are read without their labels "Current time:" and "Current screen:". | `src/components/Layout.tsx:152-154, 163-166, 170-174, 187-200, 204-224, 236-259, 274-283` | R9 |
| B2 | D to "Main content, main landmark", then Down | "Here's your day, Margaret, heading level 1"; "3 of 10 things done today" | `src/components/Layout.tsx:302-305`; `src/pages/Today.tsx:368-375` | |
| B3 | D to "Next thing to do, region", then Down through it | "Next thing to do"; a status word ("Coming up" or "Now"); "Appointment"; "3:00 pm"; "Video call with Maria"; "Your daughter — she will call you"; "I'm ready: Video call with Maria, button". This card has no heading, so H skips it. | `src/pages/Today.tsx:393, 170-229` | R12 |
| B4 | Enter on that button | Expected: a confirmation, then the next task. In this markup there is no live region, and the "3 of 10" line is not one either. The same button is now named "Mark as taken: Evening medications", which NVDA may or may not read out. | `src/pages/Today.tsx:221-228, 343-345, 372-374` | **R5** |
| B5 | Enter on "Mark as taken: Evening medications" | Expected: a confirmation. In this markup the card turns into "All done for today!", the button disappears, and focus is lost. The message also says everything is done while "Later today" still lists tasks. | `src/pages/Today.tsx:394-402, 135-152, 331-339` | **R4**, R17 |
| B6 | H to "Later today, heading level 2", then read on | "list with 4 items"; for each task: "<task>, region", "<task>, heading level 3", time, category, status word, description; then "See full day schedule, link" | `src/pages/Today.tsx:406-426, 236-278`; `src/components/Card.tsx:46-47` | R15 |
| B7 | H to "Quick actions, heading level 2", then B | "Medications — View and mark today's medicines, button"; "Appointments — See your upcoming visits and calls, button"; "Check In — Let your caregiver know you're well, button"; "Call Caregiver — Call Joyce — 07700 900 456, button" | `src/pages/Today.tsx:431-469`; `src/components/BigActionTile.tsx:64, 71` | |
| B8 | Enter on "Check In" | Read out politely: "Checked in. You checked in at 3:06 PM. Your caregiver can see you're doing well." The tile becomes "Checked In — Checked in at 3:06 PM, button, unavailable". The banner may not be read at all, and the now-disabled button may drop focus. | `src/pages/Today.tsx:347-358, 378-382, 450-461`; `src/components/Banner.tsx:110-112` | **R6**, R4 |

### Flow C: Care recipient, marking a medication taken (`/app/medications`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| C1 | D to "Main navigation" (the bottom bar), K to "Medicines, link", Enter, then Ctrl+Home and H | A silent page change, or just "current page". H: "Medicines, heading level 1" | `src/components/Layout.tsx:387-424`; `src/pages/Medications.tsx:78` | R3 |
| C2 | Down | "Today's medication tracker"; "2 medicines still to take today." | `src/pages/Medications.tsx:79, 83-93` | |
| C3 | H, then Down | "Medication list, heading level 2"; "list with 4 items" | `src/pages/Medications.tsx:108-110` | |
| C4 | Down through Amlodipine | "Amlodipine"; "5 mg — 1 tablet"; "8:30 am"; "Take with food."; "Mark Amlodipine as not taken, toggle button, pressed". The card's own label, "… — taken", is only read if article reporting is on. | `src/pages/Medications.tsx:115-118, 128-159` | **R8**, R18 |
| C5 | B to "Mark Atorvastatin as taken, toggle button, not pressed", then Space | "pressed" (the name may be read again, now "Mark Atorvastatin as not taken"), then politely: "1 medicine still to take today." | `src/pages/Medications.tsx:50-69, 148-153, 83-93` | R8 |
| C6 | The same for Vitamin D3 | "pressed", then "All medicines taken for today. Well done!" | `src/pages/Medications.tsx:94-105` | |
| C7 | Space again on Vitamin D3, to undo | "not pressed", then "1 medicine still to take today." | `src/pages/Medications.tsx:50-66, 83-93` | |
| C8 | Space once more, so Vitamin D3 is taken again | "pressed", then "All medicines taken for today. Well done!" Steps C5 to C8 and B8 now appear in the caregiver's activity log. | `src/pages/Medications.tsx:59-65`; `src/pages/Today.tsx:353-357` | |

### Flow D: Care recipient, appointments (`/app/appointments`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| D1 | Bottom nav "Appointments", Enter, then Ctrl+Home and H | Silent page change. H: "My Appointments, heading level 1" | `src/pages/Appointments.tsx:301-303` | R3 |
| D2 | D repeatedly | "Today, region"; "Later this week, region"; "Coming up, region"; and a region for every appointment card | `src/pages/Appointments.tsx:311, 335, 354, 93-106` | R15 |
| D3 | H from the page heading | The next heading is "Blood pressure check — Dr. Sharma, heading level 3". The group names are not headings, so level 2 is skipped. | `src/pages/Appointments.tsx:142-145, 90-113` | **R12** |
| D4 | Down through that card | "Monday 2 November — 10:30 am"; "Greenfield Surgery"; "12 Greenfield Road, Westfield"; "Clinic visit"; "Joyce is taking you to this appointment"; the note; "Get directions to Greenfield Surgery, button"; "In My Day". The hidden label "already in your My Day schedule" is not read. | `src/pages/Appointments.tsx:159-245` | R9 |
| D5 | B to 'Add "Blood test — fasting needed" to My Day schedule, button', then Enter | Expected: "Added to My Day", or similar. In this markup the button turns into plain "In My Day" text, focus is lost, and nothing is said. | `src/pages/Appointments.tsx:238-255, 272-274` | **R4**, **R5** |
| D6 | Find "GP telephone review — Dr. Sharma" | "Telephone — no travel needed"; "No travel needed" in place of a directions button | `src/pages/Appointments.tsx:70-75, 228-234` | |

### Flow E: Care recipient, contacts (`/app/contacts`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| E1 | Bottom nav "Contacts", Enter, then Ctrl+Home and H | Silent page change. H: "Contacts, heading level 1" | `src/pages/Contacts.tsx:23` | R3 |
| E2 | H, then Down | "Emergency contacts, heading level 2" inside "Emergency contacts, region"; "list with 3 items" | `src/pages/Contacts.tsx:28-33` | |
| E3 | Down through Maria | "Maria Thompson"; "Family"; "Your daughter. Calls every Tuesday and Sunday."; "Call Maria Thompson on 07700 900 123, link" | `src/pages/Contacts.tsx:79-115` | |
| E4 | K repeatedly | Each call link names the person and the number: "Call Joyce Adeyemi on 07700 900 456, link"; "Call Emergency Services on 999, link"; "Call Dr. Priya Sharma on 01234 567 890, link"; "Call Tom Thompson on 07700 900 789, link" | `src/pages/Contacts.tsx:105-115` | |
| E5 | H | "Other contacts, heading level 2" | `src/pages/Contacts.tsx:44-47` | |

Don't activate a call link. Windows will ask which app to use; if it does, press Cancel.

### Flow F: Care recipient, memories (`/app/memories`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| F1 | Bottom nav "Memories", Enter, then Ctrl+Home and H | Silent page change. H: "Memories, heading level 1" | `src/pages/Memories.tsx:41` | R3 |
| F2 | Tab, then keep tabbing | "Filter memories by category, grouping, All, toggle button, pressed"; "Family, toggle button, not pressed"; then Places, Memories, Hobbies and Pets | `src/pages/Memories.tsx:48-62` | |
| F3 | Space on "Hobbies" | "pressed". Expected: how many memories are now shown. In this markup nothing announces that the list changed. | `src/pages/Memories.tsx:27-35, 48-63` | **R5** |
| F4 | Space on "All", then H | "Pinned, heading level 2" | `src/pages/Memories.tsx:66-71` | |
| F5 | Down | "Maria — Your Daughter, graphic"; "Family"; "Pinned"; "Maria — Your Daughter, heading level 3". The title is heard twice. | `src/pages/Memories.tsx:130-159` | R14 |
| F6 | Down | The whole story is read, even though the screen shows only three lines. Then "Read more, button, collapsed"; press Enter and it becomes "expanded". There is nothing new to hear, and that is fine. | `src/pages/Memories.tsx:164-182` | |

### Flow G: Caregiver, dashboard (`/app`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| G1 | Ctrl+Home, B to "Sign out of CareConnect, button", then Enter | You are back on Landing, and focus jumps to the chat button: "Need help getting started? Open assistant, button, collapsed" | `src/components/Layout.tsx:217-224`; `src/components/ChatBot.tsx:129-135` | **R2** |
| G2 | Ctrl+Home, K to "Sign in", Enter; email `margaret@example.com`, any password, Enter | The role chooser loads in silence. H: "Welcome, Margaret!, heading level 1" | `src/pages/SignIn.tsx:26-42`; `src/auth/AuthContext.tsx:52-60` | R3 |
| G3 | Ctrl+Home, B to "I am the Caregiver — Manage the care plan, add shift notes, and track medicines, button", then Enter | The dashboard loads in silence. H: "Dashboard, heading level 1" | `src/pages/RoleChooser.tsx:80-86`; `src/pages/CaregiverDashboard.tsx:306-308` | R3, R4 |
| G4 | Ctrl+Home, then Down through the header | As in B1, except: "Caregiver"; "Switch to care recipient role, button"; the screen name "Home" (the page heading says "Dashboard"); "Viewing Margaret's care plan" | `src/components/Layout.tsx:199, 207-211, 50-51, 263-269` | R16 |
| G5 | Back to the page heading, then Down | "Margaret's care overview — Monday 2 November"; "5/10 tasks done". The label "Schedule: 5 of 10 tasks done" is not read. | `src/pages/CaregiverDashboard.tsx:309-329` | R9 |
| G6 | Down into the status card | "Margaret's status today, region"; "Margaret's status today, heading level 2"; "Medications", "4 of 4", "All taken today"; "Check-in", "Done", "at 3:06 PM"; "Next appointment", then its title, when it is (for example "Tomorrow — 8:45 am") and the place | `src/pages/CaregiverDashboard.tsx:78-169` | |
| G7 | D to "Alerts, region", then Down | "Alerts, 3, heading level 2", then each alert as two lines, for example "Appointment today" and "Heart checkup — Dr. Lee at 2:30 pm". The label "3 alerts" on the count is not read. | `src/pages/CaregiverDashboard.tsx:340-395` | R9 |
| G8 | Optional live check: open a second tab at http://localhost:5173/app/medications, untick Vitamin D3, then come back to this tab | The dashboard refreshes when its tab regains focus, and the Alerts region is a polite live region. A new "Vitamin D3 — overdue" alert should be read. If you tick it again and come back, the alert disappears, and you may hear only the new count. | `src/pages/CaregiverDashboard.tsx:278-295, 340-345` | R7 |
| G9 | H to "Recent activity, heading level 2", then Down | "View all, link"; "Recent activity timeline, list with 5 items" (more if you did G8); for example "Marked Vitamin D3 as taken", "Medication taken", "2m ago" | `src/pages/CaregiverDashboard.tsx:401-439, 241-266` | |
| G10 | H to "Quick links, heading level 2", then K | "Manage medications, link"; "Manage appointments, link"; "View caregiver notes, link"; "View full activity log, link". The status line under each one, such as "4/4 taken today", is not read. | `src/pages/CaregiverDashboard.tsx:443-543` | R10 |
| G11 | D to "Main navigation" | "Dashboard, link, current page"; "Medications, link"; "Appointments, link"; "Activity, link"; "Notes, link"; "Switch to care recipient role, button". The navigation comes after the main content in reading order, even though it is drawn on the left. | `src/components/Layout.tsx:322-381` | |

### Flow H: Caregiver, managing medications (`/app/manage-medications`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| H1 | In "Main navigation", Enter on "Medications, link" | Expected: you hear the new page or its heading. In this markup focus jumps to the **last Delete button**: "Delete Vitamin D3, button" | `src/components/ConfirmDialog.tsx:95-99`; `src/components/Button.tsx:116-117`; `src/pages/ManageMedications.tsx:342-352` | **R1** |
| H2 | Ctrl+Home, then H | "Manage medications, heading level 1"; "Add, edit, or remove Margaret's prescriptions" | `src/pages/ManageMedications.tsx:397-403` | |
| H3 | H, then Down | "Current medications, heading level 2"; "list with 4 items"; "Amlodipine, region"; "Amlodipine, heading level 3"; "5 mg — 1 tablet"; "8:30 am"; "Take with food."; "Edit Amlodipine, button"; "Delete Amlodipine, button" | `src/pages/ManageMedications.tsx:434-462, 309-357` | R9, R15 |
| H4 | Enter on "Delete Amlodipine, button" | "Delete medication, dialog, Are you sure you want to delete Amlodipine? This cannot be undone and will remove it from Margaret's medicines list."; then "Close dialog, button" | `src/components/ConfirmDialog.tsx:53-58, 132-171`; `src/pages/ManageMedications.tsx:345-347` | |
| H5 | Tab, Tab, Tab | "Cancel, button"; "Yes, delete, button"; then back to "Close dialog, button". Focus stays inside the dialog. | `src/components/ConfirmDialog.tsx:62-88, 179-192` | |
| H6 | Esc | The dialog closes. "Delete Amlodipine, button" | `src/components/ConfirmDialog.tsx:63-67, 95-99` | |
| H7 | Ctrl+Home, B to "Add new medication, button", then Enter | Expected: focus moves into the form. In this markup the button disappears and nothing takes focus, so you may hear nothing. H: "Add new medication, heading level 2" | `src/pages/ManageMedications.tsx:406-430, 143-150` | **R4** |
| H8 | Tab through the form | "Cancel and close form, button"; "Medication name (required) (required), edit, required"; "Dose (required) (required), edit, required, Include strength, form, and quantity."; "Schedule times (required) — at least one time is required, grouping", then the time field (Chrome splits it into hour, minute and AM/PM); "Add another scheduled time, button"; "Instructions / notes, edit, multi line, Optional — patient-facing instructions shown on the medicines screen."; "Add medication, button"; "Cancel, button" | `src/pages/ManageMedications.tsx:151-158, 192-290`; `src/components/Field.tsx:112-121` | R13 |
| H9 | Enter on "Add medication" with the form empty | Focus moves to the error summary: "Please fix the following before saving:, list with 3 items, Medication name is required., Dosage is required., At least one scheduled time is required." Each field's message is also an alert, so you may hear every message twice, or speech may cut off. | `src/pages/ManageMedications.tsx:129-136, 162-183` | **R11** |
| H10 | Tab | "Medication name (required) (required), edit, invalid entry, required, Medication name is required."; "Dose …, invalid entry, …, Dosage is required." (the hint is no longer read); the time field: "invalid entry, At least one scheduled time is required." | `src/components/Field.tsx:89-91, 102-104, 151-168`; `src/pages/ManageMedications.tsx:230-244, 259` | |
| H11 | Fill in the name `Donepezil`, the dose `5 mg — 1 tablet` and the time 08:00 AM, then Enter on "Add medication" | Back on "Add new medication, button". Expected: something like "Donepezil added". In this markup there is no message, and you may briefly hear a Delete button first. | `src/pages/ManageMedications.tsx:374-382` | **R5**, R1 |
| H12 | Tab to "Edit Donepezil, button", then Enter | Expected: focus in the edit form. In this markup focus is lost. H: "Edit medication, heading level 2", with the fields filled in | `src/pages/ManageMedications.tsx:148-150, 458` | R4 |
| H13 | Tab to "Cancel, button" (Esc does nothing in this form) | Back on "Add new medication, button" | `src/pages/ManageMedications.tsx:425-428` | |

### Flow I: Caregiver, managing appointments (`/app/manage-appointments`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| I1 | In "Main navigation", Enter on "Appointments, link" | As in H1, focus jumps to the last Delete button: "Delete: Annual health review — Dr. Sharma, button" | `src/pages/ManageAppointments.tsx:485-495`; `src/components/ConfirmDialog.tsx:95-99` | **R1** |
| I2 | Ctrl+Home, then H repeatedly | "Manage appointments, heading level 1"; "All appointments, heading level 2"; then one level-3 heading per appointment | `src/pages/ManageAppointments.tsx:546-549, 583-585, 424-426` | |
| I3 | Down through the first card | "Blood pressure check — Dr. Sharma"; "Today"; "Monday 2 November — 10:30 am"; "Greenfield Surgery — 12 Greenfield Road, Westfield"; "Joyce Adeyemi is assigned"; the note; "Edit: Blood pressure check — Dr. Sharma, button"; "Delete: Blood pressure check — Dr. Sharma, button" | `src/pages/ManageAppointments.tsx:428-495` | |
| I4 | Ctrl+Home, B to "Add new appointment, button", then Enter | Focus is lost, as in H7. H: "Add new appointment, heading level 2" | `src/pages/ManageAppointments.tsx:555-578, 244-246` | R4 |
| I5 | Tab through the form | "Appointment title (required) (required), edit, required, Use plain language Margaret will recognise."; "Date (required) (required)" (Chrome splits it into day, month and year); "Time (required) (required)"; "Location, grouping"; "Location type (required) (required), combo box, Select type…, required"; "Location name (required) (required), edit, required"; "Assigned caregiver, edit, Optional — shown to Margaret as 'Joyce is taking you to this appointment'."; "Patient notes, edit, multi line, Optional — shown in plain language on the patient appointments screen."; "Add appointment, button"; "Cancel, button" | `src/pages/ManageAppointments.tsx:288-401, 150-199` | R13 |
| I6 | Enter on "Add appointment" with the form empty | Focus moves to the summary: "Please fix the following before saving:, list with 5 items, …". Each field's message is also an alert. | `src/pages/ManageAppointments.tsx:226-232, 258-279` | R11 |
| I7 | Tab into the fields | Each field says "invalid entry" and then its message. On "Appointment title" the hint is no longer read. | `src/components/Field.tsx:89-91, 151-168`; `src/pages/ManageAppointments.tsx:178-196` | |
| I8 | On the combo box, Alt+Down arrow, choose "Clinic visit", Enter, then Tab | A new field, "Address, edit, Optional — used for the 'Get directions' button on the patient screen.", now follows "Location name". It appears without an announcement, which is fine. | `src/pages/ManageAppointments.tsx:326-370` | |
| I9 | Tab to "Cancel, button", then Enter | Back on "Add new appointment, button" | `src/pages/ManageAppointments.tsx:573-576` | |

### Flow J: Caregiver, activity log (`/app/activity`)

| # | Do this | Expected (roughly) | Source | Risk |
|---|---|---|---|---|
| J1 | In "Main navigation", Enter on "Activity, link", then Ctrl+Home and H | Silent page change. H: "Activity log, heading level 1", then "Margaret's recent actions — medications taken, check-ins, and tasks" | `src/pages/ActivityLog.tsx:147-153` | R3 |
| J2 | Tab to "Refresh activity log, button", then Enter | Nothing is said, even when new events appear | `src/pages/ActivityLog.tsx:129-131, 155-162` | R5 |
| J3 | Down | "Activity type legend, list with 4 items": "Medication taken", "Medication unmarked", "Task completed", "Checked in" | `src/pages/ActivityLog.tsx:166-183` | |
| J4 | D, then H | "Activity for Today, region"; "Today — 5 events, heading level 2"; "Events for Today, list with 5 items" (7 if you did G8) | `src/pages/ActivityLog.tsx:196-209` | |
| J5 | Down through the events | For each event: the event, its type and the time, for example "Marked Vitamin D3 as taken", "Medication taken", "3:12 PM"; "Unmarked Vitamin D3 (not taken)", "Medication unmarked"; "Checked in at 3:06 PM", "Checked in" | `src/pages/ActivityLog.tsx:81-122`; `src/pages/Medications.tsx:59-65`; `src/pages/Today.tsx:353-357` | |

## 5. Risks: places where a screen reader will not say what it should

Each risk below is a candidate fix. The steps above show where it appears. "Likely" means the code makes it close to certain. "May" means it depends on the browser and screen-reader pairing, so the test will settle it.

### High

| ID | Risk | Where | What the markup does | What the user should hear | Suggested fix |
|---|---|---|---|---|---|
| R1 | Focus jumps to the last Delete button when Manage medications or Manage appointments opens (likely) | `src/components/ConfirmDialog.tsx:95-99`. Every danger `Button` renders a closed `ConfirmDialog` (`src/components/Button.tsx:116-117`); see `src/pages/ManageMedications.tsx:342-352` and `src/pages/ManageAppointments.tsx:485-495`. | The "return focus to the trigger" effect also runs when the dialog first mounts closed, so each Delete button grabs focus as it renders, and the last one wins. | The page heading, or nothing until the user moves. Never a destructive button. | Return focus only when `open` changes from true to false (track the previous value), not on mount. |
| R2 | Focus jumps to the assistant button when Landing loads, including after Sign out (likely) | `src/components/ChatBot.tsx:129-135` | The `else` branch focuses the launcher on mount, so the page starts at its last control and the skip link is no longer the first Tab stop. | The page title, then the page from the top. | Same fix as R1: focus the launcher only after the panel has been open. |
| R3 | Page changes are silent, and every page has the same title (likely) | `index.html:7`. No `document.title` anywhere in `src/`. No focus move after the nav links (`src/components/Layout.tsx:347-365, 399-420`) or after `navigate()` calls (`src/pages/RoleChooser.tsx:16`, `src/pages/SignIn.tsx:41`, `src/pages/SignUp.tsx:56`, `src/pages/Today.tsx:441, 448`). | It is a single-page app with no route-change handling, so focus stays on the link or falls to the page. NVDA+T gives the same title everywhere (WCAG 2.4.2). | "Medicines — CareConnect", then the new page's heading. | On each route change, set `document.title` and move focus to the page's `h1` (or to `main`). One effect in `Layout` and the public pages covers it. |
| R4 | Focus is lost when the control you pressed disappears or becomes disabled (likely) | The Add buttons and every Edit button (`src/pages/ManageMedications.tsx:406-430, 458`; `src/pages/ManageAppointments.tsx:555-578, 606`). "Yes, delete" (`src/components/Button.tsx:78-81`, after which the card unmounts). "Add to My Day" (`src/pages/Appointments.tsx:238-255`). Today's action button when the last item is done (`src/pages/Today.tsx:394-402`). Role and sign-up buttons that navigate (`src/pages/RoleChooser.tsx:16`, `src/pages/SignUp.tsx:56`). The note's Save and Cancel buttons, which close the note form (`src/pages/Caregiver.tsx:82, 129-139`). | The control is removed, so focus falls back to the page body. Controls that become disabled may also lose focus, depending on the browser: "Check In" (`src/pages/Today.tsx:459-460`) and the chat box while it waits for a reply (`src/components/ChatBot.tsx:351`). | The heading of the form that opened, the next card, or the "In My Day" result. | Move focus on purpose: to the form heading when a form opens, to the next item after a delete, and to the result after a toggle. Use `aria-disabled` rather than `disabled` where focus should stay. |
| R5 | Nothing confirms key actions (likely) | Today's action button (`src/pages/Today.tsx:221-228`; the "N of 10 things done" line at `:372-374` is not live). "Add to My Day" (`src/pages/Appointments.tsx:272-274`). Saving or deleting a medication (`src/pages/ManageMedications.tsx:374-386`) or an appointment (`src/pages/ManageAppointments.tsx:517-529`). Memories filters (`src/pages/Memories.tsx:48-63`). Activity "Refresh" (`src/pages/ActivityLog.tsx:129-131`). Saving a note (`src/pages/Caregiver.tsx:42-55`). | No live region changes, so WCAG 4.1.3 (status messages) fails for these. | "Video call with Maria done", "Donepezil added", "Showing 1 memory", and so on. | Keep one polite live region in `Layout` (always in the page, empty at first) and write a short message into it after each action. |

### Medium

| ID | Risk | Where | What the markup does | What the user should hear | Suggested fix |
|---|---|---|---|---|---|
| R6 | Status messages that appear together with their text may not be read (may) | The "Checked in" banner (`src/pages/Today.tsx:378-382`, `src/components/Banner.tsx:110-112`). My Day's all-done message (`src/pages/Schedule.tsx:138-148`). "Viewing Margaret's care plan" on switching role (`src/components/Layout.tsx:263-269`). The assistant's typing indicator, whose text is hidden from screen readers (`src/components/ChatBot.tsx:317-331`). The install banner (`src/components/InstallPrompt.tsx:112-118`). | Each live region is inserted already holding its text. Screen readers reliably announce only changes inside a region that already exists. | "Checked in. You checked in at …" | Render the live container all the time and change only its text. That container can be the same one as in R5. |
| R7 | Dashboard alerts that clear are not announced (likely) | `src/pages/CaregiverDashboard.tsx:340-345` | `aria-live="polite"` with `aria-atomic="false"` and the default `aria-relevant` announces additions only. When an alert goes away you may hear just the new count. | "Vitamin D3 alert cleared, 2 alerts" | Announce a summary through the shared live region (R5) when the count changes. |
| R8 | Toggle buttons change their name **and** report a pressed state (likely) | `src/pages/Medications.tsx:148-153`; `src/pages/Schedule.tsx:119-124` | "Mark Amlodipine as not taken, toggle button, pressed". Is it taken or not? The two signals contradict each other. | "Amlodipine taken, toggle button, pressed" | Keep a fixed name ("Amlodipine taken") with `aria-pressed`, or keep the action name and drop `aria-pressed`. Don't do both. |
| R9 | `aria-label` on a plain `<span>` or `<div>` is ignored (likely) | `src/components/Layout.tsx:244` ("Current time: …"), `src/components/Layout.tsx:256` ("Current screen: …"), `src/pages/Appointments.tsx:241`, `src/pages/CaregiverDashboard.tsx:319, 353`, `src/pages/ManageMedications.tsx:316` ("Scheduled times"), `src/components/ChatBot.tsx:269` ("Conversation") | ARIA doesn't allow a name on an element with no role. Screen readers read the visible text only, so the extra words are lost. axe reports these as "needs review". | "Current time: 3:05 PM", "3 alerts", and so on. | Put the extra words in visually hidden text (`sr-only`), or give the element a role that takes a name (for example `role="group"` for the time list). |
| R10 | Dashboard quick links hide their status line (likely) | `src/pages/CaregiverDashboard.tsx:454, 476, 500, 522` | Each link's `aria-label` replaces all of its content, so "4/4 taken today", "3 in the next 24 h" and "5 events recorded" are never read. | "Manage medications, 4 of 4 taken today, link" | Remove the `aria-label`s. The visible text already starts with the link's purpose. |
| R11 | Form errors are announced several times at once; the summary has no links; a repeated submit is silent (may) | The summary is an alert and also receives focus (`src/pages/ManageMedications.tsx:129-136, 162-183`; `src/pages/ManageAppointments.tsx:226-232, 258-279`). There is also one alert per field (`src/components/Field.tsx:158-168`, and the inline error components at `src/pages/ManageMedications.tsx:73-84` and `src/pages/ManageAppointments.tsx:135-146`). On Sign in and Sign up, a second failed submit with the same errors changes nothing, so nothing is said (`src/pages/SignIn.tsx:78-90`; `src/pages/SignUp.tsx:94-106`). | Four to six alerts can fire together, cutting each other off. | One announcement, the summary, with links that jump to each field. | Remove `role="alert"` from the field messages and keep them tied to their field through `aria-describedby`. Make the summary items links, as the desktop app does. On every failed submit, move focus to the summary. |
| R12 | Headings are missing where users look for them (likely) | `src/pages/Appointments.tsx:90-113`; `src/pages/Today.tsx:175-177, 207-209` (and the region at `:393`) | The Appointments group labels are `<span>`s, so H goes straight from h1 to h3. Today's featured "Next thing to do" item has no heading, so H from the page heading skips the most important card; it can still be reached as the region "Next thing to do". | "Today, heading level 2", and so on | Make the group labels `h2`, and give the featured item a heading. `ACCESSIBILITY.md` §2.1 explains why the featured item has no heading; revisit that. |

### Low

| ID | Risk | Where | Note |
|---|---|---|---|
| R13 | "required" is said two or three times | `src/components/Field.tsx:117-121` adds a hidden "(required)" to labels that already say "(required)" (`src/pages/ManageMedications.tsx:193, 204`; `src/pages/ManageAppointments.tsx:289, 301, 310, 327, 349`; the select at `:173-176`), on top of the required state. | Drop "(required)" from those label strings. |
| R14 | Memories photos repeat the title | `src/pages/Memories.tsx:132-137, 157-159` | Use `alt=""`, or describe the photo. WAVE flags this as an alert too. |
| R15 | Every card is a named region | `src/components/Card.tsx:46-47` | The landmark list fills with card names (11 named regions on Appointments: 3 groups and 8 cards), and each name is read twice, once for the region and once for the heading. Use `aria-labelledby` on the heading, or drop the region role, for cards inside lists. |
| R16 | The header calls the caregiver Dashboard "Home" | `src/components/Layout.tsx:50-51` with `src/App.tsx:58` | The screen name and the `h1` disagree. |
| R17 | "All done for today!" appears while tasks remain | `src/pages/Today.tsx:331-339, 400-402` | The card shows once no medicine or appointment is left, even though "Later today" still lists tasks. This is a content problem, but a screen-reader user hears both and can't see the layout to resolve it. |
| R18 | Card labels may not be read by NVDA | `src/pages/Medications.tsx:117`; `src/pages/Schedule.tsx:89` | NVDA may skip article labels with its default settings (see section 2.2), so "— taken" or "— done" would come only from the toggle button. That is acceptable once R8 is fixed. |

## 6. Other findings (not screen-reader issues)

These turned up while reading the markup. Record them with the WAVE, axe and Lighthouse results.

- **Label in name (WCAG 2.5.3).** A speech-input user says the words they can see, but these controls have a different accessible name:

  | Location | Visible text | Accessible name |
  |---|---|---|
  | `src/pages/Landing.tsx:127` | "Get started — it's free" | "Sign up for CareConnect" |
  | `src/pages/Landing.tsx:135` | "I already have an account" | "Sign in to CareConnect" |
  | `src/components/Layout.tsx:207-211` | "Switch role" | "Switch to caregiver role" |
  | `src/components/Layout.tsx:278` | "Call my caregiver" | "Call your caregiver: …" |
  | `src/pages/Appointments.tsx:250` | "Add to My Day" | 'Add "…" to My Day schedule' |
  | `src/pages/ManageMedications.tsx:265` | "Add another time" | "Add another scheduled time" |
  | `src/pages/ManageMedications.tsx:411` | "Add medication" | "Add new medication" |
  | `src/pages/ManageAppointments.tsx:560` | "Add appointment" | "Add new appointment" |

  The desktop app fixed 57 of these in Week 9 (`careconnect-electron/docs/accessibility/README.md`, issue 1). The same approach works here: the name starts with the visible words.
- **Non-text contrast (WCAG 1.4.11).** The empty tick circles are `neutral-300`, which is 1.65:1 on white against the 3:1 required (`src/pages/Medications.tsx:157`, `src/pages/Schedule.tsx:128`).
- **Text contrast (WCAG 1.4.3).** `text-neutral-400` is 2.85:1 on white. `wave-checklist.md` section 6 lists every place it is used.
- **New window.** "Get directions" opens a new tab without saying so (`src/pages/Appointments.tsx:223`). This is advisory, not a failure.

## 7. Results template

Fill in one copy for each screen reader. **Pass** means the name, role and state matched (section 1).

| | |
|---|---|
| Tester | |
| Date and time | |
| Screen reader and version | |
| Browser and version | |
| OS and device | |
| Commit (`git log -1 --format=%h`) | |
| Window width / device orientation | |

| Step | Expected (short) | Heard (paste from Speech Viewer or the caption panel) | Pass or fail | Notes or risk seen |
|---|---|---|---|---|
| X1 | A title for each page | | | R3 |
| X2 | Skip link, then the main landmark | | | |
| X3 | Landmark list | | | R15 |
| X4 | Page change announced | | | R3 |
| A1 | Title, then the page from the top | | | R2 |
| A2 | Landing landmarks | | | |
| A3 | Landing headings h1 to h3 | | | |
| A4 | Skip link first | | | R2 |
| A5 | Header and hero links | | | |
| A6 | Assistant dialog and its text box | | | |
| A7 | Assistant reply read out | | | R4, R6 |
| A8 | Esc returns to the chat button | | | |
| A9 | "Welcome back, heading level 1" | | | R3 |
| A10 | Sign-in fields and hint | | | R13 |
| A11 | Error summary and field errors | | | R11 |
| A12 | "invalid entry" and its message | | | |
| A13 | "We couldn't find an account…" | | | |
| A14 | "Create your account, heading level 1" | | | R3 |
| A15 | Password length error | | | R11 |
| A16 | Role chooser heading | | | R3, R4 |
| A17 | Two role buttons inside the group | | | |
| A18 | Today heading | | | R3, R4 |
| B1 | Header: time and screen name | | | R9 |
| B2 | h1 and "3 of 10 things done today" | | | |
| B3 | Next thing to do, with its action button | | | R12 |
| B4 | Confirmation after "I'm ready" | | | R5 |
| B5 | Confirmation after "Mark as taken" | | | R4, R17 |
| B6 | Later today list | | | R15 |
| B7 | Four quick-action buttons | | | |
| B8 | "Checked in" banner read out | | | R6, R4 |
| C1 | "Medicines, heading level 1" | | | R3 |
| C2 | "2 medicines still to take today." | | | |
| C3 | Medication list heading and its count | | | |
| C4 | Toggle name and pressed state | | | R8, R18 |
| C5 | "pressed", then the count | | | R8 |
| C6 | "All medicines taken…" | | | |
| C7 | Undo: "not pressed", then the count | | | |
| C8 | Taken again | | | |
| D1 | "My Appointments, heading level 1" | | | R3 |
| D2 | Group regions | | | R15 |
| D3 | Next heading is level 3 | | | R12 |
| D4 | Appointment card details | | | R9 |
| D5 | Confirmation after "Add to My Day" | | | R4, R5 |
| D6 | "No travel needed" | | | |
| E1 | "Contacts, heading level 1" | | | R3 |
| E2 | Emergency contacts heading and list | | | |
| E3 | Contact details and call link | | | |
| E4 | Call link names | | | |
| E5 | "Other contacts" heading | | | |
| F1 | "Memories, heading level 1" | | | R3 |
| F2 | Filter group and pressed states | | | |
| F3 | Result count after filtering | | | R5 |
| F4 | "Pinned, heading level 2" | | | |
| F5 | Photo alt text and title | | | R14 |
| F6 | Read more, expanded and collapsed | | | |
| G1 | Sign out; focus on the chat button | | | R2 |
| G2 | Sign in, then the role chooser | | | R3 |
| G3 | "Dashboard, heading level 1" | | | R3, R4 |
| G4 | Caregiver header | | | R16 |
| G5 | Overview line and task count | | | R9 |
| G6 | Status card | | | |
| G7 | Alerts region and count | | | R9 |
| G8 | Live alert added or cleared | | | R7 |
| G9 | Recent activity list | | | |
| G10 | Quick-link names | | | R10 |
| G11 | Main navigation, "current page" | | | |
| H1 | New page announced | | | R1 |
| H2 | "Manage medications, heading level 1" | | | |
| H3 | Medication card | | | R9, R15 |
| H4 | Delete dialog name and description | | | |
| H5 | Focus stays in the dialog | | | |
| H6 | Esc returns to Delete | | | |
| H7 | Focus moves into the form | | | R4 |
| H8 | Form field names and hints | | | R13 |
| H9 | Error summary read once | | | R11 |
| H10 | "invalid entry" and each message | | | |
| H11 | "Donepezil added" | | | R5, R1 |
| H12 | Focus moves into the edit form | | | R4 |
| H13 | Cancel returns to Add | | | |
| I1 | New page announced | | | R1 |
| I2 | Appointment headings | | | |
| I3 | Appointment card details | | | |
| I4 | Focus moves into the form | | | R4 |
| I5 | Form field names and hints | | | R13 |
| I6 | Error summary read once | | | R11 |
| I7 | Field errors | | | |
| I8 | Address field appears | | | |
| I9 | Cancel returns to Add | | | |
| J1 | "Activity log, heading level 1" | | | R3 |
| J2 | Refresh result announced | | | R5 |
| J3 | Legend list | | | |
| J4 | Day region, heading and count | | | |
| J5 | Events read in full | | | |

Paste the Speech Viewer transcript for each flow under the table, headed with the flow letter.
