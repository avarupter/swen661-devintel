// src/__tests__/MedicationDetailScreen.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import {
  mockGoBack,
  resetNavigationMock,
  routeParams,
} from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('MedicationDetailScreen', () => {
  test('shows the medicine named by the route param', async () => {
    routeParams.current = { medId: '1' };
    await render(<MedicationDetailScreen />);

    expect(screen.getByText('Memantine')).toBeTruthy();
    expect(screen.getByText('Helps with memory and thinking.')).toBeTruthy();
  });

  test('a different id shows a different medicine', async () => {
    // The id has to actually select — a screen that always renders the first
    // record would pass a single-id test.
    routeParams.current = { medId: '4' };
    await render(<MedicationDetailScreen />);

    expect(screen.getByText('Atorvastatin')).toBeTruthy();
    expect(screen.getByText('Lowers cholesterol.')).toBeTruthy();
    expect(screen.queryByText('Memantine')).toBeNull();
  });

  test('shows how to recognise and take the medicine', async () => {
    routeParams.current = { medId: '4' };
    await render(<MedicationDetailScreen />);

    expect(screen.getByText('White oval tablet.')).toBeTruthy();
    expect(screen.getByText('20 mg — 1 tablet')).toBeTruthy();
    expect(screen.getByText('Once daily at bedtime')).toBeTruthy();
    expect(
      screen.getByText('Avoid grapefruit juice while taking this medicine.')
    ).toBeTruthy();
  });

  test('an unknown id shows a friendly message rather than crashing', async () => {
    routeParams.current = { medId: 'nope' };
    await render(<MedicationDetailScreen />);

    expect(screen.getByText('Medication not found.')).toBeTruthy();
  });

  test('missing params are handled like an unknown id', async () => {
    // route.params is undefined when the screen is opened without arguments.
    routeParams.current = undefined as never;
    await render(<MedicationDetailScreen />);

    expect(screen.getByText('Medication not found.')).toBeTruthy();
  });

  test('the not-found screen offers a way back', async () => {
    routeParams.current = { medId: 'nope' };
    await render(<MedicationDetailScreen />);

    await fireEvent.press(
      screen.getByLabelText('Go back to medications list')
    );

    expect(mockGoBack).toHaveBeenCalled();
  });
});
