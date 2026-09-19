import { NextRequest, NextResponse } from "next/server";
import { wcaEndpoints } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { logger } from "@/lib/logger";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const WCA_ID = /^\d{4}[A-Z]{4}\d{2}$/i;
const COMPETITION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/;

function isAllowedPath(path: string[]): boolean {
  if (path.length === 1 && path[0] === "records") {
    return true;
  }
  if (path.length === 2 && path[0] === "persons" && WCA_ID.test(path[1])) {
    return true;
  }
  if (
    path.length === 3 &&
    path[0] === "persons" &&
    WCA_ID.test(path[1]) &&
    path[2] === "results"
  ) {
    return true;
  }
  if (
    path.length === 2 &&
    path[0] === "competitions" &&
    COMPETITION_ID.test(path[1])
  ) {
    return true;
  }
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const limited = rateLimit(`wca-proxy:${clientKey(request)}`, 180, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  const { path } = await params;
  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const joined = path.join("/");
  const target = `${wcaEndpoints.apiBaseUrl}/${joined}${request.nextUrl.search}`;

  try {
    const response = await fetchWithTimeout(target, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
      },
      timeoutMs: 12_000,
    });

    const data: unknown = await response.json().catch(() => null);
    if (data === null) {
      return NextResponse.json(
        { error: "Invalid response" },
        { status: response.ok ? 502 : response.status },
      );
    }

    const headers = new Headers();
    if (response.ok) {
      headers.set(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=600",
      );
    }

    return NextResponse.json(data, { status: response.status, headers });
  } catch (error) {
    logger.error("wca_proxy_failed", {
      path: joined,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to fetch WCA data" },
      { status: 502 },
    );
  }
}