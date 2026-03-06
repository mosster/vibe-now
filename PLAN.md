# Vibe Now — v2 Plan

## Overview

Four new features: framework choice (Next.js vs TanStack Start), AI editor context (CLAUDE.md vs AGENTS.md), database provider selection (Supabase vs Convex), and auto-generated `.env.example` files.

## Implementation Status

- [x] **Feature 1: Framework Selection** — Next.js vs TanStack Start
- [x] **Feature 2: Claude Code Repo** — CLAUDE.md vs AGENTS.md
- [x] **Feature 3: Database Provider** — Supabase+Drizzle vs Convex (Cloud/Self-hosted)
- [x] **Feature 4: .env.example Generation** — Auto-generated from selected packages
- [x] **Feature 5: Testing Frameworks** — Vitest + React Testing Library, Playwright, or both

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
- Vitest on TanStack Start does NOT need those extras (already Vite-based)
- Playwright installs Chromium only by default (`--with-deps chromium`) to keep install fast
- Async Server Components cannot be unit tested with Vitest — E2E only

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
