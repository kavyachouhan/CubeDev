import { NextRequest, NextResponse } from "next/server";
import { createCubieToken, getSessionFromRequest } from "@/lib/session";
import { logger } from "@/lib/logger";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { serverConfig } from "@/lib/config";

export async function POST(request: NextRequest) {
  const limited = rateLimit(`cubie-token:${clientKey(request)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  try {
    const session = await getSessionFromRequest(request);
    if (!session?.sub || !session.wcaId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = await createCubieToken({
      userId: session.sub,
      wcaId: session.wcaId,
      email: session.email,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresIn: serverConfig.jwtExpiration,
    });
  } catch (error) {
    logger.error("cubie_token_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { success: false, error: "Failed to generate authentication token" },
      { status: 500 },
    );
  }
}