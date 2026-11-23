/**
 * Package manager support (npm, pnpm, Yarn, Bun).
 *
 * Everything that differs between package managers lives here, so the rest of
 * the CLI never hardcodes `npm`/`npx`:
 * - how to add (dev) dependencies,
 * - how to run a one-off package from the registry (`npx`, `pnpm dlx`, ...),
 * - how to run a locally installed binary (`npx`, `pnpm exec`, ...),
 * - how to run a package.json script (`npm run`, `pnpm`, ...), used in generated docs.
 *
 * Commands in `lib/packages.js` use `{ dlx: [...] }` / `{ exec: [...] }` and guidance
 * text uses the `{pm:run}`, `{pm:exec}` and `{pm:dlx}` tokens; both are resolved here.
 */

import { execaSync } from 'execa';

export const PACKAGE_MANAGERS = {
  npm: {
    label: 'npm',
    add: ['install'],
    addDev: ['install', '-D'],
    // npm 7+ fails installs on peer-dependency conflicts; the others only warn
    extraInstallArgs: ['--legacy-peer-deps'],
    env: { npm_config_legacy_peer_deps: 'true' },
    dlx: ['npx', '--yes'],
    exec: ['npx'],
    run: 'npm run',
    nextFlag: '--use-npm',
  },
  pnpm: {
    label: 'pnpm',
    add: ['add'],
    addDev: ['add', '-D'],
    extraInstallArgs: [],
    env: {},
    dlx: ['pnpm', 'dlx'],
    exec: ['pnpm', 'exec'],
    run: 'pnpm',
    nextFlag: '--use-pnpm',
  },
  yarn: {
    label: 'Yarn',
    add: ['add'],
    addDev: ['add', '-D'],
    extraInstallArgs: [],
    env: {},
    // Yarn 2+ has `yarn dlx`; Yarn 1 does not, so resolveDlx() falls back to npx for it
    dlx: ['yarn', 'dlx'],
    exec: ['yarn'],
    run: 'yarn',
    nextFlag: '--use-yarn',
  },
  bun: {
    label: 'Bun',
    add: ['add'],
    addDev: ['add', '-d'],
    extraInstallArgs: [],
    env: {},
    dlx: ['bunx'],
    exec: ['bunx'],
    // `bun test` starts Bun's own test runner instead of the "test" script, so always use `bun run`
    run: 'bun run',
    nextFlag: '--use-bun',
  },
};

export const PACKAGE_MANAGER_IDS = Object.keys(PACKAGE_MANAGERS);

/**
 * Detects the package manager the CLI was launched with (`pnpm dlx vibe-now`,
 * `bunx vibe-now`, ...) from the `npm_config_user_agent` env var every package
 * manager sets. Returns null when it can't tell.
 */
export function detectPackageManager(userAgent = process.env.npm_config_user_agent) {
  const name = userAgent?.split('/')[0];
  return PACKAGE_MANAGER_IDS.includes(name) ? name : null;
}

/** Returns the installed version of a package manager, or null if it isn't on PATH. */
export function getVersion(pm, run = execaSync) {
  try {
    return run(pm, ['--version'], { timeout: 5000 }).stdout.trim();
  } catch {
    return null;
  }
}

/** The list prompt's choices; package managers that aren't installed are shown but disabled. */
export function packageManagerChoices(versions) {
  return PACKAGE_MANAGER_IDS.map((id) => {
    const version = versions[id];
    return version
      ? { name: `${PACKAGE_MANAGERS[id].label} (${version})`, value: id }
      : { name: PACKAGE_MANAGERS[id].label, value: id, disabled: 'not installed' };
  });
}

/** Default choice: the launching package manager if it's installed, otherwise npm. */
export function defaultPackageManager(versions, detected = detectPackageManager()) {
  return detected && versions[detected] ? detected : 'npm';
}

function isYarnClassic(version) {
  return typeof version === 'string' && version.startsWith('1.');
}

/** `[command, ...args]` for running a registry package once (create-next-app, shadcn, ...). */
export function resolveDlx(pm, args, version) {
  if (pm === 'yarn' && isYarnClassic(version)) return [...PACKAGE_MANAGERS.npm.dlx, ...args];
  return [...PACKAGE_MANAGERS[pm].dlx, ...args];
}

/** `[command, ...args]` for running a binary installed in the project (playwright, biome, ...). */
export function resolveExec(pm, args) {
  return [...PACKAGE_MANAGERS[pm].exec, ...args];
}

/** `[command, ...args]` for adding dependencies (`dev: true` for devDependencies). */
export function resolveAdd(pm, packages, { dev = false } = {}) {
  const config = PACKAGE_MANAGERS[pm];
  return [pm, ...(dev ? config.addDev : config.add), ...config.extraInstallArgs, ...packages];
}

/** Resolves a command from `lib/packages.js` (`{ dlx: [...] }` or `{ exec: [...] }`). */
export function resolveCommand(pm, command, version) {
  if (command.dlx) return resolveDlx(pm, command.dlx, version);
  if (command.exec) return resolveExec(pm, command.exec);
  throw new Error(`Unknown command shape: ${JSON.stringify(command)}`);
}

/** Shell-style prefixes used in generated docs and guidance text. */
export function docCommands(pm, version) {
  return {
    name: pm,
    install: `${pm} install`,
    add: [pm, ...PACKAGE_MANAGERS[pm].add].join(' '),
    run: PACKAGE_MANAGERS[pm].run,
    exec: PACKAGE_MANAGERS[pm].exec.join(' '),
    dlx: resolveDlx(pm, [], version).filter((arg) => arg !== '--yes').join(' '),
  };
}

/** Replaces the `{pm:run}` / `{pm:exec}` / `{pm:dlx}` tokens in guidance text. */
export function applyDocCommands(text, commands) {
  if (typeof text !== 'string') return text;
  return text
    .replaceAll('{pm:run}', commands.run)
    .replaceAll('{pm:exec}', commands.exec)
    .replaceAll('{pm:dlx}', commands.dlx);
}

/** Copy of a selected package config with its guidance and env var comments resolved for `commands`. */
export function localizePackage(pkg, commands) {
  return {
    ...pkg,
    guidance: applyDocCommands(pkg.guidance, commands),
    ...(pkg.envVars && {
      envVars: pkg.envVars.map((envVar) => ({ ...envVar, comment: applyDocCommands(envVar.comment, commands) })),
    }),
  };
}
