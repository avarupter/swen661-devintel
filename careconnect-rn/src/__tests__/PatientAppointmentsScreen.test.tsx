// src/__tests__/PatientAppointmentsScreen.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PatientAppointmentsScreen from '../screens/PatientAppointmentsScreen';
import { mockNavigate, resetNavigationMock } from './helpers/navigationMock';

jest.mock('@react-navigation/native', () =>
  require('./helpers/navigationMock').navigationMockFactory()
);

beforeEach(resetNavigationMock);

describe('PatientAppointmentsScreen', () => {
  test('groups appointments by when they happen', async () => {
    await render(<PatientAppointmentsScreen />);

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Coming up')).toBeTruthy();
    expect(screen.getByText('Already happened')).toBeTruthy();
  });

  test('a cancelled appointment stays visible under its own heading', async () => {
    await render(<PatientAppointmentsScreen />);

    // It must not silently disappear — a remembered appointment vanishing is
    // indistinguishable from having forgotten it.
    expect(screen.getByText('Cancelled')).toBeTruthy();
    expect(screen.getByText('Eye screening')).toBeTruthy();
  });

  test('shows when and where each appointment is', async () => {
    await render(<PatientAppointmentsScreen />);

    expect(screen.getByText('Today at 2:00 PM')).toBeTruthy();
    expect(screen.getByText('22 High Street, Westfield')).toBeTruthy();
  });

  test("today's appointment names the driver in its label", async () => {
    await render(<PatientAppointmentsScreen />);

    expect(
      screen.getByLabelText(/^Vision Plus Opticians, Today at 2:00 PM/)
    ).toBeTruthy();
  });

  test('tapping an appointment opens that appointment, passing its id', async () => {
    await render(<PatientAppointmentsScreen />);

    await fireEvent.press(screen.getByLabelText(/^Vision Plus Opticians/));

    expect(mockNavigate).toHaveBeenCalledWith('AppointmentDetail', {
      apptId: '1',
    });
  });

  test('a past appointment passes its own id, not the first one', async () => {
    await render(<PatientAppointmentsScreen />);

    await fireEvent.press(screen.getByLabelText(/^Blood test/));

    expect(mockNavigate).toHaveBeenCalledWith('AppointmentDetail', {
      apptId: '4',
    });
  });
});
