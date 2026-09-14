# Starter Template with React Navigation

This is a minimal starter template for React Native apps using Expo and React Navigation.

It includes the following:

- Example [Native Stack](https://reactnavigation.org/docs/native-stack-navigator) with a nested [Bottom Tab](https://reactnavigation.org/docs/bottom-tab-navigator)
- Web support with [React Native for Web](https://necolas.github.io/react-native-web/)
- TypeScript support and configured for React Navigation
- Automatic [deep link](https://reactnavigation.org/docs/deep-linking) and [URL handling configuration](https://reactnavigation.org/docs/configuring-links)
- Theme support [based on system appearance](https://reactnavigation.org/docs/themes/#using-the-operating-system-preferences)
- Expo [Development Build](https://docs.expo.dev/develop/development-builds/introduction/) with [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)

## Getting Started

1. Create a new project using this template:

   ```sh
   npx create-expo-app@latest --template react-navigation/template
   ```

2. Edit the `app.json` file to configure the `name`, `slug`, `scheme` and bundle identifiers (`ios.bundleIdentifier` and `android.bundleIdentifier`) for your app.

3. Edit the `src/App.tsx` file to start working on your app.

## Running the app

- Install the dependencies:

  ```sh
  npm install
  ```

- Start the development server:

  ```sh
  npm start
  ```

- Build and run iOS and Android development builds:

  ```sh
  npm run ios
  # or
  npm run android
  ```

- In the terminal running the development server, press `i` to open the iOS simulator, `a` to open the Android device or emulator, or `w` to open the web browser.


## Testing

```sh
npm test              # run the suite
npm run test:coverage # run with a coverage report
```

111 tests across 18 suites; **91% line coverage** (the assignment requires 60%).
`jest.config` lives in `package.json` and enforces the 60% floor via
`coverageThreshold`, so coverage dropping below it fails the run.

### Writing a screen test

`@testing-library/react-native` v14 is required for React 19 — the Expo SDK 56
docs are explicit that the older `react-test-renderer` "does not support React 19
and above". **v14 made `render` and `fireEvent` asynchronous**, which is the one
thing that trips people up:

```tsx
await render(<SomeScreen />);              // not: render(<SomeScreen />)
await fireEvent.press(screen.getByText('Go'));  // not: fireEvent.press(...)
```

An un-awaited `render` returns a promise, so every query against it fails with
*"render function has not been called"*. An un-awaited `fireEvent` leaks its
`act()` into the next test, which then renders an empty tree and fails with
*"Unable to find an element..."* — in a completely unrelated test. If you see
either message, check for a missing `await` first.

Two more rules that follow from it:

- **Re-query after a state change.** A node captured before `fireEvent` is a
  stale snapshot; `screen.getByLabelText(...)` again to read the new value.
- **Prefer `getByLabelText` over `getByText`** for controls. Headings and buttons
  frequently share a string ("Sign In" is both), and `getByText` throws on
  multiple matches.

### Helpers

- `src/__tests__/helpers/navigationMock.ts` — replaces `useNavigation` and
  `useRoute` only, keeping the rest of `@react-navigation/native` intact. Use
  `mockNavigate` / `mockGoBack` to assert navigation, and set `routeParams.current`
  before rendering a detail screen. Call `resetNavigationMock()` in `beforeEach`.
- `src/__tests__/helpers/renderWithAuth.tsx` — `renderWithAuth` mounts a screen
  inside a real `AuthProvider`; `renderWithSignedInUser` mounts one with a user
  already signed in.

`src/__tests__/Navigation.test.tsx` deliberately does *not* mock navigation: it
drives the real navigator so that a route name a screen calls but the navigator
does not declare shows up as a failure.

## Notes

This project uses a [development build](https://docs.expo.dev/develop/development-builds/introduction/) and cannot be run with [Expo Go](https://expo.dev/go). To run the app with Expo Go, edit the `package.json` file, remove the `expo-dev-client` package and `--dev-client` flag from the `start` script.

We highly recommend using the development builds for normal development and testing.

The `ios` and `android` folder are gitignored in the project by default as they are automatically generated during the build process ([Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)). This means that you should not edit these folders directly and use [config plugins](https://docs.expo.dev/config-plugins/) instead. However, if you need to edit these folders, you can remove them from the `.gitignore` file so that they are tracked by git.

## Resources

- [React Navigation documentation](https://reactnavigation.org/)
- [Expo documentation](https://docs.expo.dev/)

---

Demo assets are from [lucide.dev](https://lucide.dev/)
