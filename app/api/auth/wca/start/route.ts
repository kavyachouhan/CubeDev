import { NextRequest, NextResponse } from "next/server";
import { getWCAOAuthUrl } from "@/lib/wca-config";
import { isSafeReturnPath, OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/session";
import { isProduction } from "@/lib/config";
import { logger } from "@/lib/logger";

function cookieSecure() {
  return isProduction;
}

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo");
  const state = crypto.randomUUID();
  const authUrl = getWCAOAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  if (isSafeReturnPath(returnTo)) {
    response.cookies.set(OAUTH_RETURN_COOKIE, returnTo!, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  }
  logger.info("oauth_start");
  return response;
}