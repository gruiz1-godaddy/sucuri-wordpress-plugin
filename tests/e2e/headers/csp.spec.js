const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Headers - CSP", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Toggling enforce checkbox enables/disables inputs interactively", async ({
    page,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await expect(
      page.locator("input[name='sucuriscan_enforced_default_src']"),
    ).not.toBeChecked();
    await expect(
      page.locator("input[name='sucuriscan_csp_default_src']"),
    ).toBeDisabled();

    await page.check("input[name='sucuriscan_enforced_default_src']", {
      force: true,
    });
    await expect(
      page.locator("input[name='sucuriscan_csp_default_src']"),
    ).not.toBeDisabled();

    await page.uncheck("input[name='sucuriscan_enforced_default_src']", {
      force: true,
    });
    await expect(
      page.locator("input[name='sucuriscan_csp_default_src']"),
    ).toBeDisabled();
  });

  test("Saves enforced state and value changes and persists after reload", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.check("input[name='sucuriscan_enforced_default_src']", {
      force: true,
    });
    await page.fill("input[name='sucuriscan_csp_default_src']", "'none'");

    await page.selectOption("[data-cy=sucuriscan_csp_options_mode_button]", {
      label: "Report Only",
    });
    await page.click("[data-cy=sucuriscan_headers_csp_control_submit_btn]", {
      force: true,
    });

    await expect(
      page.locator("input[name='sucuriscan_csp_default_src']"),
    ).toHaveValue("'none'");
    await expect(
      page.locator("input[name='sucuriscan_csp_default_src']"),
    ).not.toBeDisabled();

    const reportOnlyResponse = await request.get("/");
    expect(
      reportOnlyResponse.headers()["content-security-policy-report-only"],
    ).toBe("default-src 'none'");

    await page.selectOption("[data-cy=sucuriscan_csp_options_mode_button]", {
      label: "Disabled",
    });
    await page.click("[data-cy=sucuriscan_headers_csp_control_submit_btn]", {
      force: true,
    });

    const disabledResponse = await request.get("/");
    expect(
      disabledResponse.headers()["content-security-policy-report-only"],
    ).toBeUndefined();
  });

  test("Test multi_checkbox directive (sandbox)", async ({ page, request }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.check("input[name='sucuriscan_enforced_sandbox']", {
      force: true,
    });
    await page.check("input[name='sucuriscan_csp_sandbox_allow-forms']", {
      force: true,
    });
    await page.check("input[name='sucuriscan_csp_sandbox_allow-popups']", {
      force: true,
    });
    await page.check(
      "input[name='sucuriscan_csp_sandbox_allow-orientation-lock']",
      { force: true },
    );

    await page.selectOption("[data-cy=sucuriscan_csp_options_mode_button]", {
      label: "Report Only",
    });
    await page.click("[data-cy=sucuriscan_headers_csp_control_submit_btn]", {
      force: true,
    });

    const sandboxResponse = await request.get("/");
    expect(
      sandboxResponse.headers()["content-security-policy-report-only"],
    ).toBe(
      "default-src 'none'; sandbox allow-forms allow-orientation-lock allow-popups",
    );

    await page.uncheck("input[name='sucuriscan_csp_sandbox_allow-forms']", {
      force: true,
    });
    await page.uncheck("input[name='sucuriscan_csp_sandbox_allow-popups']", {
      force: true,
    });
    await page.uncheck(
      "input[name='sucuriscan_csp_sandbox_allow-orientation-lock']",
      { force: true },
    );
    await page.check("input[name='sucuriscan_csp_sandbox_allow-same-origin']", {
      force: true,
    });

    await page.click("[data-cy=sucuriscan_headers_csp_control_submit_btn]", {
      force: true,
    });

    const sameOriginResponse = await request.get("/");
    expect(
      sameOriginResponse.headers()["content-security-policy-report-only"],
    ).toBe("default-src 'none'; sandbox allow-same-origin");
  });

  test("Upgrade Insecure Requests directive should not appear unless enforced", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await expect(
      page.locator(
        "input[name='sucuriscan_enforced_upgrade_insecure_requests']",
      ),
    ).not.toBeChecked();
    await expect(
      page.locator(
        "input[name='sucuriscan_csp_upgrade_insecure_requests_upgrade-insecure-requests']",
      ),
    ).toBeDisabled();

    const initialResponse = await request.get("/");
    const initialCsp =
      initialResponse.headers()["content-security-policy-report-only"] || "";
    expect(initialCsp).not.toContain("upgrade-insecure-requests");

    await page.check(
      "input[name='sucuriscan_enforced_upgrade_insecure_requests']",
      {
        force: true,
      },
    );
    await expect(
      page.locator(
        "input[name='sucuriscan_csp_upgrade_insecure_requests_upgrade-insecure-requests']",
      ),
    ).not.toBeDisabled();
    await page.check(
      "input[name='sucuriscan_csp_upgrade_insecure_requests_upgrade-insecure-requests']",
      { force: true },
    );

    await page.click("[data-cy=sucuriscan_headers_csp_control_submit_btn]", {
      force: true,
    });

    const upgradeResponse = await request.get("/");
    const upgradeHeader =
      upgradeResponse.headers()["content-security-policy-report-only"] || "";
    expect(upgradeHeader).toContain("upgrade-insecure-requests");
  });
});
