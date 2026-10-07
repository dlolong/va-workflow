/** Run a command with an isolated local Supabase config; never overwrite .env.local. */
import { execFileSync, spawn } from "node:child_process";
const args = process.argv.slice(2);
if (!args.length) throw new Error("Usage: node scripts/local-qa.mjs <command> [args...]");
const workdir = process.env.QA_SUPABASE_WORKDIR || process.cwd();
const status = JSON.parse(
  execFileSync("npx", ["--no-install", "supabase", "status", "--workdir", workdir, "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
for (const value of [status.API_URL, status.DB_URL])
  if (!value || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(value).hostname))
    throw new Error("QA requires local API and database URLs.");
const appUrl = process.env.QA_APP_URL || "http://localhost:3107";
if (!["localhost", "127.0.0.1"].includes(new URL(appUrl).hostname))
  throw new Error("QA app must be local.");
const env = {
  ...process.env,
  QA_DISPOSABLE: "va-relay",
  NEXT_DIST_DIR: ".next-qa",
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
  TEST_DATABASE_URL: status.DB_URL,
  NEXT_PUBLIC_APP_URL: appUrl,
  E2E_BASE_URL: appUrl,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  RESEND_API_KEY: "",
  EMAIL_FROM: "",
  CRON_SECRET: "",
};
const child = spawn(args[0], args.slice(1), { env, stdio: ["inherit", "pipe", "pipe"] });
// Next dev logs request URLs. Do not persist invitation or auth-link secrets.
const redact = (text) =>
  text
    .replace(/(\/invite\/)[a-f0-9]{64}/g, "$1[redacted]")
    .replace(/([?&](?:token_hash|code|token)=)[^\s&]+/g, "$1[redacted]");
for (const stream of [child.stdout, child.stderr]) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\n")) >= 0) {
      process.stdout.write(redact(buffer.slice(0, end + 1)));
      buffer = buffer.slice(end + 1);
    }
  });
  stream.on("end", () => {
    if (buffer) process.stdout.write(redact(buffer));
  });
}
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("close", (code) => {
  process.exitCode = code ?? 1;
});
