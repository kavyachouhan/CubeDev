"use client";

import { useUser } from "@/components/UserProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldOff, ShieldCheck } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (userLoading) return;

      if (!user) {
        setIsAdmin(false);
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });

        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error("Admin verification failed:", error);
        setIsAdmin(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdmin();
  }, [user, userLoading]);

  // Loading state
  if (userLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)] font-inter">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="timer-card max-w-md w-full text-center space-y-6">
          <div className="p-4 bg-[var(--error)]/10 rounded-full w-fit mx-auto">
            <ShieldOff className="w-12 h-12 text-[var(--error)]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              Authentication Required
            </h1>
            <p className="text-[var(--text-secondary)] font-inter">
              You must be signed in to access the admin panel.
            </p>
          </div>
          <button
            onClick={() => router.push("/cube-lab/timers")}
            className="px-6 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity font-inter"
          >
            Go to Cube Lab
          </button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="timer-card max-w-md w-full text-center space-y-6">
          <div className="p-4 bg-[var(--error)]/10 rounded-full w-fit mx-auto">
            <ShieldOff className="w-12 h-12 text-[var(--error)]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              Access Denied
            </h1>
            <p className="text-[var(--text-secondary)] font-inter">
              You don&apos;t have permission to access the admin panel.
            </p>
            <p className="text-sm text-[var(--text-muted)] font-inter">
              Contact the site administrator if you believe this is an error.
            </p>
          </div>
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] font-inter">
              Signed in as: {user.email}
            </p>
          </div>
          <button
            onClick={() => router.push("/cube-lab/timers")}
            className="px-6 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity font-inter"
          >
            Go to Cube Lab
          </button>
        </div>
      </div>
    );
  }

  // Admin access granted
  return <>{children}</>;
}
