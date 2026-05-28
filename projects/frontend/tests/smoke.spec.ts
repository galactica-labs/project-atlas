import { expect, test } from "@playwright/test";

test("hero page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/VEX|Atlas/);
});

test("can navigate to command center", async ({ page }) => {
  await page.goto("/ops");
  await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible();
});

test("sidebar shows role switcher", async ({ page }) => {
  await page.goto("/ops");
  await expect(page.locator("select")).toBeVisible();
});

test("incidents page loads", async ({ page }) => {
  await page.goto("/ops/incidents");
  await expect(page).toHaveURL("/ops/incidents");
});

test("tech jobs page loads", async ({ page }) => {
  await page.goto("/tech");
  await expect(page).toHaveURL("/tech");
});
