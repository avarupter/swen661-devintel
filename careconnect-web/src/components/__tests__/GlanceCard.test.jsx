import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { patientToday } from "../../data/patientToday.js";
import GlanceCard from "../GlanceCard.jsx";

/**
 * The point of this component is the <dl>: each row is a label and ITS value.
 * A test that only checks the six strings are on screen would still pass with
 * every dt and dd shuffled, so the assertions below walk the list and pair each
 * dt with the dd that follows it.
 *
 * term/definition association is not exposed in the accessibility tree — a
 * screen reader derives it from document order — so the walk is done over the
 * DOM. Presence is still asserted through the term/definition roles.
 */

/** Every dt in the list, paired with the element that follows it. */
function readPairs(container) {
  const list = container.querySelector("dl");
  expect(list).not.toBeNull();

  return Array.from(list.querySelectorAll("dt")).map((term) => {
    const next = term.nextElementSibling;
    return [
      term.textContent,
      next && next.tagName === "DD" ? next.textContent : null,
    ];
  });
}

const twoRows = {
  heading: "A glance heading",
  items: [
    // Label and value are each other's opposite on purpose: swapping dt and dd
    // would leave the flat text identical and only the PAIRS would change.
    { id: "one", icon: "calendar", label: "Alpha", value: "Bravo" },
    { id: "two", icon: "pill", label: "Bravo", value: "Alpha" },
  ],
};

describe("GlanceCard", () => {
  describe("heading", () => {
    it("renders the heading from the data as a level-2 heading", () => {
      render(<GlanceCard data={twoRows} />);

      expect(
        screen.getByRole("heading", { level: 2, name: "A glance heading" }),
      ).toBeInTheDocument();
    });

    it("names the region with that heading, so the id wiring has to match", () => {
      render(<GlanceCard data={twoRows} />);

      expect(
        screen.getByRole("region", { name: "A glance heading" }),
      ).toBeInTheDocument();
    });

    it("names the region with the heading alone, not with the list contents", () => {
      render(<GlanceCard data={twoRows} />);

      expect(screen.getByRole("region")).toHaveAccessibleName(
        "A glance heading",
      );
    });
  });

  describe("term and definition pairing", () => {
    it("pairs each label with its own value, in data order", () => {
      const { container } = render(<GlanceCard data={twoRows} />);

      expect(readPairs(container)).toEqual([
        ["Alpha", "Bravo"],
        ["Bravo", "Alpha"],
      ]);
    });

    it("pairs the shipped Patient Today rows correctly", () => {
      const { container } = render(<GlanceCard data={patientToday.glance} />);

      expect(readPairs(container)).toEqual([
        ["Next appointment", "3:00 pm"],
        ["Medications", "2 remaining"],
        ["Completed", "3 things done"],
      ]);
    });

    it("renders one term and one definition per item, and no more", () => {
      const { container } = render(<GlanceCard data={patientToday.glance} />);
      const list = container.querySelector("dl");
      const count = patientToday.glance.items.length;

      expect(screen.getAllByRole("term")).toHaveLength(count);
      expect(screen.getAllByRole("definition")).toHaveLength(count);
      expect(list.querySelectorAll("dt")).toHaveLength(count);
      expect(list.querySelectorAll("dd")).toHaveLength(count);
    });

    it("keeps each term and its value in the same row group", () => {
      const { container } = render(<GlanceCard data={patientToday.glance} />);
      const list = container.querySelector("dl");

      for (const term of list.querySelectorAll("dt")) {
        const group = term.parentElement;
        expect(group.querySelectorAll("dt")).toHaveLength(1);
        expect(group.querySelectorAll("dd")).toHaveLength(1);
      }

      // The group is by construction inside the list, so asserting that its
      // dd is too could not fail. The guarantee worth pinning is at the list
      // level: no definition escapes a row group onto the <dl> itself.
      expect(list.querySelectorAll(":scope > dd")).toHaveLength(0);
    });

    it("grows with the data rather than rendering a fixed three rows", () => {
      const { container } = render(
        <GlanceCard
          data={{
            heading: "Five things",
            items: [1, 2, 3, 4, 5].map((n) => ({
              id: `row-${n}`,
              icon: "check",
              label: `Label ${n}`,
              value: `Value ${n}`,
            })),
          }}
        />,
      );

      expect(readPairs(container)).toEqual([
        ["Label 1", "Value 1"],
        ["Label 2", "Value 2"],
        ["Label 3", "Value 3"],
        ["Label 4", "Value 4"],
        ["Label 5", "Value 5"],
      ]);
    });

    it("renders values verbatim, including punctuation and long labels", () => {
      const longLabel =
        "Next appointment with the visiting community nurse, Maria";
      const { container } = render(
        <GlanceCard
          data={{
            heading: "Edge cases",
            items: [
              { id: "long", icon: "calendar", label: longLabel, value: "3:00 pm" },
              { id: "dot", icon: "check", label: "Last check-in", value: "Thursday · 5:38 AM" },
            ],
          }}
        />,
      );

      expect(readPairs(container)).toEqual([
        [longLabel, "3:00 pm"],
        ["Last check-in", "Thursday · 5:38 AM"],
      ]);
    });
  });

  describe("decorative icons", () => {
    it("hides every row icon from assistive technology", () => {
      const { container } = render(<GlanceCard data={patientToday.glance} />);
      const icons = container.querySelectorAll("dl svg");

      expect(icons).toHaveLength(patientToday.glance.items.length);
      for (const icon of icons) {
        expect(icon).toHaveAttribute("aria-hidden", "true");
        expect(icon).toHaveAttribute("focusable", "false");
      }
    });

    it("keeps icons out of the row text, so a label is announced once", () => {
      const { container } = render(<GlanceCard data={twoRows} />);
      const list = container.querySelector("dl");

      expect(list.textContent).toBe("AlphaBravoBravoAlpha");
    });
  });

  describe("edge cases", () => {
    it("renders the heading and an empty list when there are no items", () => {
      const { container } = render(
        <GlanceCard data={{ heading: "Nothing today", items: [] }} />,
      );

      expect(
        screen.getByRole("heading", { level: 2, name: "Nothing today" }),
      ).toBeInTheDocument();
      expect(container.querySelector("dl")).not.toBeNull();
      expect(screen.queryAllByRole("term")).toHaveLength(0);
      expect(screen.queryAllByRole("definition")).toHaveLength(0);
    });

    it("still pairs a row whose icon name is unknown or missing", () => {
      const { container } = render(
        <GlanceCard
          data={{
            heading: "Odd icons",
            items: [
              { id: "unknown", icon: "not-a-real-icon", label: "Alpha", value: "Bravo" },
              { id: "absent", label: "Charlie", value: "Delta" },
            ],
          }}
        />,
      );

      expect(readPairs(container)).toEqual([
        ["Alpha", "Bravo"],
        ["Charlie", "Delta"],
      ]);
      expect(container.querySelectorAll("dl svg")).toHaveLength(0);
    });
  });

  describe("the shell it asks Card for", () => {
    it("asks for the default surface tone, which is the modifier the stylesheet selects on", () => {
      // CareTeamCard.test.jsx pins the same thing from the other side: soft is
      // the supporting-care surface, and nothing but this assertion stops the
      // glance card taking it. The modifier is all jsdom can see — the two
      // surface colours themselves are measured in Chromium (README,
      // "Verification").
      const { container } = render(<GlanceCard data={twoRows} />);
      const shell = container.firstElementChild;

      expect(shell).toHaveClass("cc-card", "cc-card--surface", "cc-glance");
      expect(shell).not.toHaveClass("cc-card--soft");
    });
  });
});
