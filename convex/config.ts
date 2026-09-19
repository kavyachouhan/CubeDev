function required(name: string): string {
  const value = process.env[name];
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

export const convexConfig = {
  get jwtSecretKey() {
    return required("JWT_SECRET_KEY");
  },
  get jwtIssuer() {
    return required("CONVEX_JWT_ISSUER");
  },
  get jwtAudience() {
    return required("CONVEX_JWT_AUDIENCE");
  },
  get siteUrl() {
    return required("SITE_URL");
  },
  get authJwks() {
    return optional("CONVEX_AUTH_JWKS");
  },
  get adminEmails() {
    return required("ADMIN_EMAIL")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  },
  get vapidPublicKey() {
    return optional("VAPID_PUBLIC_KEY");
  },
  get vapidPrivateKey() {
    return optional("VAPID_PRIVATE_KEY");
  },
  get vapidSubject() {
    return optional("VAPID_SUBJECT");
  },
};
