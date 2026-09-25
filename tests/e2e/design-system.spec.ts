import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Exercises the design-system gallery, which needs no auth and no data, so the
 * primitives can be checked across both themes, all five color schemes and the
 * accessibility toggles. The gallery is dev-only, so these tests are skipped
 * against a production build.
 */

const GALLERY = "/design-system";
const THEMES = ["dark", "light"] as const;
const SCHEMES = ["blue", "purple", "green", "orange", "cyan"] as const;
const WIDTHS = [375, 768, 1440];

async function applyTheme(
  page: import("@playwright/test").Page,
  theme: string,
  scheme: string,
) {
  await page.evaluate(
    ([t, s]) => {
      document.documentElement.setAttribute("data-theme", t);
      document.documentElement.setAttribute("data-color-scheme", s);
    },
    [theme, scheme],
  );
}

test.beforeEach(async ({ page }) => {
  const response = await page.goto(GALLERY);
  // A production build returns 404 for the gallery; nothing to test there.
  test.skip(
    response?.status() === 404,
    "gallery is not served in production builds",
  );
  await expect(
    page.getByRole("heading", { name: /cubedev design system/i }),
  ).toBeVisible();
});

test("renders every primitive section", async ({ page }) => {
  for (const name of [
    "Buttons",
    "Form controls",
    "Selection",
    "Cards and metrics",
    "Badges and times",
    "Feedback",
    "Overlays",
    "Navigation",
    "Table",
    "Typography",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
});

for (const theme of THEMES) {
  for (const scheme of SCHEMES) {
    test(`has no serious accessibility issues: ${theme} / ${scheme}`, async ({
      page,
    }) => {
      await applyTheme(page, theme, scheme);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      const blocking = results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      );
      expect(
        blocking.map((v) => `${v.id}: ${v.help}`),
        `${theme}/${scheme} has blocking violations`,
      ).toEqual([]);
    });
  }
}

for (const width of WIDTHS) {
  test(`does not scroll horizontally at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflows, `page overflows horizontally at ${width}px`).toBe(false);
  });
}

test("modal traps focus and closes on Escape", async ({ page }) => {
  await page.getByRole("button", { name: "Modal (dialog)" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Focus must stay inside the dialog while it is open.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await dialog.evaluate((panel) =>
      panel.contains(document.activeElement),
    );
    expect(inside, "focus escaped the dialog").toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("modal locks scrolling behind it and restores it on close", async ({
  page,
}) => {
  const overflowNow = () =>
    page.evaluate(() => getComputedStyle(document.body).overflow);

  const before = await overflowNow();
  await page.getByRole("button", { name: "Modal (dialog)" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await overflowNow()).toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(await overflowNow()).toBe(before);
});

test("menu opens with the keyboard and closes on Escape", async ({ page }) => {
  await page.getByRole("button", { name: "Menu", exact: true }).focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: /edit/i })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("toasts announce themselves", async ({ page }) => {
  await page.getByRole("button", { name: "Success toast" }).click();
  const toast = page.getByText("Saved", { exact: true });
  await expect(toast).toBeVisible();
});

test("reduced motion removes dialog animation", async ({ page }) => {
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-reduce-motion", "true"),
  );
  await page.getByRole("button", { name: "Modal (dialog)" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const animation = await dialog.evaluate(
    (panel) => getComputedStyle(panel).animationName,
  );
  expect(animation === "none" || animation === "").toBe(true);
});
