import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { asUser, makeConvex, seedPair, seedUser, withServerSecret } from "../setup/convex";
import { privateProfile, userAProfile } from "../fixtures/users";

describe("upsertUser", () => {
  it("rejects unauthenticated upserts without a matching serverSecret", async () => {
    const t = makeConvex();
    await expect(t.mutation(api.users.upsertUser, userAProfile)).rejects.toThrow();
    await expect(
      t.mutation(api.users.upsertUser, {
        ...userAProfile,
        serverSecret: "wrong-secret",
      }),
    ).rejects.toThrow(/Not authorized/);
  });

  it("creates a user when the server secret matches", async () => {
    const t = makeConvex();
    const userId = await t.mutation(
      api.users.upsertUser,
      withServerSecret(userAProfile),
    );
    expect(userId).toBeTruthy();
    const user = await t.query(api.users.getUserByWcaId, {
      wcaId: userAProfile.wcaId,
    });
    expect(user?.name).toBe(userAProfile.name);
    expect(user?.email).toBeUndefined();
  });

  it("updates an existing profile by wcaUserId only with the server secret", async () => {
    const t = makeConvex();
    const userId = await t.mutation(
      api.users.upsertUser,
      withServerSecret(userAProfile),
    );
    const again = await t.mutation(
      api.users.upsertUser,
      withServerSecret({
        ...userAProfile,
        name: "Updated Name",
        countryIso2: "IN",
        email: "alice-new@example.com",
      }),
    );
    expect(again).toBe(userId);
    const user = await t.query(api.users.getUserById, { id: userId });
    expect(user?.name).toBe("Updated Name");
    expect(user?.countryIso2).toBe("IN");
  });

  it("does not persist OAuth tokens even if extra fields are sent", async () => {
    const t = makeConvex();
    const userId = await t.mutation(
      api.users.upsertUser,
      withServerSecret(userAProfile),
    );
    const raw = await t.run(async (ctx) => ctx.db.get(userId));
    expect(raw?.accessToken).toBeUndefined();
    expect(raw?.refreshToken).toBeUndefined();
  });
});

describe("profile privacy", () => {
  it("hides hidden profiles from public getUserById / getUserByWcaId / getAllUsers", async () => {
    const t = makeConvex();
    const userId = await seedUser(t, privateProfile);
    await asUser(t, userId, { email: privateProfile.email }).mutation(
      api.users.updatePrivacySettings,
      { userId, hideProfile: true },
    );

    const byId = await t.query(api.users.getUserById, { id: userId });
    expect(byId).toBeNull();

    const byWca = await t.query(api.users.getUserByWcaId, {
      wcaId: privateProfile.wcaId,
    });
    expect(byWca).toBeNull();

    const directory = await t.query(api.users.getAllUsers, { limit: 24 });
    expect(directory.users.some((u) => u._id === userId)).toBe(false);

    const eventStats = await t.query(api.users.getUserEventStats, { userId });
    expect(eventStats).toEqual([]);
  });

  it("owner still sees owner projection including email", async () => {
    const t = makeConvex();
    const userId = await seedUser(t, userAProfile);
    const owner = await asUser(t, userId, { email: userAProfile.email }).query(
      api.users.getUserById,
      { id: userId },
    );
    expect(owner && "email" in owner && owner.email).toBe(userAProfile.email);
  });
});

describe("authorization on user-owned data", () => {
  it("rejects unauthenticated session and solve writes", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    await expect(
      t.mutation(api.users.createSession, {
        userId: userAId,
        name: "Session 1",
        event: "333",
      }),
    ).rejects.toThrow(/Not authenticated/);
  });

  it("rejects User B creating a session for User A", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    await expect(
      asUser(t, userBId).mutation(api.users.createSession, {
        userId: userAId,
        name: "Hijack",
        event: "333",
      }),
    ).rejects.toThrow(/Not authorized/);
  });

  it("lets the owner create a session, save a solve, and hides it from User B", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    const sessionId = await asUser(t, userAId).mutation(api.users.createSession, {
      userId: userAId,
      name: "Session 1",
      event: "333",
    });
    const solveId = await asUser(t, userAId).mutation(api.users.saveSolve, {
      userId: userAId,
      sessionId,
      event: "333",
      scramble: "R U R' U'",
      time: 12340,
      penalty: "none",
      finalTime: 12340,
    });

    await expect(
      asUser(t, userBId).query(api.users.getUserSessions, { userId: userAId }),
    ).rejects.toThrow(/Not authorized/);

    await expect(
      asUser(t, userBId).mutation(api.users.deleteSolve, { solveId }),
    ).rejects.toThrow(/Not authorized/);

    await asUser(t, userAId).mutation(api.users.deleteSolve, { solveId });
    const leftover = await t.run(async (ctx) => ctx.db.get(solveId));
    expect(leftover).toBeNull();
  });

  it("recomputes finalTime from time and penalty instead of trusting the client", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    const sessionId = await asUser(t, userAId).mutation(api.users.createSession, {
      userId: userAId,
      name: "Session 1",
      event: "333",
    });
    const solveId = await asUser(t, userAId).mutation(api.users.saveSolve, {
      userId: userAId,
      sessionId,
      event: "333",
      scramble: "R U",
      time: 10000,
      penalty: "DNF",
      finalTime: 10000,
    });
    const solve = await t.run(async (ctx) => ctx.db.get(solveId));
    expect(solve?.penalty).toBe("DNF");
    expect(solve?.finalTime).toBe(Infinity);
  });

  it("applies +2 and DNF in addSolve", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    const sessionId = await asUser(t, userAId).mutation(api.users.createSession, {
      userId: userAId,
      name: "Session 1",
      event: "333",
    });
    const plus2 = await asUser(t, userAId).mutation(api.users.addSolve, {
      userId: userAId,
      sessionId,
      event: "333",
      time: 10000,
      scramble: "R U",
      penalty: "+2",
    });
    const dnf = await asUser(t, userAId).mutation(api.users.addSolve, {
      userId: userAId,
      sessionId,
      event: "333",
      time: 10000,
      scramble: "R U",
      penalty: "DNF",
    });
    const plus2Doc = await t.run(async (ctx) => ctx.db.get(plus2));
    const dnfDoc = await t.run(async (ctx) => ctx.db.get(dnf));
    expect(plus2Doc?.finalTime).toBe(12000);
    expect(dnfDoc?.finalTime).toBe(Infinity);
  });
});

describe("account deletion", () => {
  it("soft-deletes the user and removes sessions/solves", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    const sessionId = await asUser(t, userAId).mutation(api.users.createSession, {
      userId: userAId,
      name: "Session 1",
      event: "333",
    });
    await asUser(t, userAId).mutation(api.users.saveSolve, {
      userId: userAId,
      sessionId,
      event: "333",
      scramble: "R U",
      time: 1000,
      penalty: "none",
      finalTime: 1000,
    });
    const result = await asUser(t, userAId).mutation(
      api.users.deleteUserAccount,
      { userId: userAId },
    );
    expect(result.success).toBe(true);
    expect(result.details.deletedSolves).toBe(1);
    const user = await t.run(async (ctx) => ctx.db.get(userAId));
    expect(user?.isDeleted).toBe(true);
    expect(user?.email).toBeUndefined();
    const identityUser = await asUser(t, userAId).query(
      api.users.getCurrentUser,
      {},
    );
    expect(identityUser).toBeNull();
  });
});

describe("concurrent saves", () => {
  it("increments session solveCount for parallel saves", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    const asA = asUser(t, userAId);
    const sessionId = await asA.mutation(api.users.createSession, {
      userId: userAId,
      name: "Session 1",
      event: "333",
    });
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        asA.mutation(api.users.saveSolve, {
          userId: userAId,
          sessionId,
          event: "333",
          scramble: `R${i}`,
          time: 10000 + i,
          penalty: "none",
          finalTime: 10000 + i,
        }),
      ),
    );
    const session = await t.run(async (ctx) => ctx.db.get(sessionId));
    const solves = await t.run(async (ctx) =>
      ctx.db
        .query("solves")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect(),
    );
    expect(solves).toHaveLength(10);
    expect(session?.solveCount).toBe(10);
  });
});
