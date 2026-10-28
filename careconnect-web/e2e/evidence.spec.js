import { expect, test } from "@playwright/test";
import { DESTINATIONS, SHEET, STORAGE_BANNER, heading } from "./helpers.js";

/**
 * Not a check: the 2x screenshots for the team's Week 11 document. Run with
 * `npm run evidence`; the PNGs land in docs/evidence/ (committed).
 */
const OUT = "docs/evidence";
const WIDTHS = [
  { name: "mobile", width: 393, height: 852 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];
const PAGES = [
  ...DESTINATIONS.map((d) => ({ id: d.id, hash: d.hash, h1: d.h1 })),
  { id: "design-system", hash: SHEET.hash, h1: SHEET.h1 },
];

for (const { id, hash, h1 } of PAGES) {
  for (const size of WIDTHS) {
    test(`${id} at ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(`./${hash}`);
      await expect(heading(page)).toHaveText(h1);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${OUT}/${id}-${size.name}.png`, fullPage: true });
    });
  }
}

test("keyboard: the skip link is the first thing Tab reaches", async ({ page }) => {
  await page.goto("./");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.screenshot({ path: `${OUT}/keyboard-skip-link.png` });
});

test("keyboard: a tab with visible focus, then its page with focus on the heading", async ({ page }) => {
  await page.goto("./");
  const target = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Medications", exact: true });
  for (let presses = 0; presses < 40; presses += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(target).toBeFocused();
  await page.screenshot({ path: `${OUT}/keyboard-tab-focus.png` });
  await page.keyboard.press("Enter");
  await expect(heading(page)).toBeFocused();
  await page.screenshot({ path: `${OUT}/keyboard-heading-focus.png` });
});

test("storage refused: the banner on Patient Today", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Storage is blocked", "SecurityError");
    };
  });
  await page.goto("./");
  await expect(page.locator(".cc-banners").getByText(STORAGE_BANNER)).toBeVisible();
  await page.screenshot({ path: `${OUT}/storage-banner.png` });
});
