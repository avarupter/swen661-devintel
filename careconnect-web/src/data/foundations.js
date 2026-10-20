/**
 * Copy and structure for the foundations sheet.
 *
 * The hex values and the type metrics are deliberately NOT here: the sheet
 * reads them from the live computed styles, so a swatch can never claim a
 * colour the stylesheet no longer uses. Only the token NAME and the role the
 * board assigns to it are editorial, and those live here.
 */

export const COLOR_TOKENS = [
  { token: "--cc-primary", role: "Actions & links", note: "5.75:1 on white" },
  { token: "--cc-brand", role: "Mark & progress fill only", note: "4.51:1 on white — too close to the line for text" },
  { token: "--cc-selected", role: "Active navigation tint", note: "primary on this tint is 5.01:1" },
  { token: "--cc-canvas", role: "Page background" },
  { token: "--cc-surface", role: "Cards & inputs" },
  { token: "--cc-soft", role: "Supporting care surface" },
  { token: "--cc-text", role: "Headings & focus ring", note: "14.63:1 on white" },
  { token: "--cc-muted", role: "Body, input edges, disabled labels", note: "4.76:1 on white" },
  { token: "--cc-border", role: "Decorative edges only", note: "1.27:1 — never bounds a control on its own" },
  { token: "--cc-disabled", role: "Inactive control fill" },
  { token: "--cc-success", role: "Ready & completed", note: "5.31:1 on its own tint" },
  { token: "--cc-error", role: "Errors", note: "5.35:1 on its own tint" },
];

export const TYPE_STEPS = [
  { className: "cc-display", name: "Display", sample: "Good morning, Joyce", note: "reflows to 28px on mobile, never shrinks below it" },
  { className: "cc-time", name: "Time", sample: "9:30 AM" },
  { className: "cc-title", name: "Title", sample: "Next thing to do" },
  { className: "cc-section", name: "Section", sample: "Later today" },
  { className: "cc-body", name: "Body", sample: "Give your care team a short summary.", note: "16px is the floor for all body and control text" },
];

/* Tone mapping follows the board's wording, not a traffic-light reflex:
   "Coming up" is neutral because it is the same badge the next-thing card
   already uses, and only "Missed" is an actual problem. */
export const STATUS_BADGES = [
  { tone: "info", label: "Due now" },
  { tone: "neutral", label: "Coming up" },
  { tone: "success", label: "Taken" },
  { tone: "success", label: "Ready" },
  { tone: "error", label: "Missed" },
];
