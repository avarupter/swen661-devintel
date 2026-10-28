import { useId, useRef } from "react";
import { flushSync } from "react-dom";
import Badge from "./Badge.jsx";
import Button from "./Button.jsx";
import Card from "./Card.jsx";
import Icon from "./Icon.jsx";

/**
 * A button label with its target: the visible words, then which appointment.
 *
 * The whole name is ONE visually hidden span, "I'm ready: Video call with
 * Maria, 3:00 pm", and the visible words are aria-hidden, rather than the
 * visible words followed by a hidden ": Video call…" span. .cc-sr-only is
 * position: absolute, and Chromium puts a space between text in separate boxes,
 * so the split form is named "I'm ready : Video call…". The name still starts
 * with the visible words (Label in Name). Without a target the label is just
 * the words.
 */
function Labelled({ label, target }) {
  if (!target) return label;
  return (
    <>
      <span aria-hidden="true">{label}</span>
      <span className="cc-sr-only">{`${label}: ${target}`}</span>
    </>
  );
}

/**
 * "Next thing to do" — the appointment recipe.
 *
 * The same markup is used at every breakpoint. How it arranges is the parent's
 * job: the time and the call details stack on mobile and share a row from
 * tablet up, and that is done by a CSS grid on `.cc-appointment__body` rather
 * than by a layout prop. Adding `variant="stacked" | "wide"` here would push a
 * layout decision into a content component and the three pages would start to
 * drift.
 *
 * Without `onReady` this is the Week 10 card: one action that does nothing.
 * With it, the card is live (D3). "I'm ready" calls `onReady`. Once `ready`,
 * the badge reads `data.readyBadge` in the success tone, the same button
 * becomes the aria-disabled `data.readyAction`, so pressing it again does
 * nothing, and a separate `data.undo` button appears beside it. Each button's
 * name ends with `actionTarget` (Labelled, above).
 *
 * Focus is never dropped. "I'm ready" and "Ready" are the same button, so
 * focus stays on it when it changes. Undo disappears once the page has undone
 * the mark, so focus goes back to that button, which then reads "I'm ready".
 *
 * The heading id comes from useId, so two cards on one page stay distinct.
 *
 * @param {{
 *   data: import('../data/patientToday.js').patientToday['next'],
 *   icon?: string,
 *   ready?: boolean,
 *   onReady?: () => void,
 *   onUndo?: () => void,
 *   actionTarget?: string,
 * }} props
 */
export default function AppointmentCard({
  data,
  icon = "video",
  ready = false,
  onReady,
  onUndo,
  actionTarget,
}) {
  const headingId = useId();
  const readyButton = useRef(null);
  const live = Boolean(onReady);
  const isReady = live && ready;

  function undo(event) {
    const pressed = event.currentTarget;
    // Render the undone card now, so we can tell whether Undo is still on the
    // page. If it is gone, focus went with it, so put it on "I'm ready".
    flushSync(() => onUndo?.());
    if (!pressed.isConnected) readyButton.current?.focus();
  }

  return (
    <Card as="section" className="cc-appointment" aria-labelledby={headingId}>
      <header className="cc-appointment__head">
        <h2 className="cc-label" id={headingId}>
          {data.eyebrow}
        </h2>
        {isReady ? (
          <Badge tone="success">{data.readyBadge}</Badge>
        ) : data.badge ? (
          <Badge tone="neutral">{data.badge}</Badge>
        ) : null}
      </header>

      <div className="cc-appointment__body">
        <p className="cc-appointment__when">
          <span className="cc-muted cc-body">{data.kindLabel}</span>
          <span className="cc-time">{data.time}</span>
        </p>

        <div className="cc-appointment__what">
          <p className="cc-appointment__title">
            <Icon name={icon} size={22} />
            <span>{data.title}</span>
          </p>
          <p className="cc-body cc-muted">{data.detail}</p>
        </div>
      </div>

      {/* Both of these are pills and icon rows that CSS paints. Rendered around
          absent copy they leave a bordered blank rather than nothing, so the
          slot goes away with its content — same rule as the later-today chip. */}
      <footer className="cc-appointment__foot">
        {data.readiness ? (
          <p className="cc-appointment__ready">
            <Icon name="check" size={20} />
            <span>{data.readiness}</span>
          </p>
        ) : null}
        {live ? (
          <div className="cc-appointment__actions">
            <Button
              ref={readyButton}
              variant="primary"
              disabled={isReady}
              onClick={() => onReady()}
            >
              <Labelled
                label={isReady ? data.readyAction : data.action}
                target={actionTarget}
              />
            </Button>
            {isReady ? (
              <Button variant="secondary" onClick={undo}>
                <Labelled label={data.undo} target={actionTarget} />
              </Button>
            ) : null}
          </div>
        ) : (
          <Button variant="primary">{data.action}</Button>
        )}
      </footer>
    </Card>
  );
}
