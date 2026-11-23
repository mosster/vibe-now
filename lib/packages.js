/**
 * Configuration for all optional packages and their install/init commands.
 * Grouped by category for better UX.
 */
export const PACKAGE_GROUPS = [
  {
    category: 'State Management',
    items: [
      {
        id: 'zustand',
        name: 'Zustand',
        install: ['zustand'],
        default: true,
        guidance: 'Use a single store per feature. Prefer selective state extraction (e.g., `useStore(state => state.value)`) to minimize re-renders.',
      },
    ],
  },
  {
    category: 'Validation',
    items: [
      {
        id: 'zod',
        name: 'Zod',
        install: ['zod'],
        default: true,
        guidance: 'Use for all schema definitions and runtime validation (especially for Environment Variables and API responses). Keep schemas and types co-located.',
      },
    ],
  },
  {
    category: 'Effect System',
    items: [
      {
        id: 'effect',
        name: 'Effect (effect-ts v4)',
        // v4 ships http, rpc, sql, schema, etc. inside `effect` itself; no @effect/* packages needed for the basics
        install: ['effect'],
        default: false,
        guidance: 'Effect v4 (APIs differ from v3; do not use v3-only names like `Effect.catchAll`, `Context.Tag`, `Effect.Service` or `@effect/schema`). Before writing Effect code, read Effect\'s own guide for agents in `node_modules/effect/CLAUDE.md` (or `AGENTS.md`), not Effect 3 material. Starter files: `lib/effect/greeter.ts` (example service) and `lib/effect/runtime.ts` (under `src/` for TanStack Start). Write business logic as `Effect.gen` / `Effect.fn("name")` functions. Model expected failures as typed errors with `Schema.TaggedError` and handle them with `Effect.catchTag`/`catchTags` (`Effect.catch` catches all typed errors). Define dependencies as `class X extends Context.Service<X, Shape>()("app/X") {}` with a `static layer` (`Layer.succeed` / `Layer.effect`) and access them via `yield* X` or `X.use(...)`. Register every layer in `AppLayer` in `runtime.ts`; run effects only at the boundary (Server Actions, route handlers, server functions) with `runEffect()` or `runtime.runPromise()`, never `Effect.runPromise` with ad-hoc `provide` calls. Never call Effect runtimes in client components. Use `Schema.decodeUnknownEffect` inside effects; keep Zod for forms and any oRPC/tRPC inputs. Advanced modules live under `effect/*` (e.g. `effect/http`, `effect/sql`, `effect/rpc`). Requires TypeScript 5.9+ with `strict: true`.',
      },
    ],
  },
  {
    category: 'Data Fetching',
    items: [
      {
        id: 'reactQuery',
        name: 'TanStack React Query',
        install: ['@tanstack/react-query'],
        default: true,
        guidance: 'Centralize query keys in a `keys.ts` file. Prefer Server Actions for mutations and use `queryClient.invalidateQueries()` for cache invalidation.',
      },
    ],
  },
  {
    category: 'UI & Components',
    items: [
      {
        id: 'shadcn',
        name: 'shadcn/ui',
        install: [],
        commands: [
          // `-d` is `--template=next --preset=base-nova`; TanStack Start needs the `start` template
          { dlx: ['shadcn@latest', 'init', '-d'], frameworks: ['nextjs'] },
          { dlx: ['shadcn@latest', 'init', '-t', 'start', '-b', 'base', '-p', 'nova', '--no-monorepo', '-y'], frameworks: ['tanstack'] },
          { dlx: ['shadcn@latest', 'add', '--all', '-y'] },
        ],
        default: true,
        guidance: 'Base components live in `components/ui/`. DO NOT modify them unless absolutely necessary for global design changes. Compose them in `components/` for feature-specific needs.',
      },
      {
        id: 'nextThemes',
        name: 'next-themes (Dark Mode)',
        install: ['next-themes'],
        default: true,
        frameworks: ['nextjs'],
        guidance: 'Wrap the root layout with `ThemeProvider`. Use the `useTheme` hook to switch between dark, light, and system themes. Ensure `attribute="class"` is set for Tailwind support.',
      },
      {
        id: 'tanstackThemeKit',
        name: 'tanstack-theme-kit (Dark Mode)',
        install: ['tanstack-theme-kit'],
        default: true,
        frameworks: ['tanstack'],
        guidance: 'A next-themes fork adapted for TanStack Start. Wrap the root layout with `ThemeProvider`. Use `useTheme` hook for dark/light/system themes. Supports SSR without flicker.',
      },
      {
        id: 'motion',
        name: 'Motion (motion.dev, formerly Framer Motion)',
        install: ['motion'],
        default: false,
        guidance: 'Import from `motion/react` (never the legacy `framer-motion` package) in client components; in Next.js Server Components use `import * as motion from \'motion/react-client\'`. Wrap the app in `<MotionConfig reducedMotion="user">` to respect reduced-motion preferences. Animate `transform` and `opacity` (`x`, `y`, `scale`, `opacity`) rather than layout properties; use `AnimatePresence` for exit animations and the `layout` prop for layout transitions. For bundle size in hot paths, use `LazyMotion` + `m` components with `domAnimation`. Keep durations short (150–300ms) and centralize shared transitions/variants in `lib/motion.ts` instead of ad-hoc values.',
      },
    ],
  },
  {
    category: 'Authentication',
    items: [
      {
        id: 'betterAuth',
        name: 'Better Auth',
        install: ['better-auth'],
        default: false,
        guidance: 'Follow the Next.js App Router patterns. Keep the auth logic secure in Server Actions and use the provided middleware for route protection.',
        envVars: [
          { key: 'BETTER_AUTH_SECRET', comment: 'Secret key for Better Auth sessions' },
          { key: 'BETTER_AUTH_URL', comment: 'Base URL of your app (e.g., http://localhost:3000)' },
        ],
      },
    ],
  },
  {
    category: 'Database (Select One)',
    type: 'list',
    id: 'database',
    choices: [
      { name: 'None', value: 'none' },
      { name: 'Supabase (Postgres + Drizzle ORM)', value: 'supabase' },
      { name: 'Postgres + Drizzle ORM (any host: local Docker, Neon, Railway, RDS, ...)', value: 'postgres' },
      { name: 'Convex (Cloud)', value: 'convex_cloud' },
      { name: 'Convex (Self-hosted)', value: 'convex_self' },
      { name: 'SQLite via Turso (libSQL Cloud + Drizzle ORM)', value: 'sqlite_turso' },
      { name: 'SQLite (Self-hosted libSQL/local file + Drizzle ORM)', value: 'sqlite_self' },
    ],
    default: 'supabase',
    providerConfig: {
      supabase: {
        name: 'Supabase + Drizzle',
        install: ['@supabase/supabase-js', 'drizzle-orm', 'pg'],
        devInstall: ['drizzle-kit'],
        guidance: 'Use Supabase SSR package for Next.js. Keep DB queries in Server Components/Actions. Define schemas in `db/schema.ts`. Use `drizzle-kit` for migrations. Prefer `db.query.xyz.findMany()` for type-safe relations.',
        envVars: [
          { key: 'NEXT_PUBLIC_SUPABASE_URL', comment: 'Supabase project URL' },
          { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', comment: 'Supabase anon/public key' },
          { key: 'SUPABASE_SERVICE_ROLE_KEY', comment: 'Supabase service role key (server-only, never expose to client)' },
          { key: 'DATABASE_URL', comment: 'Postgres connection string for Drizzle' },
        ],
      },
      postgres: {
        name: 'Postgres + Drizzle',
        install: ['drizzle-orm', 'pg'],
        devInstall: ['drizzle-kit', '@types/pg'],
        guidance: 'Plain Postgres via node-postgres (`pg`), no vendor SDK. In `db/index.ts` create a `Pool` from `pg` with `connectionString: process.env.DATABASE_URL` and wrap it with `drizzle({ client: pool, schema })` from `drizzle-orm/node-postgres`; in Next.js dev, cache the pool on `globalThis` so hot reloads don\'t exhaust connections. Define schemas in `db/schema.ts` using `pgTable` from `drizzle-orm/pg-core`. Configure `drizzle.config.ts` with `dialect: \'postgresql\'`; run `drizzle-kit generate` + `drizzle-kit migrate` for migrations (`drizzle-kit push` only for local prototyping). Prefer `db.query.xyz.findMany()` for type-safe relations. Keep DB access server-side only (Server Components/Actions or server functions). For local dev: `docker run --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:17`. On serverless hosts, use the provider\'s pooled connection URL.',
        envVars: [
          { key: 'DATABASE_URL', comment: 'Postgres connection string, server-only (e.g., postgres://postgres:postgres@localhost:5432/postgres)' },
        ],
      },
      convex_cloud: {
        name: 'Convex (Cloud)',
        install: ['convex'],
        guidance: 'Define schema in `convex/schema.ts`. Write queries and mutations as Convex functions in `convex/`. Run `{pm:exec} convex dev` to sync with cloud. Convex provides real-time reactive queries out of the box.',
        envVars: [
          { key: 'CONVEX_URL', comment: 'Convex deployment URL (auto-set by {pm:exec} convex dev)' },
        ],
      },
      convex_self: {
        name: 'Convex (Self-hosted)',
        install: ['convex'],
        guidance: 'Self-hosted Convex. Requires Docker (`docker compose up`). Set `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` in `.env.local`. Define schema in `convex/schema.ts`. Run `{pm:exec} convex dev` to sync.',
        envVars: [
          { key: 'CONVEX_SELF_HOSTED_URL', comment: 'Self-hosted Convex backend URL (e.g., http://127.0.0.1:3210)' },
          { key: 'CONVEX_SELF_HOSTED_ADMIN_KEY', comment: 'Admin key from generate_admin_key.sh' },
        ],
      },
      sqlite_turso: {
        name: 'SQLite (Turso) + Drizzle',
        install: ['@libsql/client', 'drizzle-orm'],
        devInstall: ['drizzle-kit'],
        guidance: 'Turso-hosted SQLite via libSQL. Create the client with `createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN })` and wrap it with `drizzle()` from `drizzle-orm/libsql` in `db/index.ts`. Define schemas in `db/schema.ts` using `sqliteTable` from `drizzle-orm/sqlite-core`. Use `drizzle-kit` with `dialect: \'turso\'` for migrations. Keep DB access server-side only. Create databases/tokens with the Turso CLI (`turso db create`, `turso db tokens create`).',
        envVars: [
          { key: 'TURSO_DATABASE_URL', comment: 'Turso database URL (e.g., libsql://<db>-<org>.turso.io)' },
          { key: 'TURSO_AUTH_TOKEN', comment: 'Turso auth token (server-only, never expose to client)' },
        ],
      },
      sqlite_self: {
        name: 'SQLite (Self-hosted) + Drizzle',
        install: ['@libsql/client', 'drizzle-orm'],
        devInstall: ['drizzle-kit'],
        guidance: 'Self-hosted SQLite via libSQL. `DATABASE_URL` can be a local file (`file:local.db`) or a self-hosted `sqld` server (`http://127.0.0.1:8080`, e.g. `docker run -p 8080:8080 ghcr.io/tursodatabase/libsql-server`). Create the client with `createClient({ url, authToken })` and wrap it with `drizzle()` from `drizzle-orm/libsql` in `db/index.ts`. Define schemas in `db/schema.ts` using `sqliteTable`. Use `drizzle-kit` with `dialect: \'sqlite\'` (local file) or `\'turso\'` (sqld) for migrations. Add `*.db` files to `.gitignore`.',
        envVars: [
          { key: 'DATABASE_URL', comment: 'libSQL URL: file:local.db for a local file, or http://127.0.0.1:8080 for self-hosted sqld' },
          { key: 'DATABASE_AUTH_TOKEN', comment: 'sqld auth token if JWT auth is enabled (leave blank for local file)' },
        ],
      },
    },
  },
  {
    category: 'API Layer (Select One)',
    type: 'list',
    id: 'apiLayer',
    // Convex ships its own typed query/mutation layer, so skip this step for it
    when: (answers) => !['convex_cloud', 'convex_self'].includes(answers.database),
    choices: [
      { name: 'None (Server Actions / server functions)', value: 'none' },
      { name: 'oRPC (type-safe RPC + OpenAPI spec & docs)', value: 'orpc' },
      { name: 'tRPC (type-safe RPC)', value: 'trpc' },
    ],
    default: 'none',
    providerConfig: {
      orpc: {
        name: 'oRPC',
        install: ['@orpc/server', '@orpc/client', '@orpc/openapi', '@orpc/zod', 'zod'],
        installWithReactQuery: ['@orpc/tanstack-query'],
        guidance: 'Define procedures in `server/orpc/router.ts` (under `src/` for TanStack Start) with `os.input(zodSchema).handler(...)`; add `.route({ method, path })` to expose them as REST. Typed RPC is served at `/api/rpc`, REST at `/api/v1`, the OpenAPI spec at `/api/v1/spec.json` and API docs at `/api/v1`. On the client use `client` (or the `orpc` TanStack Query helpers) from `lib/orpc.ts`; in server-only code call `createRouterClient(router)` instead of going over HTTP. Use oRPC for APIs shared with other clients (mobile, third parties); simple app-internal mutations can stay as Server Actions / server functions.',
      },
      trpc: {
        name: 'tRPC',
        install: ['@trpc/server', '@trpc/client', 'superjson', 'zod'],
        installWithReactQuery: ['@trpc/tanstack-react-query'],
        guidance: 'Define procedures in `server/trpc/router.ts` (under `src/` for TanStack Start) using `publicProcedure.input(zodSchema).query/mutation(...)`; extend `createContext` in `server/trpc/init.ts` for auth/session data. Served at `/api/trpc` with superjson (Dates/Maps round-trip). On the client use `trpcClient` from `lib/trpc/client.ts`, or `useTRPC()` from `lib/trpc/react.ts` with TanStack Query (wrap the app in `TRPCProvider`); in server-only code use `createCaller`. Simple app-internal mutations can stay as Server Actions / server functions.',
      },
    },
  },
  {
    category: 'Agent Surface',
    items: [
      {
        id: 'mcp',
        name: 'MCP server (/api/mcp)',
        // v2 is the stable SDK line (2026-07-28 spec); its fetch-native handler runs in a Next.js
        // route handler and a TanStack Start server route. zod (4.2+) for the standalone tools.
        install: ['@modelcontextprotocol/server', 'zod'],
        default: false,
        guidance: (answers) => {
          const src = answers.framework === 'tanstack' ? 'src/' : '';
          const common = `Stateless Streamable HTTP at \`/api/mcp\` (\`${src}server/mcp/handler.ts\`); connect Claude Code with \`claude mcp add --transport http <name> http://localhost:3000/api/mcp\`. Without \`MCP_API_KEY\` the endpoint is open in development (localhost Host/Origin only, against DNS rebinding) and refuses every request in production; set it to deploy, and clients send \`Authorization: Bearer <key>\`. Use \`@modelcontextprotocol/server\` (SDK v2), not the v1 \`@modelcontextprotocol/sdk\` imports.`;
          if (answers.apiLayer === 'orpc') {
            return `${common} Every oRPC procedure is an MCP tool: to add a tool, add a procedure to \`${src}server/orpc/router.ts\`; never write a second MCP-only implementation. The router key is the tool name (nested keys joined by \`_\`), \`.route({ summary, description })\` its description, the Zod \`.input()\`/\`.output()\` its JSON schemas, and \`method: 'GET'\` marks it read-only. Calls go through \`createRouterClient\`, so RPC, REST and MCP share one validation and handler. Override a name or hints with \`os.$meta<McpMeta>({})\` and \`.meta({ mcp: { name, annotations } })\` (\`McpMeta\` from \`${src}server/mcp/orpc-tools.ts\`); hide a procedure with \`.meta({ mcp: false })\`.`;
          }
          return `${common} Tools live in \`${src}server/mcp/tools.ts\`: one \`server.registerTool(name, { description, inputSchema: z.object(...), annotations }, handler)\` per tool, each a thin call into the same service functions the app uses. Mark tools that only read with \`readOnlyHint: true\`; never mark a tool that writes or spends as read-only.`;
        },
        envVars: [
          { key: 'MCP_API_KEY', comment: 'Bearer token /api/mcp requires. Empty: open in development, closed in production' },
        ],
      },
    ],
  },
  {
    category: 'Email',
    items: [
      {
        id: 'resend',
        name: 'Resend',
        install: ['resend'],
        default: false,
        guidance: 'Use React Email templates for rich emails. Centralize email logic in a `lib/email.ts` utility.',
        envVars: [
          { key: 'RESEND_API_KEY', comment: 'Resend API key' },
        ],
      },
    ],
  },
  {
    category: 'Payments (Select One)',
    type: 'list',
    id: 'paymentProvider',
    choices: [
      { name: 'None', value: 'none' },
      { name: 'Stripe (Server + Client SDKs)', value: 'stripe' },
      { name: 'Polar.sh (SDK + Next.js integration)', value: 'polar' },
    ],
    default: 'none',
    providerConfig: {
      stripe: {
        name: 'Stripe',
        install: ['stripe', '@stripe/stripe-js', '@stripe/react-stripe-js'],
        guidance: 'Use Stripe webhooks to handle subscription lifecycle. Centralize price IDs in constants.',
        envVars: [
          { key: 'STRIPE_SECRET_KEY', comment: 'Stripe secret key (server-only)' },
          { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', comment: 'Stripe publishable key' },
          { key: 'STRIPE_WEBHOOK_SECRET', comment: 'Stripe webhook signing secret' },
        ],
      },
      polar: {
        name: 'Polar.sh',
        install: ['@polar-sh/sdk', '@polar-sh/nextjs'],
        guidance: 'Integrate using Polar webhooks. Use the Next.js SDK for seamless integration with App Router.',
        envVars: [
          { key: 'POLAR_ACCESS_TOKEN', comment: 'Polar.sh access token' },
          { key: 'POLAR_WEBHOOK_SECRET', comment: 'Polar.sh webhook signing secret' },
        ],
      },
    },
  },
  {
    category: 'AI SDK',
    items: [
      {
        id: 'aiSdk',
        name: 'Vercel AI SDK',
        install: ['ai'],
        default: false,
        guidance: 'Use `streamText` for real-time chat interfaces. Keep LLM configurations in `lib/ai/` and use the UI hooks like `useChat`.',
        envVars: [
          { key: 'OPENAI_API_KEY', comment: 'OpenAI API key (or your preferred AI provider key)' },
        ],
      },
      {
        id: 'openRouter',
        name: 'OpenRouter AI SDK Provider',
        install: ['@openrouter/ai-sdk-provider'],
        default: false,
        guidance: 'Use OpenRouter as a gateway for multiple models. Configure keys in `.env.local` and use the AI SDK provider pattern.',
        envVars: [
          { key: 'OPENROUTER_API_KEY', comment: 'OpenRouter API key' },
        ],
      },
    ],
  },
  {
    category: 'Background Jobs (Select One)',
    type: 'list',
    id: 'jobs',
    choices: [
      { name: 'None', value: 'none' },
      {
        name: 'pg-boss (queue in your Postgres, separate worker process)',
        value: 'pgboss',
        requires: (answers) => (['postgres', 'supabase'].includes(answers.database) ? null : 'needs a Postgres database (Postgres or Supabase)'),
      },
      { name: 'Inngest (durable functions, invoked over HTTP)', value: 'inngest' },
      { name: 'Trigger.dev (hosted task runners)', value: 'trigger' },
    ],
    default: 'none',
    providerConfig: {
      pgboss: {
        name: 'pg-boss',
        // @opentelemetry/api is a required peer pg-boss imports statically; npm with --legacy-peer-deps won't add it
        install: ['pg-boss', '@opentelemetry/api', 'zod'],
        devInstall: ['tsx'],
        guidance: (answers) => {
          const src = answers.framework === 'tanstack' ? 'src/' : '';
          return `Jobs use pg-boss v12: a queue in the \`pgboss\` schema of \`DATABASE_URL\`. Only \`${src}server/jobs/index.ts\` imports pg-boss (\`import { PgBoss } from 'pg-boss'\`, named export only); never import it elsewhere, and never import \`${src}server/jobs\` from client code. Define each job with \`defineJob('kebab-name', zodSchema, async (data, { id }) => { ... })\` in its own file under \`${src}server/jobs/\` and add it to \`jobs\` in \`registry.ts\` (its queue is created when the app or worker starts; queues must exist before send/work). Enqueue from server code only with \`await enqueue('job-name', payload, { startAfter, retryLimit, singletonKey })\`; the payload is type-checked and validated with Zod. Jobs run in a separate process: \`{pm:run} worker:dev\` locally, \`{pm:run} worker\` in production, deployed as its own long-running service (serverless hosts can't run it). Payloads carry ids, not whole records; handlers are idempotent because jobs are retried; throw to fail a job. Use \`boss.schedule()\` in \`startWorker()\` for cron. On Supabase use the direct or session-pooler URL, not the transaction pooler (port 6543).`;
        },
      },
      inngest: {
        name: 'Inngest',
        install: ['inngest', 'zod'],
        guidance: (answers) => {
          const src = answers.framework === 'tanstack' ? 'src/' : '';
          return `Jobs use Inngest v4: durable functions Inngest invokes over HTTP at \`/api/inngest\`. The client and typed events live in \`${src}inngest/client.ts\`, functions in \`${src}inngest/functions.ts\`. Declare events with \`eventType('app/noun.verb', { schema })\` and functions with \`inngest.createFunction({ id, triggers: [myEvent] }, async ({ event, step }) => ...)\` (v4: triggers go in the options; older v3 examples differ). Add every function to the exported \`functions\` array or Inngest won't see it. Put each side effect in its own \`step.run('name', ...)\`: steps retry independently and are memoized, while code outside steps reruns on every step. Use \`step.sleep\`, \`step.waitForEvent\` and \`step.invoke\` for workflows. Send events from server code with \`await inngest.send(myEvent.create(data))\`. Locally set \`INNGEST_DEV=1\` and run \`{pm:run} inngest:dev\` next to the dev server (UI at http://localhost:8288); without it (or a signing key) \`/api/inngest\` answers 500. In production set \`INNGEST_EVENT_KEY\` and \`INNGEST_SIGNING_KEY\` and sync the app URL in the Inngest dashboard.`;
        },
        envVars: [
          { key: 'INNGEST_DEV', comment: 'Set to 1 for local development with the Inngest Dev Server; leave unset in production' },
          { key: 'INNGEST_EVENT_KEY', comment: 'Inngest event key (dashboard), needed to send events in production' },
          { key: 'INNGEST_SIGNING_KEY', comment: 'Inngest signing key (dashboard), verifies requests to /api/inngest in production' },
        ],
      },
      trigger: {
        name: 'Trigger.dev',
        install: ['@trigger.dev/sdk', 'zod'],
        devInstall: ['trigger.dev', '@trigger.dev/build'],
        guidance: (answers) => {
          const src = answers.framework === 'tanstack' ? 'src/' : '';
          return `Jobs use Trigger.dev v4. Tasks live in \`${src}trigger/\` (\`dirs\` in \`trigger.config.ts\`) and run on Trigger.dev's workers, not in the web server, so they can run long without serverless timeouts. Define tasks with \`schemaTask({ id, schema, run: async (payload) => ... })\` (or \`task\`), import from \`@trigger.dev/sdk\` (never \`@trigger.dev/sdk/v3\`), and log with the SDK's \`logger\`. Trigger from server code with \`await tasks.trigger<typeof myTask>('task-id', payload)\`, importing the task with \`import type\` so its code isn't bundled into the app; never trigger from client components. Use \`batchTrigger\` for many runs and \`triggerAndWait\` only inside other tasks. Locally: \`{pm:dlx} trigger.dev@latest login\` once, then \`{pm:run} trigger:dev\` next to the dev server, with \`TRIGGER_SECRET_KEY\` (dev key) and \`TRIGGER_PROJECT_REF\` in \`.env.local\`. Deploy tasks separately with \`{pm:run} trigger:deploy\` (CI must export \`TRIGGER_PROJECT_REF\`), and set the production \`TRIGGER_SECRET_KEY\` on the app host. Keep \`@trigger.dev/sdk\`, \`@trigger.dev/build\` and \`trigger.dev\` on the same version.`;
        },
        envVars: [
          { key: 'TRIGGER_SECRET_KEY', comment: 'Trigger.dev API key per environment (tr_dev_... locally, tr_prod_... in production), server-only' },
          { key: 'TRIGGER_PROJECT_REF', comment: 'Trigger.dev project ref (proj_...), read by trigger.config.ts and `trigger dev`' },
        ],
      },
    },
  },
  {
    category: 'File Uploads (Select One)',
    type: 'list',
    id: 'uploads',
    choices: [
      { name: 'None', value: 'none' },
      {
        name: 'UploadThing (hosted storage + upload UI)',
        value: 'uploadthing',
        // uploadthing bundles Effect 3; next to Effect v4, npm/Yarn hoisting resolves it against v4 and the app breaks
        requires: (answers) => (answers.effect ? 'not with Effect v4 (UploadThing bundles Effect 3); pick R2' : null),
      },
      { name: 'Cloudflare R2 (S3 API, direct browser uploads)', value: 'r2' },
    ],
    default: 'none',
    providerConfig: {
      uploadthing: {
        name: 'UploadThing',
        install: ['uploadthing', '@uploadthing/react'],
        guidance: (answers) => {
          const src = answers.framework === 'tanstack' ? 'src/' : '';
          return `Upload endpoints live in \`${src}server/uploadthing.ts\` as \`f({ image: { maxFileSize, maxFileCount } }).middleware(...).onUploadComplete(...)\`, served at \`/api/uploadthing\`. Do auth in \`.middleware()\` (replace the \`getUser\` stub; throw \`UploadThingError\` to reject) and return what \`onUploadComplete\` needs as metadata. Persist \`file.key\` / \`file.ufsUrl\` in \`onUploadComplete\` (\`file.url\` is deprecated). On the client use the typed \`UploadButton\`, \`UploadDropzone\`, \`useUploadThing\` or \`uploadFiles\` from \`${src}lib/uploadthing.ts\`, only inside client components; renaming an endpoint key is a compile error on the client, by design. Style with the \`ut-*\` Tailwind variants (enabled in the global stylesheet by \`@import "uploadthing/tw/v4"\` + \`@source\`) or the \`appearance\` prop. Server-side deletes: \`new UTApi()\` from \`uploadthing/server\`. In production UploadThing calls back to the public \`/api/uploadthing\` to run \`onUploadComplete\`, so that route must be reachable and not behind auth middleware.`;
        },
        envVars: [
          { key: 'UPLOADTHING_TOKEN', comment: 'UploadThing token from the dashboard (API Keys), server-only' },
        ],
      },
      r2: {
        name: 'Cloudflare R2',
        install: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
        guidance: (answers) => {
          const src = answers.framework === 'tanstack' ? 'src/' : '';
          return `Files go to R2 by direct browser upload. \`${src}server/storage.ts\` is the only module that imports the AWS SDK (server-only): use its \`createUploadUrl()\`, \`getFileUrl()\` and \`deleteFile()\`; never create another \`S3Client\`. Upload rules (allowed MIME types, max bytes, URL lifetime) live in \`UPLOAD_RULES\`; the presigned PUT signs \`Content-Type\` and \`Content-Length\`, so R2 refuses any other type or size. \`POST /api/uploads\` takes \`{ contentType, size }\`, checks auth (replace the \`getUser\` stub) and returns the presigned URL; on the client call \`uploadFile(file)\` from \`${src}lib/upload.ts\`. Store the object \`key\` in the database, not a URL, and derive URLs with \`getFileUrl(key)\` (public when \`R2_PUBLIC_URL\` is set, otherwise a short-lived presigned GET). Keys are \`uploads/<userId>/<uuid>.<ext>\`, never user file names. R2 has no presigned POST policies: don't use \`createPresignedPost\`. Keep \`requestChecksumCalculation: 'WHEN_REQUIRED'\` on the client (the SDK's default checksum breaks presigned PUTs). The bucket needs a CORS rule allowing \`PUT\` with the \`content-type\` header from the app's origins; for local development point \`R2_ENDPOINT\` at MinIO.`;
        },
        envVars: [
          { key: 'R2_ACCOUNT_ID', comment: 'Cloudflare account ID (endpoint https://<id>.r2.cloudflarestorage.com)' },
          { key: 'R2_ACCESS_KEY_ID', comment: 'R2 API token access key ID (R2 > Manage API tokens, Object Read & Write)' },
          { key: 'R2_SECRET_ACCESS_KEY', comment: 'R2 API token secret (server-only, never expose to the client)' },
          { key: 'R2_BUCKET', comment: 'R2 bucket name' },
          { key: 'R2_PUBLIC_URL', comment: 'Optional: public bucket URL or custom domain; unset = presigned GET URLs' },
          { key: 'R2_ENDPOINT', comment: 'Optional: S3 endpoint override for local development (e.g. MinIO http://127.0.0.1:9000)' },
        ],
      },
    },
  },
  {
    category: 'Analytics & Monitoring',
    items: [
      {
        id: 'posthog',
        name: 'PostHog (product analytics)',
        installByFramework: {
          nextjs: ['posthog-js', 'posthog-node'],
          tanstack: ['posthog-js', '@posthog/react', 'posthog-node'],
        },
        default: false,
        guidance: (answers) => {
          const tan = answers.framework === 'tanstack';
          const src = tan ? 'src/' : '';
          const token = tan ? 'VITE_POSTHOG_PROJECT_TOKEN' : 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN';
          return [
            `The browser SDK starts in \`${tan ? 'src/client.tsx' : 'instrumentation-client.ts'}\`, only when \`${token}\` is set (otherwise every call does nothing).`,
            "Pageviews and pageleaves are captured automatically (`defaults: '2026-08-30'`); don't add manual `$pageview` captures.",
            "Track actions with `posthog.capture('object_verb', props)` from `posthog-js` (snake_case, e.g. `project_created`); call `posthog.identify(user.id)` after sign-in and `posthog.reset()` on sign-out.",
            `Feature flags: \`useFeatureFlagEnabled\` / \`usePostHog\` from \`${tan ? '@posthog/react' : 'posthog-js/react'}\`.`,
            `On the server use \`captureServerEvent({ distinctId, event, properties })\` from \`${src}lib/posthog/server.ts\` (${tan ? 'it awaits `captureImmediate`' : 'it flushes after the response with `after()`'}); never create a \`new PostHog()\` per call, and never import that file in client code.`,
            tan ? '' : 'Browser events go through the `/ingest` rewrite in `next.config.ts`: keep it, and exclude `ingest` from any `proxy.ts` matcher.',
            "PostHog's exception capture stays off" + (answers.sentry ? ': Sentry owns errors, so they are not reported twice.' : '; add Sentry for error tracking rather than turning it on.'),
          ].filter(Boolean).join(' ');
        },
        envVarsByFramework: {
          nextjs: [
            { key: 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', comment: 'PostHog project token (phc_..., public); leave empty to disable analytics' },
            { key: 'NEXT_PUBLIC_POSTHOG_HOST', comment: 'PostHog ingestion host: https://us.i.posthog.com or https://eu.i.posthog.com (rebuild after changing: the /ingest rewrites use it)' },
          ],
          tanstack: [
            { key: 'VITE_POSTHOG_PROJECT_TOKEN', comment: 'PostHog project token (phc_..., public, inlined at build); leave empty to disable analytics' },
            { key: 'VITE_POSTHOG_HOST', comment: 'PostHog host: https://us.i.posthog.com or https://eu.i.posthog.com' },
          ],
        },
      },
      {
        id: 'sentry',
        name: 'Sentry (error tracking)',
        installByFramework: {
          nextjs: ['@sentry/nextjs'],
          tanstack: ['@sentry/tanstackstart-react'],
        },
        default: false,
        guidance: (answers) => {
          const tan = answers.framework === 'tanstack';
          const files = tan
            ? 'Browser init and React error hooks: `src/client.tsx`; server init: `src/instrument.server.ts`, imported first by `src/server.ts` (which wraps the handler in `wrapFetchWithSentry`); global middleware: `src/start.ts`; the Vite plugin `sentryTanstackStart()` in `vite.config.ts`.'
            : "Browser init: `instrumentation-client.ts`" + (answers.posthog ? ' (shared with PostHog)' : '') + '; server and edge init: `sentry.server.config.ts` / `sentry.edge.config.ts`, loaded by `instrumentation.ts` (which exports `onRequestError`); root-layout errors: `app/global-error.tsx`; build config: `withSentryConfig` from `@sentry/nextjs/config` in `next.config.ts`.';
          return [
            files,
            `Without \`${tan ? 'VITE_SENTRY_DSN' : 'NEXT_PUBLIC_SENTRY_DSN'}\` nothing is sent.`,
            'Report handled errors with `Sentry.captureException(err)`; never swallow an error in `try/catch` without reporting or rethrowing it.',
            tan ? "Errors thrown on the server in loaders or `beforeLoad` aren't reported automatically: add `onError: (e) => Sentry.captureException(e)` to routes that need it. The TanStack Start SDK is beta." : '',
            'Use `Sentry.startSpan({ name }, fn)` for custom spans and keep `tracesSampleRate` low in production.',
            `Source maps upload at build time only when \`SENTRY_AUTH_TOKEN\`, \`SENTRY_ORG\` and \`SENTRY_PROJECT\` are set${tan ? " (from the shell/CI or `.env.sentry-build-plugin`: Vite doesn't load `.env` files for its config)" : ''}; \`${tan ? '{pm:dlx} sentry@latest init' : '{pm:dlx} @sentry/wizard@latest -i nextjs'}\` sets them up interactively, but review its diff: it rewrites these same files.`,
          ].filter(Boolean).join(' ');
        },
        envVarsByFramework: {
          nextjs: [
            { key: 'NEXT_PUBLIC_SENTRY_DSN', comment: 'Sentry DSN (public), used by browser, server and edge; leave empty to disable error reporting' },
            { key: 'SENTRY_ORG', comment: 'Sentry org slug (build time only, for source map upload)' },
            { key: 'SENTRY_PROJECT', comment: 'Sentry project slug (build time only, for source map upload)' },
            { key: 'SENTRY_AUTH_TOKEN', comment: 'Sentry auth token (secret, build time only: set in CI / hosting; without it source maps are not uploaded)' },
          ],
          tanstack: [
            { key: 'VITE_SENTRY_DSN', comment: 'Sentry DSN (public, inlined at build), used by client and server; leave empty to disable error reporting' },
            { key: 'SENTRY_ORG', comment: 'Sentry org slug (build time only; from the shell/CI or .env.sentry-build-plugin)' },
            { key: 'SENTRY_PROJECT', comment: 'Sentry project slug (build time only; from the shell/CI or .env.sentry-build-plugin)' },
            { key: 'SENTRY_AUTH_TOKEN', comment: 'Sentry auth token (secret, build time only: set in CI / hosting; without it source maps are not uploaded)' },
          ],
        },
      },
    ],
  },
  {
    category: 'Linting & Formatting',
    type: 'list',
    id: 'linter',
    choices: [
      { name: 'None', value: 'none' },
      { name: 'ESLint + Prettier (Standard)', value: 'eslint' },
      { name: 'Biome (Fast, All-in-one)', value: 'biome' },
    ],
    default: 'eslint',
    providerConfig: {
      eslint: {
        name: 'ESLint + Prettier',
        devInstall: [
          'eslint',
          'prettier',
          'eslint-config-prettier',
          'eslint-plugin-prettier'
        ],
        devInstallNextjs: ['eslint-config-next'],
        guidance: 'Standard linting combined with Prettier. Ensure `eslint-config-prettier` is the last item in the extends array.',
      },
      biome: {
        name: 'Biome',
        devInstall: ['@biomejs/biome'],
        commands: [
          { exec: ['biome', 'init'] }
        ],
        guidance: 'Consolidated linting and formatting. Run `{pm:exec} biome check --write .` before commits.',
      },
    },
  },
  {
    category: 'Testing (Select One)',
    type: 'list',
    id: 'testing',
    choices: [
      { name: 'None', value: 'none' },
      { name: 'Vitest + React Testing Library (Unit/Component)', value: 'vitest' },
      { name: 'Playwright (E2E)', value: 'playwright' },
      { name: 'Both (Vitest + Playwright)', value: 'both' },
    ],
    default: 'none',
    providerConfig: {
      vitest: {
        name: 'Vitest + React Testing Library',
        devInstall: [
          'vitest',
          'jsdom',
          '@testing-library/react',
          '@testing-library/dom',
          '@testing-library/jest-dom',
          '@testing-library/user-event',
          '@vitejs/plugin-react',
          'vite-tsconfig-paths',
        ],
        // Vitest 5 made `vite` a peer dependency; npm (with --legacy-peer-deps) and Yarn 1 don't install peers.
        // TanStack Start already depends on vite, so only Next.js needs it added.
        devInstallNextjs: ['vite'],
        guidance: 'Config lives in `vitest.config.ts` (jsdom) with `vitest.setup.ts` loading jest-dom matchers. Run `{pm:run} test` (single run) or `{pm:run} test:watch`. Place tests next to source files (`*.test.tsx`). Use `@testing-library/react` for component rendering and `@testing-library/user-event` for interactions. Note: async Server Components cannot be tested with Vitest — use E2E tests for those.',
      },
      playwright: {
        name: 'Playwright',
        devInstall: ['@playwright/test'],
        commands: [
          { exec: ['playwright', 'install', '--with-deps', 'chromium'] },
        ],
        guidance: 'Place E2E tests in `e2e/` or `tests/` directory. Configure `webServer` in `playwright.config.ts` to start the dev server automatically. Use `{pm:exec} playwright test` to run and `{pm:exec} playwright test --ui` for the interactive UI.',
      },
      both: {
        name: 'Vitest + Playwright',
        devInstall: [
          'vitest',
          'jsdom',
          '@testing-library/react',
          '@testing-library/dom',
          '@testing-library/jest-dom',
          '@testing-library/user-event',
          '@vitejs/plugin-react',
          'vite-tsconfig-paths',
          '@playwright/test',
        ],
        devInstallNextjs: ['vite'],
        commands: [
          { exec: ['playwright', 'install', '--with-deps', 'chromium'] },
        ],
        guidance: 'Unit tests: place next to source (`*.test.tsx`), run with `{pm:run} test` (config in `vitest.config.ts`, which excludes `e2e/`). E2E tests: place in `e2e/` directory, run with `{pm:exec} playwright test`. Use Vitest for component logic and Playwright for full user flows.',
      },
    },
  },
  {
    category: 'UI Helpers',
    items: [
      {
        id: 'nuqs',
        name: 'nuqs',
        install: ['nuqs'],
        default: false,
        frameworks: ['nextjs'],
        guidance: 'Manage URL search parameters as state. Use the `parseAs...` helpers for strict type-casting.',
      },
      {
        id: 'hookForm',
        name: 'React Hook Form',
        install: ['react-hook-form'],
        default: true,
        guidance: 'Always pair with `@hookform/resolvers/zod` for validation. Keep form components uncontrolled for maximum performance.',
      },
      {
        id: 'dayjs',
        name: 'Day.js',
        install: ['dayjs'],
        default: false,
        guidance: 'Lightweight date library. Use plugins (e.g., `relativeTime`) only when needed to keep the bundle small.',
      },
      {
        id: 'lodash',
        name: 'Lodash',
        install: ['lodash'],
        default: false,
        guidance: 'Import only the specific functions you need (e.g., `import debounce from "lodash/debounce"`) to avoid bundle bloat.',
      },
    ],
  },
];

export const ALL_ITEMS = PACKAGE_GROUPS.flatMap(group => group.items || []);
