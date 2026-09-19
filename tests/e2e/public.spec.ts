import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicPaths = [
  "/",
  "/about",
  "/help",
  "/privacy",
  "/terms",
  "/cuber",
  "/contact",
  "/credits",
];

for (const path of publicPaths) {
  test(`loads ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response, `no response for ${path}`).toBeTruthy();
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
}

test("health endpoint", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe("ok");
});

test("unknown route is not a 500", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist-qa");
  expect(response?.status()).toBeGreaterThanOrEqual(400);
  expect(response?.status()).toBeLessThan(500);
});

test("home has a sign-in control that is keyboard reachable", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).toBeTruthy();
});

test("unauthenticated Cube Lab shows authentication required", async ({
  page,
}) => {
  await page.goto("/cube-lab/timer");
  await expect(page.getByText(/authentication required/i)).toBeVisible({
    timeout: 15_000,
  });
});

test.describe("accessibility", () => {
  for (const path of ["/", "/help", "/contact"]) {
    test(`axe critical issues on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      const critical = results.violations.filter((v) => v.impact === "critical");
      expect(
        critical,
        critical.map((v) => `${v.id}: ${v.help}`).join("\n"),
      ).toEqual([]);
    });
  }
});
