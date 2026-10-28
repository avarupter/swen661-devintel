import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import { patientToday } from "../../data/patientToday.js";
import AppointmentCard from "../AppointmentCard.jsx";

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

  it("renders the badge on the neutral tone, with no decorative check mark", () => {
    render(<AppointmentCard data={appointment()} />);

    const badge = screen.getByText("Starting soon");

    // Named the way Button.test.jsx names its variant hooks, and with the same
    // caveat: the claim is that tone="neutral" reached the markup as the hook
    // components.css keys on, not that the chip looks any particular way.
    // Without it, tone="error" on a "Coming up" status would ship green.
    expect(badge).toHaveClass("cc-badge", "cc-badge--neutral");
    // tone="success" would add an aria-hidden check inside the chip; neutral
    // must not, or the badge becomes an icon nobody can read.
    expect(badge.querySelector("svg")).toBeNull();
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

  // Not "and keeps them out of names": neither icon sits inside a named
  // element in this card, so there is no name here for one to leak into.
  // Button.test.jsx pins that where the icon really is inside the control.
  it("hides both of its icons from assistive technology", () => {
    const { container } = render(<AppointmentCard data={appointment()} />);

    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(2);
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
