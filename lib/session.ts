import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConvexSigningKey, getConvexKeyId } from "./auth-keys";
import { isAdminEmail, isProduction, serverConfig } from "./config";
import { logger } from "./logger";

export { isSafeReturnPath } from "./safe-return-path";

export const SESSION_COOKIE = "cubedev_session";
export const WCA_TOKEN_COOKIE = "cubedev_wca_token";
export const OAUTH_STATE_COOKIE = "cubedev_oauth_state";
export const OAUTH_RETURN_COOKIE = "cubedev_oauth_return";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const CONVEX_TOKEN_MAX_AGE_SECONDS = 60 * 60;
const WCA_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 2;

export interface SessionClaims extends JWTPayload {
  sub: string;
  wcaId?: string;
  email?: string;
  isAdmin?: boolean;
  wcaUserId?: number;
}

function cookieSecure() {
  return isProduction;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function secretKey() {
  return new TextEncoder().encode(serverConfig.jwtSecretKey);
}

export async function createSessionToken(input: {
  userId: string;
  wcaId?: string;
  email?: string;
  wcaUserId?: number;
}) {
  return new SignJWT({
    wcaId: input.wcaId,
    email: input.email,
    isAdmin: isAdminEmail(input.email),
    wcaUserId: input.wcaUserId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuer(serverConfig.siteUrl)
    .setAudience("cubedev-session")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function createConvexToken(input: {
  userId: string;
  wcaId?: string;
  email?: string;
}) {
  const signingKey = await getConvexSigningKey();
  return new SignJWT({
    wca_id: input.wcaId,
    email: input.email,
    user_id: input.userId,
    isAdmin: isAdminEmail(input.email),
  })
    .setProtectedHeader({ alg: "ES256", kid: getConvexKeyId(), typ: "JWT" })
    .setSubject(input.userId)
    .setIssuer(serverConfig.convexJwtIssuer)
    .setAudience(serverConfig.convexJwtAudience)
    .setIssuedAt()
    .setExpirationTime(`${CONVEX_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(signingKey);
}

export async function createCubieToken(input: {
  userId: string;
  wcaId: string;
  email?: string;
}) {
  return new SignJWT({
    user_id: input.userId,
    wca_id: input.wcaId,
    email: input.email,
  })
    .setProtectedHeader({ alg: serverConfig.jwtAlgorithm })
    .setSubject(input.userId)
    .setIssuer(serverConfig.jwtIssuer)
    .setAudience(serverConfig.jwtAudience)
    .setIssuedAt()
    .setExpirationTime(serverConfig.jwtExpiration)
    .sign(new TextEncoder().encode(serverConfig.jwtSecretKey));
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: serverConfig.siteUrl,
      audience: "cubedev-session",
    });
    if (!payload.sub) return null;
    return payload as SessionClaims;
  } catch (error) {
    logger.warn("session_verify_failed", {
      error: error instanceof Error ? error.message : "invalid",
    });
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  return verifySessionToken(decodeURIComponent(token));
}

export function attachSessionCookies(
  response: NextResponse,
  input: {
    sessionToken: string;
    wcaAccessToken?: string;
  },
) {
  response.cookies.set(SESSION_COOKIE, input.sessionToken, cookieOptions(SESSION_MAX_AGE_SECONDS));
  if (input.wcaAccessToken) {
    response.cookies.set(
      WCA_TOKEN_COOKIE,
      input.wcaAccessToken,
      cookieOptions(WCA_TOKEN_MAX_AGE_SECONDS),
    );
  }
  return response;
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  response.cookies.set(WCA_TOKEN_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  return response;
}

export function getWcaAccessTokenFromRequest(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${WCA_TOKEN_COOKIE}=`))
    ?.slice(WCA_TOKEN_COOKIE.length + 1);
}
