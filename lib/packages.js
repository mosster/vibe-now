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
      },
    ],
  },
  {
    category: 'UI & Components',
    items: [
      {
        id: 'shadcn',
        name: 'shadcn/ui (Initializes & adds all components)',
        install: [],
        commands: [
          ['npx', 'shadcn@latest', 'init', '-y'],
          ['npx', 'shadcn@latest', 'add', '--all', '-y'],
        ],
        default: true,
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
      },
      {
        id: 'drizzle',
        name: 'Drizzle ORM (with Postgres & Kit)',
        install: ['drizzle-orm', 'pg'],
        devInstall: ['drizzle-kit'],
        default: true,
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
    // Mapping provider value to actual package config
    providerConfig: {
      stripe: {
        name: 'Stripe',
        install: ['stripe', '@stripe/stripe-js', '@stripe/react-stripe-js'],
      },
      polar: {
        name: 'Polar.sh',
        install: ['@polar-sh/sdk', '@polar-sh/nextjs'],
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
      },
      {
        id: 'openRouter',
        name: 'OpenRouter AI SDK Provider',
        install: ['@openrouter/ai-sdk-provider'],
        default: false,
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
      },
      biome: {
        name: 'Biome',
        devInstall: ['@biomejs/biome'],
        commands: [
          ['npx', '@biomejs/biome', 'init']
        ],
      },
    },
  },
  {
    category: 'UI Helpers',
    items: [
      {
        id: 'nuqs',
        name: 'nuqs (Type-safe query params)',
        install: ['nuqs'],
        default: false,
      },
      {
        id: 'hookForm',
        name: 'React Hook Form',
        install: ['react-hook-form'],
        default: true,
      },
      {
        id: 'dayjs',
        name: 'Day.js (Date handling)',
        install: ['dayjs'],
        default: false,
      },
      {
        id: 'lodash',
        name: 'Lodash (Utilities)',
        install: ['lodash'],
        default: false,
      },
    ],
  },
];

// Helper to get a flat list of all potential packages for the prompt validation or internal logic if needed
export const ALL_ITEMS = PACKAGE_GROUPS.flatMap(group => group.items || []);
