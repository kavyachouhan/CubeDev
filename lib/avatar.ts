export type AvatarValue = string | { url?: string } | null | undefined;

export function getAvatarUrl(avatar: AvatarValue): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === "string") return avatar;
  return typeof avatar.url === "string" ? avatar.url : undefined;
}
