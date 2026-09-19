import { describe, expect, it } from "vitest";
import {
  BPM_TO_MS,
  calculatePhaseTimes,
  findLargestStall,
  formatPhaseTime,
  getSplitMethod,
} from "@/lib/phase-splits";

describe("getSplitMethod", () => {
  it("returns CFOP phases and undefined for unknown ids", () => {
    expect(getSplitMethod("cfop")?.phases).toHaveLength(4);
    expect(getSplitMethod("missing")).toBeUndefined();
  });
});

describe("calculatePhaseTimes", () => {
  it("returns empty for missing splits", () => {
    expect(calculatePhaseTimes([], 10000)).toEqual([]);
  });

  it("computes durations and remaining time", () => {
    const phases = calculatePhaseTimes(
      [
        { phase: "cross", time: 2000 },
        { phase: "f2l", time: 7000 },
      ],
      10000,
    );
    expect(phases).toEqual([
      { phase: "cross", duration: 2000 },
      { phase: "f2l", duration: 5000 },
      { phase: "remaining", duration: 3000 },
    ]);
  });

  it("sorts splits even if they arrive out of order", () => {
    const phases = calculatePhaseTimes(
      [
        { phase: "f2l", time: 7000 },
        { phase: "cross", time: 2000 },
      ],
      7000,
    );
    expect(phases[0]).toEqual({ phase: "cross", duration: 2000 });
    expect(phases.some((p) => p.phase === "remaining")).toBe(false);
  });
});

describe("findLargestStall / formatPhaseTime / BPM", () => {
  it("returns the longest phase when a method exists", () => {
    const stall = findLargestStall(
      [
        { phase: "cross", duration: 1000 },
        { phase: "f2l", duration: 5000 },
      ],
      "cfop",
    );
    expect(stall?.phase).toBe("f2l");
  });

  it("returns null for empty phases or unknown method", () => {
    expect(findLargestStall([], "cfop")).toBeNull();
    expect(
      findLargestStall([{ phase: "x", duration: 1 }], "nope"),
    ).toBeNull();
  });

  it("formats sub-minute and minute phase times", () => {
    expect(formatPhaseTime(1234)).toBe("1.23");
    expect(formatPhaseTime(65_000)).toBe("1:05.00");
  });

  it("converts BPM to milliseconds", () => {
    expect(BPM_TO_MS(120)).toBe(500);
  });
});
