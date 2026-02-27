const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Headers - CORS", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Toggling enforce checkbox enables/disables inputs for Access-Control-Allow-Origin", async ({
    page,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.uncheck(
      "input[name='sucuriscan_enforced_Access-Control-Allow-Origin']",
      {
        force: true,
      },
    );
    await expect(
      page.locator(
        "input[name='sucuriscan_enforced_Access-Control-Allow-Origin']",
      ),
    ).not.toBeChecked();
    await expect(
      page.locator("input[name='sucuriscan_cors_Access-Control-Allow-Origin']"),
    ).toBeDisabled();

    await page.check(
      "input[name='sucuriscan_enforced_Access-Control-Allow-Origin']",
      {
        force: true,
      },
    );
    await expect(
      page.locator(
        "input[name='sucuriscan_enforced_Access-Control-Allow-Origin']",
      ),
    ).toBeChecked();
    await expect(
      page.locator("input[name='sucuriscan_cors_Access-Control-Allow-Origin']"),
    ).not.toBeDisabled();
  });

  test("Saves enforced state and value changes for Access-Control-Allow-Origin and persists after reload", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.check(
      "input[name='sucuriscan_enforced_Access-Control-Allow-Origin']",
      {
        force: true,
      },
    );
    await page.fill(
      "input[name='sucuriscan_cors_Access-Control-Allow-Origin']",
      "example.com",
    );

    await page.selectOption("[data-cy=sucuriscan_cors_options_mode_button]", {
      label: "enabled",
    });
    await page.click("[data-cy=sucuriscan_headers_cors_control_submit_btn]", {
      force: true,
    });

    await page.reload();
    await expect(
      page.locator("input[name='sucuriscan_cors_Access-Control-Allow-Origin']"),
    ).toHaveValue("example.com");
    await expect(
      page.locator("input[name='sucuriscan_cors_Access-Control-Allow-Origin']"),
    ).not.toBeDisabled();

    const originResponse = await request.get("/");
    expect(originResponse.headers()["access-control-allow-origin"]).toBe(
      "example.com",
    );
  });

  test("Multi-checkbox for Access-Control-Allow-Methods works correctly", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.check(
      "input[name='sucuriscan_enforced_Access-Control-Allow-Methods']",
      {
        force: true,
      },
    );

    await page.check(
      "input[name='sucuriscan_cors_Access-Control-Allow-Methods_GET']",
      { force: true },
    );
    await page.check(
      "input[name='sucuriscan_cors_Access-Control-Allow-Methods_OPTIONS']",
      { force: true },
    );

    await page.selectOption("[data-cy=sucuriscan_cors_options_mode_button]", {
      label: "enabled",
    });
    await page.click("[data-cy=sucuriscan_headers_cors_control_submit_btn]", {
      force: true,
    });

    const methodsResponse = await request.get("/");
    const allowMethods =
      methodsResponse.headers()["access-control-allow-methods"];
    expect(allowMethods).toContain("GET");
    expect(allowMethods).toContain("OPTIONS");
    expect(allowMethods).not.toContain("PUT");

    await page.check(
      "input[name='sucuriscan_cors_Access-Control-Allow-Methods_POST']",
      { force: true },
    );
    await page.uncheck(
      "input[name='sucuriscan_cors_Access-Control-Allow-Methods_OPTIONS']",
      { force: true },
    );
    await page.click("[data-cy=sucuriscan_headers_cors_control_submit_btn]", {
      force: true,
    });

    const updatedResponse = await request.get("/");
    const updatedMethods =
      updatedResponse.headers()["access-control-allow-methods"];
    expect(updatedMethods).toContain("GET");
    expect(updatedMethods).toContain("POST");
    expect(updatedMethods).not.toContain("PUT");
    expect(updatedMethods).not.toContain("OPTIONS");
  });

  test("Allows setting and unsetting Access-Control-Allow-Credentials", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.uncheck(
      "input[name='sucuriscan_enforced_Access-Control-Allow-Credentials']",
      { force: true },
    );
    await page.click("[data-cy=sucuriscan_headers_cors_control_submit_btn]", {
      force: true,
    });

    const disabledResponse = await request.get("/");
    expect(
      disabledResponse.headers()["access-control-allow-credentials"],
    ).toBeUndefined();

    await page.check(
      "input[name='sucuriscan_enforced_Access-Control-Allow-Credentials']",
      { force: true },
    );
    await page.check(
      "input[name='sucuriscan_cors_Access-Control-Allow-Credentials_Access-Control-Allow-Credentials']",
      { force: true },
    );
    await page.click("[data-cy=sucuriscan_headers_cors_control_submit_btn]", {
      force: true,
    });

    const enabledResponse = await request.get("/");
    expect(enabledResponse.headers()["access-control-allow-credentials"]).toBe(
      "true",
    );
  });

  test("Test disabling entire CORS mode removes all CORS headers", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.check(
      "input[name='sucuriscan_enforced_Access-Control-Allow-Origin']",
      {
        force: true,
      },
    );
    await page.fill(
      "input[name='sucuriscan_cors_Access-Control-Allow-Origin']",
      "example.org",
    );

    await page.selectOption("[data-cy=sucuriscan_cors_options_mode_button]", {
      label: "enabled",
    });
    await page.click("[data-cy=sucuriscan_headers_cors_control_submit_btn]", {
      force: true,
    });

    const enabledResponse = await request.get("/");
    expect(enabledResponse.headers()["access-control-allow-origin"]).toBe(
      "example.org",
    );

    await page.selectOption("[data-cy=sucuriscan_cors_options_mode_button]", {
      label: "disabled",
    });
    await page.click("[data-cy=sucuriscan_headers_cors_control_submit_btn]", {
      force: true,
    });

    const disabledResponse = await request.get("/");
    expect(
      disabledResponse.headers()["access-control-allow-origin"],
    ).toBeUndefined();
  });
});
