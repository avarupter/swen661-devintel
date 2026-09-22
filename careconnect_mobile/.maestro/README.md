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
