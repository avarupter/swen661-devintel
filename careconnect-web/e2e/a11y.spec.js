import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { DESTINATIONS, SHEET, heading } from "./helpers.js";

const PAGES = [...DESTINATIONS.map((d) => ({ hash: d.hash, h1: d.h1 })), { hash: SHEET.hash, h1: SHEET.h1 }];

for (const { hash, h1 } of PAGES) {
  test(`${hash} has no WCAG 2.1 A/AA violations (axe)`, async ({ page }) => {
    await page.goto(`./${hash}`);
    await expect(heading(page)).toHaveText(h1);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .options({ rules: { "label-content-name-mismatch": { enabled: true } } })
      .analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
  });
}
