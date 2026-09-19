import { describe, expect, it } from "vitest";
import { clientKey, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the max", () => {
    const key = `under-${Math.random()}`;
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
  });

  it("blocks at the limit and reports retry-after", () => {
    const key = `limit-${Math.random()}`;
    expect(rateLimit(key, 1, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 1, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("recovers after the window elapses", () => {
    const key = `recover-${Math.random()}`;
    expect(rateLimit(key, 1, 20).ok).toBe(true);
    expect(rateLimit(key, 1, 20).ok).toBe(false);
    const later = Date.now() + 50;
    const originalNow = Date.now;
    Date.now = () => later;
    try {
      expect(rateLimit(key, 1, 20).ok).toBe(true);
    } finally {
      Date.now = originalNow;
    }
  });
});

describe("clientKey", () => {
  it("uses the first x-forwarded-for hop", () => {
    const request = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "1.1.1.1, 8.8.8.8" },
    });
    expect(clientKey(request)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip then unknown", () => {
    const realIp = new Request("http://localhost/api", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(clientKey(realIp)).toBe("9.9.9.9");
    expect(clientKey(new Request("http://localhost/api"))).toBe("unknown");
  });
});
