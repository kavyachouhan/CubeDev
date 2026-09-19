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

  it("returns null for missing users", () => {
    expect(toPublicUser(null)).toBeNull();
    expect(toOwnerUser(undefined)).toBeNull();
  });
});
