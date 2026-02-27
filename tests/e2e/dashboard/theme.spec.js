const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Dashboard Theme", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Test Light Theme", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan");

    await expect(page.locator(".unlock-premium ")).toBeVisible();
    await expect(page.locator(".sucuriscan-upgrade-banner ")).toBeVisible();

    await expect(page.locator("#core-vulnerability-results")).not.toBeVisible();
    await expect(page.locator("#php-vulnerability-results")).not.toBeVisible();
    await expect(
      page.locator(".sucuriscan-themes-list-body"),
    ).not.toBeVisible();
  });

  test("Test Dark Theme", async ({ page }) => {
    const fakeApiKey =
      "abcdefghiabcegasabcdefghiabcegas/abcdefghiabcegasabcdefghiabcegas";

    await page.goto("/wp-admin/admin.php?page=sucuriscan_firewall");

    await page.fill("[name=sucuriscan_cloudproxy_apikey]", fakeApiKey);
    await page.click("[data-cy=sucuriscan-save-wafkey]");

    await page.goto("/wp-admin/admin.php?page=sucuriscan");

    await expect(page.locator(".unlock-premium ")).not.toBeVisible();
    await expect(page.locator(".sucuriscan-upgrade-banner ")).not.toBeVisible();

    await expect(page.locator("#core-vulnerability-results")).toContainText(
      "Error: Could not fetch WordPress Core vulnerabilities.",
    );
    await expect(page.locator("#php-vulnerability-results")).toContainText(
      "Error: Could not fetch PHP vulnerabilities.",
    );
    await expect(page.locator(".sucuriscan-themes-list-body")).toHaveCount(2);
  });
});
