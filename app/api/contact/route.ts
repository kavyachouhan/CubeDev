import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Create a transporter using Gmail (you can change this to your preferred email service)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER, // Your email
    pass: process.env.SMTP_PASSWORD, // Your email password or app-specific password
  },
});

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, wcaId } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Email content for you (the admin)
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Contact Form Submission - CubeDev
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${wcaId ? `<p><strong>WCA ID:</strong> ${wcaId}</p>` : ""}
          <p><strong>Subject:</strong> ${subject}</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>

        <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 8px;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            This message was sent through the CubeDev contact form at ${new Date().toLocaleString()}.
          </p>
        </div>
      </div>
    `;

    // Email content for the user (confirmation)
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          Thank you for contacting CubeDev!
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi ${name},</p>
          
          <p>Thank you for reaching out to CubeDev! I've received your message and will get back to you as soon as possible.</p>
          
          <p>Here's a copy of what you sent:</p>
          
          <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <p>Thanks for being part of the CubeDev community!</p>
          
          <p>Best regards,<br>
          <strong>Kavya Chouhan</strong><br>
          Creator of CubeDev<br>
          <a href="https://cubedev.xyz">https://cubedev.xyz</a></p>
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 8px;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            This is an automated confirmation. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Send email to admin
    await transporter.sendMail({
      from: `"CubeDev Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `[CubeDev Contact] ${subject}`,
      html: adminEmailHtml,
      replyTo: email,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: `"CubeDev" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Thank you for contacting CubeDev!",
      html: userEmailHtml,
    });

    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}