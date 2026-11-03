import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  MESSAGES_CHANGED_EVENT,
  getMessages,
  getUnreadMessageCount,
  markMessageRead,
  markAllMessagesRead,
  sendPatientMessage,
} from '../messagesStore.ts';


describe('messagesStore', () => {

  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });


  it('seeds messages when storage is empty', () => {
    const messages = getMessages();

    expect(messages).toHaveLength(3);

    expect(
      localStorage.getItem(
        'careconnect_patient_messages',
      ),
    ).not.toBeNull();
  });


  it('returns stored messages', () => {
    const stored = [
      {
        id: 'custom',
        sender: 'Caregiver',
        recipient: 'Patient',
        body: 'Hello',
        timestamp: new Date().toISOString(),
        direction: 'incoming',
        read: false,
      },
    ];

    localStorage.setItem(
      'careconnect_patient_messages',
      JSON.stringify(stored),
    );

    expect(getMessages()).toEqual(stored);
  });


  it('returns seeded messages for non-array data', () => {
    localStorage.setItem(
      'careconnect_patient_messages',
      JSON.stringify({
        invalid: true,
      }),
    );

    expect(getMessages()).toHaveLength(3);
  });


  it('returns seeded messages for malformed JSON', () => {
    localStorage.setItem(
      'careconnect_patient_messages',
      '{broken',
    );

    expect(getMessages()).toHaveLength(3);
  });


  it('counts unread incoming messages', () => {
    expect(
      getUnreadMessageCount(),
    ).toBe(2);
  });


  it('marks one incoming message read', () => {
    const result = markMessageRead('msg-2');

    const message = result.find(
      (item) => item.id === 'msg-2',
    );

    expect(message.read).toBe(true);

    expect(
      getUnreadMessageCount(),
    ).toBe(1);
  });


  it('does not alter an unrelated message', () => {
    const before = getMessages();

    const result =
      markMessageRead('does-not-exist');

    expect(result).toEqual(before);
  });


  it('marks all incoming messages read', () => {
    const result = markAllMessagesRead();

    const unreadIncoming = result.filter(
      (message) =>
        message.direction === 'incoming' &&
        !message.read,
    );

    expect(unreadIncoming).toHaveLength(0);
  });


  it('sends a trimmed patient message', () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(123456);

    const result =
      sendPatientMessage(
        '   I need help   ',
      );

    const last =
      result[result.length - 1];

    expect(last).toEqual(
      expect.objectContaining({
        id: 'msg-123456',
        sender: 'You',
        recipient: 'Caregiver',
        body: 'I need help',
        direction: 'outgoing',
        read: true,
      }),
    );
  });


  it('does not send an empty message', () => {
    const before = getMessages();

    const after =
      sendPatientMessage('    ');

    expect(after).toEqual(before);
  });


  it('dispatches the messages changed event after save', () => {
    const listener = jest.fn();

    window.addEventListener(
      MESSAGES_CHANGED_EVENT,
      listener,
    );

    sendPatientMessage('Hello');

    expect(listener).toHaveBeenCalled();

    window.removeEventListener(
      MESSAGES_CHANGED_EVENT,
      listener,
    );
  });


  it('remains usable if localStorage save throws', () => {
    const spy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage unavailable');
      });

    expect(() =>
      sendPatientMessage('Hello'),
    ).not.toThrow();

    spy.mockRestore();
  });

});