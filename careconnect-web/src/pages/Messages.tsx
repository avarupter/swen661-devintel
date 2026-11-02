import {
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  CheckCheck,
  Mail,
  MailOpen,
  MessageSquare,
  Send,
} from 'lucide-react';

import {
  getMessages,
  markAllMessagesRead,
  markMessageRead,
  sendPatientMessage,
  type CareMessage,
} from '../data/messagesStore';

function formatMessageTime(
  timestamp: string,
) {
  const date =
    new Date(timestamp);

  return date.toLocaleString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
  );
}

function previewText(
  body: string,
) {
  if (body.length <= 74) {
    return body;
  }

  return `${body.slice(
    0,
    74,
  )}…`;
}

export default function Messages() {
  const [messages, setMessages] =
    useState<CareMessage[]>(
      getMessages,
    );

  const [selectedId, setSelectedId] =
    useState<string | null>(
      () => {
        const initial =
          getMessages();

        return (
          initial.find(
            (message) =>
              message.direction ===
                'incoming' &&
              !message.read,
          )?.id ??
          initial[
            initial.length - 1
          ]?.id ??
          null
        );
      },
    );

  const [reply, setReply] =
    useState('');

  const [
    sentAnnouncement,
    setSentAnnouncement,
  ] = useState('');

  const selected =
    useMemo(
      () =>
        messages.find(
          (message) =>
            message.id ===
            selectedId,
        ) ?? null,
      [
        messages,
        selectedId,
      ],
    );

  const unreadCount =
    messages.filter(
      (message) =>
        message.direction ===
          'incoming' &&
        !message.read,
    ).length;

  function openMessage(
    message: CareMessage,
  ) {
    setSelectedId(
      message.id,
    );

    setSentAnnouncement('');

    if (
      message.direction ===
        'incoming' &&
      !message.read
    ) {
      setMessages(
        markMessageRead(
          message.id,
        ),
      );
    }
  }

  function markAllRead() {
    setMessages(
      markAllMessagesRead(),
    );
  }

  function sendReply(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const text =
      reply.trim();

    if (!text) {
      return;
    }

    const updated =
      sendPatientMessage(
        text,
      );

    const sentMessage =
      updated[
        updated.length - 1
      ];

    setMessages(updated);

    setSelectedId(
      sentMessage.id,
    );

    setReply('');

    setSentAnnouncement(
      'Message sent to your caregiver.',
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">

            <h1 className="text-2xl font-bold text-neutral-800">
              Messages
            </h1>

            {unreadCount > 0 && (
              <span
                className="inline-flex items-center justify-center rounded-full bg-alert-600 text-white text-sm font-bold min-w-[1.75rem] h-7 px-2"
                aria-label={`${unreadCount} unread messages`}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <p className="mt-1 text-neutral-500">
            Read messages and stay
            connected with your
            caregiver.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <CheckCheck
              className="w-5 h-5"
              aria-hidden="true"
            />

            Mark all as read
          </button>
        )}
      </div>

      {/* LIVE CONFIRMATION */}
      <div
        aria-live="polite"
        aria-atomic="true"
      >
        {sentAnnouncement && (
          <div
            role="status"
            className="rounded-xl border-2 border-success-200 bg-success-50 px-4 py-3 text-success-800 font-semibold"
          >
            {sentAnnouncement}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.5fr)]">

        {/* MESSAGE LIST */}
        <section
          aria-labelledby="message-list-heading"
          className="card p-0 overflow-hidden"
        >
          <div className="px-4 py-4 border-b border-neutral-200">
            <h2
              id="message-list-heading"
              className="font-bold text-neutral-800"
            >
              Message history
            </h2>

            <p className="text-sm text-neutral-500 mt-1">
              {unreadCount === 0
                ? 'No unread messages'
                : `${unreadCount} unread ${
                    unreadCount === 1
                      ? 'message'
                      : 'messages'
                  }`}
            </p>
          </div>

          <ul
            className="divide-y divide-neutral-200 list-none p-0 m-0"
            role="list"
          >
            {[...messages]
              .reverse()
              .map(
                (message) => {
                  const unread =
                    message.direction ===
                      'incoming' &&
                    !message.read;

                  const active =
                    selectedId ===
                    message.id;

                  return (
                    <li
                      key={
                        message.id
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openMessage(
                            message,
                          )
                        }
                        className={`w-full text-left p-4 transition-colors ${
                          active
                            ? 'bg-calm-50'
                            : 'bg-white hover:bg-neutral-50'
                        }`}
                        aria-current={
                          active
                            ? 'true'
                            : undefined
                        }
                        aria-label={`${unread ? 'Unread message' : 'Message'} from ${message.sender}: ${previewText(message.body)}`}
                      >
                        <div className="flex items-start gap-3">

                          <span
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              unread
                                ? 'bg-calm-600 text-white'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}
                            aria-hidden="true"
                          >
                            {unread ? (
                              <Mail className="w-5 h-5" />
                            ) : (
                              <MailOpen className="w-5 h-5" />
                            )}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">

                              <span
                                className={`text-sm ${
                                  unread
                                    ? 'font-bold text-neutral-900'
                                    : 'font-semibold text-neutral-700'
                                }`}
                              >
                                {message.sender}
                              </span>

                              {unread && (
                                <span className="inline-flex rounded-full bg-alert-600 text-white text-xs font-bold px-2 py-0.5">
                                  New
                                </span>
                              )}
                            </div>

                            <p
                              className={`mt-1 text-sm leading-snug ${
                                unread
                                  ? 'text-neutral-800 font-medium'
                                  : 'text-neutral-500'
                              }`}
                            >
                              {previewText(
                                message.body,
                              )}
                            </p>

                            <time
                              dateTime={
                                message.timestamp
                              }
                              className="block mt-2 text-xs text-neutral-400"
                            >
                              {formatMessageTime(
                                message.timestamp,
                              )}
                            </time>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                },
              )}
          </ul>
        </section>

        {/* SELECTED MESSAGE + REPLY */}
        <div className="space-y-5">

          <section
            aria-labelledby="message-detail-heading"
            className="card"
          >
            <div className="flex items-start gap-3">

              <span
                className="w-11 h-11 rounded-full bg-calm-100 text-calm-700 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <MessageSquare className="w-6 h-6" />
              </span>

              <div className="flex-1 min-w-0">
                <h2
                  id="message-detail-heading"
                  className="text-lg font-bold text-neutral-800"
                >
                  {selected
                    ? selected.direction ===
                      'incoming'
                      ? `From ${selected.sender}`
                      : `To ${selected.recipient}`
                    : 'Select a message'}
                </h2>

                {selected && (
                  <time
                    dateTime={
                      selected.timestamp
                    }
                    className="text-sm text-neutral-500"
                  >
                    {formatMessageTime(
                      selected.timestamp,
                    )}
                  </time>
                )}
              </div>
            </div>

            {selected ? (
              <p className="mt-5 text-base text-neutral-700 leading-relaxed whitespace-pre-line">
                {selected.body}
              </p>
            ) : (
              <p className="mt-5 text-neutral-500">
                Choose a message from
                the message history.
              </p>
            )}
          </section>

          <section
            aria-labelledby="reply-heading"
            className="card"
          >
            <h2
              id="reply-heading"
              className="text-lg font-bold text-neutral-800"
            >
              Send a message
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Your message will be
              added to this CareConnect
              conversation.
            </p>

            <form
              onSubmit={sendReply}
              className="mt-4 space-y-3"
            >
              <label
                htmlFor="caregiver-message"
                className="block text-sm font-semibold text-neutral-700"
              >
                Message to caregiver
              </label>

              <textarea
                id="caregiver-message"
                rows={5}
                value={reply}
                onChange={(
                  event,
                ) => {
                  setReply(
                    event.target.value,
                  );

                  if (
                    sentAnnouncement
                  ) {
                    setSentAnnouncement(
                      '',
                    );
                  }
                }}
                placeholder="Type your message here..."
                className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-3 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    !reply.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-calm-600 text-white px-5 py-3 font-semibold min-h-[2.75rem] hover:bg-calm-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send
                    className="w-5 h-5"
                    aria-hidden="true"
                  />

                  Send message
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}