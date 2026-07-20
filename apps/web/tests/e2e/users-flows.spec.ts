import {
  expect,
  test,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";

const adminUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@scholartrend.test",
  status: "ACTIVE",
  role: "ADMIN",
  firstName: "Ada",
  lastName: "Admin",
  imageUrl: null,
  gender: "FEMALE",
  dateOfBirth: "1985-03-14",
} as const;

const studentUser = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "student@scholartrend.test",
  status: "ACTIVE",
  role: "STUDENT",
  firstName: "Grace",
  lastName: "Hopper",
  imageUrl: null,
  gender: "FEMALE",
  dateOfBirth: "1995-12-09",
} as const;

const overviewUsers = [
  adminUser,
  studentUser,
  {
    id: "33333333-3333-4333-8333-333333333333",
    email: "researcher@scholartrend.test",
    status: "INACTIVE",
    role: "RESEARCHER",
    firstName: "Katherine",
    lastName: "Johnson",
    imageUrl: null,
    gender: "FEMALE",
    dateOfBirth: "1990-08-26",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    email: "banned@scholartrend.test",
    status: "BANNED",
    role: "STUDENT",
    firstName: "Blocked",
    lastName: "Account",
    imageUrl: null,
    gender: "OTHER",
    dateOfBirth: "1992-01-02",
  },
] as const;

test.describe("Users API flows", () => {
  test("admin login redirects to the real user-derived overview", async ({
    page,
  }) => {
    const observedRequests: string[] = [];
    await page.route("**/api/backend/**", async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      observedRequests.push(`${request.method()} ${pathname}`);

      if (
        request.method() === "POST" &&
        pathname === "/api/backend/auth/login"
      ) {
        await fulfillApi(route, {
          accessToken: "admin-access-token",
          refreshToken: "admin-refresh-token",
        });
        return;
      }

      if (request.method() === "GET" && pathname === "/api/backend/auth/me") {
        await fulfillApi(route, adminUser);
        return;
      }

      if (request.method() === "GET" && pathname === "/api/backend/users") {
        await fulfillApi(route, { users: overviewUsers });
        return;
      }

      await route.abort("failed");
    });

    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(adminUser.email);
    await page.getByLabel("Password").fill("valid-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

    const metrics = page.getByRole("region", { name: "User account metrics" });
    await expectMetric(metrics, "Total Users", "4");
    await expectMetric(metrics, "Active Users", "2");
    await expectMetric(metrics, "Researchers", "1");
    await expectMetric(metrics, "Needs Attention", "2");
    await expect(page.getByText("researcher@scholartrend.test")).toBeVisible();
    await expect(page.getByText("banned@scholartrend.test")).toBeVisible();
    expect(observedRequests).toContain("GET /api/backend/users");
  });

  test("student profile PATCH sends only the dirty Swagger field", async ({
    page,
  }) => {
    let submittedPatch: unknown;

    await seedSession(page, {
      accessToken: "student-access-token",
      refreshToken: "student-refresh-token",
    });

    await page.route("**/api/backend/**", async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;

      if (request.method() === "GET" && pathname === "/api/backend/auth/me") {
        await fulfillApi(route, studentUser);
        return;
      }

      if (pathname === "/api/backend/users/me") {
        if (request.method() === "GET") {
          await fulfillApi(route, studentUser);
          return;
        }

        if (request.method() === "PATCH") {
          submittedPatch = request.postDataJSON();
          await fulfillApi(route, {
            ...studentUser,
            firstName: "Augusta",
          });
          return;
        }
      }

      await route.abort("failed");
    });

    await page.goto("/student/profile");
    await expect(
      page.getByRole("heading", { name: "Grace Hopper" }),
    ).toBeVisible();

    await page.getByLabel("First name").fill("Augusta");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByRole("heading", { name: "Augusta Hopper" }),
    ).toBeVisible();
    await expect.poll(() => submittedPatch).toEqual({ firstname: "Augusta" });
  });
});

async function seedSession(
  page: Page,
  session: { accessToken: string; refreshToken: string },
) {
  await page.addInitScript((value) => {
    window.localStorage.setItem(
      "scholartrend_auth_session",
      JSON.stringify(value),
    );
  }, session);
}

async function fulfillApi(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      success: true,
      message: "OK",
      data,
    }),
  });
}

async function expectMetric(metrics: Locator, label: string, value: string) {
  const metricHeading = metrics.getByText(label, { exact: true });
  await expect(metricHeading).toBeVisible();
  await expect(
    metricHeading.locator("..").getByText(value, { exact: true }),
  ).toBeVisible();
}
