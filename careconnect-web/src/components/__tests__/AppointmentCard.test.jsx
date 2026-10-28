import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { patientToday } from "../../data/patientToday.js";
import AppointmentCard from "../AppointmentCard.jsx";
import Icon from "../Icon.jsx";
import { readableTextNodes } from "../../test/a11y.js";

/**
 * The fixture deliberately uses copy that appears nowhere in
 * data/patientToday.js. A test that renders the same literal the component
 * reads would still pass if the component rendered the wrong field, so the
 * mapping is checked against copy only the test knows, and the real object is
 * used exactly once at the bottom — to catch a shape mismatch, not the mapping.
 *
 * What is NOT here, because jsdom cannot see it: how the time and the call
 * details arrange at each breakpoint (a CSS grid on .cc-appointment__body),
 * target heights and contrast. Those are measured in Chromium by the
 * verification script described in README.md, and asserting a class name here
 * instead would pass with the stylesheet deleted.
 */
const appointment = () => ({
  eyebrow: "Up next",
  badge: "Starting soon",
  kindLabel: "Home visit",
  time: "11:15 am",
  title: "Nurse visit with Ade",
  detail: "She is bringing your new blood pressure cuff",
  readiness: "Nothing to prepare",
  action: "I am ready",
});

describe("AppointmentCard", () => {
  it("names the card with its own heading, so it is a labelled region", () => {
    render(<AppointmentCard data={appointment()} />);

    const heading = screen.getByRole("heading", { level: 2, name: "Up next" });
    const region = screen.getByRole("region", { name: "Up next" });

    expect(heading.id).toBeTruthy();
    expect(region).toHaveAttribute("aria-labelledby", heading.id);
    expect(region).toContainElement(heading);
  });

  it("renders the badge beside the heading, not inside its name", () => {
    render(<AppointmentCard data={appointment()} />);

    const badge = screen.getByText("Starting soon");
    const heading = screen.getByRole("heading", { level: 2 });

    expect(badge).toBeInTheDocument();
    expect(heading).toHaveAccessibleName("Up next");
    // Not a second name assertion on the region: getByRole already filters on
    // that name, so it would throw before the matcher ran and could never go
    // red. This can — a badge moved inside the heading fails here even if it
    // were hidden from the name with aria-hidden.
    expect(heading).not.toContainElement(badge);
  });

  it("renders the badge on the neutral tone, with its glyph hidden", () => {
    render(<AppointmentCard data={appointment()} />);

    const badge = screen.getByText("Starting soon");

    // Named the way Button.test.jsx names its variant hooks, and with the same
    // caveat: the claim is that tone="neutral" reached the markup as the hook
    // components.css keys on, not that the chip looks any particular way.
    // Without it, tone="error" on a "Coming up" status would ship green.
    expect(badge).toHaveClass("cc-badge", "cc-badge--neutral");
    // Every tone draws a glyph of its own (D9). It must stay aria-hidden, or
    // the badge is announced as an icon plus its word.
    expect(badge.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders what kind of thing it is, and when", () => {
    render(<AppointmentCard data={appointment()} />);

    expect(screen.getByText("Home visit")).toBeInTheDocument();
    expect(screen.getByText("11:15 am")).toBeInTheDocument();
  });

  it("renders the title and the detail", () => {
    render(<AppointmentCard data={appointment()} />);

    expect(screen.getByText("Nurse visit with Ade")).toBeInTheDocument();
    expect(
      screen.getByText("She is bringing your new blood pressure cuff"),
    ).toBeInTheDocument();
  });

  it("renders the readiness line as text, grouped with the action", () => {
    const { container } = render(<AppointmentCard data={appointment()} />);

    const foot = container.querySelector(".cc-appointment__foot");

    expect(screen.getByText("Nothing to prepare")).toBeInTheDocument();
    // Grouping, not arrangement. This is the element the stylesheet turns into
    // a space-between row from tablet up; that it IS a row at 768 is measured
    // in Chromium by the Playwright sweep. All jsdom can show is that both the
    // readiness line and the action land inside it, which is what breaks if
    // the readiness <p> is lifted out of the footer.
    expect(foot).toContainElement(screen.getByText("Nothing to prepare"));
    expect(foot).toContainElement(screen.getByRole("button"));
  });

  it("renders the action as the card's one native, enabled button", () => {
    render(<AppointmentCard data={appointment()} />);

    const button = screen.getByRole("button", { name: "I am ready" });

    expect(screen.getAllByRole("button")).toHaveLength(1);
    // type="button" so the card cannot submit a form it is dropped into.
    expect(button).toHaveAttribute("type", "button");
    // The card's one action is always live. Button marks a disabled control
    // with aria-disabled (and detaches the handler with it), so both the
    // native attribute and the ARIA state have to be absent here; passing
    // `disabled` down from this card is what either of these catches.
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-disabled");
  });

  it("renders each field exactly once, in reading order", () => {
    const data = appointment();
    const { container } = render(<AppointmentCard data={data} />);

    // The card is the content-parity unit: all three layouts render this one
    // DOM order, so the order here is the order a screen reader reads at every
    // width. Any field dropped, duplicated, reordered or hard-coded fails.
    expect(container.textContent).toBe(
      [
        data.eyebrow,
        data.badge,
        data.kindLabel,
        data.time,
        data.title,
        data.detail,
        data.readiness,
        data.action,
      ].join(""),
    );
  });

  // Not "and keeps them out of names": no icon sits inside a named element in
  // this card, so there is no name here for one to leak into.
  // Button.test.jsx pins that where the icon really is inside the control.
  it("hides all three of its icons, the badge's glyph included, from assistive technology", () => {
    const { container } = render(<AppointmentCard data={appointment()} />);

    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(3);
    for (const icon of icons) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
    }
  });

  // "in the markup", as Button.test.jsx says it: no code path here can cut a
  // string, and jsdom loads no stylesheet (jest.config.js stubs every .css
  // import), so whether the rendered line clips is invisible to this layer.
  // The clipping check itself belongs in the Playwright sweep.
  it("renders a long title in full rather than truncating it in the markup", () => {
    const title =
      "Video call with Maria, your daughter, who is calling from Lagos this afternoon and has asked to speak about the new prescription";
    render(<AppointmentCard data={{ ...appointment(), title }} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("still renders the action when the optional copy is absent, and leaks no placeholder", () => {
    const { container } = render(
      <AppointmentCard data={{ eyebrow: "Up next", action: "I am ready" }} />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Up next" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I am ready" })).toBeInTheDocument();
    expect(container.textContent).toBe("Up nextI am ready");
    expect(container.textContent).not.toMatch(/undefined|null|NaN/);
    // Element-level, because textContent cannot see an empty slot: the badge
    // and the readiness line are pills CSS paints, so rendering either around
    // absent copy leaves a bordered blank that reads as nothing at all.
    expect(container.querySelector(".cc-badge")).toBeNull();
    expect(container.querySelector(".cc-appointment__ready")).toBeNull();
  });

  it("renders the real patientToday.next, catching a shape mismatch", () => {
    const next = patientToday.next;
    render(<AppointmentCard data={next} />);

    expect(
      screen.getByRole("region", { name: next.eyebrow }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: next.eyebrow }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: next.action }),
    ).toBeInTheDocument();

    for (const copy of [
      next.badge,
      next.kindLabel,
      next.time,
      next.title,
      next.detail,
      next.readiness,
    ]) {
      expect(screen.getByText(copy)).toBeInTheDocument();
    }
  });
});

/* ------------------------------------------------------------ live mode --- */

/** The live copy, again in words only this test uses, so the mapping is checked. */
const live = () => ({
  ...appointment(),
  readyBadge: "All set",
  readyAction: "Set",
  undo: "Undo that",
});

const TARGET = "Nurse visit with Ade, 11:15 am";

/**
 * A page's worth of state around the card: onReady and onUndo set `ready`,
 * as the demo store does on Patient Today and Appointments.
 */
function LiveCard({ data = live(), actionTarget = TARGET, onReady = () => {}, onUndo = () => {} }) {
  const [ready, setReady] = useState(false);
  return (
    <AppointmentCard
      data={data}
      ready={ready}
      onReady={() => {
        onReady();
        setReady(true);
      }}
      onUndo={() => {
        onUndo();
        setReady(false);
      }}
      actionTarget={actionTarget}
    />
  );
}

/** The markup Icon draws for `name` at `size`. */
function glyph(name, size) {
  const { container, unmount } = render(<Icon name={name} size={size} />);
  const markup = container.innerHTML;
  unmount();
  return markup;
}

describe("AppointmentCard — live mode, with the real copy", () => {
  const next = patientToday.next;
  const target = "Video call with Maria, 3:00 pm";

  it("names its action \"I'm ready: Video call with Maria, 3:00 pm\"", () => {
    render(<AppointmentCard data={next} onReady={() => {}} actionTarget={target} />);

    expect(
      screen.getByRole("button", { name: "I'm ready: Video call with Maria, 3:00 pm" }),
    ).not.toHaveAttribute("aria-disabled");
  });

  it("calls onReady once, with nothing passed to it", async () => {
    const onReady = jest.fn();
    const user = userEvent.setup();
    render(<AppointmentCard data={next} onReady={onReady} actionTarget={target} />);

    await user.click(screen.getByRole("button", { name: `I'm ready: ${target}` }));

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledWith();
  });

  it("when ready, shows an aria-disabled \"Ready: …\" and an \"Undo — I'm not ready: …\"", () => {
    render(
      <AppointmentCard data={next} ready onReady={() => {}} onUndo={() => {}} actionTarget={target} />,
    );

    expect(screen.getByRole("button", { name: `Ready: ${target}` })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      screen.getByRole("button", { name: `Undo — I'm not ready: ${target}` }),
    ).not.toHaveAttribute("aria-disabled");
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});

describe("AppointmentCard — live mode (D3)", () => {
  it("names each button with one visually hidden span, and hides the words on screen (R9)", async () => {
    const user = userEvent.setup();
    render(<LiveCard />);
    const ready = screen.getByRole("button", { name: `I am ready: ${TARGET}` });

    // The whole name is one text node, in the one visually hidden span...
    const [node, ...rest] = readableTextNodes(ready);
    expect(rest).toEqual([]);
    expect(node.textContent).toBe(`I am ready: ${TARGET}`);
    expect(node.parentElement).toHaveClass("cc-sr-only");
    // ...and the words on screen start it (Label in Name) but are hidden, so
    // they are not read a second time.
    const shown = within(ready).getByText("I am ready");
    expect(shown).toHaveAttribute("aria-hidden", "true");

    await user.click(ready);

    for (const button of screen.getAllByRole("button")) {
      expect(readableTextNodes(button)).toHaveLength(1);
    }
  });

  it("turns I'm ready into the aria-disabled Ready, with Undo beside it, and the success badge", async () => {
    const user = userEvent.setup();
    render(<LiveCard />);

    await user.click(screen.getByRole("button", { name: `I am ready: ${TARGET}` }));

    expect(screen.getByRole("button", { name: `Set: ${TARGET}` })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: `Undo that: ${TARGET}` })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `I am ready: ${TARGET}` })).toBeNull();

    // The status changes in words, tone and glyph, and the region keeps its name.
    const badge = screen.getByText("All set");
    expect(badge).toHaveClass("cc-badge", "cc-badge--success");
    expect(badge.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText("Starting soon")).toBeNull();
    expect(screen.getByRole("region", { name: "Up next" })).toBeInTheDocument();
  });

  it("keeps focus on the same button as it becomes Ready, and repeated presses change nothing (STML 4)", async () => {
    const onReady = jest.fn();
    const user = userEvent.setup();
    render(<LiveCard onReady={onReady} />);
    const button = screen.getByRole("button", { name: `I am ready: ${TARGET}` });

    await user.click(button);
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleName(`Set: ${TARGET}`);

    await user.click(button);
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: `Undo that: ${TARGET}` })).toHaveLength(1);
  });

  it("Undo calls onUndo once and puts focus back on the button, which reads I'm ready again", async () => {
    const onUndo = jest.fn();
    const user = userEvent.setup();
    render(<LiveCard onUndo={onUndo} />);
    const button = screen.getByRole("button", { name: `I am ready: ${TARGET}` });
    await user.click(button);

    // From the keyboard: Tab from Ready to Undo, then Enter.
    await user.tab();
    expect(screen.getByRole("button", { name: `Undo that: ${TARGET}` })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onUndo).toHaveBeenCalledWith();
    expect(screen.queryByRole("button", { name: `Undo that: ${TARGET}` })).toBeNull();
    // Undo took focus with it; it lands on the one button left, not on <body>.
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleName(`I am ready: ${TARGET}`);
    expect(button).not.toHaveAttribute("aria-disabled");
    expect(screen.getByText("Starting soon")).toHaveClass("cc-badge--neutral");
  });

  it("leaves focus on Undo when the page keeps the card ready", async () => {
    const onUndo = jest.fn();
    const user = userEvent.setup();
    render(
      <AppointmentCard data={live()} ready onReady={() => {}} onUndo={onUndo} actionTarget={TARGET} />,
    );
    const undo = screen.getByRole("button", { name: `Undo that: ${TARGET}` });

    await user.click(undo);

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(undo).toHaveFocus();
  });

  it("changes nothing, and throws nothing, when Undo has no handler or removes the card", async () => {
    const onError = jest.fn();
    const user = userEvent.setup();
    function RemovedOnUndo() {
      const [shown, setShown] = useState(true);
      return shown ? (
        <AppointmentCard
          data={live()}
          ready
          onReady={() => {}}
          onUndo={() => setShown(false)}
          actionTarget={TARGET}
        />
      ) : (
        <p>The card is gone.</p>
      );
    }
    window.addEventListener("error", onError);
    try {
      const { unmount } = render(
        <AppointmentCard data={live()} ready onReady={() => {}} actionTarget={TARGET} />,
      );
      await user.click(screen.getByRole("button", { name: `Undo that: ${TARGET}` }));
      expect(screen.getByRole("button", { name: `Set: ${TARGET}` })).toBeInTheDocument();
      unmount();

      render(<RemovedOnUndo />);
      await user.click(screen.getByRole("button", { name: `Undo that: ${TARGET}` }));
      expect(screen.getByText("The card is gone.")).toBeInTheDocument();
    } finally {
      window.removeEventListener("error", onError);
    }

    expect(onError).not.toHaveBeenCalled();
  });

  it("names the buttons with their words alone when there is no actionTarget", () => {
    render(<AppointmentCard data={live()} ready onReady={() => {}} onUndo={() => {}} />);
    const ready = screen.getByRole("button", { name: "Set" });

    expect(screen.getByRole("button", { name: "Undo that" })).toBeInTheDocument();
    // The words are the name, read straight from the visible text: no hidden copy.
    const [node, ...rest] = readableTextNodes(ready);
    expect(rest).toEqual([]);
    expect(node.parentElement).not.toHaveClass("cc-sr-only");
    expect(ready.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it("stays the Week 10 static card without onReady, whatever ready says", () => {
    render(<AppointmentCard data={live()} ready actionTarget={TARGET} />);
    const button = screen.getByRole("button", { name: "I am ready" });

    expect(screen.getAllByRole("button")).toEqual([button]);
    expect(button).not.toHaveAttribute("aria-disabled");
    expect(screen.getByText("Starting soon")).toHaveClass("cc-badge--neutral");
    expect(screen.queryByText("All set")).toBeNull();
  });
});

describe("AppointmentCard — icon and heading id", () => {
  it("draws the icon it is given beside the title, the video call by default", () => {
    const video = glyph("video", 22);
    const calendar = glyph("calendar", 22);
    const { rerender } = render(<AppointmentCard data={appointment()} />);
    const titleIcon = () => screen.getByText("Nurse visit with Ade").previousElementSibling;

    expect(titleIcon().outerHTML).toBe(video);

    rerender(<AppointmentCard data={appointment()} icon="calendar" />);
    expect(titleIcon().outerHTML).toBe(calendar);
  });

  it("gives two cards on one page different heading ids, each naming its own region", () => {
    render(
      <>
        <AppointmentCard data={{ ...appointment(), eyebrow: "Next appointment" }} />
        <AppointmentCard data={{ ...appointment(), eyebrow: "Next thing to do" }} />
      </>,
    );
    const first = screen.getByRole("heading", { level: 2, name: "Next appointment" });
    const second = screen.getByRole("heading", { level: 2, name: "Next thing to do" });

    expect(first.id).toBeTruthy();
    expect(second.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole("region", { name: "Next appointment" })).toContainElement(first);
    expect(screen.getByRole("region", { name: "Next thing to do" })).toContainElement(second);
  });
});
