import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configure nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { recipientEmail, recipientName, subject, message, originalSubject } =
      await req.json();

    // Basic validation
    if (!recipientEmail || !subject || !message) {
      return NextResponse.json(
        { error: "Recipient email, subject, and message are required" },
        { status: 400 },
      );
    }

    // Construct the HTML content for the reply email
    const replyEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          CubeDev Support Response
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi ${recipientName || "there"},</p>
          
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          
          <p>Best regards,<br>
          <strong>CubeDev Team</strong><br>
          <a href="https://cubedev.xyz" style="color: #007bff;">https://cubedev.xyz</a></p>
        </div>
        
        ${
          originalSubject
            ? `
        <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
            <strong>In response to:</strong> ${originalSubject}
          </p>
        </div>
        `
            : ""
        }
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f1f1f1; border-radius: 8px;">
          <p style="margin: 0; color: #6c757d; font-size: 12px;">
            This email was sent from CubeDev Support. If you have any questions, feel free to reply to this email or contact us at support@cubedev.xyz.
          </p>
        </div>
      </div>
    `;

    // Send reply email to user
    await transporter.sendMail({
      from: `"CubeDev Support" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: replyEmailHtml,
      replyTo: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    });

    return NextResponse.json(
      { message: "Reply sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending reply email:", error);
    return NextResponse.json(
      { error: "Failed to send reply. Please try again later." },
      { status: 500 },
    );
  }
}