import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch-with-timeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  GET,
  POST,
} from "@/app/api/cubie/proxy/[...path]/route";
import { POST as postChat } from "@/app/api/cubie/chat/route";
import { POST as postSession } from "@/app/api/cubie/chat/session/route";
import { GET as getSession } from "@/app/api/cubie/chat/session/[sessionId]/route";
import { authedRequest, jsonRequest } from "../setup/api";

const fetchMock = vi.mocked(fetchWithTimeout);

describe("Cubie proxy", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("requires a session and Authorization header", async () => {
    const unauth = await GET(
      jsonRequest("http://localhost/api/cubie/proxy/chat"),
      { params: Promise.resolve({ path: ["chat"] }) },
    );
    expect(unauth.status).toBe(401);

    const noBearer = await GET(
      await authedRequest("http://localhost/api/cubie/proxy/chat", {
        userId: "user_a",
      }),
      { params: Promise.resolve({ path: ["chat"] }) },
    );
    expect(noBearer.status).toBe(401);
  });

  it("rejects non-chat paths", async () => {
    const req = await authedRequest("http://localhost/api/cubie/proxy/admin", {
      userId: "user_a",
      headers: { authorization: "Bearer tok" },
    });
    const res = await GET(req, { params: Promise.resolve({ path: ["admin"] }) });
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards allowlisted chat paths and upstream errors", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ reply: "hi" }), { status: 200 }),
    );
    const ok = await POST(
      await authedRequest("http://localhost/api/cubie/proxy/chat", {
        method: "POST",
        userId: "user_a",
        json: { message: "hello" },
        headers: { authorization: "Bearer tok" },
      }),
      { params: Promise.resolve({ path: ["chat"] }) },
    );
    expect(ok.status).toBe(200);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "nope" }), { status: 500 }),
    );
    const fail = await GET(
      await authedRequest("http://localhost/api/cubie/proxy/chat/sessions", {
        userId: "user_a",
        headers: { authorization: "Bearer tok" },
      }),
      { params: Promise.resolve({ path: ["chat", "sessions"] }) },
    );
    expect(fail.status).toBe(500);
  });

  it("returns 500 on upstream timeout", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Request timed out after 60000ms"));
    const res = await GET(
      await authedRequest("http://localhost/api/cubie/proxy/chat", {
        userId: "user_a",
        headers: { authorization: "Bearer tok" },
      }),
      { params: Promise.resolve({ path: ["chat"] }) },
    );
    expect(res.status).toBe(500);
  });
});

describe("legacy Cubie chat routes", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
  });

  it("requires a CubeDev session and Authorization on chat and session endpoints", async () => {
    expect(
      (await postChat(jsonRequest("http://localhost/api/cubie/chat", { method: "POST", json: {} }))).status,
    ).toBe(401);
    expect(
      (
        await postChat(
          jsonRequest("http://localhost/api/cubie/chat", {
            method: "POST",
            json: { message: "hi" },
            headers: { authorization: "Bearer tok" },
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (await postSession(
        jsonRequest("http://localhost/api/cubie/chat/session", { method: "POST", json: {} }),
      )).status,
    ).toBe(401);
    expect(
      (
        await getSession(jsonRequest("http://localhost/api/cubie/chat/session/abc"), {
          params: Promise.resolve({ sessionId: "abc" }),
        })
      ).status,
    ).toBe(401);
  });

  it("proxies chat POSTs that have both a session and Authorization", async () => {
    const res = await postChat(
      await authedRequest("http://localhost/api/cubie/chat", {
        method: "POST",
        userId: "user_a",
        json: { message: "hi" },
        headers: { authorization: "Bearer tok" },
      }),
    );
    expect(res.status).toBe(200);
  });
});
