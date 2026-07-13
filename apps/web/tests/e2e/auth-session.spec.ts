import { expect, test } from "@playwright/test";

test.describe("auth session", () => {
  test("login page renders without demo Google success copy", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
    await expect(page.getByText("demo student account")).toHaveCount(0);
  });

  test("registration page collects API-required profile fields", async ({
    page,
  }) => {
    await page.goto("/auth/register");
    await expect(page.getByLabel("First name")).toBeVisible();
    await expect(page.getByLabel("Last name")).toBeVisible();
    await expect(page.getByLabel("Date of birth")).toBeVisible();
  });
});
