import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/html-escape";
import { GET } from "@/app/api/wca/[...path]/route";
import { jsonRequest } from "../setup/api";

describe("XSS escaping", () => {
  it("neutralizes HTML, JS, and attribute payloads", () => {
    const payload = `<script>alert(1)</script><img src=x onerror="alert('xss')">`;
    const escaped = escapeHtml(payload);
    expect(escaped).not.toMatch(/<script>/i);
    expect(escaped).toContain("&lt;script&gt;");
    expect(escaped).toContain("&lt;img");
    expect(escaped).toContain("onerror=&quot;");
  });
});

describe("WCA proxy SSRF allowlist", () => {
  it("does not fetch arbitrary hosts or path traversal", async () => {
    const attempts = [
      ["", "evil.example"],
      ["persons", "2018TEST01", "..", "admin"],
      ["competitions", "..", "oauth"],
    ];
    for (const path of attempts) {
      const res = await GET(
        jsonRequest(`http://localhost/api/wca/${path.join("/")}`, {
          headers: { "x-forwarded-for": `14.0.0.${path.length}` },
        }),
        { params: Promise.resolve({ path }) },
      );
      expect(res.status).toBe(404);
    }
  });
});
