const windows = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const cutoff = now - windowMs;
  const prior = windows.get(key) ?? [];
  const recent = prior.filter((t) => t > cutoff);

  if (recent.length >= max) {
    const retryAfterMs = Math.max(1000, windowMs - (now - recent[0]));
    windows.set(key, recent);
    return {
      ok: false as const,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  recent.push(now);
  windows.set(key, recent);
  return { ok: true as const, retryAfterSeconds: 0 };
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
