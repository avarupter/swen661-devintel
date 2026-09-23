# End-to-end tests (Maestro) — Flutter

These drive the built Flutter app on a device or emulator, exercising real
navigation and real state rather than the widget tree in isolation.

## Prerequisites

```sh
curl -Ls "https://get.maestro.mobile.dev" | bash    # installs to ~/.maestro

flutter build apk --debug
adb install -r build/app/outputs/flutter-apk/app-debug.apk
adb devices                                         # confirm one device
```

JDK 17 is required for the Gradle build; newer JDKs fail during toolchain
resolution.

## Running

```sh
maestro test .maestro/flows
maestro test .maestro/flows/03-mark-dose-and-undo.yaml
maestro test --include-tags accessibility .maestro/flows
maestro test --format junit --output e2e-report.xml .maestro/flows
```

## The flows

| Flow | What it covers |
|---|---|
| `01-auth-and-role` | Landing → sign in → role picker |
| `02-patient-today` | The daily dashboard and its three dose sections |
| `03-mark-dose-and-undo` | Mark a dose taken, then undo it |
| `04-medication-detail-and-back` | Open a medicine, come back via the labelled control |
| `05-patient-tabs` | All three patient tabs |
| `06-caregiver-side` | Patients, medications, appointments, activity |
| `07-accessibility-labels` | Semantics labels that TalkBack depends on |

## Status

All 7 flows pass against the debug APK on an Android 34 emulator
(`maestro test .maestro/flows`). `e2e-report.xml` holds the JUnit output.

## Writing matchers for this app

- **Maestro matches the whole node, as a regex** — a substring will not match.
- **Flutter merges sibling Text widgets into one accessibility node.** The tab
  bar exposes `"Medications\nTab 2 of 5"`, and the Today header is one node
  containing the date and the greeting. Assert the exact merged string, or use a
  regex with `(?s)` so `.*` can cross the newlines.
- **`id:` matchers never work here.** Flutter publishes no Android resource-id;
  everything comes through as content-desc, which plain-string matching covers.
- **Do not use `hideKeyboard`.** On Android it is a back press, and Flutter pops
  the route — the flow silently returns to the previous screen and fails several
  steps later somewhere confusing. Tap the next field instead.
- **Avoid asserting anything clock-dependent.** The Today progress sentence
  carries a "N doses are ready to take now" clause that changes through the day,
  and the "Later today" section disappears entirely once nothing is upcoming.
  Both are the app behaving correctly. The flows assert the stable parts.

## A note on Flutter and Maestro

Flutter paints to a canvas — there are no native Android views for Maestro to
find. What it reads instead is the Android accessibility tree, which Flutter
builds from the `Semantics` widgets in `lib/`. Two consequences:

1. These flows only work because the app is already annotated. The labels
   asserted here (`Mark Lisinopril 10 mg at 8:00 AM as taken`,
   `Back to my medicines`) are the ones written for the Week 4 accessibility
   work, so the E2E suite and the screen-reader experience stand or fall
   together.
2. If a flow cannot find an element that is plainly on screen, the usual cause
   is a missing `Semantics` label rather than a bad selector.

## Relationship to the Flutter test suite

`flutter test` (170 tests, 84.8% line coverage) covers widgets and logic in
isolation. These flows cover the assembled app on a device. The overlap is
deliberate: the unit tests localise a break, the flows prove the app still works.
