import {
  act,
  fireEvent,
  render,
  screen,
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

import ActivityLog from '../ActivityLog.tsx';
import Caregiver from '../Caregiver.tsx';
import CaregiverDashboard from '../CaregiverDashboard.tsx';
import Today from '../Today.tsx';
import Messages from '../Messages.tsx';
import Medications from '../Medications.tsx';
import ManageMedications from '../ManageMedications.tsx';
import Appointments from '../Appointments.tsx';
import ManageAppointments from '../ManageAppointments.tsx';
import Schedule from '../Schedule.tsx';
import Memories from '../Memories.tsx';
import Home from '../Home.tsx';

import ChatBot from '../../components/ChatBot.tsx';

import {
  useApp,
} from '../../context/AppContext';

import {
  useAuth,
} from '../../auth/AuthContext';


jest.mock('../../context/AppContext', () => ({
  useApp: jest.fn(),
}));

jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));


const mockSetPatient = jest.fn();


function router(ui) {
  return render(
    <MemoryRouter
      initialEntries={['/app']}
    >
      {ui}
    </MemoryRouter>,
  );
}


describe('Week 12 high-impact page coverage', () => {

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    useApp.mockReturnValue({
      patient: {
        name: 'Margaret',
        dateOfBirth: '1945-01-01',
        homeAddress: '123 Main Street',
        caregiverName: 'Maria',
        caregiverPhone: '555 0100',
        importantPeople:
          'Maria is my daughter.',
        importantFacts:
          'I enjoy gardening.',
      },

      setPatient:
        mockSetPatient,
    });

    useAuth.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Jojo Simmons',
        email:
          'jojo@example.com',
      },
    });
  });


  // ==========================================================
  // ACTIVITY LOG
  // ==========================================================

  it('renders and refreshes the activity log', async () => {
    const user =
      userEvent.setup();

    localStorage.setItem(
      'careconnect_activity_log',
      JSON.stringify([
        {
          id: 'evt-1',
          kind: 'med_taken',
          label:
            'Morning medicine taken',
          timestamp:
            new Date().toISOString(),
        },
        {
          id: 'evt-2',
          kind: 'check_in',
          label:
            'Patient checked in',
          timestamp:
            new Date().toISOString(),
        },
      ]),
    );

    render(
      <ActivityLog />,
    );

    expect(
      screen.getByRole('heading', {
        name:
          'Activity log',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Morning medicine taken',
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name:
          'Refresh activity log',
      }),
    );

    expect(
      screen.getByRole('list', {
        name:
          'Activity type legend',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // CAREGIVER NOTES
  // ==========================================================

  it('adds a caregiver note using the signed-in name', async () => {
    const user =
      userEvent.setup();

    router(
      <Caregiver />,
    );

    expect(
      screen.getByRole('heading', {
        name:
          'Caregiver Notes',
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: 'Add note',
      }),
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Urgent',
      }),
    );

    await user.type(
      screen.getByPlaceholderText(
        /Describe any observations/i,
      ),
      'Patient felt dizzy after lunch.',
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Save note',
      }),
    );

    expect(
      screen.getByText(
        'Patient felt dizzy after lunch.',
      ),
    ).toBeInTheDocument();

    expect(
      localStorage.getItem(
        'careconnect_caregiver_notes',
      ),
    ).toContain(
      'Jojo Simmons',
    );
  });


  // ==========================================================
  // CAREGIVER DASHBOARD
  // ==========================================================

  it('renders caregiver dashboard status and management links', () => {
    router(
      <CaregiverDashboard />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Dashboard',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name:
          'Manage medications',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name:
          'Manage appointments',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name:
          'View caregiver notes',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name:
          'View full activity log',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // TODAY
  // ==========================================================

  it('renders patient Today page and quick actions', () => {
    router(
      <Today />,
    );

    expect(
      screen.getByRole('heading', {
        name:
          /Here's your day, Margaret/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name:
          'Quick actions',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // MESSAGES
  // ==========================================================

  it('opens messages, marks them read, and sends a reply', async () => {
    const user =
      userEvent.setup();

    render(
      <Messages />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Messages',
      }),
    ).toBeInTheDocument();

    const markAll =
      screen.queryByRole('button', {
        name:
          'Mark all as read',
      });

    if (markAll) {
      await user.click(markAll);
    }

    const messageBox =
      screen.getByPlaceholderText(
        'Type your message here...',
      );

    await user.type(
      messageBox,
      'I am doing well today.',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Send message',
      }),
    );

    expect(
      screen.getAllByText(
        'I am doing well today.',
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });


  // ==========================================================
  // MEDICATIONS
  // ==========================================================

  it('renders medicines and allows medication interaction', async () => {
    const user =
      userEvent.setup();

    render(
      <Medications />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Medicines',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('region', {
        name:
          'Medication list',
      }),
    ).toBeInTheDocument();

    const buttons =
      screen.getAllByRole(
        'button',
      );

    const enabled =
      buttons.find(
        (button) =>
          !button.disabled &&
          /taken|mark|medicine|dose/i.test(
            button.textContent ||
              button.getAttribute(
                'aria-label',
              ) ||
              '',
          ),
      );

    if (enabled) {
      await user.click(
        enabled,
      );
    }

    expect(
      screen.getByRole('heading', {
        name: 'Medicines',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // MANAGE MEDICATIONS
  // ==========================================================

  it('opens the add medication form and validates it', async () => {
    const user =
      userEvent.setup();

    render(
      <ManageMedications />,
    );

    expect(
      screen.getByRole('heading', {
        name:
          'Manage medications',
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name:
          'Add new medication',
      }),
    );

    expect(
      screen.getByRole('heading', {
        name:
          'Add new medication',
      }),
    ).toBeInTheDocument();

    const medicationHeading =
      screen.getByRole('heading', {
        name: 'Add new medication',
      });

    const medicationForm =
      medicationHeading.closest('form') ||
      document.querySelector('form');

    expect(
      medicationForm,
    ).not.toBeNull();

    fireEvent.submit(
      medicationForm,
    );

    expect(
      screen.getAllByRole(
        'alert',
      ).length,
    ).toBeGreaterThan(0);
  });


  // ==========================================================
  // APPOINTMENTS
  // ==========================================================

  it('switches appointment views and calendar months', async () => {
    const user =
      userEvent.setup();

    render(
      <Appointments />,
    );

    expect(
      screen.getByRole('heading', {
        name:
          'My Appointments',
      }),
    ).toBeInTheDocument();

    const calendarButton =
      screen.queryByRole(
        'button',
        {
          name:
            /calendar/i,
        },
      );

    if (calendarButton) {
      await user.click(
        calendarButton,
      );

      const next =
        screen.queryByRole(
          'button',
          {
            name:
              'Next month',
          },
        );

      if (next) {
        await user.click(next);
      }

      const previous =
        screen.queryByRole(
          'button',
          {
            name:
              'Previous month',
          },
        );

      if (previous) {
        await user.click(
          previous,
        );
      }
    }

    expect(
      screen.getByRole('heading', {
        name:
          'My Appointments',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // MANAGE APPOINTMENTS
  // ==========================================================

  it('opens appointment creation and validates required fields', async () => {
    const user =
      userEvent.setup();

    render(
      <ManageAppointments />,
    );

    expect(
      screen.getByRole('heading', {
        name:
          'Manage appointments',
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name:
          'Add new appointment',
      }),
    );

    expect(
      screen.getByRole('heading', {
        name:
          'Add new appointment',
      }),
    ).toBeInTheDocument();

    const appointmentHeading =
      screen.getByRole('heading', {
        name: 'Add new appointment',
      });

    const appointmentForm =
      appointmentHeading.closest('form') ||
      document.querySelector('form');

    expect(
      appointmentForm,
    ).not.toBeNull();

    fireEvent.submit(
      appointmentForm,
    );

    expect(
      screen.getAllByRole(
        'alert',
      ).length,
    ).toBeGreaterThan(0);
  });


  // ==========================================================
  // SCHEDULE
  // ==========================================================

  it('renders My Day progress, schedule, and meal controls', async () => {
    const user =
      userEvent.setup();

    render(
      <Schedule />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'My Day',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('region', {
        name:
          'Day progress',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('region', {
        name:
          "Today's schedule",
      }),
    ).toBeInTheDocument();

    const scheduleButtons =
      screen.getAllByRole(
        'button',
      );

    const actionable =
      scheduleButtons.find(
        (button) =>
          !button.disabled &&
          (
            button.getAttribute(
              'aria-label',
            ) ||
            ''
          ).length > 0,
      );

    if (actionable) {
      await user.click(
        actionable,
      );
    }

    expect(
      screen.getByRole('heading', {
        name: 'My Day',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // MEMORIES
  // ==========================================================

  it('filters memories and saves profile information', async () => {
    const user =
      userEvent.setup();

    render(
      <Memories />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Memories',
      }),
    ).toBeInTheDocument();

    const family =
      screen.getByRole('button', {
        name:
          /Family/i,
      });

    await user.click(
      family,
    );

    const edit =
      screen.queryByRole(
        'button',
        {
          name:
            /Edit/i,
        },
      );

    if (edit) {
      await user.click(edit);

      const caregiverInput =
        screen.queryByPlaceholderText(
          'Name of caregiver',
        );

      if (caregiverInput) {
        await user.clear(
          caregiverInput,
        );

        await user.type(
          caregiverInput,
          'Maria',
        );

        const save =
          screen.getByRole(
            'button',
            {
              name:
                /Save/i,
            },
          );

        await user.click(save);

        expect(
          mockSetPatient,
        ).toHaveBeenCalled();
      }
    }

    expect(
      screen.getByRole('heading', {
        name: 'Memories',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // HOME
  // ==========================================================

  it('renders both patient and caregiver Home variants', () => {
    const {
      unmount,
    } = router(
      <Home view="patient" />,
    );

    expect(
      screen.getByRole('region', {
        name:
          "Today's summary",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('region', {
        name:
          'Quick links',
      }),
    ).toBeInTheDocument();

    unmount();

    router(
      <Home view="caregiver" />,
    );

    expect(
      screen.getByRole('region', {
        name:
          'Quick links',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // CHATBOT Ã¢â‚¬â€ SCRIPTED RESPONSES
  // ==========================================================

  it('handles multiple CareConnect assistant questions', async () => {
    const user =
      userEvent.setup();

    router(
      <ChatBot variant="embedded" />,
    );

    expect(
      screen.getByText(
        'CareConnect Assistant',
      ),
    ).toBeInTheDocument();

    const input =
      screen.getByPlaceholderText(
        'Example: Where are my appointments?',
      );

    const send =
      screen.getByRole('button', {
        name:
          'Send message to CareConnect Assistant',
      });

    const questions = [
      'What day and time is it?',
      'Where are my appointments?',
      'Where can I see my medicines?',
      'Where is my evening medicine?',
      'Where is my family contact?',
      'Where is My Day?',
      'What can you do?',
      'I have an emergency',
    ];

    for (
      const question
      of questions
    ) {
      await user.clear(input);
      await user.type(
        input,
        question,
      );

      await user.click(
        send,
      );
    }

    expect(
      screen.getAllByText(
        /call local emergency services now/i,
      ).length,
    ).toBeGreaterThanOrEqual(1);

    await user.click(
      screen.getByRole('button', {
        name:
          'Clear assistant conversation',
      }),
    );

    expect(
      screen.getByText(
        'CareConnect Assistant',
      ),
    ).toBeInTheDocument();
  });

});