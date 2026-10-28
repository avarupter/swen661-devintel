import { render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, jest } from "@jest/globals";
import TextField from "../TextField.jsx";

const LABEL = "Message subject";
const HELPER = "Give your care team a short summary.";
const ERROR = "Error: Enter a subject before sending.";

/**
 * The heart of this component is the useId wiring, so these tests resolve the
 * references rather than trusting that an attribute exists: aria-describedby is
 * checked against the actual id of the actual paragraph, and the computed
 * accessible description is asserted the way assistive technology would build
 * it.
 *
 * Nothing here asserts a colour or a size. The error is red and the input is
 * 52px tall in Chromium, where the Playwright script in README "Verification"
 * measures both; jsdom can only show that the error is also stated in words.
 */
describe("TextField", () => {
  describe("label association", () => {
    it("binds a visible <label for> to the input, not an aria-label or a placeholder", () => {
      render(<TextField label={LABEL} />);
      const input = screen.getByLabelText(LABEL);
      const label = screen.getByText(LABEL);

      expect(input.tagName).toBe("INPUT");
      // getByLabelText is satisfied by aria-label just as readily, so on its
      // own it would not pin the component's first documented decision: the
      // label is persistent visible text, not a placeholder that disappears
      // the moment someone types.
      expect(label.tagName).toBe("LABEL");
      expect(label).toHaveAttribute("for", input.id);
      expect(input).not.toHaveAttribute("aria-label");
      expect(input).not.toHaveAttribute("placeholder");
    });

    it("gives each instance its own id, so two fields on one page stay distinct", () => {
      render(
        <>
          <TextField label="Message subject" helperText={HELPER} />
          <TextField label="Your phone number" helperText={HELPER} />
        </>,
      );

      const subject = screen.getByLabelText("Message subject");
      const phone = screen.getByLabelText("Your phone number");

      expect(subject.id).toBeTruthy();
      expect(phone.id).toBeTruthy();
      expect(subject.id).not.toBe(phone.id);
      expect(subject.getAttribute("aria-describedby")).not.toBe(
        phone.getAttribute("aria-describedby"),
      );
    });
  });

  describe("aria-describedby wiring", () => {
    it("has no aria-describedby when there is nothing to describe", () => {
      render(<TextField label={LABEL} />);
      expect(screen.getByLabelText(LABEL)).not.toHaveAttribute("aria-describedby");
    });

    it("points aria-describedby at the helper text", () => {
      render(<TextField label={LABEL} helperText={HELPER} />);
      const input = screen.getByLabelText(LABEL);
      const helper = screen.getByText(HELPER);

      expect(helper.id).toBeTruthy();
      expect(input.getAttribute("aria-describedby")).toBe(helper.id);
      expect(input).toHaveAccessibleDescription(HELPER);
    });

    it("points aria-describedby at the error when there is no helper text", () => {
      render(<TextField label={LABEL} errorText={ERROR} />);
      const input = screen.getByLabelText(LABEL);
      const error = screen.getByText(ERROR);

      expect(error.id).toBeTruthy();
      expect(input.getAttribute("aria-describedby")).toBe(error.id);
      expect(input).toHaveAccessibleDescription(ERROR);
    });

    it("points aria-describedby at both, guidance before problem", () => {
      render(<TextField label={LABEL} helperText={HELPER} errorText={ERROR} />);
      const input = screen.getByLabelText(LABEL);
      const helper = screen.getByText(HELPER);
      const error = screen.getByText(ERROR);

      // Order is the assertion: a reader should hear what the field wants
      // before it hears what went wrong.
      expect(input.getAttribute("aria-describedby")).toBe(`${helper.id} ${error.id}`);
      expect(input).toHaveAccessibleDescription(`${HELPER} ${ERROR}`);
      // Described, not renamed: the helper and the error must not be pulled
      // into the name alongside the label.
      expect(input).toHaveAccessibleName(LABEL);
    });

    it("treats empty helper and error strings as absent rather than describing nothing", () => {
      render(<TextField label={LABEL} helperText="" errorText="" />);
      const input = screen.getByLabelText(LABEL);

      expect(input).not.toHaveAttribute("aria-describedby");
      expect(input).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("error state", () => {
    it("sets aria-invalid only when there is an error", () => {
      const { rerender } = render(<TextField label={LABEL} helperText={HELPER} />);
      expect(screen.getByLabelText(LABEL)).not.toHaveAttribute("aria-invalid");

      rerender(<TextField label={LABEL} helperText={HELPER} errorText={ERROR} />);
      expect(screen.getByLabelText(LABEL)).toHaveAttribute("aria-invalid", "true");
    });

    it("marks the wrapper with the error hook components.css keys on", () => {
      // Claims only that the prop reached the markup. Whether the border is
      // then 2px of --cc-error is measured in Chromium, not here.
      const { container, rerender } = render(<TextField label={LABEL} />);
      expect(container.querySelector(".cc-field")).not.toHaveClass("cc-field--error");

      rerender(<TextField label={LABEL} errorText={ERROR} />);
      expect(container.querySelector(".cc-field")).toHaveClass("cc-field--error");
    });

    it("is deliberately not a live region, so nothing is announced on first render", () => {
      const { container } = render(
        <TextField label={LABEL} helperText={HELPER} errorText={ERROR} />,
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(container.querySelector("[aria-live]")).toBeNull();
      expect(container.querySelector("[role]")).toBeNull();
    });
  });

  describe("optional content", () => {
    // These read the paragraph elements rather than their text, because an
    // always-rendered empty <p> would leave no text to look for while still
    // opening a gap in the field's flex column. Neither paragraph carries a
    // role, so there is nothing in the accessibility tree to query instead.
    const paragraphs = (container) =>
      Array.from(container.querySelectorAll("p"), (p) => p.textContent);

    it("renders no paragraph at all when there is neither helper nor error", () => {
      const { container } = render(<TextField label={LABEL} />);
      expect(paragraphs(container)).toEqual([]);
    });

    it("renders only the error paragraph when no helper text is given", () => {
      const { container } = render(<TextField label={LABEL} errorText={ERROR} />);
      expect(paragraphs(container)).toEqual([ERROR]);
    });

    it("renders only the helper paragraph when no error text is given", () => {
      const { container } = render(<TextField label={LABEL} helperText={HELPER} />);
      expect(paragraphs(container)).toEqual([HELPER]);
    });

    it("renders the helper before the error when both are given", () => {
      const { container } = render(
        <TextField label={LABEL} helperText={HELPER} errorText={ERROR} />,
      );
      expect(paragraphs(container)).toEqual([HELPER, ERROR]);
    });

    it("renders the placeholder when given, and none when not", () => {
      const { rerender } = render(<TextField label={LABEL} />);
      expect(screen.getByLabelText(LABEL)).not.toHaveAttribute("placeholder");

      rerender(<TextField label={LABEL} placeholder="Question about my day" />);
      expect(screen.getByLabelText(LABEL)).toHaveAttribute(
        "placeholder",
        "Question about my day",
      );
    });
  });

  describe("input behaviour", () => {
    it("defaults to a text input and honours an explicit type", () => {
      const { rerender } = render(<TextField label={LABEL} />);
      expect(screen.getByLabelText(LABEL)).toHaveAttribute("type", "text");

      rerender(<TextField label="Your email" type="email" />);
      expect(screen.getByLabelText("Your email")).toHaveAttribute("type", "email");
    });

    it("seeds the value uncontrolled, so what is typed is kept", async () => {
      const user = userEvent.setup();
      render(<TextField label={LABEL} defaultValue="Question about" />);
      const input = screen.getByLabelText(LABEL);

      expect(input).toHaveValue("Question about");
      await user.type(input, " my day");
      expect(input).toHaveValue("Question about my day");
    });

    it("is editable by default", async () => {
      const user = userEvent.setup();
      render(<TextField label={LABEL} />);
      const input = screen.getByLabelText(LABEL);

      expect(input).toBeEnabled();
      await user.type(input, "Hello");
      expect(input).toHaveValue("Hello");
    });

    it("takes no input when disabled, and keeps its label readable", async () => {
      const user = userEvent.setup();
      render(
        <TextField
          label={LABEL}
          helperText="Messaging is unavailable in this example."
          disabled
        />,
      );
      const input = screen.getByLabelText(LABEL);

      expect(input).toBeDisabled();
      await user.type(input, "Hello");
      expect(input).toHaveValue("");
      // The label is a sibling of the input, not a placeholder, so it survives
      // the disabled state.
      expect(screen.getByText(LABEL)).toBeInTheDocument();
    });
  });
});

/**
 * Week 11: the compose and reply forms need fields that hold their text in the
 * page's state (so a draft can be saved and restored), carry the attributes a
 * form submits, take a stable id or a ref so focus can be sent to the first
 * invalid field, and come as a multi-line message box. All of it on the same
 * label, helper and error wiring as the single-line field.
 */
describe("TextField — live forms", () => {
  /** A page holding the field's text in state, as compose does for its draft. */
  function Draft({ initial = "", multiline = false }) {
    const [text, setText] = useState(initial);
    return (
      <>
        <TextField
          label={LABEL}
          value={text}
          onChange={(event) => setText(event.target.value)}
          multiline={multiline}
        />
        <output aria-label="Saved draft">{text}</output>
      </>
    );
  }

  describe("controlled", () => {
    it("is controlled by value and onChange", async () => {
      const user = userEvent.setup();
      render(<Draft initial="Question" />);
      const input = screen.getByRole("textbox", { name: LABEL });

      expect(input).toHaveValue("Question");
      await user.type(input, " about my day");

      expect(input).toHaveValue("Question about my day");
      // The page's state saw every keystroke, which is what a draft is saved from.
      expect(screen.getByRole("status", { name: "Saved draft" })).toHaveTextContent(
        "Question about my day",
      );
    });

    it("shows what value says, not what was typed, until onChange updates it", async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<TextField label={LABEL} value="Fixed" onChange={onChange} />);
      const input = screen.getByRole("textbox", { name: LABEL });

      await user.type(input, "x");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].target).toBe(input);
      expect(input).toHaveValue("Fixed");
    });
  });

  describe("what a form needs", () => {
    it("passes name, required, maxLength and autoComplete to the input", () => {
      render(
        <TextField label={LABEL} name="subject" required maxLength={200} autoComplete="off" />,
      );
      const input = screen.getByRole("textbox", { name: LABEL });

      expect(input).toHaveAttribute("name", "subject");
      expect(input).toBeRequired();
      expect(input).toHaveAttribute("maxlength", "200");
      expect(input).toHaveAttribute("autocomplete", "off");
    });

    it("leaves every one of them off when not given, as the specimens rely on", () => {
      render(<TextField label={LABEL} />);
      const input = screen.getByRole("textbox", { name: LABEL });

      expect(input).not.toBeRequired();
      for (const attribute of ["name", "maxlength", "autocomplete"]) {
        expect(input).not.toHaveAttribute(attribute);
      }
    });

    it("uses a given id for the input, and keeps the label and descriptions wired to it", () => {
      render(<TextField id="compose-subject" label={LABEL} helperText={HELPER} errorText={ERROR} />);
      const input = screen.getByRole("textbox", { name: LABEL });

      expect(input).toHaveAttribute("id", "compose-subject");
      expect(input).toHaveAttribute(
        "aria-describedby",
        "compose-subject-helper compose-subject-error",
      );
      expect(input).toHaveAccessibleDescription(`${HELPER} ${ERROR}`);
    });

    it("hands inputRef the input, so a page can move focus to it", () => {
      const ref = createRef();
      render(<TextField label={LABEL} inputRef={ref} />);

      expect(ref.current).toBe(screen.getByRole("textbox", { name: LABEL }));
      ref.current.focus();
      expect(screen.getByRole("textbox", { name: LABEL })).toHaveFocus();
    });
  });

  describe("multiline", () => {
    it("renders a textarea with the same described-by order", () => {
      render(<TextField label="Message" helperText={HELPER} errorText={ERROR} multiline />);
      const area = screen.getByRole("textbox", { name: "Message" });
      const helper = screen.getByText(HELPER);
      const error = screen.getByText(ERROR);

      expect(area.tagName).toBe("TEXTAREA");
      // Guidance before problem, exactly as the single-line field.
      expect(area.getAttribute("aria-describedby")).toBe(`${helper.id} ${error.id}`);
      expect(area).toHaveAccessibleDescription(`${HELPER} ${ERROR}`);
      expect(area).toHaveAttribute("aria-invalid", "true");
      expect(area).toHaveAccessibleName("Message");
    });

    it("is four lines tall unless told otherwise, and takes no input type", () => {
      const { rerender } = render(<TextField label="Message" multiline />);
      const area = screen.getByRole("textbox", { name: "Message" });

      expect(area).toHaveAttribute("rows", "4");
      expect(area).not.toHaveAttribute("type");

      rerender(<TextField label="Message" multiline rows={6} />);
      expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("rows", "6");
    });

    it("is controlled, keeps line breaks, and takes the same form attributes as the input", async () => {
      const user = userEvent.setup();
      render(<Draft multiline />);
      const area = screen.getByRole("textbox", { name: LABEL });

      await user.type(area, "Thank you.{Enter}See you then.");
      expect(area).toHaveValue("Thank you.\nSee you then.");

      render(<TextField label="Reply" multiline name="body" required maxLength={10000} />);
      const reply = screen.getByRole("textbox", { name: "Reply" });
      expect(reply).toHaveAttribute("name", "body");
      expect(reply).toBeRequired();
      expect(reply).toHaveAttribute("maxlength", "10000");
    });

    it("hands inputRef the textarea", () => {
      const ref = createRef();
      render(<TextField label="Message" multiline inputRef={ref} />);

      expect(ref.current).toBe(screen.getByRole("textbox", { name: "Message" }));
    });

    it("takes no input when disabled, with the native attribute like the input", async () => {
      const user = userEvent.setup();
      render(<TextField label="Message" multiline disabled />);
      const area = screen.getByRole("textbox", { name: "Message" });

      expect(area).toBeDisabled();
      await user.type(area, "Hello");
      expect(area).toHaveValue("");
    });
  });
});
