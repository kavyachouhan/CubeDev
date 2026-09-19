import { describe, expect, it } from "vitest";
import { getWCAOAuthUrl, wcaSignInHref } from "@/lib/wca-config";

describe("WCA OAuth URL builders", () => {
  it("includes client id, redirect, scope, and optional state", () => {
    const url = new URL(getWCAOAuthUrl("abc-state"));
    expect(url.origin + url.pathname).toBe(
      "https://www.worldcubeassociation.org/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("test-wca-client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("public email");
    expect(url.searchParams.get("state")).toBe("abc-state");
  });

  it("builds the in-app start href with a safe returnTo query", () => {
    expect(wcaSignInHref()).toBe("/api/auth/wca/start");
    expect(wcaSignInHref("/cube-lab/timer")).toBe(
      "/api/auth/wca/start?returnTo=%2Fcube-lab%2Ftimer",
    );
  });
});
