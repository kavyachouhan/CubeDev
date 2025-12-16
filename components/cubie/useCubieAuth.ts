import { useUser } from "@/components/UserProvider";
import { useState, useEffect, useRef } from "react";

/**
 * Hook for managing Cubie authentication
 * Generates and caches JWT tokens for backend API calls
 */
export function useCubieAuth() {
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const tokenExpiryRef = useRef<number | null>(null);

  /**
   * Check if current token is expired or about to expire
   */
  const isTokenExpired = (): boolean => {
    if (!token || !tokenExpiryRef.current) {
      return true;
    }

    // Consider token expired if less than 5 minutes remaining
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return now >= tokenExpiryRef.current - bufferTime;
  };

  /**
   * Generate a new JWT token from the server
   */
  const generateToken = async (): Promise<string | null> => {
    if (!user?.convexId || !user?.wcaId) {
      console.error("Cannot generate token: user not fully authenticated");
      return null;
    }

    if (isGenerating) {
      // Prevent concurrent token generation
      return token;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.convexId,
          wcaId: user.wcaId,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to generate JWT token:", error);
        return null;
      }

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);

        // Assume token is valid for 24 hours
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
        tokenExpiryRef.current = expiryTime;
        return data.token;
      }

      console.error("Token generation failed:", data);
      return null;
    } catch (error) {
      console.error("Error generating JWT token:", error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Get a valid authentication token
   * Generates a new one if needed
   */
  const getAuthToken = async (): Promise<string | null> => {
    // No user logged in
    if (!user?.convexId) {
      return null;
    }

    // Return cached token if valid
    if (token && !isTokenExpired()) {
      return token;
    }

    // Generate new token
    return await generateToken();
  };

  /**
   * Force refresh the token
   */
  const refreshToken = async (): Promise<string | null> => {
    setToken(null);
    tokenExpiryRef.current = null;
    return await generateToken();
  };

  /**
   * Clear the cached token
   */
  const clearToken = () => {
    setToken(null);
    tokenExpiryRef.current = null;
  };

  // Auto-generate token when user logs in
  useEffect(() => {
    if (user?.convexId && !token && !isGenerating) {
      generateToken();
    }
  }, [user?.convexId]);

  // Clear token when user logs out
  useEffect(() => {
    if (!user) {
      clearToken();
    }
  }, [user]);

  return {
    getAuthToken,
    refreshToken,
    clearToken,
    isAuthenticated: !!user,
    hasValidToken: !!token && !isTokenExpired(),
  };
}