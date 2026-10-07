"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="setup-wrap stack">
      <h1>This page could not load.</h1>
      <p className="muted">
        Your work has not been marked as completed. Check your connection and Supabase
        configuration, then try again.
      </p>
      <button id="retry-page" className="btn primary" onClick={reset}>
        Try again
      </button>
      <a className="btn" href="/dashboard">
        Return to workspaces
      </a>
    </main>
  );
}
