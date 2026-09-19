import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatMonthYear,
  formatToRelativeTime,
  getCompetitionStatus,
  getCompetitionStatusDisplay,
  isToday,
  isYesterday,
  parseCompetitionDate,
} from "@/lib/date-utils";

describe("relative time", () => {
  it("returns Just now for timestamps under a minute", () => {
    expect(formatToRelativeTime(new Date().toISOString())).toBe("Just now");
  });
});

describe("isToday / isYesterday", () => {
  it("detects today and yesterday in local time", () => {
    expect(isToday(new Date().toISOString())).toBe(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isYesterday(yesterday.toISOString())).toBe(true);
    expect(isToday("1999-01-01T00:00:00.000Z")).toBe(false);
  });
});

describe("competition dates", () => {
  it("parses YYYY-MM-DD as local midnight", () => {
    const date = parseCompetitionDate("2026-09-17");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(17);
  });

  it("classifies past, ongoing, and upcoming relative to local today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));
    try {
      expect(getCompetitionStatus("2026-09-10", "2026-09-12")).toBe("past");
      expect(getCompetitionStatus("2026-09-17", "2026-09-17")).toBe("ongoing");
      expect(getCompetitionStatus("2026-09-16", "2026-09-18")).toBe("ongoing");
      expect(getCompetitionStatus("2026-09-20", "2026-09-21")).toBe("upcoming");
    } finally {
      vi.useRealTimers();
    }
  });

  it("labels cancelled competitions regardless of dates", () => {
    expect(getCompetitionStatusDisplay("2026-01-01", "2026-01-02", true).label).toBe(
      "Cancelled",
    );
  });
});

describe("formatMonthYear", () => {
  it("formats unix-ms timestamps as Month Year", () => {
    expect(formatMonthYear(new Date(2025, 9, 2).getTime())).toBe("October 2025");
  });

  it("returns null for missing or invalid values instead of Invalid Date", () => {
    expect(formatMonthYear(undefined)).toBeNull();
    expect(formatMonthYear(null)).toBeNull();
    expect(formatMonthYear("")).toBeNull();
    expect(formatMonthYear(Number.NaN)).toBeNull();
  });
});

afterEach(() => {
  vi.useRealTimers();
});
