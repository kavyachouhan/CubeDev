import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/html-escape";

describe("escapeHtml", () => {
  it("escapes markup and quotes", () => {
    expect(escapeHtml(`<script>alert("xss")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("a & b")).toBe("a &amp; b");
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("leaves empty strings, unicode, and plain text unchanged besides mapping", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml("你好 🎉")).toBe("你好 🎉");
    expect(escapeHtml("safe")).toBe("safe");
  });
});
