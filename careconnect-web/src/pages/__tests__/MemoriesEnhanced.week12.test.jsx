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

import MemoriesEnhanced from '../MemoriesEnhanced.tsx';

import {
  getExtendedProfile,
  saveExtendedProfile,
} from '../../data/profileSupport';


jest.mock('../../data/profileSupport', () => ({
  getExtendedProfile: jest.fn(),
  saveExtendedProfile: jest.fn(),
}));


jest.mock('../Memories', () => ({
  __esModule: true,

  default: () => (
    <div>
      Memories main content
    </div>
  ),
}));


describe('MemoriesEnhanced', () => {

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


  it('renders personal details and memories content', () => {
    render(
      <MemoriesEnhanced />,
    );

    expect(
      screen.getByRole('heading', {
        name:
          'About Me - Personal Details',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Memories main content',
      ),
    ).toBeInTheDocument();
  });


  it('updates and saves personal details', async () => {
    const user = userEvent.setup();

    render(
      <MemoriesEnhanced />,
    );

    await user.type(
      screen.getByLabelText(
        'Family member name',
      ),
      'Maria',
    );

    await user.type(
      screen.getByLabelText(
        'Family member phone',
      ),
      '555 0100',
    );

    await user.selectOptions(
      screen.getByLabelText(
        'Marital status',
      ),
      'Married',
    );

    await user.click(
      screen.getByRole('button', {
        name:
          'Save details',
      }),
    );

    expect(
      saveExtendedProfile,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        familyMemberName:
          'Maria',
        familyMemberPhone:
          '555 0100',
        maritalStatus:
          'Married',
      }),
    );

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Personal details saved.',
    );
  });


  it('shows family call link when phone exists', () => {
    getExtendedProfile.mockReturnValue({
      dateOfBirth: '',
      maritalStatus: '',
      gender: '',
      homeAddress: '',
      familyMemberName: 'Maria',
      familyMemberPhone:
        '555 0100',
    });

    render(
      <MemoriesEnhanced />,
    );

    expect(
      screen.getByRole('link', {
        name:
          'Call Family Member',
      }),
    ).toHaveAttribute(
      'href',
      'tel:5550100',
    );
  });

});