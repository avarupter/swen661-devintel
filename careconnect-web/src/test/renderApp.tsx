/**
 * Renders the real <App /> — BrowserRouter, every route, every guard — at a
 * URL, signed in (or not) through the app's mock auth:
 *
 *   const { user } = renderApp({ route: '/app', role: 'caregiver' });
 *   expect(window.location.pathname).toBe('/app');
 *
 * Kept apart from test-utils.tsx so that component tests do not load every
 * page of the app.
 */
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import type { Options as UserEventOptions, UserEvent } from '@testing-library/user-event';
import App from '../App';
import type { MockUser } from '../auth/mockAuth';
import { seedSession, setupUser } from './test-utils';
import type { SessionOptions } from './test-utils';

export interface RenderAppOptions extends SessionOptions {
  /** URL to open (path, query and hash). Default '/'. */
  route?: string;
  userEventOptions?: UserEventOptions;
}

export interface RenderAppResult extends RenderResult {
  user: UserEvent;
  account: MockUser | null;
}

export function renderApp({
  route = '/',
  userEventOptions,
  ...session
}: RenderAppOptions = {}): RenderAppResult {
  const account = seedSession(session);
  // BrowserRouter reads the URL from window.location when it mounts.
  window.history.pushState(null, '', route);
  const user = setupUser(userEventOptions);
  return { ...render(<App />), user, account };
}
