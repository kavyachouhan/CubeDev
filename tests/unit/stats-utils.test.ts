import { describe, expect, it } from "vitest";
import {
  calculateAverage,
  calculateConsistency,
  calculateImprovementRate,
  calculatePercentiles,
  calculateRollingAverages,
  calculateSessionDuration,
  calculateSolvingStreaks,
  findBestAverage,
  formatDuration,
  formatTime,
  formatTimeShort,
  getEventDisplayName,
  getTimeOfDayDistribution,
  groupSolvesByPeriod,
  secondsToCentisMs,
  truncToCentisMs,
} from "@/lib/stats-utils";
import { makeSolve, ao5CleanTimes, ao5TwoDnf, ao5WithDnf } from "../fixtures/solves";

describe("truncToCentisMs", () => {
  it("truncates to centiseconds without rounding up", () => {
    expect(truncToCentisMs(1265)).toBe(1260);
    expect(truncToCentisMs(1269)).toBe(1260);
    expect(truncToCentisMs(10)).toBe(10);
  });

  it("passes through non-finite values", () => {
    expect(truncToCentisMs(Infinity)).toBe(Infinity);
    expect(Number.isNaN(truncToCentisMs(Number.NaN))).toBe(true);
  });
});

describe("secondsToCentisMs", () => {
  it("converts displayed seconds to ms without floating-point drift", () => {
    expect(secondsToCentisMs(0.29)).toBe(290);
    expect(secondsToCentisMs(1.26)).toBe(1260);
    expect(secondsToCentisMs(12.34)).toBe(12340);
  });
});

describe("formatTime", () => {
  it("formats DNF for non-finite values", () => {
    expect(formatTime(Infinity)).toBe("DNF");
    expect(formatTime(Number.NaN)).toBe("DNF");
  });

  it("formats sub-minute times truncated to centiseconds", () => {
    expect(formatTime(1265)).toBe("1.26");
    expect(formatTime(296)).toBe("0.29");
    expect(formatTime(0)).toBe("0.00");
    expect((296 / 1000).toFixed(2)).toBe("0.30");
  });

  it("formats minutes with zero-padded seconds", () => {
    expect(formatTime(65_000)).toBe("1:05.00");
  });
});

describe("formatTimeShort", () => {
  it("returns DNF for Infinity", () => {
    expect(formatTimeShort(Infinity)).toBe("DNF");
  });

  it("uses one decimal place", () => {
    expect(formatTimeShort(1234)).toBe("1.2");
  });
});

describe("formatDuration", () => {
  it("formats seconds, minutes, hours, and days", () => {
    expect(formatDuration(5_000)).toBe("5s");
    expect(formatDuration(65_000)).toBe("1m 5s");
    expect(formatDuration(3_600_000)).toBe("1h 0m");
    expect(formatDuration(90_000_000)).toBe("1d 1h");
  });
});

describe("calculateAverage", () => {
  it("returns null when there are not enough solves", () => {
    expect(calculateAverage([1000, 2000, 3000, 4000], 5)).toBeNull();
    expect(calculateAverage([], 5)).toBeNull();
  });

  it("drops best and worst for Ao5", () => {
    const avg = calculateAverage(ao5CleanTimes, 5);
    expect(avg).toBeCloseTo((11880 + 12050 + 12340) / 3);
  });

  it("allows a single DNF in Ao5", () => {
    const avg = calculateAverage(ao5WithDnf, 5);
    expect(avg).not.toBeNull();
  });

  it("returns null when two DNFs make Ao5 invalid", () => {
    expect(calculateAverage(ao5TwoDnf, 5)).toBeNull();
  });

  it("uses only valid times for Mo3", () => {
    expect(calculateAverage([1000, 2000, 3000], 3)).toBe(2000);
  });

  it("uses the last N times only", () => {
    const times = [99999, ...ao5CleanTimes];
    expect(calculateAverage(times, 5)).toBe(calculateAverage(ao5CleanTimes, 5));
  });
});

describe("calculateRollingAverages / findBestAverage", () => {
  it("pads rolling averages until the window is full", () => {
    const rolling = calculateRollingAverages([1, 2, 3, 4, 5], 5);
    expect(rolling.slice(0, 4).every((v) => v === null)).toBe(true);
    expect(rolling[4]).not.toBeNull();
  });

  it("finds the best average index", () => {
    const times = [5000, 5000, 5000, 1000, 1000, 1000, 1000, 1000];
    const best = findBestAverage(times, 5);
    expect(best?.index).toBe(6);
  });

  it("returns null when no valid average exists", () => {
    expect(findBestAverage([Infinity, Infinity, Infinity], 3)).toBeNull();
  });
});

describe("calculatePercentiles", () => {
  it("returns empty object for no valid times", () => {
    expect(calculatePercentiles([Infinity], [50])).toEqual({});
  });

  it("computes requested percentiles from sorted valid times", () => {
    const result = calculatePercentiles([10, 20, 30, 40, 50], [0, 50, 100]);
    expect(result[100]).toBe(50);
    expect(result[50]).toBe(30);
  });
});

describe("groupSolvesByPeriod", () => {
  it("groups by day, week, and month", () => {
    const solves = [
      makeSolve({ time: 1000, timestamp: new Date("2026-01-15T10:00:00") }),
      makeSolve({ time: 1100, timestamp: new Date("2026-01-16T10:00:00") }),
    ];
    expect(Object.keys(groupSolvesByPeriod(solves, "day"))).toHaveLength(2);
    expect(Object.keys(groupSolvesByPeriod(solves, "month"))[0]).toBe("2026-1");
    expect(Object.keys(groupSolvesByPeriod(solves, "week")).length).toBeGreaterThan(0);
  });
});

describe("calculateImprovementRate / consistency", () => {
  it("returns positive improvement when new times are faster", () => {
    const rate = calculateImprovementRate(
      [2000, 2000, 2000, 2000, 2000],
      [1000, 1000, 1000, 1000, 1000],
      5,
    );
    expect(rate).toBeGreaterThan(0);
  });

  it("returns null without enough data", () => {
    expect(calculateImprovementRate([], [1], 5)).toBeNull();
    expect(calculateConsistency([1000])).toBeNull();
  });

  it("returns a coefficient of variation for two or more times", () => {
    const cv = calculateConsistency([1000, 1000]);
    expect(cv).toBe(0);
  });
});

describe("event names, duration, time-of-day, streaks", () => {
  it("maps known events and falls back to the code", () => {
    expect(getEventDisplayName("333")).toBe("3×3");
    expect(getEventDisplayName("unknown")).toBe("unknown");
  });

  it("returns 0 duration for empty sessions", () => {
    expect(calculateSessionDuration([])).toBe(0);
  });

  it("computes duration between first and last solve", () => {
    const solves = [
      makeSolve({ time: 1, timestamp: new Date("2026-01-15T12:00:00Z") }),
      makeSolve({ time: 2, timestamp: new Date("2026-01-15T12:01:00Z") }),
    ];
    expect(calculateSessionDuration(solves)).toBe(60_000);
  });

  it("bins solves by hour of day", () => {
    const dist = getTimeOfDayDistribution([
      makeSolve({ time: 1, timestamp: new Date("2026-01-15T08:00:00") }),
      makeSolve({ time: 1, timestamp: new Date("2026-01-15T14:00:00") }),
      makeSolve({ time: 1, timestamp: new Date("2026-01-15T20:00:00") }),
      makeSolve({ time: 1, timestamp: new Date("2026-01-15T02:00:00") }),
    ]);
    expect(dist["Morning (6-12)"]).toBe(1);
    expect(dist["Afternoon (12-18)"]).toBe(1);
    expect(dist["Evening (18-24)"]).toBe(1);
    expect(dist["Night (0-6)"]).toBe(1);
  });

  it("returns zero streaks for no solves", () => {
    expect(calculateSolvingStreaks([])).toEqual({ current: 0, longest: 0 });
  });

  it("counts a current streak when there is a solve today", () => {
    const today = new Date();
    const streaks = calculateSolvingStreaks([
      makeSolve({ time: 1, timestamp: today }),
    ]);
    expect(streaks.current).toBeGreaterThanOrEqual(1);
    expect(streaks.longest).toBeGreaterThanOrEqual(1);
  });
});
