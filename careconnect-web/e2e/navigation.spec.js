import { expect, test } from "@playwright/test";
import { DESTINATIONS, heading, mainNav, tabName } from "./helpers.js";

test.describe("the five tabs", () => {
  test("each tab opens its page, sets the title and marks itself current", async ({ page }) => {
    await page.goto("./");
    await expect(mainNav(page)).toHaveCount(1);
    for (const destination of DESTINATIONS) {
      const tab = mainNav(page).getByRole("link", { name: tabName(destination, page), exact: true });
      await tab.click();
      await expect(heading(page)).toHaveText(destination.h1);
      await expect(page).toHaveTitle(destination.title);
      await expect(tab).toHaveAttribute("aria-current", "page");
      await expect(mainNav(page).locator('[aria-current="page"]')).toHaveCount(1);
    }
  });

  test("focus moves to the new page's heading after a tab is used, but not on first load", async ({ page }) => {
    await page.goto("./");
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    const medications = DESTINATIONS.find((d) => d.id === "medications");
    await mainNav(page).getByRole("link", { name: tabName(medications, page), exact: true }).click();
    await expect(heading(page)).toHaveText(medications.h1);
    await expect(heading(page)).toBeFocused();
  });

  test("Back and Forward bring back the page, its title and the current tab", async ({ page }) => {
    const [medications, help] = ["medications", "help"].map((id) => DESTINATIONS.find((d) => d.id === id));
    await page.goto("./");
    await mainNav(page).getByRole("link", { name: tabName(medications, page), exact: true }).click();
    await mainNav(page).getByRole("link", { name: tabName(help, page), exact: true }).click();
    await expect(heading(page)).toHaveText(help.h1);

    await page.goBack();
    await expect(heading(page)).toHaveText(medications.h1);
    await expect(page).toHaveTitle(medications.title);
    await expect(mainNav(page).getByRole("link", { name: tabName(medications, page), exact: true })).toHaveAttribute("aria-current", "page");

    await page.goForward();
    await expect(heading(page)).toHaveText(help.h1);
    await expect(page).toHaveTitle(help.title);
  });

  test("#main and unknown hashes never change the page", async ({ page }) => {
    await page.goto("./#medications");
    await expect(heading(page)).toHaveText("Your medicines, Joyce");
    await page.evaluate(() => (window.location.hash = "#main"));
    await expect(heading(page)).toHaveText("Your medicines, Joyce");
    await page.evaluate(() => (window.location.hash = "#no-such-page"));
    await expect(heading(page)).toHaveText("Your medicines, Joyce");
  });

  test("a deep link opens the right page", async ({ page }) => {
    for (const destination of DESTINATIONS) {
      await page.goto(`./${destination.hash}`);
      await expect(heading(page)).toHaveText(destination.h1);
      await expect(page).toHaveTitle(destination.title);
    }
  });
});

test.describe("keyboard", () => {
  test("the skip link is the first Tab stop, moves focus into main and keeps the route", async ({ page }) => {
    await page.goto("./#messages/video-call");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    await expect(page).toHaveURL(/#messages\/video-call$/);
  });

  test("every tab can be reached and opened with the keyboard alone", async ({ page }) => {
    await page.goto("./");
    const help = DESTINATIONS.find((d) => d.id === "help");
    const target = mainNav(page).getByRole("link", { name: tabName(help, page), exact: true });
    for (let presses = 0; presses < 60; presses += 1) {
      await page.keyboard.press("Tab");
      if (await target.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(target).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(heading(page)).toHaveText(help.h1);
    await expect(heading(page)).toBeFocused();
  });
});

test("no page scrolls sideways at 320px (WCAG 1.4.10)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one width check is enough; it sets its own viewport");
  await page.setViewportSize({ width: 320, height: 640 });
  for (const destination of DESTINATIONS) {
    await page.goto(`./${destination.hash}`);
    await expect(heading(page)).toHaveText(destination.h1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${destination.id} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
  }
});
