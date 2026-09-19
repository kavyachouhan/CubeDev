import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { isAdminEmail } from "@/lib/config";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.sub) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    return NextResponse.json({ isAdmin: isAdminEmail(session.email) });
  } catch (error) {
    logger.error("admin_verify_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { isAdmin: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}