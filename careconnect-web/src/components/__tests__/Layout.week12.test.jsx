import {
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import {
  MemoryRouter,
} from 'react-router-dom';

import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import Layout from '../Layout.tsx';

import { useAuth } from '../../auth/AuthContext';
import { useApp } from '../../context/AppContext';

import {
  getUnreadMessageCount,
  MESSAGES_CHANGED_EVENT,
} from '../../data/messagesStore';


jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../context/AppContext', () => ({
  useApp: jest.fn(),
}));

jest.mock('../../data/messagesStore', () => ({
  getUnreadMessageCount: jest.fn(),
  MESSAGES_CHANGED_EVENT: 'careconnect-messages-changed',
}));

jest.mock('../ChatBot', () => ({
  __esModule: true,
  default: ({ variant }) => (
    <div data-testid="chatbot">
      ChatBot {variant}
    </div>
  ),
}));

jest.mock('../ConfirmDialog', () => ({
  __esModule: true,
  default: ({
    open,
    title,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <button onClick={onConfirm}>
          {confirmLabel}
        </button>

        <button onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    ) : null,
}));


const onSwitchRole = jest.fn();
const onSignOut = jest.fn();


function renderLayout({
  view = 'patient',
  path = '/app',
  patientName = 'Dorothy',
  userName = 'Jojo Simmons',
} = {}) {
  useAuth.mockReturnValue({
    user: {
      id: 'u1',
      name: userName,
      email: 'jojo@example.com',
    },
  });

  useApp.mockReturnValue({
    patient: {
      name: patientName,
      dateOfBirth: '',
      homeAddress: '',
      caregiverName: '',
      caregiverPhone: '',
      importantPeople: '',
      importantFacts: '',
    },
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Layout
        view={view}
        onSwitchRole={onSwitchRole}
        onSignOut={onSignOut}
      >
        <div>Page content</div>
      </Layout>
    </MemoryRouter>,
  );
}


describe('Layout.tsx Week 12', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    getUnreadMessageCount.mockReturnValue(0);
  });


  it('renders the accessible patient shell', () => {
    renderLayout();

    expect(
      screen.getByRole('link', {
        name: 'Skip to main content',
      }),
    ).toHaveAttribute(
      'href',
      '#main-content',
    );

    expect(
      screen.getByRole('main', {
        name: 'Main content',
      }),
    ).toHaveTextContent('Page content');

    expect(
      screen.getByRole('navigation', {
        name: 'Patient navigation',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Care recipient'),
    ).toBeInTheDocument();
  });


  it('renders all patient navigation destinations', () => {
    renderLayout();

    const names = [
      'Home',
      'My Day',
      'Appointments',
      'Medicines',
      'Memories',
      'Contacts',
      'Messages',
      'Help',
    ];

    names.forEach((name) => {
      expect(
        screen.getByRole('link', {
          name,
        }),
      ).toBeInTheDocument();
    });
  });


  it('marks the current patient route as the current page', () => {
    renderLayout({
      path: '/app/messages',
    });

    expect(
      screen.getByRole('link', {
        name: 'Messages',
      }),
    ).toHaveAttribute(
      'aria-current',
      'page',
    );

    expect(
      screen.getByLabelText(
        'Current screen: Messages',
      ),
    ).toHaveTextContent('Messages');
  });


  it('shows unread message count in the accessible name', () => {
    getUnreadMessageCount.mockReturnValue(4);

    renderLayout({
      path: '/app/messages',
    });

    expect(
      screen.getByRole('link', {
        name: 'Messages, 4 unread messages',
      }),
    ).toBeInTheDocument();
  });


  it('caps the visible unread badge at 9+', () => {
    getUnreadMessageCount.mockReturnValue(14);

    renderLayout();

    expect(
      screen.getByText('9+'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: 'Messages, 14 unread messages',
      }),
    ).toBeInTheDocument();
  });


  it('refreshes unread messages when message data changes', async () => {
    getUnreadMessageCount
      .mockReturnValueOnce(0)
      .mockReturnValue(3);

    renderLayout();

    expect(
      screen.getByRole('link', {
        name: 'Messages',
      }),
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new Event(MESSAGES_CHANGED_EVENT),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole('link', {
          name: 'Messages, 3 unread messages',
        }),
      ).toBeInTheDocument();
    });
  });


  it('refreshes unread messages after storage changes', async () => {
    getUnreadMessageCount
      .mockReturnValueOnce(1)
      .mockReturnValue(6);

    renderLayout();

    act(() => {
      window.dispatchEvent(
        new Event('storage'),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole('link', {
          name: 'Messages, 6 unread messages',
        }),
      ).toBeInTheDocument();
    });
  });


  it('shows the caregiver call action only in patient view', () => {
    renderLayout();

    const call = screen.getByRole('link', {
      name: /Call your caregiver/i,
    });

    expect(call).toHaveAttribute(
      'href',
      'tel:07700900456',
    );

    expect(
      screen.getByText('Call my caregiver'),
    ).toBeInTheDocument();
  });


  it('shows the patient chatbot', () => {
    renderLayout();

    expect(
      screen.getByTestId('chatbot'),
    ).toHaveTextContent(
      'ChatBot floating',
    );
  });


  it('uses the signed-in user first name in the greeting', () => {
    renderLayout({
      userName: 'Jojo Simmons',
    });

    expect(
      screen.getByText(
        /Good (morning|afternoon|evening), Jojo/,
      ),
    ).toBeInTheDocument();
  });


  it('renders a greeting without a name when user name is unavailable', () => {
    useAuth.mockReturnValue({
      user: null,
    });

    useApp.mockReturnValue({
      patient: {
        name: 'Dorothy',
      },
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Layout
          view="patient"
          onSwitchRole={onSwitchRole}
          onSignOut={onSignOut}
        >
          <div>Page content</div>
        </Layout>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        /^Good (morning|afternoon|evening)$/,
      ),
    ).toBeInTheDocument();
  });


  it('shows the current screen title', () => {
    renderLayout({
      path: '/app/appointments',
    });

    expect(
      screen.getByLabelText(
        'Current screen: My Appointments',
      ),
    ).toHaveTextContent(
      'My Appointments',
    );
  });


  it('falls back to CareConnect for an unknown screen title', () => {
    renderLayout({
      path: '/app/unknown-screen',
    });

    expect(
      screen.getByLabelText(
        'Current screen: CareConnect',
      ),
    ).toHaveTextContent(
      'CareConnect',
    );
  });


  it('renders caregiver navigation and patient-plan context', () => {
    renderLayout({
      view: 'caregiver',
      patientName: 'Dorothy',
    });

    expect(
      screen.getByRole('navigation', {
        name: 'Caregiver navigation',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Caregiver'),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Viewing Dorothy's care plan",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        'Call my caregiver',
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('chatbot'),
    ).not.toBeInTheDocument();
  });


  it('renders caregiver navigation destinations', () => {
    renderLayout({
      view: 'caregiver',
    });

    const names = [
      'Dashboard',
      'Medications',
      'Appointments',
      'Activity',
      'Notes',
    ];

    names.forEach((name) => {
      expect(
        screen.getByRole('link', {
          name,
        }),
      ).toBeInTheDocument();
    });
  });


  it('switches from patient to caregiver', async () => {
    const user = userEvent.setup();

    renderLayout();

    const buttons =
      screen.getAllByRole('button', {
        name: 'Switch to Caregiver View',
      });

    await user.click(buttons[0]);

    expect(
      onSwitchRole,
    ).toHaveBeenCalledTimes(1);
  });


  it('switches from caregiver to care recipient', async () => {
    const user = userEvent.setup();

    renderLayout({
      view: 'caregiver',
    });

    const buttons =
      screen.getAllByRole('button', {
        name: 'Switch to Care Recipient View',
      });

    await user.click(buttons[0]);

    expect(
      onSwitchRole,
    ).toHaveBeenCalledTimes(1);
  });


  it('opens the sign-out confirmation dialog', async () => {
    const user = userEvent.setup();

    renderLayout();

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out of CareConnect',
      }),
    );

    expect(
      screen.getByRole('dialog', {
        name: 'Sign out of CareConnect?',
      }),
    ).toBeInTheDocument();
  });


  it('confirms sign out', async () => {
    const user = userEvent.setup();

    renderLayout();

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out of CareConnect',
      }),
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out',
      }),
    );

    expect(
      onSignOut,
    ).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument();
  });


  it('can cancel sign out', async () => {
    const user = userEvent.setup();

    renderLayout();

    await user.click(
      screen.getByRole('button', {
        name: 'Sign out of CareConnect',
      }),
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Stay signed in',
      }),
    );

    expect(
      onSignOut,
    ).not.toHaveBeenCalled();

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument();
  });


  it('renders footer contact navigation', () => {
    renderLayout();

    expect(
      screen.getByRole('contentinfo'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: 'View contacts',
      }),
    ).toHaveAttribute(
      'href',
      '/app/contacts',
    );
  });

});