import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { asUser, makeConvex, seedPair, seedUser, withServerSecret } from "../setup/convex";
import { privateProfile, userAProfile } from "../fixtures/users";

describe("security: identity and IDOR", () => {
  it("rejects unauthenticated upsertUser without the server secret", async () => {
    const t = makeConvex();
    await expect(t.mutation(api.users.upsertUser, userAProfile)).rejects.toThrow();
    const id = await t.mutation(
      api.users.upsertUser,
      withServerSecret(userAProfile),
    );
    await expect(
      t.mutation(api.users.upsertUser, {
        ...userAProfile,
        name: "Hijacked",
      }),
    ).rejects.toThrow();
    const user = await t.query(api.users.getUserById, { id });
    expect(user?.name).toBe(userAProfile.name);
  });

  it("hides hidden profiles from getAllUsers", async () => {
    const t = makeConvex();
    const userId = await seedUser(t, privateProfile);
    await asUser(t, userId).mutation(api.users.updatePrivacySettings, {
      userId,
      hideProfile: true,
    });
    const listed = await t.query(api.users.getAllUsers, {});
    expect(listed.users.some((u) => u.wcaId === privateProfile.wcaId)).toBe(
      false,
    );
  });

  it("rejects unauthenticated startLearning for another user's SRS progress", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    const ids = await t.run(async (ctx) => {
      const setId = await ctx.db.insert("algorithmSets", {
        name: "PLL",
        slug: "pll",
        category: "CFOP",
        description: "PLL",
        caseCount: 1,
        difficulty: "beginner",
        order: 1,
        isPublished: true,
        createdAt: Date.now(),
      });
      const caseId = await ctx.db.insert("algorithmCases", {
        setId,
        caseName: "Ua",
        setupMoves: "R U",
        recognition: [],
        difficulty: 1,
        frequency: 1,
        order: 1,
        createdAt: Date.now(),
      });
      const preferredAlgId = await ctx.db.insert("algorithms", {
        caseId,
        notation: "R U R'",
        moveCount: 3,
        popularity: 1,
        isDefault: true,
        createdAt: Date.now(),
      });
      return { caseId, preferredAlgId };
    });
    await expect(
      t.mutation(api.algorithms.startLearning, {
        userId: userAId,
        ...ids,
      }),
    ).rejects.toThrow(/Not authenticated/);
    const progress = await t.run(async (ctx) =>
      ctx.db
        .query("userAlgorithmProgress")
        .withIndex("by_user_case", (q) =>
          q.eq("userId", userAId).eq("caseId", ids.caseId),
        )
        .first(),
    );
    expect(progress).toBeNull();
  });

  it("core timer mutations are not IDOR-able across users", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    await expect(
      asUser(t, userBId).mutation(api.users.updatePrivacySettings, {
        userId: userAId,
        hideProfile: true,
      }),
    ).rejects.toThrow(/Not authorized/);
  });
});
