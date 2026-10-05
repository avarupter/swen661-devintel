# End-to-end tests (Maestro) — React Native

Maestro drives the built app on a real device or emulator, so these are true E2E
tests: they exercise the app the way a user does, not the component tree.

## Prerequisites

```sh
# Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash      # installs to ~/.maestro

# A booted Android emulator or a connected device
adb devices

# The app installed on it — note assembleRelease, not assembleDebug
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

**Use the release build.** The debug APK is an `expo-dev-client` build: it boots
the dev launcher and waits for a Metro server, so `launchApp` lands on
"Development Build / Start a local development server" and every flow fails on
the first assertion. The release build has the JS bundled and runs standalone.
It is signed with the debug keystore, so no signing setup is needed.

JDK 17 is required. React Native's Gradle plugin pins
`foojay-resolver-convention` 0.5.0, which is incompatible with Gradle 9 — on a
machine with only a newer JDK, Gradle tries to auto-provision 17, hands off to
foojay and dies with `JvmVendorSpec ... IBM_SEMERU`. Installing a real JDK 17
avoids the resolver entirely:

```sh
export JAVA_HOME=/path/to/jdk-17
```

## Running

```sh
maestro test .maestro/flows                       # all flows
maestro test .maestro/flows/02-patient-daily-check.yaml
maestro test --include-tags accessibility .maestro/flows
maestro test --format junit --output e2e-report.xml .maestro/flows
```

## The flows

| Flow | What it covers |
|---|---|
| `01-auth-sign-up` | New account, and the typed name surviving into the greeting |
| `02-patient-daily-check` | Today: the three dose sections, the progress count, the appointment |
| `03-patient-detail-and-back` | Tap a medicine → its own detail → back to the list |
| `04-patient-tab-navigation` | All four patient tabs |
| `05-caregiver-add-patient` | Add a patient and see it appear in the list |
| `06-caregiver-edit-patient` | Edit form arrives prefilled; the edit lands in the list |
| `07-add-patient-validation` | Both validation branches keep the user on the form |
| `08-sign-out` | Sign-out clears the session and returns to landing |
| `09-accessibility-labels` | Icon-only controls and card summaries are labelled |

## Status

All 9 flows pass against the release APK on an Android 34 emulator
(`maestro test .maestro/flows`). `e2e-report.xml` holds the JUnit output.

## Writing matchers for this app

Three things cost real time the first time round:

- **Maestro matches the whole node, as a regex.** A substring will not match.
  Where the app merges text, either assert the exact merged string or use a
  regex — `text: "(?s).*1 of 6 doses taken today"` (the `(?s)` lets `.*` cross
  the newline).
- **React Native publishes the accessibilityLabel and the visible text as two
  separate nodes.** Prefer the label: "Sign In" is both a heading and a button,
  while "Sign in to your account" is unambiguous.
- **Several nodes can share one string.** Four nodes on the Add Patient screen
  read "Add Patient" — the nav title, the in-app header, the button and the
  button's inner label — and only one is clickable. Tapping the wrong one is a
  silent no-op that looks exactly like a validation bug, so that flow selects
  with `below: "Condition"`. That collision is also worth fixing in the app: a
  screen-reader user hears "Add Patient" three times on one screen.

Also: `eraseText` deletes backwards from the caret, and React Native puts the
caret where you tap. Tapping the middle of a filled field and erasing leaves the
tail behind, so `06-caregiver-edit-patient` taps the right edge of the field
first.

## Why the accessibility flow matters

Maestro matches against the Android `content-desc`, which is what
`accessibilityLabel` compiles to — the same string TalkBack reads out. The
icon-only controls (back, add) have no visible text, so if a label is dropped
they become unlabelled buttons for a screen-reader user while looking completely
fine on screen. `09-accessibility-labels.yaml` is what catches that.

## Relationship to the Jest tests

The Jest suite (`npm test`, 130 tests) covers components and logic in isolation
with navigation mocked. These flows cover the assembled app on a device: real
navigation, real state across screens, real keyboard input. They overlap on
purpose — the Jest tests tell you *which unit* broke, the Maestro flows tell you
whether the app still works.
