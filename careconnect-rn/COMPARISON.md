# React Native vs Flutter — CareConnect

**SWEN 661 · Week 5 · Team DevIntel**

In Week 4 we built CareConnect in Flutter. In Week 5 we rebuilt the same application
in React Native. Because both implementations live in this repository
(`careconnect_mobile/` and `careconnect-rn/`) and target the same features, the same
users and the same accessibility constraint — short-term memory loss (STML) — we can
compare the two frameworks against something more useful than general impressions.

Everything below is measured from the two codebases in this repository. Where we give a
number, it came from counting the actual files.

---

## At a glance

| | Flutter (Week 4) | React Native (Week 5) |
|---|---|---|
| Directory | `careconnect_mobile/` | `careconnect-rn/` |
| Language | Dart 3 (sound null safety) | TypeScript 6 (`strict: true`) |
| Application code | **48 files, 7,169 lines** | **29 files, 3,693 lines** |
| Screens | 21 files, 3,730 lines | 16 files, 3,082 lines |
| Reusable widgets / components | 5 files, 592 lines — used by 5 of 21 screens | *no equivalent directory* |
| Test code | **33 files, 2,967 lines** | **20 files, 1,427 lines** |
| Tests | 169 | 111 |
| State management | `ChangeNotifier` + Provider (4 providers) | React Context (2 providers) |
| Routing | `go_router` — `lib/router/app_router.dart` | React Navigation 7 static config |
| Persistence | `lib/services/json_store.dart` | *none — in-memory only* |
| Design tokens | `lib/theme/app_colors.dart` — used by 5 of 21 screens | *none — 51 distinct hex literals inline* |
| Accessibility annotations | 88 `Semantics` usages | 41 `accessibilityLabel` usages |
| Test tooling | `flutter_test` + `lcov` / `genhtml` | Jest + RNTL + Istanbul |

The React Native implementation is roughly **half the code** of the Flutter one. Some of
that is genuine framework concision. Most of it, honestly, is scope: the caregiver side
is shallower and there is no persistence layer.

---

## 1. Development process and project setup

**Flutter was more opinionated; React Native was more assembled.**

`flutter create` produced a project that needed almost no decisions: `pubspec.yaml` for
dependencies, `analysis_options.yaml` for linting, and a test runner already wired up.

The React Native side required assembling a stack. `package.json` carries 19 runtime
dependencies and 10 dev dependencies, plus a `jest` block, a `coverageThreshold`, a
`collectCoverageFrom` list and a reporters array — configuration that Flutter either
supplies by default or does not need. On top of that sit `app.json` (Expo), and
`tsconfig.json`.

The second implementation was still **faster to build than the first**, but that is a
statement about already having settled the product design, not about the framework. We
were translating a finished app, not designing one.

One real cost specific to the React Native port: the Expo starter template left screens
behind that are not part of CareConnect — `src/navigation/screens/Home.tsx`,
`Updates.tsx`, `Settings.tsx`, `Profile.tsx`, `NotFound.tsx`. They are still in the tree
and still counted by the coverage tool, where they sit at 30% and drag the total down.
Flutter's scaffold left nothing comparable behind.

---

## 2. Ease of implementation

**Dart's widget trees are more verbose; JSX is more readable. Flutter's styling is more disciplined.**

Comparing the same screens in both codebases, the React Native versions are consistently
shorter. Flutter's nested `Widget` constructors with their trailing-comma formatting take
more vertical space than the equivalent JSX. Separating layout (JSX) from style
(`StyleSheet.create` at the bottom of the file) also makes a React Native screen easier to
skim than a Flutter `build()` method where layout and styling are interleaved.

Where Flutter did better was **consistency** — though the honest version of this is
narrower than we first wrote. `lib/theme/app_colors.dart` is a genuine design-token module,
documented against the team's Figma file with a measured WCAG contrast ratio annotated on
each token. But it is not adopted app-wide: only **5 of the 21 Flutter screens** import it
(the patient screens and the two detail screens), and **10 Flutter screens hardcode 36
distinct `Color(0x…)` literals** of their own.

The React Native port has no such module at all. Its screens contain **51 distinct hex
colour literals** and **not one screen imports a shared theme**.

So the fair statement is: neither implementation carries its design system all the way
through, but Flutter has a real one covering part of the app and React Native has none.
For a project whose central constraint is accessibility, that matters — where the token
file is used, the Flutter code can prove its contrast ratios; the React Native code cannot
prove them anywhere.

On typing, both languages are statically checked, but we used them with different rigour.
Dart's null safety is enforced throughout. In React Native we reached for escape hatches:
`useNavigation<any>()` appears in all 16 screens that navigate, and route parameters are
read as `route.params?.patient` with no route type map. So the navigation layer — exactly
where a typo is most costly — is the least typed part of the TypeScript app.

We also found that `tsconfig.json` set `"types": ["node"]`, which excluded `@types/jest`.
`npx tsc --noEmit` — the command our own README lists under *Verification Commands* —
reported **360 errors** as a result. Adding `"jest"` to that array brings it to **0**.

---

## 3. Component structure

**Flutter's layering survived; React Native's did not.**

The Flutter app separates concerns across nine directories:

```
lib/models/     6 files   lib/providers/  4 files   lib/services/   2 files
lib/screens/   21 files   lib/widgets/    5 files   lib/core/       3 files
lib/theme/      2 files   lib/router/     1 file    lib/data/       2 files
```

The React Native app has four:

```
src/screens/   16 files   src/context/    2 files
src/navigation/ 6 files   src/utils/      3 files
```

Three Flutter layers have **no React Native counterpart at all**:

- **`lib/widgets/`** — `status_chip.dart`, `dose_tile.dart`, `appointment_tile.dart`,
  `section_header.dart`, `care_page.dart`. Five reusable widgets, 592 lines. Like the
  theme module, these are used by **5 of the 21 Flutter screens** rather than universally
  — so Flutter's reuse is real but partial. React Native has no shared component directory
  at all; every screen defines its own card and row components privately, which is why the
  same visual patterns are reimplemented several times over.
- **`lib/models/`** — six typed domain models. React Native declares its types inline
  (e.g. the `Patient` interface inside `PatientContext.tsx`) or not at all.
- **`lib/services/`** — `care_repository.dart` and `json_store.dart`. React Native has no
  data layer; screens own their mock data as module-level constants.

This is not a fault of React Native — nothing stopped us from creating `src/components/`
and `src/models/`. It is a fair observation about what happened when we ported quickly:
the layering was flattened, and the duplication that followed is the main reason the
React Native codebase is harder to change than its smaller line count suggests.

---

## 4. State management and navigation

**Comparable models; React Native's is smaller because less state is shared.**

Flutter uses `ChangeNotifier` with Provider across four providers
(`auth_provider`, `patient_provider`, `medication_provider`, `appointment_provider`).
React Native uses the Context API with two (`AuthContext`, `PatientContext`).

The two missing providers are the difference in practice. In the Flutter app the
medication and appointment screens read from shared state. In React Native those screens
hold their own module-level constants — `MOCK_DOSES` in `PatientTodayScreen.tsx` is the
clearest example, and it is why *"mark as taken"* on that screen is a `console.log` stub:
there is no state for it to update.

The ergonomics are close. `useContext` + `useState` involves less ceremony than
`ChangeNotifier` + `notifyListeners()` + a `Consumer` widget. Flutter's `Selector` gives
finer-grained rebuild control that React Context does not, though at this app's size that
never mattered.

On navigation, React Navigation 7's static `createNativeStackNavigator({ screens: {...} })`
config reads better than `go_router`'s route table, and the bottom-tab API is pleasant.
But `go_router` gives typed route parameters and React Navigation, as we used it, gives
none — see the `useNavigation<any>()` point above. We were bitten by exactly this: the
patient list navigated to a `PatientDetail` route that did not exist, and nothing —
not the compiler, not the linter — said so. It failed silently at runtime. Only an
integration test over the real navigator caught it.

---

## 5. Testing

**React Native was the better testing experience — but for narrower reasons than we
assumed before we counted.**

| | Flutter | React Native |
|---|---|---|
| Runner | `flutter test` | `jest` |
| Component testing | `WidgetTester`, `pumpWidget` | `@testing-library/react-native` |
| Typical query | `find.text` ×232, `find.byType` ×31, `find.byKey` ×0 | `getByText` ×80, `getByLabelText` ×72 |
| Coverage | `flutter test --coverage` + `genhtml` | `jest --coverage` (Istanbul, built in) |
| Threshold enforcement | none configured | `coverageThreshold` — on `test:coverage` only |
| Tests | 169 across 33 files | 111 across 20 files |

**Where React Native genuinely wins is coverage tooling.** Jest produces the HTML report,
the text summary and the lcov file from one command. Flutter needs `genhtml` from the
`lcov` package installed separately. Jest also supports `coverageThreshold`, which we use
to fail the run below 60% — though note this only bites on `npm run test:coverage`, since
plain `npm test` does not collect coverage and therefore never evaluates the gate.

**Where we expected React Native to win, and it did not:** we assumed RNTL's user-facing
queries (`getByLabelText`, `getByText`) would contrast with a Flutter suite coupled to
widget classes. Counting the actual finders says otherwise. The Flutter suite uses
**232 `find.text`, 13 `find.textContaining` and 13 `find.bySemanticsLabel` against only
31 `find.byType` — and zero `find.byKey`**, meaning it has no test-only handles at all.
The React Native suite uses 80 `getByText` and 72 `getByLabelText`. **Both suites are
overwhelmingly user-facing.** RNTL makes that style the path of least resistance rather
than a deliberate choice, which is a real ergonomic advantage — but it is not the
difference in kind we assumed before counting.

Flutter is in fact the more *rigorous* of the two suites on one axis: it asserts absence
and multiplicity far more often — **20 `findsNothing` and 19 `findsNWidgets`** against
only 3 `queryBy…`/`toBeNull` checks on the React Native side. It is easy to write tests
that only confirm what should appear; Flutter's suite more consistently checks what should
*not*.

Flutter's advantage is **stability**. `flutter_test` ships with the SDK and its version is
never a question. The React Native testing stack is a version matrix that must be held in
exact alignment, and we lost real time to it — see below.

---

## 6. Debugging and developer experience

**Flutter's toolchain is calmer. React Native's failures are quieter and more confusing.**

Hot reload and Fast Refresh are comparable in daily use. The difference was in what
happened when something broke.

The worst problem of the week was `@testing-library/react-native` v14 against React 19.
It did not error. Tests **rendered nothing and silently passed or failed in ways that
pointed nowhere**. Diagnosing it meant bisecting dependency versions rather than reading a
stack trace. The fix was to pin RNTL to `12.4.0`, which is recorded in the README's
*Version Notes* so the next person does not repeat the search. A related trap:
`@react-native/jest-preset` must match the React Native version (`0.85.3`) **exactly**, or
Jest fails with an opaque `setup-env` resolution error.

Flutter produced nothing comparable. Dart compile errors point at a line; Flutter's
widget-level exceptions render an error box in the UI that names the offending widget.

Two further React Native failure modes worth recording, both of which cost us a working
test suite on the `master` branch:

1. **Silent navigation failures.** Navigating to a route name that does not exist does
   nothing at all — no throw, no warning.
2. **Context errors surface far from their cause.** Adding `usePatients()` to
   `PatientListScreen` broke two test suites with
   `usePatients must be used within a PatientProvider`, thrown from the context file
   rather than from the test that forgot the provider.

The honest summary: React Native let us move faster and gave us better tests, and it also
let a broken test suite and a 360-error type-check sit on `master` without anything
shouting about it. Flutter is harder to start and harder to get wrong.

---

## 7. Usability and the STML constraint

Both implementations deliver the same interface: two roles, high contrast, large touch
targets, plain language, and today-focused patient screens.

Flutter carries the constraint more rigorously. `app_colors.dart` documents the WCAG
contrast ratio of every token against the two surfaces the app actually paints on, and
records the design decision that status is **never** carried by colour alone — always an
icon and a written label as well. The Flutter app has 88 `Semantics` annotations and a
dedicated `test/accessibility_test.dart`.

React Native reproduces the *result* — the screens look and behave the same, and 41
`accessibilityLabel` annotations cover the interactive elements — but not the *discipline*.
There is no token file, no documented contrast ratios, and no dedicated accessibility test.
Accessibility survived the port largely because RNTL's query style makes labels
load-bearing in the tests, not because we set out to protect it.

One part of that gap is **not** our fault, and it is the single strongest technical point
in Flutter's favour in this whole comparison. `test/accessibility_test.dart` calls
`meetsGuideline(androidTapTargetGuideline)`, `meetsGuideline(iOSTapTargetGuideline)` and
`meetsGuideline(textContrastGuideline)` — Flutter automatically verifies that **every tap
target is large enough and every text/background pair has sufficient contrast**, because
`flutter_test` renders with a real layout engine and can measure pixels.

React Native Testing Library has no layout engine. It renders a component tree, not a
laid-out screen, so it has **no equivalent check and cannot have one**. For a project whose
assigned constraint is accessibility, that is a material capability Flutter has and React
Native does not. We can assert that a label exists; we cannot assert that the button is big
enough to press or that the text is readable against its background.

Flutter also invests considerably more in testing domain logic away from the UI:
`test/unit/` is **11 files and 931 lines**, against React Native's 3 utility test files
totalling 151 lines.

---

## Conclusion

**React Native was the better experience for building and testing this application.**
Less code, faster iteration, and a testing library whose defaults make user-facing,
accessibility-led queries the easy path. If we were continuing CareConnect, we would continue in
React Native.

**Flutter produced the more disciplined codebase** — though not a uniformly disciplined
one — and it has one capability React Native simply lacks: automated tap-target and
contrast verification in its test suite. Proper layering, reusable widgets, a documented design system (adopted by 5 of 21
screens), a persistence layer and typed routing. Some of that is Flutter's
opinionated structure; much of it is that we had more time with it and were designing
rather than translating.

The most useful lesson was not about either framework. It was that React Native's
tolerance — untyped navigation, silent route failures, a type-check excluded from CI by
one line of config — means the discipline has to come from the team. Flutter supplies more
of it by default. Given the same constraint again, we would take React Native's speed and
testing, and deliberately rebuild the three things we lost in the port: a shared component
directory, a design-token module, and typed route parameters.

---

## Deliverable evidence

| Claim | Where to check |
|---|---|
| 111 tests, 18 suites, all passing | `npm test` in `careconnect-rn/` |
| 85.51% statements / 85.23% lines | `npm run test:coverage`; report in `coverage/lcov-report/index.html` |
| 169 Flutter tests | `flutter test` in `careconnect_mobile/` |
| Flutter coverage report | `careconnect_mobile/coverage/index.html` |
| Line and file counts above | `find`/`wc -l` over `lib/` and `src/` |
