import { describe, test, expect, jest, afterEach } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstallPrompt from './InstallPrompt';
import { mockMatchMedia } from '../test/browserMocks';

const DISMISS_KEY = 'careconnect_install_dismissed_until';
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

/** Fires Chromium's beforeinstallprompt the way the browser does. */
function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  const prompt = jest.fn(async () => {});
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  act(() => {
    window.dispatchEvent(event);
  });
  return { event, prompt };
}

function banner() {
  return screen.queryByRole('region', { name: 'Install CareConnect' });
}

function snoozedUntil() {
  return Number(localStorage.getItem(DISMISS_KEY));
}

afterEach(() => {
  delete (navigator as { standalone?: boolean }).standalone;
});

describe('InstallPrompt', () => {
  test('stays hidden until the browser offers installation', () => {
    render(<InstallPrompt />);

    expect(banner()).toBeNull();
  });

  test('shows the install banner in place of the browser mini-infobar', () => {
    render(<InstallPrompt />);

    const { event } = offerInstall();

    expect(event.defaultPrevented).toBe(true);
    expect(banner()).toHaveTextContent(/offline access to today's plan/);
    expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss install prompt' })).toBeInTheDocument();
  });

  test.each(['accepted', 'dismissed'] as const)(
    'Install opens the browser prompt, then hides and snoozes the banner (user %s)',
    async (outcome) => {
      const user = userEvent.setup();
      render(<InstallPrompt />);
      const { prompt } = offerInstall(outcome);
      const before = Date.now();

      await user.click(screen.getByRole('button', { name: 'Install' }));

      expect(prompt).toHaveBeenCalledTimes(1);
      expect(banner()).toBeNull();
      expect(snoozedUntil()).toBeGreaterThanOrEqual(before + FOURTEEN_DAYS);
      expect(snoozedUntil()).toBeLessThanOrEqual(Date.now() + FOURTEEN_DAYS);
    },
  );

  test.each(['Not now', 'Dismiss install prompt'])(
    '"%s" hides the banner for 14 days without prompting',
    async (name) => {
      const user = userEvent.setup();
      render(<InstallPrompt />);
      const { prompt } = offerInstall();
      const before = Date.now();

      await user.click(screen.getByRole('button', { name }));

      expect(prompt).not.toHaveBeenCalled();
      expect(banner()).toBeNull();
      expect(snoozedUntil()).toBeGreaterThanOrEqual(before + FOURTEEN_DAYS);
    },
  );

  test('Escape dismisses it while focus is inside the banner', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    offerInstall();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Install' })).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(banner()).toBeNull();
    expect(snoozedUntil()).toBeGreaterThan(Date.now());
  });

  test('other keys leave it open', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    offerInstall();

    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(banner()).toBeInTheDocument();
  });

  test('hides when the app is installed some other way', () => {
    render(<InstallPrompt />);
    offerInstall();

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(banner()).toBeNull();
  });

  test('never shows when already running as an installed app', () => {
    mockMatchMedia((query) => query === '(display-mode: standalone)');
    render(<InstallPrompt />);

    offerInstall();

    expect(banner()).toBeNull();
  });

  test('never shows inside an iOS home-screen app', () => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
    render(<InstallPrompt />);

    offerInstall();

    expect(banner()).toBeNull();
  });

  test('stays hidden while a dismissal is still snoozed', () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 60_000));
    render(<InstallPrompt />);

    offerInstall();

    expect(banner()).toBeNull();
  });

  test('comes back once the snooze has run out', () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() - 60_000));
    render(<InstallPrompt />);

    offerInstall();

    expect(banner()).toBeInTheDocument();
  });

  test('treats unreadable storage as "not snoozed"', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    render(<InstallPrompt />);

    offerInstall();

    expect(banner()).toBeInTheDocument();
  });

  test('can still be dismissed when storage cannot be written', async () => {
    const user = userEvent.setup();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    render(<InstallPrompt />);
    offerInstall();

    await user.click(screen.getByRole('button', { name: 'Not now' }));

    expect(banner()).toBeNull();
  });

  test('stops listening for install events once unmounted', () => {
    const removeListener = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<InstallPrompt />);

    unmount();

    const removed = removeListener.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(['beforeinstallprompt', 'appinstalled']));
  });
});
