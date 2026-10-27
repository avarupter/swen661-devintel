import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import Badge from "../../components/Badge.jsx";
import { COLOR_TOKENS, STATUS_BADGES, TYPE_STEPS } from "../foundations.js";

/**
 * foundations.js is a list of NAMES — token names, class names, tone names —
 * and every one of them is a promise about a file somewhere else. A renamed
 * token is the realistic failure and it is completely silent: `var(--cc-primry)`
 * resolves to nothing, the swatch chip renders transparent, the caption reads
 * empty, and the sheet still looks like a design system. So each name is
 * cross-checked against the file that is supposed to define it, read from disk
 * at run time rather than duplicated here — a duplicated list would agree with
 * itself forever.
 *
 * (The stylesheets are read as text rather than queried through
 * getComputedStyle because vitest runs with `css: false` and jsdom resolves no
 * custom properties: every token would come back as the empty string, so a
 * computed-style check here would pass whatever the name was. The real values
 * are measured in Chromium by the Playwright verification script.)
 */

// Resolved with fileURLToPath rather than `new URL(path, import.meta.url)`:
// Vite rewrites that pattern into an asset URL (it comes back as
// http://localhost/src/styles/..., which is not readable from disk), so the
// familiar ESM idiom quietly yields nothing here.
const STYLES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "styles");

const sheet = (name) => {
  const css = readFileSync(join(STYLES_DIR, name), "utf8");
  // A read that comes back empty would make the reverse-direction checks below
  // vacuous, so fail loudly instead.
  if (css.trim() === "") throw new Error(`${name} read as empty`);
  // Comments quote token names and sizes in prose; strip them so a name merely
  // discussed is never mistaken for a name declared.
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
};

const TOKENS_CSS = sheet("tokens.css");
const TYPE_CSS = sheet("type.css");
const COMPONENTS_CSS = sheet("components.css");

/**
 * Custom properties actually declared, as name -> every value declared for it.
 *
 * Every value, not the last one: a token may legitimately be redefined for a
 * subtree — `.cc-card--soft` promotes --cc-muted to --cc-text so muted body
 * copy on the soft surface clears AA — and the :root hex is still the one the
 * swatch paints.
 */
function declaredCustomProperties(css) {
  const found = new Map();
  for (const [, name, value] of css.matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) {
    found.set(name, [...(found.get(name) ?? []), value.trim()]);
  }
  return found;
}

/** Flat class rules, as class name -> the declarations inside the braces. */
function declaredClassRules(css) {
  const found = new Map();
  for (const [, name, body] of css.matchAll(/\.([A-Za-z0-9_-]+)\s*\{([^}]*)\}/g)) {
    found.set(name, body);
  }
  return found;
}

const TOKENS = declaredCustomProperties(TOKENS_CSS);
const TYPE_CLASSES = declaredClassRules(TYPE_CSS);

/**
 * The palette as the stylesheet declares it: every `--cc-*` set to a literal
 * hex inside a `:root` block, as a set of names.
 *
 * `:root` only, deliberately. A token redefined for a subtree — `.cc-card--soft`
 * promoting --cc-muted — is an exception to the palette, not an entry in it,
 * and has no business asking for a swatch of its own.
 */
function rootColourTokens(css) {
  const names = new Set();
  for (const [, block] of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const [, name, value] of block.matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) {
      if (/^#[0-9a-fA-F]{3,8}$/.test(value.trim())) names.add(name);
    }
  }
  return names;
}

const ROOT_COLOURS = rootColourTokens(TOKENS_CSS);

/**
 * Declared colours that deliberately get no chip of their own.
 *
 * --cc-success-bg and --cc-error-bg are the tints the success and error badges
 * sit on. The board reviews them as half of a pair — the contrast figure on
 * --cc-success reads "5.31:1 on its own tint" — rather than as colours anyone
 * would use alone, so they are captioned with their foreground token instead of
 * duplicated as two more swatches. Written down here so the omission is a
 * decision rather than an oversight.
 */
const NOT_SWATCHED = ["--cc-success-bg", "--cc-error-bg"];

describe("COLOR_TOKENS", () => {
  it("names only custom properties that tokens.css declares", () => {
    const undeclared = COLOR_TOKENS.filter((c) => !TOKENS.has(c.token)).map(
      (c) => c.token,
    );

    expect(undeclared).toEqual([]);
  });

  it("shows a swatch for every colour tokens.css declares", () => {
    // The mirror of the check above, and the quieter half. A listed token that
    // is undeclared at least renders a transparent chip someone might notice;
    // a NEW brand colour with no entry here never reaches the sheet at all, so
    // it ships with no swatch, no caption and no contrast evidence. The
    // STATUS_BADGES block below states the same rationale for tones: a value
    // nobody can see, review or screenshot is not covered by the handoff.
    expect(ROOT_COLOURS.size).toBeGreaterThan(0); // the scan still finds the palette

    const listed = new Set(COLOR_TOKENS.map((c) => c.token));
    const unswatched = [...ROOT_COLOURS].filter(
      (token) => !listed.has(token) && !NOT_SWATCHED.includes(token),
    );
    expect(unswatched).toEqual([]);

    // An exemption that no longer names a declared token is a hole that would
    // reopen in silence the day the name comes back.
    expect(NOT_SWATCHED.filter((token) => !ROOT_COLOURS.has(token))).toEqual([]);
  });

  it("names colour tokens, not spacing or type tokens", () => {
    // A swatch paints `background: var(--token)`. Pointed at --cc-space-4 it
    // would render an invalid background and caption it as a colour.
    const notAColour = COLOR_TOKENS.filter(
      (c) => !(TOKENS.get(c.token) ?? []).some((v) => /^#[0-9a-fA-F]{3,8}$/.test(v)),
    ).map((c) => `${c.token}: ${(TOKENS.get(c.token) ?? []).join(" | ")}`);

    expect(notAColour).toEqual([]);
  });

  it("lists each token once and states the role the board assigns it", () => {
    const names = COLOR_TOKENS.map((c) => c.token);
    expect(new Set(names).size).toBe(names.length); // also the React key

    const roleless = COLOR_TOKENS.filter(
      (c) => typeof c.role !== "string" || c.role.trim() === "",
    ).map((c) => c.token);
    expect(roleless).toEqual([]);
  });
});

describe("TYPE_STEPS", () => {
  it("names only classes that type.css declares", () => {
    const undeclared = TYPE_STEPS.filter(
      (t) => !TYPE_CLASSES.has(t.className),
    ).map((t) => t.className);

    expect(undeclared).toEqual([]);
  });

  it("names classes that actually set a size, not colour or weight modifiers", () => {
    // type.css is the only file permitted to declare font-size, and a type
    // specimen whose class sets none is a row that silently shows body text
    // while captioning itself as another step. `.cc-muted` and
    // `.cc-weight-bold` are real classes in the same file and would otherwise
    // sail through the check above.
    const sizeless = TYPE_STEPS.filter(
      (t) => !/font-size\s*:/.test(TYPE_CLASSES.get(t.className) ?? ""),
    ).map((t) => t.className);

    expect(sizeless).toEqual([]);
  });

  it("gives each step a unique class and a sample to set", () => {
    const names = TYPE_STEPS.map((t) => t.className);
    expect(new Set(names).size).toBe(names.length); // also the React key

    const unusable = TYPE_STEPS.filter(
      (t) =>
        typeof t.name !== "string" ||
        t.name.trim() === "" ||
        typeof t.sample !== "string" ||
        t.sample.trim() === "",
    ).map((t) => t.className);
    expect(unusable).toEqual([]);
  });
});

describe("the deliberate absence of values", () => {
  it("carries no hex colour anywhere", () => {
    // The sheet reads hexes from the live computed styles precisely so a
    // caption cannot claim a colour the stylesheet no longer uses. One copied
    // hex in here reintroduces exactly the drift that design is meant to
    // prevent, and it would look authoritative while being wrong.
    const serialised = JSON.stringify({ COLOR_TOKENS, TYPE_STEPS, STATUS_BADGES });

    expect(serialised.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g)).toBeNull();
  });

  it("carries no measured value as a field on any entry", () => {
    // The metrics are measured, so they must not be storable. A whitelist is
    // the pin: `hex`, `rgb`, `size` or `lineHeight` arriving as a field is the
    // shape this module exists to refuse, whatever it is called. (Prose notes
    // may mention 28px — a note is editorial, a field is a value the sheet
    // would print instead of measuring.)
    const extraKeys = (entries, allowed) =>
      entries.flatMap((entry) =>
        Object.keys(entry).filter((key) => !allowed.includes(key)),
      );

    expect(extraKeys(COLOR_TOKENS, ["token", "role", "note"])).toEqual([]);
    expect(extraKeys(TYPE_STEPS, ["className", "name", "sample", "note"])).toEqual([]);
    expect(extraKeys(STATUS_BADGES, ["tone", "label"])).toEqual([]);
  });
});

describe("STATUS_BADGES", () => {
  /**
   * `.cc-badge--x` tone rules, as tone -> the declarations inside the braces.
   *
   * Taken through declaredClassRules rather than by matching the selector on
   * its own, for two reasons. What makes a tone a tone is the pair of
   * declarations in the block, so the block is the thing that has to be read.
   * And a selector-only scan counts a descendant rule — `.cc-badge--success svg
   * { ... }` — as the tone's own styling, which it is not.
   */
  const toneRules = new Map(
    [...declaredClassRules(COMPONENTS_CSS)]
      .filter(([className]) => className.startsWith("cc-badge--"))
      .map(([className, body]) => [className.replace("cc-badge--", ""), body]),
  );

  it("uses only tones the stylesheet gives a colour and a background", () => {
    // Badge interpolates the tone into its class without validating it, so an
    // unsupported tone is not an error — it is an unstyled badge: a bordered
    // pill with no tint at all. A rule that exists but drops one of the two
    // declarations renders that same untinted pill, which is why the body is
    // inspected and not just the selector. The rendered class is read back from
    // Badge rather than assembled here, so the check still holds if the
    // modifier naming changes on both sides.
    //
    // The leading boundary in each pattern earns its keep twice: a bare
    // /color\s*:/ is satisfied by `background-color:` alone, so without it a
    // tone with a background and no foreground would pass both halves.
    //
    // (That these two colours CLEAR AA against each other is not checkable
    // here — jsdom resolves no custom properties. It is measured in Chromium by
    // the Playwright verification script.)
    const untinted = STATUS_BADGES.flatMap((b) => {
      const { container, unmount } = render(
        createElement(Badge, { tone: b.tone }, b.label),
      );
      const modifier = [...container.firstElementChild.classList].find((c) =>
        c.startsWith("cc-badge--"),
      );
      unmount();

      const where = `${b.label}:${b.tone}`;
      const body = toneRules.get(modifier?.replace("cc-badge--", ""));
      if (body === undefined) return [`${where} — no .${modifier} rule`];

      return [
        /(?:^|[;{\s])color\s*:/.test(body) ? null : `${where} — no colour`,
        /(?:^|[;{\s])background(?:-color)?\s*:/.test(body)
          ? null
          : `${where} — no background`,
      ].filter((problem) => problem !== null);
    });

    expect(untinted).toEqual([]);
  });

  it("shows a specimen of every tone the stylesheet supports", () => {
    // The sheet is the evidence that every state in the handoff is
    // implemented, so a tone that exists in CSS with no specimen is a state
    // nobody can see, review or screenshot.
    expect(toneRules.size).toBeGreaterThan(0);

    const unspecified = [...toneRules.keys()].filter(
      (tone) => !STATUS_BADGES.some((b) => b.tone === tone),
    );
    expect(unspecified).toEqual([]);
  });

  it("labels every badge, with no label used twice", () => {
    const labels = STATUS_BADGES.map((b) => b.label);

    expect(labels.filter((l) => typeof l !== "string" || l.trim() === "")).toEqual([]);
    expect(new Set(labels).size).toBe(labels.length); // also the React key
  });
});
