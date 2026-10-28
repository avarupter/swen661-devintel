import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";

import ProgressBar from "../ProgressBar.jsx";
import { patientToday } from "../../data/patientToday.js";

/**
 * ProgressBar is deliberately NOT a progressbar widget.
 *
 * It has no role="progressbar" and no aria-valuenow: the track is aria-hidden
 * and the same number is printed in text beside the label, so the information
 * does not depend on a progressbar role being understood. These tests assert
 * that arrangement rather than inventing the ARIA the component does not have
 * -- so they also fail if someone half-adds that ARIA later and leaves the
 * value announced twice.
 *
 * jsdom cannot see how wide the bar is drawn. It can see the inline width the
 * component computes, which is the part the component is responsible for; the
 * rendered geometry is measured in Chromium by the Playwright script.
 */

const TRACK = ".cc-progress__track";
const FILL = ".cc-progress__fill";
const VALUE = ".cc-progress__value";

function renderBar(props) {
  const { container } = render(<ProgressBar {...props} />);
  return {
    container,
    track: container.querySelector(TRACK),
    fill: container.querySelector(FILL),
    value: container.querySelector(VALUE),
  };
}

describe("ProgressBar", () => {
  describe("what it shows", () => {
    it("renders the label it is given", () => {
      renderBar({ percent: 30, label: "3 of 10 things done today" });

      expect(screen.getByText("3 of 10 things done today")).toBeInTheDocument();
    });

    it("states the percentage in text, not only in the bar", () => {
      renderBar({ percent: 30, label: "3 of 10 things done today" });

      expect(screen.getByText("30%")).toBeInTheDocument();
    });

    it("reads label first and value second", () => {
      // Reading order is the whole reason the value is a sibling span rather
      // than an attribute: "3 of 10 things done today" then "30%".
      const { container } = renderBar({ percent: 30, label: "3 of 10 things done today" });

      expect(container.querySelector(".cc-progress__row")).toHaveTextContent(
        /^3 of 10 things done today30%$/,
      );
    });

    it("renders a long label in full, leaving any truncation to CSS", () => {
      const label = "You have finished 3 of the 10 things on today's plan, including both morning medications";
      renderBar({ percent: 30, label });

      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it("still states the value when the label is empty", () => {
      renderBar({ percent: 30, label: "" });

      expect(screen.getByText("30%")).toBeInTheDocument();
    });
  });

  describe("the fill", () => {
    it("sets the fill width to the stated percentage", () => {
      const { fill } = renderBar({ percent: 30, label: "Progress" });

      expect(fill.style.width).toBe("30%");
    });

    it("nests the fill inside the track", () => {
      // The one piece of structure that gives the percentage a meaning: the
      // width resolves against the track. Every other assertion in this file
      // queries both flat off the container, so all of them survive the fill
      // being moved out, at which point the bar silently measures the wrong
      // box.
      const { track, fill } = renderBar({ percent: 30, label: "Progress" });

      expect(track.querySelector(FILL)).toBe(fill);
    });

    it("agrees with the text for every value it is given", () => {
      // textContent equality, not toHaveTextContent: that matcher takes a
      // string as a SUBSTRING, so "0%" was satisfied by "100%", "30%" and
      // "50%", and a falsy-zero regression passed every iteration of this loop
      // -- in the test whose whole name is "agrees".
      for (const percent of [0, 1, 30, 50, 99, 100]) {
        const { fill, value } = renderBar({ percent, label: "Progress" });

        expect(fill.style.width).toBe(`${percent}%`);
        expect({ percent, text: value.textContent }).toEqual({ percent, text: `${percent}%` });
      }
    });

    it("renders a zero-width fill rather than dropping it, at 0%", () => {
      // Nothing done yet is a state, not an absence: the track still needs its
      // fill element so the bar animates from zero when the day is wired up.
      const { fill } = renderBar({ percent: 0, label: "Nothing done yet" });

      expect(fill).not.toBeNull();
      expect(fill.style.width).toBe("0%");
    });

    it("clamps above 100 in both the text and the fill", () => {
      const { fill } = renderBar({ percent: 140, label: "Progress" });

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(fill.style.width).toBe("100%");
    });

    it("clamps below 0 in both the text and the fill", () => {
      const { fill } = renderBar({ percent: -20, label: "Progress" });

      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(fill.style.width).toBe("0%");
    });

    it("never leaves the 0-100 range for any finite or infinite number", () => {
      for (const percent of [-Infinity, -1000, -0.5, 0, 0.5, 42, 99.9, 100, 100.1, 1000, Infinity]) {
        const { fill, value } = renderBar({ percent, label: "Progress" });
        const width = Number.parseFloat(fill.style.width);

        expect({ percent, width, inRange: width >= 0 && width <= 100 }).toEqual({ percent, width, inRange: true });
        // The text cannot disagree with the bar -- and it has to be compared
        // exactly, or "0%" passes against a span reading "100%" and the
        // cross-check this test exists for is no check at all.
        expect({ percent, text: value.textContent }).toEqual({ percent, text: `${width}%` });
      }
    });

    it("prints NaN% and sets no width when percent is not a number", () => {
      // Pinning today's behaviour, not endorsing it. ProgressBar has no default
      // and no finiteness guard, so a missing percent clamps to NaN: the text
      // reads "NaN%" and CSSOM rejects the inline `width: NaN%`, collapsing the
      // bar while the text shows garbage. The loop above scopes itself to
      // numbers, so nothing else in the file sees this. If the source grows a
      // `Number.isFinite` guard, this test is the one to update -- a red here
      // is the fix landing, not a regression.
      const { fill, value } = renderBar({ label: "Progress" });

      expect(value.textContent).toBe("NaN%");
      expect(fill.style.width).toBe("");
    });

    it("passes a fractional percentage through unrounded", () => {
      // No rounding anywhere, so the label and the bar cannot drift apart by
      // half a percent. If rounding is ever wanted it has to happen once, in
      // one place, and this test should be updated to say where.
      const { fill } = renderBar({ percent: 33.3, label: "Progress" });

      expect(screen.getByText("33.3%")).toBeInTheDocument();
      expect(fill.style.width).toBe("33.3%");
    });
  });

  describe("how it reaches assistive technology", () => {
    it("hides the track so the value is announced once, from the text", () => {
      const { track } = renderBar({ percent: 30, label: "Progress" });

      expect(track).toHaveAttribute("aria-hidden", "true");
    });

    it("is not exposed as a progressbar widget", () => {
      renderBar({ percent: 30, label: "Progress" });

      expect(screen.queryByRole("progressbar")).toBeNull();
    });

    it("declares no ARIA beyond hiding the track", () => {
      // Deliberate, and documented in the component: no role, no
      // aria-valuenow/min/max, no live region. The guard is here so that ARIA
      // cannot be half-added -- a role without the values, or values that stop
      // matching the text -- without a test going red.
      const { container } = renderBar({ percent: 30, label: "Progress" });
      const ariaAttrs = [...container.querySelectorAll("*")].flatMap((el) =>
        [...el.attributes]
          .filter((a) => a.name === "role" || a.name.startsWith("aria-"))
          .map((a) => `${a.name}=${a.value}`),
      );

      expect(ariaAttrs).toEqual(["aria-hidden=true"]);
    });
  });

  describe("the data contract", () => {
    it("renders the day's progress from data/patientToday.js", () => {
      const { plan } = patientToday;
      const { fill } = renderBar({ percent: plan.progressPercent, label: plan.progressLabel });

      expect(screen.getByText(plan.progressLabel)).toBeInTheDocument();
      expect(screen.getByText(`${plan.progressPercent}%`)).toBeInTheDocument();
      expect(fill.style.width).toBe(`${plan.progressPercent}%`);
    });
  });
});
