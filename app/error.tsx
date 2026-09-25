"use client";

import { Button, buttonClasses } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-(--background) flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-(--text-primary) font-statement">
          Something went wrong
        </h1>
        <p className="text-(--text-secondary) font-inter">
          An unexpected error occurred. You can try again, or return home.
        </p>
        {error.digest ? (
          <p className="text-xs text-(--text-muted) font-mono">{error.digest}</p>
        ) : null}
        <div className="flex items-center justify-center gap-3">
          <a href="/" className={buttonClasses({ variant: "secondary" })}>
            Home
          </a>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}