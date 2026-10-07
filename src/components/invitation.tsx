"use client";
import { useRouter } from "next/navigation";
import { useCommand } from "@/lib/client-api";
import { Notice } from "./ui";
export function Invitation({ token }: { token: string }) {
  const router = useRouter();
  const { execute, busy, error } = useCommand(null);
  return (
    <section className="panel pad stack">
      <h1>Join your client workspace</h1>
      <p>
        Accept this invitation using the verified email address your client invited. The invitation
        expires after seven days.
      </p>
      {error && <Notice error>{error}</Notice>}
      <button
        id="accept-invitation"
        className="btn primary"
        disabled={busy}
        onClick={async () => {
          try {
            const result = await execute("accept_invitation", { token });
            router.push(`/workspaces/${result.id}/today`);
            router.refresh();
          } catch {
            /* Displayed above. */
          }
        }}
      >
        {busy ? "Joining…" : "Accept invitation"}
      </button>
    </section>
  );
}
