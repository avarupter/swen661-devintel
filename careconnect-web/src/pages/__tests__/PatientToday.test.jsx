import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "@jest/globals";
import PatientToday from "../PatientToday.jsx";
import { patientToday as d } from "../../data/patientToday.js";

/**
 * Patient Today.
 *
 * What this file can and cannot prove: jsdom has no layout engine and no media
 * queries, so nothing here knows which of the three layouts is showing. The
 * widths, target sizes and contrast ratios are measured in Chromium by the
 * Playwright script described in README "Verification". These tests cover the
 * other half of the screen's contract — the markup, the accessible names, the
 * ARIA wiring and, most importantly, the DOM ORDER, which is the one thing the
 * three layouts share and the thing the desktop grid depends on being right.
 */

/**
 * The 18 strings the content-parity table requires at every width.
 *
 * Written out as literals rather than read from `data/patientToday.js` on
 * purpose. The parity table is the specification: if someone edits a string in
 * the data module, that is a content change the table has to be re-agreed for,
 * and this test should go red and say so. Deriving the list from the data would
 * assert only that the page renders whatever the data happens to say, which is
 * a weaker claim and would stay green through exactly the change worth catching.
 *
 * This is the same list the Playwright verification script checks at seven
 * widths; keep the two in step. `plan.encouragement` is deliberately NOT here —
 * it is not one of the 18 the table names — but it IS on the screen, so it is
 * asserted in the plan test below rather than left uncovered.
 */
const PARITY_STRINGS = [
  "Thursday, June 4 · 5:38 AM",
  "Good morning, Joyce",
  "Call my caregiver",
  "3 of 10 things done today",
  "30%",
  "3:00 pm",
  "Video call with Maria",
  "Your daughter — she will call you",
  "I'm ready",
  "6:00 pm",
  "Evening medication",
  "Take with a glass of water",
  "8:00 pm",
  "Evening check-in",
  "A quick wellness check",
  "2 remaining",
  "Message care team",
  "Your information is private and secure.",
];

const headingLevel = (el) => Number(el.tagName.slice(1));
const isFollowedBy = (first, second) =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  );

describe("PatientToday", () => {
  describe("content parity", () => {
    it("checks the 18 strings the parity table requires, no fewer", () => {
      // Guards the list itself: deleting an entry below would otherwise quietly
      // reduce what the next 18 cases cover, and the report would still be green.
      expect(PARITY_STRINGS).toHaveLength(18);
      expect(new Set(PARITY_STRINGS).size).toBe(18);
    });

    it.each(PARITY_STRINGS)("renders %j", (text) => {
      render(<PatientToday />);
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    });

    it("renders the progress figure and the encouragement as text, not only as a bar", () => {
      const { container } = render(<PatientToday />);

      // The number has to survive on its own, because the track that draws it
      // is hidden from assistive technology precisely so the figure is not
      // announced twice. If the text were dropped the information would be gone
      // for a screen reader entirely.
      expect(screen.getByText("30%")).toBeInTheDocument();
      expect(screen.getByText(d.plan.progressLabel)).toBeInTheDocument();
      // The encouragement sits in the same section and is the plan's only other
      // text. It is off the parity list, which left it in no test at all:
      // deleting the whole <p className="cc-plan__note"> was invisible to this
      // file. It is asserted here rather than added to PARITY_STRINGS, because
      // that list is a re-agreed specification shared with the Playwright run.
      expect(screen.getByText(d.plan.encouragement)).toBeInTheDocument();
      expect(container.querySelector(".cc-progress__track")).toHaveAttribute(
        "aria-hidden",
        "true"
      );
    });
  });

  describe("heading hierarchy", () => {
    it("has exactly one h1, and it is the greeting", () => {
      render(<PatientToday />);
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent(d.header.greeting);
    });

    it("starts at level 1 and never skips a level going down", () => {
      render(<PatientToday />);
      const levels = screen.getAllByRole("heading").map(headingLevel);

      expect(levels.length).toBeGreaterThan(1);
      expect(levels[0]).toBe(1);
      levels.slice(1).forEach((level, i) => {
        // Jumping back up is fine; going deeper by more than one is a skipped
        // level and leaves a screen reader's outline with a hole in it.
        expect(level - levels[i]).toBeLessThanOrEqual(1);
      });
    });

    it("gives every section a heading that names it as a region", () => {
      render(<PatientToday />);

      // These pass only if each section's aria-labelledby resolves to its
      // heading's id: an unnamed <section> is not exposed as a region at all.
      for (const name of [
        d.plan.heading,
        d.next.eyebrow,
        d.later.heading,
        d.glance.heading,
        d.careTeam.heading,
      ]) {
        expect(screen.getByRole("region", { name })).toBeInTheDocument();
      }
    });
  });

  describe("DOM order", () => {
    /**
     * The desktop layout puts the support cards in a second grid column by
     * PLACING the two wrappers — `.cc-page__main { grid-column: 1 / 2 }` at
     * layout.css:396-398 and `.cc-page__support { grid-column: 2 / 3 }` at
     * layout.css:403-406 — not by moving them in the DOM, so tab order still
     * goes plan-then-support.
     *
     * Naming the mechanism correctly matters, because a rationale that cites
     * the wrong rule is what gets a correct test deleted in the next refactor.
     * `grid-template-areas` is NOT what does this: it appears once in the whole
     * stylesheet, at layout.css:297, placing meta/title/crumbs/action inside
     * the header. PatientToday.jsx:24-27 still names it as the page mechanism
     * and should be corrected to say `grid-column` too.
     *
     * Either way the placement only holds while the support cards come LATER in
     * the document than the plan, which is what these pin down.
     */
    it("places the support flow after the main flow in the document", () => {
      const { container } = render(<PatientToday />);
      const main = container.querySelector(".cc-page__main");
      const support = container.querySelector(".cc-page__support");

      expect(main).not.toBeNull();
      expect(support).not.toBeNull();
      expect(isFollowedBy(main, support)).toBe(true);
      expect(main.contains(support)).toBe(false);
    });

    it("keeps the plan in the main flow and the support cards in the support flow", () => {
      const { container } = render(<PatientToday />);
      const main = container.querySelector(".cc-page__main");
      const support = container.querySelector(".cc-page__support");

      expect(main.contains(screen.getByRole("region", { name: d.plan.heading }))).toBe(true);
      expect(main.contains(screen.getByRole("region", { name: d.later.heading }))).toBe(true);
      expect(support.contains(screen.getByRole("region", { name: d.glance.heading }))).toBe(true);
      expect(support.contains(screen.getByRole("region", { name: d.careTeam.heading }))).toBe(true);
    });

    it("orders the header meta, greeting, breadcrumb and call action", () => {
      const { container } = render(<PatientToday />);
      const header = container.querySelector(".cc-page__header");
      const meta = within(header).getByText(d.header.meta);
      const greeting = within(header).getByRole("heading", { level: 1 });
      const crumbs = within(header).getByRole("navigation", { name: "Breadcrumb" });
      const action = within(header).getByRole("button", {
        name: d.header.callAction,
      });

      // The header is the one place the page lets CSS choose a visual order:
      // layout.css:297 names the areas meta/title/crumbs/action so the action
      // can sit beside the stack on desktop. That makes the DOM order purely a
      // reading order, and therefore the only thing a test can hold it to —
      // swapping the date line and the <h1> changed nothing else in this file.
      expect(isFollowedBy(meta, greeting)).toBe(true);
      expect(isFollowedBy(greeting, crumbs)).toBe(true);
      expect(isFollowedBy(crumbs, action)).toBe(true);
    });

    it("orders the headings greeting, plan, next, later, glance, care team", () => {
      render(<PatientToday />);
      const order = screen
        .getAllByRole("heading")
        .map((h) => h.textContent.trim());

      expect(order).toEqual([
        d.header.greeting,
        d.plan.heading,
        d.next.eyebrow,
        d.later.heading,
        d.glance.heading,
        d.careTeam.heading,
      ]);
    });

    it("puts the support headings after every main-flow heading", () => {
      render(<PatientToday />);
      const later = screen.getByRole("heading", { name: d.later.heading });
      const glance = screen.getByRole("heading", { name: d.glance.heading });
      const care = screen.getByRole("heading", { name: d.careTeam.heading });

      expect(isFollowedBy(later, glance)).toBe(true);
      expect(isFollowedBy(glance, care)).toBe(true);
    });

    it("walks tab focus in reading order, support action last", async () => {
      const user = userEvent.setup();
      render(<PatientToday />);

      const reached = [];
      for (let i = 0; i < 4; i += 1) {
        await user.tab();
        reached.push(document.activeElement.textContent.trim());
      }

      // This is the payoff of the single DOM order: a keyboard user meets the
      // breadcrumb, then the call action, then the plan's action, and only then
      // the supporting column's action — at every width, with no CSS reordering
      // to make the visual column and the tab order disagree.
      expect(reached).toEqual([
        d.header.breadcrumb[0],
        d.header.callAction,
        d.next.action,
        d.careTeam.action,
      ]);
    });
  });

  describe("breadcrumb", () => {
    it("marks only the last crumb as the current page, and not as a link", () => {
      render(<PatientToday />);
      const crumbs = within(
        screen.getByRole("navigation", { name: "Breadcrumb" })
      ).getAllByRole("listitem");

      expect(crumbs).toHaveLength(d.header.breadcrumb.length);
      crumbs.forEach((crumb, i) => {
        const isLast = i === d.header.breadcrumb.length - 1;
        expect(crumb).toHaveTextContent(d.header.breadcrumb[i]);
        expect(crumb.querySelector("a") !== null).toBe(!isLast);
        expect(crumb.querySelector('[aria-current="page"]') !== null).toBe(isLast);
      });
    });

    it("marks the current page exactly once on the whole screen", () => {
      const { container } = render(<PatientToday />);
      const current = container.querySelectorAll("[aria-current]");

      expect(current).toHaveLength(1);
      expect(current[0]).toHaveAttribute("aria-current", "page");
      expect(current[0]).toHaveTextContent(d.header.breadcrumb.at(-1));
    });

    it("links every earlier crumb to the one destination the component hard-codes", () => {
      render(<PatientToday />);
      const earlier = d.header.breadcrumb.slice(0, -1);

      expect(earlier.length).toBeGreaterThan(0);
      earlier.forEach((label) => {
        expect(screen.getByRole("link", { name: label })).toHaveAttribute(
          "href",
          "#home"
        );
      });

      // KNOWN LIMIT, and the reason this is not named "…to their destination":
      // PatientToday.jsx:45 gives EVERY non-last crumb `href="#home"`, because
      // the breadcrumb data carries labels and no destinations. With two crumbs
      // that happens to be right — "Patient account" is the home screen — but a
      // third crumb would link to the wrong page and this loop would still pass,
      // because there is nothing to compare the href against. Closing that needs
      // the data to carry a destination ({ label, href }), which is a source
      // change; until then the loop at least covers EVERY earlier crumb rather
      // than only breadcrumb[0], so it grows when the data does.
    });
  });

  describe("controls and decorative content", () => {
    it("gives each action its visible words as its exact accessible name, in order", () => {
      render(<PatientToday />);
      const actions = [d.header.callAction, d.next.action, d.careTeam.action];

      // The comment this replaced claimed that if an icon ever stopped being
      // aria-hidden its content would join the name and these would go red. It
      // would not. Every icon here is an <svg> holding bare path data and no
      // text, so it contributes nothing to an accessible name whether it is
      // hidden or not — deleting aria-hidden from Icon.jsx leaves all of these
      // green and reddens only "hides every icon…" below, which is the test
      // that genuinely owns that claim. What this one can show is the name and
      // the order, so that is what it says.
      expect(
        screen.getAllByRole("button").map((b) => b.textContent.trim())
      ).toEqual(actions);
      for (const name of actions) {
        expect(screen.getByRole("button", { name })).toHaveAccessibleName(name);
      }
    });

    it("renders no disabled and no aria-disabled control on this screen", () => {
      const { container } = render(<PatientToday />);
      expect(container.querySelector("[aria-disabled]")).toBeNull();
      screen
        .getAllByRole("button")
        .forEach((button) => expect(button).toBeEnabled());
    });

    it("hides every icon from assistive technology and from the tab order", () => {
      const { container } = render(<PatientToday />);
      const icons = container.querySelectorAll("svg");

      expect(icons.length).toBeGreaterThan(0);
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden", "true");
        expect(icon).toHaveAttribute("focusable", "false");
      });
    });

    it("leaves exactly three activatable controls — nothing else is wired", () => {
      render(<PatientToday />);
      // The cut is explicitly static. Three buttons and one breadcrumb link is
      // the whole interactive surface; a fourth would mean something was wired
      // without the data to back it.
      expect(screen.getAllByRole("button")).toHaveLength(3);
      expect(screen.getAllByRole("link")).toHaveLength(1);
    });
  });

  describe("lists", () => {
    it("renders one later-today item per entry, with its time, title and detail", () => {
      render(<PatientToday />);
      const items = within(
        screen.getByRole("region", { name: d.later.heading })
      ).getAllByRole("listitem");

      expect(items).toHaveLength(d.later.items.length);
      items.forEach((item, i) => {
        expect(item).toHaveTextContent(d.later.items[i].time);
        expect(item).toHaveTextContent(d.later.items[i].title);
        expect(item).toHaveTextContent(d.later.items[i].detail);
      });
    });

    it("pairs every glance label with its value as a definition list", () => {
      render(<PatientToday />);
      const glance = screen.getByRole("region", { name: d.glance.heading });

      d.glance.items.forEach((item) => {
        const term = within(glance).getByText(item.label);
        expect(term.tagName).toBe("DT");
        expect(term.nextElementSibling).toHaveTextContent(item.value);
        expect(term.nextElementSibling.tagName).toBe("DD");
      });
    });
  });
});
