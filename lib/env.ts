import { logger } from "./logger";

const REQUIRED_SERVER = ["JWT_SECRET_KEY", "NEXT_PUBLIC_CONVEX_URL"] as const;

export function assertServerEnv() {
  const missing = REQUIRED_SERVER.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    logger.error("missing_required_env", { missing });
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function sessionIssuer() {
  return (
    process.env.CONVEX_JWT_ISSUER ||
    process.env.SITE_URL ||
    "https://cubedev.xyz"
  );
}

export function cubieJwtIssuer() {
  return process.env.JWT_ISSUER || "cubedev";
}

export function jwtAudience() {
  return process.env.JWT_AUDIENCE || "cubie-backend";
}

export function convexJwtAudience() {
  return process.env.CONVEX_JWT_AUDIENCE || "convex";
}

export function cubieBackendUrl() {
  return process.env.CUBIE_BACKEND_URL || process.env.NEXT_PUBLIC_CUBIE_BACKEND_URL || "http://localhost:8000";
}

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  const adminEmails =
    process.env.ADMIN_EMAIL?.split(",").map((e) => e.trim().toLowerCase()) || [];
  return adminEmails.includes(email.toLowerCase());
}

export function smtpPassword() {
  return process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
}
