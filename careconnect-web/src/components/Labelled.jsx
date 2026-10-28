/**
 * A label whose accessible name says more than the words on screen: the R15
 * pattern (P1), for every control in the app whose name differs from its
 * visible text.
 *
 * The visible text goes in an aria-hidden span, and the WHOLE accessible name
 * in ONE visually hidden `.cc-sr-only` span. It is never the visible words
 * followed by a hidden suffix: .cc-sr-only is position: absolute, and Chromium
 * puts a space between text in separate boxes, so the split form is named
 * "I'm ready : Video call…", which breaks exact names and reads badly. The name
 * must start with the visible text (WCAG 2.5.3 Label in Name), so a
 * voice-control user can say what they see.
 *
 * - `target` gives the usual name, "<label>: <target>": "I'm ready: Video call
 *   with Maria, 3:00 pm", "I've taken it: Atorvastatin 20 mg, 6:00 pm". Use it
 *   for every action that names what it acts on, so they all read alike.
 * - `name` gives any other name: the mobile bar's "Meds (Medications)", or
 *   "Messages, 2 unread". It wins over `target`.
 * - With neither, or a name equal to the label, the label is its own name and
 *   nothing is hidden.
 *
 * `className` goes on the visible span, so a component can style its label
 * (Nav's `cc-nav__label`). Without one, a plain label renders as bare text.
 *
 * In jsdom the name is the same either way; the split form's stray space shows
 * only in a browser. src/test/a11y.js `readableTextNodes` is the unit-test
 * check that a name is one piece of text.
 *
 * @param {{
 *   label: string,
 *   target?: string,
 *   name?: string,
 *   className?: string,
 * }} props
 */
export default function Labelled({ label, target, name, className }) {
  const whole = name ?? (target ? `${label}: ${target}` : label);

  if (whole === label) {
    return className ? <span className={className}>{label}</span> : label;
  }
  return (
    <>
      <span className={className} aria-hidden="true">
        {label}
      </span>
      <span className="cc-sr-only">{whole}</span>
    </>
  );
}
