import { APP } from "@/lib/config";
export function Setup() {
  return (
    <main id="main-content" className="setup-wrap stack">
      <div className="brand">
        <span className="brand-mark">✓</span>
        {APP.name}
      </div>
      <h1>Connect your workspace backend.</h1>
      <p className="muted">
        The V1 application is included. Add your Supabase configuration to enable authentication and
        real client work.
      </p>
      <section className="panel pad stack">
        <h2>1. Install and configure</h2>
        <pre>{`npm install
cp .env.example .env.local
# Add your Supabase URL, publishable key and app URL
npm run check:env`}</pre>
        <h2>2. Apply the database migrations</h2>
        <p>
          Use the Supabase CLI or run the SQL files in <code>supabase/migrations</code> in filename
          order in a fresh project. They create the tables, workflow functions, access policies and
          private evidence bucket.
        </p>
        <h2>3. Start the application</h2>
        <pre>{`npm run dev`}</pre>
        <p className="hint">
          Then create an account, create a client workspace, install a template and invite a VA. See{" "}
          <code>START_HERE.md</code> for SMTP, scheduling, backups and testing.
        </p>
      </section>
      <div className="notice warning">
        No demo data is presented as real work. Missing configuration never bypasses sign-in or
        tenant permissions.
      </div>
    </main>
  );
}
