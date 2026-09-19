import { NextRequest, NextResponse } from "next/server";
import { serverConfig } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { logger } from "@/lib/logger";
import { getSessionFromRequest } from "@/lib/session";

const ALLOWED_PREFIXES = ["chat"];

async function proxy(
  request: NextRequest,
  path: string[],
) {
  const session = await getSessionFromRequest(request);
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const joined = path.join("/");
  if (!ALLOWED_PREFIXES.some((prefix) => joined === prefix || joined.startsWith(`${prefix}/`))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const target = `${serverConfig.cubieBackendUrl}/${joined}${request.nextUrl.search}`;
  const init: RequestInit = {
    method: request.method,
    headers: {
      Authorization: authHeader,
      Accept: request.headers.get("accept") || "application/json",
      "X-Request-Id": request.headers.get("x-request-id") || crypto.randomUUID(),
    },
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type");
    if (contentType) {
      (init.headers as Record<string, string>)["Content-Type"] = contentType;
    }
    init.body = await request.text();
  }

  try {
    const response = await fetchWithTimeout(target, {
      ...init,
      timeoutMs: 60_000,
    });
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }
    const data = await response.json().catch(() => ({ error: "Invalid response" }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error("cubie_proxy_failed", {
      path: joined,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}