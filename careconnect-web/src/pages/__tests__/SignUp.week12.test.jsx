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

import SignUp from '../SignUp.tsx';

import {
  useAuth,
} from '../../auth/AuthContext';


jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));


jest.mock(
  '../../components/RegistrationProfileFields',
  () => ({
    __esModule: true,

    default: () => (
      <div>
        Personal information
      </div>
    ),
  }),
);


const mockSignUp = jest.fn();


function renderPage() {

  useAuth.mockReturnValue({
    signUp: mockSignUp,
  });

  return render(
    <MemoryRouter
      initialEntries={['/signup']}
    >
      <Routes>

        <Route
          path="/signup"
          element={<SignUp />}
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


describe('SignUp', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('renders account creation form', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name:
          'Create your account',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        /Your name/,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        /Email address/,
      ),
    ).toBeInTheDocument();
  });


  it('shows validation errors for empty submission', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      screen.getByRole('button', {
        name:
          'Create account',
      }),
    );

    expect(
      screen.getByText(
        'Please correct the errors below to continue.',
      ),
    ).toBeInTheDocument();

    expect(
      mockSignUp,
    ).not.toHaveBeenCalled();
  });


  it('requires password length of at least six characters', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.type(
      screen.getByLabelText(
        /Your name/,
      ),
      'Jojo',
    );

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
      '123',
    );

    await user.type(
      screen.getByLabelText(
        /Confirm password/,
      ),
      '123',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Create account',
      }),
    );

    expect(
      screen.getByText(
        'Password must be at least 6 characters.',
      ),
    ).toBeInTheDocument();
  });


  it('requires matching passwords', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.type(
      screen.getByLabelText(
        /Your name/,
      ),
      'Jojo',
    );

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

    await user.type(
      screen.getByLabelText(
        /Confirm password/,
      ),
      'different',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Create account',
      }),
    );

    expect(
      screen.getByText(
        'Passwords do not match.',
      ),
    ).toBeInTheDocument();
  });


  it('toggles password controls', async () => {
    const user = userEvent.setup();

    renderPage();

    const showButtons =
      screen.getAllByRole('button', {
        name: 'Show password',
      });

    expect(showButtons).toHaveLength(2);

    await user.click(showButtons[0]);

    expect(
      screen.getAllByRole('button', {
        name: 'Hide password',
      }),
    ).toHaveLength(1);

    const remainingShowButton =
      screen.getByRole('button', {
        name: 'Show password',
      });

    await user.click(
      remainingShowButton,
    );

    expect(
      screen.getAllByRole('button', {
        name: 'Hide password',
      }),
    ).toHaveLength(2);
  });


  it('shows signup API error', async () => {
    const user = userEvent.setup();

    mockSignUp.mockResolvedValue({
      error:
        'Account already exists',
    });

    renderPage();

    await user.type(
      screen.getByLabelText(
        /Your name/,
      ),
      'Jojo',
    );

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

    await user.type(
      screen.getByLabelText(
        /Confirm password/,
      ),
      'password',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Create account',
      }),
    );

    expect(
      await screen.findByRole(
        'alert',
      ),
    ).toHaveTextContent(
      'Account already exists',
    );
  });


  it('navigates after successful signup', async () => {
    const user = userEvent.setup();

    mockSignUp.mockResolvedValue(
      {},
    );

    renderPage();

    await user.type(
      screen.getByLabelText(
        /Your name/,
      ),
      'Jojo',
    );

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

    await user.type(
      screen.getByLabelText(
        /Confirm password/,
      ),
      'password',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Create account',
      }),
    );

    expect(
      await screen.findByText(
        'Role destination',
      ),
    ).toBeInTheDocument();
  });

});