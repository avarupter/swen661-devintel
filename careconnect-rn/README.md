# CareConnect – React Native

CareConnect is a React Native mobile application designed to help caregivers and patients manage care activities, medications, appointments, and daily health tasks. This is the React Native implementation of the app originally built in Flutter during Week 4. Both apps share the same features, screens, and accessibility goals, allowing direct comparison between the two mobile frameworks.

The app provides a clear, accessible interface for both roles (patient and caregiver), with role-aware navigation, responsive layouts, and full screen-reader support.

---

## How to Install and Run the Application

### Requirements

- Node.js 20 or higher
- npm (comes with Node.js)
- Expo SDK 56
- The **Expo Go** app on your phone (Android or iOS), OR an Android emulator

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/avarupter/swen661-devintel.git
   cd careconnect-rn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start --go
   ```

4. **Open the app**
   - **On your phone:** scan the QR code with the Expo Go app
   - **On Android emulator:** press `a` in the terminal
   - **In a web browser:** press `w` in the terminal

The app uses mock authentication – any credentials work.

---

## How to Run Tests

To run all unit and component tests:

```bash
npm test
```

To generate a test coverage report:

```bash
npm run test:coverage
```

After running the coverage command, open `coverage/lcov-report/index.html` in your browser to view the detailed report.

To generate an HTML test results dashboard:

```bash
npm test
```

The report appears at `html-report/report.html`.

---

## Test Coverage Report

After generating the coverage report, open `coverage/lcov-report/index.html` in your browser.

**Current Coverage: 91.83%** – well above the assignment requirement of 60%.

Coverage is enforced by Jest via `coverageThreshold` in `package.json`. If coverage drops below 60%, the test run fails.

---

## Major Screens Included

### Authentication

| Screen | Description |
|--------|-------------|
| Landing | Welcome screen with Sign In and Create Account buttons |
| Sign In | Mock login form with email and password fields |
| Sign Up | Mock account creation form with name, email, and password |
| Role Selection | Choose between Patient or Caregiver role after sign-in |

### Patient Screens

| Screen | Description |
|--------|-------------|
| Patient Today | Daily dashboard showing today's doses grouped by status (Take now / Later / Done), progress summary, and today's appointment with driver info |
| Patient Medications | Full list of medicines with purpose, dose, appearance, and schedule. "Only if you need it" medicines listed separately |
| Patient Appointments | Appointments grouped by Today / Coming up / Cancelled / Already happened |
| Medication Detail | Full details of one medicine: purpose, dose, appearance, prescriber, and notes |
| Appointment Detail | Full details of one appointment: location, driver, duration, what to bring, and notes |
| Patient Profile | Patient's own info, health summary, and Sign Out button |

### Caregiver Screens

| Screen | Description |
|--------|-------------|
| Patient List | List of patients the caregiver manages; tap to open their record |
| Caregiver Medications | Medication management with Edit and Delete options |
| Caregiver Medication Form | Add or edit a medication |
| Caregiver Appointments | Appointment management with Edit and Delete options |
| Caregiver Activity | Activity log with filters |

---

## State Management

**React Context API** with `useState` for local widget state.

Shared state lives in `AuthContext` (`src/context/AuthContext.tsx`), which holds the signed-in user and the selected role (patient or caregiver). Child screens read from it via the `useAuth()` hook.

Pure business logic is extracted into `src/utils/` so it can be unit-tested independently of the React component tree:

- `authUtils.ts` – user creation, login state, role validation
- `dateUtils.ts` – date formatting, relative day labels, greetings
- `doseUtils.ts` – dose grouping, progress percentage

The app does not use Redux or Zustand – the Context API covers all the shared state needs of this app.

---

## Navigation

**React Navigation v7** with the static API.

- `createNativeStackNavigator` – top-level routes (Landing, Sign In, Sign Up, Role Selection, PatientTabs, CaregiverTabs, MedicationDetail, AppointmentDetail)
- `createBottomTabNavigator` – role-specific tab layouts:
  - **Patient tabs:** Today, Medications, Appointments, Profile
  - **Caregiver tabs:** Patients, Medications, Appointments, Activity

Route configuration lives in `src/navigation/index.tsx`.

### Passing Data Between Screens

Detail screens receive their `id` through route params:

```tsx
navigation.navigate('MedicationDetail', { medId: '1' });
navigation.navigate('AppointmentDetail', { apptId: '2' });
```

The receiving screen reads the parameter via `useRoute()`:

```tsx
const route = useRoute();
const { medId } = route.params;
```

---

## Important Setup Information

- **Framework:** React Native with Expo SDK 56
- **Language:** TypeScript
- **Navigation:** React Navigation v7 (native stack + bottom tabs)
- **Icons:** @react-native-vector-icons/ionicons
- **Testing:** Jest + React Native Testing Library
- **State:** React Context API

### Version Notes

- **Expo SDK 56** (not 57) – install the matching version of Expo Go from [expo.dev/go](https://expo.dev/go)
- **@testing-library/react-native@12.4.0** – v14 has known compatibility issues with React 19 in this project (silent render failures). Pinned to 12.4.0 for reliable testing.
- **@react-native/jest-preset@0.85.3** – must match the React Native version (0.85.3) exactly, or Jest throws a `setup-env` resolution error.

### Verification Commands

```bash
npm test                 # run all tests
npm run test:coverage    # run tests with coverage report
npx tsc --noEmit         # type-check without building
npx expo start --go      # start the dev server
```

---

## Testing Details

**111 tests across 18 test suites, all passing. 91.83% line coverage.**

### Test Files

Unit tests (`src/__tests__/`):
- `authUtils.test.ts` – user creation, login state, role validation
- `dateUtils.test.ts` – date formatting, greetings, relative days
- `doseUtils.test.ts` – dose grouping, percentage calculation

Component tests (RNTL):
- `App.test.tsx`
- `LandingScreen.test.tsx`
- `SignInScreen.test.tsx`
- `SignUpScreen.test.tsx`
- `RoleSelectionScreen.test.tsx`
- `AuthContext.test.tsx`
- `PatientTodayScreen.test.tsx`
- `PatientMedicationsScreen.test.tsx`
- `PatientAppointmentsScreen.test.tsx`
- `PatientProfileScreen.test.tsx`
- `PatientListScreen.test.tsx`
- `MedicationDetailScreen.test.tsx`
- `AppointmentDetailScreen.test.tsx`
- `CaregiverScreens.test.tsx`
- `Navigation.test.tsx`

### Test Helpers

- `src/__tests__/helpers/navigationMock.ts` – replaces `useNavigation` and `useRoute` only, keeping the rest of `@react-navigation/native` intact.
- `src/__tests__/helpers/renderWithAuth.tsx` – mounts a screen inside a real `AuthProvider`, or with a signed-in user already set up.

---

## Build Instructions

### Android Development Build

```bash
npx expo run:android
```

### Android Production Build (EAS)

```bash
eas build --platform android
```

The APK will be produced by EAS and a download link provided.

---

## Known Issues and Limitations

- **Patient Detail and Add/Edit Patient screens are not implemented.** Tapping a patient in the caregiver list currently does nothing. This is a feature parity gap from the Flutter version.
- **Caregiver screens display static content.** They are not yet wired to shared context providers.
- **Authentication is mocked.** Any credentials are accepted; there is no backend.
- **Coverage is on the RN source only.** The template screens inherited from the starter (`src/navigation/screens/Home.tsx`, `Updates.tsx`, etc.) have partial coverage but are not part of the CareConnect app.

---

## Team Member Contributions (Week 5)

| Member | Contributions |
|--------|---------------|
| Matthew Spano | React Native project setup (Expo + TypeScript), auth screens (Landing, Sign In, Sign Up, Role Selection), patient screens (Today, Medications, Appointments, Profile), detail screens (Medication, Appointment), AuthContext state management, role-aware navigation, Jest unit tests (22 passing), extracted pure logic into utils, investigated and solved the React 19 + RNTL compatibility issue, README updates, Word doc. |
| Simon Mazelev | Caregiver screens (Patient List, Caregiver Medications, Caregiver Medication Form, Caregiver Appointments, Caregiver Activity), caregiver tab navigation integrated with role-aware routing, ESLint / TypeScript audit, Android APK build. |
| Shane Cray | React Native Testing Library component tests for all screens (89 tests across 15 files), test helpers (navigationMock, renderWithAuth), AuthContext component tests, README updates, comparison document (Flutter vs React Native), video demonstration. |

---

## Video Demonstration

A 10–15 minute video walkthrough of the application is available here:

**YouTube Link:** [pending]

The video demonstrates:
1. Building and testing the app from the repository
2. All app features and navigation
3. Testing objectives and coverage report
4. Documentation review

---

## AI Usage Summary

AI (GitHub Copilot, Claude, ChatGPT) was used in the development of this project for:

- **Code completion** – generating React Native boilerplate and component structures from the Flutter source
- **Framework translation** – converting Flutter widgets into React Native components
- **Debugging** – diagnosing the React 19 + React Native Testing Library compatibility issue and identifying the working version combination
- **Test generation** – creating unit and component tests with edge cases
- **Documentation** – structuring the README and code comments

All AI-generated code was thoroughly reviewed, tested, and verified to ensure correctness and quality.

---

## License

This project was created for educational purposes as part of SWEN 661 – Mobile Development.

---

## Acknowledgements

- React Native and Expo teams for the excellent frameworks
- React Navigation, @react-native-vector-icons, and Jest contributors
- All team members for their contributions