"use client";
import { useCallback, useRef, useState } from "react";
import type { CommandResult } from "./types";
import { sendCommand } from "./command-request.mjs";
export { sendCommand };
/** Failed requests keep their ID: retrying the same payload is transactionally idempotent. */
export function useCommand(workspaceId: string | null) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const attempts = useRef(new Map<string, string>());
  const execute = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      if (inFlight.current) throw new Error("Another save is still running.");
      inFlight.current = true;
      setBusy(true);
      setError("");
      const signature = JSON.stringify([workspaceId, action, payload]);
      const requestId = attempts.current.get(signature) || crypto.randomUUID();
      attempts.current.set(signature, requestId);
      try {
        const data = await sendCommand(workspaceId, action, { ...payload, request_id: requestId });
        attempts.current.delete(signature);
        return data as CommandResult;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unable to save.";
        setError(message);
        throw e;
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [workspaceId],
  );
  return { execute, busy, error, clearError: () => setError("") };
}
