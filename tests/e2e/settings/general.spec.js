const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Settings - General", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can reset logs, hardening and settings", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#general");
    await page.check("[data-cy=sucuriscan_reset_checkbox]");
    await page.click("[data-cy=sucuriscan_reset_submit]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Local security logs, hardening and settings were deleted",
    );
  });

  test("can change malware scan target", async ({ page }) => {
    const testDomain = "sucuri.net";

    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#apiservice");
    await page.fill("[data-cy=sucuriscan_sitecheck_target_input]", testDomain);
    await page.click("[data-cy=sucuriscan_sitecheck_target_submit]");

    await page.reload();
    await expect(
      page.locator("[data-cy=sucuriscan_sitecheck_target]"),
    ).toContainText(testDomain);
  });

  test("can update ip address discovery", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#general");

    await page.click("[data-cy=sucuriscan_ip_address_discovery_toggle_submit]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The status of the DNS lookups for the reverse proxy detection has been changed",
    );
    await expect(
      page.locator("[data-cy=sucuriscan_ip_address_discovery_toggle_submit]"),
    ).toContainText("Enable");

    await page.click("[data-cy=sucuriscan_ip_address_discovery_toggle_submit]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The status of the DNS lookups for the reverse proxy detection has been changed",
    );
    await expect(
      page.locator("[data-cy=sucuriscan_ip_address_discovery_toggle_submit]"),
    ).toContainText("Disable");

    await page.selectOption("[data-cy=sucuriscan_addr_header_select]", {
      label: "HTTP_X_REAL_IP",
    });
    await page.click("[data-cy=sucuriscan_addr_header_proceed]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "HTTP header was set to HTTP_X_REAL_IP",
    );
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Reverse proxy support was set to enabled",
    );
  });

  test("can update reverse proxy setting", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#general");

    await page.click("[data-cy=sucuriscan_reverse_proxy_toggle]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Reverse proxy support was set to disabled",
    );
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "HTTP header was set to REMOTE_ADDR",
    );

    await page.click("[data-cy=sucuriscan_reverse_proxy_toggle]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Reverse proxy support was set to enabled",
    );
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "HTTP header was set to HTTP_X_SUCURI_CLIENTIP",
    );
  });

  test("can delete datastore files", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#general");

    await page.click('input[value="sucuri-integrity.php"]');
    await page.click("[data-cy=sucuriscan_general_datastore_delete_button]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "1 out of 1 files have been deleted.",
    );

    await page.click("[data-cy=sucuriscan_general_datastore_delete_checkbox]");
    await page.click("[data-cy=sucuriscan_general_datastore_delete_button]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "files have been deleted.",
    );
  });

  test("can import JSON settings", async ({ page }) => {
    const jsonPayload =
      '{"sucuriscan_addr_header":"REMOTE_ADDR","sucuriscan_api_protocol":"https","sucuriscan_api_service":"enabled","sucuriscan_cloudproxy_apikey":"","sucuriscan_diff_utility":"disabled","sucuriscan_dns_lookups":"enabled","sucuriscan_email_subject":"Sucuri Alert, :domain, :event, :remoteaddr","sucuriscan_emails_per_hour":5,"sucuriscan_ignored_events":"","sucuriscan_lastlogin_redirection":"enabled","sucuriscan_maximum_failed_logins":30,"sucuriscan_notify_available_updates":"disabled","sucuriscan_notify_bruteforce_attack":"disabled","sucuriscan_notify_failed_login":"disabled","sucuriscan_notify_plugin_activated":"enabled","sucuriscan_notify_plugin_change":"enabled","sucuriscan_notify_plugin_deactivated":"disabled","sucuriscan_notify_plugin_deleted":"disabled","sucuriscan_notify_plugin_installed":"disabled","sucuriscan_notify_plugin_updated":"disabled","sucuriscan_notify_post_publication":"enabled","sucuriscan_notify_scan_checksums":"disabled","sucuriscan_notify_settings_updated":"enabled","sucuriscan_notify_success_login":"disabled","sucuriscan_notify_theme_activated":"enabled","sucuriscan_notify_theme_deleted":"disabled","sucuriscan_notify_theme_editor":"enabled","sucuriscan_notify_theme_installed":"disabled","sucuriscan_notify_theme_updated":"disabled","sucuriscan_notify_to":"wordpress@example.com","sucuriscan_notify_user_registration":"disabled","sucuriscan_notify_website_updated":"disabled","sucuriscan_notify_widget_added":"disabled","sucuriscan_notify_widget_deleted":"disabled","sucuriscan_prettify_mails":"disabled","sucuriscan_revproxy":"enabled","sucuriscan_selfhosting_fpath":"","sucuriscan_selfhosting_monitor":"disabled","sucuriscan_use_wpmail":"enabled","trusted_ips":[]}';

    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#general");
    await page.fill(
      "[data-cy=sucuriscan_import_export_settings_textarea]",
      jsonPayload,
    );
    await page.check("[data-cy=sucuriscan_import_export_settings_checkbox]");
    await page.click("[data-cy=sucuriscan_import_export_settings_submit]");

    await page.reload();
    await expect(
      page.locator("[data-cy=sucuriscan_addr_header_select]"),
    ).toContainText("REMOTE_ADDR");
  });

  test("can update timezone setting", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#general");

    await page.selectOption("[data-cy=sucuriscan_timezone_select]", {
      label: "UTC-07.00",
    });
    await page.click("[data-cy=sucuriscan_timezone_submit]");
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The timezone for the date and time in the audit logs has been changed",
    );
  });
});
