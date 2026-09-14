// src/__tests__/App.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

// expo-linking's createURL runs at module scope and needs the expo-constants
// manifest, which the Jest environment does not provide. The deep-link prefix is
// irrelevant to what this test checks, so stub it.
jest.mock('expo-linking', () => ({
  createURL: () => 'careconnect://',
}));

import { App } from '../App';

describe('App', () => {
  test('boots and shows the landing screen', async () => {
    await render(<App />);

    await waitFor(() => {
      expect(screen.getByText('CareConnect')).toBeTruthy();
    });
  });

  test('puts the auth provider above the navigator', async () => {
    // Every screen that calls useAuth throws "useAuth must be used inside an
    // AuthProvider" if the provider is not mounted above the navigator, so
    // reaching a screen that uses it is what proves the wiring.
    await render(<App />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('Sign in to your existing account')
      ).toBeTruthy();
    });
    expect(screen.toJSON()).not.toBeNull();
  });
});
