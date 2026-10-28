import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, jest } from "@jest/globals";
import Button from "../Button.jsx";

/**
 * What these tests deliberately do NOT cover: anything painted or measured.
 * The 52px control floor, the fill colours and the focus ring are verified for
 * real in Chromium by the Playwright script described in README "Verification",
 * because jsdom has no layout engine and no stylesheets loaded here.
 *
 * Where a test does name a modifier class it says so, and claims only that the
 * prop reached the markup as the hook `components.css` keys on — never that the
 * result looks any particular way.
 */
describe("Button", () => {
  describe("label", () => {
    it("names the button with its children", () => {
      render(<Button>I&rsquo;m ready</Button>);
      expect(screen.getByRole("button", { name: "I’m ready" })).toBeInTheDocument();
    });

    it("accepts element children, not just a string", () => {
      render(
        <Button>
          <strong>Call</strong> the nurse line
        </Button>,
      );
      expect(screen.getByRole("button")).toHaveAccessibleName("Call the nurse line");
    });

    it("passes a long label through to the accessible name verbatim", () => {
      // Only that nothing in Button shortens the string. Whether the label
      // then wraps instead of clipping -- the min-height floor in
      // components.css, and .cc-btn deliberately not setting
      // white-space: nowrap -- is measured in Chromium by the Playwright
      // width sweep. jsdom has no layout engine and no stylesheet loaded.
      const long =
        "Message the care team about tomorrow morning's blood pressure check";
      render(<Button>{long}</Button>);
      expect(screen.getByRole("button")).toHaveAccessibleName(long);
    });
  });

  describe("icon", () => {
    it("renders the named icon as a decorative graphic at the button's own size", () => {
      const { container } = render(<Button icon="chat">Message care team</Button>);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      // Button overrides Icon's own default of 24; drop the prop and a 24px
      // glyph ships silently. These are DOM attributes, not computed style.
      expect(svg).toHaveAttribute("width", "20");
      expect(svg).toHaveAttribute("height", "20");
      // Exact name, not a substring: the guard is that Button puts nothing of
      // its own beside the children. It is NOT a check on aria-hidden -- the
      // paths carry no text, so the name is the same either way; the
      // attribute assertion above is what pins that.
      expect(screen.getByRole("button")).toHaveAccessibleName("Message care team");
    });

    it("renders no graphic when no icon is asked for", () => {
      const { container } = render(<Button>I&rsquo;m ready</Button>);
      expect(container.querySelector("svg")).toBeNull();
    });

    it("renders no graphic, and still names the button, for an undefined icon name", () => {
      const { container } = render(<Button icon="stethoscope">I&rsquo;m ready</Button>);
      expect(container.querySelector("svg")).toBeNull();
      expect(screen.getByRole("button", { name: "I’m ready" })).toBeInTheDocument();
    });
  });

  describe("variant and width hooks", () => {
    it("defaults to the primary variant hook", () => {
      render(<Button>I&rsquo;m ready</Button>);
      expect(screen.getByRole("button")).toHaveClass("cc-btn", "cc-btn--primary");
    });

    it("carries the secondary variant hook when asked for it", () => {
      render(<Button variant="secondary">Message care team</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("cc-btn", "cc-btn--secondary");
      expect(button).not.toHaveClass("cc-btn--primary");
    });

    it("adds the full-width hook only when fullWidth is set", () => {
      const { rerender } = render(<Button>I&rsquo;m ready</Button>);
      expect(screen.getByRole("button")).not.toHaveClass("cc-btn--full");

      rerender(<Button fullWidth>I&rsquo;m ready</Button>);
      expect(screen.getByRole("button")).toHaveClass("cc-btn--full");
    });
  });

  describe("disabled", () => {
    it("is enabled unless asked otherwise", () => {
      render(<Button>I&rsquo;m ready</Button>);
      expect(screen.getByRole("button")).toBeEnabled();
    });

    it("uses aria-disabled rather than the native attribute, as the board specifies", () => {
      render(<Button disabled>I&rsquo;m ready</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toBeDisabled();
    });

    it("omits aria-disabled entirely when enabled, rather than setting it false", () => {
      // aria-disabled="false" is announced by some screen readers as a state
      // worth mentioning, so an enabled control should carry no attribute.
      render(<Button>I&rsquo;m ready</Button>);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled");
    });

    it("does not fire onClick when disabled", async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();
      render(
        <Button disabled onClick={onClick}>
          I&rsquo;m ready
        </Button>,
      );

      await user.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });

    it("is reachable by Tab when enabled", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button>I&rsquo;m ready</Button>
          <a href="#next">Next thing</a>
        </>,
      );

      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("stays in the tab order when disabled, which is the point of aria-disabled", async () => {
      // The native attribute would remove the control from the sequence
      // entirely: a keyboard user would never learn it exists. aria-disabled
      // keeps it reachable and announced as unavailable.
      const user = userEvent.setup();
      render(
        <>
          <Button disabled>I&rsquo;m ready</Button>
          <a href="#next">Next thing</a>
        </>,
      );

      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("is inert when disabled even though it is focusable, including via the keyboard", async () => {
      // The standing objection to aria-disabled is that it leaves the handler
      // live. It is only true if you leave it attached, so this pins both
      // activation routes a focusable button has.
      const onClick = jest.fn();
      const user = userEvent.setup();
      render(
        <Button disabled onClick={onClick}>
          I&rsquo;m ready
        </Button>,
      );

      const button = screen.getByRole("button");
      await user.click(button);
      button.focus();
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("activation", () => {
    it("calls onClick once per click", async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();
      render(<Button onClick={onClick}>I&rsquo;m ready</Button>);

      await user.click(screen.getByRole("button", { name: "I’m ready" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("is activated by the keyboard as a native button", async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();
      render(<Button onClick={onClick}>I&rsquo;m ready</Button>);

      await user.tab();
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it("does not throw when clicked with no onClick, as every specimen in this cut is", async () => {
      // user.click() resolves to undefined whatever the handler does, so the
      // promise proves nothing on its own. A throw out of a React event
      // handler reaches window as an error event, so listen for that instead.
      const onError = jest.fn();
      const user = userEvent.setup();
      window.addEventListener("error", onError);
      try {
        render(<Button>I&rsquo;m ready</Button>);
        await user.click(screen.getByRole("button"));
      } finally {
        window.removeEventListener("error", onError);
      }

      expect(onError).not.toHaveBeenCalled();
    });

    it("defaults to type=button so it cannot submit a form around it", async () => {
      const onSubmit = jest.fn((event) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <Button>I&rsquo;m ready</Button>
        </form>,
      );

      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
      await user.click(screen.getByRole("button"));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits the surrounding form when type is submit", async () => {
      const onSubmit = jest.fn((event) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit">Send</Button>
        </form>,
      );

      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
