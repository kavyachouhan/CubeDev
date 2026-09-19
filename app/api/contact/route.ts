import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/html-escape";
import { logger } from "@/lib/logger";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { serverConfig } from "@/lib/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: serverConfig.smtpUser,
    pass: serverConfig.smtpPassword,
  },
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(`contact:${clientKey(req)}`, 5, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  try {
    const { name, email, subject, message, wcaId } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (typeof message !== "string" || message.length > 2000) {
      return NextResponse.json(
        { error: "Message must be 2000 characters or fewer" },
        { status: 400 },
      );
    }

    const safeName = escapeHtml(String(name));
    const safeEmail = escapeHtml(String(email));
    const safeSubject = escapeHtml(String(subject));
    const safeMessage = escapeHtml(String(message));
    const safeWcaId = wcaId ? escapeHtml(String(wcaId)) : "";
    const adminTo = serverConfig.contactEmailTo;

    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission - CubeDev</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        ${safeWcaId ? `<p><strong>WCA ID:</strong> ${safeWcaId}</p>` : ""}
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
      </div>
    `;

    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for contacting CubeDev!</h2>
        <p>Hi ${safeName},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"CubeDev Contact Form" <${serverConfig.smtpUser}>`,
      to: adminTo,
      subject: `[CubeDev Contact] ${String(subject).slice(0, 120)}`,
      html: adminEmailHtml,
      text: `${name}\n${email}\n${subject}\n${message}`,
      replyTo: email,
    });

    await transporter.sendMail({
      from: `"CubeDev" <${serverConfig.smtpUser}>`,
      to: email,
      subject: "Thank you for contacting CubeDev!",
      html: userEmailHtml,
      replyTo: serverConfig.smtpUser,
    });

    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    logger.error("contact_send_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 },
    );
  }
}