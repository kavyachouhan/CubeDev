import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { convexConfig } from "./config";

type Ctx = QueryCtx | MutationCtx;

export async function getIdentityUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    return null;
  }

  const user = await ctx.db.get(identity.subject as Id<"users">);
  if (!user || user.isDeleted) {
    return null;
  }
  return user;
}

export async function getPublicProfileUser(
  ctx: Ctx,
  userId: Id<"users">,
): Promise<{ user: Doc<"users">; isOwner: boolean } | null> {
  const user = await ctx.db.get(userId);
  if (!user || user.isDeleted) {
    return null;
  }
  const identityUser = await getIdentityUser(ctx);
  const isOwner = Boolean(identityUser && identityUser._id === user._id);
  if (!isOwner && user.hideProfile) {
    return null;
  }
  return { user, isOwner };
}

export async function getMatchingUserOrNull(
  ctx: Ctx,
  requestedUserId?: Id<"users">,
): Promise<Doc<"users"> | null> {
  const user = await getIdentityUser(ctx);
  if (!user) {
    return null;
  }
  if (requestedUserId && requestedUserId !== user._id) {
    return null;
  }
  return user;
}

export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getIdentityUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function requireMatchingUser(
  ctx: Ctx,
  requestedUserId?: Id<"users">,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (requestedUserId && requestedUserId !== user._id) {
    throw new Error("Not authorized");
  }
  return user;
}

export async function requireAdminIdentity(ctx: {
  auth: { getUserIdentity: Ctx["auth"]["getUserIdentity"] };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    throw new Error("Not authenticated");
  }
  const email = identity.email as string | undefined;
  const adminEmails = convexConfig.adminEmails;
  const isAdminEmail =
    !!email && adminEmails.includes(email.toLowerCase());

  if (!isAdminEmail) {
    throw new Error("Not authorized");
  }
  return identity;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  await requireAdminIdentity(ctx);
  return requireUser(ctx);
}

export async function getOptionalUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  return getIdentityUser(ctx);
}
