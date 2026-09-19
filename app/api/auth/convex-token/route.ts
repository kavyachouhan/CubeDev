import { NextRequest, NextResponse } from "next/server";
import { createConvexToken, getSessionFromRequest } from "@/lib/session";
import { logger } from "@/lib/logger";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = rateLimit(`convex-token:${clientKey(request)}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  const session = await getSessionFromRequest(request);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await createConvexToken({
      userId: session.sub,
      wcaId: session.wcaId,
      email: session.email,
    });
    return NextResponse.json({ token, expiresIn: "1h" });
  } catch (error) {
    logger.error("convex_token_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to generate authentication token" },
      { status: 500 },
    );
  }
}