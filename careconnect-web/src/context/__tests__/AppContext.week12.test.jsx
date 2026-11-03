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

import { useAuth } from '../../auth/AuthContext';

import {
  AppProvider,
  useApp,
} from '../AppContext';


jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));


function Harness() {
  const {
    patient,
    setPatient,
  } = useApp();

  return (
    <div>
      <div data-testid="patient-name">
        {patient.name}
      </div>

      <div data-testid="caregiver-name">
        {patient.caregiverName}
      </div>

      <button
        onClick={() =>
          setPatient({
            name: 'Dorothy',
            dateOfBirth: '1945-01-01',
            homeAddress: '123 Main Street',
            caregiverName: 'Maria',
            caregiverPhone: '555-0100',
            importantPeople: 'Maria',
            importantFacts: 'Likes tea',
          })
        }
      >
        Update patient
      </button>
    </div>
  );
}


function renderProvider() {
  return render(
    <AppProvider>
      <Harness />
    </AppProvider>,
  );
}


describe('AppContext TSX application', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    useAuth.mockReturnValue({
      user: null,
      role: null,
    });
  });


  it('loads the default patient when storage is empty', () => {
    renderProvider();

    expect(
      screen.getByTestId('patient-name'),
    ).toHaveTextContent('Patient');
  });


  it('loads and trims a stored patient name', () => {
    localStorage.setItem(
      'careconnect_patient',
      JSON.stringify({
        name: '  Dorothy  ',
        caregiverName: 'Maria',
      }),
    );

    renderProvider();

    expect(
      screen.getByTestId('patient-name'),
    ).toHaveTextContent('Dorothy');

    expect(
      screen.getByTestId('caregiver-name'),
    ).toHaveTextContent('Maria');
  });


  it('falls back to default patient for invalid JSON', () => {
    localStorage.setItem(
      'careconnect_patient',
      '{not-valid-json',
    );

    renderProvider();

    expect(
      screen.getByTestId('patient-name'),
    ).toHaveTextContent('Patient');
  });


  it('uses the default name when stored name is blank', () => {
    localStorage.setItem(
      'careconnect_patient',
      JSON.stringify({
        name: '   ',
      }),
    );

    renderProvider();

    expect(
      screen.getByTestId('patient-name'),
    ).toHaveTextContent('Patient');
  });


  it('synchronizes patient identity to signed-in patient', async () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Jojo',
      },
      role: 'patient',
    });

    renderProvider();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-name'),
      ).toHaveTextContent('Jojo');
    });

    const saved = JSON.parse(
      localStorage.getItem(
        'careconnect_patient',
      ),
    );

    expect(saved.name).toBe('Jojo');
  });


  it('does not replace the patient name in caregiver mode', () => {
    localStorage.setItem(
      'careconnect_patient',
      JSON.stringify({
        name: 'Dorothy',
      }),
    );

    useAuth.mockReturnValue({
      user: {
        name: 'Jojo',
      },
      role: 'caregiver',
    });

    renderProvider();

    expect(
      screen.getByTestId('patient-name'),
    ).toHaveTextContent('Dorothy');
  });


  it('updates and persists the patient profile', async () => {
    const user = userEvent.setup();

    renderProvider();

    await user.click(
      screen.getByRole('button', {
        name: 'Update patient',
      }),
    );

    expect(
      screen.getByTestId('patient-name'),
    ).toHaveTextContent('Dorothy');

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem(
          'careconnect_patient',
        ),
      );

      expect(saved.name).toBe('Dorothy');
      expect(saved.caregiverName).toBe('Maria');
    });
  });

});