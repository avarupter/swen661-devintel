/**
 * What each destination should show. The strings are the app's own (src/data),
 * repeated here on purpose: an end-to-end test states what a user sees, so a
 * changed heading should fail it rather than silently follow the data.
 */
export const DESTINATIONS = [
  { id: "home", hash: "#home", h1: "Good morning, Joyce", title: "Patient Today · CareConnect", full: "Home", bar: "Home" },
  { id: "medications", hash: "#medications", h1: "Your medicines, Joyce", title: "Medications · CareConnect", full: "Medications", bar: "Meds (Medications)" },
  { id: "appointments", hash: "#appointments", h1: "Your appointments, Joyce", title: "Appointments · CareConnect", full: "Appointments", bar: "Visits (Appointments)" },
  { id: "messages", hash: "#messages", h1: "Messages", title: "Messages · CareConnect", full: "Messages, 2 unread", bar: "Inbox (Messages), 2 unread" },
  { id: "help", hash: "#help", h1: "Help", title: "Help · CareConnect", full: "Help", bar: "Help" },
];

export const SHEET = { hash: "#specimens", h1: "Foundations & component states", title: "Design system · CareConnect" };

export const STORAGE_BANNER =
  "Changes can't be saved on this device. Anything you mark or send will be gone when you close this page.";

/** Below 768px the bottom bar is the visible navigation, and it uses short labels. */
export function tabName(destination, page) {
  const width = page.viewportSize().width;
  return width < 768 ? destination.bar : destination.full;
}

/** The one navigation landmark a user can see at this width (the other two are display:none). */
export function mainNav(page) {
  return page.getByRole("navigation", { name: "Main" });
}

export function heading(page) {
  return page.getByRole("heading", { level: 1 });
}
