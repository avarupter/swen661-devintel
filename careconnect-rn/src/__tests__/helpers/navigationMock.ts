// src/__tests__/helpers/navigationMock.ts
//
// One place for the React Navigation test double.
//
// Screens call useNavigation()/useRoute() directly, so they cannot be rendered
// without a navigator above them. Rather than stand up a real NavigationContainer
// in every test (slow, and it drags in native modules), we replace just those two
// hooks and leave the rest of the module intact — a blanket module mock would make
// every other export undefined the moment a screen starts using one.

export const mockNavigate = jest.fn();
export const mockGoBack = jest.fn();

/** Route params for the screen under test. Set this before rendering. */
export const routeParams: { current: Record<string, unknown> } = { current: {} };

/**
 * Use from a test file's jest.mock factory:
 *
 *   jest.mock('@react-navigation/native', () =>
 *     require('./helpers/navigationMock').navigationMockFactory());
 */
export function navigationMockFactory() {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({ params: routeParams.current }),
  };
}

/** Call in beforeEach so spies and params never leak between tests. */
export function resetNavigationMock() {
  mockNavigate.mockReset();
  mockGoBack.mockReset();
  routeParams.current = {};
}
