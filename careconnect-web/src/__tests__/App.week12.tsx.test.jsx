import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import App from '../App.tsx';
import { useAuth } from '../auth/AuthContext';
import { getSession } from '../auth/mockAuth';


jest.mock('../auth/mockAuth', () => ({
  getSession: jest.fn(),
}));


jest.mock('../auth/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: jest.fn(),
}));


jest.mock('../context/AppContext', () => ({
  AppProvider: ({ children }) => children,
}));


jest.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }) => children,
  RoleRoute: ({ children }) => children,
}));


jest.mock('../components/AccessibilityControls', () => ({
  __esModule: true,
  default: () => (
    <div>Accessibility Controls</div>
  ),
}));


jest.mock('../components/Layout', () => ({
  __esModule: true,
  default: ({
    children,
    view,
    onSwitchRole,
    onSignOut,
  }) => (
    <div>
      <div data-testid="layout-view">
        {view}
      </div>

      <button onClick={onSwitchRole}>
        Switch role
      </button>

      <button onClick={onSignOut}>
        Sign out
      </button>

      {children}
    </div>
  ),
}));


jest.mock('../pages/Landing', () => ({
  __esModule: true,
  default: () => <div>Landing Page</div>,
}));

jest.mock('../pages/SignIn', () => ({
  __esModule: true,
  default: () => <div>Sign In Page</div>,
}));

jest.mock('../pages/SignUp', () => ({
  __esModule: true,
  default: () => <div>Sign Up Page</div>,
}));

jest.mock('../pages/RoleChooser', () => ({
  __esModule: true,
  default: () => <div>Role Chooser Page</div>,
}));

jest.mock('../pages/Today', () => ({
  __esModule: true,
  default: () => <div>Today Page</div>,
}));

jest.mock('../pages/Schedule', () => ({
  __esModule: true,
  default: () => <div>Schedule Page</div>,
}));

jest.mock('../pages/Appointments', () => ({
  __esModule: true,
  default: () => <div>Appointments Page</div>,
}));

jest.mock('../pages/MedicationEnhanced', () => ({
  __esModule: true,
  default: () => <div>Medications Page</div>,
}));

jest.mock('../pages/MemoriesEnhanced', () => ({
  __esModule: true,
  default: () => <div>Memories Page</div>,
}));

jest.mock('../pages/Contacts', () => ({
  __esModule: true,
  default: () => <div>Contacts Page</div>,
}));

jest.mock('../pages/Messages', () => ({
  __esModule: true,
  default: () => <div>Messages Page</div>,
}));

jest.mock('../pages/Help', () => ({
  __esModule: true,
  default: () => <div>Help Page</div>,
}));

jest.mock('../pages/Caregiver', () => ({
  __esModule: true,
  default: () => <div>Caregiver Page</div>,
}));

jest.mock('../pages/CaregiverEnhanced', () => ({
  __esModule: true,
  default: () => <div>Caregiver Dashboard</div>,
}));

jest.mock('../pages/ActivityLog', () => ({
  __esModule: true,
  default: () => <div>Activity Page</div>,
}));

jest.mock('../pages/ManageMedications', () => ({
  __esModule: true,
  default: () => <div>Manage Medications Page</div>,
}));

jest.mock('../pages/ManageAppointments', () => ({
  __esModule: true,
  default: () => <div>Manage Appointments Page</div>,
}));


const setRole = jest.fn();
const signOut = jest.fn();


function go(path) {
  window.history.pushState({}, '', path);
}


describe('App.tsx Week 12 routing', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      setRole,
      signOut,
    });

    getSession.mockReturnValue(null);

    go('/');
  });


  it('renders the public landing route', () => {
    render(<App />);

    expect(
      screen.getByText('Landing Page'),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Accessibility Controls',
      ),
    ).toBeInTheDocument();
  });


  it('renders the sign-in route', () => {
    go('/signin');

    render(<App />);

    expect(
      screen.getByText('Sign In Page'),
    ).toBeInTheDocument();
  });


  it('renders the sign-up route', () => {
    go('/signup');

    render(<App />);

    expect(
      screen.getByText('Sign Up Page'),
    ).toBeInTheDocument();
  });


  it('renders the role chooser route', () => {
    go('/role');

    render(<App />);

    expect(
      screen.getByText(
        'Role Chooser Page',
      ),
    ).toBeInTheDocument();
  });


  it('starts the app in patient view without caregiver session', () => {
    go('/app');

    getSession.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: 'patient',
    });

    render(<App />);

    expect(
      screen.getByTestId('layout-view'),
    ).toHaveTextContent('patient');

    expect(
      screen.getByText('Today Page'),
    ).toBeInTheDocument();
  });


  it('starts the app in caregiver view from persisted role', () => {
    go('/app');

    getSession.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: 'caregiver',
    });

    render(<App />);

    expect(
      screen.getByTestId('layout-view'),
    ).toHaveTextContent('caregiver');

    expect(
      screen.getByText(
        'Caregiver Dashboard',
      ),
    ).toBeInTheDocument();
  });


  it('switches from patient to caregiver and persists role', async () => {
    const user = userEvent.setup();

    go('/app');

    getSession.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: 'patient',
    });

    render(<App />);

    await user.click(
      screen.getByRole('button', {
        name: 'Switch role',
      }),
    );

    expect(
      screen.getByTestId('layout-view'),
    ).toHaveTextContent('caregiver');

    expect(setRole).toHaveBeenCalledWith(
      'caregiver',
    );
  });


  it('switches from caregiver to patient and persists role', async () => {
    const user = userEvent.setup();

    go('/app');

    getSession.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Jojo',
        email: 'jojo@example.com',
      },
      role: 'caregiver',
    });

    render(<App />);

    await user.click(
      screen.getByRole('button', {
        name: 'Switch role',
      }),
    );

    expect(
      screen.getByTestId('layout-view'),
    ).toHaveTextContent('patient');

    expect(setRole).toHaveBeenCalledWith(
      'patient',
    );
  });


  it('passes sign-out action through the layout', async () => {
    const user = userEvent.setup();

    go('/app');

    render(<App />);

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out',
      }),
    );

    expect(signOut).toHaveBeenCalledTimes(1);
  });


  it.each([
    ['/app/schedule', 'Schedule Page'],
    ['/app/appointments', 'Appointments Page'],
    ['/app/medications', 'Medications Page'],
    ['/app/memories', 'Memories Page'],
    ['/app/contacts', 'Contacts Page'],
    ['/app/messages', 'Messages Page'],
    ['/app/help', 'Help Page'],
    ['/app/caregiver', 'Caregiver Page'],
    ['/app/activity', 'Activity Page'],
    [
      '/app/manage-medications',
      'Manage Medications Page',
    ],
    [
      '/app/manage-appointments',
      'Manage Appointments Page',
    ],
  ])(
    'renders %s',
    (path, expected) => {
      go(path);

      render(<App />);

      expect(
        screen.getByText(expected),
      ).toBeInTheDocument();
    },
  );


  it.each([
    ['/schedule', 'Schedule Page'],
    ['/medications', 'Medications Page'],
    ['/memories', 'Memories Page'],
    ['/contacts', 'Contacts Page'],
    ['/caregiver', 'Caregiver Page'],
  ])(
    'redirects legacy route %s into app namespace',
    async (path, expected) => {
      go(path);

      render(<App />);

      await waitFor(() => {
        expect(
          screen.getByText(expected),
        ).toBeInTheDocument();
      });
    },
  );


  it('redirects unknown app route back to app index', async () => {
    go('/app/not-a-real-page');

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText('Today Page'),
      ).toBeInTheDocument();
    });
  });


  it('redirects an unknown public route to landing', async () => {
    go('/something-invalid');

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText('Landing Page'),
      ).toBeInTheDocument();
    });
  });

});