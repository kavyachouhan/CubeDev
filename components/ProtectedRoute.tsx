"use client";

import { useUser } from "@/components/UserProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/",
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              Authentication Required
            </h1>
            <p className="text-[var(--text-secondary)] font-inter">
              Please sign in with your WCA account to access the Cube Lab
              dashboard.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="btn-primary w-full font-button"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  // Render the protected content if user is authenticated
  return <>{children}</>;
}