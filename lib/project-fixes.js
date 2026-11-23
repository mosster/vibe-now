/**
 * Small fix-ups to what the base scaffolders (create-next-app, the TanStack CLI) write, so the
 * selected tools work on top of them: keep their agent rules, lint config and aliases usable.
 */

const NEXT_RULES = /<!-- BEGIN:nextjs-agent-rules -->[\s\S]*?<!-- END:nextjs-agent-rules -->/;

/**
 * create-next-app writes AGENTS.md with a block of Next.js rules that `next dev` keeps current.
 * When we write AGENTS.md, keep that block at the top instead of dropping it.
 *
 * @param {string} generated our rendered AGENTS.md
 * @param {string | null} existing the AGENTS.md already on disk, if any
 */
export function mergeAgentsMd(generated, existing) {
  const block = existing?.match(NEXT_RULES)?.[0];
  if (!block || generated.includes('BEGIN:nextjs-agent-rules')) return generated;
  return `${block}\n\n${generated}`;
}

/** shadcn/ui's generated files (Next.js layout). They stay close to upstream, so they aren't linted. */
export const SHADCN_GENERATED = ['components/ui/**', 'hooks/use-mobile.ts'];

/**
 * Adds patterns to the `globalIgnores([...])` of create-next-app's eslint.config.mjs.
 * Returns the new config, or null when there's no `globalIgnores([` to add to or the patterns are already there.
 */
export function addEslintIgnores(config, patterns = SHADCN_GENERATED, note = "shadcn/ui's generated files: kept close to upstream, not linted") {
  const anchor = 'globalIgnores([';
  if (!config.includes(anchor) || patterns.every((p) => config.includes(`"${p}"`))) return null;
  const lines = [`\n    // ${note}`, ...patterns.map((p) => `\n    "${p}",`)].join('');
  return config.replace(anchor, `${anchor}${lines}`);
}

/**
 * The TanStack CLI's tsconfig lists a `#/*` path alias before `@/*`; shadcn then can't detect the
 * project's alias and falls back to interactive prompts (and a Next.js-shaped setup). Moving `@/*`
 * first keeps both aliases and lets `shadcn init` run unattended.
 * Text-based because tsconfig.json may hold comments. Returns null when there's nothing to change.
 */
export function preferAtAlias(tsconfig) {
  const reordered = tsconfig.replace(/("#\/\*":\s*\[[^\]]*\]),(\s*)("@\/\*":\s*\[[^\]]*\])/, '$3,$2$1');
  return reordered === tsconfig ? null : reordered;
}

/**
 * shadcn's generated files sometimes import React as a namespace without using it (scroll-area on
 * the base library). Under a tsconfig with `noUnusedLocals` (the TanStack CLI's) that fails
 * typecheck. Drops the import only when the file never references `React`; returns null otherwise.
 */
export function dropUnusedReactImport(source) {
  const importLine = /^import \* as React from ["']react["'];?[ \t]*\r?\n/m;
  if (!importLine.test(source)) return null;
  const rest = source.replace(importLine, '');
  return /\bReact\b/.test(rest) ? null : rest;
}

/** Whether a tsconfig's text turns on `noUnusedLocals` (text-based: tsconfig.json may hold comments). */
export function hasNoUnusedLocals(tsconfig) {
  return /"noUnusedLocals"\s*:\s*true/.test(tsconfig);
}

// --- PostHog and Sentry: config edits (each returns null when already applied or no safe anchor) ---

const NEXT_CONFIG_OBJECT = /const nextConfig(?:\s*:\s*NextConfig)?\s*=\s*\{\n/;

/** next.config.ts: PostHog `/ingest` reverse proxy (rewrites + skipTrailingSlashRedirect). */
export function addPostHogRewrites(config) {
  if (config.includes('/ingest/:path*')) return null; // already applied
  if (/\brewrites\b|skipTrailingSlashRedirect/.test(config)) return null; // can't merge safely
  if (!NEXT_CONFIG_OBJECT.test(config)) return null;
  const block = [
    '  // PostHog reverse proxy: the browser SDK sends to /ingest on this domain (fewer ad-blocker drops)',
    '  skipTrailingSlashRedirect: true,',
    '  async rewrites() {',
    '    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";',
    '    const posthogAssets = posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com");',
    '    return [',
    '      { source: "/ingest/static/:path*", destination: `${posthogAssets}/static/:path*` },',
    '      { source: "/ingest/array/:path*", destination: `${posthogAssets}/array/:path*` },',
    '      { source: "/ingest/:path*", destination: `${posthogHost}/:path*` },',
    '    ];',
    '  },',
    '',
  ].join('\n');
  return config.replace(NEXT_CONFIG_OBJECT, (m) => `${m}${block}`);
}

const NEXT_EXPORT = /^export default nextConfig;?[ \t]*$/m;

/** next.config.ts: wrap the export with Sentry's withSentryConfig (source maps, build-time instrumentation). */
export function addWithSentryConfig(config) {
  if (config.includes('withSentryConfig')) return null; // already applied
  if (!NEXT_EXPORT.test(config)) return null;
  const importLine = 'import { withSentryConfig } from "@sentry/nextjs/config";\n';
  const typeImport = /^import type \{ NextConfig \} from ["']next["'];?[ \t]*\n/m;
  const withImport = typeImport.test(config)
    ? config.replace(typeImport, (m) => `${m}${importLine}`)
    : `${importLine}${config}`;
  return withImport.replace(
    NEXT_EXPORT,
    [
      'export default withSentryConfig(nextConfig, {',
      '  // Source maps upload only when SENTRY_AUTH_TOKEN is set (CI / production builds); otherwise skipped',
      '  org: process.env.SENTRY_ORG,',
      '  project: process.env.SENTRY_PROJECT,',
      '  authToken: process.env.SENTRY_AUTH_TOKEN,',
      '  widenClientFileUpload: true,',
      '  silent: !process.env.CI,',
      "  // Don't send the build plugin's own usage data to Sentry",
      '  telemetry: false,',
      '});',
    ].join('\n'),
  );
}

/**
 * vite.config.ts (TanStack Start): add `sentryTanstackStart()` as the last Vite plugin.
 * Org/project/token come from SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN in the environment
 * or `.env.sentry-build-plugin` (Vite doesn't load .env files into process.env for its config).
 */
export function addSentryVitePlugin(config) {
  if (config.includes('sentryTanstackStart')) return null; // already applied
  const startImport = /^import \{ tanstackStart \} from ['"]@tanstack\/react-start\/plugin\/vite['"];?[ \t]*\n/m;
  const open = config.indexOf('plugins: [');
  if (!startImport.test(config) || open === -1) return null;
  // find the `]` that closes the plugins array
  let depth = 0;
  let close = -1;
  for (let i = open + 'plugins: '.length; i < config.length; i++) {
    const ch = config[i];
    if (ch === '[' || ch === '(' || ch === '{') depth++;
    else if (ch === ']' || ch === ')' || ch === '}') {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) return null;
  const inner = config.slice(open + 'plugins: ['.length, close);
  const multiline = inner.includes('\n');
  const trimmed = inner.replace(/,?\s*$/, '');
  const next = multiline
    ? `${trimmed},\n    sentryTanstackStart({ telemetry: false }),\n  `
    : `${trimmed}, sentryTanstackStart({ telemetry: false })`;
  const withPlugin = `${config.slice(0, open)}plugins: [${next}${config.slice(close)}`;
  return withPlugin.replace(
    startImport,
    (m) => `${m}import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'\n`,
  );
}

/** .gitignore (TanStack's doesn't cover it): keep the Sentry build plugin's token file out of git. */
export function ignoreSentryBuildPluginEnv(gitignore) {
  if (/^\.env\*$|^\.env\.sentry-build-plugin$/m.test(gitignore)) return null;
  return `${gitignore.replace(/\n*$/, '\n')}\n# Sentry build plugin auth token\n.env.sentry-build-plugin\n`;
}

/**
 * Applies a text edit to a file in place. `marker` is a string that's in the file once the edit
 * holds. Returns 'applied', 'present' (already there), 'missing-file' or 'no-anchor' (print the manual step).
 */
export function editFile(fs, filePath, edit, marker) {
  if (!fs.existsSync(filePath)) return 'missing-file';
  const text = fs.readFileSync(filePath, 'utf8');
  if (text.includes(marker)) return 'present';
  const updated = edit(text);
  if (updated === null || !updated.includes(marker)) return 'no-anchor';
  fs.writeFileSync(filePath, updated);
  return 'applied';
}

/**
 * UploadThing on Tailwind v4: `uploadthing/tw/v4` defines the `ut-*` variants and the `@source`
 * line makes Tailwind generate the components' classes. Inserted right after `@import "tailwindcss";`
 * (the path is relative to app/globals.css or src/styles.css, both one level below the root).
 */
export function addUploadThingStyles(css) {
  if (css.includes('uploadthing/tw/v4')) return null;
  const anchor = /^@import ["']tailwindcss["'];?[ \t]*\r?\n/m;
  if (!anchor.test(css)) return null;
  return css.replace(anchor, (m) => `${m}@import "uploadthing/tw/v4";\n@source "../node_modules/@uploadthing/react/dist";\n`);
}

/** Appends an entry to a .gitignore (with a comment) unless it's already listed. Returns null when it is. */
export function addGitignoreEntry(gitignore, entry, comment) {
  if (gitignore.split(/\r?\n/).some((line) => line.trim() === entry)) return null;
  return `${gitignore.replace(/\n*$/, '\n')}\n# ${comment}\n${entry}\n`;
}
