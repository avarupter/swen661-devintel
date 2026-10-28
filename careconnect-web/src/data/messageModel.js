import { DEMO_NOW } from "./demo.js";
import { ERRORS, RECIPIENTS, messagesPage } from "./messages.js";
import { patientToday } from "./patientToday.js";
import { listTime } from "./time.js";

/**
 * Conversations: counts, ordering, the text a list row shows, validation, and
 * the pure updates the store applies. A port of careconnect-electron's
 * inboxModel.ts and composeModel.ts, with one change (D6): a message sent in
 * the demo is stamped with DEMO_NOW, never with the real time of day, so
 * nothing here reads the clock.
 *
 * Updates never change their input: each returns a new array, and the
 * conversations it did not touch are the same objects as before.
 */

// The message time formats live with the other relative-time helpers.
export { listTime, threadTime } from "./time.js";

/** How many conversations are unread. The seed gives 2, the nav badge's number. */
export function unreadCount(conversations) {
  return conversations.filter((conversation) => conversation.unread).length;
}

/** The newest message: messages are kept oldest first and never re-sorted. */
export function latestMessage(conversation) {
  return conversation.messages[conversation.messages.length - 1] ?? null;
}

function latestAt(conversation) {
  return latestMessage(conversation)?.at ?? "";
}

/**
 * A copy of `list`, newest conversation first by its latest message. Times are
 * local "YYYY-MM-DDTHH:MM" strings, which sort as text. Conversations with the
 * same latest time keep their order in `list`; with the frozen demo clock every
 * message sent in the demo shares one time, and the store puts a new
 * conversation first, so it stays first.
 */
export function sortConversations(list) {
  return [...list].sort((a, b) => {
    const x = latestAt(a);
    const y = latestAt(b);
    return x < y ? 1 : x > y ? -1 : 0;
  });
}

/** The latest message on one line, prefixed "You: " when it is the user's own. */
export function conversationPreview(conversation) {
  const latest = latestMessage(conversation);
  if (!latest) return "";
  const text = latest.body.replace(/\s+/g, " ").trim();
  return latest.outgoing ? `${messagesPage.ownPreviewPrefix}${text}` : text;
}

/** A list row's accessible name: "Maria Thompson, Video call on Thursday, Yesterday, unread". */
export function conversationLabel(conversation, now = DEMO_NOW) {
  const latest = latestMessage(conversation);
  const parts = [conversation.with, conversation.subject];
  if (latest) parts.push(listTime(latest.at, now));
  if (conversation.unread) parts.push(messagesPage.unreadSuffix);
  return parts.join(", ");
}

/** "Your care team" -> "your care team", for use mid-sentence. Other names are unchanged. */
export function sentenceName(name) {
  return name.replace(/^Your /, "your ");
}

function isBlank(value) {
  return typeof value !== "string" || value.trim() === "";
}

/**
 * Problems with a new message, in field order (recipient, subject, body), as
 * `[{ field, message }]`; empty when it can be sent. A value of spaces only
 * counts as empty. Lengths need no check: the fields' maxLength stops them.
 */
export function validateCompose({ recipientId, subject, body } = {}) {
  const errors = [];
  if (!RECIPIENTS.some((recipient) => recipient.id === recipientId)) {
    errors.push({ field: "recipient", message: ERRORS.recipient });
  }
  if (isBlank(subject)) errors.push({ field: "subject", message: ERRORS.subject });
  if (isBlank(body)) errors.push({ field: "body", message: ERRORS.body });
  return errors;
}

/** `[]`, or `[{ field: "body", message }]` when the reply is empty or only spaces. */
export function validateReply(body) {
  return isBlank(body) ? [{ field: "body", message: ERRORS.body }] : [];
}

/** `list` with conversation `id` marked read. */
export function markRead(list, id) {
  return list.map((conversation) =>
    conversation.id === id && conversation.unread ? { ...conversation, unread: false } : conversation,
  );
}

/** "<conversation id>-<n>", the seed's pattern, skipping any n already used. */
function nextMessageId(conversation) {
  const used = new Set(conversation.messages.map((message) => message.id));
  let n = conversation.messages.length + 1;
  while (used.has(`${conversation.id}-${n}`)) n += 1;
  return `${conversation.id}-${n}`;
}

function outgoingMessage(id, body, at) {
  return { id, author: patientToday.account.name, at, outgoing: true, body: body.trim() };
}

/** `list` with the user's reply, trimmed, added to the end of conversation `id`. */
export function appendReply(list, id, body, at = DEMO_NOW) {
  return list.map((conversation) =>
    conversation.id === id
      ? {
          ...conversation,
          messages: [...conversation.messages, outgoingMessage(nextMessageId(conversation), body, at)],
        }
      : conversation,
  );
}

/**
 * `list` with a new conversation first. It is read (the user wrote it), and
 * its one message is the user's.
 */
export function startConversation(list, { id, recipient, subject, body, at = DEMO_NOW }) {
  const conversation = {
    id,
    with: recipient.name,
    withDetail: recipient.detail,
    subject: subject.trim(),
    unread: false,
    messages: [outgoingMessage(`${id}-1`, body, at)],
  };
  return [conversation, ...list];
}

/**
 * An id for a new conversation: "c-1", "c-2"… the first not already in `list`.
 * Counted rather than taken from the clock (D6), it can never be "new" (the
 * compose route) and always matches the route grammar ^[a-z0-9][a-z0-9-]*$.
 */
export function nextConversationId(list) {
  const used = new Set(list.map((conversation) => conversation.id));
  let n = 1;
  while (used.has(`c-${n}`)) n += 1;
  return `c-${n}`;
}
