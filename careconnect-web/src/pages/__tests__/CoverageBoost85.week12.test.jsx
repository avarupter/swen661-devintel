import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import ManageMedications from '../ManageMedications.tsx';
import ManageAppointments from '../ManageAppointments.tsx';

import {
  getMedications,
  saveMedications,
  pickColour,
} from '../../data/medsStore';

import {
  getAppointments,
  saveAppointments,
} from '../../data/apptStore';


jest.mock('../../data/medsStore', () => ({
  getMedications: jest.fn(),
  saveMedications: jest.fn(),
  pickColour: jest.fn(),
}));

jest.mock('../../data/apptStore', () => ({
  getAppointments: jest.fn(),
  saveAppointments: jest.fn(),
}));


const existingMedication = {
  id: 'med-existing',
  name: 'Amlodipine',
  dosage: '5 mg',
  times: ['08:00', '20:00'],
  instructions: 'Take with water',
  colour: 'bg-calm-200',
  taken: {},
};


const existingAppointment = {
  id: 'appt-existing',
  title: 'Heart checkup',
  date: '2026-12-15',
  time: '10:30',

  location: {
    name: 'City Heart Clinic',
    address: '45 Hospital Way',
    type: 'hospital',
  },

  caregiver: 'Maria',
  notes: 'Bring medicine list',
  isInMyDay: true,
};


describe('Week 12 coverage boost - manage pages', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    pickColour.mockReturnValue(
      'bg-success-200',
    );
  });


  // ==========================================================
  // MANAGE MEDICATIONS - ADD
  // ==========================================================

  it('adds a complete medication successfully', async () => {
    const user =
      userEvent.setup();

    getMedications.mockReturnValue([]);

    render(
      <ManageMedications />,
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Add new medication',
      }),
    );

    await user.type(
      screen.getByLabelText(
        /Medication name/i,
      ),
      'Metformin',
    );

    await user.type(
      screen.getByLabelText(
        /Dose/i,
      ),
      '500 mg',
    );

    fireEvent.change(
      screen.getByLabelText(
        'Time',
      ),
      {
        target: {
          value: '08:00',
        },
      },
    );

    await user.type(
      screen.getByLabelText(
        /Instructions|notes/i,
      ),
      'Take with breakfast',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Add another scheduled time',
      }),
    );

    const timeInputs =
      screen.getAllByLabelText(
        /Time/,
      );

    fireEvent.change(
      timeInputs[1],
      {
        target: {
          value: '20:00',
        },
      },
    );

    expect(
      screen.getByRole('button', {
        name:
          'Remove time 2',
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name:
          'Add medication',
      }),
    );

    expect(
      saveMedications,
    ).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Metformin',
          dosage: '500 mg',
          times: [
            '08:00',
            '20:00',
          ],
          instructions:
            'Take with breakfast',
          colour:
            'bg-success-200',
        }),
      ]),
    );

    expect(
      saveMedications,
    ).toHaveBeenCalled();
  });


  // ==========================================================
  // MANAGE MEDICATIONS - EDIT
  // ==========================================================

  it('edits an existing medication and removes a scheduled time', async () => {
    const user =
      userEvent.setup();

    getMedications.mockReturnValue([
      existingMedication,
    ]);

    render(
      <ManageMedications />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Edit',
      }),
    );

    expect(
      screen.getByRole('heading', {
        name:
          'Edit medication',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByLabelText(
        /Time/,
      ),
    ).toHaveLength(2);

    await user.click(
      screen.getByRole('button', {
        name:
          'Remove time 2',
      }),
    );

    const dose =
      screen.getByLabelText(
        /Dose/i,
      );

    await user.clear(dose);

    await user.type(
      dose,
      '10 mg',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Save changes',
      }),
    );

    expect(
      saveMedications,
    ).toHaveBeenCalledWith([
      expect.objectContaining({
        id:
          'med-existing',
        name:
          'Amlodipine',
        dosage:
          '10 mg',
        times: [
          '08:00',
        ],
      }),
    ]);
  });


  // ==========================================================
  // MANAGE MEDICATIONS - CANCEL
  // ==========================================================

  it('cancels medication editing', async () => {
    const user =
      userEvent.setup();

    getMedications.mockReturnValue([
      existingMedication,
    ]);

    render(
      <ManageMedications />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Edit',
      }),
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Cancel and close form',
      }),
    );

    expect(
      screen.queryByRole('heading', {
        name:
          'Edit medication',
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name:
          'Add new medication',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // MANAGE MEDICATIONS - DELETE
  // ==========================================================

  it('deletes an existing medication after confirmation', async () => {
    const user =
      userEvent.setup();

    getMedications.mockReturnValue([
      existingMedication,
    ]);

    render(
      <ManageMedications />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Delete',
      }),
    );

    expect(
      saveMedications,
    ).toHaveBeenCalledWith(
      [],
    );
  });


  // ==========================================================
  // MANAGE APPOINTMENTS - ADD PHYSICAL
  // ==========================================================

  it('adds a complete physical appointment successfully', async () => {
    const user =
      userEvent.setup();

    getAppointments.mockReturnValue([]);

    render(
      <ManageAppointments />,
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Add new appointment',
      }),
    );

    await user.type(
      screen.getByLabelText(
        /Appointment title/i,
      ),
      'Dental checkup',
    );

    fireEvent.change(
      screen.getByLabelText(
        /^Date/i,
      ),
      {
        target: {
          value:
            '2026-12-20',
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        /^Time/i,
      ),
      {
        target: {
          value:
            '14:30',
        },
      },
    );

    await user.selectOptions(
      screen.getByLabelText(
        /Location type/i,
      ),
      'clinic',
    );

    await user.type(
      screen.getByLabelText(
        /Location name/i,
      ),
      'Dental Clinic',
    );

    expect(
      screen.getByLabelText(
        'Address',
      ),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(
        'Address',
      ),
      '123 Main Street',
    );

    await user.type(
      screen.getByLabelText(
        /Assigned caregiver/i,
      ),
      'Maria',
    );

    await user.type(
      screen.getByLabelText(
        /Patient notes/i,
      ),
      'Bring insurance card',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Add appointment',
      }),
    );

    expect(
      saveAppointments,
    ).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title:
            'Dental checkup',

          date:
            '2026-12-20',

          time:
            '14:30',

          location:
            expect.objectContaining({
              name:
                'Dental Clinic',
              address:
                '123 Main Street',
              type:
                'clinic',
            }),

          caregiver:
            'Maria',

          notes:
            'Bring insurance card',

          isInMyDay:
            false,
        }),
      ]),
    );

    expect(
      saveAppointments,
    ).toHaveBeenCalled();
  });


  // ==========================================================
  // MANAGE APPOINTMENTS - TELEPHONE BRANCH
  // ==========================================================

  it('handles a telephone appointment without an address', async () => {
    const user =
      userEvent.setup();

    getAppointments.mockReturnValue([]);

    render(
      <ManageAppointments />,
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Add new appointment',
      }),
    );

    await user.selectOptions(
      screen.getByLabelText(
        /Location type/i,
      ),
      'telephone',
    );

    expect(
      screen.queryByLabelText(
        'Address',
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.getByLabelText(
        /Location name/i,
      ),
    ).toHaveAttribute(
      'placeholder',
      expect.stringMatching(
        /Telephone/i,
      ),
    );
  });


  // ==========================================================
  // MANAGE APPOINTMENTS - EDIT
  // ==========================================================

  it('edits an existing appointment and preserves My Day status', async () => {
    const user =
      userEvent.setup();

    getAppointments.mockReturnValue([
      existingAppointment,
    ]);

    render(
      <ManageAppointments />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Edit',
      }),
    );

    expect(
      screen.getByRole('heading', {
        name:
          'Edit appointment',
      }),
    ).toBeInTheDocument();

    const title =
      screen.getByLabelText(
        /Appointment title/i,
      );

    await user.clear(title);

    await user.type(
      title,
      'Updated heart checkup',
    );

    await user.selectOptions(
      screen.getByLabelText(
        /Location type/i,
      ),
      'telephone',
    );

    expect(
      screen.queryByLabelText(
        'Address',
      ),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name:
          'Save changes',
      }),
    );

    expect(
      saveAppointments,
    ).toHaveBeenCalledWith([
      expect.objectContaining({
        id:
          'appt-existing',

        title:
          'Updated heart checkup',

        isInMyDay:
          true,

        location:
          expect.objectContaining({
            type:
              'telephone',
          }),
      }),
    ]);
  });


  // ==========================================================
  // MANAGE APPOINTMENTS - CANCEL
  // ==========================================================

  it('cancels appointment editing', async () => {
    const user =
      userEvent.setup();

    getAppointments.mockReturnValue([
      existingAppointment,
    ]);

    render(
      <ManageAppointments />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Edit',
      }),
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Cancel and close form',
      }),
    );

    expect(
      screen.queryByRole('heading', {
        name:
          'Edit appointment',
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name:
          'Add new appointment',
      }),
    ).toBeInTheDocument();
  });


  // ==========================================================
  // MANAGE APPOINTMENTS - DELETE
  // ==========================================================

  it('deletes an appointment after confirmation', async () => {
    const user =
      userEvent.setup();

    getAppointments.mockReturnValue([
      existingAppointment,
    ]);

    render(
      <ManageAppointments />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Delete',
      }),
    );

    expect(
      saveAppointments,
    ).toHaveBeenCalledWith(
      [],
    );
  });

});