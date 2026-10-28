import { DEMO_NOW, DEMO_TIME } from "../data/demo.js";
import { SEED_DOSE_LOG } from "../data/medications.js";
import { RECIPIENTS, SEED_CONVERSATIONS } from "../data/messages.js";
import {
  appendReply,
  latestMessage,
  markRead,
  nextConversationId,
  startConversation,
  validateCompose,
  validateReply,
} from "../data/messageModel.js";

/**
 * The demo's state: the dose log, the "I'm ready" flags, the conversations and
 * the unsent drafts (D2). It is kept in one localStorage key so a reload, or a
 * second tab, sees what was marked and sent, and so "Reset the demo" has one
 * thing to put back.
 *
 * A module-level external store, read with useSyncExternalStore the same way
 * App reads location.hash:
 * - The snapshot is replaced only when something changes. getSnapshot never
 *   re-reads storage, because a new object on every call is a render loop.
 * - Storage is parsed and validated once, on the first read, and again only
 *   when another tab changes it (a `storage` event). That first read is silent:
 *   it neither writes nor notifies.
 * - Anything unreadable (bad JSON, another version, a shape that looks right
 *   but is not) loads the seed. Storage still works then, so `storageOk` stays
 *   true and the next change overwrites the bad value.
 * - Every write is in try/catch. When storage refuses one (private mode, a full
 *   quota) the change still happens in memory and `storageOk` turns false, so
 *   the shell can say that changes won't be kept. A later write that succeeds
 *   turns it true again, and that write saves the whole state.
 * - An action that would change nothing does nothing: no new snapshot, no
 *   write, no notification. Repeated taps cannot corrupt state, and a page
 *   that announces on change announces once (STML).
 * - Every time it records comes from the demo clock (D6).
 */

/** GitHub Pages serves every repo of an account from one origin, so the key is namespaced. */
export const STORAGE_KEY = "careconnect-web:demo";
export const STORAGE_VERSION = 1;

/** The drafts key for the new-message form; a reply's draft is keyed by its conversation id. */
export const NEW_DRAFT_KEY = "new";

const listeners = new Set();

/** `{ doses, ready, conversations, drafts, storageOk }`, or null until the first read. */
let snapshot = null;

/* ----------------------------------------------------------------- seed --- */

/**
 * A fresh copy of the starting state. The JSON round trip keeps the store from
 * ever sharing, and so ever changing, the exported seed objects.
 */
function seedData() {
  return JSON.parse(
    JSON.stringify({ doses: SEED_DOSE_LOG, ready: {}, conversations: SEED_CONVERSATIONS, drafts: {} }),
  );
}

/* ----------------------------------------------------------- validation --- */

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const STAMP = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
/** The route grammar for a conversation id (D1). "new" is the compose route. */
const CONVERSATION_ID = /^[a-z0-9][a-z0-9-]*$/;

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value) => typeof value === "string";
const isFilled = (value) => isString(value) && value.trim() !== "";
const isUnique = (ids) => new Set(ids).size === ids.length;

function isDoseEntry(entry) {
  if (!isObject(entry)) return false;
  return entry.taken === true ? isString(entry.at) && CLOCK.test(entry.at) : entry.taken === false;
}

function isMessage(message) {
  return (
    isObject(message) &&
    isFilled(message.id) &&
    isFilled(message.author) &&
    isString(message.at) &&
    STAMP.test(message.at) &&
    typeof message.outgoing === "boolean" &&
    isFilled(message.body)
  );
}

function isConversation(conversation) {
  return (
    isObject(conversation) &&
    isString(conversation.id) &&
    CONVERSATION_ID.test(conversation.id) &&
    conversation.id !== NEW_DRAFT_KEY &&
    isFilled(conversation.with) &&
    isString(conversation.withDetail) &&
    isFilled(conversation.subject) &&
    typeof conversation.unread === "boolean" &&
    Array.isArray(conversation.messages) &&
    conversation.messages.length > 0 &&
    conversation.messages.every(isMessage) &&
    isUnique(conversation.messages.map((message) => message.id))
  );
}

/** A draft is a string, or a flat object of strings (the new-message form's fields). */
function isDraft(value) {
  return isString(value) || (isObject(value) && Object.values(value).every(isString));
}

/** True only for a stored value every page can render without a guard. */
function isValidStored(data) {
  return (
    isObject(data) &&
    data.version === STORAGE_VERSION &&
    isObject(data.doses) &&
    Object.values(data.doses).every(isDoseEntry) &&
    isObject(data.ready) &&
    Object.values(data.ready).every((flag) => typeof flag === "boolean") &&
    Array.isArray(data.conversations) &&
    data.conversations.every(isConversation) &&
    isUnique(data.conversations.map((conversation) => conversation.id)) &&
    isObject(data.drafts) &&
    Object.values(data.drafts).every(isDraft)
  );
}

/* -------------------------------------------------------- read and write --- */

/** The stored text, or `ok: false` when storage cannot be read at all. */
function readStorage() {
  try {
    return { raw: window.localStorage.getItem(STORAGE_KEY), ok: true };
  } catch {
    return { raw: null, ok: false };
  }
}

/** The state a stored value describes: the seed when it is absent or unusable. */
function dataFrom(raw) {
  if (raw === null) return seedData();
  try {
    const stored = JSON.parse(raw);
    if (isValidStored(stored)) {
      const { doses, ready, conversations, drafts } = stored;
      return { doses, ready, conversations, drafts };
    }
  } catch {
    // Not JSON: fall through to the seed.
  }
  return seedData();
}

/** The snapshot, loading it on first use. */
function current() {
  if (snapshot === null) {
    const { raw, ok } = readStorage();
    snapshot = { ...dataFrom(raw), storageOk: ok };
  }
  return snapshot;
}

function dataOf(state) {
  return {
    doses: state.doses,
    ready: state.ready,
    conversations: state.conversations,
    drafts: state.drafts,
  };
}

function notify() {
  for (const listener of [...listeners]) listener();
}

/** Saves `data`, makes it the new snapshot and tells every subscriber. */
function commit(data) {
  let storageOk = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...data }));
  } catch {
    storageOk = false;
  }
  snapshot = { ...data, storageOk };
  notify();
}

/** Own properties only: a key such as "constructor" must not find Object.prototype. */
function own(object, key) {
  return Object.hasOwn(object, key) ? object[key] : undefined;
}

function without(object, key) {
  const copy = { ...object };
  delete copy[key];
  return copy;
}

/**
 * Another tab saved (or cleared storage, when `key` is null): adopt its state.
 * `newValue` is what it wrote; storage is read only when the event has none.
 * Nothing loaded yet means nothing to update: the first read will see it.
 */
function onStorage(event) {
  if (snapshot === null) return;
  if (event.key !== null && event.key !== STORAGE_KEY) return;

  const { raw, ok } = isString(event.newValue) ? { raw: event.newValue, ok: true } : readStorage();
  snapshot = { ...dataFrom(raw), storageOk: ok && snapshot.storageOk };
  notify();
}

if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

/* ------------------------------------------------------------ the store --- */

/** Calls `listener` after every change. Returns the function that stops it. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** `{ doses, ready, conversations, drafts, storageOk }`: the same object until something changes. */
export function getSnapshot() {
  return current();
}

/**
 * Logs a dose as taken now, at DEMO_TIME. A dose already taken is left alone,
 * so its first time stands and a second tap changes nothing.
 */
export function markDoseTaken(doseId) {
  const state = current();
  if (own(state.doses, doseId)?.taken === true) return;
  commit({ ...dataOf(state), doses: { ...state.doses, [doseId]: { taken: true, at: DEMO_TIME } } });
}

/** Takes a dose back off the log. A dose that is not taken is left alone. */
export function undoDose(doseId) {
  const state = current();
  if (own(state.doses, doseId)?.taken !== true) return;
  commit({ ...dataOf(state), doses: without(state.doses, doseId) });
}

/** Marks an appointment ready, or not. Setting the value it already has does nothing. */
export function setReady(appointmentId, ready) {
  const state = current();
  if ((own(state.ready, appointmentId) === true) === Boolean(ready)) return;
  commit({
    ...dataOf(state),
    ready: ready ? { ...state.ready, [appointmentId]: true } : without(state.ready, appointmentId),
  });
}

/** Marks a conversation read. Unknown and already-read conversations are left alone. */
export function markConversationRead(id) {
  const state = current();
  if (!state.conversations.some((conversation) => conversation.id === id && conversation.unread)) return;
  commit({ ...dataOf(state), conversations: markRead(state.conversations, id) });
}

/**
 * Adds the user's reply, stamped DEMO_NOW, to the end of conversation `id`, and
 * clears that conversation's draft. Returns the new message, or null (changing
 * nothing) when the conversation is unknown or the reply is blank.
 */
export function sendReply(id, body) {
  const state = current();
  if (!state.conversations.some((conversation) => conversation.id === id)) return null;
  if (validateReply(body).length > 0) return null;

  const conversations = appendReply(state.conversations, id, body, DEMO_NOW);
  commit({ ...dataOf(state), conversations, drafts: without(state.drafts, id) });
  return latestMessage(conversations.find((conversation) => conversation.id === id));
}

/**
 * Starts a conversation, stamped DEMO_NOW, at the top of the list, and clears
 * the new-message draft. Returns `{ id }`, or null (changing nothing) when the
 * fields fail validateCompose.
 */
export function sendNew({ recipientId, subject, body } = {}) {
  const state = current();
  if (validateCompose({ recipientId, subject, body }).length > 0) return null;

  const recipient = RECIPIENTS.find((candidate) => candidate.id === recipientId);
  const id = nextConversationId(state.conversations);
  const conversations = startConversation(state.conversations, { id, recipient, subject, body, at: DEMO_NOW });
  commit({ ...dataOf(state), conversations, drafts: without(state.drafts, NEW_DRAFT_KEY) });
  return { id };
}

/**
 * What a draft should be stored as: the text, a copy of a flat object of
 * strings, null to clear it ("", null, undefined, or an object of empty
 * strings), or undefined for a value that is not a draft at all.
 */
function draftValue(text) {
  if (text === undefined || text === null || text === "") return null;
  if (isString(text)) return text;
  if (isObject(text) && Object.values(text).every(isString)) {
    return Object.values(text).some((value) => value !== "") ? { ...text } : null;
  }
  return undefined;
}

function sameDraft(a, b) {
  if (!isObject(a) || !isObject(b)) return a === b;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

/**
 * Keeps unsent text so nothing typed is lost (STML). `key` is a conversation id
 * for a reply, or NEW_DRAFT_KEY ("new") for the new-message form. `text` is a
 * string, or for a form with several fields a flat object of strings such as
 * `{ recipientId, subject, body }`. Empty text clears the draft. Saving what is
 * already saved does nothing.
 */
export function saveDraft(key, text) {
  if (!isFilled(key)) return;
  const value = draftValue(text);
  if (value === undefined) return;

  const state = current();
  const saved = own(state.drafts, key);
  if (value === null ? saved === undefined : sameDraft(saved, value)) return;

  commit({
    ...dataOf(state),
    drafts: value === null ? without(state.drafts, key) : { ...state.drafts, [key]: value },
  });
}

/** Puts back the whole demo (D2): the seed doses, no ready flags, the four conversations, no drafts. */
export function resetDemo() {
  commit(seedData());
}

/**
 * Test isolation: forget the loaded state and every subscriber, so the next
 * read loads from storage again. src/test/setup.js calls it after each test,
 * after clearing localStorage, so no test sees another's marks.
 */
export function __resetDemoStoreForTests() {
  snapshot = null;
  listeners.clear();
}
