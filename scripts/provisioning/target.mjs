/** Optional immutable private setup contract. Call before any remote discovery or RPC. */
export function assertFixedTarget(
  config,
  manifest,
  env = process.env,
  expected = config.fixedTarget,
) {
  if (!expected && !manifest.fixedTarget) return;
  const fields = ["workspaceId", "maryUserId", "setupKey"];
  for (const field of fields) {
    const actual = field === "setupKey" ? manifest.setupKey : config[field];
    if (
      !expected?.[field] ||
      actual !== expected[field] ||
      config.fixedTarget?.[field] !== expected[field] ||
      manifest.fixedTarget?.[field] !== expected[field]
    )
      throw new Error(`Fixed target mismatch: ${field}; no writes permitted.`);
  }
  for (const field of ["WORKSPACE_ID", "SETUP_WORKSPACE_ID"])
    if (env[field] && env[field] !== expected.workspaceId)
      throw new Error("Conflicting environment workspace; no writes permitted.");
}
