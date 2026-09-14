// src/__tests__/LandingScreen.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LandingScreen from '../screens/LandingScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('LandingScreen', () => {
  test('renders without crashing', () => {
    render(<LandingScreen />);
    expect(screen.toJSON()).not.toBeNull();
  });

  test('contains the CareConnect title', () => {
    render(<LandingScreen />);
    expect(screen.getByText('CareConnect')).toBeTruthy();
  });

  test('contains the Sign In button text', () => {
    render(<LandingScreen />);
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  test('contains the Create Account button text', () => {
    render(<LandingScreen />);
    expect(screen.getByText('Create Account')).toBeTruthy();
  });

  test('contains the tagline', () => {
    render(<LandingScreen />);
    expect(screen.getByText('Your daily companion')).toBeTruthy();
  });
});