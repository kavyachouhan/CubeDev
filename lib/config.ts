function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function requiredValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }
  return value;
}

export const isProduction = process.env.NODE_ENV === "production";

// NEXT_PUBLIC_* must be read as process.env.NAME (not process.env[name])
// so Next.js can inline them into the client bundle.
export const publicConfig = {
  get convexUrl() {
    return requiredValue(
      "NEXT_PUBLIC_CONVEX_URL",
      process.env.NEXT_PUBLIC_CONVEX_URL,
    );
  },
  get cubieBackendUrl() {
    return requiredValue(
      "NEXT_PUBLIC_CUBIE_BACKEND_URL",
      process.env.NEXT_PUBLIC_CUBIE_BACKEND_URL,
    );
  },
  get wcaClientId() {
    return requiredValue(
      "NEXT_PUBLIC_WCA_CLIENT_ID",
      process.env.NEXT_PUBLIC_WCA_CLIENT_ID,
    );
  },
  get wcaRedirectUri() {
    return requiredValue(
      "NEXT_PUBLIC_WCA_REDIRECT_URI",
      process.env.NEXT_PUBLIC_WCA_REDIRECT_URI,
    );
  },
  get appwriteEndpoint() {
    return requiredValue(
      "NEXT_PUBLIC_APPWRITE_ENDPOINT",
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    );
  },
  get appwriteProjectId() {
    return requiredValue(
      "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    );
  },
  get appwriteJournalBucketId() {
    return requiredValue(
      "NEXT_PUBLIC_APPWRITE_JOURNAL_BUCKET_ID",
      process.env.NEXT_PUBLIC_APPWRITE_JOURNAL_BUCKET_ID,
    );
  },
  get convexSiteUrl() {
    return requiredValue(
      "NEXT_PUBLIC_CONVEX_SITE_URL",
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
    );
  },
};

export const serverConfig = {
  get jwtSecretKey() {
    return required("JWT_SECRET_KEY");
  },
  get jwtAlgorithm() {
    return required("JWT_ALGORITHM");
  },
  get jwtIssuer() {
    return required("JWT_ISSUER");
  },
  get jwtAudience() {
    return required("JWT_AUDIENCE");
  },
  get jwtExpiration() {
    return required("JWT_EXPIRATION");
  },
  get siteUrl() {
    return required("SITE_URL");
  },
  get convexJwtIssuer() {
    return required("CONVEX_JWT_ISSUER");
  },
  get convexJwtAudience() {
    return required("CONVEX_JWT_AUDIENCE");
  },
  get convexAuthJwks() {
    return optional("CONVEX_AUTH_JWKS");
  },
  get convexAuthPrivateKey() {
    return optional("CONVEX_AUTH_PRIVATE_KEY");
  },
  get cubieBackendUrl() {
    return required("CUBIE_BACKEND_URL");
  },
  get wcaClientId() {
    return required("WCA_CLIENT_ID");
  },
  get wcaClientSecret() {
    return required("WCA_CLIENT_SECRET");
  },
  get wcaRedirectUri() {
    return required("WCA_REDIRECT_URI");
  },
  get smtpUser() {
    return required("SMTP_USER");
  },
  get smtpPassword() {
    return required("SMTP_PASSWORD");
  },
  get contactEmailTo() {
    return required("CONTACT_EMAIL_TO");
  },
  get adminEmails() {
    return required("ADMIN_EMAIL")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  },
};

export const wcaEndpoints = {
  scope: "public email",
  authorizationUrl: "https://www.worldcubeassociation.org/oauth/authorize",
  tokenUrl: "https://www.worldcubeassociation.org/oauth/token",
  apiBaseUrl: "https://www.worldcubeassociation.org/api/v0",
} as const;

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  return serverConfig.adminEmails.includes(email.toLowerCase());
}

export function assertServerEnv() {
  serverConfig.jwtSecretKey;
  publicConfig.convexUrl;
  serverConfig.convexJwtIssuer;
  serverConfig.siteUrl;
}
