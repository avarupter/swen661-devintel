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

import RegistrationProfileFields from '../RegistrationProfileFields.tsx';

import {
  getExtendedProfile,
  saveExtendedProfile,
} from '../../data/profileSupport';


jest.mock('../../data/profileSupport', () => ({
  getExtendedProfile: jest.fn(),
  saveExtendedProfile: jest.fn(),
}));


describe('RegistrationProfileFields', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    getExtendedProfile.mockReturnValue({
      dateOfBirth: '',
      maritalStatus: '',
      gender: '',
      homeAddress: '',
      familyMemberName: '',
      familyMemberPhone: '',
    });
  });


  it('renders personal information fields', () => {
    render(
      <RegistrationProfileFields />,
    );

    expect(
      screen.getByRole('group', {
        name:
          'Personal information',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        'Date of birth',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        'Marital status',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        'Gender',
      ),
    ).toBeInTheDocument();
  });


  it('loads stored values', () => {
    getExtendedProfile.mockReturnValue({
      dateOfBirth: '1945-05-01',
      maritalStatus: 'Married',
      gender: 'Female',
      homeAddress: '',
      familyMemberName: '',
      familyMemberPhone: '',
    });

    render(
      <RegistrationProfileFields />,
    );

    expect(
      screen.getByLabelText(
        'Date of birth',
      ),
    ).toHaveValue(
      '1945-05-01',
    );

    expect(
      screen.getByLabelText(
        'Marital status',
      ),
    ).toHaveValue(
      'Married',
    );
  });


  it('saves profile changes immediately', async () => {
    const user = userEvent.setup();

    render(
      <RegistrationProfileFields />,
    );

    await user.selectOptions(
      screen.getByLabelText(
        'Marital status',
      ),
      'Married',
    );

    expect(
      saveExtendedProfile,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        maritalStatus:
          'Married',
      }),
    );

    await user.selectOptions(
      screen.getByLabelText(
        'Gender',
      ),
      'Female',
    );

    expect(
      saveExtendedProfile,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        maritalStatus:
          'Married',
        gender: 'Female',
      }),
    );
  });

});