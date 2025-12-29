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
      },
    ],
  },
  {
    category: 'Database & ORM',
    items: [
      {
        id: 'supabase',
        name: 'Supabase JS client',
        install: ['@supabase/supabase-js'],
        default: true,
        guidance: 'Use the official Supabase SSR package for Next.js. Keep database queries inside Server Components or Server Actions to avoid exposing the Service Role key.',
      },
      {
        id: 'drizzle',
        name: 'Drizzle ORM',
        install: ['drizzle-orm', 'pg'],
        devInstall: ['drizzle-kit'],
        default: true,
        guidance: 'Define schemas in `db/schema.ts`. Use `drizzle-kit` for migrations. Prefer the `db.query.xyz.findMany()` syntax for better type-safety and relations handling.',
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
      },
      polar: {
        name: 'Polar.sh',
        install: ['@polar-sh/sdk', '@polar-sh/nextjs'],
        guidance: 'Integrate using Polar webhooks. Use the Next.js SDK for seamless integration with App Router.',
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
      },
      {
        id: 'openRouter',
        name: 'OpenRouter AI SDK Provider',
        install: ['@openrouter/ai-sdk-provider'],
        default: false,
        guidance: 'Use OpenRouter as a gateway for multiple models. Configure keys in `.env.local` and use the AI SDK provider pattern.',
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
          'eslint-config-next',
          'prettier',
          'eslint-config-prettier',
          'eslint-plugin-prettier'
        ],
        guidance: 'Standard Next.js linting combined with Prettier. Ensure `eslint-config-prettier` is the last item in the extends array.',
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
