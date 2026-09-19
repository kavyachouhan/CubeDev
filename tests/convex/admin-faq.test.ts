import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { asAdmin, asUser, makeConvex, seedPair, seedUser } from "../setup/convex";
import { adminProfile } from "../fixtures/users";

describe("admin authorization", () => {
  it("rejects non-admin identity on admin queries", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    await expect(
      asUser(t, userAId, { email: "alice@example.com" }).query(
        api.admin.getSystemStats,
        {},
      ),
    ).rejects.toThrow(/Not authorized/);
  });

  it("rejects isAdmin claim when email is not on the allowlist", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    await expect(
      asUser(t, userAId, {
        email: "revoked@example.com",
        isAdmin: true,
      }).query(api.admin.getSystemStats, {}),
    ).rejects.toThrow(/Not authorized/);
  });

  it("allows allowlisted admin email without the isAdmin claim", async () => {
    const t = makeConvex();
    const adminId = await seedUser(t, adminProfile);
    const stats = await asUser(t, adminId, { email: adminProfile.email }).query(
      api.admin.getSystemStats,
      {},
    );
    expect(stats.users.total).toBeGreaterThanOrEqual(1);
  });
});

describe("FAQ admin vs public", () => {
  it("lets anyone read published categories and blocks non-admin writes", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    const published = await t.query(api.faq.getPublishedCategories, {});
    expect(published).toEqual([]);

    await expect(
      asUser(t, userAId).mutation(api.faq.createCategory, {
        name: "Timer",
        slug: "timer",
        description: "Timer help",
        icon: "clock",
        order: 1,
        isPublished: true,
      }),
    ).rejects.toThrow(/Not authorized/);

    const adminId = await seedUser(t, adminProfile);
    const categoryId = await asAdmin(t, adminId).mutation(api.faq.createCategory, {
      name: "Timer",
      slug: "timer",
      description: "Timer help",
      icon: "clock",
      order: 1,
      isPublished: true,
    });
    const after = await t.query(api.faq.getPublishedCategories, {});
    expect(after.some((c) => c._id === categoryId)).toBe(true);
  });
});
