const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Plugin lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can deactivate sucuri-scanner", async ({ page }) => {
    await page.goto("/wp-admin/plugins.php");
    await page.click("[data-slug=sucuri-scanner] .deactivate");
    await expect(page.getByText("Plugin deactivated.")).toBeVisible();
  });

  test("can activate sucuri-scanner", async ({ page }) => {
    await page.goto("/wp-admin/plugins.php");
    await page.click("[data-slug=sucuri-scanner] .activate");
    await expect(page.getByText("Plugin activated.")).toBeVisible();
  });
});
