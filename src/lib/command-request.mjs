/** A successful HTTP status alone is never proof that a command saved. */
export async function sendCommand(workspaceId, action, payload) {
  const response = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace_id: workspaceId, action, payload }),
    credentials: "same-origin",
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("The server response was interrupted. Retry the same operation.");
  }
  const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (!response.ok || !record(body) || !record(body.data)) {
    throw new Error(
      record(body) && typeof body.error === "string"
        ? body.error
        : "Your save was not confirmed. Retry the same operation.",
    );
  }
  return body.data;
}
