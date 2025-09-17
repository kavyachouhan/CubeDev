const required = (v: string | undefined, name: string) => {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
};

// WCA OAuth Configuration
export const WCA_CONFIG = {
  CLIENT_ID: required(process.env.NEXT_PUBLIC_WCA_CLIENT_ID, "NEXT_PUBLIC_WCA_CLIENT_ID"),
  REDIRECT_URI: required(process.env.NEXT_PUBLIC_WCA_REDIRECT_URI, "NEXT_PUBLIC_WCA_REDIRECT_URI"),
  SCOPE: 'public', // Using public scope for basic user info
  AUTHORIZATION_URL: 'https://www.worldcubeassociation.org/oauth/authorize',
  TOKEN_URL: 'https://www.worldcubeassociation.org/oauth/token',
  API_BASE_URL: 'https://www.worldcubeassociation.org/api/v0',
} as const;

// Helper function to construct OAuth URL
export const getWCAOAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: WCA_CONFIG.CLIENT_ID,
    redirect_uri: WCA_CONFIG.REDIRECT_URI,
    response_type: 'code',
    scope: WCA_CONFIG.SCOPE,
  });
  
  return `${WCA_CONFIG.AUTHORIZATION_URL}?${params.toString()}`;
};