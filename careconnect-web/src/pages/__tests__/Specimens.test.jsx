import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import Specimens from "../Specimens.jsx";
import {
  COLOR_TOKENS,
  STATUS_BADGES,
  TYPE_STEPS,
} from "../../data/foundations.js";

/**
 * The foundations & component-states sheet.
 *
 * Two things shape how this file is written:
 *
 * 1. `measure()` is memoised at MODULE scope, so the first render in this file
 *    decides every caption for the rest of it. The custom properties and the
 *    type metrics are therefore seeded in a top-level beforeAll, which runs
 *    before any render, and the memo itself is asserted rather than worked
 *    around. The one test that needs an UNmemoised read imports a second copy
 *    of the module after `vi.resetModules()`.
 *
 * 2. The seeded values below are deliberately NOT the real palette and NOT the
 *    real type scale. The sheet's whole point is that it echoes whatever the
 *    stylesheet resolves to, so the test gives it values no stylesheet would
 *    ever contain and checks they come back out. Vitest loads no CSS
 *    (`css: false`), so without seeding jsdom returns an empty string for every
 *    custom property and a flat `16px / normal · 400` for every type step —
 *    which would make both the hex and the metric assertions vacuous.
 *
 * What this file CANNOT prove: jsdom has no layout engine, so nothing here
 * knows what a specimen looks like. That a focus ring is visible, that a tone
 * is distinguishable, that the disabled fill meets contrast, and that the
 * metrics above are the REAL ones are all measured in Chromium by the
 * Playwright verification script.
 */
const SEEDED = Object.fromEntries(
  COLOR_TOKENS.map((c, i) => [
    c.token,
    `#aa00${String(i + 1).padStart(2, "0")}`,
  ])
);

/**
 * Unreal, and different for every step: a hard-coded metric string in
 * `measure()` cannot produce these, and neither can reading the wrong step's
 * element. 451 is not a font weight any designer has ever typed.
 */
const SEEDED_TYPE = Object.fromEntries(
  TYPE_STEPS.map((t, i) => [
    t.className,
    { fontSize: `${41 + i}px`, lineHeight: `${53 + i}px`, fontWeight: `${451 + i}` },
  ])
);

const metricFor = (className) => {
  const m = SEEDED_TYPE[className];
  return `${m.fontSize} / ${m.lineHeight} · ${m.fontWeight}`;
};

let typeStyle;

beforeAll(() => {
  for (const [token, value] of Object.entries(SEEDED)) {
    document.documentElement.style.setProperty(token, value);
  }
  typeStyle = document.createElement("style");
  typeStyle.textContent = Object.entries(SEEDED_TYPE)
    .map(
      ([className, m]) =>
        `.${className}{font-size:${m.fontSize};line-height:${m.lineHeight};font-weight:${m.fontWeight};}`
    )
    .join("\n");
  document.head.append(typeStyle);
});

afterAll(() => {
  for (const token of Object.keys(SEEDED)) {
    document.documentElement.style.removeProperty(token);
  }
  typeStyle.remove();
});

const region = (name) => screen.getByRole("region", { name });
const navLinkFor = (label) =>
  screen.getByText(label).closest(".cc-nav__link");
const captionOf = (li) => li.querySelector(".cc-sheet__meta").textContent;
const typeRows = () => within(region("Type")).getAllByRole("listitem");

// The sheet writes the label with a curly apostrophe (`I&rsquo;m ready`), so a
// straight one here would silently never match.
const READY = "I’m ready";

const LEDE =
  "Every state below is a static specimen rendered by the same components " +
  "the Patient Today screen uses. They are examples of the interface, not " +
  "a record of anyone’s care.";

describe("Specimens", () => {
  describe("colour", () => {
    it("renders one swatch per colour token, named and with its role", () => {
      render(<Specimens />);
      const swatches = within(region("Colour")).getAllByRole("listitem");

      expect(swatches).toHaveLength(COLOR_TOKENS.length);
      swatches.forEach((swatch, i) => {
        const { token, role } = COLOR_TOKENS[i];
        // The caption drops the `--cc-` prefix, so `--cc-primary` reads "primary".
        expect(swatch).toHaveTextContent(token.replace("--cc-", ""));
        expect(swatch).toHaveTextContent(role);
      });
    });

    it("reads each hex from the live computed styles rather than a copy", () => {
      // Fail loudly here rather than in the swatch assertions if a future jsdom
      // stops resolving custom properties: that would be a harness problem, not
      // a component one.
      expect(
        getComputedStyle(document.documentElement).getPropertyValue(
          COLOR_TOKENS[0].token
        )
      ).toBe(SEEDED[COLOR_TOKENS[0].token]);

      render(<Specimens />);
      const swatches = within(region("Colour")).getAllByRole("listitem");

      swatches.forEach((swatch, i) => {
        const { token } = COLOR_TOKENS[i];
        // Uppercased by measure(), so this also pins the normalisation.
        expect(swatch).toHaveTextContent(SEEDED[token].toUpperCase());
      });
    });

    it("prints a shorthand hex at full six-digit width", async () => {
      // The production CSS minifier rewrites #ffffff as #fff, so a built bundle
      // hands measure() a three-digit value where dev hands it six. Both are
      // truthful, but a reference sheet that prints #FFF beside #F7F9FC is
      // reporting the minifier rather than the palette. Caught by the Chromium
      // sweep against `npm run preview`, which jsdom could not have seen —
      // vitest never runs the minifier.
      vi.resetModules();
      document.documentElement.style.setProperty(COLOR_TOKENS[0].token, "#abc");
      try {
        const { default: Shorthand } = await import("../Specimens.jsx");
        const { container } = render(<Shorthand />);
        expect(container.querySelector(".cc-swatch__hex").textContent).toBe("#AABBCC");
      } finally {
        document.documentElement.style.setProperty(
          COLOR_TOKENS[0].token,
          SEEDED[COLOR_TOKENS[0].token]
        );
        vi.resetModules();
      }
    });

    it("keeps the hex slot even when the token resolves to nothing", async () => {
      // The old version of this test only counted `.cc-swatch__hex` elements
      // while beforeAll had seeded every token, so the "unresolved" half of its
      // name was never exercised — wrapping the span in a truthiness check left
      // it green. measure() memoises at module scope, so the only way to see an
      // UNSEEDED read is a second copy of the module whose memo has not run.
      // The statically imported `Specimens` keeps its own memo, so the tests
      // after this one are unaffected.
      vi.resetModules();
      document.documentElement.style.removeProperty(COLOR_TOKENS[0].token);
      try {
        const { default: Unseeded } = await import("../Specimens.jsx");
        const { container } = render(<Unseeded />);
        const hexes = container.querySelectorAll(".cc-swatch__hex");

        expect(hexes).toHaveLength(COLOR_TOKENS.length);
        // The slot is unconditional: the swatch whose token resolves to nothing
        // still gets its element, so the three-line caption keeps its shape
        // instead of collapsing and shifting the role line up.
        expect(hexes[0]).toBeInTheDocument();
        expect(hexes[0].textContent).toBe("");
        // ...and only that one is empty, which is what proves the empty string
        // came from the removed token and not from the re-import itself.
        expect(hexes[1].textContent).toBe(
          SEEDED[COLOR_TOKENS[1].token].toUpperCase()
        );
      } finally {
        document.documentElement.style.setProperty(
          COLOR_TOKENS[0].token,
          SEEDED[COLOR_TOKENS[0].token]
        );
      }
    });

    it("renders a note only for the tokens that carry one", () => {
      const { container } = render(<Specimens />);
      const withNotes = COLOR_TOKENS.filter((c) => c.note);

      // Not every token has a note — `--cc-canvas` and `--cc-surface` do not —
      // so an unconditional note element would render empty captions.
      expect(withNotes.length).toBeLessThan(COLOR_TOKENS.length);
      expect(container.querySelectorAll(".cc-swatch__note")).toHaveLength(
        withNotes.length
      );
      withNotes.forEach((c) => {
        expect(screen.getByText(c.note)).toBeInTheDocument();
      });
    });

    it("keeps the chip itself out of the accessible name", () => {
      const { container } = render(<Specimens />);
      const chips = container.querySelectorAll(".cc-swatch__chip");

      expect(chips).toHaveLength(COLOR_TOKENS.length);
      chips.forEach((chip) => {
        expect(chip).toHaveAttribute("aria-hidden", "true");
        expect(chip).toHaveTextContent("");
      });
    });
  });

  describe("type", () => {
    it("renders one row per type step, with its sample set in that step", () => {
      render(<Specimens />);
      const rows = typeRows();

      expect(rows).toHaveLength(TYPE_STEPS.length);
      rows.forEach((row, i) => {
        const step = TYPE_STEPS[i];
        expect(row).toHaveTextContent(step.sample);
        // The sample must actually be set in the step it illustrates, or the
        // row is a caption with nothing to caption.
        expect(
          within(row).getByText(step.sample, { selector: `.${step.className}` })
        ).toBeInTheDocument();
      });
    });

    it("reports each step's own measured metrics, not a constant", () => {
      render(<Specimens />);
      const rows = typeRows();

      expect(rows).toHaveLength(TYPE_STEPS.length);
      TYPE_STEPS.forEach((step, i) => {
        // The seeded metrics are unreal and distinct per step, so the exact
        // caption is asserted rather than its shape. The shape regex this
        // replaced matched jsdom's unstyled `16px / normal · 400` for every
        // row, which meant hard-coding the metric string inside measure() —
        // exactly the drift the sheet exists to prevent — stayed green.
        expect(captionOf(rows[i])).toBe(
          `${step.name} · ${metricFor(step.className)}` +
            (step.note ? ` · ${step.note}` : "")
        );
      });
    });

    it("appends the note only where a step has one", () => {
      render(<Specimens />);
      const rows = typeRows();

      TYPE_STEPS.forEach((step, i) => {
        // name · size/leading · weight  → three segments, plus a fourth only
        // when the step carries a note. A stray trailing separator shows up
        // here as an empty fourth segment.
        const segments = captionOf(rows[i]).split(" · ");
        expect(segments).toHaveLength(step.note ? 4 : 3);
        expect(segments[0]).toBe(step.name);
        if (step.note) expect(segments[3]).toBe(step.note);
      });
      expect(TYPE_STEPS.some((t) => !t.note)).toBe(true);
      expect(TYPE_STEPS.some((t) => t.note)).toBe(true);
    });
  });

  describe("measure()", () => {
    it("measures once per page load — the memo is module scope", () => {
      const first = render(<Specimens />);
      const before = within(region("Colour"))
        .getAllByRole("listitem")[0]
        .textContent;
      first.unmount();

      document.documentElement.style.setProperty(
        COLOR_TOKENS[0].token,
        "#ff00ff"
      );
      render(<Specimens />);
      const after = within(region("Colour"))
        .getAllByRole("listitem")[0]
        .textContent;

      // The values cannot change without a reload, which is why they are not
      // held in state. A fresh read on every render would show the new value.
      expect(after).toBe(before);
      expect(after).not.toContain("FF00FF");

      document.documentElement.style.setProperty(
        COLOR_TOKENS[0].token,
        SEEDED[COLOR_TOKENS[0].token]
      );
    });

    it("leaves no probe element behind in the document", () => {
      render(<Specimens />);
      // measure() appends a <p>probe</p> to read the type steps and removes it
      // in the same call, so React never sees a node it did not write. Cleanup
      // between tests would not remove it, so a leak would persist and be found
      // here whichever test rendered first.
      expect(screen.queryByText("probe")).toBeNull();
    });
  });

  describe("navigation specimens", () => {
    it("renders the default and selected states as pictures, not links", () => {
      render(<Specimens />);

      for (const label of ["Medications", "Home"]) {
        expect(screen.queryByRole("link", { name: label })).toBeNull();
        const picture = navLinkFor(label);
        expect(picture.tagName).toBe("SPAN");
        expect(picture).not.toHaveAttribute("href");
        expect(picture).not.toHaveAttribute("tabindex");
      }
    });

    it("pairs every navigation caption with the specimen it describes", () => {
      render(<Specimens />);
      const items = within(region("Navigation")).getAllByRole("listitem");
      // NOTE for whoever owns the copy: the selected caption below promises
      // `aria-current="page"`, and the sheet deliberately does NOT set it (see
      // "never claims the sheet is the current page"). The caption is the thing
      // that is wrong, not the markup. Pinning it here is what will make the
      // mismatch impossible to miss when the wording is corrected.
      const expected = [
        { caption: "Default", label: "Medications", tag: "SPAN", selected: false },
        {
          caption: 'Selected · tint plus aria-current="page"',
          label: "Home",
          tag: "SPAN",
          selected: true,
        },
        {
          caption: "Keyboard focus · distinct from selection press Tab",
          label: "Appointments",
          tag: "A",
          selected: false,
        },
      ];

      expect(items).toHaveLength(expected.length);
      items.forEach((li, i) => {
        const spec = expected[i];
        expect(captionOf(li)).toBe(spec.caption);
        const specimen = li.querySelector(".cc-nav__link");
        expect(within(li).getByText(spec.label)).toBe(
          specimen.querySelector(".cc-nav__label")
        );
        expect(specimen.tagName).toBe(spec.tag);
        // The tint is the whole difference between the default and selected
        // pictures, and it is the class that draws it.
        expect(specimen.classList.contains("is-current")).toBe(spec.selected);
      });
    });

    it("cannot focus a picture specimen", () => {
      render(<Specimens />);
      const picture = navLinkFor("Home");

      picture.focus();
      // A bare span is not a focusable area, so focus stays where it was. This
      // is the point of rendering a picture as a span: a screenshot of the
      // selected state cannot be tabbed into or activated.
      expect(picture).not.toHaveFocus();
      expect(document.activeElement).toBe(document.body);
    });

    it("never claims the sheet is the current page", () => {
      const { container } = render(<Specimens />);
      // The selected specimen shows the tint that normally accompanies
      // aria-current. Setting the attribute here would tell a screen reader the
      // foundations sheet is Medications, or Home, or all five at once.
      expect(container.querySelector("[aria-current]")).toBeNull();
    });

    it("renders the focus specimen as a real link", () => {
      render(<Specimens />);
      // Real, because a :focus-visible ring cannot be screenshotted without
      // something genuinely taking focus.
      const link = screen.getByRole("link", { name: "Appointments" });
      expect(link).toHaveAttribute("href", "#specimens");
      link.focus();
      expect(link).toHaveFocus();
    });

    it("is the only link on the sheet", () => {
      render(<Specimens />);
      expect(screen.getAllByRole("link")).toHaveLength(1);
    });
  });

  describe("buttons", () => {
    it("pairs every button caption with the specimen it describes", () => {
      render(<Specimens />);
      const items = within(region("Buttons")).getAllByRole("listitem");
      // Counting specimens is not enough on a sheet like this: swapping the
      // "default" and "disabled" captions tells a reader the enabled button is
      // the disabled one, and a count stays green through it. The caption-to-
      // specimen pairing IS the product a specimen sheet ships.
      const expected = [
        { caption: "Primary · default", name: READY, variant: "cc-btn--primary", disabled: false, icon: false },
        { caption: "Primary · keyboard focus press Tab", name: READY, variant: "cc-btn--primary", disabled: false, icon: false },
        { caption: "Primary · disabled, not actionable", name: READY, variant: "cc-btn--primary", disabled: true, icon: false },
        { caption: "Secondary · default", name: "Message care team", variant: "cc-btn--secondary", disabled: false, icon: true },
      ];

      expect(items).toHaveLength(expected.length);
      items.forEach((li, i) => {
        const spec = expected[i];
        expect(captionOf(li)).toBe(spec.caption);
        const btn = within(li).getByRole("button");
        expect(btn).toHaveAccessibleName(spec.name);
        expect(btn).toHaveClass(spec.variant);
        expect(btn.getAttribute("aria-disabled")).toBe(
          spec.disabled ? "true" : null
        );
        expect(btn.querySelector("svg") !== null).toBe(spec.icon);
      });
    });

    it("disables exactly one button, and keeps it focusable so the state can be seen", () => {
      render(<Specimens />);
      const buttons = within(region("Buttons")).getAllByRole("button");

      expect(buttons).toHaveLength(4);
      const disabled = buttons.filter(
        (b) => b.getAttribute("aria-disabled") === "true"
      );
      expect(disabled).toHaveLength(1);

      // The specimen exists to show that a disabled label still reads. The
      // native attribute would make it unreachable by keyboard, so it could
      // not be focused to demonstrate that at all.
      expect(disabled[0]).not.toBeDisabled();
      disabled[0].focus();
      expect(disabled[0]).toHaveFocus();
    });

    it("pairs the disabled button with the caption that names the state", () => {
      render(<Specimens />);
      const li = within(region("Buttons"))
        .getAllByRole("listitem")
        .find((el) => el.textContent.includes("disabled"));

      expect(li).toBeDefined();
      expect(within(li).getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("gives the secondary specimen its visible words as its accessible name", () => {
      render(<Specimens />);
      const btn = screen.getByRole("button", { name: "Message care team" });

      // The old name said "not its icon", which nothing here could show: an
      // <svg> of bare path data carries no text, so it never joins the
      // accessible name whether or not it is hidden. What IS worth pinning is
      // that this specimen is the one that HAS an icon — that is what makes it
      // the secondary specimen rather than a fourth primary — and that the icon
      // is hidden at this control, not merely somewhere on the page.
      expect(btn).toHaveAccessibleName("Message care team");
      expect(btn.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("text fields", () => {
    it("pairs every field caption with the specimen it describes", () => {
      render(<Specimens />);
      const items = within(region("Text fields")).getAllByRole("listitem");
      const expected = [
        { caption: "Default", invalid: false, disabled: false, says: "Give your care team a short summary." },
        { caption: "Keyboard focus press Tab", invalid: false, disabled: false, says: "Give your care team a short summary." },
        { caption: "Error · stated in words, not colour alone", invalid: true, disabled: false, says: "Error: Enter a subject before sending." },
        { caption: "Disabled · label stays legible", invalid: false, disabled: true, says: "Messaging is unavailable in this example." },
      ];

      expect(items).toHaveLength(expected.length);
      items.forEach((li, i) => {
        const spec = expected[i];
        expect(captionOf(li)).toBe(spec.caption);
        const input = within(li).getByLabelText("Message subject");
        expect(input.getAttribute("aria-invalid")).toBe(
          spec.invalid ? "true" : null
        );
        expect(input.disabled).toBe(spec.disabled);
        expect(li).toHaveTextContent(spec.says);
      });
    });

    it("gives each field its own id, so four identical labels still wire up", () => {
      render(<Specimens />);
      const inputs = screen.getAllByLabelText("Message subject");

      // Four fields share a label string here, which is exactly the case a
      // hard-coded id would break: every label would point at the first input.
      expect(inputs).toHaveLength(4);
      expect(new Set(inputs.map((i) => i.id)).size).toBe(4);
      inputs.forEach((input) => {
        expect(input.id).toBeTruthy();
        expect(document.querySelector(`label[for="${input.id}"]`)).toHaveTextContent(
          "Message subject"
        );
      });
    });

    it("marks only the error field invalid, and describes it in words", () => {
      render(<Specimens />);
      const [defaultField, , errorField] = screen.getAllByLabelText(
        "Message subject"
      );

      expect(errorField).toHaveAttribute("aria-invalid", "true");
      const describedBy = errorField.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy)).toHaveTextContent(
        "Error: Enter a subject before sending."
      );

      expect(defaultField).not.toHaveAttribute("aria-invalid");
      expect(
        document.getElementById(defaultField.getAttribute("aria-describedby"))
      ).toHaveTextContent("Give your care team a short summary.");
    });

    it("is not a live region", () => {
      const { container } = render(<Specimens />);
      // With nothing wired there is no validation event to announce, and a live
      // region would announce on first render — README, departure 3.
      expect(container.querySelector("[aria-live]")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("disables the disabled field with the native attribute", () => {
      render(<Specimens />);
      const fields = screen.getAllByLabelText("Message subject");

      expect(fields.filter((f) => f.disabled)).toHaveLength(1);
      expect(fields.at(-1)).toBeDisabled();
      expect(fields.at(-1)).not.toHaveAttribute("aria-disabled");
      // The label has to stay legible and readable, not disappear.
      expect(
        document.querySelector(`label[for="${fields.at(-1).id}"]`)
      ).toBeInTheDocument();
    });
  });

  describe("tab order across the whole sheet", () => {
    it("reaches the aria-disabled button but not the native-disabled field or the two pictures", async () => {
      const user = userEvent.setup();
      render(<Specimens />);
      const buttons = screen.getAllByRole("button");
      const fields = screen.getAllByLabelText("Message subject");
      const link = screen.getByRole("link", { name: "Appointments" });

      // Walk the WHOLE sheet from the top rather than one step from the error
      // field: the Buttons section sits before that field, so a one-step walk
      // never had either disabled button inside the window it tested and stayed
      // green with `disabled` removed from the specimen entirely.
      const expected = [...buttons, ...fields.slice(0, 3), link];
      expect(buttons).toHaveLength(4);
      expect(expected).toHaveLength(8);

      const reached = [];
      for (let i = 0; i < expected.length; i += 1) {
        await user.tab();
        reached.push(document.activeElement);
      }

      // All four buttons, the disabled one included: it is aria-disabled with
      // its handler detached, so it stays in the sequence and a keyboard user
      // can land on it and hear its label — which is the only way the specimen
      // can demonstrate anything. The FIELD is the opposite case: natively
      // disabled, so it is skipped, as are the two <span> pictures.
      reached.forEach((el, i) => expect(el).toBe(expected[i]));
      expect(reached).not.toContain(fields.at(-1));
      expect(reached).not.toContain(navLinkFor("Medications"));
      expect(reached).not.toContain(navLinkFor("Home"));

      // One more tab leaves the page, so nothing else on the sheet is focusable.
      await user.tab();
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe("status badges", () => {
    it("renders one badge per status, each in its own tone", () => {
      render(<Specimens />);
      const badges = within(region("Status badges")).getAllByRole("listitem");

      expect(badges).toHaveLength(STATUS_BADGES.length);
      badges.forEach((badge, i) => {
        const { label, tone } = STATUS_BADGES[i];
        // Labels, not tones alone: "Taken" and "Ready" share a tone, so a
        // de-duplicated render would still look plausible and would be wrong.
        expect(badge).toHaveTextContent(label);
        // ...and tones, not labels alone: dropping `tone={b.tone}` collapses
        // all five to neutral, which a label-only check cannot see. The check
        // mark is the rendered consequence the section's own lede promises, so
        // it is asserted as an output rather than as a class on its own.
        expect(badge.firstElementChild).toHaveClass(`cc-badge--${tone}`);
        expect(badge.querySelector("svg") !== null).toBe(tone === "success");
      });
      expect(STATUS_BADGES.filter((b) => b.tone === "success")).toHaveLength(2);
    });

    it("renders them as information, not as controls", () => {
      render(<Specimens />);
      const badges = region("Status badges");

      expect(within(badges).queryAllByRole("button")).toHaveLength(0);
      expect(within(badges).queryAllByRole("link")).toHaveLength(0);
    });
  });

  describe("page structure", () => {
    it("has one h1 and names every group as a region", () => {
      render(<Specimens />);

      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(
        screen.getByRole("heading", { level: 1 })
      ).toHaveTextContent("Foundations & component states");

      for (const name of [
        "Colour",
        "Type",
        "Buttons",
        "Text fields",
        "Navigation",
        "Status badges",
      ]) {
        expect(region(name)).toBeInTheDocument();
      }
    });

    it("says on the page that the specimens are not anyone's care record", () => {
      render(<Specimens />);
      // The one sentence telling a reader that the names, times and messages
      // below are examples and not a patient's data. It is the sheet's only
      // safeguard against being read as a record, so it is pinned verbatim
      // rather than left to survive on the goodwill of the next copy edit.
      expect(screen.getByText(LEDE)).toBeInTheDocument();
    });

    it("never skips a heading level", () => {
      render(<Specimens />);
      const levels = screen
        .getAllByRole("heading")
        .map((h) => Number(h.tagName.slice(1)));

      expect(levels[0]).toBe(1);
      levels.slice(1).forEach((level, i) => {
        expect(level - levels[i]).toBeLessThanOrEqual(1);
      });
    });

    it("hides every icon on the sheet from assistive technology", () => {
      const { container } = render(<Specimens />);
      const icons = container.querySelectorAll("svg");

      expect(icons.length).toBeGreaterThan(0);
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden", "true");
        expect(icon).toHaveAttribute("focusable", "false");
      });
    });
  });
});
