"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useUser } from "@/components/UserProvider";

interface AdminContextValue {
  isAdmin: boolean | null;
  isVerifying: boolean;
  userEmail: string | null;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [lastVerifiedEmail, setLastVerifiedEmail] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const verifyAdmin = async () => {
      if (userLoading) return;

      if (!user) {
        setIsAdmin(false);
        setIsVerifying(false);
        setLastVerifiedEmail(null);
        return;
      }

      // If we've already verified this email and it hasn't changed, skip verification
      if (lastVerifiedEmail === user.email && isAdmin !== null) {
        setIsVerifying(false);
        return;
      }

      setIsVerifying(true);

      try {
        const response = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });

        const data = await response.json();
        setIsAdmin(data.isAdmin);
        setLastVerifiedEmail(user.email);
      } catch (error) {
        console.error("Admin verification failed:", error);
        setIsAdmin(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdmin();
  }, [user, userLoading, lastVerifiedEmail, isAdmin]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isVerifying: userLoading || isVerifying,
        userEmail: user?.email ?? null,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}