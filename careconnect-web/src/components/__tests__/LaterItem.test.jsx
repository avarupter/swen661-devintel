import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { patientToday } from "../../data/patientToday.js";
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
  // string, and jsdom loads no stylesheet (vite.config.js sets css: false), so
  // the hazard the title names — a long unbreakable word pushing the pair past
  // its grid track at 768, which is why components.css gives .cc-later__text
  // min-width: 0 — is invisible here and belongs to the Playwright sweep.
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
