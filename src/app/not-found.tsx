import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="setup-wrap stack">
      <h1>Page unavailable.</h1>
      <p>You may not have access to this workspace or item.</p>
      <Link className="btn primary" href="/dashboard">
        Your workspaces
      </Link>
    </main>
  );
}
