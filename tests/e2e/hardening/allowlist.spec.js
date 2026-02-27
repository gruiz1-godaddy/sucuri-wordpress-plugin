const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Hardening - Allowlist", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("cannot add the same file twice to the allowlist", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_hardening_prevention");

    await page.fill(
      "[data-cy=sucuriscan_hardening_allowlist_input]",
      "test-1/testing.php",
    );
    await page.selectOption("[data-cy=sucuriscan_hardening_allowlist_select]", {
      label: "/var/www/html/wp-includes",
    });
    await page.click("[data-cy=sucuriscan_hardening_allowlist_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The file has been allowed",
    );

    await page.fill(
      "[data-cy=sucuriscan_hardening_allowlist_input]",
      "test-1/testing.php",
    );
    await page.selectOption("[data-cy=sucuriscan_hardening_allowlist_select]", {
      label: "/var/www/html/wp-includes",
    });
    await page.click("[data-cy=sucuriscan_hardening_allowlist_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "File is already in the allowlist",
    );
  });

  test("can remove legacy rules from allow blocked PHP files", async ({
    page,
    request,
  }) => {
    const legacyResponse = await request.get("/wp-content/archive-legacy.php");
    expect(await legacyResponse.text()).toContain("Hello, world!");

    await page.goto("/wp-admin/admin.php?page=sucuriscan_hardening_prevention");

    const allowlistTable = page.locator(
      ".sucuriscan-hardening-allowlist-table",
    );
    await allowlistTable
      .getByText("archive-legacy.php")
      .locator("..")
      .locator('input[type="checkbox"]')
      .click();

    await expect(allowlistTable).toContainText(
      "/var/www/html/wp-content/.*/archive-legacy.php",
    );

    await page.click("[data-cy=sucuriscan_hardening_remove_allowlist_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Selected files have been removed",
    );

    const forbiddenResponse = await request.get(
      "/wp-content/archive-legacy.php",
    );
    expect(forbiddenResponse.status()).toBe(403);
    expect(await forbiddenResponse.text()).toContain("Forbidden");
  });

  test("can add and remove from allowlist of blocked PHP files", async ({
    page,
    request,
  }) => {
    const forbiddenResponse = await request.get("/wp-content/archive.php");
    expect(forbiddenResponse.status()).toBe(403);
    expect(await forbiddenResponse.text()).toContain("Forbidden");

    await page.goto("/wp-admin/admin.php?page=sucuriscan_hardening_prevention");

    await page.fill(
      "[data-cy=sucuriscan_hardening_allowlist_input]",
      "archive.php",
    );
    await page.selectOption("[data-cy=sucuriscan_hardening_allowlist_select]", {
      label: "/var/www/html/wp-content",
    });
    await page.click("[data-cy=sucuriscan_hardening_allowlist_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The file has been allowed",
    );

    const allowedResponse = await request.get("/wp-content/archive.php");
    expect(allowedResponse.status()).toBe(200);
    expect(await allowedResponse.text()).toContain("Hello, world!");

    const allowlistTable = page.locator(
      ".sucuriscan-hardening-allowlist-table",
    );
    await allowlistTable
      .getByText("archive.php")
      .locator("..")
      .locator('input[type="checkbox"]')
      .click();

    await page.click("[data-cy=sucuriscan_hardening_remove_allowlist_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Selected files have been removed",
    );

    const forbiddenAgainResponse = await request.get("/wp-content/archive.php");
    expect(forbiddenAgainResponse.status()).toBe(403);
    expect(await forbiddenAgainResponse.text()).toContain("Forbidden");
  });

  test("Can add and remove multiple files from the allowlist of blocked PHP files", async ({
    page,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_hardening_prevention");

    await page.fill(
      "[data-cy=sucuriscan_hardening_allowlist_input]",
      "/test-1/test-1.php",
    );
    await page.selectOption("[data-cy=sucuriscan_hardening_allowlist_select]", {
      label: "/var/www/html/wp-includes",
    });
    await page.click("[data-cy=sucuriscan_hardening_allowlist_submit]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The file has been allowed",
    );

    await page.fill(
      "[data-cy=sucuriscan_hardening_allowlist_input]",
      "test-1/test-2.php",
    );
    await page.selectOption("[data-cy=sucuriscan_hardening_allowlist_select]", {
      label: "/var/www/html/wp-includes",
    });
    await page.click("[data-cy=sucuriscan_hardening_allowlist_submit]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The file has been allowed",
    );

    await page.fill(
      "[data-cy=sucuriscan_hardening_allowlist_input]",
      "test-1/test-3.php",
    );
    await page.selectOption("[data-cy=sucuriscan_hardening_allowlist_select]", {
      label: "/var/www/html/wp-includes",
    });
    await page.click("[data-cy=sucuriscan_hardening_allowlist_submit]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The file has been allowed",
    );

    await page.click("[data-cy=sucuriscan_hardening_select_all]");

    await page.click("[data-cy=sucuriscan_hardening_remove_allowlist_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Selected files have been removed",
    );
  });
});
