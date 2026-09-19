import { beforeEach, describe, expect, it, vi } from "vitest";
import { convexQuery } from "../setup/convex-http";

vi.mock("convex/browser", async () => {
  const { convexQuery: query } = await import("../setup/convex-http");
  return {
    ConvexHttpClient: class {
      query = query;
    },
  };
});

vi.mock("@/lib/fetch-with-timeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { POST as validateRoom } from "@/app/api/room/validate/route";
import { GET as upcoming } from "@/app/api/competition/upcoming/route";
import { jsonRequest, wcaTokenCookie, cookieHeader } from "../setup/api";
import { SESSION_COOKIE } from "@/lib/session";
import { createSessionToken } from "@/lib/session";

const fetchMock = vi.mocked(fetchWithTimeout);

describe("POST /api/room/validate", () => {
  beforeEach(() => {
    convexQuery.mockReset();
  });

  it("requires a string roomId", async () => {
    const res = await validateRoom(
      jsonRequest("http://localhost/api/room/validate", {
        method: "POST",
        json: {},
      }),
    );
    expect(res.status).toBe(400);
  });

  it("reports existence from Convex", async () => {
    convexQuery.mockResolvedValueOnce({ room: { roomId: "ABC123" } });
    const exists = await validateRoom(
      jsonRequest("http://localhost/api/room/validate", {
        method: "POST",
        json: { roomId: "abc123" },
      }),
    );
    expect((await exists.json()).exists).toBe(true);

    convexQuery.mockResolvedValueOnce(null);
    const missing = await validateRoom(
      jsonRequest("http://localhost/api/room/validate", {
        method: "POST",
        json: { roomId: "NOPE00" },
      }),
    );
    expect((await missing.json()).exists).toBe(false);
  });
});

describe("GET /api/competition/upcoming", () => {
  beforeEach(() => {
    convexQuery.mockReset();
    fetchMock.mockReset();
  });

  it("rejects missing and invalid WCA IDs", async () => {
    expect(
      (await upcoming(jsonRequest("http://localhost/api/competition/upcoming"))).status,
    ).toBe(400);
    expect(
      (
        await upcoming(
          jsonRequest("http://localhost/api/competition/upcoming?wcaId=CD26ABC01"),
        )
      ).status,
    ).toBe(400);
  });

  it("returns 404 when the user is unknown", async () => {
    convexQuery.mockResolvedValueOnce(null);
    const res = await upcoming(
      jsonRequest("http://localhost/api/competition/upcoming?wcaId=2018TEST01"),
    );
    expect(res.status).toBe(404);
  });

  it("uses the caller WCA cookie only when the session WCA ID matches", async () => {
    convexQuery.mockResolvedValue({
      wcaId: "2018TEST01",
      wcaUserId: 1001,
    });
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          future_competitions: [
            {
              id: "Comp2026",
              name: "Open",
              city: "Austin",
              country_iso2: "US",
              start_date: "2026-10-01",
              end_date: "2026-10-02",
            },
          ],
          registrations_by_competition: { Comp2026: "accepted" },
        }),
        { status: 200 },
      ),
    );
    const token = await createSessionToken({
      userId: "user_a",
      wcaId: "2018TEST01",
      email: "alice@example.com",
    });
    const res = await upcoming(
      jsonRequest("http://localhost/api/competition/upcoming?wcaId=2018TEST01", {
        headers: {
          cookie: cookieHeader({
            [SESSION_COOKIE]: token,
            ...wcaTokenCookie("wca-access"),
          }),
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.competitions[0].id).toBe("Comp2026");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/competitions/mine");
  });
});
