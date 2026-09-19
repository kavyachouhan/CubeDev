import { NextRequest } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE,
  WCA_TOKEN_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_RETURN_COOKIE,
} from "@/lib/session";
import { TEST_ADMIN_EMAIL } from "./env";

export function jsonRequest(
  url: string,
  init: RequestInit & { json?: unknown } = {},
) {
  const { json, headers, ...rest } = init;
  const merged = new Headers(headers);
  if (json !== undefined && !merged.has("content-type")) {
    merged.set("content-type", "application/json");
  }
  return new NextRequest(url, {
    ...rest,
    headers: merged,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
}

export function cookieHeader(cookies: Record<string, string>) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export async function sessionCookie(input: {
  userId: string;
  wcaId?: string;
  email?: string;
  wcaUserId?: number;
}) {
  const token = await createSessionToken(input);
  return { [SESSION_COOKIE]: token, token };
}

export async function adminSessionCookie(userId = "admin-user-id") {
  return sessionCookie({
    userId,
    wcaId: "2015ADMN01",
    email: TEST_ADMIN_EMAIL,
    wcaUserId: 9,
  });
}

export function oauthCookies(state: string, returnTo?: string) {
  const cookies: Record<string, string> = {
    [OAUTH_STATE_COOKIE]: state,
  };
  if (returnTo) {
    cookies[OAUTH_RETURN_COOKIE] = returnTo;
  }
  return cookies;
}

export function wcaTokenCookie(token: string) {
  return { [WCA_TOKEN_COOKIE]: token };
}

export async function authedRequest(
  url: string,
  init: RequestInit & {
    json?: unknown;
    userId?: string;
    wcaId?: string;
    email?: string;
    extraCookies?: Record<string, string>;
    ip?: string;
  } = {},
) {
  const { userId, wcaId, email, extraCookies, ip, ...rest } = init;
  const session = userId
    ? await sessionCookie({
        userId,
        wcaId: wcaId ?? "2018TEST01",
        email: email ?? "alice@example.com",
      })
    : { token: "" };
  const cookies = {
    ...(userId ? { [SESSION_COOKIE]: session.token } : {}),
    ...extraCookies,
  };
  const headers = new Headers(rest.headers);
  if (Object.keys(cookies).length > 0) {
    headers.set("cookie", cookieHeader(cookies));
  }
  if (ip) {
    headers.set("x-forwarded-for", ip);
  }
  return jsonRequest(url, { ...rest, headers });
}
