import { describe, expect, it } from "vitest";
import {
  BEST_OF_EVENTS,
  DEPRECATED_EVENTS,
  calculateKinchEventScore,
  formatTime,
} from "@/lib/wca-stats-utils";

describe("formatTime (WCA centiseconds)", () => {
  it("returns DNF for non-positive values", () => {
    expect(formatTime(0)).toBe("DNF");
    expect(formatTime(-1)).toBe("DNF");
  });

  it("formats seconds, minutes, and hours", () => {
    expect(formatTime(123)).toBe("1.23");
    expect(formatTime(6500)).toBe("1:05.00");
    expect(formatTime(360000)).toBe("1:00:00.00");
  });

  it("formats FMC as moves", () => {
    expect(formatTime(2500, "333fm")).toBe("25");
    expect(formatTime(2550, "333fm")).toBe("25.50");
  });
});

describe("Kinch", () => {
  it("returns 0 for missing or DNF PBs", () => {
    expect(calculateKinchEventScore(0, 500, "333")).toBe(0);
    expect(calculateKinchEventScore(-1, 500, "333")).toBe(0);
  });

  it("scores WR/PB * 100 for standard events", () => {
    expect(calculateKinchEventScore(1000, 500, "333")).toBe(50);
  });

  it("knows deprecated and best-of event sets", () => {
    expect(DEPRECATED_EVENTS.has("333ft")).toBe(true);
    expect(BEST_OF_EVENTS.has("333bf")).toBe(true);
  });
});
