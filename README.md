# SWEN 661 – Team DevIntel

**CareConnect Daily Compass**

A simplified, high-contrast patient care and caregiver app designed for users with Short-Term Memory Loss (STML).

## Team Members
- Matthew Spano (avarupter) — JST
- Simon Mazelev (SimonMazelev) — EST
- Shane Cray (ShaneCray) — EST

## Documents
- Team Charter -- https://umuc365-my.sharepoint.com/:b:/g/personal/mspano1_student_umgc_edu/IQAE4r6gbXmaR4rwpRyRqgMGAQ-YuWHbVaHoZ7THp14-bLE?e=8LMduV
- Project Proposal -- https://umuc365-my.sharepoint.com/:w:/g/personal/mspano1_student_umgc_edu/IQB9XXKPit3_SLua7lrCkhr-Aa9PJi2_CYpTvicqT4QePlQ?e=zaQdpb

## Repository Structure
```
swen661-devintel/
├── careconnect_mobile/
│   ├── android/                                  # Android native build & Gradle configuration
│   ├── coverage/                                 # Generated LCOV test coverage reports
│   │   ├── index.html                            # Generated HTML coverage report (84.8%)
│   │   └── lcov.info                             # Aggregate line coverage report
│   ├── lib/                                      # Main Flutter application source code
│   │   ├── main.dart                             # Application entry point (MyApp)
│   │   ├── core/                                 # Framework-free primitives
│   │   │   ├── clock.dart                        # Injectable Clock + DateOnly calendar-day type
│   │   │   ├── day_labels.dart                   # Weekday/month wording, greeting lines
│   │   │   └── load_state.dart                   # idle / loading / ready / error
│   │   ├── data/                                 # Composition root & demo content
│   │   │   ├── care_providers.dart               # Builds the medication/appointment object graph
│   │   │   └── seed_data.dart                    # First-run demo medicines & appointments
│   │   ├── models/                               # Data entities & models
│   │   │   ├── appointment.dart                  # Appointment + TransportPlan, JSON serialization
│   │   │   ├── dose.dart                         # DoseId / DoseRecord / ScheduledDose, dose status
│   │   │   ├── dose_time.dart                    # HH:mm value type and day parts
│   │   │   ├── medication.dart                   # Medication model & JSON serialization
│   │   │   ├── patient.dart                      # Patient data model & JSON serialization
│   │   │   └── user.dart                         # User entity model
│   │   ├── providers/                            # State management (Provider pattern)
│   │   │   ├── appointment_provider.dart         # Appointment state & derived groupings
│   │   │   ├── auth_provider.dart                # Authentication & user role state
│   │   │   ├── medication_provider.dart          # Medicines, dose log, mark-taken & undo
│   │   │   └── patient_provider.dart             # Patient CRUD operations & file persistence
│   │   ├── services/                             # Persistence layer
│   │   │   ├── care_repository.dart              # JSON repository with seed fallback
│   │   │   └── json_store.dart                   # JsonStore: file + in-memory implementations
│   │   ├── theme/                                # Design tokens
│   │   │   ├── app_colors.dart                   # Figma palette with measured WCAG ratios
│   │   │   └── status_style.dart                 # Dose status as colour + icon + word
│   │   ├── widgets/                              # Reusable presentation pieces
│   │   │   ├── appointment_tile.dart             # One appointment row
│   │   │   ├── care_page.dart                    # Page shell: loading / error / content
│   │   │   ├── dose_tile.dart                    # One dose card with its semantics structure
│   │   │   ├── section_header.dart               # Screen-reader-addressable heading
│   │   │   └── status_chip.dart                  # Status pill (never colour alone)
│   │   ├── router/                               # Application navigation & routing
│   │   │   └── app_router.dart                   # GoRouter route definitions & navigation paths
│   │   ├── screens/                              # UI Screen widgets
│   │   │   ├── add_edit_patient_screen.dart      # Add and Edit Patient form screen
│   │   │   ├── appointment_detail_screen.dart    # One appointment, opened by id from the route
│   │   │   ├── appointment_list_screen.dart      # Placeholder (not a counted screen)
│   │   │   ├── caregiver_activity_screen.dart    # Caregiver activity log & event feed
│   │   │   ├── caregiver_appointments_screen.dart# Caregiver appointment management
│   │   │   ├── caregiver_medication_forms_screen.dart # Medication form input screen
│   │   │   ├── caregiver_medications_screen.dart # Caregiver medications view
│   │   │   ├── help_screen.dart                  # Help & support screen
│   │   │   ├── home_screen.dart                  # Main role-based dashboard scaffold
│   │   │   ├── landing_screen.dart               # Welcome landing screen
│   │   │   ├── medication_detail_screen.dart     # One medicine, opened by id from the route
│   │   │   ├── medication_list_screen.dart       # Placeholder (not a counted screen)
│   │   │   ├── messages_screen.dart              # Placeholder (not a counted screen)
│   │   │   ├── patient_appointments_screen.dart  # Patient: Today / Coming up / Cancelled / Past
│   │   │   ├── patient_list_screen.dart          # Patient directory list
│   │   │   ├── patient_medications_screen.dart   # Patient: medicines, purpose, today's progress
│   │   │   ├── patient_today_screen.dart         # Patient: daily dashboard (landing tab)
│   │   │   ├── profile_screen.dart               # Patient profile & health summary
│   │   │   ├── role_selection_screen.dart        # Role selection screen (Patient vs. Caregiver)
│   │   │   ├── signin_screen.dart                # User sign-in screen
│   │   │   └── signup_screen.dart                # User account registration screen
│   │   └── utils/                                # Helpers & utilities
│   │       └── responsive.dart                   # Responsive viewport & breakpoint utility
│   ├── test/                                     # Automated test suite (170 passing tests)
│   │   ├── support/                              # Shared test scaffolding
│   │   │   └── care_test_harness.dart            # In-memory store + fixed clock + provider graph
│   │   ├── unit/                                 # Unit tests for models, providers, & routing
│   │   │   ├── app_router_test.dart              # Route configuration unit tests
│   │   │   ├── appointment_provider_test.dart    # Appointment state & grouping unit tests
│   │   │   ├── auth_provider_test.dart           # AuthProvider state unit tests
│   │   │   ├── day_labels_test.dart              # Date wording & greeting unit tests
│   │   │   ├── dose_domain_test.dart             # DoseId keying, status & JSON round-trip tests
│   │   │   ├── json_store_test.dart              # Persistence layer unit tests
│   │   │   ├── medication_provider_test.dart     # Mark-taken, undo & derived-list unit tests
│   │   │   ├── patient_model_test.dart           # Patient JSON serialization unit tests
│   │   │   ├── responsive_test.dart              # Responsive breakpoint unit tests
│   │   │   ├── status_style_test.dart            # WCAG contrast ratios recomputed from hex
│   │   │   └── user_model_test.dart              # User model unit tests
│   │   ├── accessibility_test.dart               # Tap targets, 200% text scale, semantics
│   │   ├── appointment_detail_screen_test.dart   # Widget tests for AppointmentDetailScreen
│   │   ├── medication_detail_screen_test.dart    # Widget tests for MedicationDetailScreen
│   │   ├── patient_appointments_screen_test.dart # Widget tests for PatientAppointmentsScreen
│   │   ├── patient_medications_screen_test.dart  # Widget tests for PatientMedicationsScreen
│   │   ├── patient_navigation_test.dart          # Forward/back navigation & id passing
│   │   ├── patient_today_screen_test.dart        # Widget tests for PatientTodayScreen
│   │   ├── add_edit_patient_screen_test.dart     # Widget tests for AddEditPatientScreen
│   │   ├── caregiver_activity_screen_test.dart   # Widget tests for CaregiverActivityScreen
│   │   ├── caregiver_appointments_screen_test.dart # Widget tests for CaregiverAppointmentsScreen
│   │   ├── caregiver_medication_forms_screen_test.dart # Widget tests for CaregiverMedicationFormsScreen
│   │   ├── caregiver_medications_screen_test.dart# Widget tests for CaregiverMedicationsScreen
│   │   ├── home_screen_test.dart                 # Widget tests for HomeScreen
│   │   ├── landing_screen_test.dart              # Widget tests for LandingScreen
│   │   ├── patient_list_screen_test.dart         # Widget tests for PatientListScreen
│   │   ├── placeholder_screens_test.dart         # Widget tests for placeholder screens
│   │   ├── profile_screen_test.dart              # Widget tests for ProfileScreen
│  	│   ├── role_selection_screen_test.dart       # Widget tests for RoleSelectionScreen
│  	│   ├── signin_screen_test.dart               # Widget tests for SignInScreen
│  	│   ├── signup_screen_test.dart               # Widget tests for SignUpScreen
│  	│   └── widget_test.dart                      # Application launch smoke test
│  	├── .gitignore                                # Git exclusion rules
│  	├── .metadata                                 # Flutter project metadata
│  	├── analysis_options.yaml                     # Static analysis & linter rules
│  	├── devtools_options.yaml                     # Flutter DevTools options
│  	├── pubspec.yaml                              # App dependencies & assets configuration
│   └── README.md                                 # Project documentation
├── hello_flutter/       # Week 1/2 Flutter hello-world
├── hello-react-native/  # Week 1/2 React Native hello-world
├── hello-electron/      # Week 1/2 Electron hello-world
└── hello-react-web/     # Week 1/2 React + Vite hello-world
```

## Project description
    The project is a flutter app with responsive layouts for mobile and tablet created from wireframes. The wireframes were created in figma and converted into flutter files. The app has incorporated navigation between screens, data persistance and state management.


## Major screens

CareConnect Daily Compass has two roles, chosen after sign-in, and a different
set of screens for each.

**Authentication (Matthew)**
| Screen | What it does |
|---|---|
| Landing | Entry point; routes to sign in or sign up. |
| Sign Up | Creates an account. |
| Sign In | Signs an existing user in. |
| Role Selection | Choose Patient or Caregiver; sets the role in shared state. |

**Patient (Shane)**
| Screen | What it does |
|---|---|
| Patient Today | The patient's landing tab. Today's date and greeting, a progress summary, and every dose split into **Take these now / Later today / Already done**, plus today's appointment and who is driving. |
| Patient Medications | Every medicine with its purpose in plain language, its appearance, and today's per-dose status. "Only if you need it" medicines are listed separately. |
| Patient Appointments | Appointments grouped **Today / Coming up / Cancelled / Already happened**. |
| Medication Detail | Pushed route receiving a medication id. What it is for, what it looks like, how and when to take it, today's doses, prescriber. |
| Appointment Detail | Pushed route receiving an appointment id. Where to go, who is taking you, what to bring, notes, duration. |
| Patient Profile | Account details and sign out. |

**Caregiver (Simon)**
| Screen | What it does |
|---|---|
| Patient List | The caregiver's patients; opens a patient record. |
| Add / Edit Patient | Create and update a patient record, with validation. |
| Caregiver Medications | Manage a patient's medicines. |
| Caregiver Medication Form | Add or edit a medicine. |
| Caregiver Appointments | Manage a patient's appointments. |
| Caregiver Activity | Activity and event feed. |

## State management

**Provider** (`provider: ^6.1.5+1`), with `ChangeNotifier`.

`setState` is used only for genuinely local widget state — the selected tab
index in `HomeScreen` and form controllers. Everything shared lives in a
provider:

| Provider | Owns |
|---|---|
| `AuthProvider` | The signed-in user and the selected role. |
| `PatientProvider` | The caregiver's patient list, with JSON persistence. |
| `MedicationProvider` | Medicines, the dose log, and every derived list (due now, taken today, remaining). |
| `AppointmentProvider` | Appointments and their derived groupings. |

Application logic is kept out of the UI. Models, services and providers sit
below the widgets, and the widgets do not compute status, format dates or build
screen-reader sentences — those are model and provider concerns:

```
lib/
  core/       Clock, DateOnly, LoadState, date wording
  models/     Medication, DoseId/DoseRecord/ScheduledDose, Appointment, Patient, User
  services/   JsonStore (file + in-memory), JsonCareRepository
  providers/  ChangeNotifiers
  data/       Seed data and the provider composition root
  widgets/    Reusable presentation pieces
  screens/    Screens only
```

Two decisions worth calling out:

* **Nothing below the UI calls `DateTime.now()`.** Time comes from an injected
  `Clock`, so every date-dependent rule ("is this dose due?", "was it taken
  today?") is deterministically testable. Tests inject a `FixedClock`.
* **Persistence sits behind an interface.** `JsonStore` has a file
  implementation for the app and an in-memory one for tests, so the patient
  providers need no plugin mocking at all.

## Navigation

**go_router** (`go_router: ^14.8.1`), configured in `lib/router/app_router.dart`.

Named routes are used throughout. Within the signed-in area, a
`BottomNavigationBar` in `HomeScreen` switches tabs, and detail screens are
pushed as top-level routes so they get a real back button.

Information is passed between screens through the route path:

```
/medications/:medId     -> MedicationDetailScreen(medicationId: ...)
/appointments/:apptId   -> AppointmentDetailScreen(appointmentId: ...)
```

Tapping a medicine or an appointment pushes the route for **that** item; the
screen resolves the id against the provider. The id travels rather than the
object, so a detail screen survives a restart, works as a deep link, and
re-renders when the shared state changes. Back navigation returns to the list.

## Accessibility — our assigned constraint is Short-Term Memory Loss (STML)

STML is a *cognitive* constraint, not a visual one. The core difficulty is that
the user cannot reliably hold recent events in working memory: they cannot
remember whether they took the 8 am tablet ten minutes ago, they lose track of
which screen they are on, and a message that disappears after four seconds
might as well never have appeared.

The patient screens are built around that, not decorated with it afterwards:

1. **Dose state is stored per dose, not per medication.** `DoseId` is
   `medicationId | yyyy-MM-dd | HH:mm`, so Memantine at 08:00 and at 20:00 are
   separate facts and yesterday's tick cannot make today's 08:00 look done.
2. **Every card answers "did I already do this?" with a sentence, not a tick** —
   *"You took this at 8:12 AM today."* — including who logged it, so a dose the
   caregiver marked reads differently from one the patient marked.
3. **Nothing important is transient.** There are no snackbars or toasts in the
   patient screens. Undo is a permanent button on the card, so a mis-tap is
   still reversible ten minutes later.
4. **No confirmation dialogs.** Holding a question in working memory while
   reading it is the exact difficulty here. One tap marks a dose; reversibility
   replaces confirmation. `markTaken` is idempotent, so repeated taps — the
   expected input pattern — cannot corrupt the record or move the logged time.
5. **Doses are split into "Take these now", "Later today" and "Already done",**
   so the answer is never ambiguous and never requires recall.
6. **Time is given in day-parts and relative words** — *Morning*, *Bedtime*,
   *Today*, *Tomorrow*, *In 3 days (Thursday)* — because decoding "14/09" means
   first remembering today's date.
7. **Every medicine carries its purpose and its appearance,** so "what is this
   one for?" and "am I holding the right pill?" are answered on screen.
8. **"Who is taking me?" is on the appointment card,** not behind a tap.
9. **A cancelled appointment stays visible** under a Cancelled heading. A row
   that silently disappears is indistinguishable from one you have forgotten.
10. **Status is always colour + icon + word,** never colour alone (WCAG 1.4.1),
    and "needs doing" also carries a thicker border so it survives greyscale.
11. **A dose you just ticked stays where you tapped it.** It keeps its place in
    "Take these now" and shows its taken state there, moving to "Already done"
    only on the next refresh. A card that relocated hundreds of pixels down the
    page read as "nothing happened", and the natural next move was to tap again.
12. **A skipped dose is never reported as taken,** and skipped cards stay on the
    page rather than disappearing, so the decision remains visible and reversible.
13. **Loading is never rendered as "not found".** Telling a patient their
    medicine has been removed when the file is merely still opening would be
    the worst false message this app could produce.

Baseline accessibility, all of it asserted in `test/accessibility_test.dart`
rather than merely claimed:

* **Screen readers.** Each dose card is one merged semantics node carrying a
  whole sentence, with the action button as a *sibling* node so it stays
  independently focusable — three focus stops per card, no fragments. Section
  headings use `header: true` so they appear in the TalkBack/VoiceOver headings
  rotor, and the day summary is a `liveRegion` so it is re-announced after a
  dose is ticked.
* **Touch targets.** Every control is at least 48 × 48 dp; the primary dose
  buttons are 56 dp. Verified by measuring the rendered widgets, and by
  Flutter's `androidTapTargetGuideline` and `iOSTapTargetGuideline`.
* **Contrast.** Every colour is from the team Figma palette with its WCAG ratio
  measured and recorded in `lib/theme/app_colors.dart`, and re-derived from the
  hex values in `test/unit/status_style_test.dart` so the numbers cannot rot.
  One finding worth noting: the core brand blue **#1A73E8 is 4.24:1 on the page
  background and fails AA for body text**, so it is used as a fill colour only
  and blue text uses **#1565C0** (5.41:1).
* **Large text.** Each patient screen is pumped at `TextScaler.linear(2.0)` and
  required to raise no overflow exception.

## How to run the app

Requires the Flutter SDK (developed against Flutter 3.47 / Dart 3.13; the
project needs Dart >= 3.7).

```bash
cd careconnect_mobile

# The repo's .gitignore excludes the generated platform folders (android/,
# ios/, web/, ...), so a fresh clone has none. Regenerate them once — this
# only writes the platform scaffolding and does not touch lib/ or test/:
flutter create .

flutter pub get
flutter devices          # pick an emulator, device, or desktop/web target
flutter run
```

Running the tests needs none of that — `flutter test` works on a bare clone.

The app opens on the Landing screen. Sign up (or sign in — any credentials are
accepted, authentication is mocked for this milestone), then choose **Patient**
or **Caregiver** to reach the matching set of screens.

On first run the app seeds realistic demo data — Margaret Whitfield, 82, with
six medicines and five appointments — and writes it to JSON in the application
documents directory, so subsequent launches restore whatever you changed.
Appointments are generated relative to the current date, so the Today screen
always has something on it.

## How to run tests

```bash
cd careconnect_mobile
flutter test                 # 170 tests
flutter analyze              # clean
```

To regenerate the coverage report:

```bash
flutter test --coverage      # writes coverage/lcov.info
genhtml coverage/lcov.info -o coverage    # optional HTML report
```

## Link to test coverage report

Coverage is committed in [`careconnect_mobile/coverage/`](careconnect_mobile/coverage/).

* `coverage/lcov.info` — the raw LCOV data.
* `coverage/index.html` — the generated HTML report; open it in a browser.

**Current line coverage: 84.8% (1946 of 2294 lines), against a 60%
requirement. 170 tests, all passing, `flutter analyze` clean.**

Both unit and widget tests are included:

* **Unit tests** (`test/unit/`) — JSON round-trips, dose-key and "today"
  boundary rules, provider mutations and derived lists, undo, the persistence
  layer's fallback behaviour, date wording, and the WCAG contrast calculations.
* **Widget tests** (`test/`) — each screen renders; a tap changes the interface;
  a tap navigates and the destination shows the right item's data; back
  navigation returns; accessibility guidelines are met.

## Visual evidence

Screenshots of every functional screen, in both roles, are in the submission
document rather than in this repository.

A 12:57 narrated walkthrough covers building from a clean checkout, the running
application, the test suite, the coverage report and this README. It is uploaded
as an unlisted video and linked from the submission document.

## Known issues or limitations

* **The generated platform folders are not in the repo.** The root
  `.gitignore` excludes `android/`, `ios/`, `web/`, `linux/`, `macos/` and
  `windows/`, so `flutter run` and `flutter build` fail on a fresh clone until
  `flutter create .` is run once (see *How to run the app*). `flutter test` and
  `flutter analyze` are unaffected. Worth the team deciding before submission
  whether to commit the Android and web folders instead.
* **Authentication is mocked.** `AuthProvider.signIn` accepts any credentials
  and does not validate a password. There is no backend.
* **`PatientProvider` is only 14% covered.** It calls
  `getApplicationDocumentsDirectory()` from its constructor, which throws under
  `flutter_test`, so most of it cannot be reached from a test. The patient-side
  providers avoid this by taking an injectable `JsonStore`; `PatientProvider`
  was left alone this week to keep the change surface small.
* **The caregiver screens display static content.** Simon's medication and
  appointment screens are not yet wired to `MedicationProvider` /
  `AppointmentProvider`; the providers are in place and ready for them.
* **`medication_list_screen.dart`, `appointment_list_screen.dart`,
  `messages_screen.dart` and `help_screen.dart` are placeholders** and are not
  counted among the functional screens. Help is still reachable from the tab bar.
* **The Profile screen's Sign Out button announces "Sign Out", not the fuller
  label the code intends.** A `Semantics(label: ...)` wrapper around a button is
  overridden by the button's own semantics node; the two patient detail screens
  were fixed for this, `profile_screen.dart` has not been.
* **Dose times are stored as local ISO-8601 strings.** Moving the device across
  time zones would shift historical "taken at" labels.
* **Appointment "what to bring" is read-only.** Persisting a tick per item was
  deliberately deferred.

## Team member contributions this week
-Matthew


-Shane
    Built the three assigned patient screens — Patient Today, Patient Medications
    and Patient Appointments — plus Medication Detail and Appointment Detail.
    The patient tabs had been pointing at the caregiver screens; they now render
    the patient's own screens.
    Built the shared domain layer those screens needed: Medication, Appointment
    and the DoseId/DoseRecord/ScheduledDose model that tracks each dose
    separately, an injectable Clock, and a JsonStore/JsonCareRepository
    persistence layer with a file implementation and an in-memory one for tests.
    MedicationProvider and AppointmentProvider are available for the caregiver
    screens to reuse.
    Added the two detail routes that pass an id between screens, and registered
    the new providers in main.dart.
    Implemented the team's STML accessibility constraint across the patient
    screens and wrote the design tokens from the Figma palette, checking every
    contrast ratio (this found that the brand blue fails AA for body text on the
    page background).
    Wrote 107 new tests — unit, widget, navigation and accessibility — taking
    the suite to 170 passing and line coverage to 84.8%.
    Fixed a layout overflow in the patient welcome strip on HomeScreen.

-Simon
    Converted his created caregiver screens from figma to flutter.
    Create a suite of widget and unit tests for the app.
    Updated README.md file.
    Created a word doc for uploading screenshots of screens for the assignment



## AI usage summary (what did AI help with?)
AI was utilized first to convert figma screens to flutter files. It was also used to clean up and simplify the converted files.
AI was also used to generate a suite of widget and unit tests.

For the patient screens, AI (Claude Code) was used to design and implement the
domain layer and the three screens, to work through the short-term memory loss
accessibility decisions, and to write the tests. The design went through an
adversarial review pass before any code was written, which caught several real
problems — an enum member colliding with Dart's built-in `Enum.index`, a
`Timer.periodic` in a provider that would have failed every widget test, and a
dose being logged against the wrong day if the app were left open across
midnight. Every contrast ratio quoted in the code was computed rather than
estimated, which is how we found that our own brand blue fails AA for body text
on the page background. All output was reviewed, and everything is verified by
`flutter analyze` and 170 passing tests.
