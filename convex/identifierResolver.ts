const WCA_ID_REGEX = /^\d{4}[A-Z]{4}\d{2}$/;
const CUBEDEV_ID_REGEX = /^CD\d{2}[A-Z]{3}\d{2}$/;

export const normalizeIdentifier = (identifier: string) =>
  identifier.trim().toUpperCase();

export const isWcaIdentifier = (identifier: string) =>
  WCA_ID_REGEX.test(normalizeIdentifier(identifier));

export const isCubeDevIdentifier = (identifier: string) =>
  CUBEDEV_ID_REGEX.test(normalizeIdentifier(identifier));

export const resolveUserByIdentifierOrAlias = async (
  ctx: any,
  identifier: string,
) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  const directUser = await ctx.db
    .query("users")
    .withIndex("by_wca_id", (q: any) => q.eq("wcaId", normalizedIdentifier))
    .first();

  if (directUser) {
    return { user: directUser, redirectTo: undefined as string | undefined };
  }

  const alias = await ctx.db
    .query("userIdentifierAliases")
    .withIndex("by_alias_id", (q: any) => q.eq("aliasId", normalizedIdentifier))
    .first();

  if (!alias) {
    return { user: null, redirectTo: undefined as string | undefined };
  }

  const aliasedUser = await ctx.db.get(alias.userId);
  if (!aliasedUser) {
    return { user: null, redirectTo: undefined as string | undefined };
  }

  return { user: aliasedUser, redirectTo: aliasedUser.wcaId };
};