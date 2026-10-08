import { AuthConfig } from "convex/server";
import { convexConfig } from "./config";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: convexConfig.jwtAudience,
      issuer: convexConfig.jwtIssuer,
      jwks: convexConfig.authJwksUrl,
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;
