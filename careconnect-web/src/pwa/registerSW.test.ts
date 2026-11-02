import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { registerServiceWorker } from './registerSW';
import { setViteEnv } from '../test/viteEnv';

type Register = (url: string) => Promise<unknown>;

/** jsdom has no service-worker API; give navigator a fake one. */
function provideServiceWorker(register: Register = async () => ({})) {
  const registerMock = jest.fn(register);
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register: registerMock },
  });
  return registerMock;
}

function pageLoads() {
  window.dispatchEvent(new Event('load'));
}

// registerServiceWorker adds a window "load" listener it never removes. All
// tests share one window, so track those listeners and drop them after each
// test — otherwise a later test's load event would run an earlier test's
// listener.
let loadListeners: EventListenerOrEventListenerObject[] = [];

beforeEach(() => {
  const addEventListener = window.addEventListener.bind(window);
  jest.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
    if (type === 'load' && listener) loadListeners.push(listener);
    addEventListener(type, listener, options);
  });
});

afterEach(() => {
  for (const listener of loadListeners) window.removeEventListener('load', listener);
  loadListeners = [];
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
});

describe('registerServiceWorker', () => {
  test('in a production build, registers /sw.js once the page has loaded', () => {
    setViteEnv({ PROD: true });
    const register = provideServiceWorker();

    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
    pageLoads();

    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  test('does nothing in development builds', () => {
    setViteEnv({ PROD: false });
    const register = provideServiceWorker();

    registerServiceWorker();
    pageLoads();

    expect(loadListeners).toEqual([]);
    expect(register).not.toHaveBeenCalled();
  });

  test('does nothing in browsers without service workers', () => {
    setViteEnv({ PROD: true });

    registerServiceWorker();

    expect('serviceWorker' in navigator).toBe(false);
    expect(loadListeners).toEqual([]);
  });

  test('a failed registration is logged, not thrown — the app still works online', async () => {
    setViteEnv({ PROD: true });
    const failure = new Error('SecurityError');
    provideServiceWorker(() => Promise.reject(failure));
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});

    registerServiceWorker();
    pageLoads();
    await Promise.resolve();
    await Promise.resolve();

    expect(logError).toHaveBeenCalledWith('Service worker registration failed:', failure);
  });
});
