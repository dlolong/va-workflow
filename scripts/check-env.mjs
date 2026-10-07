import "./load-env.mjs";
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];
let failed = false;
for (const name of required) {
  const exists = Boolean(process.env[name]?.trim());
  console.log(`${exists ? "OK" : "MISSING"} ${name}`);
  if (!exists) failed = true;
}
for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_APP_URL"]) {
  if (process.env[name])
    try {
      const u = new URL(process.env[name]);
      if (!["http:", "https:"].includes(u.protocol)) throw new Error();
    } catch {
      console.log(`INVALID URL: ${name}`);
      failed = true;
    }
}
if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_secret_")) {
  console.error("A secret key must never be placed in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  failed = true;
}
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
if (key.split(".").length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
    if (payload.role === "service_role") {
      console.error(
        "Service-role JWT found in a public variable. Rotate it and fix configuration.",
      );
      failed = true;
    }
  } catch {
    /* Other key formats are allowed. */
  }
}
const worker = Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.CRON_SECRET &&
  process.env.CRON_SECRET.length >= 32,
);
console.log(
  worker
    ? "OK automation secrets configured"
    : "OPTIONAL automation disabled/incomplete: add SUPABASE_SERVICE_ROLE_KEY and a 32+ character CRON_SECRET",
);
console.log(
  process.env.RESEND_API_KEY && process.env.EMAIL_FROM
    ? "OK notification email configuration present"
    : "OPTIONAL notification emails remain in-app/outbox until RESEND_API_KEY and EMAIL_FROM are configured",
);
console.log("This checks configuration shape only, not connectivity or credentials.");
process.exitCode = failed ? 1 : 0;
