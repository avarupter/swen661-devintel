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
│   │   └── lcov.info                             # Aggregate line coverage report
│   ├── lib/                                      # Main Flutter application source code
│   │   ├── main.dart                             # Application entry point (MyApp)
│   │   ├── models/                               # Data entities & models
│   │   │   ├── patient.dart                      # Patient data model & JSON serialization
│   │   │   └── user.dart                         # User entity model
│   │   ├── providers/                            # State management (Provider pattern)
│   │   │   ├── auth_provider.dart                # Authentication & user role state
│   │   │   └── patient_provider.dart             # Patient CRUD operations & file persistence
│   │   ├── router/                               # Application navigation & routing
│   │   │   └── app_router.dart                   # GoRouter route definitions & navigation paths
│   │   ├── screens/                              # UI Screen widgets
│   │   │   ├── add_edit_patient_screen.dart      # Add and Edit Patient form screen
│   │   │   ├── appointment_list_screen.dart      # Patient appointments list view
│   │   │   ├── caregiver_activity_screen.dart    # Caregiver activity log & event feed
│   │   │   ├── caregiver_appointments_screen.dart# Caregiver appointment management
│   │   │   ├── caregiver_medication_forms_screen.dart # Medication form input screen
│   │   │   ├── caregiver_medications_screen.dart # Caregiver medications view
│   │   │   ├── help_screen.dart                  # Help & support screen
│   │   │   ├── home_screen.dart                  # Main role-based dashboard scaffold
│   │   │   ├── landing_screen.dart               # Welcome landing screen
│   │   │   ├── medication_list_screen.dart       # Patient medications overview list
│   │   │   ├── messages_screen.dart              # Messaging screen
│   │   │   ├── patient_list_screen.dart          # Patient directory list
│   │   │   ├── profile_screen.dart               # Patient profile & health summary
│   │   │   ├── role_selection_screen.dart        # Role selection screen (Patient vs. Caregiver)
│   │   │   ├── signin_screen.dart                # User sign-in screen
│   │   │   └── signup_screen.dart                # User account registration screen
│   │   └── utils/                                # Helpers & utilities
│   │       └── responsive.dart                   # Responsive viewport & breakpoint utility
│   ├── test/                                     # Automated test suite (59 passing tests)
│   │   ├── unit/                                 # Unit tests for models, providers, & routing
│   │   │   ├── app_router_test.dart              # Route configuration unit tests
│   │   │   ├── auth_provider_test.dart           # AuthProvider state unit tests
│   │   │   ├── patient_model_test.dart           # Patient JSON serialization unit tests
│   │   │   ├── responsive_test.dart              # Responsive breakpoint unit tests
│   │   │   └── user_model_test.dart              # User model unit tests
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
├── mobile-flutter/ # Android app (Flutter)
├── mobile-rn/ # iOS app (React Native)
├── desktop-electron/ # Windows app (Electron)
└── web-react/ # Web app (React + Vite)
```

## Project description
    The project is a flutter app with responsive layouts for mobile and tablet created from wireframes. The wireframes were created in figma and converted into flutter files. The app has incorporated navigation between screens, data persistance and state management.


## How to run the app



## How to run tests



## Link to test coverage report



## Known issues or limitations



## Team member contributions this week
-Matthew


-Shane


-Simon
    Converted his created caregiver screens from figma to flutter.
    Create a suite of widget and unit tests for the app.
    Updated README.md file.
    Created a word doc for uploading screenshots of screens for the assignment



## AI usage summary (what did AI help with?)
AI was utilized first to convert figma screens to flutter files. It was also used to clean up and simplify the converted files.
AI was also used to generate a suite of widget and unit tests.
