/**
 * Deterministic test environment. Never use production secrets here.
 * Applied by Vitest setupFiles and Playwright config.
 */

export const TEST_ENV = {
  NODE_ENV: "test",
  JWT_SECRET_KEY:
    "test-jwt-secret-key-for-qa-audit-do-not-use-in-production-64chars!!",
  JWT_ALGORITHM: "HS256",
  JWT_ISSUER: "cubedev",
  JWT_AUDIENCE: "cubie-backend",
  JWT_EXPIRATION: "1h",
  SITE_URL: "http://localhost:3000",
  CONVEX_JWT_ISSUER: "http://localhost:3000",
  CONVEX_JWT_AUDIENCE: "convex",
  NEXT_PUBLIC_CONVEX_URL: "https://test.convex.cloud",
  NEXT_PUBLIC_CONVEX_SITE_URL: "https://test.convex.site",
  NEXT_PUBLIC_CUBIE_BACKEND_URL: "http://localhost:8000",
  CUBIE_BACKEND_URL: "http://localhost:8000",
  NEXT_PUBLIC_WCA_CLIENT_ID: "test-wca-client-id",
  NEXT_PUBLIC_WCA_REDIRECT_URI: "http://localhost:3000/auth/wca/callback",
  WCA_CLIENT_ID: "test-wca-client-id",
  WCA_CLIENT_SECRET: "test-wca-client-secret",
  WCA_REDIRECT_URI: "http://localhost:3000/auth/wca/callback",
  ADMIN_EMAIL: "admin@cubedev.test",
  SMTP_USER: "test@cubedev.test",
  SMTP_PASSWORD: "test-smtp-password",
  CONTACT_EMAIL_TO: "contact@cubedev.test",
  NEXT_PUBLIC_APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: "test-project",
  NEXT_PUBLIC_APPWRITE_JOURNAL_BUCKET_ID: "test-bucket",
} as const;

export const TEST_ADMIN_EMAIL = TEST_ENV.ADMIN_EMAIL;

export function applyTestEnv() {
  for (const [key, value] of Object.entries(TEST_ENV)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  process.env.NODE_ENV = "test";
}

applyTestEnv();
