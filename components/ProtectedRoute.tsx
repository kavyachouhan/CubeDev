"use client";

import { useUser } from "@/components/UserProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { wcaSignInHref } from "@/lib/wca-config";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/Spinner";

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
    window.location.href = wcaSignInHref(pathname);
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
        <div className="min-h-screen bg-(--background) flex items-center justify-center">
          <LoadingState label="Verifying authentication…" />
        </div>
      )
    );
  }

  // Show authentication required message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-(--background) flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto text-center space-y-6 bg-(--surface) border border-(--border) rounded-(--radius-card) p-8 shadow-xl">
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-(--text-primary) font-statement">
              Authentication Required
            </h1>
            <p className="text-(--text-secondary) font-inter">
              Please sign in with your WCA account to access this page. You'll
              be redirected back here after signing in.
            </p>
          </div>

          <div className="space-y-3">
            <Button size="lg" fullWidth onClick={handleWCASignIn}>
              Sign in with WCA
            </Button>

            <Button
              size="lg"
              fullWidth
              variant="secondary"
              onClick={() => router.push("/")}
            >
              Go to home page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render the protected content if user is authenticated
  return <>{children}</>;
}