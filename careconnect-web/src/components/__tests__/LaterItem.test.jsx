import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, jest } from "@jest/globals";
import { patientToday } from "../../data/patientToday.js";
import Button from "../Button.jsx";
import LaterItem from "../LaterItem.jsx";

/**
 * The fixture uses copy that appears nowhere in data/patientToday.js, so the
 * field-to-slot mapping is actually being checked rather than echoed; the real
 * items are rendered once at the bottom, to catch a shape mismatch.
 *
 * It carries an `id` for the same reason the real items do (the list key) — the
 * id must not reach the page, and the reading-order test is what proves it.
 *
 * Rendered inside a <ul> because that is how PatientToday renders it and
 * because `listitem` is the role being asserted. Whether two of these sit in
 * one column or share a row is the parent's grid and is measured in Chromium,
 * not here.
 */
const laterItem = () => ({
  id: "afternoon-walk",
  time: "4:30 pm",
  title: "Afternoon walk",
  detail: "Twice around the garden",
  icon: "calendar",
});

const renderItem = (item) =>
  render(
    <ul>
      <LaterItem item={item} />
    </ul>,
  );

describe("LaterItem", () => {
  it("renders as a list item, so a run of them reads as a list", () => {
    renderItem(laterItem());

    expect(screen.getByRole("listitem")).toBeInTheDocument();
  });

  it("renders the item's time, title and detail", () => {
    renderItem(laterItem());

    expect(screen.getByText("4:30 pm")).toBeInTheDocument();
    expect(screen.getByText("Afternoon walk")).toBeInTheDocument();
    expect(screen.getByText("Twice around the garden")).toBeInTheDocument();
  });

  it("reads time, then title, then detail — and nothing else", () => {
    const item = laterItem();
    renderItem(item);

    // Also the guard that the list key never reaches the page: `id` is in the
    // fixture and must not appear in the text.
    expect(screen.getByRole("listitem").textContent).toBe(
      [item.time, item.title, item.detail].join(""),
    );
  });

  it("passes the item's own icon name through to the icon set", () => {
    const pill = renderItem({ ...laterItem(), icon: "pill" });
    const pillPaths = pill.container.querySelector("svg").innerHTML;
    pill.unmount();

    const check = renderItem({ ...laterItem(), icon: "check" });
    const checkPaths = check.container.querySelector("svg").innerHTML;

    expect(pillPaths).not.toBe("");
    // A hard-coded icon name would make these two identical.
    expect(checkPaths).not.toBe(pillPaths);
  });

  it("hides the icon from assistive technology", () => {
    const { container } = renderItem(laterItem());

    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
  });

  it("drops the icon, and keeps the text, when the item names an icon the set does not have", () => {
    const { container } = renderItem({ ...laterItem(), icon: "stethoscope" });

    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByRole("listitem").textContent).toBe(
      "4:30 pmAfternoon walkTwice around the garden",
    );
  });

  // "in the markup" is all this layer can say: nothing in the component cuts a
  // string, and jsdom loads no stylesheet (jest.config.js stubs every .css
  // import), so the hazard the title names — a long unbreakable word pushing
  // the pair past its grid track at 768, which is why components.css gives
  // .cc-later__text min-width: 0 — is invisible here and belongs to the
  // Playwright sweep.
  it("renders a long title in full rather than truncating it in the markup", () => {
    const title =
      "Evening medication — the small white tablet from the blue box on the kitchen shelf, not the one in the bathroom cabinet";
    renderItem({ ...laterItem(), title });

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("renders what it has when the optional copy is absent, and leaks no placeholder", () => {
    const { container } = renderItem({ title: "Rest for a while" });

    expect(screen.getByRole("listitem")).toBeInTheDocument();
    expect(screen.getByText("Rest for a while")).toBeInTheDocument();
    expect(container.textContent).toBe("Rest for a while");
    expect(container.textContent).not.toMatch(/undefined|null|NaN/);
    // Element-level, because an empty chip carries no text for the assertion
    // above to catch: the chip is a tinted 40x40 circle CSS paints, so an item
    // with no icon must render no chip rather than a coloured blank.
    expect(container.querySelector(".cc-later__icon")).toBeNull();
  });

  it("renders every real later-today item, catching a shape or icon-name mismatch", () => {
    for (const item of patientToday.later.items) {
      const { container, unmount } = renderItem(item);

      expect(screen.getByRole("listitem").textContent).toBe(
        [item.time, item.title, item.detail].join(""),
      );
      // A name the icon set does not know renders nothing at all, silently.
      expect(container.querySelector("svg")).not.toBeNull();

      unmount();
    }

    expect(patientToday.later.items.length).toBeGreaterThan(0);
  });
});

/**
 * Week 11: a live list shows each item's status and what can be done about it.
 * `badge` is the status, in words as well as tone and glyph; `children` are the
 * item's buttons. They come after the detail, so an item still reads time,
 * title, detail first, then its status, then its actions.
 */
describe("LaterItem — status and actions", () => {
  const isFollowedBy = (first, second) =>
    Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

  it("renders a badge and its action children", async () => {
    const onMark = jest.fn();
    const user = userEvent.setup();
    render(
      <ul>
        <LaterItem item={laterItem()} badge={{ tone: "info", label: "Due now" }}>
          <Button onClick={onMark}>Mark it done</Button>
        </LaterItem>
      </ul>,
    );
    const item = screen.getByRole("listitem");

    // The status is the word, on its tone's hook, with the tone's own glyph hidden.
    const status = within(item).getByText("Due now");
    expect(status).toHaveClass("cc-badge", "cc-badge--info");
    expect(status.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    // The action is a real control inside the item, and it works.
    await user.click(within(item).getByRole("button", { name: "Mark it done" }));
    expect(onMark).toHaveBeenCalledTimes(1);
  });

  it("reads time, title, detail, then the status, then the actions", () => {
    const item = laterItem();
    render(
      <ul>
        <LaterItem item={item} badge={{ tone: "success", label: "Done" }}>
          <Button>First action</Button>
          <Button variant="secondary">Second action</Button>
        </LaterItem>
      </ul>,
    );
    const inOrder = [
      screen.getByText(item.time),
      screen.getByText(item.title),
      screen.getByText(item.detail),
      screen.getByText("Done"),
      screen.getByRole("button", { name: "First action" }),
      screen.getByRole("button", { name: "Second action" }),
    ];

    inOrder.slice(1).forEach((element, i) => {
      expect(isFollowedBy(inOrder[i], element)).toBe(true);
    });
    expect(within(screen.getByRole("listitem")).getAllByRole("button")).toHaveLength(2);
  });

  // The two wrappers are spaced boxes (components.css), so an empty one would
  // show as a gap under the detail. These check each is present only with
  // something in it.
  it("renders a status with no actions, and actions with no status, without the other's wrapper", () => {
    const status = render(
      <ul>
        <LaterItem item={laterItem()} badge={{ tone: "neutral", label: "Coming up" }} />
      </ul>,
    );
    expect(screen.getByText("Coming up")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(status.container.querySelector(".cc-later__status")).not.toBeNull();
    expect(status.container.querySelector(".cc-later__actions")).toBeNull();
    status.unmount();

    const actions = render(
      <ul>
        <LaterItem item={laterItem()}>
          <Button>Only an action</Button>
        </LaterItem>
      </ul>,
    );
    expect(screen.getByRole("button", { name: "Only an action" })).toBeInTheDocument();
    expect(actions.container.querySelector(".cc-later__actions")).not.toBeNull();
    // No status paragraph waiting for a badge.
    expect(actions.container.querySelector(".cc-later__status")).toBeNull();
    expect(actions.container.querySelector(".cc-badge")).toBeNull();
  });

  it("renders neither wrapper when there is no badge and every child is false", () => {
    // How a page writes conditional buttons. With both conditions false the
    // children are [false, false]: truthy, but nothing to render.
    function Row({ taken }) {
      return (
        <ul>
          <LaterItem item={laterItem()}>
            {taken && <Button>Taken</Button>}
            {taken && <Button variant="secondary">Undo</Button>}
          </LaterItem>
        </ul>
      );
    }
    const { container, rerender } = render(<Row taken={false} />);

    expect(container.querySelector(".cc-later__actions")).toBeNull();
    expect(container.querySelector(".cc-later__status")).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);

    // The same row with its buttons rendered gets its one actions box back.
    rerender(<Row taken />);
    expect(container.querySelectorAll(".cc-later__actions")).toHaveLength(1);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
