import {
  act,
  fireEvent,
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

import InstallPrompt from '../InstallPrompt.tsx';


function installEvent() {
  const event = new Event(
    'beforeinstallprompt',
  );

  event.preventDefault = jest.fn();

  event.prompt = jest.fn(
    () => Promise.resolve(),
  );

  event.userChoice =
    Promise.resolve({
      outcome: 'accepted',
    });

  return event;
}


describe('InstallPrompt', () => {

  beforeEach(() => {
    localStorage.clear();

    window.matchMedia = jest.fn(
      () => ({
        matches: false,
        media:
          '(display-mode: standalone)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    );
  });


  it('is hidden until browser offers installation', () => {
    render(<InstallPrompt />);

    expect(
      screen.queryByText(
        'Install CareConnect',
      ),
    ).not.toBeInTheDocument();
  });


  it('shows when beforeinstallprompt fires', () => {
    render(<InstallPrompt />);

    act(() => {
      window.dispatchEvent(
        installEvent(),
      );
    });

    expect(
      screen.getByRole('region', {
        name: 'Install CareConnect',
      }),
    ).toBeInTheDocument();
  });


  it('dismisses with Not now and remembers dismissal', async () => {
    const user = userEvent.setup();

    render(<InstallPrompt />);

    act(() => {
      window.dispatchEvent(
        installEvent(),
      );
    });

    await user.click(
      screen.getByRole('button', {
        name: 'Not now',
      }),
    );

    expect(
      screen.queryByText(
        'Install CareConnect',
      ),
    ).not.toBeInTheDocument();

    expect(
      Number(
        localStorage.getItem(
          'careconnect_install_dismissed_until',
        ),
      ),
    ).toBeGreaterThan(
      Date.now(),
    );
  });


  it('dismisses using Escape', () => {
    render(<InstallPrompt />);

    act(() => {
      window.dispatchEvent(
        installEvent(),
      );
    });

    const region =
      screen.getByRole('region', {
        name: 'Install CareConnect',
      });

    fireEvent.keyDown(
      region,
      {
        key: 'Escape',
        code: 'Escape',
      },
    );

    expect(
      screen.queryByRole('region', {
        name: 'Install CareConnect',
      }),
    ).not.toBeInTheDocument();
  });


  it('runs the browser installation prompt', async () => {
    const user = userEvent.setup();
    const event = installEvent();

    render(<InstallPrompt />);

    act(() => {
      window.dispatchEvent(event);
    });

    await user.click(
      screen.getByRole('button', {
        name: 'Install',
      }),
    );

    expect(
      event.prompt,
    ).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByText(
        'Install CareConnect',
      ),
    ).not.toBeInTheDocument();
  });


  it('hides when appinstalled fires', () => {
    render(<InstallPrompt />);

    act(() => {
      window.dispatchEvent(
        installEvent(),
      );
    });

    act(() => {
      window.dispatchEvent(
        new Event('appinstalled'),
      );
    });

    expect(
      screen.queryByText(
        'Install CareConnect',
      ),
    ).not.toBeInTheDocument();
  });


  it('stays hidden when dismissal is still active', () => {
    localStorage.setItem(
      'careconnect_install_dismissed_until',
      String(
        Date.now() + 100000,
      ),
    );

    render(<InstallPrompt />);

    act(() => {
      window.dispatchEvent(
        installEvent(),
      );
    });

    expect(
      screen.queryByText(
        'Install CareConnect',
      ),
    ).not.toBeInTheDocument();
  });

});