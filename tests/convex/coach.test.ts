import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { asUser, makeConvex, seedPair, seedUser } from "../setup/convex";
import { privateProfile } from "../fixtures/users";

const coachArgs = {
  skillLevel: "intermediate" as const,
  primaryEvent: "333",
  goalType: "sub-20" as const,
  targetDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  dailyPracticeMinutes: 30,
};

describe("coach privacy", () => {
  it("owner mutations require matching identity", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    await expect(
      asUser(t, userBId).mutation(api.coach.saveCoachProfile, {
        userId: userAId,
        ...coachArgs,
      }),
    ).rejects.toThrow(/Not authorized/);

    await asUser(t, userAId).mutation(api.coach.saveCoachProfile, {
      userId: userAId,
      ...coachArgs,
    });
    const own = await asUser(t, userAId).query(api.coach.getCoachProfile, {
      userId: userAId,
    });
    expect(own?.onboardingCompleted).toBe(true);
    const other = await asUser(t, userBId).query(api.coach.getCoachProfile, {
      userId: userAId,
    });
    expect(other).toBeNull();
  });

  it("hides coach-by-WCA data when hideProfile is set", async () => {
    const t = makeConvex();
    const userId = await seedUser(t, privateProfile);
    await asUser(t, userId, { email: privateProfile.email }).mutation(
      api.users.updatePrivacySettings,
      { userId, hideProfile: true },
    );
    await asUser(t, userId).mutation(api.coach.saveCoachProfile, {
      userId,
      ...coachArgs,
    });

    const profile = await t.query(api.coach.getCoachProfileByWcaId, {
      wcaId: privateProfile.wcaId,
    });
    expect(profile).toBeNull();

    const stats = await t.query(api.coach.getProgressStatsByWcaId, {
      wcaId: privateProfile.wcaId,
    });
    expect(stats).toBeNull();

    const goals = await t.query(api.coach.getGoalHistoryByWcaId, {
      wcaId: privateProfile.wcaId,
    });
    expect(goals).toEqual([]);
  });
});
