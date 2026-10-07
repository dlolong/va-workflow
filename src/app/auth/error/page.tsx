import Link from "next/link";
export default function AuthError() {
  return (
    <main id="main-content" className="setup-wrap stack">
      <h1>This sign-in link could not be verified.</h1>
      <p>
        The link may have expired or already been used. Request a new link from the sign-in screen.
        For setup, verify the Supabase Site URL and allowed redirect URLs.
      </p>
      <Link className="btn primary" href="/login">
        Back to sign in
      </Link>
    </main>
  );
}
