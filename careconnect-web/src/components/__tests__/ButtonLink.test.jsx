import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it } from "@jest/globals";
import ButtonLink from "../ButtonLink.jsx";
import Icon from "../Icon.jsx";

/**
 * ButtonLink is an action that goes somewhere: "Message care team" opens the
 * new-message form and "Call my caregiver" is a tel: link (D7). The contract is
 * that it IS a link — announced as one, followed by its href — while carrying
 * the classes components.css draws a Button with. The classes are asserted as
 * that wiring only; whether the result looks like a button (no underline, the
 * 52px floor) is measured in Chromium, where it matches the Button it replaces.
 */

/** The markup Icon draws for `name` at the size ButtonLink asks for. */
function glyph(name) {
  const { container, unmount } = render(<Icon name={name} size={20} />);
  const markup = container.innerHTML;
  unmount();
  return markup;
}

describe("ButtonLink", () => {
  it("renders a link with the button classes and href", () => {
    render(<ButtonLink href="#messages/new">Message care team</ButtonLink>);
    const link = screen.getByRole("link", { name: "Message care team" });

    expect(link).toHaveAttribute("href", "#messages/new");
    // Secondary by default: most of these sit beside a page's primary action.
    expect(link.className).toBe("cc-btn cc-btn--secondary");
    // A link drawn as a button, never a button that navigates.
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("takes the primary variant, full width and a className of its own", () => {
    render(
      <ButtonLink href="tel:555-0187" variant="primary" fullWidth className="cc-call">
        Call my caregiver
      </ButtonLink>,
    );

    expect(screen.getByRole("link", { name: "Call my caregiver" }).className).toBe(
      "cc-btn cc-btn--primary cc-btn--full cc-call",
    );
  });

  it("calls by a tel: href and never by a click handler (D7)", () => {
    render(
      <ButtonLink href="tel:555-0187" icon="phone">
        Call my caregiver
      </ButtonLink>,
    );

    expect(screen.getByRole("link", { name: "Call my caregiver" })).toHaveAttribute(
      "href",
      "tel:555-0187",
    );
  });

  it("draws its icon hidden, at the button's size, and leaves the name to its words", () => {
    const expected = glyph("chat");
    render(
      <ButtonLink href="#messages/new" icon="chat">
        Message care team
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Message care team" });
    const svg = link.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.outerHTML).toBe(expected);
    expect(link).toHaveAccessibleName("Message care team");
  });

  it.each([
    ["no icon is asked for", undefined],
    ["the icon set has no such name", "stethoscope"],
  ])("draws no icon when %s", (_case, icon) => {
    render(
      <ButtonLink href="#help" icon={icon}>
        Help
      </ButtonLink>,
    );

    expect(screen.getByRole("link", { name: "Help" }).querySelector("svg")).toBeNull();
  });

  it("passes id, aria-describedby and ref through to the link", () => {
    const ref = createRef();
    render(
      <>
        <ButtonLink href="#messages/new" id="compose" aria-describedby="compose-hint" ref={ref}>
          New message
        </ButtonLink>
        <p id="compose-hint">Opens the new-message form.</p>
      </>,
    );
    const link = screen.getByRole("link", { name: "New message" });

    expect(link).toHaveAttribute("id", "compose");
    expect(link).toHaveAccessibleDescription("Opens the new-message form.");
    expect(ref.current).toBe(link);
  });

  it("is reached by Tab and followed with Enter, like any link", async () => {
    const user = userEvent.setup();
    render(<ButtonLink href="#messages/new">Message care team</ButtonLink>);

    await user.tab();
    expect(screen.getByRole("link", { name: "Message care team" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(window.location.hash).toBe("#messages/new");
  });
});
