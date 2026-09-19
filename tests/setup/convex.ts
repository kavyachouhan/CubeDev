import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { modules } from "../../convex/test.setup";
import { adminProfile, userAProfile, userBProfile } from "../fixtures/users";
import { TEST_ENV } from "./env";

export function makeConvex() {
  return convexTest(schema, modules);
}

export type TestConvex = ReturnType<typeof makeConvex>;

export function withServerSecret<T extends object>(profile: T) {
  return { ...profile, serverSecret: TEST_ENV.JWT_SECRET_KEY };
}

export async function seedUser(
  t: TestConvex,
  profile: {
    wcaId?: string;
    wcaUserId: number;
    name: string;
    email?: string;
    countryIso2: string;
    avatar?: string;
    gender?: string;
  },
) {
  return await t.mutation(api.users.upsertUser, withServerSecret(profile));
}

export async function seedPair(t: TestConvex) {
  const userAId = await seedUser(t, userAProfile);
  const userBId = await seedUser(t, userBProfile);
  return { userAId, userBId };
}

export function asUser(
  t: TestConvex,
  userId: string,
  extras: { email?: string; isAdmin?: boolean; wcaId?: string } = {},
) {
  return t.withIdentity({
    subject: userId,
    email: extras.email,
    isAdmin: extras.isAdmin === true,
    wca_id: extras.wcaId,
  });
}

export function asAdmin(t: TestConvex, userId: string) {
  return asUser(t, userId, {
    email: adminProfile.email,
    isAdmin: true,
    wcaId: adminProfile.wcaId,
  });
}

export const scrambleSet = [
  "R U R' U'",
  "F R U R' U' F'",
  "L' U L U'",
  "B U B' U'",
  "D R D' R'",
];
