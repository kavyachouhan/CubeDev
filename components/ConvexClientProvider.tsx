"use client";

import { useCallback, useEffect, useState } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { publicConfig } from "@/lib/config";

const convex = new ConvexReactClient(publicConfig.convexUrl);

function useCubeDevAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });
      setIsAuthenticated(response.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    const onUserUpdated = () => {
      void refreshSession();
    };
    window.addEventListener("userUpdated", onUserUpdated);
    return () => window.removeEventListener("userUpdated", onUserUpdated);
  }, [refreshSession]);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const url = forceRefreshToken
          ? "/api/auth/convex-token?refresh=1"
          : "/api/auth/convex-token";
        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) {
          return null;
        }
        const data: { token?: string } = await response.json();
        return data.token ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  return { isLoading, isAuthenticated, fetchAccessToken };
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useCubeDevAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
