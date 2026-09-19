import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isSafeReturnPath } from "@/lib/session";

describe("open redirect", () => {
  it("server-side returnTo only accepts relative in-app paths", () => {
    expect(isSafeReturnPath("/cube-lab/timer")).toBe(true);
    expect(isSafeReturnPath("//evil.example/%2e%2e")).toBe(false);
    expect(isSafeReturnPath("https://evil.example")).toBe(false);
    expect(isSafeReturnPath("\\\\evil.example")).toBe(false);
  });

  it("OAuth callback validates sessionStorage.redirectAfterAuth with isSafeReturnPath", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/auth/wca/callback/page.tsx"),
      "utf8",
    );
    expect(source).toContain('sessionStorage.getItem("redirectAfterAuth")');
    expect(source).toContain("isSafeReturnPath(stored)");
    expect(source).toContain("isSafeReturnPath(redirectUrl)");
  });
});
