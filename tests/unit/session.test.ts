import { describe, expect, it } from "vitest";
import { jwtVerify } from "jose";
import {
  createCubieToken,
  createSessionToken,
  isSafeReturnPath,
  verifySessionToken,
} from "@/lib/session";
import { isAdminEmail, serverConfig } from "@/lib/config";
import { TEST_ADMIN_EMAIL } from "../setup/env";

describe("isSafeReturnPath", () => {
  it("accepts in-app relative paths", () => {
    expect(isSafeReturnPath("/cube-lab/timer")).toBe(true);
    expect(isSafeReturnPath("/me")).toBe(true);
  });

  it("rejects open redirects and empty values", () => {
    expect(isSafeReturnPath(null)).toBe(false);
    expect(isSafeReturnPath("")).toBe(false);
    expect(isSafeReturnPath("//evil.example")).toBe(false);
    expect(isSafeReturnPath("https://evil.example")).toBe(false);
    expect(isSafeReturnPath("/\\evil")).toBe(false);
    expect(isSafeReturnPath("cube-lab/timer")).toBe(false);
  });
});

describe("session JWT", () => {
  it("signs a 7-day session with audience cubedev-session and admin claim from allowlist", async () => {
    const token = await createSessionToken({
      userId: "user_abc",
      wcaId: "2018TEST01",
      email: TEST_ADMIN_EMAIL,
      wcaUserId: 1,
    });
    const claims = await verifySessionToken(token);
    expect(claims?.sub).toBe("user_abc");
    expect(claims?.wcaId).toBe("2018TEST01");
    expect(claims?.isAdmin).toBe(true);
    expect(claims?.aud).toBe("cubedev-session");
  });

  it("does not mark non-admin emails as admin", async () => {
    const token = await createSessionToken({
      userId: "user_abc",
      email: "alice@example.com",
    });
    const claims = await verifySessionToken(token);
    expect(claims?.isAdmin).toBe(false);
  });

  it("rejects malformed, empty, and wrong-audience tokens", async () => {
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
    const cubie = await createCubieToken({
      userId: "user_abc",
      wcaId: "2018TEST01",
    });
    expect(await verifySessionToken(cubie)).toBeNull();
  });

  it("mints a Cubie token with configured issuer and audience", async () => {
    const token = await createCubieToken({
      userId: "user_abc",
      wcaId: "2018TEST01",
      email: "alice@example.com",
    });
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(serverConfig.jwtSecretKey),
      {
        issuer: serverConfig.jwtIssuer,
        audience: serverConfig.jwtAudience,
      },
    );
    expect(payload.sub).toBe("user_abc");
    expect(payload.wca_id).toBe("2018TEST01");
  });
});

describe("isAdminEmail", () => {
  it("matches the allowlist case-insensitively", () => {
    expect(isAdminEmail(TEST_ADMIN_EMAIL.toUpperCase())).toBe(true);
    expect(isAdminEmail("alice@example.com")).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
