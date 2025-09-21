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
  avatar?: any;
  email: string;
  accessToken?: string;
  loginTime?: number;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => void;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch additional user data from Convex if logged in
  const convexUser = useQuery(
    api.users.getUserById,
    user?.convexId ? { id: user.convexId } : "skip"
  );

  useEffect(() => {
    // Load user from localStorage on mount
    const loadUser = () => {
      const storedUser = localStorage.getItem("wca_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse stored user data:", error);
          localStorage.removeItem("wca_user");
        }
      }
      setIsLoading(false);
    };

    loadUser();

    // Listen for storage events (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "wca_user") {
        if (e.newValue) {
          try {
            const parsedUser = JSON.parse(e.newValue);
            setUser(parsedUser);
          } catch (error) {
            console.error(
              "Failed to parse user data from storage event:",
              error
            );
          }
        } else {
          setUser(null);
        }
      }
    };

    // Listen for custom user update events
    const handleUserUpdate = () => {
      loadUser();
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
  };

  const refreshUser = () => {
    // Reload user data from localStorage
    const storedUser = localStorage.getItem("wca_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        signOut();
      }
    } else {
      signOut();
    }
  };

  const value: UserContextType = {
    user: convexUser && user ? { ...user, ...convexUser } : user,
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