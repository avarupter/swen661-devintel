import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "@jest/globals";
import Card from "../Card.jsx";

/**
 * Card is a passive shell: its whole job is children -> element, props -> class
 * string, and everything else forwarded untouched. So that is what is asserted
 * here.
 *
 * The class assertions are deliberately named for what they prove — that the
 * component emits the modifier the stylesheet selects on. They prove nothing
 * about the 24px radius, the padding or the two surface colours; jsdom has no
 * layout engine and resolves no custom properties, so those are measured in
 * Chromium by the Playwright script (see README, "Verification").
 */
describe("Card", () => {
  describe("children", () => {
    it("renders its children", () => {
      render(<Card>Card body copy</Card>);
      expect(screen.getByText("Card body copy")).toBeInTheDocument();
    });

    it("renders several children, in source order, inside the one shell", () => {
      const { container } = render(
        <Card>
          <h2>Heading</h2>
          <p>First</p>
          <p>Second</p>
        </Card>,
      );

      const shell = container.firstElementChild;
      expect(
        Array.from(shell.children).map((el) => el.textContent),
      ).toEqual(["Heading", "First", "Second"]);
    });

    it("renders an empty shell when given no children", () => {
      const { container } = render(<Card />);

      expect(container.firstElementChild).not.toBeNull();
      expect(container.firstElementChild).toBeEmptyDOMElement();
    });
  });

  describe("element choice", () => {
    // A plain <div> has no role of its own, so the tag is the only observable
    // thing here and container access is the honest way to read it.
    it("renders a div by default", () => {
      const { container } = render(<Card>Body</Card>);
      expect(container.firstElementChild.tagName).toBe("DIV");
    });

    it("renders a section when asked, which aria-labelledby promotes to a region", () => {
      render(
        <>
          <h2 id="card-test-heading">Your care team</h2>
          <Card as="section" aria-labelledby="card-test-heading">
            Body
          </Card>
        </>,
      );

      expect(
        screen.getByRole("region", { name: "Your care team" }),
      ).toBeInTheDocument();
    });

    it("renders an article when asked", () => {
      render(<Card as="article">Body</Card>);
      expect(screen.getByRole("article")).toHaveTextContent("Body");
    });

    it("renders a list item when asked, as LaterItem needs", () => {
      render(
        <ul>
          <Card as="li">Evening medication</Card>
        </ul>,
      );

      expect(screen.getByRole("listitem")).toHaveTextContent(
        "Evening medication",
      );
    });
  });

  describe("class contract", () => {
    it("emits exactly the shell and default-tone classes when given no className", () => {
      // Exact, not toHaveClass: this also pins the .trim(), which is the only
      // thing stopping a trailing space when className is omitted.
      const { container } = render(<Card>Body</Card>);
      expect(container.firstElementChild.getAttribute("class")).toBe(
        "cc-card cc-card--surface",
      );
    });

    it("emits the soft tone modifier instead when tone is soft", () => {
      const { container } = render(<Card tone="soft">Body</Card>);
      const shell = container.firstElementChild;

      expect(shell).toHaveClass("cc-card", "cc-card--soft");
      expect(shell).not.toHaveClass("cc-card--surface");
    });

    it("appends the caller className without dropping the shell classes", () => {
      const { container } = render(<Card className="cc-glance">Body</Card>);

      expect(container.firstElementChild.getAttribute("class")).toBe(
        "cc-card cc-card--surface cc-glance",
      );
    });

    it("keeps the shell classes when the caller combines tone and className", () => {
      const { container } = render(
        <Card tone="soft" className="cc-care">
          Body
        </Card>,
      );

      expect(container.firstElementChild.getAttribute("class")).toBe(
        "cc-card cc-card--soft cc-care",
      );
    });
  });

  describe("prop forwarding", () => {
    it("forwards aria-labelledby to the rendered element", () => {
      const { container } = render(
        <Card as="section" aria-labelledby="somewhere-else">
          Body
        </Card>,
      );

      expect(container.firstElementChild).toHaveAttribute(
        "aria-labelledby",
        "somewhere-else",
      );
    });

    it("forwards attributes it knows nothing about", () => {
      const { container } = render(
        <Card id="cc-test-card" aria-describedby="cc-test-note">
          Body
        </Card>,
      );
      const shell = container.firstElementChild;

      expect(shell).toHaveAttribute("id", "cc-test-card");
      expect(shell).toHaveAttribute("aria-describedby", "cc-test-note");
    });

    it("forwards event handlers, not just attributes", async () => {
      const user = userEvent.setup();
      let clicks = 0;

      render(
        <Card onClick={() => (clicks += 1)}>
          <button type="button">Act</button>
        </Card>,
      );

      await user.click(screen.getByRole("button", { name: "Act" }));
      expect(clicks).toBe(1);
    });

    it("does not leak its own props onto the DOM element", () => {
      // If `tone` or `as` fell out of the destructuring they would land in
      // ...rest and React 19 would write them to the element as attributes.
      const { container } = render(
        <Card as="section" tone="soft" className="cc-care">
          Body
        </Card>,
      );
      const shell = container.firstElementChild;

      expect(shell).not.toHaveAttribute("tone");
      expect(shell).not.toHaveAttribute("as");
      expect(shell).not.toHaveAttribute("children");
    });
  });
});
