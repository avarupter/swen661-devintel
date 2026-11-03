# CareConnect mobile (Flutter, Android): accessibility baseline, before the fixes

Screenshots of `careconnect_mobile` at commit e79a08c, taken on 2 November 2026 before any final-week fix. They are headless Flutter widget-test renders at a 360×800 phone size (851×393 for landscape), with Flutter's real Roboto fonts. The matching "after" set will be in `../after/`.

**Reading the images:**
- Emoji and "→" render as boxes.
- The caregiver header lines render as solid blocks.
- Yellow and black stripes are Flutter's debug overflow marker. A release build clips the same content silently instead.

| File | What it shows | Finding | WCAG |
|---|---|---|---|
| [F1_landing_360x800_text100.png](F1_landing_360x800_text100.png) | Landing at 100% text: "Sign up" is clipped by 19 dp and "Get started" by 9 dp, and the two description lines overlap | H4 | 1.4.10 |
| [F2_landing_360x800_text200.png](F2_landing_360x800_text200.png) | Landing at 200% text: the taglines, descriptions and button overlap, and "Sign up" is clipped by 66 dp | H4 | 1.4.4 |
| [F3_landing_landscape_851x393.png](F3_landing_landscape_851x393.png) | Landing in landscape: everything below the header is off-screen, and nothing scrolls | H4 | 1.4.10 |
| [F4_profile_360x800_text150.png](F4_profile_360x800_text150.png) | Profile at 150% text: Sign Out ends up under the bottom nav (97 px of overflow) | H3 | 1.4.4 |
| [F5_profile_landscape_851x393.png](F5_profile_landscape_851x393.png) | Profile in landscape: 321 px of overflow, and Sign Out can't be reached | H3 | 1.4.10 |
| [F6_role_selection_360x800_text200.png](F6_role_selection_360x800_text200.png) | Role selection at 200% text: 96 px of overflow, and the caregiver card is cut off | M4 | 1.4.4 |
| [F7_caregiver_patients_360x800.png](F7_caregiver_patients_360x800.png) | Caregiver Patients: the Material default purple instead of the brand colours, a second app bar under "Care Dashboard", and tab labels truncated | M2, L5, L6 | n/a (polish) |
| [F8_caregiver_medications_360x800.png](F8_caregiver_medications_360x800.png) | Caregiver Medications: tab labels truncated ("Medicati…", "Appoint…") | L6 | n/a (polish) |
| [F9_patient_detail_placeholder_360x800.png](F9_patient_detail_placeholder_360x800.png) | Tapping a patient opens a "Coming Soon!" placeholder, a dead end | H7 | 4.1.2 |
| [F10_signin_360x800.png](F10_signin_360x800.png) | Sign in: the visible labels are separate text, so the fields are named only by their placeholders, and the 1.48:1 field outline is the only sign a field is there | H2 | 1.3.1, 3.3.2, 4.1.2, 1.4.11 |

The finding IDs refer to the final-week Flutter audit. It found 7 High, 6 Medium and 9 Low items; the patient screens were already solid, and most problems were on Landing, Sign in and Sign up, Role selection, Profile and the caregiver tabs. At the time, `flutter analyze` was clean and 170 of 170 tests passed, with 84.83% line coverage.
