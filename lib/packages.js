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
          ['npx', '--yes', 'shadcn@latest', 'init', '-d'],
          ['npx', '--yes', 'shadcn@latest', 'add', '--all', '-y'],
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
      { name: 'Convex (Cloud)', value: 'convex_cloud' },
      { name: 'Convex (Self-hosted)', value: 'convex_self' },
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
      convex_cloud: {
        name: 'Convex (Cloud)',
        install: ['convex'],
        guidance: 'Define schema in `convex/schema.ts`. Write queries and mutations as Convex functions in `convex/`. Run `npx convex dev` to sync with cloud. Convex provides real-time reactive queries out of the box.',
        envVars: [
          { key: 'CONVEX_URL', comment: 'Convex deployment URL (auto-set by npx convex dev)' },
        ],
      },
      convex_self: {
        name: 'Convex (Self-hosted)',
        install: ['convex'],
        guidance: 'Self-hosted Convex. Requires Docker (`docker compose up`). Set `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` in `.env.local`. Define schema in `convex/schema.ts`. Run `npx convex dev` to sync.',
        envVars: [
          { key: 'CONVEX_SELF_HOSTED_URL', comment: 'Self-hosted Convex backend URL (e.g., http://127.0.0.1:3210)' },
          { key: 'CONVEX_SELF_HOSTED_ADMIN_KEY', comment: 'Admin key from generate_admin_key.sh' },
        ],
      },
    },
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
          ['npx', '--yes', '@biomejs/biome', 'init']
        ],
        guidance: 'Consolidated linting and formatting. Run `npx @biomejs/biome check --apply .` before commits.',
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
