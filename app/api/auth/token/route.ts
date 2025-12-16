import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

// JWT configuration constants
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || "";
const JWT_ISSUER = process.env.JWT_ISSUER || "";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "cubie-backend";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";

/**
 * Generate JWT Token API Endpoint
 * POST /api/auth/token
 *
 * Generates a JWT token for authenticated users
 * Used for authenticating with the Cubie backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, wcaId, email } = body;

    // Validate required fields
    if (!userId || !wcaId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId and wcaId" },
        { status: 400 }
      );
    }

    // Validate JWT secret is configured
    if (!JWT_SECRET) {
      console.error("JWT_SECRET_KEY not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: JWT secret not configured",
        },
        { status: 500 }
      );
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new SignJWT({
      sub: userId,
      user_id: userId,
      wca_id: wcaId,
      email: email,
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(secret);

    return NextResponse.json({
      success: true,
      token: token,
      expiresIn: JWT_EXPIRATION,
    });
  } catch (error) {
    console.error("Error generating JWT token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate authentication token",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}