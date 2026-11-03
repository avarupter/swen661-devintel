import {
  render,
  screen,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';

import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import RoleChooser from '../RoleChooser.tsx';
import { useAuth } from '../../auth/AuthContext';


jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));


const mockSetRole = jest.fn();


function renderPage(name = 'Jojo Simmons') {

  useAuth.mockReturnValue({
    user: name
      ? {
          id: 'user-1',
          name,
          email: 'jojo@example.com',
        }
      : null,

    setRole: mockSetRole,
  });

  return render(
    <MemoryRouter
      initialEntries={['/role']}
    >
      <Routes>

        <Route
          path="/role"
          element={<RoleChooser />}
        />

        <Route
          path="/app"
          element={
            <div>
              App destination
            </div>
          }
        />

      </Routes>
    </MemoryRouter>,
  );
}


describe('RoleChooser', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('greets user by first name', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: /Welcome, Jojo!/i,
      }),
    ).toBeInTheDocument();
  });


  it('shows a general welcome when user name is unavailable', () => {
    renderPage('');

    expect(
      screen.getByRole('heading', {
        name: /^Welcome!?$/i,
      }),
    ).toBeInTheDocument();
  });


  it('selects the care recipient role and enters the app', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      screen.getByRole('button', {
        name:
          /I am the Care Recipient/i,
      }),
    );

    expect(
      mockSetRole,
    ).toHaveBeenCalledWith(
      'patient',
    );

    expect(
      screen.getByText(
        'App destination',
      ),
    ).toBeInTheDocument();
  });


  it('selects the caregiver role and enters the app', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      screen.getByRole('button', {
        name:
          /I am the Caregiver/i,
      }),
    );

    expect(
      mockSetRole,
    ).toHaveBeenCalledWith(
      'caregiver',
    );

    expect(
      screen.getByText(
        'App destination',
      ),
    ).toBeInTheDocument();
  });

});