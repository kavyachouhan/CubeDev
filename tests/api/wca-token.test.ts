import { beforeEach, describe, expect, it, vi } from "vitest";
import { convexMutation } from "../setup/convex-http";

vi.mock("convex/browser", async () => {
  const { convexMutation: mutation } = await import("../setup/convex-http");
  return {
    ConvexHttpClient: class {
      mutation = mutation;
    },
  };
});

vi.mock("@/lib/fetch-with-timeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { POST } from "@/app/api/auth/wca/token/route";
import { jsonRequest, oauthCookies, cookieHeader } from "../setup/api";
import { OAUTH_STATE_COOKIE } from "@/lib/session";

const fetchMock = vi.mocked(fetchWithTimeout);

describe("POST /api/auth/wca/token", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    convexMutation.mockReset();
  });

  it("rejects missing code", async () => {
    const res = await POST(
      jsonRequest("http://localhost/api/auth/wca/token", {
        method: "POST",
        json: { state: "abc" },
        headers: { "x-forwarded-for": "11.0.0.1" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects mismatched OAuth state", async () => {
    const res = await POST(
      jsonRequest("http://localhost/api/auth/wca/token", {
        method: "POST",
        json: { code: "code", state: "wrong" },
        headers: {
          cookie: cookieHeader(oauthCookies("expected")),
          "x-forwarded-for": "11.0.0.2",
        },
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/state/i);
  });

  it("exchanges a valid code, upserts the user, and sets httpOnly cookies", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "wca-access", token_type: "Bearer" }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            me: {
              id: 42,
              wca_id: "2018TEST01",
              name: "Alice",
              country_iso2: "US",
              email: "alice@example.com",
              avatar: { url: "https://example.com/a.png" },
            },
          }),
          { status: 200 },
        ),
      );
    convexMutation.mockResolvedValue("convex_user_1");

    const res = await POST(
      jsonRequest("http://localhost/api/auth/wca/token", {
        method: "POST",
        json: { code: "auth-code", state: "state-1" },
        headers: {
          cookie: cookieHeader({
            [OAUTH_STATE_COOKIE]: "state-1",
            cubedev_oauth_return: "/cube-lab/timer",
          }),
          "x-forwarded-for": "11.0.0.3",
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.returnTo).toBe("/cube-lab/timer");
    expect(body.user.convexId).toBe("convex_user_1");
    expect(body.user.email).toBe("alice@example.com");
    const cookies = res.headers.getSetCookie?.() ?? [];
    expect(cookies.join(" ")).toMatch(/cubedev_session=/);
    expect(cookies.join(" ")).toMatch(/HttpOnly/i);
    expect(convexMutation).toHaveBeenCalled();
    expect(convexMutation.mock.calls[0][1]).toMatchObject({
      wcaUserId: 42,
      name: "Alice",
      serverSecret: expect.any(String),
    });
    expect(convexMutation.mock.calls[0][1].serverSecret.length).toBeGreaterThan(
      8,
    );
  });

  it("maps WCA ID conflict to 409", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "tok" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            me: {
              id: 7,
              wca_id: "2018TEST01",
              name: "Alice",
              country_iso2: "US",
            },
          }),
          { status: 200 },
        ),
      );
    convexMutation.mockRejectedValue(
      new Error("WCA ID already linked to another account"),
    );
    const res = await POST(
      jsonRequest("http://localhost/api/auth/wca/token", {
        method: "POST",
        json: { code: "c", state: "s" },
        headers: {
          cookie: cookieHeader(oauthCookies("s")),
          "x-forwarded-for": "11.0.0.4",
        },
      }),
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 when WCA token exchange fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 401 }));
    const res = await POST(
      jsonRequest("http://localhost/api/auth/wca/token", {
        method: "POST",
        json: { code: "c", state: "s" },
        headers: {
          cookie: cookieHeader(oauthCookies("s")),
          "x-forwarded-for": "11.0.0.5",
        },
      }),
    );
    expect(res.status).toBe(400);
  });
});
