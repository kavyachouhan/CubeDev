import { describe, expect, it } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { asUser, makeConvex, scrambleSet, seedPair } from "../setup/convex";

describe("challenge rooms", () => {
  it("requires auth to create a room", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    await expect(
      t.mutation(api.challengeRooms.createRoom, {
        userId: userAId,
        name: "Room",
        event: "333",
        format: "ao5",
        scrambles: scrambleSet,
      }),
    ).rejects.toThrow(/Not authenticated/);
  });

  it("creates, joins, and submits Ao5 solves with duplicate-slot protection", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    const created = await asUser(t, userAId).mutation(
      api.challengeRooms.createRoom,
      {
        userId: userAId,
        name: "Friday Ao5",
        event: "333",
        format: "ao5",
        scrambles: scrambleSet,
        isPublic: false,
      },
    );
    expect(created.roomId).toMatch(/^[A-Z0-9]{6}$/);

    const detailsUnauthed = await t.query(api.challengeRooms.getRoomDetails, {
      roomId: created.roomId,
    });
    expect(detailsUnauthed?.room.name).toBe("Friday Ao5");
    expect(detailsUnauthed?.room.isPublic).toBe(false);

    await asUser(t, userAId).mutation(api.challengeRooms.joinRoom, {
      userId: userAId,
      roomId: created.roomId,
    });
    await asUser(t, userBId).mutation(api.challengeRooms.joinRoom, {
      userId: userBId,
      roomId: created.roomId,
    });

    const solve = await asUser(t, userAId).mutation(
      api.challengeRooms.submitSolve,
      {
        userId: userAId,
        roomId: created.roomId,
        solveNumber: 1,
        time: 12340,
        penalty: "none",
      },
    );
    const stored = await t.run(async (ctx) => ctx.db.get(solve));
    expect(stored?.finalTime).toBe(12340);

    await expect(
      asUser(t, userAId).mutation(api.challengeRooms.submitSolve, {
        userId: userAId,
        roomId: created.roomId,
        solveNumber: 1,
        time: 99999,
        penalty: "none",
      }),
    ).rejects.toThrow(/already submitted/i);

    await expect(
      asUser(t, userBId).mutation(api.challengeRooms.updateRoom, {
        userId: userBId,
        roomId: created.roomId,
        title: "Hijacked",
        description: "nope",
      }),
    ).rejects.toThrow(/Not authorized/);
  });

  it("blocks submit after expiry", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    const created = await asUser(t, userAId).mutation(
      api.challengeRooms.createRoom,
      {
        userId: userAId,
        name: "Old",
        event: "333",
        format: "ao5",
        scrambles: scrambleSet,
      },
    );
    await t.run(async (ctx) => {
      const room = await ctx.db
        .query("challengeRooms")
        .withIndex("by_room_id", (q) => q.eq("roomId", created.roomId))
        .first();
      if (room) {
        await ctx.db.patch(room._id, { expiresAt: Date.now() - 1000 });
      }
    });
    await expect(
      asUser(t, userAId).mutation(api.challengeRooms.joinRoom, {
        userId: userAId,
        roomId: created.roomId,
      }),
    ).rejects.toThrow(/expired/i);
  });

  it("marks rooms expired via the internal processor", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    const created = await asUser(t, userAId).mutation(
      api.challengeRooms.createRoom,
      {
        userId: userAId,
        name: "Expire me",
        event: "333",
        format: "ao5",
        scrambles: scrambleSet,
      },
    );
    await t.run(async (ctx) => {
      const room = await ctx.db
        .query("challengeRooms")
        .withIndex("by_room_id", (q) => q.eq("roomId", created.roomId))
        .first();
      if (room) {
        await ctx.db.patch(room._id, { expiresAt: Date.now() - 1000 });
      }
    });
    await t.mutation(internal.challengeRooms.processExpiredRooms, {});
    const details = await t.query(api.challengeRooms.getRoomDetails, {
      roomId: created.roomId,
    });
    expect(details?.room.status).toBe("expired");
  });

  it("returns null for unknown room ids", async () => {
    const t = makeConvex();
    expect(
      await t.query(api.challengeRooms.getRoomDetails, { roomId: "ZZZZZZ" }),
    ).toBeNull();
  });
});
