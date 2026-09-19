import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { attachSessionCookies, createSessionToken, isSafeReturnPath, OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/session";
import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { assertServerEnv, publicConfig, serverConfig, wcaEndpoints } from "@/lib/config";

const convex = new ConvexHttpClient(publicConfig.convexUrl);

function redactUpsertError(message: string) {
  if (
    message.includes("serverSecret") ||
    message.includes("ArgumentValidationError") ||
    message.includes("Object contains extra field")
  ) {
    return "Convex rejected upsertUser arguments";
  }
  return message;
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`wca-token:${clientKey(request)}`, 10, 60_000);
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
    assertServerEnv();
    const { code, state } = await request.json();
    const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Authorization code is required" },
        { status: 400 },
      );
    }

    if (!expectedState || !state || expectedState !== state) {
      return NextResponse.json(
        { success: false, error: "Invalid OAuth state" },
        { status: 400 },
      );
    }

    const WCA_CLIENT_ID = serverConfig.wcaClientId;
    const WCA_CLIENT_SECRET = serverConfig.wcaClientSecret;
    const WCA_REDIRECT_URI = serverConfig.wcaRedirectUri;

    const tokenResponse = await fetchWithTimeout(
      wcaEndpoints.tokenUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        timeoutMs: 10_000,
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: WCA_CLIENT_ID,
          client_secret: WCA_CLIENT_SECRET,
          code,
          redirect_uri: WCA_REDIRECT_URI,
        }),
      },
    );

    if (!tokenResponse.ok) {
      logger.warn("wca_token_exchange_failed", { status: tokenResponse.status });
      return NextResponse.json(
        { success: false, error: "Failed to exchange authorization code" },
        { status: 400 },
      );
    }

    const tokenData = await tokenResponse.json();

    const userResponse = await fetchWithTimeout(
      `${wcaEndpoints.apiBaseUrl}/me`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        timeoutMs: 10_000,
      },
    );

    if (!userResponse.ok) {
      logger.warn("wca_profile_fetch_failed", { status: userResponse.status });
      return NextResponse.json(
        { success: false, error: "Failed to fetch user information" },
        { status: 400 },
      );
    }

    const userData = await userResponse.json();
    logger.info("wca_oauth_profile_loaded", {
      wcaUserId: userData.me?.id,
      hasEmail: Boolean(userData.me?.email),
    });

    try {
      const userDataForConvex = {
        wcaId: userData.me.wca_id || undefined,
        wcaUserId: userData.me.id,
        name: userData.me.name,
        countryIso2: userData.me.country_iso2,
        avatar: userData.me.avatar?.url || undefined,
        gender: userData.me.gender || undefined,
        ...(userData.me.email ? { email: userData.me.email } : {}),
        serverSecret: serverConfig.jwtSecretKey,
      };

      const userId = await convex.mutation(api.users.upsertUser, userDataForConvex);
      const sessionToken = await createSessionToken({
        userId: String(userId),
        wcaId: userData.me.wca_id || undefined,
        email: userData.me.email,
        wcaUserId: userData.me.id,
      });

      const returnToCookie = request.cookies.get(OAUTH_RETURN_COOKIE)?.value;
      const returnTo = isSafeReturnPath(returnToCookie) ? returnToCookie : undefined;

      const response = NextResponse.json({
        success: true,
        returnTo,
        user: {
          id: userData.me.id,
          convexId: userId,
          name: userData.me.name,
          wcaId: userData.me.wca_id,
          countryIso2: userData.me.country_iso2,
          avatar: userData.me.avatar,
          email: userData.me.email,
        },
      });
      attachSessionCookies(response, {
        sessionToken,
        wcaAccessToken: tokenData.access_token,
      });
      response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
      response.cookies.set(OAUTH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
      return response;
    } catch (convexError) {
      const errorMessage =
        convexError instanceof Error
          ? convexError.message
          : "Failed to save user to database";
      logger.error("wca_upsert_failed", {
        error: redactUpsertError(errorMessage),
      });

      if (errorMessage.includes("already linked to another account")) {
        return NextResponse.json(
          {
            success: false,
            error: "This WCA ID is already linked to another account",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to save user to database" },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error("wca_oauth_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}