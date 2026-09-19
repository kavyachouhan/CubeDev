import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/fetch-with-timeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { GET } from "@/app/api/wca/[...path]/route";
import { jsonRequest } from "../setup/api";

const fetchMock = vi.mocked(fetchWithTimeout);

function call(path: string[], ip = "12.0.0.1") {
  return GET(
    jsonRequest(`http://localhost/api/wca/${path.join("/")}`, {
      headers: { "x-forwarded-for": ip },
    }),
    { params: Promise.resolve({ path }) },
  );
}

describe("GET /api/wca/[...path]", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("rejects disallowed and traversal paths without calling WCA", async () => {
    const denied = [
      ["persons", "../admin"],
      ["http:", "evil.example"],
      ["persons", "not-an-id"],
      ["competitions"],
      ["users", "1"],
    ];
    for (const path of denied) {
      const res = await call(path, `12.0.0.${path.length + 10}`);
      expect(res.status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("proxies allowlisted person, results, competition, and records paths", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const allowed = [
      ["records"],
      ["persons", "2018TEST01"],
      ["persons", "2018TEST01", "results"],
      ["competitions", "WC2024"],
    ];
    for (const path of allowed) {
      const res = await call(path, `12.1.0.${path.length}`);
      expect(res.status).toBe(200);
    }
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns 502 for malformed upstream JSON", async () => {
    fetchMock.mockResolvedValue(new Response("not-json", { status: 200 }));
    const res = await call(["records"], "12.2.0.1");
    expect(res.status).toBe(502);
  });

  it("rate-limits the proxy", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const ip = `12.3.${Math.floor(Math.random() * 255)}.1`;
    let last = 200;
    for (let i = 0; i < 181; i++) {
      last = (await call(["records"], ip)).status;
    }
    expect(last).toBe(429);
  });
});
