import {
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

import AccessibilityControls from '../AccessibilityControls';

import {
  getExtendedProfile,
} from '../../data/profileSupport';


jest.mock('../../data/profileSupport', () => ({
  PROFILE_CHANGED_EVENT: 'careconnect-profile-changed',
  getExtendedProfile: jest.fn(),
}));

jest.mock('../../data/mockData', () => ({
  contacts: [
    {
      id: 'family-1',
      role: 'family',
      name: 'Maria',
      phone: '555 0100',
    },
  ],
}));


function renderControls(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AccessibilityControls />
    </MemoryRouter>,
  );
}


describe('AccessibilityControls', () => {

  beforeEach(() => {
    localStorage.clear();

    delete document.documentElement.dataset.ccFont;
    delete document.documentElement.dataset.ccTheme;

    getExtendedProfile.mockReturnValue({
      familyMemberName: '',
      familyMemberPhone: '',
    });
  });


  it('defaults to normal text size', () => {
    renderControls();

    expect(
      screen.getByRole('button', {
        name: 'Normal text size',
      }),
    ).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    expect(
      document.documentElement.dataset.ccFont,
    ).toBe('normal');
  });


  it('restores saved large text preference', () => {
    localStorage.setItem(
      'careconnect_font_size',
      'large',
    );

    renderControls();

    expect(
      screen.getByRole('button', {
        name: 'Large text size',
      }),
    ).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    expect(
      document.documentElement.dataset.ccFont,
    ).toBe('large');
  });


  it('changes and persists text size', async () => {
    const user = userEvent.setup();

    renderControls();

    await user.click(
      screen.getByRole('button', {
        name: 'Extra large text size',
      }),
    );

    expect(
      document.documentElement.dataset.ccFont,
    ).toBe('xlarge');

    expect(
      localStorage.getItem(
        'careconnect_font_size',
      ),
    ).toBe('xlarge');
  });


  it('defaults to light mode', () => {
    renderControls();

    expect(
      document.documentElement.dataset.ccTheme,
    ).toBe('light');

    expect(
      screen.getByRole('button', {
        name: 'Switch to dark mode',
      }),
    ).toBeInTheDocument();
  });


  it('restores saved dark mode', () => {
    localStorage.setItem(
      'careconnect_theme',
      'dark',
    );

    renderControls();

    expect(
      document.documentElement.dataset.ccTheme,
    ).toBe('dark');

    expect(
      screen.getByRole('button', {
        name: 'Switch to light mode',
      }),
    ).toBeInTheDocument();
  });


  it('toggles and persists theme', async () => {
    const user = userEvent.setup();

    renderControls();

    await user.click(
      screen.getByRole('button', {
        name: 'Switch to dark mode',
      }),
    );

    expect(
      document.documentElement.dataset.ccTheme,
    ).toBe('dark');

    expect(
      localStorage.getItem(
        'careconnect_theme',
      ),
    ).toBe('dark');
  });


  it('does not show quick calls on public pages', () => {
    renderControls('/signin');

    expect(
      screen.queryByText('Quick calls'),
    ).not.toBeInTheDocument();
  });


  it('shows family quick call inside the app', () => {
    renderControls('/app');

    const link = screen.getByRole('link', {
      name: 'Call Maria',
    });

    expect(link).toHaveAttribute(
      'href',
      'tel:5550100',
    );

    expect(
      screen.getByText('Call Family'),
    ).toBeInTheDocument();
  });


  it('uses profile family contact when provided', () => {
    getExtendedProfile.mockReturnValue({
      familyMemberName: 'Angela',
      familyMemberPhone: '555 0200',
    });

    renderControls('/app/messages');

    expect(
      screen.getByRole('link', {
        name: 'Call Angela',
      }),
    ).toHaveAttribute(
      'href',
      'tel:5550200',
    );
  });


  it('has an accessible landmark', () => {
    renderControls();

    expect(
      screen.getByRole('complementary', {
        name:
          'Accessibility, display, and contact options',
      }),
    ).toBeInTheDocument();
  });

});