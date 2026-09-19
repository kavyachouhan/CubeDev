import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { asUser, makeConvex, seedPair } from "../setup/convex";

async function seedCase(t: ReturnType<typeof makeConvex>) {
  return await t.run(async (ctx) => {
    const setId = await ctx.db.insert("algorithmSets", {
      name: "PLL",
      slug: "pll",
      category: "CFOP",
      description: "PLL",
      caseCount: 1,
      difficulty: "intermediate",
      order: 1,
      isPublished: true,
      createdAt: Date.now(),
    });
    const caseId = await ctx.db.insert("algorithmCases", {
      setId,
      caseName: "T-Perm",
      slug: "t-perm",
      setupMoves: "R U",
      recognition: ["headlights"],
      difficulty: 3,
      frequency: 4,
      order: 1,
      createdAt: Date.now(),
    });
    const algId = await ctx.db.insert("algorithms", {
      caseId,
      notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
      moveCount: 14,
      popularity: 90,
      isDefault: true,
      createdAt: Date.now(),
    });
    return { setId, caseId, algId };
  });
}

describe("algorithm trainer", () => {
  it("requires matching identity for startLearning", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    const { caseId, algId } = await seedCase(t);
    await expect(
      t.mutation(api.algorithms.startLearning, {
        userId: userAId,
        caseId,
        preferredAlgId: algId,
      }),
    ).rejects.toThrow(/Not authenticated/);
    await expect(
      asUser(t, userBId).mutation(api.algorithms.startLearning, {
        userId: userAId,
        caseId,
        preferredAlgId: algId,
      }),
    ).rejects.toThrow(/Not authorized/);
    const progressId = await asUser(t, userAId).mutation(
      api.algorithms.startLearning,
      {
        userId: userAId,
        caseId,
        preferredAlgId: algId,
      },
    );
    expect(progressId).toBeTruthy();
  });

  it("recordReview and custom sets require matching identity", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    const { caseId } = await seedCase(t);

    await expect(
      asUser(t, userBId).mutation(api.algorithms.recordReview, {
        userId: userAId,
        caseId,
        rating: "good",
        wasCorrect: true,
      }),
    ).rejects.toThrow(/Not authorized/);

    await asUser(t, userAId).mutation(api.algorithms.recordReview, {
      userId: userAId,
      caseId,
      rating: "good",
      wasCorrect: true,
    });

    const setId = await asUser(t, userAId).mutation(
      api.algorithms.createCustomSet,
      {
        userId: userAId,
        name: "My PLL",
        caseIds: [caseId],
        isPublic: false,
      },
    );
    await expect(
      asUser(t, userBId).mutation(api.algorithms.deleteCustomSet, { setId }),
    ).rejects.toThrow();
  });
});

describe("push subscriptions", () => {
  it("save/remove require ownership", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    const endpoint = "https://push.example/sub-a";
    await asUser(t, userAId).mutation(api.pushNotifications.saveSubscription, {
      userId: userAId,
      endpoint,
      keys: { p256dh: "p", auth: "a" },
    });
    await expect(
      asUser(t, userBId).mutation(api.pushNotifications.removeSubscription, {
        endpoint,
      }),
    ).rejects.toThrow(/Not authorized/);
  });
});
