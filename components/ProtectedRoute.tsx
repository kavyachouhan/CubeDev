"use client";

import { useUser } from "@/components/UserProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getWCAOAuthUrl } from "@/lib/wca-config";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  redirectTo,
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const handleWCASignIn = () => {
    // Store the current path to redirect back after authentication
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redirectAfterAuth", pathname);
    }
    const wcaAuthUrl = getWCAOAuthUrl();
    window.location.href = wcaAuthUrl;
  };

  useEffect(() => {
    if (!isLoading && !user && redirectTo) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      loadingComponent || (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
            <p className="text-[var(--text-secondary)] font-inter">
              Verifying authentication...
            </p>
          </div>
        </div>
      )
    );
  }

  // Show authentication required message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto text-center space-y-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl">
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] font-statement">
              Authentication Required
            </h1>
            <p className="text-[var(--text-secondary)] font-inter">
              Please sign in with your WCA account to access this page. You'll
              be redirected back here after signing in.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleWCASignIn}
              className="w-full px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-button transition-all"
            >
              Sign in with WCA
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full px-6 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-lg font-button transition-all"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the protected content if user is authenticated
  return <>{children}</>;
}