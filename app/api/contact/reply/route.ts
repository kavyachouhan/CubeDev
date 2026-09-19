import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/html-escape";
import { getSessionFromRequest } from "@/lib/session";
import { logger } from "@/lib/logger";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isAdminEmail, serverConfig } from "@/lib/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: serverConfig.smtpUser,
    pass: serverConfig.smtpPassword,
  },
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!isAdminEmail(session?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`contact-reply:${clientKey(req)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  try {
    const { recipientEmail, recipientName, subject, message, originalSubject } =
      await req.json();

    if (!recipientEmail || !subject || !message) {
      return NextResponse.json(
        { error: "Recipient email, subject, and message are required" },
        { status: 400 },
      );
    }

    const safeName = escapeHtml(String(recipientName || "there"));
    const safeMessage = escapeHtml(String(message));
    const safeOriginal = originalSubject ? escapeHtml(String(originalSubject)) : "";

    const replyEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>CubeDev Support Response</h2>
        <p>Hi ${safeName},</p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
        ${
          safeOriginal
            ? `<p><strong>In response to:</strong> ${safeOriginal}</p>`
            : ""
        }
      </div>
    `;

    await transporter.sendMail({
      from: `"CubeDev" <${serverConfig.smtpUser}>`,
      to: recipientEmail,
      subject: String(subject).slice(0, 200),
      html: replyEmailHtml,
      text: String(message),
      replyTo: serverConfig.smtpUser,
    });

    return NextResponse.json({ message: "Reply sent successfully!" });
  } catch (error) {
    logger.error("contact_reply_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to send reply. Please try again later." },
      { status: 500 },
    );
  }
}