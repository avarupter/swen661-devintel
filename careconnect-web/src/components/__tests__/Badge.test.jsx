import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import Badge from "../Badge.jsx";
import Icon from "../Icon.jsx";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>Coming up</Badge>);
    expect(screen.getByText("Coming up")).toBeInTheDocument();
  });

  it("announces only the word on a success tone, never the check mark", () => {
    const { container } = render(<Badge tone="success">Taken</Badge>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.textContent).toBe("Taken");
  });
});

/** The markup Icon draws for `name` at the badge's size. */
function glyph(name) {
  const { container, unmount } = render(<Icon name={name} size={18} />);
  const markup = container.innerHTML;
  unmount();
  return markup;
}

/**
 * D9: status is never colour alone (STML), so every tone draws a glyph of its
 * own beside its word. The glyph is decorative: hidden, and no text, so the
 * badge still reads as the word alone.
 */
describe("Badge — a glyph for every tone (D9)", () => {
  it.each([
    ["success", "check", "Taken"],
    ["info", "clock", "Due now"],
    ["error", "alert", "Missed"],
    ["neutral", "calendar", "Coming up"],
  ])("every Badge tone draws an aria-hidden icon: %s draws %s", (tone, name, word) => {
    const expected = glyph(name);
    const { container } = render(<Badge tone={tone}>{word}</Badge>);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg.outerHTML).toBe(expected);
    expect(container.textContent).toBe(word);
  });

  it("draws the neutral calendar when no tone is given", () => {
    const expected = glyph("calendar");
    const { container } = render(<Badge>Coming up</Badge>);

    expect(container.querySelector("svg").outerHTML).toBe(expected);
  });

  it("gives each tone a different glyph, so the shape tells them apart too", () => {
    const markup = ["success", "info", "error", "neutral"].map((tone) => {
      const { container, unmount } = render(<Badge tone={tone}>Status</Badge>);
      const html = container.querySelector("svg").outerHTML;
      unmount();
      return html;
    });

    expect(new Set(markup).size).toBe(4);
  });

  it.each(["urgent", "toString"])(
    "draws no glyph for a tone it does not know (%s), and still shows the word",
    (tone) => {
      // "toString" is the Object.prototype trap: a bare lookup would find a
      // function there and try to draw it.
      const { container } = render(<Badge tone={tone}>Status</Badge>);

      expect(container.querySelector("svg")).toBeNull();
      expect(container.textContent).toBe("Status");
    },
  );

  it("is plain text, never a live region", () => {
    const { container } = render(<Badge tone="success">Ready</Badge>);

    expect(container.querySelector("[role], [aria-live]")).toBeNull();
  });
});
