import { expect, test } from "@playwright/test";
import { DESTINATIONS, SHEET, STORAGE_BANNER, heading, mainNav, tabName } from "./helpers.js";

test("the visible navigation names every tab, Messages with its unread count", async ({ page }) => {
  await page.goto("./");
  for (const destination of DESTINATIONS) {
    await expect(mainNav(page).getByRole("link", { name: tabName(destination, page), exact: true })).toBeVisible();
  }
});

test("Patient Today shows the day's numbers from the demo data", async ({ page }) => {
  await page.goto("./");
  await expect(heading(page)).toHaveText("Good morning, Joyce");
  for (const text of ["3 of 10 things done today", "2 remaining", "3 things done"]) {
    await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
  }
});

test("the design system sheet opens from the footer and leads back to Patient Today", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("link", { name: "Design system" }).click();
  await expect(heading(page)).toHaveText(SHEET.h1);
  await expect(page).toHaveTitle(SHEET.title);
  await expect(mainNav(page).locator('[aria-current="page"]')).toHaveCount(0);
  await page.getByRole("link", { name: "Back to Patient Today" }).click();
  await expect(heading(page)).toHaveText("Good morning, Joyce");
});

test("garbage in storage still loads the demo, with no errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.addInitScript(() => window.localStorage.setItem("careconnect-web:demo", "{not json"));
  await page.goto("./");
  await expect(heading(page)).toHaveText("Good morning, Joyce");
  await expect(page.getByText(STORAGE_BANNER)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("when the browser refuses storage, a banner says so on every page", async ({ page }) => {
  await page.addInitScript(() => {
    const refuse = () => {
      throw new DOMException("Storage is blocked", "SecurityError");
    };
    Storage.prototype.getItem = refuse;
    Storage.prototype.setItem = refuse;
  });
  await page.goto("./");
  await expect(page.locator(".cc-banners").getByText(STORAGE_BANNER)).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(STORAGE_BANNER);
  const help = DESTINATIONS.find((d) => d.id === "help");
  await mainNav(page).getByRole("link", { name: tabName(help, page), exact: true }).click();
  await expect(heading(page)).toHaveText(help.h1);
  await expect(page.locator(".cc-banners").getByText(STORAGE_BANNER)).toBeVisible();
});
