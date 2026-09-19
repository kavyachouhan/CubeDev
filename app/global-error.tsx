"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1>Something went wrong</h1>
            <p>The application hit an unexpected error.</p>
            {error.digest ? <p>{error.digest}</p> : null}
            <button type="button" onClick={reset}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}