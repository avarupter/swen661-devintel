// src/__tests__/AppointmentDetailScreen.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import {
  mockGoBack,
  resetNavigationMock,
  routeParams,
} from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('AppointmentDetailScreen', () => {
  test('shows the appointment named by the route param', async () => {
    routeParams.current = { apptId: '1' };
    await render(<AppointmentDetailScreen />);

    expect(screen.getByText('Vision Plus Opticians')).toBeTruthy();
  });

  test('a different id shows a different appointment', async () => {
    routeParams.current = { apptId: '5' };
    await render(<AppointmentDetailScreen />);

    expect(screen.getByText('Eye screening')).toBeTruthy();
    expect(screen.queryByText('Vision Plus Opticians')).toBeNull();
  });

  test('a cancelled appointment says so in plain language', async () => {
    routeParams.current = { apptId: '5' };
    await render(<AppointmentDetailScreen />);

    expect(
      screen.getByText(
        'This appointment was cancelled. Please contact the hospital.'
      )
    ).toBeTruthy();
  });

  test('an unknown id shows a friendly message rather than crashing', async () => {
    routeParams.current = { apptId: 'nope' };
    await render(<AppointmentDetailScreen />);

    expect(screen.getByText('Appointment not found.')).toBeTruthy();
  });

  test('missing params are handled like an unknown id', async () => {
    routeParams.current = undefined as never;
    await render(<AppointmentDetailScreen />);

    expect(screen.getByText('Appointment not found.')).toBeTruthy();
  });

  test('the not-found screen offers a way back', async () => {
    routeParams.current = { apptId: 'nope' };
    await render(<AppointmentDetailScreen />);

    await fireEvent.press(
      screen.getByLabelText('Go back to appointments list')
    );

    expect(mockGoBack).toHaveBeenCalled();
  });
});
