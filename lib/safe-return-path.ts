export function isSafeReturnPath(path: string | null | undefined) {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}