"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface User {
  id: number;
  convexId?: Id<"users">;
  name: string;
  wcaId?: string;
  countryIso2: string;
  avatar?: { url?: string } | string;
  email: string;
  loginTime?: number;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => void;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

function withoutAccessToken<T extends Record<string, unknown>>(value: T): T {
  const copy = { ...value };
  delete copy.accessToken;
  delete copy.refreshToken;
  return copy;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const convexUser = useQuery(
    api.users.getUserById,
    user?.convexId ? { id: user.convexId } : "skip",
  );

  useEffect(() => {
    const loadUser = async () => {
      let storedUser: User | null = null;
      const raw = localStorage.getItem("wca_user");
      if (raw) {
        try {
          storedUser = withoutAccessToken(JSON.parse(raw)) as User;
        } catch {
          localStorage.removeItem("wca_user");
        }
      }

      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        });
        if (!sessionResponse.ok) {
          localStorage.removeItem("wca_user");
          setUser(null);
          setIsLoading(false);
          return;
        }
        const session = await sessionResponse.json();
        if (storedUser) {
          setUser({
            ...storedUser,
            convexId: session.user?.convexId ?? storedUser.convexId,
            wcaId: session.user?.wcaId ?? storedUser.wcaId,
            email: session.user?.email ?? storedUser.email,
          });
        } else if (session.user?.convexId) {
          setUser({
            id: 0,
            convexId: session.user.convexId,
            name: "",
            wcaId: session.user.wcaId,
            countryIso2: "",
            email: session.user.email || "",
            loginTime: Date.now(),
          });
        }
      } catch {
        if (storedUser) {
          setUser(storedUser);
        }
      }
      setIsLoading(false);
    };

    void loadUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "wca_user") {
        if (e.newValue) {
          try {
            setUser(withoutAccessToken(JSON.parse(e.newValue)) as User);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    const handleUserUpdate = () => {
      void loadUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("wca_user");
    void fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
  };

  const refreshUser = () => {
    const storedUser = localStorage.getItem("wca_user");
    if (storedUser) {
      try {
        setUser(withoutAccessToken(JSON.parse(storedUser)) as User);
      } catch {
        signOut();
      }
    }
  };

  const mergedUser =
    convexUser && user
      ? {
          ...user,
          name: convexUser.name || user.name,
          wcaId: convexUser.wcaId || user.wcaId,
          countryIso2: convexUser.countryIso2 || user.countryIso2,
          avatar: convexUser.avatar ?? user.avatar,
          email:
            typeof convexUser.email === "string" && convexUser.email
              ? convexUser.email
              : user.email,
        }
      : user;

  const value: UserContextType = {
    user: mergedUser,
    isLoading,
    signOut,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
