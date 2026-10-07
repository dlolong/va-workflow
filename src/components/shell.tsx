"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { APP, SECTIONS } from "@/lib/config";
import type { Workspace, Profile } from "@/lib/types";
import { browserSupabase } from "@/lib/supabase/browser";
export function Shell({
  workspaces,
  profile,
  children,
}: {
  workspaces: Workspace[];
  profile: Profile;
  children: React.ReactNode;
}) {
  const [unsaved, setUnsaved] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    const listener = (event: Event) => setUnsaved(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("va-relay:unsaved", listener);
    return () => window.removeEventListener("va-relay:unsaved", listener);
  }, []);
  const mayLeave = () =>
    !unsaved ||
    window.confirm("There are unsaved answers or an unfinished upload. Leave this page?");
  const path = usePathname();
  const router = useRouter();
  const parts = path.split("/");
  const w = parts[1] === "workspaces" ? parts[2] : "";
  const section = parts[3] || "today";
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">✓</span>
          {APP.name}
        </Link>
        <div>
          <p className="eyebrow" style={{ padding: "0 12px 10px" }}>
            Workspace
          </p>
          <nav aria-label="Main navigation">
            <Link
              id="nav-workspaces"
              className={`nav-link ${!w ? "active" : ""}`}
              href="/dashboard"
            >
              <span className="nav-dot" />
              Client workspaces
            </Link>
            {w &&
              SECTIONS.map(([key, label]) => (
                <Link
                  id={`nav-${key}`}
                  key={key}
                  className={`nav-link ${section === key ? "active" : ""}`}
                  href={`/workspaces/${w}/${key}`}
                >
                  <span className="nav-dot" />
                  {label}
                </Link>
              ))}
          </nav>
        </div>
        <div className="sidebar-foot">
          <p>Clear work. Confident handovers.</p>
          <p style={{ marginTop: 8 }}>V1 · Pilot workspace</p>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <select
            id="workspace-switcher"
            className="workspace-select"
            aria-label="Switch client workspace"
            value={w}
            onChange={(e) => {
              if (mayLeave())
                router.push(e.target.value ? `/workspaces/${e.target.value}/today` : "/dashboard");
            }}
          >
            <option value="">All client workspaces</option>
            {workspaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.archived_at ? " (archived)" : ""}
              </option>
            ))}
          </select>
          <div className="row">
            <span className="hide-mobile muted" style={{ fontSize: 12 }}>
              {profile.display_name}
            </span>
            <span className="avatar" aria-hidden="true">
              {profile.display_name.slice(0, 2).toUpperCase()}
            </span>
            <button
              id="sign-out"
              className="btn small"
              disabled={signingOut}
              onClick={async () => {
                if (!mayLeave()) return;
                setSigningOut(true);
                setSignOutError("");
                try {
                  const { error } = await browserSupabase().auth.signOut();
                  if (error) throw error;
                  router.replace("/login");
                  router.refresh();
                } catch (error) {
                  setSignOutError(
                    error instanceof Error ? error.message : "Unable to sign out. Retry.",
                  );
                  setSigningOut(false);
                }
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        {w && (
          <div className="mobile-navigation">
            <select
              id="mobile-navigation"
              aria-label="Workspace page"
              value={section === "runs" ? "tasks" : section}
              onChange={(e) => {
                if (mayLeave()) router.push(`/workspaces/${w}/${e.target.value}`);
              }}
            >
              {SECTIONS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
        <main id="main-content" className="content">
          {signOutError && (
            <div className="notice error" role="alert">
              {signOutError}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
