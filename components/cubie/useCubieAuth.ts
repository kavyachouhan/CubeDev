import { useUser } from "@/components/UserProvider";
import { useState, useEffect, useRef } from "react";

export function useCubieAuth() {
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const tokenExpiryRef = useRef<number | null>(null);

  const isTokenExpired = (): boolean => {
    if (!token || !tokenExpiryRef.current) {
      return true;
    }

    const now = Date.now();
    const bufferTime = 5 * 60 * 1000;
    return now >= tokenExpiryRef.current - bufferTime;
  };

  const generateToken = async (): Promise<string | null> => {
    if (!user?.convexId) {
      return null;
    }

    if (isGenerating) {
      return token;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/auth/token", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        tokenExpiryRef.current = Date.now() + 60 * 60 * 1000;
        return data.token;
      }

      return null;
    } catch {
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (!user?.convexId) {
      return null;
    }

    if (token && !isTokenExpired()) {
      return token;
    }

    return await generateToken();
  };

  const refreshToken = async (): Promise<string | null> => {
    setToken(null);
    tokenExpiryRef.current = null;
    return await generateToken();
  };

  const clearToken = () => {
    setToken(null);
    tokenExpiryRef.current = null;
  };

  useEffect(() => {
    if (user?.convexId && !token && !isGenerating) {
      void generateToken();
    }
  }, [user?.convexId]);

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
