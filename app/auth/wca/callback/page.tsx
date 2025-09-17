"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WCACallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

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

        // Exchange code for access token
        const response = await fetch("/api/auth/wca/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange code for token");
        }

        const data = await response.json();
        
        if (data.success) {
          setStatus("success");
          setMessage("Successfully signed in with WCA!");
          
          // Store user data in localStorage or state management
          if (data.user) {
            localStorage.setItem("wca_user", JSON.stringify(data.user));
          }
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Authentication failed");
        }
      } catch (error) {
        console.error("WCA OAuth callback error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred during authentication");
      }
    };

    handleCallback();
  }, [searchParams, router]);

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
                  Authenticating with WCA
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
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                  Redirecting you to the homepage...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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