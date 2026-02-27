const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Alerts", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can modify alerts recipients", async ({ page }) => {
    await page.goto(
      "/wp-admin/admin.php?page=sucuriscan_settings&sucuriscan_lastlogin=1#alerts",
    );

    await page.click('input[value="wordpress@example.com"]');
    await page.click("[data-cy=sucuriscan_alerts_test_recipient_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "A test alert was sent to your email, check your inbox",
    );

    await page.fill(
      "[data-cy=sucuriscan_alerts_recipient_input]",
      "admin@sucuri.net",
    );
    await page.click("[data-cy=sucuriscan_alerts_recipient_add_email_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The email alerts will be sent to: admin@sucuri.net",
    );

    await page.click('input[value="admin@sucuri.net"]');
    await page.click("[data-cy=sucuriscan_alerts_delete_recipient_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "These emails will stop receiving alerts: admin@sucuri.net",
    );

    await page.click('input[value="wordpress@example.com"]');
    await page.click("[data-cy=sucuriscan_alerts_test_recipient_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "A test alert was sent to your email, check your inbox",
    );
  });

  test("can modify trusted ip addresses", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#alerts");

    await expect(
      page.locator("[data-cy=sucuriscan_trusted_ip_table]"),
    ).toContainText("no data available");

    await page.fill(
      "[data-cy=sucuriscan_trusted_ip_input]",
      "182.190.190.0/24",
    );
    await page.click("[data-cy=sucuriscan_trusted_ip_add_ip_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Events generated from this IP will be ignored: 182.190.190.0/24",
    );

    await page.fill(
      "[data-cy=sucuriscan_trusted_ip_input]",
      "182.190.190.0/24",
    );
    await page.click("[data-cy=sucuriscan_trusted_ip_add_ip_submit]");

    await expect(page.locator(".error")).toContainText(
      "The IP specified address was already added.",
    );

    await expect(
      page.locator("[data-cy=sucuriscan_trusted_ip_table] td:nth-child(2)"),
    ).toContainText("182.190.190.0");
    await expect(
      page.locator("[data-cy=sucuriscan_trusted_ip_table] td:nth-child(3)"),
    ).toContainText("182.190.190.0/24");

    await page.click('input[name="sucuriscan_del_trust_ip[]"]');
    await page.click("[data-cy=sucuriscan_trusted_ip_delete_ip_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The selected IP addresses were successfully deleted.",
    );
  });

  test("can modify alert subject", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#alerts");

    await page.click('input[value="Sucuri Alert, :event, :hostname"]');
    await page.click("[data-cy=sucuriscan_alerts_subject_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The email subject has been successfully updated",
    );

    await page.click('input[value="custom"]');
    await page.fill(
      "[data-cy=sucuriscan_alerts_subject_input]",
      "Security alert: :event",
    );
    await page.click("[data-cy=sucuriscan_alerts_subject_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The email subject has been successfully updated",
    );
  });

  test("can update max alerts per hour", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#alerts");

    await page.selectOption("[data-cy=sucuriscan_alerts_per_hour_select]", {
      label: "Maximum 160 per hour",
    });
    await page.click("[data-cy=sucuriscan_alerts_per_hour_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The maximum number of alerts per hour has been updated",
    );
  });

  test("can update value after a brute force attack is considered", async ({
    page,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#alerts");

    await page.selectOption("[data-cy=sucuriscan_max_failed_logins_select]", {
      label: "480 failed logins per hour",
    });
    await page.click("[data-cy=sucuriscan_max_failed_logins_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The plugin will assume that your website is under a brute-force attack after 480 failed logins are detected during the same hour",
    );
  });

  test("can update the events that fire security alerts", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#alerts");

    await page.click(
      'input[name="sucuriscan_notify_plugin_deleted"][value="1"]',
    );
    await page.click("[data-cy=sucuriscan_save_alert_events_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The alert settings have been updated",
    );

    await expect(
      page.locator('input[name="sucuriscan_notify_plugin_deleted"][value="1"]'),
    ).toBeChecked();

    await page.click(
      'input[name="sucuriscan_notify_plugin_deleted"][value="1"]',
    );
    await page.click("[data-cy=sucuriscan_save_alert_events_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The alert settings have been updated",
    );

    await expect(
      page.locator('input[name="sucuriscan_notify_plugin_deleted"][value="1"]'),
    ).not.toBeChecked();
  });

  test("can update alerts per post type", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#alerts");

    const customPostType = "new_sucuri_post_type";

    await page.fill(
      "[data-cy=sucuriscan_alerts_post_type_input]",
      customPostType,
    );
    await page.click("[data-cy=sucuriscan_alerts_post_type_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Post-type has been successfully ignored.",
    );

    await page.reload();

    await page.click(
      "[data-cy=sucuriscan_alerts_post_type_toggle_post_type_list]",
    );

    await expect(
      page.locator(`input[value="${customPostType}"]`),
    ).not.toBeChecked();

    await page.fill(
      "[data-cy=sucuriscan_alerts_post_type_input]",
      customPostType,
    );
    await page.click("[data-cy=sucuriscan_alerts_post_type_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The post-type is already being ignored (duplicate).",
    );

    await page.click(
      "[data-cy=sucuriscan_alerts_post_type_toggle_post_type_list]",
    );
    await page.click('input[value="nav_menu_item"]');
    await page.click("[data-cy=sucuriscan_alerts_post_type_save_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "List of monitored post-types has been updated.",
    );
  });
});
