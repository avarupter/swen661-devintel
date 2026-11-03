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

import SignIn from '../SignIn.tsx';

import {
  useAuth,
} from '../../auth/AuthContext';


jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));


const mockSignIn = jest.fn();


function renderPage() {

  useAuth.mockReturnValue({
    signIn: mockSignIn,
  });

  return render(
    <MemoryRouter
      initialEntries={['/signin']}
    >
      <Routes>

        <Route
          path="/signin"
          element={<SignIn />}
        />

        <Route
          path="/role"
          element={
            <div>
              Role destination
            </div>
          }
        />

      </Routes>
    </MemoryRouter>,
  );
}


describe('SignIn', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('renders login form', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name:
          'Welcome back',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        /Email address/,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        /^Password/,
      ),
    ).toBeInTheDocument();
  });


  it('shows validation errors for empty submission', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      screen.getByRole('button', {
        name: 'Login',
      }),
    );

    expect(
      screen.getByText(
        'Please correct the errors below to continue.',
      ),
    ).toBeInTheDocument();

    expect(
      mockSignIn,
    ).not.toHaveBeenCalled();
  });


  it('rejects invalid email format', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.type(
      screen.getByLabelText(
        /Email address/,
      ),
      'invalid-email',
    );

    await user.type(
      screen.getByLabelText(
        /^Password/,
      ),
      'password',
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Login',
      }),
    );

    expect(
      screen.getByText(
        'Please enter a valid email address.',
      ),
    ).toBeInTheDocument();
  });


  it('toggles password visibility', async () => {
    const user = userEvent.setup();

    renderPage();

    const password =
      screen.getByLabelText(
        /^Password/,
      );

    expect(password).toHaveAttribute(
      'type',
      'password',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Show password',
      }),
    );

    expect(password).toHaveAttribute(
      'type',
      'text',
    );
  });


  it('shows authentication error from sign-in', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({
      error:
        'Account not found',
    });

    renderPage();

    await user.type(
      screen.getByLabelText(
        /Email address/,
      ),
      'jojo@example.com',
    );

    await user.type(
      screen.getByLabelText(
        /^Password/,
      ),
      'password',
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Login',
      }),
    );

    expect(
      await screen.findByRole(
        'alert',
      ),
    ).toHaveTextContent(
      'Account not found',
    );
  });


  it('navigates to role chooser after successful login', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue(
      {},
    );

    renderPage();

    await user.type(
      screen.getByLabelText(
        /Email address/,
      ),
      'jojo@example.com',
    );

    await user.type(
      screen.getByLabelText(
        /^Password/,
      ),
      'password',
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Login',
      }),
    );

    expect(
      await screen.findByText(
        'Role destination',
      ),
    ).toBeInTheDocument();
  });

});