"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { APP, SECTIONS } from "@/lib/config";
import type { Workspace, Profile } from "@/lib/types";
import { browserSupabase } from "@/lib/supabase/browser";
const navigationGroups = [
  { title: "Daily work", keys: ["today", "tasks", "reviews", "deadlines"] },
  { title: "Processes & people", keys: ["processes", "training", "team"] },
  { title: "Workspace insights", keys: ["reports", "notifications", "activity", "settings"] },
];
export function Shell({
  workspaces,
  profile,
  email,
  children,
}: {
  workspaces: Workspace[];
  profile: Profile;
  email?: string;
  children: React.ReactNode;
}) {
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const section = parts[3] === "runs" ? "tasks" : parts[3] || "today";
  useEffect(() => {
    const media = window.matchMedia("(min-width: 721px)");
    const closeOnDesktop = () => {
      if (media.matches) menuRef.current?.close();
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);
  const navigation = (mobile = false) => (
    <nav aria-label={mobile ? "Mobile main navigation" : "Main navigation"}>
      <Link
        id={mobile ? "mobile-nav-workspaces" : "nav-workspaces"}
        className={`nav-link ${path === "/dashboard" ? "active" : ""}`}
        href="/dashboard"
        aria-current={path === "/dashboard" ? "page" : undefined}
        onNavigate={() => {
          if (mobile) menuRef.current?.close();
        }}
      >
        <span className="nav-dot" />
        Client workspaces
      </Link>
      {w &&
        navigationGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <p className="eyebrow nav-group-title">{group.title}</p>
            {group.keys.map((key) => (
              <Link
                id={`${mobile ? "mobile-nav" : "nav"}-${key}`}
                key={key}
                className={`nav-link ${section === key ? "active" : ""}`}
                href={`/workspaces/${w}/${key}`}
                aria-current={section === key ? "page" : undefined}
                onNavigate={() => {
                  if (mobile) menuRef.current?.close();
                }}
              >
                <span className="nav-dot" />
                {SECTIONS.find(([id]) => id === key)?.[1]}
              </Link>
            ))}
          </div>
        ))}
      <Link
        id={mobile ? "mobile-nav-tutorial" : "nav-tutorial"}
        className={`nav-link ${path === "/tutorial" ? "active" : ""}`}
        href="/tutorial"
        aria-current={path === "/tutorial" ? "page" : undefined}
        onNavigate={() => {
          if (mobile) menuRef.current?.close();
        }}
      >
        <span className="nav-dot" />
        Tutorial
      </Link>
    </nav>
  );
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">✓</span>
          {APP.name}
        </Link>
        {navigation()}
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
          <div className="row header-account">
            <span className="header-identity muted">
              <span className="hide-mobile" style={{ fontSize: 12 }}>
                {profile.display_name}
              </span>
              {email && (
                <span id="header-user-email" className="header-email" title={email}>
                  {email}
                </span>
              )}
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
                  window.location.assign(new URL("/login", window.location.origin));
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
            <button
              id="main-menu-toggle"
              ref={menuButtonRef}
              className="btn menu-toggle"
              aria-label="Open main menu"
              aria-controls="mobile-navigation"
              aria-expanded={menuOpen}
              onClick={() => {
                menuRef.current?.showModal();
                setMenuOpen(true);
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>
        <dialog
          id="mobile-navigation"
          className="mobile-menu"
          ref={menuRef}
          aria-labelledby="mobile-menu-title"
          onClose={() => {
            setMenuOpen(false);
            menuButtonRef.current?.focus();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) menuRef.current?.close();
          }}
        >
          <div className="dialog-title">
            <h2 id="mobile-menu-title">Main menu</h2>
            <button
              className="btn small"
              onClick={() => menuRef.current?.close()}
              aria-label="Close menu"
            >
              Close
            </button>
          </div>
          <div className="mobile-menu-body">{navigation(true)}</div>
        </dialog>
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
