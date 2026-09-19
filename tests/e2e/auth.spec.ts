import { expect, test } from "@playwright/test";
import { createSessionToken, SESSION_COOKIE } from "../../lib/session";
import { TEST_ADMIN_EMAIL, applyTestEnv } from "../setup/env";

applyTestEnv();

test("authenticated timer route does not show the guest gate", async ({
  page,
}) => {
  const token = await createSessionToken({
    userId: "e2e-user",
    wcaId: "2018TEST01",
    email: "alice@example.com",
  });
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      url: "http://127.0.0.1:3000",
    },
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
  await page.goto("/cube-lab/timer");
  await expect(page.getByText(/authentication required/i)).toHaveCount(0, {
    timeout: 15_000,
  });
});

test("non-admin session does not unlock admin APIs", async ({ request }) => {
  const token = await createSessionToken({
    userId: "e2e-user",
    email: "alice@example.com",
  });
  const res = await request.get("/api/admin/verify", {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).isAdmin).toBe(false);
});

test("admin session reports isAdmin", async ({ request }) => {
  const token = await createSessionToken({
    userId: "e2e-admin",
    email: TEST_ADMIN_EMAIL,
  });
  const res = await request.get("/api/admin/verify", {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).isAdmin).toBe(true);
});
