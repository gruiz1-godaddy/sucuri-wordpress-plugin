const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Sucuri Firewall E2E", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can activate api key", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan#auditlogs");

    await page.getByText("Firewall (WAF)").click();
    await expect(page.getByText("Firewall Settings")).toBeVisible();

    await page.fill(
      "input[name=sucuriscan_cloudproxy_apikey]",
      process.env.WAF_API_KEY || "",
    );
    await page.click("button[data-cy=sucuriscan-save-wafkey]");

    await expect(page.locator(".sucuriscan-alert-updated")).toContainText(
      "SUCURI: Firewall API key was successfully saved",
    );
    await expect(page.locator(".sucuriscan-alert-updated")).toContainText(
      "SUCURI: Reverse proxy support was set to enabled",
    );
    await expect(page.locator(".sucuriscan-alert-updated")).toContainText(
      "SUCURI: HTTP header was set to HTTP_X_SUCURI_CLIENTIP",
    );
  });

  test("can try to load audit logs", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_firewall#auditlogs");
    const auditLogsText = await page
      .locator(".sucuriscan-firewall-auditlogs")
      .innerText();
    expect(auditLogsText).toMatch(/no data available.|Target:.*/g);
  });

  test("can try to add ip address to the blocklist", async ({ page }) => {
    const ipAddress = "82.165.185.18";

    await page.goto("/wp-admin/admin.php?page=sucuriscan_firewall#settings");

    await page.getByText("IP Access").click();

    await page.fill("[data-cy=sucuriscan_ip_access_input]", ipAddress);
    await page.click("[data-cy=sucuriscan_ip_access_submit]");

    await page.waitForTimeout(7000);

    await expect(page.locator("#sucuriscan-ipaccess-response")).toContainText(
      "IP address 82.165.185.18",
    );
  });

  test("can clear cache when post/page is updated", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan#auditlogs");

    await page.click("[data-cy=sucuriscan-main-nav-firewall]");
    await page.getByText("Clear Cache").click();

    await page.check("input[name=sucuriscan_auto_clear_cache]");
    await page.click("#firewall-clear-cache-button");

    await page.waitForTimeout(2000);

    await expect(page.locator("#firewall-clear-cache-response")).toContainText(
      /The cache for the domain ".*" is being cleared\. Note that it may take up to two minutes for it to be fully flushed\./g,
    );
  });

  test("can clear cache by path", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_firewall#clearcache");

    await page.fill("[data-cy=firewall-clear-cache-path-input]", "blog");

    await page.click("[data-cy=sucuriscan-clear-cache-path]");

    await page.waitForTimeout(2000);

    await expect(page.locator("#firewall-clear-cache-response")).toContainText(
      /The cache for ".*" is being cleared\. Note that it may take up to two minutes for it to be fully flushed\./g,
    );
  });

  test("can delete api key", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan#auditlogs");

    await page.getByText("Firewall (WAF)").click();

    await page.click("button[data-cy=sucuriscan-delete-wafkey]");

    await expect(page.locator(".sucuriscan-alert-updated")).toContainText(
      "SUCURI: Firewall API key was successfully removed",
    );
    await expect(page.locator(".sucuriscan-alert-updated")).toContainText(
      "SUCURI: Reverse proxy support was set to disabled",
    );
    await expect(page.locator(".sucuriscan-alert-updated")).toContainText(
      "SUCURI: HTTP header was set to REMOTE_ADDR",
    );
  });
});
