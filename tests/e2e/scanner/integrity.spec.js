const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

async function waitForIntegrityCheck(page) {
  return page.waitForResponse((response) => {
    if (!response.url().includes("/wp-admin/admin-ajax.php")) {
      return false;
    }

    if (response.request().method() !== "POST") {
      return false;
    }

    const postData = response.request().postData() || "";
    return postData.includes("check_wordpress_integrity");
  });
}

async function visitScannerDashboard(page) {
  const integrityWait = waitForIntegrityCheck(page);
  await page.goto("/wp-admin/admin.php?page=sucuriscan");
  await integrityWait;
}

test.describe("Scanner - Integrity", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("can ignore and unignore false positives (integrity diff utility)", async ({
    page,
  }) => {
    await visitScannerDashboard(page);

    await page.selectOption("[data-cy=sucuriscan_integrity_files_per_page]", {
      label: "1000",
    });

    await page.click('input[value="added@wp-config-test.php"]');
    await page.click("[data-cy=sucuriscan_integrity_incorrect_checkbox]");
    await page.click("[data-cy=sucuriscan_integrity_incorrect_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "1 out of 1 files were successfully processed.",
    );

    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#scanner");

    await expect(
      page.locator("[data-cy=sucuriscan_integrity_diff_false_positive_table]"),
    ).toContainText("wp-config-test.php");
    await page.click('input[value="wp-config-test.php"]');
    await page.click(
      "[data-cy=sucuriscan_integrity_diff_false_positive_submit]",
    );

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The selected files have been successfully processed.",
    );
    await expect(
      page.locator("[data-cy=sucuriscan_integrity_diff_false_positive_table]"),
    ).toContainText("no data available");

    await visitScannerDashboard(page);

    await expect(
      page.locator("[data-cy=sucuriscan_integrity_list_table]"),
    ).toContainText("wp-config-test.php");
  });

  test("can use new dropdown in integrity diff utility", async ({ page }) => {
    await visitScannerDashboard(page);

    await expect(
      page.locator(
        ".sucuriscan-pagination-integrity .sucuriscan-pagination-link",
      ),
    ).toHaveCount(7);

    await page.selectOption("#sucuriscan_integrity_files_per_page", {
      label: "200",
    });
    await expect(page.locator(".sucuriscan-is-loading")).toContainText(
      "Loading...",
    );
    await expect(page.locator(".sucuriscan-integrity-filepath")).toHaveCount(
      105,
    );

    await page.selectOption("#sucuriscan_integrity_files_per_page", {
      label: "15",
    });
    await expect(page.locator(".sucuriscan-is-loading")).toContainText(
      "Loading...",
    );
    await expect(page.locator(".sucuriscan-integrity-filepath")).toHaveCount(
      15,
    );

    await page.selectOption("#sucuriscan_integrity_files_per_page", {
      label: "50",
    });
    await expect(page.locator(".sucuriscan-is-loading")).toContainText(
      "Loading...",
    );
    await expect(page.locator(".sucuriscan-integrity-filepath")).toHaveCount(
      50,
    );

    await page.click("#cb-select-all-1");

    await page.click("[data-cy=sucuriscan_integrity_incorrect_checkbox]");
    await page.click("[data-cy=sucuriscan_integrity_incorrect_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "50 out of 50 files were successfully processed.",
    );

    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#scanner");

    await expect(page.locator('*[class^="sucuriscan-integrity"]')).toHaveCount(
      50,
    );

    await page.click(
      "[data-cy=sucuriscan_integrity_diff_false_positive_table] #cb-select-all-1",
    );

    await page.click(
      "[data-cy=sucuriscan_integrity_diff_false_positive_submit]",
    );

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The selected files have been successfully processed.",
    );
    await expect(
      page.locator("[data-cy=sucuriscan_integrity_diff_false_positive_table]"),
    ).toContainText("no data available");

    await visitScannerDashboard(page);

    await page.selectOption("#sucuriscan_integrity_files_per_page", {
      label: "200",
    });
    await expect(page.locator(".sucuriscan-is-loading")).toContainText(
      "Loading...",
    );
    await expect(page.locator(".sucuriscan-integrity-filepath")).toHaveCount(
      105,
    );
  });

  test("can use pagination in integrity diff utility", async ({ page }) => {
    await visitScannerDashboard(page);

    await expect(
      page.locator(
        ".sucuriscan-pagination-integrity .sucuriscan-pagination-link",
      ),
    ).toHaveCount(7);

    await page.click(".sucuriscan-pagination-integrity [data-page=2]");

    await expect(
      page.locator("[data-cy=sucuriscan_integrity_list_table]"),
    ).toContainText("wp-test-file-21.php");

    await page.click("#cb-select-all-1");
    await page.click("[data-cy=sucuriscan_integrity_incorrect_checkbox]");
    await page.click("[data-cy=sucuriscan_integrity_incorrect_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "15 out of 15 files were successfully processed.",
    );

    await page.click(".sucuriscan-pagination-integrity [data-page=2]");

    await waitForIntegrityCheck(page);

    await expect(
      page.locator("[data-cy=sucuriscan_integrity_list_table]"),
    ).toContainText("wp-test-file-35.php");

    await page.click(".sucuriscan-pagination-integrity [data-page=6]");

    await expect(
      page.locator("[data-cy=sucuriscan_integrity_list_table]"),
    ).toContainText("wp-test-file-99.php");
  });

  test("can activate and deactivate the WordPress integrity diff utility", async ({
    page,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#scanner");

    await page.click(
      "[data-cy=sucuriscan_scanner_integrity_diff_utility_toggle]",
    );
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The status of the integrity diff utility has been changed",
    );
    await expect(
      page.locator(
        "[data-cy=sucuriscan_scanner_integrity_diff_utility_toggle]",
      ),
    ).toContainText("Disable");

    await page.click(
      "[data-cy=sucuriscan_scanner_integrity_diff_utility_toggle]",
    );
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "The status of the integrity diff utility has been changed",
    );
    await expect(
      page.locator(
        "[data-cy=sucuriscan_scanner_integrity_diff_utility_toggle]",
      ),
    ).toContainText("Enable");
  });

  test("can ignore files and folders during the scans", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_settings#scanner");

    await page.fill(
      "[data-cy=sucuriscan_ignore_files_folders_input]",
      "sucuri-images",
    );
    await page.click("[data-cy=sucuriscan_ignore_files_folders_ignore_submit]");

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Selected files have been successfully processed.",
    );
    await expect(
      page.locator("[data-cy=sucuriscan_ignore_files_folders_table]"),
    ).toContainText("sucuri-images");

    await page.click('input[value="sucuri-images"]');
    await page.click(
      "[data-cy=sucuriscan_ignore_files_folders_unignore_submit]",
    );

    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Selected files have been successfully processed.",
    );
    await expect(
      page.locator("[data-cy=sucuriscan_ignore_files_folders_table]"),
    ).toContainText("no data available");
  });
});
