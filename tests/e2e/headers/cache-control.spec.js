const { test, expect } = require("@playwright/test");
const { login } = require("../helpers/wp-auth");

test.describe("Headers - Cache Control", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Can toggle the header cache control setting", async ({ page }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.selectOption(
      "[data-cy=sucuriscan_headers_cache_control_dropdown]",
      {
        label: "Busy",
      },
    );
    await page.click("[data-cy=sucuriscan_headers_cache_control_submit_btn]", {
      force: true,
    });
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Cache-Control header was activated.",
    );

    await page.selectOption(
      "[data-cy=sucuriscan_headers_cache_control_dropdown]",
      {
        label: "Disabled",
      },
    );
    await page.click("[data-cy=sucuriscan_headers_cache_control_submit_btn]", {
      force: true,
    });
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Cache-Control header was deactivated.",
    );
  });

  test("Can set the Cache-Control header properly", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.selectOption(
      "[data-cy=sucuriscan_headers_cache_control_dropdown]",
      {
        label: "Busy",
      },
    );
    await page.click("[data-cy=sucuriscan_headers_cache_control_submit_btn]", {
      force: true,
    });
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Cache-Control header was activated.",
    );

    await page.goto("/wp-admin/admin.php?page=sucuriscan_lastlogins#allusers");
    await page.context().clearCookies();

    const mainResponse = await request.get("/");
    expect(mainResponse.headers()["cache-control"]).toBe("max-age=300");

    const postResponse = await request.get("/?p=1");
    expect(postResponse.headers()["cache-control"]).toBe("max-age=600");

    const pageResponse = await request.get("/?page_id=2");
    expect(pageResponse.headers()["cache-control"]).toBe("max-age=600");

    const categoryResponse = await request.get("/?cat=1");
    expect(categoryResponse.headers()["cache-control"]).toBe("max-age=600");

    const authorResponse = await request.get("/?author=1");
    expect(authorResponse.headers()["cache-control"]).toBe("max-age=600");

    const notFoundResponse = await request.get("/?p=12");
    expect(notFoundResponse.headers()["cache-control"]).toBe("max-age=600");
  });

  test("Can customize the Cache-Control header properly", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.selectOption(
      "[data-cy=sucuriscan_headers_cache_control_dropdown]",
      {
        label: "Disabled",
      },
    );
    await page.click("[data-cy=sucuriscan_headers_cache_control_submit_btn]", {
      force: true,
    });
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Cache-Control header was deactivated.",
    );

    await page.click("[data-cy=sucuriscan-row-posts]");
    await page.fill("[name=sucuriscan_posts_max_age]", "12345");
    await expect(
      page.locator("[data-cy=sucuriscan_headers_cache_control_dropdown]"),
    ).toHaveValue("custom");
    await page.click("[data-cy=sucuriscan-row-posts]");

    await expect(page.locator(".sucuriscan-hstatus-1")).toContainText(
      "Enabled",
    );

    await page.goto("/wp-admin/admin.php?page=sucuriscan_lastlogins#allusers");
    await page.context().clearCookies();

    const postResponse = await request.get("/?p=1");
    expect(postResponse.headers()["cache-control"]).toBe("max-age=12345");
  });

  test("Can customize the old age multiplier for the Cache-Control header", async ({
    page,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.selectOption(
      "[data-cy=sucuriscan_headers_cache_control_dropdown]",
      {
        label: "Disabled",
      },
    );
    await page.click("[data-cy=sucuriscan_headers_cache_control_submit_btn]", {
      force: true,
    });
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Cache-Control header was deactivated.",
    );

    await expect(
      page.locator("[name=sucuriscan_posts_old_age_multiplier]"),
    ).not.toBeChecked();

    await page.click("[data-cy=sucuriscan-row-posts]");
    await page.check("[name=sucuriscan_posts_old_age_multiplier]");
    await page.click("[data-cy=sucuriscan-row-posts]");

    await expect(page.locator(".sucuriscan-hstatus-1")).toContainText(
      "Enabled",
    );

    await page.goto("/wp-admin/admin.php?page=sucuriscan_lastlogins#allusers");
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await expect(
      page.locator("[name=sucuriscan_posts_old_age_multiplier]"),
    ).toBeChecked();

    await page.click("[data-cy=sucuriscan-row-posts]");
    await page.uncheck("[name=sucuriscan_posts_old_age_multiplier]");
    await page.click("[data-cy=sucuriscan-row-posts]");

    await expect(
      page.locator("[name=sucuriscan_posts_old_age_multiplier]"),
    ).not.toBeChecked();
    await expect(page.locator(".sucuriscan-hstatus-1")).toContainText(
      "Enabled",
    );
  });

  test("Cache-Control header functionality pages protected by log in", async ({
    page,
    request,
  }) => {
    await page.goto("/wp-admin/admin.php?page=sucuriscan_headers_management");

    await page.selectOption(
      "[data-cy=sucuriscan_headers_cache_control_dropdown]",
      {
        label: "Frequent",
      },
    );
    await page.click("[data-cy=sucuriscan_headers_cache_control_submit_btn]", {
      force: true,
    });
    await expect(page.locator(".sucuriscan-alert")).toContainText(
      "Cache-Control header was activated.",
    );

    await page.goto("/wp-admin/admin.php?page=sucuriscan_lastlogins#allusers");

    const adminResponse = await request.get("/wp-admin/index.php");
    expect(adminResponse.headers()["cache-control"]).toBe(
      "no-cache, must-revalidate, max-age=0, no-store, private",
    );

    await page.context().clearCookies();

    const mainResponse = await request.get("/");
    expect(mainResponse.headers()["cache-control"]).toBe("max-age=1800");
  });
});
