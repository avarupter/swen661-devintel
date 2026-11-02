import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBot from './ChatBot';

// jsdom has no fetch. Each test decides what the Supabase edge function does.
const fetchMock = jest.fn<typeof fetch>();

function reply(body: unknown, ok = true): Promise<Response> {
  return Promise.resolve({ ok, json: async () => body } as Response);
}

const WELCOME = /^Hi! I'm the CareConnect assistant\./;

// The latest assistant message is shown twice: in its chat bubble and in a
// screen-reader-only live region. Text queries target the bubble.
const BUBBLE = { selector: 'div:not([aria-live])' };

beforeEach(() => {
  globalThis.fetch = fetchMock;
  fetchMock.mockReset();
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
});

async function openChat() {
  const user = userEvent.setup();
  render(<ChatBot />);
  await user.click(screen.getByRole('button', { name: 'Need help getting started? Open assistant' }));
  const dialog = screen.getByRole('dialog', { name: 'CareConnect Assistant' });
  const input = within(dialog).getByRole('textbox', {
    name: 'Type your question and press Enter to send',
  });
  return { user, dialog, input };
}

async function ask(question: string) {
  const chat = await openChat();
  await chat.user.type(chat.input, `${question}{Enter}`);
  return chat;
}

function sentHistory(call: number) {
  const [, init] = fetchMock.mock.calls[call];
  return JSON.parse(String(init?.body)).messages;
}

describe('ChatBot launcher', () => {
  test('starts closed', () => {
    render(<ChatBot />);

    const launcher = screen.getByRole('button', { name: 'Need help getting started? Open assistant' });
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('opens the assistant panel it controls, and closes it again', async () => {
    const { user, dialog } = await openChat();

    const launcher = screen.getAllByRole('button', { name: 'Close assistant' })[0];
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    expect(launcher).toHaveAttribute('aria-controls', dialog.id);

    await user.click(launcher);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('takes focus as soon as it renders', () => {
    render(
      <>
        <input aria-label="Search" autoFocus />
        <ChatBot />
      </>,
    );

    // BUG: the open/close focus effect (ChatBot.tsx:129-135) also runs on the
    // first render, when `open` is false, and focuses the launcher. On the
    // Landing page keyboard and screen-reader users start at the floating
    // chat button instead of the top of the page (skip link, heading).
    expect(screen.getByRole('button', { name: /Open assistant/ })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Search' })).not.toHaveFocus();
  });
});

describe('ChatBot panel', () => {
  test('greets the visitor and states its limits', async () => {
    const { dialog } = await openChat();

    expect(within(dialog).getByText(WELCOME, BUBBLE)).toBeInTheDocument();
    expect(within(dialog).getByText(/I cannot give medical advice/)).toBeInTheDocument();
  });

  test('focuses the question field when it opens', async () => {
    const { input } = await openChat();

    expect(input).toHaveFocus();
  });

  test('Escape closes the panel and returns focus to the launcher', async () => {
    const { user } = await openChat();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: /Open assistant/ })).toHaveFocus();
  });

  test('other keys do not close the panel', async () => {
    const { user, dialog } = await openChat();

    await user.keyboard('{ArrowDown}');

    expect(dialog).toBeInTheDocument();
  });

  test('the close button in the panel header closes it', async () => {
    const { user, dialog } = await openChat();

    await user.click(within(dialog).getByRole('button', { name: 'Close assistant' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('Send stays disabled until there is a question', async () => {
    const { user, dialog, input } = await openChat();
    const send = within(dialog).getByRole('button', { name: 'Send message' });

    expect(send).toBeDisabled();
    await user.type(input, '   ');
    expect(send).toBeDisabled();
    await user.type(input, 'Hello');
    expect(send).toBeEnabled();
  });

  test('Enter on an empty field sends nothing', async () => {
    const { user } = await openChat();

    await user.keyboard('{Enter}');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('Shift+Enter does not send', async () => {
    const { user, input } = await openChat();

    await user.type(input, 'Hello{Shift>}{Enter}{/Shift}');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(input).toHaveValue('Hello');
  });
});

describe('asking a question', () => {
  test('posts it to the Supabase edge function and shows the reply', async () => {
    fetchMock.mockReturnValue(reply({ reply: 'CareConnect helps you plan each day.' }));

    const { dialog, input } = await ask('What is CareConnect?');

    expect(within(dialog).getByText('What is CareConnect?')).toBeInTheDocument();
    expect(await within(dialog).findByText('CareConnect helps you plan each day.', BUBBLE)).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://test-project.supabase.co/functions/v1/chat-assistant',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-anon-key',
          Apikey: 'test-anon-key',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'What is CareConnect?' }] }),
      },
    );
  });

  test('the Send button sends too', async () => {
    fetchMock.mockReturnValue(reply({ reply: 'Hello!' }));
    const { user, dialog, input } = await openChat();

    await user.type(input, 'Hi there');
    await user.click(within(dialog).getByRole('button', { name: 'Send message' }));

    expect(await within(dialog).findByText('Hello!', BUBBLE)).toBeInTheDocument();
  });

  test('announces the newest reply through a polite live region', async () => {
    fetchMock.mockReturnValue(reply({ reply: 'Sign up takes two minutes.' }));

    const { dialog } = await ask('How do I join?');

    const live = await within(dialog).findByText('Sign up takes two minutes.', {
      selector: '[aria-live="polite"]',
    });
    expect(live).toHaveAttribute('aria-relevant', 'additions');
  });

  test('sends the earlier conversation, without the welcome message', async () => {
    fetchMock
      .mockReturnValueOnce(reply({ reply: 'First answer' }))
      .mockReturnValueOnce(reply({ reply: 'Second answer' }));
    const { user, dialog, input } = await ask('First question');
    await within(dialog).findByText('First answer', BUBBLE);

    await user.type(input, 'Second question{Enter}');
    await within(dialog).findByText('Second answer', BUBBLE);

    expect(sentHistory(1)).toEqual([
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'First answer' },
      { role: 'user', content: 'Second question' },
    ]);
  });

  test('shows a typing indicator and locks the field while it waits', async () => {
    let answer: (value: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => { answer = resolve; }));

    const { dialog, input } = await ask('Hello');

    expect(within(dialog).getByRole('status', { name: 'Assistant is typing' })).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Send message' })).toBeDisabled();

    answer({ ok: true, json: async () => ({ reply: 'Hi!' }) } as Response);

    expect(await within(dialog).findByText('Hi!', BUBBLE)).toBeInTheDocument();
    expect(within(dialog).queryByRole('status', { name: 'Assistant is typing' })).toBeNull();
    expect(input).toBeEnabled();
  });

  test('scrolls the newest message into view', async () => {
    fetchMock.mockReturnValue(reply({ reply: 'Hi!' }));

    const { dialog } = await ask('Hello');
    await within(dialog).findByText('Hi!', BUBBLE);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    });
  });

  test.each([
    ['the edge function returns an error status', () => reply({}, false)],
    ['the edge function asks for the fallback', () => reply({ useFallback: true, reply: 'ignored' })],
    ['the edge function returns no reply', () => reply({})],
    ['the network request fails', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('falls back to the scripted answers when %s', async (_case, respond) => {
    fetchMock.mockImplementation(respond);

    const { dialog } = await ask('Hello');

    expect(
      await within(dialog).findByText(/^Hello! Great to meet you\./, BUBBLE),
    ).toBeInTheDocument();
  });
});

describe('scripted answers (no assistant API available)', () => {
  test.each([
    ['What dose of my tablets should I take?', /not able to give medical, dosage, or clinical advice/],
    ['Is my data safe?', /^Your privacy matters\./],
    ['Tell me about the app', /^CareConnect is a daily companion app/],
    ['careconnect?', /^CareConnect is a daily companion app/],
    ['Who is it for?', /^CareConnect is for two groups/],
    ['How can I register?', /^To sign up, click/],
    ['I already have an account', /^If you already have an account/],
    ['Is there a reminder?', /^CareConnect has five main areas/],
    ['Is it free?', /^CareConnect is free to use\./],
    ['hello there', /^Hello! Great to meet you\./],
    ['thanks a lot', /^You're very welcome!/],
    ['banana', /^I'm here to help you learn about CareConnect/],
  ])('"%s"', async (question, answer) => {
    const { dialog } = await ask(question);

    expect(await within(dialog).findByText(answer, BUBBLE)).toBeInTheDocument();
  });
});
