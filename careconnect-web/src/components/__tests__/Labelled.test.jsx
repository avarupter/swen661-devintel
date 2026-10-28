import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import Labelled from "../Labelled.jsx";
import { readableTextNodes } from "../../test/a11y.js";

/**
 * Labelled is the R15 pattern every screen builds its named controls with: the
 * words on screen in an aria-hidden span, and the WHOLE accessible name in ONE
 * .cc-sr-only span. These pin that contract inside the controls it is used in,
 * a button and a link, by role and accessible name. readableTextNodes is what
 * tells one span from a split name, which jsdom's accessible name cannot.
 */
describe("Labelled", () => {
  it("names a control \"<label>: <target>\" from one hidden span, the words on screen hidden", () => {
    render(
      <button type="button">
        <Labelled label="I've taken it" target="Atorvastatin 20 mg, 6:00 pm" />
      </button>,
    );
    const button = screen.getByRole("button", {
      name: "I've taken it: Atorvastatin 20 mg, 6:00 pm",
    });
    const [node, ...rest] = readableTextNodes(button);

    expect(rest).toEqual([]);
    expect(node.textContent).toBe("I've taken it: Atorvastatin 20 mg, 6:00 pm");
    expect(node.parentElement).toHaveClass("cc-sr-only");
    expect(screen.getByText("I've taken it")).toHaveAttribute("aria-hidden", "true");
  });

  it("names a control with any other name it is given, and that name wins over a target", () => {
    render(
      <a href="#medications">
        <Labelled label="Meds" name="Meds (Medications)" target="ignored" className="cc-nav__label" />
      </a>,
    );
    const link = screen.getByRole("link", { name: "Meds (Medications)" });
    const shown = screen.getByText("Meds");

    expect(readableTextNodes(link).map((node) => node.textContent)).toEqual([
      "Meds (Medications)",
    ]);
    // The class is for the visible span, the one a component styles.
    expect(shown).toHaveClass("cc-nav__label");
    expect(shown).toHaveAttribute("aria-hidden", "true");
  });

  it.each([
    ["no target and no name", {}],
    ["an empty target", { target: "" }],
    ["a name equal to the label", { name: "Help" }],
  ])("leaves the label as its own name, hiding nothing, given %s", (_case, props) => {
    const { container } = render(
      <a href="#help">
        <Labelled label="Help" {...props} />
      </a>,
    );

    expect(screen.getByRole("link", { name: "Help" })).toBeInTheDocument();
    expect(container.querySelector(".cc-sr-only")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    // Bare text, not wrapped: there is nothing to style without a className.
    expect(screen.getByRole("link").innerHTML).toBe("Help");
  });

  it("wraps a plain label in its className's span, unhidden", () => {
    render(
      <a href="#home">
        <Labelled label="Home" name="Home" className="cc-nav__label" />
      </a>,
    );
    const shown = screen.getByText("Home");

    expect(shown.tagName).toBe("SPAN");
    expect(shown).toHaveClass("cc-nav__label");
    expect(shown).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
