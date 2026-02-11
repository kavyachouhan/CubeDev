import { NextRequest, NextResponse } from "next/server";

// This API route verifies if a user has admin access
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { isAdmin: false, error: "No email provided" },
        { status: 400 },
      );
    }

    const adminEmails =
      process.env.ADMIN_EMAIL?.split(",").map((e) => e.trim().toLowerCase()) ||
      [];

    const isAdmin = adminEmails.includes(email.toLowerCase());

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Admin verification error:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}
