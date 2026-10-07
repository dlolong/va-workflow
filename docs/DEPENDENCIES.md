# Dependency policy

The source pins Next.js/React/Supabase JS and the browser test runner in `package.json`, with compatible ranges for supporting tools. Node 22.16+ is required. The generated environment had no registry connectivity, so there is no fabricated lockfile and no claim that dependency installation/build completed.

In a connected environment, inspect `package.json`, run `npm install`, review the actual resolved dependency graph and compatibility with installed documentation, run the full checks, then commit the genuine lockfile. Thereafter use `npm ci`. Do not conceal a dependency conflict with force/legacy resolution or silently migrate to a different framework.

TypeScript syntax was inspected using a preinstalled compiler during generation. That does not resolve project dependencies or typecheck calls against the real Next/Supabase/React declarations. `npm run typecheck`, lint and the production build remain mandatory.
