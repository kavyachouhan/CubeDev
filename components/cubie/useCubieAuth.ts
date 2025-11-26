import { useUser } from "@/components/UserProvider";

export function useCubieAuth() {
  const { user } = useUser();

  const getAuthToken = async (): Promise<string | null> => {
    try {
      // For now, send a simple auth token with user info
      // The backend will verify the user exists in Convex
      if (user?.convexId) {
        // Create a simple token with user convex ID
        const authPayload = {
          convexId: user.convexId,
          wcaId: user.wcaId,
          email: user.email,
          timestamp: Date.now(),
        };
        // Base64 encode for transport (not secure, just for user identification)
        return btoa(JSON.stringify(authPayload));
      }

      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  return {
    getAuthToken,
    isAuthenticated: !!user,
  };
}
