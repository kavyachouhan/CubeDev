import { publicConfig, wcaEndpoints } from "./config";

export const WCA_CONFIG = {
  get CLIENT_ID() {
    return publicConfig.wcaClientId;
  },
  get REDIRECT_URI() {
    return publicConfig.wcaRedirectUri;
  },
  SCOPE: wcaEndpoints.scope,
  AUTHORIZATION_URL: wcaEndpoints.authorizationUrl,
  TOKEN_URL: wcaEndpoints.tokenUrl,
  API_BASE_URL: wcaEndpoints.apiBaseUrl,
};

export const getWCAOAuthUrl = (state?: string) => {
  const params = new URLSearchParams({
    client_id: WCA_CONFIG.CLIENT_ID,
    redirect_uri: WCA_CONFIG.REDIRECT_URI,
    response_type: "code",
    scope: WCA_CONFIG.SCOPE,
  });
  if (state) {
    params.set("state", state);
  }

  return `${WCA_CONFIG.AUTHORIZATION_URL}?${params.toString()}`;
};

export const wcaSignInHref = (returnTo?: string) => {
  const params = new URLSearchParams();
  if (returnTo) {
    params.set("returnTo", returnTo);
  }
  const query = params.toString();
  return query ? `/api/auth/wca/start?${query}` : "/api/auth/wca/start";
};
