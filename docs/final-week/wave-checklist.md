# WAVE checklist: CareConnect web app

This is for the teammate who runs the WAVE browser extension (https://wave.webaim.org/extension/) against `careconnect-web`. It covers setup, how to get past the mock sign-in for both roles, every page and state to scan in order, what to capture, how to name the screenshots for the Word doc, and how to tell real problems from informational items.

This checklist was written from the code at commit `e79a08c` (master, 2 November 2026). Fixes landing this week will move line numbers, and they may change the URLs (for example to `#/app/...` hash routes).

- If `git log -1 --format=%h` shows a newer commit, use whatever URL the address bar shows.
- Re-check any `file:line` with `grep -n` before you quote it.
- Code references are relative to `careconnect-web/`.

## 1. Setup (once per pass)

1. **Install WAVE for Chrome** from https://wave.webaim.org/extension/. If you use an Incognito window, enable it there: `chrome://extensions` → WAVE → Details → *Allow in Incognito*.
2. **Start the app.** In a terminal (WSL is fine):

   ```bash
   cd careconnect-web
   npm install        # first time only
   npm run dev
   ```

   Open the `Local:` URL that Vite prints, normally http://localhost:5173/, in Chrome on Windows. Chrome on Windows can reach a server running in WSL on `localhost`. If port 5173 is busy, Vite picks the next free port, so use the URL it prints.
3. **Window size.** Maximise Chrome so it is at least 1280 px wide, and set the zoom to 100% (Ctrl+0). Some parts of the layout only render on wide screens, so a narrow window scans a different page:
   - The app footer and the sidebar's "Switch to patient" button appear at 1024 px and wider (`src/components/Layout.tsx:371`, `:428-431`).
   - The role pill appears at 768 px and wider (`:187-188`).
4. **Start clean**, and start clean again before the "after" pass, so that both passes scan the same content.
   - Press F12, then Application → Storage → *Clear site data*, then reload.
   - This also deletes the test account, so you will sign up again.
5. **Scan at about the same time of day in both passes.** Several things depend on the clock:
   - the featured Today card;
   - the "Now" and "Coming up" badges;
   - the dashboard's overdue alerts;
   - the appointment groups.

   The app also takes "today" from the UTC date (`toISOString()`, for example `src/pages/Today.tsx:22`). On a US evening it may already be showing tomorrow's items.

## 2. Getting past the mock sign-in

How the mock works (`src/auth/mockAuth.ts`, `src/auth/AuthContext.tsx`):

- Accounts are stored in this browser's localStorage.
- Sign in only accepts an email that has already signed up in this browser (`src/auth/mockAuth.ts:82-86`). Any password works.
- Sign up needs a name, a valid email, a password of at least 6 characters, and the same password typed again (`src/pages/SignUp.tsx:22-39`).
- Signing in or signing up always clears the role, so you always land on the role chooser at `/role` (`src/auth/AuthContext.tsx:52-70`).
- The role chooser has two large buttons, **I am the Care Recipient** and **I am the Caregiver** (`src/pages/RoleChooser.tsx:73-86`). Your choice decides what `/app` shows.

**Care recipient:**

1. Go to http://localhost:5173/signup.
2. Enter:
   - Your name: `Margaret Whitfield`
   - Email: `margaret@example.com`
   - Password: `careconnect`
   - Confirm password: `careconnect`
3. Press **Create account**, then **I am the Care Recipient**.

Use the name Margaret. The Today heading always says "Margaret" (`src/pages/Today.tsx:369-371`), while the header greets the account's own first name (`src/components/Layout.tsx:142-143`). Any other name makes the two disagree.

**Caregiver:**

1. Press **Sign out** in the header. This takes you to the Landing page.
2. Press **Sign in** and enter `margaret@example.com` with any password.
3. Press **I am the Caregiver**.

Signing out keeps the care data, so the caregiver pages show what the care recipient did.

**Shortcut:** the header's **Switch role** button flips the view and remembers it (`src/App.tsx:47-51`). It is fine for spot checks. For the scans, sign out and back in, so each role starts the way a real user's would.

Once signed in, you can type any `/app/...` URL directly. While signed out, those URLs send you back to `/` (`src/components/ProtectedRoute.tsx:30-38`).

## 3. How to scan one state

1. **Turn WAVE off and set up the state** listed in the table below, for example opening the dialog or submitting the empty form.
2. **Click the WAVE toolbar icon.** WAVE scans the page as it is at that moment. It does not re-run when the app changes page without a reload. After every navigation or state change, click the icon twice: once to turn it off and once to scan again.
3. **Take two screenshots** (the file names are in section 5):
   - **Summary** panel: the six counts (Errors, Contrast Errors, Alerts, Features, Structural Elements, ARIA), with the page visible next to the panel.
   - **Details** tab (the flag icon): the itemised list. If it is longer than the panel, take a second shot. Errors, Contrast Errors and Alerts matter most; collapse Features, Structural Elements and ARIA if you need the space.
4. **Write the Errors, Contrast Errors and Alerts counts** into the results table in section 5.
5. **Turn WAVE off before you set up the next state.** WAVE puts icons on the page, and they get in the way of clicks. While the delete dialog is open, any click on the page behind it closes the dialog (`src/components/ConfirmDialog.tsx:120-123`).

For dialogs and forms, open them first, then click the toolbar icon. The toolbar is not part of the page, so clicking it leaves the dialog open.

Where the table says so, also capture:

- the **Contrast** tab (colours and ratio for each failure);
- the **Structure** tab (the heading outline).

Name these `...-before-contrast.png` and `...-before-structure.png`.

## 4. Pages and states to scan, in order

The order matters. The care recipient's actions (checking in and ticking medicines) fill the activity log and the dashboard. Do the patient pages before the caregiver pages, and do them the same way in both passes.

### 4.1 Public pages (before choosing a role)

| # | Page and state | URL | How to get there | Slug |
|---|---|---|---|---|
| 1 | Landing | `/` | Open the URL. | `landing-public` |
| 2 | Landing, assistant open | `/` | Click the round chat button at the bottom right, type `how do I sign up`, press Enter, wait for the reply. | `landing-assistant-public` |
| 3 | Sign in, empty | `/signin` | Header **Sign in**. | `signin-public` |
| 4 | Sign in, errors | `/signin` | Press **Sign in** with both fields empty. | `signin-errors-public` |
| 5 | Sign in, no such account | `/signin` | Email `nobody@example.com`, any password, **Sign in**. | `signin-no-account-public` |
| 6 | Sign up, empty | `/signup` | The **Sign up for free** link. | `signup-public` |
| 7 | Sign up, errors | `/signup` | Press **Create account** with every field empty. | `signup-errors-public` |
| 8 | Role chooser | `/role` | Fill in sign up as in section 2 and create the account. | `role-public` |

### 4.2 Care recipient pages

| # | Page and state | URL | How to get there | Slug | Also capture |
|---|---|---|---|---|---|
| 9 | Today | `/app` | **I am the Care Recipient**. | `today-patient` | Contrast tab |
| 10 | Today, checked in | `/app` | Quick actions → **Check In**. The green "Checked in" banner appears and the tile is disabled. | `today-checked-in-patient` | |
| 11 | My Day | `/app/schedule` | Bottom nav **My Day**. Three tasks are already done. | `my-day-patient` | |
| 12 | Appointments | `/app/appointments` | Bottom nav **Appointments**. | `appointments-patient` | Structure tab |
| 13 | Medicines | `/app/medications` | Bottom nav **Medicines**. Two of the four are already ticked. | `medicines-patient` | |
| 14 | Medicines, all taken | `/app/medications` | Tick **Atorvastatin** and **Vitamin D3**. All four cards fade and the status turns green. | `medicines-all-taken-patient` | Contrast tab |
| 15 | Memories | `/app/memories` | Bottom nav **Memories**. | `memories-patient` | |
| 16 | Memories, filtered | `/app/memories` | Press the **Hobbies** filter. | `memories-filtered-patient` | Structure tab |
| 17 | Contacts | `/app/contacts` | Bottom nav **Contacts**. | `contacts-patient` | |

### 4.3 Caregiver pages

Press **Sign out**, then **Sign in**, then **I am the Caregiver**.

| # | Page and state | URL | How to get there | Slug |
|---|---|---|---|---|
| 18 | Dashboard | `/app` | You land here. | `dashboard-caregiver` |
| 19 | Manage medications | `/app/manage-medications` | Sidebar **Medications**. | `manage-medications-caregiver` |
| 20 | Add medication form | same | **Add medication** (top right). | `manage-medications-form-caregiver` |
| 21 | Add medication form, errors | same | Press the form's **Add medication** button with every field empty. | `manage-medications-form-errors-caregiver` |
| 22 | Delete medication dialog | same | Press the form's **Cancel**, then **Delete** on any card. Do not confirm. | `manage-medications-delete-dialog-caregiver` |
| 23 | Manage appointments | `/app/manage-appointments` | Sidebar **Appointments**. | `manage-appointments-caregiver` |
| 24 | Add appointment form, errors | same | Press **Add appointment**, then press the form's **Add appointment** with everything empty. Then set *Location type* to *Clinic visit* so that the Address field appears as well. | `manage-appointments-form-errors-caregiver` |
| 25 | Activity log | `/app/activity` | Sidebar **Activity**. It lists the check-in and medicine events from states 10 and 14. | `activity-caregiver` |
| 26 | Caregiver notes | `/app/caregiver` | Sidebar **Notes**. | `notes-caregiver` |
| 27 | Caregiver notes, composing | same | **Add note**. | `notes-compose-caregiver` |

### 4.4 Optional extras

| # | Page and state | How | Slug |
|---|---|---|---|
| 28 | Today at phone width | DevTools device toolbar (Ctrl+Shift+M) at 375 × 812, then reload | `today-phone-patient` |
| 29 | Dashboard at phone width | Same, as the caregiver | `dashboard-phone-caregiver` |
| 30 | Delete appointment dialog | Same as state 22, on Manage appointments | `manage-appointments-delete-dialog-caregiver` |
| 31 | Install banner | Chrome only offers it when the app can be installed. That needs a production build (`npm run build && npm run preview`), not the dev server. | `install-banner-public` |

## 5. Saving the evidence for the Word doc

**File names.** The slug already holds the page, the state and the role, so the names sort together:

| Shot | Before the fixes | After the fixes |
|---|---|---|
| Summary panel | `wave-<slug>-before.png` | `wave-<slug>-after.png` |
| Details tab | `wave-<slug>-before-details.png` | `wave-<slug>-after-details.png` |
| Second Details shot, if needed | `wave-<slug>-before-details-2.png` | `wave-<slug>-after-details-2.png` |

Examples: `wave-signin-errors-public-before.png`, `wave-dashboard-caregiver-after-details.png`.

**Folder.** Save the shots in `careconnect-web/docs/final-a11y/before/wave/` for the unfixed app and `careconnect-web/docs/final-a11y/after/wave/` for the fixed app.

**Keep WAVE results out of the repo.** Git ignores both folders on purpose. This repo is public, and WebAIM's terms say: "You must first obtain WebAIM's permission if you want to sell or redistribute WAVE reports or data (e.g. number of WAVE errors, error listings, etc.) derived directly from WAVE" ([wave.webaim.org/terms](https://wave.webaim.org/terms)). Pasting them into the graded Word doc is ordinary use; publishing them on GitHub is not ours to decide. Share the files with the team privately (the Word doc, or a shared drive).

- Do not put the files in a folder named `web/`. The root `.gitignore` ignores every folder with that name (`**/web/`).
- To confirm git ignores them, run `git check-ignore -v careconnect-web/docs/final-a11y/before/wave/test.png`. It should print the root `.gitignore` rule.

**Capturing.** Use the Windows Snipping Tool (Win+Shift+S, *Window* mode) on the Chrome window, and save as PNG.

- A high-DPI screen gives sharper images.
- Do not use Chrome zoom to enlarge the shot. Zooming changes the layout that WAVE scans.

**Results table.** Paste this into the Word doc and fill it in:

| # | Page and state | Role | Errors before | Errors after | Contrast before | Contrast after | Alerts before | Alerts after | Notes (decision on each alert) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Landing | public | | | | | | | |
| 2 | Landing, assistant open | public | | | | | | | |
| 3 | Sign in | public | | | | | | | |
| 4 | Sign in, errors | public | | | | | | | |
| 5 | Sign in, no account | public | | | | | | | |
| 6 | Sign up | public | | | | | | | |
| 7 | Sign up, errors | public | | | | | | | |
| 8 | Role chooser | public | | | | | | | |
| 9 | Today | patient | | | | | | | |
| 10 | Today, checked in | patient | | | | | | | |
| 11 | My Day | patient | | | | | | | |
| 12 | Appointments | patient | | | | | | | |
| 13 | Medicines | patient | | | | | | | |
| 14 | Medicines, all taken | patient | | | | | | | |
| 15 | Memories | patient | | | | | | | |
| 16 | Memories, filtered | patient | | | | | | | |
| 17 | Contacts | patient | | | | | | | |
| 18 | Dashboard | caregiver | | | | | | | |
| 19 | Manage medications | caregiver | | | | | | | |
| 20 | Add medication form | caregiver | | | | | | | |
| 21 | Add medication form, errors | caregiver | | | | | | | |
| 22 | Delete medication dialog | caregiver | | | | | | | |
| 23 | Manage appointments | caregiver | | | | | | | |
| 24 | Add appointment form, errors | caregiver | | | | | | | |
| 25 | Activity log | caregiver | | | | | | | |
| 26 | Caregiver notes | caregiver | | | | | | | |
| 27 | Caregiver notes, composing | caregiver | | | | | | | |

Record the setup above the table: tester, date and time, Chrome and WAVE versions, commit (`git log -1 --format=%h`) and window width.

## 6. Reading the results: real problems and informational items

**What each WAVE category means:**

- **Errors (red).** WAVE is fairly sure these fail WCAG. Treat each one as something to fix unless you can show it is a false alarm.
- **Contrast Errors.** Text below 4.5:1, or below 3:1 for large text. These are real, with one exception in this app: WAVE cannot see a CSS gradient or image behind text (item 6 below).
- **Alerts (yellow).** These mean "a person should look at this". An alert is not a failure by itself. Decide on each one and write down why in the Notes column; that decision is part of the evidence.
- **Features (green), Structural Elements (blue) and ARIA (purple).** A list of what is on the page: skip links, labels, headings, landmarks and ARIA attributes. The counts are neither good nor bad. A high ARIA count does not mean there is a problem, and it does not mean the ARIA is correct either.

**What to expect on this app at `e79a08c`.** This list comes from reading the code, not from a WAVE run, so it gives no totals.

| # | WAVE item | Type | Where | Real or informational | Why, and what to do |
|---|---|---|---|---|---|
| 1 | Broken ARIA reference | Error | Error states: Sign in *Password*, Sign up *Your name* and *Password*, Add medication *Dose*, Add appointment *Appointment title* | Real | `src/components/Field.tsx:89-91` keeps the hint's id in `aria-describedby`, but `:151-155` stops rendering the hint once the field shows an error. One fix in `Field` clears all five. Screen readers skip the missing id, so users barely notice. WAVE is likely to flag it; either way the reference is invalid ARIA and worth the fix. |
| 2 | Very low contrast | Contrast | Grey `text-neutral-400` text, #8f9aaa. It is 2.85:1 on white and 2.68:1 on the page background, against the 4.5:1 required. See the list of places after this table. | Real | The colour token's own comment says "placeholder / disabled" (`tailwind.config.js:34`), but it is used for normal text. `neutral-500` (5.53:1 on white) fixes every case. |
| 3 | Very low contrast on taken or done cards | Contrast | Medicines (taken), My Day (done) | Real | The whole card is drawn at 60% opacity (`src/pages/Medications.tsx:116`, `src/pages/Schedule.tsx:86-88`), so even dark text fades. Computed ratios run from 1.79:1 (the struck-through name) to 4.22:1 (the darkest label). WAVE may not allow for opacity, so it may under-count these; axe DevTools does allow for it. The cards can still be unticked, so the exception for inactive controls does not apply. |
| 4 | Very low contrast on the "PS" avatar | Contrast | Contacts | Real, small | White initials on `warm-600` are 4.17:1 (`src/data/mockData.ts:149`, `src/pages/Contacts.tsx:71-76`). Text at 18 px bold is not "large text", so 4.5:1 applies. The token comment claims 6.5:1 (`tailwind.config.js:62`), which is wrong. |
| 5 | Very low contrast on the "·" in the header | Contrast | Every app page | Decorative | The dot between the greeting and the screen name is `neutral-300`, 1.65:1 (`src/components/Layout.tsx:253`). It is hidden from screen readers, and it is arguably pure decoration. Darkening it costs nothing and removes the noise. |
| 6 | Very low contrast on the Landing hero, if WAVE flags it | Contrast | Landing | False positive | The hero's blue is a CSS gradient (`src/pages/Landing.tsx:96-99`). WAVE cannot read gradients, so it may compare the white text with the near-white page behind it. The real ratios are 8.74:1 (white on `calm-700`) and 6.55:1 (white on `calm-600`), and 6.99:1 and 5.23:1 for the light-blue sentence. Check with the Contrast tab or a colour picker, and record the measured ratio in Notes. |
| 7 | Contrast on the disabled "Checked In" tile, if flagged | Contrast | Today, checked in | Exempt | WCAG 1.4.3 does not apply to inactive controls (`src/pages/Today.tsx:459-460`). |
| 8 | Redundant link | Alert | Landing: header **Sign up**, then hero **Get started**, both going to `/signup`. Patient pages at desktop width: bottom-nav **Contacts**, then footer **View contacts**, both going to `/app/contacts`. | Informational | Two links in a row go to the same place, so keyboard users press Tab one extra time. It is not a WCAG failure. Note it and move on. |
| 9 | Redundant alternative text | Alert | Memories | Real, small | Each photo's alt text is the card title (`src/pages/Memories.tsx:132-137`), and the same title follows as a heading (`:157-159`), so screen readers hear it twice. Use `alt=""`, or describe the photo. |
| 10 | Skipped heading level | Alert | Appointments (h1, then h3). Memories with a filter that has no pinned cards, such as Hobbies. | Real, small | The Appointments group labels "Today", "Later this week" and "Coming up" are `<span>`s, not headings (`src/pages/Appointments.tsx:90-113`). `ACCESSIBILITY.md` §2 says no levels are skipped, so either fix the page or correct that sentence. |
| 11 | Possible heading | Alert | Today's large featured item (`src/pages/Today.tsx:207-209`), "All done for today!", the dashboard numbers ("2 of 4") | Judgement | This is large bold text that is not marked as a heading. The featured item probably should be a heading, because it is the most important thing on the screen. The dashboard numbers should not. |
| 12 | Underlined text | Alert | Memories **Read more** | Informational | A button styled like a link (`src/pages/Memories.tsx:176`). This is fine, because it says what it does. |
| 13 | Suspicious link text, if flagged | Alert | Dashboard **View all** (`src/pages/CaregiverDashboard.tsx:410-416`) | Informational | Its purpose is clear from the "Recent activity" heading next to it, and WCAG 2.4.4 allows that context. "View all activity" would still be clearer. |
| 14 | ARIA items (labels, live regions, pressed, expanded, dialog) | ARIA | Everywhere | Informational | WAVE lists these but does not judge them. In particular, it will not tell you that several `aria-label`s sit on plain `<span>`s and `<div>`s, where screen readers ignore them. Risk R9 in `screen-reader-procedure.md` covers this. |

Places with `text-neutral-400` text (item 2):

- the footer of every app page at desktop width, `src/components/Layout.tsx:432`;
- the Today "Next thing to do" label, `src/pages/Today.tsx:175`;
- the Medicines footnote, `src/pages/Medications.tsx:167`;
- the My Day hint, `src/pages/Schedule.tsx:164`;
- Appointments, the location type and the footnote, `src/pages/Appointments.tsx:185, 391`;
- the role chooser, `src/pages/RoleChooser.tsx:62, 90`;
- the Sign up privacy line, `src/pages/SignUp.tsx:171`;
- the Dashboard activity rows and footnote, `src/pages/CaregiverDashboard.tsx:254, 260, 424, 547`;
- the Activity log, `src/pages/ActivityLog.tsx:108, 200`;
- the addresses on Manage appointments, `src/pages/ManageAppointments.tsx:452`.

**What WAVE cannot tell you.** Cover these with the screen-reader procedure, the keyboard checks, axe DevTools and Lighthouse:

- **Focus jumps.**
  - On Landing, focus jumps to the assistant button as the page loads (`src/components/ChatBot.tsx:129-135`).
  - On Manage medications and Manage appointments, focus jumps to the last Delete button (`src/components/ConfirmDialog.tsx:95-99`).
- **Page titles.** Every page has the same title, "CareConnect — Your Daily Companion" (`index.html:7`), and nothing changes it from page to page.
- **Screen-reader announcements.** WAVE cannot tell you what a screen reader says after an action, or whether it says anything at all.
- **Non-text contrast (WCAG 1.4.11).** The empty tick circles on Medicines and My Day are `neutral-300`, which is 1.65:1 against the 3:1 required (`src/pages/Medications.tsx:157`, `src/pages/Schedule.tsx:128`).
- **Other criteria.** Label in name (2.5.3), reflow at 320 px, and text spacing.

The contrast ratios in this section were calculated from the hex values in `tailwind.config.js` with the WCAG 2.1 formula. The opacity figures blend each colour at 60% over the page background (#f7f8fa).

**AI-use line for the doc (edit as needed):** "Claude Code prepared the WAVE page list and the expected findings from the source code. *[name]* ran the scans and made the pass and fail decisions."
