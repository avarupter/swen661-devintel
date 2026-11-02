export const MESSAGES_CHANGED_EVENT =
  'careconnect:messages-changed';

const STORAGE_KEY =
  'careconnect_patient_messages';

export interface CareMessage {
  id: string;
  sender: string;
  recipient: string;
  body: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  read: boolean;
}

function seedMessages(): CareMessage[] {
  const now = Date.now();

  return [
    {
      id: 'msg-1',
      sender: 'Caregiver',
      recipient: 'Patient',
      body:
        'Good morning. I added your afternoon appointment to CareConnect so you can find it under Appointments.',
      timestamp: new Date(
        now - 180 * 60 * 1000,
      ).toISOString(),
      direction: 'incoming',
      read: true,
    },
    {
      id: 'msg-2',
      sender: 'Caregiver',
      recipient: 'Patient',
      body:
        'When you have breakfast, remember that you can record what you ate in My Day.',
      timestamp: new Date(
        now - 75 * 60 * 1000,
      ).toISOString(),
      direction: 'incoming',
      read: false,
    },
    {
      id: 'msg-3',
      sender: 'Caregiver',
      recipient: 'Patient',
      body:
        'Just checking in. Send me a message here if you need help finding something in your schedule.',
      timestamp: new Date(
        now - 25 * 60 * 1000,
      ).toISOString(),
      direction: 'incoming',
      read: false,
    },
  ];
}

function notifyChanged() {
  window.dispatchEvent(
    new Event(
      MESSAGES_CHANGED_EVENT,
    ),
  );
}

export function getMessages():
  CareMessage[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      const seeded =
        seedMessages();

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          seeded,
        ),
      );

      return seeded;
    }

    const parsed =
      JSON.parse(
        raw,
      ) as CareMessage[];

    return Array.isArray(parsed)
      ? parsed
      : seedMessages();
  } catch {
    return seedMessages();
  }
}

function saveMessages(
  messages: CareMessage[],
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages),
    );

    notifyChanged();
  } catch {
    // App remains usable if
    // local storage is unavailable.
  }
}

export function getUnreadMessageCount():
  number {
  return getMessages().filter(
    (message) =>
      message.direction ===
        'incoming' &&
      !message.read,
  ).length;
}

export function markMessageRead(
  id: string,
): CareMessage[] {
  const messages =
    getMessages().map(
      (message) =>
        message.id === id &&
        message.direction ===
          'incoming'
          ? {
              ...message,
              read: true,
            }
          : message,
    );

  saveMessages(messages);

  return messages;
}

export function markAllMessagesRead():
  CareMessage[] {
  const messages =
    getMessages().map(
      (message) =>
        message.direction ===
        'incoming'
          ? {
              ...message,
              read: true,
            }
          : message,
    );

  saveMessages(messages);

  return messages;
}

export function sendPatientMessage(
  body: string,
): CareMessage[] {
  const text =
    body.trim();

  if (!text) {
    return getMessages();
  }

  const message: CareMessage = {
    id: `msg-${Date.now()}`,
    sender: 'You',
    recipient: 'Caregiver',
    body: text,
    timestamp:
      new Date().toISOString(),
    direction: 'outgoing',
    read: true,
  };

  const messages = [
    ...getMessages(),
    message,
  ];

  saveMessages(messages);

  return messages;
}