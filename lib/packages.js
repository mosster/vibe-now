/**
 * Configuration for all optional packages and their install/init commands.
 * Adding a new package is as easy as adding an object to this array.
 */
export const PACKAGE_CONFIG = [
  {
    id: 'reactQuery',
    name: 'TanStack React Query',
    install: ['@tanstack/react-query'],
    default: true,
  },
  {
    id: 'zod',
    name: 'Zod',
    install: ['zod'],
    default: true,
  },
  {
    id: 'zustand',
    name: 'Zustand',
    install: ['zustand'],
    default: true,
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui (Initializes & adds all components)',
    install: [], // shadcn usually doesn't need a direct npm install before init in Next.js
    commands: [
      'npx shadcn@latest init -y',
      'npx shadcn@latest add --all'
    ],
    default: true,
  },
  {
    id: 'betterAuth',
    name: 'Better Auth',
    install: ['better-auth'],
    default: false,
  },
  {
    id: 'supabase',
    name: 'Supabase JS client',
    install: ['@supabase/supabase-js'],
    default: true,
  },
  {
    id: 'drizzle',
    name: 'Drizzle ORM (with Postgres & Drizzle Kit)',
    install: ['drizzle-orm', 'pg'],
    devInstall: ['drizzle-kit'],
    default: true,
  }
];
