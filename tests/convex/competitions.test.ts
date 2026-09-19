import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { asUser, makeConvex, seedPair } from "../setup/convex";
import { userAProfile, userBProfile } from "../fixtures/users";

const atmosphere = {
  crowdNoise: 0.5,
  pressure: 0.5,
  distractions: false,
  timerDelay: false,
  judgeInteractions: false,
};

describe("competition simulations", () => {
  it("creates a simulation for the authenticated matching WCA ID", async () => {
    const t = makeConvex();
    const { userAId, userBId } = await seedPair(t);
    const simulationId = await asUser(t, userAId).mutation(
      api.competitionSimulations.createSimulation,
      {
        wcaId: userAProfile.wcaId,
        competitionId: "WC2026",
        competitionName: "Worlds",
        competitionDate: "2026-07-01",
        selectedEvents: ["333"],
        atmosphereSettings: atmosphere,
      },
    );
    const own = await asUser(t, userAId).query(
      api.competitionSimulations.getSimulation,
      { simulationId },
    );
    expect(own?.status).toBe("in-progress");

    await expect(
      asUser(t, userBId).query(api.competitionSimulations.getSimulation, {
        simulationId,
      }),
    ).rejects.toThrow();

    await expect(
      asUser(t, userBId).mutation(
        api.competitionSimulations.abandonSimulation,
        { simulationId },
      ),
    ).rejects.toThrow();

    await asUser(t, userAId).mutation(
      api.competitionSimulations.abandonSimulation,
      { simulationId },
    );
    const abandoned = await asUser(t, userAId).query(
      api.competitionSimulations.getSimulation,
      { simulationId },
    );
    expect(abandoned?.status).toBe("abandoned");
  });

  it("rejects creating a simulation for another WCA ID", async () => {
    const t = makeConvex();
    const { userAId } = await seedPair(t);
    await expect(
      asUser(t, userAId).mutation(api.competitionSimulations.createSimulation, {
        wcaId: userBProfile.wcaId,
        competitionId: "WC2026",
        competitionName: "Worlds",
        competitionDate: "2026-07-01",
        selectedEvents: ["333"],
        atmosphereSettings: atmosphere,
      }),
    ).rejects.toThrow(/Not authorized/);
  });
});
