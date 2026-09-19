import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "../setup/mail";

vi.mock("nodemailer", async () => {
  const { sendMail: mockedSend } = await import("../setup/mail");
  return {
    default: {
      createTransport: () => ({ sendMail: mockedSend }),
    },
    createTransport: () => ({ sendMail: mockedSend }),
  };
});

import { POST as postContact } from "@/app/api/contact/route";
import { POST as postReply } from "@/app/api/contact/reply/route";
import { authedRequest, jsonRequest } from "../setup/api";
import { TEST_ADMIN_EMAIL } from "../setup/env";

describe("POST /api/contact", () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: "1" });
  });

  it("rejects missing fields", async () => {
    const res = await postContact(
      jsonRequest("http://localhost/api/contact", {
        method: "POST",
        json: { name: "A" },
        headers: { "x-forwarded-for": "13.0.0.1" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects messages over 2000 characters", async () => {
    const res = await postContact(
      jsonRequest("http://localhost/api/contact", {
        method: "POST",
        json: {
          name: "A",
          email: "a@b.c",
          subject: "Hi",
          message: "x".repeat(2001),
        },
        headers: { "x-forwarded-for": "13.0.0.2" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("HTML-escapes fields before sending", async () => {
    const res = await postContact(
      jsonRequest("http://localhost/api/contact", {
        method: "POST",
        json: {
          name: "<script>alert(1)</script>",
          email: "a@b.c",
          subject: "Hi & Bye",
          message: "<img src=x onerror=alert(1)>",
        },
        headers: { "x-forwarded-for": "13.0.0.3" },
      }),
    );
    expect(res.status).toBe(200);
    const html = String(sendMail.mock.calls[0][0].html);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });
});

describe("POST /api/contact/reply", () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: "2" });
  });

  it("rejects non-admin sessions", async () => {
    const req = await authedRequest("http://localhost/api/contact/reply", {
      method: "POST",
      userId: "user_a",
      email: "alice@example.com",
      json: {
        recipientEmail: "a@b.c",
        subject: "Re",
        message: "Hello",
      },
    });
    const res = await postReply(req);
    expect(res.status).toBe(401);
  });

  it("sends escaped replies for admins", async () => {
    const req = await authedRequest("http://localhost/api/contact/reply", {
      method: "POST",
      userId: "admin",
      email: TEST_ADMIN_EMAIL,
      json: {
        recipientEmail: "a@b.c",
        recipientName: "<b>Bob</b>",
        subject: "Re",
        message: "<script>x</script>",
      },
      ip: "13.1.0.1",
    });
    const res = await postReply(req);
    expect(res.status).toBe(200);
    const html = String(sendMail.mock.calls[0][0].html);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>x</script>");
  });
});
