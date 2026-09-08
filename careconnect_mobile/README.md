# CareConnect

CareConnect is a Flutter mobile application designed to help caregivers and patients manage care activities, medications, appointments, and daily health tasks. The app provides a clear, accessible interface for both roles, with data persistence, responsive layouts, and full screen‑reader support.

---

## How to Run the App

1. **Clone the repository**  
   ```bash
   git clone https://github.com/avarupter/swen661-devintel.git
   cd careconnect_mobile
   ```

2. **Install dependencies**  
   ```bash
   flutter pub get
   ```

3. **Run the app**  
   ```bash
   flutter run
   ```

> **Note:** The app uses mock authentication – you can sign in with any credentials.

---

## How to Run Tests

To run all unit and widget tests:

```bash
flutter test
```

To generate a test coverage report:

```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

After running the coverage command, open `coverage/index.html` in your browser to view the detailed report.

---

## Test Coverage Report

After generating the coverage report, open `coverage/index.html` in your browser.

**Current Coverage: ≥60%** – meets the assignment requirement.

---

## Known Issues / Limitations

- **Authentication** – User login is mocked for demonstration purposes; no real backend is connected.
- **Medications & Appointments** – Data is currently hardcoded in the caregiver screens for demonstration.
- **Data Persistence** – Patients are persisted using JSON files via `path_provider`. Medications and appointments are not yet persisted.
- **Platform Support** – The app is optimized for Android; iOS support is available but not fully tested.

---

## Team Member Contributions (Week 4)

| Member | Contributions |
|--------|---------------|
| **Matthew Spano** | Auth screens (Landing, Sign In, Sign Up), patient CRUD (add/edit/view), profile screen, role‑based home screen (patient vs caregiver), JSON persistence using `path_provider`, semantics/accessibility on all interactive elements, router configuration, merge conflict resolution. |
| **Simon Mazelev** | Caregiver screens (medications, appointments, activity, medication forms), unit tests (`AuthProvider`, `PatientProvider`, models, responsive), widget tests (all screens), test coverage report generation, README updates, `.gitignore` updates. |
| **Shane Cray** | 

---

## AI Usage Summary

AI (GitHub Copilot, ChatGPT) was used in the development of this project for:

- **Code completion** – generating boilerplate code and widget structures
- **Debugging** – resolving build errors and runtime issues
- **Test generation** – creating unit and widget tests with edge cases
- **Documentation** – structuring the README and code comments

All AI‑generated code was thoroughly reviewed, tested, and verified to ensure correctness and quality.

---

## Major Screens

The app includes the following functional screens:

| Screen | Description |
|--------|-------------|
| **Landing** | Welcome screen with sign‑in / sign‑up options |
| **Sign In** | Mock login screen |
| **Sign Up** | Mock account creation screen |
| **Role Selection** | Choose between Patient or Caregiver roles |
| **Home (Caregiver)** | Dashboard with tabs: Patients, Medications, Appointments, Activity, Help |
| **Home (Patient)** | Dashboard with tabs: Profile, Medications, Appointments, Help |
| **Patient List** | List of all patients (caregiver view) |
| **Add/Edit Patient** | Form to create or update patient details |
| **Patient Detail** | View individual patient information |
| **Profile** | Patient profile with health summary and sign‑out |
| **Caregiver Medications** | Medication list with edit/delete options |
| **Caregiver Appointments** | Appointment list with edit/delete options |
| **Caregiver Activity** | Activity log with filters |
| **Help** | Support / FAQ placeholder |

---

## State Management & Navigation

- **State Management:** Provider  
- **Navigation:** GoRouter (Navigator 2.0)  
- **Responsive Layouts:** Phone + Tablet support via `Responsive` utility  
- **Accessibility:** `Semantics` widgets on all interactive elements

---

## Data Persistence

Patient data is persisted using:

- **`path_provider`** – to locate the app's documents directory
- **`dart:io`** – for reading/writing files
- **`dart:convert`** – for JSON serialization

Data is stored in `patients.json` in the app's local storage and survives app restarts.

---

## Build Instructions

To build the APK for Android:

```bash
flutter build apk
```

The APK will be located at `build/app/outputs/flutter-apk/app-release.apk`.

---

## License

This project was created for educational purposes as part of SWEN 661 – Mobile Development.

---

## Acknowledgements

- Flutter & Dart teams for the excellent framework
- Provider, GoRouter, and path_provider packages
- All team members for their contributions