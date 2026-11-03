import {
  render,
  screen,
} from '@testing-library/react';

import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import CaregiverEnhanced from '../CaregiverEnhanced.tsx';

import {
  getMessages,
} from '../../data/messagesStore';


jest.mock('../../data/messagesStore', () => ({
  getMessages: jest.fn(),
}));


jest.mock('../CaregiverDashboard', () => ({
  __esModule: true,

  default: () => (
    <div>
      Caregiver Dashboard Content
    </div>
  ),
}));


describe('CaregiverEnhanced', () => {

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    getMessages.mockReturnValue([]);
  });


  it('renders empty summary states', () => {
    render(
      <CaregiverEnhanced />,
    );

    expect(
      screen.getByText(
        'No patient messages yet.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'No patient notes yet.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Caregiver Dashboard Content',
      ),
    ).toBeInTheDocument();
  });


  it('shows completed My Day count', () => {
    localStorage.setItem(
      'careconnect_schedule_done',
      JSON.stringify({
        ids: [
          'one',
          'two',
          'three',
        ],
      }),
    );

    render(
      <CaregiverEnhanced />,
    );

    expect(
      screen.getByText(
        '3',
      ),
    ).toBeInTheDocument();
  });


  it('shows recent outgoing patient messages', () => {
    getMessages.mockReturnValue([
      {
        id: 'incoming',
        direction: 'incoming',
        body:
          'Caregiver message',
        timestamp:
          '2026-11-01T10:00:00Z',
      },
      {
        id: 'outgoing',
        direction: 'outgoing',
        body:
          'Patient message',
        timestamp:
          '2026-11-01T11:00:00Z',
      },
    ]);

    render(
      <CaregiverEnhanced />,
    );

    expect(
      screen.getByText(
        'Patient message',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        'Caregiver message',
      ),
    ).not.toBeInTheDocument();
  });


  it('combines meal, medication note, and feedback summaries', () => {
    localStorage.setItem(
      'careconnect_meal_details',
      JSON.stringify({
        details: {
          breakfast: {
            food:
              'Oatmeal',
            notes:
              'Ate well',
          },
        },
      }),
    );

    localStorage.setItem(
      'careconnect_medication_notes',
      JSON.stringify({
        Metformin:
          'Taken with breakfast',
      }),
    );

    localStorage.setItem(
      'careconnect_medication_feedback',
      JSON.stringify({
        Metformin: [
          'No side effects',
        ],
      }),
    );

    render(
      <CaregiverEnhanced />,
    );

    expect(
      screen.getByText(
        /breakfast: Oatmeal/,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Metformin: Taken with breakfast/,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Metformin: No side effects/,
      ),
    ).toBeInTheDocument();
  });


  it('recovers from malformed stored summary data', () => {
    localStorage.setItem(
      'careconnect_schedule_done',
      '{broken',
    );

    localStorage.setItem(
      'careconnect_meal_details',
      '{broken',
    );

    expect(() =>
      render(
        <CaregiverEnhanced />,
      ),
    ).not.toThrow();
  });

});