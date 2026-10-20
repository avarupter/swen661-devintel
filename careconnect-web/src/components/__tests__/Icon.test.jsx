import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Icon, { Mark } from "../Icon.jsx";
import { DESTINATIONS, patientToday } from "../../data/patientToday.js";

/**
 * What these tests can and cannot see
 * -----------------------------------
 * jsdom renders the markup but draws nothing, so nothing here claims an icon
 * *looks* right. What is checked is the contract the rest of the app leans on:
 * every declared glyph renders geometry, every glyph is hidden from assistive
 * technology and contributes no text to an accessible name, and the colour
 * comes from `currentColor` rather than being baked into the glyph.
 *
 * The glyph list is read out of Icon.jsx at test time instead of being copied
 * here, so a glyph added to PATHS is covered by these tests the moment it is
 * added rather than whenever someone remembers to extend a list.
 */

const COMPONENTS_DIR = join(import.meta.dirname, "..");
const PAGES_DIR = join(import.meta.dirname, "..", "..", "pages");
const ICON_SOURCE = readFileSync(join(COMPONENTS_DIR, "Icon.jsx"), "utf8");

/** The body of the PATHS object literal, as text. */
function pathsBlock(source) {
  const start = source.indexOf("const PATHS = {");
  const end = source.indexOf("\n};", start);
  if (start === -1 || end === -1) {
    throw new Error("Could not find the PATHS object literal in Icon.jsx");
  }
  return source.slice(start, end);
}

/**
 * The keys of the PATHS object literal, parsed out of the source.
 *
 * Only the keys sit at a two-space indent; the JSX inside each value is
 * indented further. Quoted and hyphenated keys count: `"arrow-left":` is an
 * ordinary thing to add to an icon set, and a parser that skipped it would drop
 * that glyph out of every it.each below without anything going red.
 */
function declaredGlyphs(source) {
  const keys = pathsBlock(source).matchAll(/^ {2}(["']?)([A-Za-z][\w$-]*)\1\s*:/gm);
  return [...keys].map((m) => m[2]);
}

/** Every line that merely *looks* like a key, counted as a tripwire. */
function keyLineCount(source) {
  return [...pathsBlock(source).matchAll(/^ {2}[^\s:][^:\n]*:/gm)].length;
}

const GLYPHS = declaredGlyphs(ICON_SOURCE);

/** The names every consumer in the app asks for, so none of them can go stale. */
const NAMES_THE_APP_USES = [
  "home",
  "pill",
  "calendar",
  "chat",
  "help",
  "phone",
  "video",
  "check",
  "shield",
];

const GEOMETRY = "path, rect, circle, ellipse, line, polyline, polygon";

function renderIcon(props) {
  const { container } = render(<Icon {...props} />);
  return container;
}

describe("Icon", () => {
  describe("the glyph set", () => {
    // Guards the parsing above: without these, a regex that quietly stopped
    // matching would turn every it.each below into zero tests and the file
    // would still go green.
    it("parses every glyph the app asks for out of the source", () => {
      expect(GLYPHS).toEqual(expect.arrayContaining(NAMES_THE_APP_USES));
      expect(new Set(GLYPHS).size).toBe(GLYPHS.length);
      // A `GLYPHS.length >= NAMES_THE_APP_USES.length` assertion used to sit
      // here. arrayContaining over a duplicate-free list already implies it, so
      // it held no matter what the parser returned.
    });

    it("parses every key in PATHS, not only the forms it recognises", () => {
      // The guard above catches a TOTAL parse failure. A partial one is worse:
      // add a tenth glyph as `"arrow-left":` and a parser that misses it puts
      // that glyph in no it.each at all -- nothing checks that it renders
      // geometry, is hidden, or uses currentColor -- while the nine known names
      // keep this file green. Counting candidate key lines a looser way and
      // insisting the two agree makes a partial failure as loud as a total one.
      expect(GLYPHS).toHaveLength(keyLineCount(ICON_SOURCE));
    });

    it.each(GLYPHS)("renders %s as an svg with at least one shape element", (name) => {
      const container = renderIcon({ name });
      const svg = container.querySelector("svg");

      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      // An svg with no shapes in it is an empty box, not an icon.
      expect(svg.querySelectorAll(GEOMETRY).length).toBeGreaterThan(0);
    });

    it.each(GLYPHS)("hides %s from assistive technology", (name) => {
      const svg = renderIcon({ name }).querySelector("svg");

      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      // A <title> or <desc> would be read out and would land in the accessible
      // name of whatever control the icon sits in; there is no text at all.
      expect(svg.querySelector("title, desc")).toBeNull();
      expect(svg.textContent).toBe("");
    });

    it.each(GLYPHS)("declares %s as currentColor only, with no per-shape colour", (name) => {
      // jsdom paints nothing, so this is the inheritance contract in markup;
      // the colour that actually lands on screen is measured in the Playwright
      // sweep.
      const svg = renderIcon({ name }).querySelector("svg");

      expect(svg).toHaveAttribute("stroke", "currentColor");
      expect(svg).toHaveAttribute("fill", "none");

      // The glyph itself must not override either: a fill or stroke on a shape
      // would ignore the colour of the control the icon is sitting in.
      for (const shape of svg.querySelectorAll("*")) {
        expect(shape).not.toHaveAttribute("fill");
        expect(shape).not.toHaveAttribute("stroke");
      }
    });
  });

  describe("sizing and styling props", () => {
    it("is 24 square by default", () => {
      const svg = renderIcon({ name: "home" }).querySelector("svg");

      expect(svg).toHaveAttribute("width", "24");
      expect(svg).toHaveAttribute("height", "24");
    });

    it("scales the box to `size` and keeps the 24-unit drawing grid", () => {
      const svg = renderIcon({ name: "home", size: 18 }).querySelector("svg");

      expect(svg).toHaveAttribute("width", "18");
      expect(svg).toHaveAttribute("height", "18");
      // The viewBox must not track `size`, or the geometry would be cropped.
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    });

    it("strokes at 1.8 by default and honours an override", () => {
      const def = renderIcon({ name: "calendar" }).querySelector("svg");
      expect(def).toHaveAttribute("stroke-width", "1.8");

      const thick = renderIcon({ name: "calendar", strokeWidth: 3 }).querySelector("svg");
      expect(thick).toHaveAttribute("stroke-width", "3");
    });

    it("passes className through", () => {
      const svg = renderIcon({ name: "chat", className: "cc-glance__icon" }).querySelector("svg");

      expect(svg).toHaveClass("cc-glance__icon");
    });

    it("sets no class attribute at all when no className is given", () => {
      const svg = renderIcon({ name: "chat" }).querySelector("svg");

      // Guards against the usual `"cc-icon " + className` bug, which ships a
      // literal "undefined" in the class list.
      expect(svg).not.toHaveAttribute("class");
    });
  });

  describe("names it does not have", () => {
    it("renders nothing for an unknown name", () => {
      const container = renderIcon({ name: "stethoscope" });

      expect(container).toBeEmptyDOMElement();
    });

    it.each([
      ["undefined", undefined],
      ["an empty string", ""],
      ["null", null],
    ])("renders nothing when the name is %s", (_label, name) => {
      expect(renderIcon({ name })).toBeEmptyDOMElement();
    });

    it("renders nothing at all for a name inherited from Object.prototype", () => {
      // PATHS is an object literal, so a bare `PATHS[name]` lookup resolves
      // "toString" to a truthy function and sails past `if (!path) return
      // null`, leaving an empty 24x24 svg sitting in the layout. The source now
      // uses Object.hasOwn, so nothing is rendered -- and asserting the
      // container is EMPTY, rather than merely free of geometry, is what tells
      // the two apart. The old "no geometry" assertion passed under both.
      for (const name of ["toString", "constructor", "hasOwnProperty", "valueOf"]) {
        expect(renderIcon({ name }), name).toBeEmptyDOMElement();
      }
    });
  });

  describe("the names the app actually asks for", () => {
    // Icon renders null for a name it does not have, which has no visible
    // symptom and no console warning -- the icon is just missing. These two
    // tests are what turns that into a test failure.
    const dataIconNames = (() => {
      const found = new Set();
      const walk = (value) => {
        if (Array.isArray(value)) return value.forEach(walk);
        if (value && typeof value === "object") {
          for (const [key, child] of Object.entries(value)) {
            if (key === "icon" && typeof child === "string") found.add(child);
            else walk(child);
          }
        }
      };
      walk(DESTINATIONS);
      walk(patientToday);
      return [...found];
    })();

    it("renders every icon named in data/patientToday.js", () => {
      expect(dataIconNames.length).toBeGreaterThan(0);

      for (const name of dataIconNames) {
        expect(GLYPHS, `data asks for an icon named "${name}"`).toContain(name);
        expect(renderIcon({ name }).querySelectorAll(GEOMETRY).length).toBeGreaterThan(0);
      }
    });

    it("renders every icon name written literally in a component or page", () => {
      const literals = new Set();

      for (const dir of [COMPONENTS_DIR, PAGES_DIR]) {
        for (const file of readdirSync(dir).filter((f) => f.endsWith(".jsx"))) {
          const source = readFileSync(join(dir, file), "utf8");
          for (const m of source.matchAll(/<Icon\b[^>]*?\bname="([^"]+)"/g)) literals.add(m[1]);
          // <Button icon="phone"> hands its string straight to Icon.
          for (const m of source.matchAll(/\bicon="([^"]+)"/g)) literals.add(m[1]);
        }
      }

      expect(literals.size).toBeGreaterThan(0);

      for (const name of literals) {
        expect(GLYPHS, `a component asks for an icon named "${name}"`).toContain(name);
      }
    });
  });

  describe("Mark", () => {
    it("is 40 square by default and scales without cropping", () => {
      const def = render(<Mark />).container.querySelector("svg");
      expect(def).toHaveAttribute("width", "40");
      expect(def).toHaveAttribute("height", "40");
      expect(def).toHaveAttribute("viewBox", "0 0 40 40");

      const small = render(<Mark size={28} />).container.querySelector("svg");
      expect(small).toHaveAttribute("width", "28");
      expect(small).toHaveAttribute("height", "28");
      expect(small).toHaveAttribute("viewBox", "0 0 40 40");
    });

    it("is decorative: hidden, unfocusable, and contributes no text", () => {
      const { container } = render(<Mark />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      expect(svg.querySelector("title, desc")).toBeNull();
      expect(container.textContent).toBe("");
    });

    it("takes both brand references from the token, with #fff the only baked hex", () => {
      // The mark is one of only two sanctioned uses of --cc-brand, and it has
      // to move when the token moves. jsdom paints nothing: what the mark looks
      // like is the Playwright sweep's job, this is the markup contract.
      const { container } = render(<Mark />);

      // Named elements, not "some attribute somewhere". Flattening every
      // attribute value and asking toContain made either reference satisfy the
      // assertion on its own, so hard-coding one of the two stayed green.
      expect(container.querySelector("rect")).toHaveAttribute("fill", "var(--cc-brand)");
      expect(container.querySelector("path[stroke]")).toHaveAttribute(
        "stroke",
        "var(--cc-brand)",
      );

      // The white heart is the one colour written literally. Listing the hexes
      // beats excluding today's value of --cc-brand: #1a73e8 was hand-copied
      // out of tokens.css with no link back, so retuning the token (it clears
      // AA by 0.01 and is a change candidate) would have quietly made that
      // assertion unfalsifiable. This one keeps working, and still fails if a
      // second literal colour appears.
      const hexes = [...container.querySelectorAll("*")]
        .flatMap((el) => [...el.attributes].map((a) => a.value))
        .filter((value) => value.startsWith("#"));

      expect(hexes).toEqual(["#fff"]);
    });

    it("contains shape elements, not an empty box", () => {
      const { container } = render(<Mark />);

      expect(container.querySelectorAll(GEOMETRY).length).toBeGreaterThan(0);
    });
  });
});
