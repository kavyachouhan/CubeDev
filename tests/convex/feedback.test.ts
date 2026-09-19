import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { asUser, makeConvex, seedPair } from "../setup/convex";

describe("feedback", () => {
  it("requires matching identity when a userId is provided", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    await expect(
      asUser(t, userBId).mutation(api.feedbackResponses.submitFeedback, {
        userId: userAId,
        uiuxRating: 5,
      }),
    ).rejects.toThrow(/Not authorized/);
  });

  it("allows anonymous submission and validates rating bounds", async () => {
    const t = makeConvex();
    const result = await t.mutation(api.feedbackResponses.submitFeedback, {
      uiuxRating: 4,
      recommendScore: 9,
    });
    expect(result.feedbackId).toBeTruthy();

    await expect(
      t.mutation(api.feedbackResponses.submitFeedback, { uiuxRating: 9 }),
    ).rejects.toThrow(/1 and 5/);
  });

  it("does not leak another user's recent-feedback flag", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    await asUser(t, userAId).mutation(api.feedbackResponses.submitFeedback, {
      userId: userAId,
      surveyType: "general",
      uiuxRating: 5,
    });
    const leaked = await t.query(api.feedbackResponses.hasRecentFeedback, {
      userId: userAId,
      surveyType: "general",
    });
    expect(leaked).toBe(false);
    const otherUser = await asUser(t, userBId).query(
      api.feedbackResponses.hasRecentFeedback,
      { userId: userAId, surveyType: "general" },
    );
    expect(otherUser).toBe(false);
    const own = await asUser(t, userAId).query(
      api.feedbackResponses.hasRecentFeedback,
      { userId: userAId, surveyType: "general" },
    );
    expect(own).toBe(true);
    const version = await t.query(
      api.feedbackResponses.getLastSubmittedVersion,
      { userId: userAId, surveyType: "general" },
    );
    expect(version).toBeNull();
    const ownVersion = await asUser(t, userAId).query(
      api.feedbackResponses.getLastSubmittedVersion,
      { userId: userAId, surveyType: "general" },
    );
    expect(ownVersion).toBeTruthy();
  });
});
