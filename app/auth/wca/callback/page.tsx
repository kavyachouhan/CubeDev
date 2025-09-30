"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function WCACallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (isProcessing) {
        return;
      }

      try {
        setIsProcessing(true);

        const code = searchParams.get("code");
        const error = searchParams.get("error");

        // Clean up the URL immediately to remove sensitive parameters
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        if (error) {
          setStatus("error");
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("No authorization code received");
          return;
        }

        // Check if we've already processed this authentication
        const authSessionKey = `wca_auth_${code.slice(0, 8)}`;
        const existingAuth = sessionStorage.getItem(authSessionKey);

        if (existingAuth) {
          // Already processed this code, check the result
          const authResult = JSON.parse(existingAuth);
          if (authResult.success) {
            setStatus("success");
            setMessage("Authentication successful!");
            setTimeout(() => {
              router.push("/cube-lab/timer");
            }, 1500);
          } else {
            setStatus("error");
            setMessage(authResult.error || "Authentication failed");
          }
          return;
        }

        // Exchange code for access token
        const response = await fetch("/api/auth/wca/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const authResult = {
            success: false,
            error: errorData.error || "Failed to exchange code for token",
          };
          sessionStorage.setItem(authSessionKey, JSON.stringify(authResult));
          throw new Error(authResult.error);
        }

        const data = await response.json();

        if (data.success) {
          // Store successful auth result
          sessionStorage.setItem(
            authSessionKey,
            JSON.stringify({ success: true })
          );

          setStatus("success");
          setMessage("Successfully signed in with WCA!");

          // Store user data in localStorage including Convex ID
          if (data.user) {
            const userData = {
              ...data.user,
              convexId: data.user.convexId, // Ensure convexId is included
              accessToken: data.accessToken,
              loginTime: Date.now(),
            };
            localStorage.setItem("wca_user", JSON.stringify(userData));

            // Dispatch custom event to notify UserProvider of the update
            window.dispatchEvent(new CustomEvent("userUpdated"));
          }

          // Show warning if database save failed
          if (data.warning) {
            console.warn("Database warning:", data.warning);
          }

          // Redirect to stored URL or default to Cube Lab timer page after a short delay
          setTimeout(() => {
            const redirectUrl = localStorage.getItem("wca_redirect_url");
            if (redirectUrl) {
              localStorage.removeItem("wca_redirect_url");
              window.location.href = redirectUrl;
            } else {
              router.push("/cube-lab/timer");
            }
          }, 2000);
        } else {
          const authResult = {
            success: false,
            error: data.error || "Authentication failed",
          };
          sessionStorage.setItem(authSessionKey, JSON.stringify(authResult));
          setStatus("error");
          setMessage(data.error || "Authentication failed");
        }
      } catch (error) {
        console.error("WCA OAuth callback error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred during authentication");
      } finally {
        setIsProcessing(false);
      }
    };

    // Only run if we have search params and haven't started processing
    if (searchParams && !isProcessing) {
      handleCallback();
    }
  }, [searchParams, router, isProcessing]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="container-responsive">
        <div className="max-w-md mx-auto text-center">
          <div className="timer-card">
            {status === "loading" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4 font-statement">
                  Authenticating with{" "}
                  <span className="text-[var(--primary)]">WCA</span>
                </h1>
                <p className="text-[var(--text-secondary)] font-inter">
                  Please wait while we complete your sign-in...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-green-600 mb-4 font-statement">
                  Success!
                </h1>
                <p className="text-[var(--text-secondary)] font-inter">
                  {message}
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2 font-inter">
                  Redirecting you to the timer...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-red-600 mb-4 font-statement">
                  Authentication Failed
                </h1>
                <p className="text-[var(--text-secondary)] mb-6 font-inter">
                  {message}
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold rounded-lg transition-all duration-200 font-button"
                >
                  Return to Home
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="container-responsive">
        <div className="max-w-md mx-auto text-center">
          <div className="timer-card">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4 font-statement">
              Loading...
            </h1>
            <p className="text-[var(--text-secondary)] font-inter">
              Preparing authentication...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WCACallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WCACallbackContent />
    </Suspense>
  );
}
