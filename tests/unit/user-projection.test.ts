import { describe, expect, it } from "vitest";
import { toOwnerUser, toPublicUser } from "@/convex/userProjection";
import type { Doc } from "@/convex/_generated/dataModel";

function fakeUser(overrides: Partial<Doc<"users">> = {}) {
  return {
    _id: "users:1" as Doc<"users">["_id"],
    _creationTime: 1,
    wcaId: "2018TEST01",
    wcaUserId: 1,
    name: "Alice",
    email: "alice@example.com",
    countryIso2: "US",
    accessToken: "secret-access",
    refreshToken: "secret-refresh",
    tokenExpiry: 123,
    createdAt: 1,
    updatedAt: 1,
    lastLoginAt: 1,
    ...overrides,
  } as Doc<"users">;
}

describe("user projections", () => {
  it("strips OAuth tokens from public and owner DTOs", () => {
    const user = fakeUser();
    const pub = toPublicUser(user);
    expect(pub).not.toHaveProperty("accessToken");
    expect(pub).not.toHaveProperty("email");
    const owner = toOwnerUser(user);
    expect(owner).not.toHaveProperty("accessToken");
    expect(owner?.email).toBe("alice@example.com");
  });

  // The owner DTO is hand-copied field by field, so a preference can be added to
  // the schema and the type and still never reach the client. Assert the values
  // actually come through.
  it("passes every appearance preference through to the owner DTO", () => {
    const preferences = {
      themeMode: "light",
      colorScheme: "purple",
      timerFontSize: "xl",
      timerFontFamily: "sans",
      timerUpdateMode: "seconds",
      cubeViewMode: "2d",
      timerLayout: "cards",
      reduceMotion: true,
      disableGlow: true,
      highContrast: true,
    } as const;

    const owner = toOwnerUser(fakeUser(preferences));

    for (const [key, value] of Object.entries(preferences)) {
      expect(owner?.[key as keyof typeof owner]).toBe(value);
    }
  });

  it("returns null for missing users", () => {
    expect(toPublicUser(null)).toBeNull();
    expect(toOwnerUser(undefined)).toBeNull();
  });
});
