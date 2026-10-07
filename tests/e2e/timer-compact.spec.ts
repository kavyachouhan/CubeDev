import { expect, test } from "@playwright/test";
import { createSessionToken, SESSION_COOKIE } from "../../lib/session";
import { applyTestEnv } from "../setup/env";

applyTestEnv();

async function signIn(page: import("@playwright/test").Page) {
  const token = await createSessionToken({
    userId: "e2e-user",
    wcaId: "2018TEST01",
    email: "alice@example.com",
  });
  await page.context().addCookies([
    { name: SESSION_COOKIE, value: token, url: "http://127.0.0.1:3000" },
  ]);
  await page.addInitScript(() => {
    localStorage.setItem(
      "wca_user",
      JSON.stringify({
        convexId: "e2e-user",
        name: "Alice",
        wcaId: "2018TEST01",
        email: "alice@example.com",
        loginTime: Date.now(),
      }),
    );
  });
}

test.describe("compact timer layout", () => {
  test("is the default and never scrolls the page", async ({ page }) => {
    await signIn(page);
    await page.goto("/cube-lab/timer");

    // Set pre-hydration by the blocking script, so the first paint is correct.
    await expect(page.locator("html")).toHaveAttribute(
      "data-timer-layout",
      "compact",
    );

    // The whole point of the layout: it fits, whether it is showing the
    // loading shell or the timer itself.
    const overflows = await page.evaluate(() => {
      const el = document.scrollingElement!;
      return el.scrollHeight - el.clientHeight;
    });
    expect(overflows).toBeLessThanOrEqual(1);
  });

  test("honours the cards layout preference", async ({ page }) => {
    await signIn(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "cubedev-theme-preferences",
        JSON.stringify({ timerLayout: "cards" }),
      );
    });
    await page.goto("/cube-lab/timer");

    await expect(page.locator("html")).toHaveAttribute(
      "data-timer-layout",
      "cards",
    );
  });
});
