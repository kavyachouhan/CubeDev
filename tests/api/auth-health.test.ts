import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { GET as getJwks } from "@/app/api/auth/jwks/route";
import { GET as getSession, DELETE as deleteSession } from "@/app/api/auth/session/route";
import { GET as getConvexToken } from "@/app/api/auth/convex-token/route";
import { POST as postCubieToken } from "@/app/api/auth/token/route";
import { GET as getAdminVerify, POST as postAdminVerify } from "@/app/api/admin/verify/route";
import { GET as startOAuth } from "@/app/api/auth/wca/start/route";
import { authedRequest, jsonRequest, sessionCookie, cookieHeader } from "../setup/api";
import { SESSION_COOKIE } from "@/lib/session";
import { TEST_ADMIN_EMAIL } from "../setup/env";

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("cubedev");
  });
});

describe("GET /api/auth/jwks", () => {
  it("returns an ES256 JWK set", async () => {
    const res = await getJwks();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keys[0].alg).toBe("ES256");
    expect(body.keys[0].kid).toBe("cubedev-es256");
    expect(body.keys[0].d).toBeUndefined();
  });
});

describe("session API", () => {
  it("returns 401 without a cookie", async () => {
    const res = await getSession(jsonRequest("http://localhost/api/auth/session"));
    expect(res.status).toBe(401);
    expect((await res.json()).authenticated).toBe(false);
  });

  it("returns 401 for a malformed token", async () => {
    const res = await getSession(
      jsonRequest("http://localhost/api/auth/session", {
        headers: { cookie: `${SESSION_COOKIE}=not-a-jwt` },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns the session user for a valid cookie", async () => {
    const session = await sessionCookie({
      userId: "user_a",
      wcaId: "2018TEST01",
      email: "alice@example.com",
    });
    const res = await getSession(
      jsonRequest("http://localhost/api/auth/session", {
        headers: { cookie: cookieHeader({ [SESSION_COOKIE]: session.token }) },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.user.convexId).toBe("user_a");
    expect(body.user.isAdmin).toBe(false);
  });

  it("clears cookies on DELETE", async () => {
    const res = await deleteSession();
    expect(res.status).toBe(200);
    const setCookie = res.headers.getSetCookie?.() ?? [];
    expect(setCookie.join(" ")).toMatch(/cubedev_session/);
  });
});

describe("token minting", () => {
  it("rejects unauthenticated convex and cubie token requests", async () => {
    const convex = await getConvexToken(
      jsonRequest("http://localhost/api/auth/convex-token"),
    );
    expect(convex.status).toBe(401);
    const cubie = await postCubieToken(
      jsonRequest("http://localhost/api/auth/token", { method: "POST" }),
    );
    expect(cubie.status).toBe(401);
  });

  it("mints a Convex JWT for a valid session", async () => {
    const req = await authedRequest("http://localhost/api/auth/convex-token", {
      userId: "user_a",
      ip: "10.0.0.1",
    });
    const res = await getConvexToken(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token.split(".")).toHaveLength(3);
    expect(body.expiresIn).toBe("1h");
  });

  it("rate-limits convex-token", async () => {
    const ip = `10.1.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    let lastStatus = 200;
    for (let i = 0; i < 31; i++) {
      const req = await authedRequest("http://localhost/api/auth/convex-token", {
        userId: "user_a",
        ip,
      });
      lastStatus = (await getConvexToken(req)).status;
    }
    expect(lastStatus).toBe(429);
  });

  it("ignores request body userId when minting Cubie tokens", async () => {
    const req = await authedRequest("http://localhost/api/auth/token", {
      method: "POST",
      userId: "user_a",
      wcaId: "2018TEST01",
      json: { userId: "someone-else" },
      ip: "10.0.0.2",
    });
    const res = await postCubieToken(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.token).toBe("string");
  });

  it("requires wcaId on the session for Cubie tokens", async () => {
    const session = await sessionCookie({
      userId: "user_a",
      email: "alice@example.com",
    });
    const res = await postCubieToken(
      jsonRequest("http://localhost/api/auth/token", {
        method: "POST",
        headers: { cookie: cookieHeader({ [SESSION_COOKIE]: session.token }) },
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe("admin verify", () => {
  it("returns 401 without session", async () => {
    const res = await getAdminVerify(
      jsonRequest("http://localhost/api/admin/verify"),
    );
    expect(res.status).toBe(401);
  });

  it("returns isAdmin from the email allowlist, ignoring body email", async () => {
    const admin = await authedRequest("http://localhost/api/admin/verify", {
      method: "POST",
      userId: "admin",
      email: TEST_ADMIN_EMAIL,
      json: { email: "alice@example.com" },
    });
    const res = await postAdminVerify(admin);
    expect(res.status).toBe(200);
    expect((await res.json()).isAdmin).toBe(true);
  });
});

describe("WCA OAuth start", () => {
  it("redirects to WCA and sets a state cookie", async () => {
    const res = await startOAuth(
      jsonRequest("http://localhost/api/auth/wca/start?returnTo=/cube-lab/timer"),
    );
    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("worldcubeassociation.org/oauth/authorize");
    expect(location).toContain("state=");
    const cookies = res.headers.getSetCookie?.() ?? [];
    expect(cookies.join(" ")).toMatch(/cubedev_oauth_state/);
    expect(cookies.join(" ")).toMatch(/cubedev_oauth_return/);
  });

  it("does not store an unsafe returnTo", async () => {
    const res = await startOAuth(
      jsonRequest(
        "http://localhost/api/auth/wca/start?returnTo=https://evil.example",
      ),
    );
    const cookies = res.headers.getSetCookie?.() ?? [];
    expect(cookies.join(" ")).not.toMatch(/cubedev_oauth_return=/);
  });
});
