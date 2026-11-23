# Vibe Now — v2 Plan

## Overview

Four new features: framework choice (Next.js vs TanStack Start), AI editor context (CLAUDE.md vs AGENTS.md), database provider selection (Supabase vs Convex), and auto-generated `.env.example` files.

## Implementation Status

- [x] **Feature 1: Framework Selection** — Next.js vs TanStack Start
- [x] **Feature 2: Claude Code Repo** — CLAUDE.md vs AGENTS.md
- [x] **Feature 3: Database Provider** — Supabase+Drizzle vs Convex (Cloud/Self-hosted)
- [x] **Feature 4: .env.example Generation** — Auto-generated from selected packages
- [x] **Feature 5: Testing Frameworks** — Vitest + React Testing Library, Playwright, or both
- [x] **Feature 6: SQLite Databases** — Turso or self-hosted libSQL, both with Drizzle
- [x] **Feature 7: API Layer** — oRPC (with OpenAPI spec + docs) or tRPC
- [x] **Feature 8: Plain Postgres** — Postgres + Drizzle via node-postgres, without Supabase
- [x] **Feature 9: Effect** — Effect (effect-ts v4) with starter service + runtime
- [x] **Feature 10: Package Managers** — npm, pnpm, Yarn or Bun for the whole scaffold and the generated docs
- [x] **Feature 11: Phased Development Workflow** — light or gated: Workflow section, docs/ skeleton, check script, review + handoff skills
- [x] **Feature 12: MCP server** — `/api/mcp`, tools from the oRPC router (or a hand-written registry)
- [x] **Feature 13: Background Jobs** — pg-boss, Inngest or Trigger.dev
- [x] **Feature 14: Analytics & Monitoring** — PostHog and/or Sentry
- [x] **Feature 15: File Uploads** — UploadThing or Cloudflare R2

---

## Feature 1: Framework Selection (Next.js vs TanStack Start) — DONE

**Prompt**: List choice, asked after project name.

**Files changed:**
- `plopfile.js` — New `framework` list prompt, conditional scaffold command (`create-next-app` vs `@tanstack/cli create`), `when` callbacks on confirm prompts to filter by framework, `devInstallNextjs` merging for ESLint, `isNextjs`/`isTanStack` template flags
- `lib/packages.js` — Added `frameworks` field to `next-themes` (nextjs-only), `nuqs` (nextjs-only); added new `tanstack-theme-kit` package (tanstack-only); moved `eslint-config-next` into `devInstallNextjs` field
- `templates/AGENTS.md.hbs` — Conditional architecture overview, directory structure (App Router vs TanStack routes), coding rules, state/data patterns, SEO guidance
- `templates/CLAUDE.md.hbs` — Same conditional sections
- `templates/README.md.hbs` — Conditional core framework listing

### Package compatibility matrix

| Package | Next.js | TanStack Start | Notes |
|---|---|---|---|
| zustand | Yes | Yes | Framework-agnostic |
| zod | Yes | Yes | Framework-agnostic |
| @tanstack/react-query | Yes | Yes | First-party TanStack |
| shadcn/ui | Yes | Yes | Official support both |
| next-themes | Yes | **No** | Use `tanstack-theme-kit` instead |
| better-auth | Yes | Yes | Framework-agnostic |
| resend | Yes | Yes | Server-side only |
| stripe / polar | Yes | Yes | Server-side SDKs |
| ai (Vercel AI SDK) | Yes | Yes | Core works; Next.js streaming helpers don't apply |
| nuqs | Yes | **No** | TanStack Router has built-in `useSearch` |
| react-hook-form | Yes | Yes | Framework-agnostic |
| eslint-config-next | Yes | **No** | Next.js-specific; omitted for TanStack |
| biome | Yes | Yes | Framework-agnostic |

### TanStack CLI reference
```bash
npx @tanstack/cli create my-app -y --tailwind   # Non-interactive with Tailwind
npx @tanstack/cli create --list-add-ons          # List available add-ons
npx @tanstack/cli create my-app --add-ons shadcn # With add-ons
```

---

## Feature 2: Claude Code Repo (AGENTS.md → CLAUDE.md) — DONE

**Prompt**: Confirm after framework selection, defaults to yes.

**Files changed:**
- `plopfile.js` — New `isClaudeCode` confirm prompt, conditional rendering of CLAUDE.md vs AGENTS.md
- `templates/CLAUDE.md.hbs` — New concise template (~50 lines) following Anthropic conventions: tech stack, commands, directory structure, code conventions, per-library guidance. Omits verbose "AI Coding Rules" section that AGENTS.md has.

### CLAUDE.md conventions
- Under 200 lines, shorter is better
- Structure: WHAT (tech/stack) → WHY (purpose) → HOW (commands/workflow)
- Put detailed docs in separate files (progressive disclosure)

---

## Feature 3: Database Provider (Supabase vs Convex) — DONE

**Prompt**: List choice replacing the old individual Supabase/Drizzle confirms.

**Files changed:**
- `lib/packages.js` — Refactored `Database & ORM` from confirm-based (`items`) to list-based (`type: 'list'`) with `providerConfig` for Supabase+Drizzle, Convex Cloud, Convex Self-hosted. Added `envVars` to all three.
- `plopfile.js` — Added `isSupabase`/`isConvex` booleans to templateData
- `templates/AGENTS.md.hbs` — Conditional `db/` vs `convex/` directory structure, conditional security warnings
- `templates/CLAUDE.md.hbs` — Same conditional updates

### Key technical notes
- Convex Cloud and Self-hosted use the same `convex` npm package
- Self-hosted requires Docker + `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` env vars
- Convex replaces Drizzle entirely (own schema system in `convex/schema.ts`)
- Better Auth has an official Convex adapter (`@convex-dev/better-auth`)

---

## Feature 4: .env.example Generation — DONE

**No prompt** — auto-generated when any selected package has env vars.

**Files changed:**
- `lib/packages.js` — Added `envVars` arrays to: Supabase (4 vars), Convex Cloud (1), Convex Self-hosted (2), Better Auth (2), Resend (1), Stripe (3), Polar (2), AI SDK (1), OpenRouter (1)
- `templates/env.example.hbs` — New template rendering vars grouped by package with comments
- `plopfile.js` — Conditional `.env.example` generation, success message includes env note

---

## Feature 5: Testing Frameworks — DONE

**Prompt**: List choice with 4 options: None, Vitest + RTL, Playwright, Both.

**Files changed:**
- `lib/packages.js` — New `testing` list group with `providerConfig` for vitest, playwright, both. Framework-specific `devInstallNextjs` for `@vitejs/plugin-react` and `vite-tsconfig-paths`. Playwright has `commands` for browser install.
- `plopfile.js` — Added `isVitest`/`isPlaywright` booleans to templateData
- `templates/CLAUDE.md.hbs` — Conditional test commands and `e2e/` directory
- `templates/AGENTS.md.hbs` — Conditional `e2e/` directory
- `tests/validate-config.js` — 14 new assertions for testing group

### Key technical notes
- Vitest on Next.js needs `@vitejs/plugin-react` and `vite-tsconfig-paths` (not Vite-native)
- Vitest on TanStack Start: those extras are now installed for both frameworks, because the generated standalone `vitest.config.ts` imports them (it doesn't reuse TanStack's `vite.config.ts` plugins)
- Vitest is now fully scaffolded: `vitest.config.ts` (jsdom, excludes `e2e/` when Playwright is also chosen), `vitest.setup.ts` (jest-dom matchers + cleanup), an example test in `[src/]__tests__/`, and `test` / `test:watch` npm scripts. Templates live in `templates/vitest/`
- Playwright installs Chromium only by default (`--with-deps chromium`) to keep install fast
- Async Server Components cannot be unit tested with Vitest — E2E only

---

## Feature 7: API Layer (oRPC vs tRPC) — DONE

**Prompt**: List choice after Database: None (Server Actions / server functions), oRPC, tRPC. Skipped when Convex is selected (Convex has its own typed query/mutation layer).

**Files changed**:
- `lib/packages.js` — New `apiLayer` list group with a `when` condition; `installWithReactQuery` adds `@orpc/tanstack-query` / `@trpc/tanstack-react-query` only when React Query is selected
- `lib/scaffolds.js` — Maps selections to starter files (API layer + Vitest), per framework
- `plopfile.js` — List groups support `when`; installs are de-duplicated; one generic step renders scaffold templates (never overwrites existing files)
- `templates/api/orpc/`, `templates/api/trpc/` — Router, handlers, typed client, route handlers (Next.js) / server routes (TanStack Start)
- `templates/CLAUDE.md.hbs`, `templates/AGENTS.md.hbs` — `server/orpc/` or `server/trpc/` in the directory tree

**Endpoints**:
- oRPC: typed RPC at `/api/rpc`, REST at `/api/v1`, OpenAPI spec at `/api/v1/spec.json`, API docs (Scalar) at `/api/v1`
- tRPC: `/api/trpc` (superjson transformer)

**Key research findings**:
- TanStack Start server routes: `createFileRoute(path)({ server: { handlers: { ANY | GET | POST } } })`
- The `server` option type only exists once `routeTree.gen.ts` carries Start's `Register` augmentation. The Vite plugin writes it on `npm run dev`/build; `tsr generate` does NOT, so the wizard doesn't run it
- tRPC v11's TanStack Query integration needs a `QueryClient`, so the scaffold uses `createTRPCContext` (provider + `useTRPC`); oRPC's `createTanstackQueryUtils(client)` needs no provider
- Zod 4 schemas are converted for OpenAPI via `@orpc/zod/zod4`'s `ZodToJsonSchemaConverter`
- Verified in real Next.js 16 and TanStack Start apps: typecheck, production build, REST/RPC/spec/docs/tRPC endpoints, and both typed clients against a running server

---

## Feature 8: Plain Postgres + Drizzle — DONE

**Prompt**: New `postgres` choice in the Database list, after Supabase. Default stays Supabase.

**Files changed**:
- `lib/packages.js` — `postgres` provider: installs `drizzle-orm` + `pg`, dev-installs `drizzle-kit` + `@types/pg`; one env var (`DATABASE_URL`); no Supabase packages
- `plopfile.js` — `isPostgres` template flag; `postgres` added to `isDrizzle`
- `templates/CLAUDE.md.hbs`, `templates/AGENTS.md.hbs` — `db/index.ts` (node-postgres pool + Drizzle) in the tree; `DATABASE_URL` secret warning
- `tests/validate-config.js` — provider config, env var, rendering (both frameworks) and API-layer checks

**Key notes**:
- Driver is node-postgres (`drizzle-orm/node-postgres`), so it works with any Postgres host: local Docker, Neon, Railway, RDS
- Like the other database choices, it adds packages, guidance and env vars. It does not generate `db/` files
- The API layer step is still asked (only Convex skips it)

---

## Feature 9: Effect (effect-ts v4) — DONE

**Prompt**: Confirm in a new "Effect System" category, after Validation. Off by default.

**Files changed**:
- `lib/packages.js` — `effect` item: installs only `effect` (v4 ships http, rpc, sql, schema, cli inside the main package)
- `lib/scaffolds.js` + `templates/effect/` — `[src/]lib/effect/greeter.ts` (example service with a typed error) and `[src/]lib/effect/runtime.ts` (`AppLayer`, `ManagedRuntime`, `runEffect()` helper)
- `templates/CLAUDE.md.hbs`, `templates/AGENTS.md.hbs` — `lib/effect/` in the tree (`isEffect` flag)

**Key notes**:
- Targets Effect 4.x (LTS). v3-only names (`Context.Tag`, `Effect.Service`, `Effect.catchAll`, `@effect/schema`) are wrong in v4; the guidance says so
- `runEffect()` turns typed failures into `{ ok: false, error: _tag }` so Server Actions / server functions return plain data; defects still reject
- The usage comment differs per framework (Server Action vs `createServerFn(...).validator(...)`)
- Needs TypeScript 5.9+ with `strict: true`. Starter files verified with TS 5.9.3 and 7.0.2

---

## Feature 10: Package Managers — DONE

**Prompt**: List after Framework: npm, pnpm, Yarn, Bun. Defaults to the package manager in `npm_config_user_agent` (the one that launched the wizard) if installed, else npm. Package managers not on PATH are disabled.

**Files changed**:
- `lib/package-managers.js` — New. Holds every package manager difference: add/dev-add, one-off runs (`dlx`), local binaries (`exec`), script prefix (`run`), the `create-next-app` flag, and npm-only `--legacy-peer-deps`
- `lib/packages.js` — Commands are `{ dlx }` / `{ exec }`; guidance and env comments use `{pm:run}` / `{pm:exec}` / `{pm:dlx}` tokens
- `plopfile.js` — Base app via the package manager's dlx with `--use-<pm>` (Next.js) or `--package-manager <pm>` (TanStack CLI); installs and init commands through the module; next-steps message uses the chosen package manager
- `templates/CLAUDE.md.hbs`, `templates/AGENTS.md.hbs`, `templates/README.md.hbs`, `templates/vitest/vitest.config.ts.hbs` — Commands come from `pm` (AGENTS.md gained a Commands section)

**Key notes**:
- Bun: scripts use `bun run <script>`, because `bun test` runs Bun's own test runner instead of the `test` script
- Yarn 1 has no `yarn dlx`, so one-off packages fall back to `npx` there; Yarn 2+ uses `yarn dlx`
- `--legacy-peer-deps` is npm-only; pnpm, Yarn and Bun only warn on peer conflicts

---

## Feature 11: Phased Development Workflow — DONE

**Prompt**: List after the CLAUDE.md / AGENTS.md question: Phased light (default), Phased gated, None.

**Source**: the workflow shared by the founder's apps. seo-auditor is the origin; Ketty (form-builder) copied it (gated); Maestro and social-listening are the light versions. Everything product-specific was left out.

**Files changed**:
- `lib/workflow.js` — New. The workflows, the review skills and when each runs per rigor, the file map, `workflowData()`, and `gateScripts()` (`typecheck`: `next typegen && tsc --noEmit` on Next.js, `tsc --noEmit` on TanStack; `check`: typecheck, then lint and test when present; never replaces existing scripts)
- `lib/template-data.js` — New. `buildTemplateData()`: the one data object every generated file renders with (moved out of the plopfile so tests render exactly what the CLI does); renders the Workflow and conventions sections once
- `lib/scaffolds.js` — Adds the workflow files
- `plopfile.js` — `workflow` prompt; template data built before the scaffold step; gate scripts written to package.json
- `templates/workflow/WORKFLOW.md.hbs`, `CONVENTIONS.md.hbs` — The Workflow section (docs layout, spikes, the phase loop at the chosen rigor, sizing, no dates, handoffs, ADRs, git and parallel sessions, the skills table) and the shared conventions (one definition per concept, one place per setting, one service layer, Zod at boundaries, invariant tests, American English)
- `templates/workflow/docs/` — Master checklist, spec / spike / ADR templates, ADR 0001 (the workflow, recording light vs gated) and ADR 0002 (the starting stack, from the wizard's answers), production-readiness log, and README indexes for research, spikes, decisions, reviews, guides, handoffs
- `templates/workflow/skills/` — `handoff`, `backend-review`, `security-review`, `frontend-review`, `docs-review` (Claude Code projects only). Generic versions of the founder's skills: an independent fresh-context reviewer who must reproduce every finding, then verify, fix, record and codify. Checklist lines appear only for the parts the stack has (Drizzle, Convex, Supabase, oRPC/tRPC, Better Auth, Effect, AI, payments, shadcn)
- `templates/CLAUDE.md.hbs`, `templates/AGENTS.md.hbs` — Start here + Status at the top, typecheck/check commands, docs/ (and .claude/skills/) in the tree, the Workflow section, the conventions

**Key notes**:
- Skill frontmatter descriptions avoid `: ` (an unquoted YAML scalar can't contain it); a test holds that
- Dates are local (`localDate()`), not UTC
- The 14-day / exact-pin version rule from the source apps was deliberately left out (the founder's call)

**Fixes found by running the real wizard** (`lib/project-fixes.js`):
- create-next-app writes AGENTS.md with Next.js rules that `next dev` maintains: CLAUDE.md imports it (`@AGENTS.md`); a generated AGENTS.md keeps the block on top
- shadcn's generated `components/ui/**` and `hooks/use-mobile.ts` fail eslint-config-next's react-hooks rules: added to `globalIgnores` (kept close to upstream, not edited)
- shadcn on TanStack Start: `init -d` means `--template=next`, so it fell back to prompts and a Next.js-shaped setup, then crashed. TanStack now runs `init -t start -b base -p nova --no-monorepo -y`, and `@/*` is moved ahead of the CLI's `#/*` tsconfig alias (with `#/*` first, shadcn can't detect the alias). Commands can carry `frameworks: [...]`
- Typecheck on a fresh TanStack project: the route tree doesn't exist yet, so `typecheck` runs `generate-routes` first

---

## Features 12–15: MCP, Background Jobs, Analytics & Monitoring, File Uploads — DONE

Each was researched and verified in real Next.js 16 and TanStack Start 1.169 apps before it was added (typecheck, production build, and a runtime check per provider).

**Shared mechanics** (`lib/selection.js`): `selectPackages()` resolves a selection for the CLI and the tests alike; configs may declare `installByFramework` / `devInstallByFramework`, `envVarsByFramework` (`NEXT_PUBLIC_*` vs `VITE_*`) and `guidance` as a function of the answers; a list choice may declare `requires(answers)`, which shows it disabled with the reason (`listChoices()`); commands may carry `frameworks: [...]`. `getScaffoldScripts()` adds the package.json scripts an option needs, never replacing existing ones. Config-file edits live in `lib/project-fixes.js`, applied through `editFile()`; when an anchor is missing the wizard prints the manual step.

**MCP** (`templates/mcp/`): `@modelcontextprotocol/server` 2.x (the stable v2 line), `createMcpHandler(...).fetch(request)`, stateless. With oRPC, `orpc-tools.ts` walks the router (`resolveContractProcedures`), converts each procedure's Zod input/output with the same converter as the OpenAPI spec, infers read-only/idempotent hints from the HTTP method, and calls through `createRouterClient` with a passthrough schema so oRPC validates exactly once (oRPC's own `@orpc/mcp` is beta and needs oRPC 2). Without oRPC (or with tRPC): one `registerTool` example. `MCP_API_KEY` → bearer auth; unset → localhost only (host/origin checks).

**Background Jobs** (`templates/jobs/`): pg-boss v12 (only `server/jobs/index.ts` imports it; `defineJob` + registry + Zod-validated `enqueue`; queues created before use; separate `worker.ts` with graceful SIGTERM; `@opentelemetry/api` listed because it's a required peer npm's `--legacy-peer-deps` won't add); requires Postgres or Supabase. Inngest v4 (`inngest/next`, or `inngest/edge` on TanStack: there's no TanStack adapter; `INNGEST_DEV=1` locally or the endpoint answers 500). Trigger.dev v4 (`schemaTask`, `tasks.trigger` with `import type`, `.trigger` git-ignored).

**Analytics & Monitoring** (`templates/analytics/`): one shared browser entry (`instrumentation-client.ts` on Next.js, `src/client.tsx` on TanStack). PostHog: `posthog-js` (+ `@posthog/react` on TanStack) and a `posthog-node` server helper; Next.js gets an `/ingest` reverse proxy in `next.config.ts` (only when it can be added safely). Sentry: `@sentry/nextjs` (instrumentation, server/edge configs, `global-error.tsx`, `withSentryConfig` from `@sentry/nextjs/config`) or `@sentry/tanstackstart-react` (beta: custom server/start entries, the Vite plugin, `.env.sentry-build-plugin` git-ignored). Build-plugin telemetry is off. Both SDKs do nothing without keys.

**File Uploads** (`templates/uploads/`): UploadThing 7 (file router with an auth hook in `.middleware()`, typed client helpers, Tailwind v4 `ut-*` variants via `@import "uploadthing/tw/v4"` + `@source`). It's disabled next to Effect v4: UploadThing bundles Effect 3, and npm's `--legacy-peer-deps` (or Yarn 1/Bun hoisting) resolves it against v4, breaking the build or every request. R2: `server/storage.ts` owns the AWS SDK client (`region: 'auto'`, `requestChecksumCalculation: 'WHEN_REQUIRED'`, since the default checksum breaks presigned PUTs), presigned PUTs sign `Content-Type` and `Content-Length`, keys are generated on the server; verified end to end against MinIO.

---

## Other fixes applied
- Fixed old "quick-vibe" footer in `templates/README.md.hbs` → "vibe-now"
- Renamed generator from `next-app` to `vibe-app`

---

## Project Structure (current)
```
vibe-cli/
├── lib/
│   └── packages.js          # Package configuration with frameworks, envVars
├── templates/
│   ├── README.md.hbs         # Framework-aware README template
│   ├── AGENTS.md.hbs         # Full AI agent guidance (Cursor, Copilot, etc.)
│   ├── CLAUDE.md.hbs         # Concise Claude Code memory file
│   └── env.example.hbs       # .env.example grouped by package
├── index.js                   # CLI entry point (Plop bootstrap)
├── plopfile.js                # Prompts, actions, scaffold orchestration
├── package.json
├── PLAN.md
└── README.md
```

---

## Testing TODO

- [ ] Run `npx @tanstack/cli create test-app -y --tailwind` to verify non-interactive mode works
- [ ] Run `npx convex dev` first-run to check if interactive input is needed
- [ ] Run full wizard with Next.js + Supabase + Claude Code selection
- [ ] Run full wizard with TanStack Start + Convex Cloud + AGENTS.md selection
- [ ] Verify `.env.example` generates correctly with multiple packages
- [ ] Verify framework-filtered prompts (next-themes hidden for TanStack, nuqs hidden for TanStack, tanstack-theme-kit hidden for Next.js)
- [ ] Decide: should TanStack Start projects use `--add-ons` flags instead of manual npm install?

---

## Future Enhancements (Post v2)

### High-value
- **Analytics**: PostHog, Vercel Analytics, or Plausible
- **File/Image uploads**: UploadThing or Cloudinary
- **Caching/Rate limiting**: Upstash Redis

### Nice-to-haves
- **Monitoring/Error tracking**: Sentry
- **Background jobs**: Inngest or Trigger.dev
- **Type-safe API layer**: tRPC (natural fit with TanStack Start)
- **Icons**: `lucide-react` (already referenced in AGENTS.md guidance but not installed)

### Infra/DX
- **Docker**: Generate Dockerfile + docker-compose.yml
- **CI/CD**: GitHub Actions workflow template (lint, test, build)
- **Deployment target**: Vercel, Netlify, Railway, Fly.io config files

### Framework-aware env vars
- Use `VITE_` prefix instead of `NEXT_PUBLIC_` for TanStack Start client-exposed vars (Supabase URL, Stripe publishable key)
