import {
  render,
  screen,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import MedicationMemoryPanel from '../MedicationMemoryPanel.tsx';

import {
  getMedications,
} from '../../data/medsStore';


jest.mock('../../data/medsStore', () => ({
  getMedications: jest.fn(),
}));


describe('MedicationMemoryPanel', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('shows its initial memory-help message', () => {
    getMedications.mockReturnValue([]);

    render(
      <MedicationMemoryPanel />,
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Choose a question if you need help remembering your medicine.',
    );
  });


  it('reports when no medication schedule exists', async () => {
    const user = userEvent.setup();

    getMedications.mockReturnValue([]);

    render(
      <MedicationMemoryPanel />,
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Which medicine is next?',
      }),
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'No medication schedule is registered.',
    );
  });


  it('uses medicine colour and morning location cues', async () => {
    const user = userEvent.setup();

    getMedications.mockReturnValue([
      {
        id: 'm1',
        name: 'Morning Tablet',
        dosage: '10 mg',
        colour: 'bg-calm-200',
        times: ['06:00'],
        taken: {},
      },
    ]);

    render(
      <MedicationMemoryPanel />,
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'What color bottle should I look for?',
      }),
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      /Morning Tablet/,
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      /blue color cue/,
    );
  });


  it('uses the evening medication cue', async () => {
    const user = userEvent.setup();

    getMedications.mockReturnValue([
      {
        id: 'm2',
        name: 'Evening Tablet',
        dosage: '5 mg',
        colour: 'bg-alert-200',
        times: ['18:00'],
        taken: {},
      },
    ]);

    render(
      <MedicationMemoryPanel />,
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Where is my evening medicine?',
      }),
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      /Evening Tablet/,
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      /nightstand beside the bed/,
    );
  });


  it('reports when no evening medicine exists', async () => {
    const user = userEvent.setup();

    getMedications.mockReturnValue([
      {
        id: 'm3',
        name: 'Morning Tablet',
        dosage: '5 mg',
        colour: 'bg-green-200',
        times: ['08:00'],
        taken: {},
      },
    ]);

    render(
      <MedicationMemoryPanel />,
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Where is my evening medicine?',
      }),
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'No evening medication is registered.',
    );
  });


  it('shows backup location guidance', async () => {
    const user = userEvent.setup();

    getMedications.mockReturnValue([]);

    render(
      <MedicationMemoryPanel />,
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Where else might it be?',
      }),
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      /backup locations/i,
    );
  });

});