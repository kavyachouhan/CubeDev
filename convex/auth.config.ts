import { AuthConfig } from "convex/server";
import { convexConfig } from "./config";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: convexConfig.jwtAudience,
      issuer: convexConfig.jwtIssuer,
      jwks: "https://first-cuttlefish-485.convex.site/.well-known/jwks.json",
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;
