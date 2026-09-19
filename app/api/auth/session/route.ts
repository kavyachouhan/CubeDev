import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies, getSessionFromRequest } from "@/lib/session";
import { isAdminEmail } from "@/lib/config";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.sub) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      convexId: session.sub,
      wcaId: session.wcaId,
      email: session.email,
      isAdmin: isAdminEmail(session.email),
    },
  });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  logger.info("session_cleared");
  return clearSessionCookies(response);
}