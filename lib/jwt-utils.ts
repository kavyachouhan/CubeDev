/**
 * JWT Utilities for CubeDev
 * Handles JWT token generation for authenticating with the Cubie backend
 */

import { SignJWT } from "jose";

// JWT Configuration
const JWT_SECRET =
  process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-in-production";
const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "cubedev";
const JWT_AUDIENCE = "cubie-backend";
const JWT_EXPIRATION = "24h"; // Token valid for 24 hours

/**
 * Generate a JWT token for a user
 * @param userId - User's Convex ID
 * @param wcaId - User's WCA ID
 * @param email - User's email
 * @returns JWT token string
 */
export async function generateJWT(
  userId: string,
  wcaId: string,
  email?: string
): Promise<string> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new SignJWT({
      sub: userId,
      wca_id: wcaId,
      email: email,
      user_id: userId,
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(secret);

    return token;
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw new Error("Failed to generate authentication token");
  }
}

/**
 * Verify a JWT token (client-side validation)
 * Note: Primary validation happens on the backend
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export async function verifyJWT(token: string): Promise<any | null> {
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token - JWT token to check
 * @returns true if expired, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));

    if (!payload.exp) {
      return true; // No expiration means invalid
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // Assume expired if we can't parse it
  }
}

/**
 * Extract user info from JWT without full verification
 * Useful for client-side display before backend verification
 * @param token - JWT token
 * @returns User info or null
 */
export function decodeJWT(token: string): any | null {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    return payload;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}