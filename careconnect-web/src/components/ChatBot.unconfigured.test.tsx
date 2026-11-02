/**
 * ChatBot built without Supabase settings (no .env — e.g. a CI or Pages build).
 * ChatBot reads import.meta.env once, when the module loads, so the values are
 * changed first and the component is imported afterwards, in beforeAll.
 */
import { beforeAll, test, expect, jest } from '@jest/globals';
import type { ComponentType } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setViteEnv } from '../test/viteEnv';

let ChatBot: ComponentType;

beforeAll(async () => {
  setViteEnv({ VITE_SUPABASE_URL: undefined, VITE_SUPABASE_ANON_KEY: undefined });
  ({ default: ChatBot } = await import('./ChatBot'));
});

test('still answers from the scripted replies, after a request to "undefined/..."', async () => {
  const fetchMock = jest.fn<typeof fetch>(async () => ({ ok: false, json: async () => ({}) }) as Response);
  globalThis.fetch = fetchMock;
  const user = userEvent.setup();
  render(<ChatBot />);

  await user.click(screen.getByRole('button', { name: /Open assistant/ }));
  const dialog = screen.getByRole('dialog', { name: 'CareConnect Assistant' });
  await user.type(within(dialog).getByRole('textbox'), 'Is it free?{Enter}');

  expect(
    await within(dialog).findByText('CareConnect is free to use. There\'s no credit card required and no subscription fee.', {
      selector: 'div:not([aria-live])',
    }),
  ).toBeInTheDocument();

  // BUG: ChatBot.tsx:82-83 interpolates the unset variables, so every message
  // POSTs to the relative URL "undefined/functions/v1/chat-assistant" with
  // "Bearer undefined" (a 404 plus a console error on the deployed site)
  // before falling back. It should skip the request when no URL is configured.
  expect(fetchMock).toHaveBeenCalledWith(
    'undefined/functions/v1/chat-assistant',
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer undefined' }),
    }),
  );
});
