import { NextResponse } from "next/server";
import { getConvexJwks } from "@/lib/auth-keys";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const jwks = await getConvexJwks();
    return NextResponse.json(jwks, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    logger.error("jwks_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "JWKS unavailable" }, { status: 500 });
  }
}