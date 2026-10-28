import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "./demoStore.js";

/**
 * The demo's state for a component: `{ doses, ready, conversations, drafts,
 * storageOk }`. The component re-renders whenever it changes, whether the
 * change was made on this page, on another screen, or in another tab.
 *
 * No getServerSnapshot: the app mounts with createRoot and never hydrates (see
 * the note in App.jsx).
 */
export function useDemoStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export default useDemoStore;
