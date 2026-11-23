/**
 * Validates the CLI configuration without running actual installs.
 * Tests prompt generation, package filtering, template rendering, and env vars.
 */

import { PACKAGE_GROUPS, ALL_ITEMS } from '../lib/packages.js';
import { getScaffoldFiles, getScaffoldScripts } from '../lib/scaffolds.js';
import {
    PACKAGE_MANAGERS,
    PACKAGE_MANAGER_IDS,
    detectPackageManager,
    packageManagerChoices,
    defaultPackageManager,
    resolveDlx,
    resolveExec,
    resolveAdd,
    resolveCommand,
    docCommands,
    applyDocCommands,
    localizePackage,
} from '../lib/package-managers.js';
import { WORKFLOWS, WORKFLOW_IDS, DEFAULT_WORKFLOW, REVIEW_SKILLS, getWorkflowFiles, workflowData, gateScripts } from '../lib/workflow.js';
import { buildTemplateData, localDate } from '../lib/template-data.js';
import { resolveConfig, selectPackages, listChoices } from '../lib/selection.js';
import { mergeAgentsMd, addEslintIgnores, preferAtAlias, dropUnusedReactImport, hasNoUnusedLocals, addPostHogRewrites, addWithSentryConfig, addSentryVitePlugin, ignoreSentryBuildPluginEnv, addUploadThingStyles, addGitignoreEntry, editFile, SHADCN_GENERATED } from '../lib/project-fixes.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Handlebars = require('handlebars');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.error(`  ❌ ${message}`);
        failed++;
    }
}

// ============================================
// Test 1: Package configuration integrity
// ============================================
console.log('\n📦 Test 1: Package configuration integrity\n');

assert(PACKAGE_GROUPS.length > 0, 'PACKAGE_GROUPS is not empty');
assert(ALL_ITEMS.length > 0, 'ALL_ITEMS is not empty');

// Every item should have id, name, and install
for (const item of ALL_ITEMS) {
    assert(item.id && item.name, `Item ${item.id || '???'} has id and name`);
    assert(Array.isArray(item.install) || (Array.isArray(item.installByFramework?.nextjs) && Array.isArray(item.installByFramework?.tanstack)), `${item.id} has an install array (or one per framework)`);
}

// List-based groups should have providerConfig
const listGroups = PACKAGE_GROUPS.filter(g => g.type === 'list');
for (const group of listGroups) {
    assert(group.id, `List group "${group.category}" has id`);
    assert(group.providerConfig, `List group "${group.category}" has providerConfig`);
    assert(group.choices.length > 0, `List group "${group.category}" has choices`);

    // Every non-none choice should have a providerConfig entry
    for (const choice of group.choices) {
        if (choice.value !== 'none') {
            assert(
                group.providerConfig[choice.value],
                `${group.category}: providerConfig has entry for "${choice.value}"`
            );
        }
    }
}

// ============================================
// Test 2: Framework-specific packages
// ============================================
console.log('\n🔀 Test 2: Framework-specific packages\n');

const nextjsOnly = ALL_ITEMS.filter(i => i.frameworks && i.frameworks.includes('nextjs') && !i.frameworks.includes('tanstack'));
const tanstackOnly = ALL_ITEMS.filter(i => i.frameworks && i.frameworks.includes('tanstack') && !i.frameworks.includes('nextjs'));
const universal = ALL_ITEMS.filter(i => !i.frameworks);

assert(nextjsOnly.length > 0, `Found ${nextjsOnly.length} Next.js-only packages: ${nextjsOnly.map(i => i.id).join(', ')}`);
assert(tanstackOnly.length > 0, `Found ${tanstackOnly.length} TanStack-only packages: ${tanstackOnly.map(i => i.id).join(', ')}`);
assert(universal.length > 0, `Found ${universal.length} universal packages`);

assert(nextjsOnly.some(i => i.id === 'nextThemes'), 'next-themes is Next.js-only');
assert(tanstackOnly.some(i => i.id === 'tanstackThemeKit'), 'tanstack-theme-kit is TanStack-only');
assert(nextjsOnly.some(i => i.id === 'nuqs'), 'nuqs is Next.js-only');

// ============================================
// Test 3: Env vars configuration
// ============================================
console.log('\n🔐 Test 3: Env vars configuration\n');

// Check packages that should have envVars
const packagesWithEnvVars = [];
for (const group of PACKAGE_GROUPS) {
    if (group.providerConfig) {
        for (const [key, config] of Object.entries(group.providerConfig)) {
            if (config.envVars) packagesWithEnvVars.push({ ...config, id: key });
        }
    }
    if (group.items) {
        for (const item of group.items) {
            if (item.envVars) packagesWithEnvVars.push(item);
        }
    }
}

assert(packagesWithEnvVars.length > 0, `Found ${packagesWithEnvVars.length} packages with envVars`);

// Validate envVar structure
for (const pkg of packagesWithEnvVars) {
    for (const envVar of pkg.envVars) {
        assert(envVar.key && envVar.comment, `${pkg.id || pkg.name}: envVar "${envVar.key}" has key and comment`);
    }
}

// Specific checks
const supabaseConfig = PACKAGE_GROUPS.find(g => g.id === 'database')?.providerConfig?.supabase;
assert(supabaseConfig?.envVars?.length === 4, `Supabase has 4 env vars`);

const postgresConfig = PACKAGE_GROUPS.find(g => g.id === 'database')?.providerConfig?.postgres;
assert(postgresConfig?.envVars?.length === 1, `Postgres has 1 env var`);
assert(postgresConfig?.envVars?.[0]?.key === 'DATABASE_URL', `Postgres env var is DATABASE_URL`);

const convexCloudConfig = PACKAGE_GROUPS.find(g => g.id === 'database')?.providerConfig?.convex_cloud;
assert(convexCloudConfig?.envVars?.length === 1, `Convex Cloud has 1 env var`);

const convexSelfConfig = PACKAGE_GROUPS.find(g => g.id === 'database')?.providerConfig?.convex_self;
assert(convexSelfConfig?.envVars?.length === 2, `Convex Self-hosted has 2 env vars`);

const tursoConfig = PACKAGE_GROUPS.find(g => g.id === 'database')?.providerConfig?.sqlite_turso;
assert(tursoConfig?.envVars?.length === 2, `SQLite (Turso) has 2 env vars`);

const sqliteSelfConfig = PACKAGE_GROUPS.find(g => g.id === 'database')?.providerConfig?.sqlite_self;
assert(sqliteSelfConfig?.envVars?.length === 2, `SQLite (Self-hosted) has 2 env vars`);

// ============================================
// Test 4: ESLint framework-specific installs
// ============================================
console.log('\n🔧 Test 4: ESLint framework-specific installs\n');

const linterGroup = PACKAGE_GROUPS.find(g => g.id === 'linter');
const eslintConfig = linterGroup?.providerConfig?.eslint;

assert(eslintConfig, 'ESLint config exists');
assert(!eslintConfig.devInstall.includes('eslint-config-next'), 'eslint-config-next NOT in base devInstall');
assert(eslintConfig.devInstallNextjs?.includes('eslint-config-next'), 'eslint-config-next IS in devInstallNextjs');

// ============================================
// Test 5: Template rendering
// ============================================
console.log('\n📄 Test 5: Template rendering\n');

const templateFiles = ['README.md.hbs', 'AGENTS.md.hbs', 'CLAUDE.md.hbs', 'env.example.hbs'];
for (const file of templateFiles) {
    const filePath = path.join(rootDir, 'templates', file);
    assert(fs.existsSync(filePath), `Template exists: ${file}`);
}

// Test rendering with mock data
const mockData = {
    projectName: 'test-project',
    selectedPackages: [
        { name: 'Zustand', guidance: 'Use stores wisely.' },
        { name: 'Supabase + Drizzle', guidance: 'Keep queries server-side.', envVars: [
            { key: 'NEXT_PUBLIC_SUPABASE_URL', comment: 'Supabase project URL' },
            { key: 'SUPABASE_SERVICE_ROLE_KEY', comment: 'Service role key' },
        ]},
    ],
    isNextjs: true,
    isTanStack: false,
    isSupabase: true,
    isConvex: false,
    isSQLite: false,
    isTurso: false,
    isDrizzle: true,
    pm: docCommands('npm'),
};

for (const file of templateFiles) {
    const tmplPath = path.join(rootDir, 'templates', file);
    const tmpl = fs.readFileSync(tmplPath, 'utf8');
    try {
        const rendered = Handlebars.compile(tmpl)(mockData);
        assert(rendered.length > 0, `${file} renders (Next.js + Supabase): ${rendered.length} chars`);

        if (file === 'CLAUDE.md.hbs') {
            assert(rendered.includes('Next.js'), 'CLAUDE.md contains Next.js for nextjs framework');
            assert(rendered.includes('db/'), 'CLAUDE.md contains db/ for Supabase');
            assert(!rendered.includes('convex/'), 'CLAUDE.md does NOT contain convex/ for Supabase');
        }
        if (file === 'env.example.hbs') {
            assert(rendered.includes('NEXT_PUBLIC_SUPABASE_URL'), '.env.example contains Supabase URL');
            assert(rendered.includes('SUPABASE_SERVICE_ROLE_KEY'), '.env.example contains service role key');
        }
    } catch (err) {
        assert(false, `${file} rendering failed: ${err.message}`);
    }
}

// Test TanStack + Convex rendering
const tanstackConvexData = {
    ...mockData,
    isNextjs: false,
    isTanStack: true,
    isSupabase: false,
    isConvex: true,
    isDrizzle: false,
    selectedPackages: [
        { name: 'Zustand', guidance: 'Use stores wisely.' },
        { name: 'Convex (Cloud)', guidance: 'Define schema in convex/.', envVars: [
            { key: 'CONVEX_URL', comment: 'Convex deployment URL' },
        ]},
    ],
};

const claudeTmpl = fs.readFileSync(path.join(rootDir, 'templates/CLAUDE.md.hbs'), 'utf8');
const renderedTanstack = Handlebars.compile(claudeTmpl)(tanstackConvexData);
assert(renderedTanstack.includes('TanStack Start'), 'CLAUDE.md contains TanStack Start for tanstack framework');
assert(renderedTanstack.includes('convex/'), 'CLAUDE.md contains convex/ for Convex');
assert(!renderedTanstack.includes('db/'), 'CLAUDE.md does NOT contain db/ for Convex');
assert(renderedTanstack.includes('src/'), 'CLAUDE.md contains src/ for TanStack');
assert(renderedTanstack.includes('routes/'), 'CLAUDE.md contains routes/ for TanStack');

const envTmpl = fs.readFileSync(path.join(rootDir, 'templates/env.example.hbs'), 'utf8');
const renderedEnv = Handlebars.compile(envTmpl)(tanstackConvexData);
assert(renderedEnv.includes('CONVEX_URL'), '.env.example contains CONVEX_URL for Convex Cloud');
assert(!renderedEnv.includes('SUPABASE'), '.env.example does NOT contain Supabase vars for Convex');

// Test Next.js + SQLite (Turso) rendering
const tursoData = {
    ...mockData,
    isSupabase: false,
    isConvex: false,
    isSQLite: true,
    isTurso: true,
    isDrizzle: true,
    selectedPackages: [
        { name: 'SQLite (Turso) + Drizzle', guidance: 'Use libSQL.', envVars: [
            { key: 'TURSO_DATABASE_URL', comment: 'Turso database URL' },
            { key: 'TURSO_AUTH_TOKEN', comment: 'Turso auth token' },
        ]},
    ],
};
for (const file of ['CLAUDE.md.hbs', 'AGENTS.md.hbs']) {
    const tmpl = fs.readFileSync(path.join(rootDir, 'templates', file), 'utf8');
    const rendered = Handlebars.compile(tmpl)(tursoData);
    assert(rendered.includes('db/'), `${file} contains db/ for SQLite (Turso)`);
    assert(rendered.includes('index.ts'), `${file} contains db/index.ts for SQLite`);
    assert(!rendered.includes('convex/'), `${file} does NOT contain convex/ for SQLite`);
    assert(rendered.includes('TURSO_AUTH_TOKEN'), `${file} warns about TURSO_AUTH_TOKEN`);
    assert(!rendered.includes('service_role'), `${file} does NOT warn about Supabase service_role for SQLite`);
}
const renderedTursoEnv = Handlebars.compile(envTmpl)(tursoData);
assert(renderedTursoEnv.includes('TURSO_DATABASE_URL'), '.env.example contains TURSO_DATABASE_URL for Turso');
assert(!renderedTursoEnv.includes('SUPABASE'), '.env.example does NOT contain Supabase vars for Turso');

// Test TanStack + SQLite (Self-hosted) rendering
const sqliteSelfData = { ...tursoData, isNextjs: false, isTanStack: true, isTurso: false };
const renderedSqliteSelf = Handlebars.compile(claudeTmpl)(sqliteSelfData);
assert(renderedSqliteSelf.includes('db/'), 'CLAUDE.md contains db/ for SQLite (Self-hosted)');
assert(!renderedSqliteSelf.includes('TURSO_AUTH_TOKEN'), 'CLAUDE.md does NOT mention TURSO_AUTH_TOKEN for self-hosted SQLite');
assert(!renderedSqliteSelf.includes('node-postgres'), 'CLAUDE.md does NOT mention node-postgres for SQLite');

// Test Next.js + TanStack + plain Postgres rendering
const postgresData = {
    ...mockData,
    isSupabase: false,
    isPostgres: true,
    isConvex: false,
    isSQLite: false,
    isTurso: false,
    isDrizzle: true,
    selectedPackages: [
        { name: 'Postgres + Drizzle', guidance: 'Use node-postgres.', envVars: [
            { key: 'DATABASE_URL', comment: 'Postgres connection string' },
        ]},
    ],
};
for (const framework of [{ isNextjs: true, isTanStack: false, label: 'Next.js' }, { isNextjs: false, isTanStack: true, label: 'TanStack' }]) {
    const data = { ...postgresData, isNextjs: framework.isNextjs, isTanStack: framework.isTanStack };
    for (const file of ['CLAUDE.md.hbs', 'AGENTS.md.hbs']) {
        const tmpl = fs.readFileSync(path.join(rootDir, 'templates', file), 'utf8');
        const rendered = Handlebars.compile(tmpl)(data);
        assert(rendered.includes('db/'), `${file} contains db/ for Postgres (${framework.label})`);
        assert(rendered.includes('node-postgres pool + Drizzle instance'), `${file} lists db/index.ts with node-postgres for Postgres (${framework.label})`);
        assert(!rendered.includes('libSQL'), `${file} does NOT mention libSQL for Postgres (${framework.label})`);
        assert(!rendered.includes('convex/'), `${file} does NOT contain convex/ for Postgres (${framework.label})`);
        assert(rendered.includes('`DATABASE_URL`'), `${file} warns about DATABASE_URL for Postgres (${framework.label})`);
        assert(!rendered.includes('service_role'), `${file} does NOT warn about Supabase service_role for Postgres (${framework.label})`);
        assert(!rendered.includes('TURSO_AUTH_TOKEN'), `${file} does NOT mention TURSO_AUTH_TOKEN for Postgres (${framework.label})`);
    }
}
const renderedPostgresEnv = Handlebars.compile(envTmpl)(postgresData);
assert(renderedPostgresEnv.includes('DATABASE_URL='), '.env.example contains DATABASE_URL for Postgres');
assert(!renderedPostgresEnv.includes('SUPABASE'), '.env.example does NOT contain Supabase vars for Postgres');

// Supabase output must not pick up the plain-Postgres additions
const renderedSupabaseClaude = Handlebars.compile(claudeTmpl)(mockData);
assert(!renderedSupabaseClaude.includes('node-postgres'), 'CLAUDE.md does NOT mention node-postgres for Supabase');

// ============================================
// Test 6: Database group structure
// ============================================
console.log('\n🗄️ Test 6: Database group structure\n');

const dbGroup = PACKAGE_GROUPS.find(g => g.id === 'database');
assert(dbGroup, 'Database group exists');
assert(dbGroup.type === 'list', 'Database is a list-type group');
assert(dbGroup.choices.length === 7, 'Database has 7 choices (none, supabase, postgres, convex_cloud, convex_self, sqlite_turso, sqlite_self)');
assert(dbGroup.choices.every(c => c.value === 'none' || dbGroup.providerConfig[c.value]), 'Every database choice (except none) has a provider config');
assert(dbGroup.default === 'supabase', 'Database default is still Supabase');
assert(dbGroup.providerConfig.supabase, 'Supabase provider config exists');
assert(dbGroup.providerConfig.convex_cloud, 'Convex Cloud provider config exists');
assert(dbGroup.providerConfig.convex_self, 'Convex Self-hosted provider config exists');
assert(dbGroup.providerConfig.supabase.devInstall?.includes('drizzle-kit'), 'Supabase includes drizzle-kit as devDep');
assert(!dbGroup.providerConfig.convex_cloud.devInstall, 'Convex Cloud has no devDeps');
{
    const cfg = dbGroup.providerConfig.postgres;
    assert(cfg, 'Postgres provider config exists');
    assert(cfg.install.includes('drizzle-orm') && cfg.install.includes('pg'), 'Postgres installs drizzle-orm + pg');
    assert(!cfg.install.some(p => p.includes('supabase')), 'Postgres does NOT install any Supabase package');
    assert(!cfg.install.includes('@libsql/client'), 'Postgres does NOT install @libsql/client');
    assert(cfg.devInstall?.includes('drizzle-kit'), 'Postgres includes drizzle-kit as devDep');
    assert(cfg.devInstall?.includes('@types/pg'), 'Postgres includes @types/pg as devDep');
    assert(cfg.guidance.includes('drizzle-orm/node-postgres') && cfg.guidance.includes("dialect: 'postgresql'"), 'Postgres guidance covers node-postgres driver and postgresql dialect');
}
for (const key of ['sqlite_turso', 'sqlite_self']) {
    const cfg = dbGroup.providerConfig[key];
    assert(cfg, `${key} provider config exists`);
    assert(cfg.install.includes('@libsql/client'), `${key} includes @libsql/client`);
    assert(cfg.install.includes('drizzle-orm'), `${key} includes drizzle-orm`);
    assert(!cfg.install.includes('pg'), `${key} does NOT include pg`);
    assert(cfg.devInstall?.includes('drizzle-kit'), `${key} includes drizzle-kit as devDep`);
}

// ============================================
// Test 7: Testing group structure
// ============================================
console.log('\n🧪 Test 7: Testing group structure\n');

const testGroup = PACKAGE_GROUPS.find(g => g.id === 'testing');
assert(testGroup, 'Testing group exists');
assert(testGroup.type === 'list', 'Testing is a list-type group');
assert(testGroup.choices.length === 4, 'Testing has 4 choices (none, vitest, playwright, both)');
assert(testGroup.providerConfig.vitest, 'Vitest provider config exists');
assert(testGroup.providerConfig.playwright, 'Playwright provider config exists');
assert(testGroup.providerConfig.both, 'Both provider config exists');
assert(testGroup.providerConfig.vitest.devInstall?.includes('vitest'), 'Vitest config includes vitest');
assert(testGroup.providerConfig.vitest.devInstall?.includes('@testing-library/react'), 'Vitest config includes @testing-library/react');
assert(testGroup.providerConfig.vitest.devInstall?.includes('@vitejs/plugin-react'), 'Vitest config includes @vitejs/plugin-react (all frameworks)');
assert(testGroup.providerConfig.vitest.devInstall?.includes('vite-tsconfig-paths'), 'Vitest config includes vite-tsconfig-paths (all frameworks)');
assert(testGroup.providerConfig.playwright.devInstall?.includes('@playwright/test'), 'Playwright config includes @playwright/test');
assert(testGroup.providerConfig.playwright.commands?.length > 0, 'Playwright has init commands');
assert(testGroup.providerConfig.both.devInstall?.includes('vitest'), 'Both config includes vitest');
assert(testGroup.providerConfig.both.devInstall?.includes('@playwright/test'), 'Both config includes @playwright/test');
assert(testGroup.providerConfig.both.devInstall?.includes('@vitejs/plugin-react'), 'Both config includes @vitejs/plugin-react (all frameworks)');
assert(testGroup.providerConfig.both.devInstall?.includes('vite-tsconfig-paths'), 'Both config includes vite-tsconfig-paths (all frameworks)');

// ============================================
// Test 8: Vitest scaffold templates
// ============================================
console.log('\n🧫 Test 8: Vitest scaffold templates\n');

const vitestTmplDir = path.join(rootDir, 'templates/vitest');
for (const file of ['vitest.config.ts.hbs', 'vitest.setup.ts.hbs', 'example.test.tsx.hbs']) {
    assert(fs.existsSync(path.join(vitestTmplDir, file)), `Vitest template exists: ${file}`);
}

const vitestConfigTmpl = fs.readFileSync(path.join(vitestTmplDir, 'vitest.config.ts.hbs'), 'utf8');
const vitestOnlyConfig = Handlebars.compile(vitestConfigTmpl)({ isPlaywright: false });
assert(vitestOnlyConfig.includes("environment: 'jsdom'"), 'vitest.config.ts uses jsdom environment');
assert(vitestOnlyConfig.includes("setupFiles: ['./vitest.setup.ts']"), 'vitest.config.ts registers setup file');
assert(vitestOnlyConfig.includes('tsconfigPaths()') && vitestOnlyConfig.includes('react()'), 'vitest.config.ts loads tsconfigPaths + react plugins');
assert(!vitestOnlyConfig.includes('e2e/**'), 'vitest.config.ts does NOT exclude e2e/ without Playwright');
assert(!vitestOnlyConfig.includes('configDefaults'), 'vitest.config.ts does NOT import configDefaults without Playwright');

const vitestBothConfig = Handlebars.compile(vitestConfigTmpl)({ isPlaywright: true });
assert(vitestBothConfig.includes("'e2e/**'"), 'vitest.config.ts excludes e2e/ when Playwright is selected');
assert(vitestBothConfig.includes('configDefaults'), 'vitest.config.ts imports configDefaults when Playwright is selected');

const vitestSetup = fs.readFileSync(path.join(vitestTmplDir, 'vitest.setup.ts.hbs'), 'utf8');
assert(vitestSetup.includes('@testing-library/jest-dom/vitest'), 'vitest.setup.ts loads jest-dom matchers');

const renderedClaudeVitest = Handlebars.compile(claudeTmpl)({ ...mockData, isVitest: true });
assert(renderedClaudeVitest.includes('`npm run test`'), 'CLAUDE.md lists npm run test when Vitest is selected');
assert(testGroup.providerConfig.both.commands?.length > 0, 'Both config has Playwright init commands');
for (const key of ['vitest', 'both']) {
    const cfg = testGroup.providerConfig[key];
    assert(cfg.devInstallNextjs?.includes('vite'), `${key}: installs vite on Next.js (Vitest 5 peer dep)`);
    assert(!cfg.devInstall.includes('vite'), `${key}: does NOT reinstall vite on TanStack Start (already a dependency)`);
}
assert(!testGroup.providerConfig.playwright.devInstallNextjs, 'Playwright-only does NOT install vite');

// ============================================
// Test 9: API layer group & scaffolds
// ============================================
console.log('\n🔌 Test 9: API layer group & scaffolds\n');

const apiGroup = PACKAGE_GROUPS.find(g => g.id === 'apiLayer');
assert(apiGroup, 'API layer group exists');
assert(apiGroup.type === 'list', 'API layer is a list-type group');
assert(apiGroup.default === 'none', 'API layer defaults to none');
assert(apiGroup.choices.map(c => c.value).join(',') === 'none,orpc,trpc', 'API layer has choices none, orpc, trpc');
assert(PACKAGE_GROUPS.indexOf(apiGroup) > PACKAGE_GROUPS.indexOf(dbGroup), 'API layer is asked after Database (its prompt depends on it)');
assert(apiGroup.when({ database: 'convex_cloud' }) === false, 'API layer is skipped for Convex Cloud');
assert(apiGroup.when({ database: 'convex_self' }) === false, 'API layer is skipped for Convex Self-hosted');
assert(apiGroup.when({ database: 'supabase' }) === true, 'API layer is asked for Supabase');
assert(apiGroup.when({ database: 'postgres' }) === true, 'API layer is asked for plain Postgres');
assert(apiGroup.when({ database: 'none' }) === true, 'API layer is asked with no database');

const orpcCfg = apiGroup.providerConfig.orpc;
const trpcCfg = apiGroup.providerConfig.trpc;
for (const pkg of ['@orpc/server', '@orpc/client', '@orpc/openapi', '@orpc/zod', 'zod']) {
    assert(orpcCfg.install.includes(pkg), `oRPC installs ${pkg}`);
}
assert(orpcCfg.installWithReactQuery?.includes('@orpc/tanstack-query'), 'oRPC adds @orpc/tanstack-query with React Query');
for (const pkg of ['@trpc/server', '@trpc/client', 'superjson', 'zod']) {
    assert(trpcCfg.install.includes(pkg), `tRPC installs ${pkg}`);
}
assert(trpcCfg.installWithReactQuery?.includes('@trpc/tanstack-react-query'), 'tRPC adds @trpc/tanstack-react-query with React Query');

const outputs = (answers) => getScaffoldFiles({ projectName: 'demo', ...answers }, docCommands('npm')).files.map(([, out]) => out);
const templatesExist = (answers) => getScaffoldFiles({ projectName: 'demo', ...answers }, docCommands('npm')).files
    .every(([tmpl]) => fs.existsSync(path.join(rootDir, 'templates', tmpl)));

assert(outputs({ framework: 'nextjs', apiLayer: 'none', testing: 'none' }).length === 0, 'No scaffold files with no API layer and no Vitest');

const orpcNext = outputs({ framework: 'nextjs', apiLayer: 'orpc', reactQuery: true });
assert(orpcNext.includes('server/orpc/router.ts'), 'oRPC (Next.js) generates server/orpc/router.ts');
assert(orpcNext.includes('app/api/rpc/[[...rest]]/route.ts'), 'oRPC (Next.js) generates RPC route handler');
assert(orpcNext.includes('app/api/v1/[[...rest]]/route.ts'), 'oRPC (Next.js) generates OpenAPI route handler');
assert(orpcNext.includes('lib/orpc.ts'), 'oRPC (Next.js) generates lib/orpc.ts');

const orpcTan = outputs({ framework: 'tanstack', apiLayer: 'orpc' });
assert(orpcTan.includes('src/server/orpc/handlers.ts'), 'oRPC (TanStack) generates src/server/orpc/handlers.ts');
assert(orpcTan.includes('src/routes/api/rpc.$.ts') && orpcTan.includes('src/routes/api/v1.$.ts'), 'oRPC (TanStack) generates RPC + OpenAPI server routes');
assert(!orpcTan.some(f => f.startsWith('app/')), 'oRPC (TanStack) generates no Next.js app/ files');

const trpcNextRq = outputs({ framework: 'nextjs', apiLayer: 'trpc', reactQuery: true });
assert(trpcNextRq.includes('app/api/trpc/[trpc]/route.ts'), 'tRPC (Next.js) generates route handler');
assert(trpcNextRq.includes('lib/trpc/react.ts'), 'tRPC generates React Query hooks when React Query is selected');
const trpcTanNoRq = outputs({ framework: 'tanstack', apiLayer: 'trpc', reactQuery: false });
assert(trpcTanNoRq.includes('src/routes/api/trpc.$.ts'), 'tRPC (TanStack) generates server route');
assert(!trpcTanNoRq.some(f => f.endsWith('react.ts')), 'tRPC skips React Query hooks without React Query');

const vitestAndApi = outputs({ framework: 'nextjs', apiLayer: 'orpc', testing: 'both' });
assert(vitestAndApi.includes('vitest.config.ts') && vitestAndApi.includes('lib/orpc.ts'), 'Vitest and API scaffolds combine');

for (const answers of [
    { framework: 'nextjs', apiLayer: 'orpc', testing: 'both', reactQuery: true },
    { framework: 'tanstack', apiLayer: 'trpc', testing: 'vitest', reactQuery: true },
]) {
    assert(templatesExist(answers), `All scaffold templates exist (${answers.framework} + ${answers.apiLayer})`);
}

const renderScaffold = (tmpl, data) => Handlebars.compile(fs.readFileSync(path.join(rootDir, 'templates', tmpl), 'utf8'))(data);
const orpcClientRq = renderScaffold('api/orpc/client.ts.hbs', { useReactQuery: true });
const orpcClientPlain = renderScaffold('api/orpc/client.ts.hbs', { useReactQuery: false });
assert(orpcClientRq.includes('createTanstackQueryUtils'), 'oRPC client exports TanStack Query utils with React Query');
assert(!orpcClientPlain.includes('tanstack'), 'oRPC client has no TanStack Query import without React Query');
const orpcHandlers = renderScaffold('api/orpc/handlers.ts.hbs', { projectName: 'demo' });
assert(orpcHandlers.includes('OpenAPIReferencePlugin'), 'oRPC handlers serve OpenAPI spec & docs');
assert(orpcHandlers.includes("title: 'demo API'"), 'oRPC OpenAPI spec is titled after the project');
assert(renderScaffold('api/trpc/react.ts.hbs', { isNextjs: true }).startsWith("'use client';"), 'tRPC React hooks are a client module on Next.js');
assert(!renderScaffold('api/trpc/react.ts.hbs', { isNextjs: false }).includes('use client'), 'tRPC React hooks have no use client directive on TanStack');

const claudeOrpc = Handlebars.compile(claudeTmpl)({ ...mockData, isORPC: true });
assert(claudeOrpc.includes('server/orpc/'), 'CLAUDE.md shows server/orpc/ for oRPC');
assert(!claudeOrpc.includes('server/trpc/'), 'CLAUDE.md does NOT show server/trpc/ for oRPC');
const agentsTmpl = fs.readFileSync(path.join(rootDir, 'templates/AGENTS.md.hbs'), 'utf8');
const agentsTrpcTan = Handlebars.compile(agentsTmpl)({ ...tanstackConvexData, isConvex: false, isTRPC: true });
assert(agentsTrpcTan.includes('server/trpc/'), 'AGENTS.md shows server/trpc/ for tRPC (TanStack)');
assert(!Handlebars.compile(claudeTmpl)(mockData).includes('server/'), 'CLAUDE.md shows no server/ dir without an API layer');

// ============================================
// Test 10: Motion (motion.dev)
// ============================================
console.log('\n🎞️ Test 10: Motion (motion.dev)\n');

const motionItem = ALL_ITEMS.find(i => i.id === 'motion');
assert(motionItem, 'Motion item exists');
assert(motionItem.install.includes('motion') && !motionItem.install.includes('framer-motion'), 'Motion installs `motion`, not legacy `framer-motion`');
assert(motionItem.default === false, 'Motion is opt-in (default off)');
assert(!motionItem.frameworks, 'Motion is available for both frameworks');
assert(PACKAGE_GROUPS.find(g => g.items?.includes(motionItem))?.category === 'UI & Components', 'Motion is in UI & Components');
assert(motionItem.guidance.includes('motion/react-client'), 'Motion guidance covers Server Component import');

// ============================================
// Test 11: Package managers
// ============================================
console.log('\n📦 Test 11: Package managers\n');

assert(PACKAGE_MANAGER_IDS.join(',') === 'npm,pnpm,yarn,bun', 'Supports npm, pnpm, yarn, bun');

// Detection from the launching package manager's user agent
assert(detectPackageManager('pnpm/11.17.0 npm/? node/v22.23.1 darwin arm64') === 'pnpm', 'Detects pnpm from user agent');
assert(detectPackageManager('yarn/1.22.22 npm/? node/v22.23.1 darwin arm64') === 'yarn', 'Detects yarn from user agent');
assert(detectPackageManager('bun/1.2.4 npm/? node/v24.3.0 darwin arm64') === 'bun', 'Detects bun from user agent');
assert(detectPackageManager('npm/10.9.8 node/v22.23.1 darwin arm64 workspaces/false') === 'npm', 'Detects npm from user agent');
assert(detectPackageManager(undefined) === null, 'No user agent → null');
assert(detectPackageManager('deno/2.0.0') === null, 'Unsupported package manager → null');

// Prompt choices & default
const someInstalled = { npm: '10.9.8', pnpm: '11.17.0', yarn: null, bun: '1.2.4' };
const choices = packageManagerChoices(someInstalled);
assert(choices.length === 4, 'Prompt lists all 4 package managers');
assert(choices.find(c => c.value === 'yarn').disabled === 'not installed', 'Missing package manager is shown but disabled');
assert(!choices.find(c => c.value === 'pnpm').disabled && choices.find(c => c.value === 'pnpm').name.includes('11.17.0'), 'Installed package manager shows its version');
assert(defaultPackageManager(someInstalled, 'pnpm') === 'pnpm', 'Defaults to the launching package manager');
assert(defaultPackageManager(someInstalled, 'yarn') === 'npm', 'Falls back to npm when the launching package manager is not installed');
assert(defaultPackageManager(someInstalled, null) === 'npm', 'Falls back to npm when launch package manager is unknown');

// Install commands
const join = (cmd) => cmd.join(' ');
assert(join(resolveAdd('npm', ['zod'])) === 'npm install --legacy-peer-deps zod', 'npm install keeps --legacy-peer-deps');
assert(join(resolveAdd('npm', ['vitest'], { dev: true })) === 'npm install -D --legacy-peer-deps vitest', 'npm dev install');
assert(join(resolveAdd('pnpm', ['zod'])) === 'pnpm add zod', 'pnpm add');
assert(join(resolveAdd('pnpm', ['vitest'], { dev: true })) === 'pnpm add -D vitest', 'pnpm add -D');
assert(join(resolveAdd('yarn', ['vitest'], { dev: true })) === 'yarn add -D vitest', 'yarn add -D');
assert(join(resolveAdd('bun', ['vitest'], { dev: true })) === 'bun add -d vitest', 'bun add -d');
for (const pm of ['pnpm', 'yarn', 'bun']) {
    assert(!resolveAdd(pm, ['x']).includes('--legacy-peer-deps'), `${pm} does NOT get npm's --legacy-peer-deps flag`);
    assert(Object.keys(PACKAGE_MANAGERS[pm].env).length === 0, `${pm} does NOT get npm-only env vars`);
}

// One-off (dlx) and local binary (exec) commands
assert(join(resolveDlx('npm', ['shadcn@latest', 'init'])) === 'npx --yes shadcn@latest init', 'npm dlx → npx --yes');
assert(join(resolveDlx('pnpm', ['shadcn@latest', 'init'])) === 'pnpm dlx shadcn@latest init', 'pnpm dlx');
assert(join(resolveDlx('yarn', ['shadcn@latest', 'init'], '4.9.1')) === 'yarn dlx shadcn@latest init', 'Yarn 2+ dlx');
assert(join(resolveDlx('yarn', ['shadcn@latest', 'init'], '1.22.22')) === 'npx --yes shadcn@latest init', 'Yarn 1 has no dlx → falls back to npx');
assert(join(resolveDlx('bun', ['shadcn@latest', 'init'])) === 'bunx shadcn@latest init', 'bun dlx → bunx');
assert(join(resolveExec('pnpm', ['playwright', 'install'])) === 'pnpm exec playwright install', 'pnpm exec');
assert(join(resolveExec('yarn', ['playwright', 'install'])) === 'yarn playwright install', 'yarn exec');
assert(join(resolveExec('bun', ['playwright', 'install'])) === 'bunx playwright install', 'bun exec');
assert(join(resolveCommand('pnpm', { dlx: ['a'] })) === 'pnpm dlx a' && join(resolveCommand('pnpm', { exec: ['b'] })) === 'pnpm exec b', 'resolveCommand handles dlx + exec');
let threw = false;
try { resolveCommand('npm', ['npx', 'x']); } catch { threw = true; }
assert(threw, 'resolveCommand rejects legacy array commands');

// Every package command uses the package-manager-neutral shape
const allConfigs = [
    ...ALL_ITEMS,
    ...PACKAGE_GROUPS.filter(g => g.type === 'list').flatMap(g => Object.values(g.providerConfig)),
];
const allCommands = allConfigs.flatMap(c => c.commands || []);
assert(allCommands.length > 0, `Found ${allCommands.length} package commands`);
assert(allCommands.every(c => !Array.isArray(c) && (Array.isArray(c.dlx) || Array.isArray(c.exec))), 'Every package command is { dlx } or { exec }');
// Resolved for both frameworks, so guidance written as a function of the answers is checked too
const allText = ['nextjs', 'tanstack'].flatMap(framework => allConfigs.map(c => resolveConfig(c, { framework, apiLayer: 'orpc', posthog: true, sentry: true })))
    .flatMap(c => [c.guidance, ...(c.envVars || []).map(e => e.comment)]).filter(Boolean);
assert(allText.every(t => typeof t === 'string'), 'Every resolved guidance and env comment is a string');
assert(allText.every(t => !/\bnpx\b|\bnpm (run|test|start|install)\b/.test(t)), 'No guidance/env comment hardcodes npm/npx (use {pm:*} tokens)');

// Script commands in docs
assert(docCommands('npm').run === 'npm run' && docCommands('pnpm').run === 'pnpm' && docCommands('yarn').run === 'yarn', 'Script run prefixes for npm/pnpm/yarn');
assert(docCommands('bun').run === 'bun run', 'bun uses `bun run` (so `test` runs the script, not Bun\'s test runner)');
assert(docCommands('npm').dlx === 'npx', 'npm doc dlx is npx (no --yes)');
assert(docCommands('yarn', '1.22.22').dlx === 'npx' && docCommands('yarn', '4.9.1').dlx === 'yarn dlx', 'Yarn doc dlx depends on version');
assert(docCommands('pnpm').add === 'pnpm add' && docCommands('npm').add === 'npm install', 'Doc add commands');
assert(applyDocCommands('Run `{pm:run} test`, `{pm:exec} biome`, `{pm:dlx} x`', docCommands('pnpm')) === 'Run `pnpm test`, `pnpm exec biome`, `pnpm dlx x`', 'applyDocCommands replaces all tokens');
const convexCloudPkg = PACKAGE_GROUPS.find(g => g.id === 'database').providerConfig.convex_cloud;
const localizedConvex = localizePackage(convexCloudPkg, docCommands('bun'));
assert(localizedConvex.guidance.includes('`bunx convex dev`') && localizedConvex.envVars[0].comment.includes('bunx convex dev'), 'localizePackage resolves guidance + env var comments');
assert(convexCloudPkg.guidance.includes('{pm:exec}'), 'localizePackage does not mutate the shared config');

// Templates render per package manager with no leftovers
const pmTemplates = ['CLAUDE.md.hbs', 'AGENTS.md.hbs', 'README.md.hbs'].map(f => [f, fs.readFileSync(path.join(rootDir, 'templates', f), 'utf8')]);
const vitestPkg = testGroup.providerConfig.both;
for (const pm of PACKAGE_MANAGER_IDS) {
    const cmds = docCommands(pm, pm === 'yarn' ? '1.22.22' : undefined);
    const data = { ...mockData, isVitest: true, isPlaywright: true, pm: cmds, selectedPackages: [localizePackage(vitestPkg, cmds)] };
    for (const [file, tmpl] of pmTemplates) {
        const out = Handlebars.compile(tmpl)(data);
        assert(out.includes(`${cmds.run} dev`), `${file} (${pm}) shows \`${cmds.run} dev\``);
        assert(!out.includes('{pm:'), `${file} (${pm}) has no unresolved {pm:*} tokens`);
        if (pm !== 'npm') assert(!/\bnpm run\b|\bnpx\b|\bnpm test\b/.test(out), `${file} (${pm}) has no npm/npx commands`);
    }
    const claude = Handlebars.compile(pmTemplates[0][1])(data);
    assert(claude.includes(`Package manager: **${pm}**`), `CLAUDE.md (${pm}) names the package manager`);
    assert(claude.includes(`\`${cmds.run} test\``) && claude.includes(`\`${cmds.exec} playwright test\``), `CLAUDE.md (${pm}) test commands use ${pm}`);
    const agents = Handlebars.compile(pmTemplates[1][1])(data);
    assert(agents.includes(`**Package Manager**: ${pm}`) && agents.includes(`\`${cmds.run} build\``), `AGENTS.md (${pm}) names the package manager and its commands`);
    const vitestCfg = Handlebars.compile(vitestConfigTmpl)({ isPlaywright: true, pm: cmds });
    assert(vitestCfg.includes(`\`${cmds.exec} playwright test\``), `vitest.config.ts comment (${pm}) uses ${cmds.exec}`);
}
assert(Handlebars.compile(pmTemplates[0][1])({ ...mockData, isVitest: true, pm: docCommands('bun') }).includes('`bun run test`'), 'CLAUDE.md (bun) uses `bun run test`, not `bun test`');

// Wizard wiring: prompt order and next-steps message
const { default: registerPlopfile } = await import('../plopfile.js');
let generator;
registerPlopfile({ setGenerator: (_name, config) => { generator = config; }, setActionType: () => {} });
const promptNames = generator.prompts.map(p => p.name);
const pmPrompt = generator.prompts.find(p => p.name === 'packageManager');
assert(pmPrompt && pmPrompt.type === 'list', 'Wizard has a packageManager list prompt');
assert(promptNames.indexOf('packageManager') === promptNames.indexOf('framework') + 1, 'packageManager is asked right after framework');
assert(pmPrompt.choices.map(c => c.value).join(',') === 'npm,pnpm,yarn,bun', 'packageManager prompt offers npm, pnpm, yarn, bun');
assert(!pmPrompt.choices.find(c => c.value === 'npm').disabled, 'npm is always selectable');
const nextSteps = (pm) => generator.actions({ projectName: 'demo', framework: 'nextjs', packageManager: pm }).find(a => typeof a === 'string' && a.includes('Next steps'));
assert(nextSteps('pnpm').includes('pnpm dev') && nextSteps('bun').includes('bun run dev'), 'Next steps message uses the chosen package manager');
assert(nextSteps(undefined).includes('npm run dev'), 'Next steps message defaults to npm');

// ============================================
// Test 12: Effect (effect-ts)
// ============================================
console.log('\n⚡ Test 12: Effect (effect-ts)\n');

const effectItem = ALL_ITEMS.find(i => i.id === 'effect');
assert(effectItem, 'Effect item exists');
assert(effectItem.install.join(',') === 'effect', 'Effect installs only `effect` (v4 bundles http/rpc/sql/schema)');
assert(effectItem.default === false, 'Effect is opt-in (default off)');
assert(!effectItem.frameworks, 'Effect is available for both frameworks');
assert(PACKAGE_GROUPS.find(g => g.items?.includes(effectItem))?.category === 'Effect System', 'Effect is in its own Effect System category');
assert(!effectItem.install.some(p => p.startsWith('@effect/')), 'Effect does NOT install v3-era @effect/* packages');
for (const v4Name of ['Context.Service', 'Schema.TaggedError', 'Effect.fn', 'Effect.catchTag', 'runEffect']) {
    assert(effectItem.guidance.includes(v4Name), `Effect guidance mentions ${v4Name}`);
}

const effectNext = outputs({ framework: 'nextjs', effect: true });
assert(effectNext.includes('lib/effect/greeter.ts') && effectNext.includes('lib/effect/runtime.ts'), 'Effect (Next.js) generates lib/effect/{greeter,runtime}.ts');
const effectTan = outputs({ framework: 'tanstack', effect: true });
assert(effectTan.includes('src/lib/effect/greeter.ts') && effectTan.includes('src/lib/effect/runtime.ts'), 'Effect (TanStack) generates src/lib/effect/{greeter,runtime}.ts');
assert(!outputs({ framework: 'nextjs', effect: false }).some(f => f.includes('effect')), 'No Effect files when Effect is not selected');
assert(templatesExist({ framework: 'nextjs', effect: true, apiLayer: 'trpc', testing: 'vitest' }), 'All scaffold templates exist (Effect + tRPC + Vitest)');

const effectTmplDir = path.join(rootDir, 'templates/effect');
const runtimeTmpl = fs.readFileSync(path.join(effectTmplDir, 'runtime.ts.hbs'), 'utf8');
const greeterTmpl = fs.readFileSync(path.join(effectTmplDir, 'greeter.ts.hbs'), 'utf8');
const runtimeNext = Handlebars.compile(runtimeTmpl)({ isNextjs: true, isTanStack: false });
const runtimeTan = Handlebars.compile(runtimeTmpl)({ isNextjs: false, isTanStack: true });
assert(runtimeNext.includes("'use server'") && !runtimeNext.includes('createServerFn'), 'runtime.ts (Next.js) shows a Server Action example');
assert(runtimeTan.includes('createServerFn') && runtimeTan.includes('.validator(') && !runtimeTan.includes("'use server'"), 'runtime.ts (TanStack) shows a server function example');
assert(runtimeNext.includes('ManagedRuntime.make(AppLayer)'), 'runtime.ts builds a ManagedRuntime from AppLayer');
assert(!/\{\{|\}\}/.test(runtimeNext) && !/\{\{|\}\}/.test(Handlebars.compile(greeterTmpl)({})), 'Effect templates render with no leftover Handlebars');
for (const v3Only of ['Effect.catchAll', 'Context.Tag', 'Effect.Service', '@effect/schema']) {
    assert(!runtimeTmpl.includes(v3Only) && !greeterTmpl.includes(v3Only), `Effect templates do NOT use v3-only ${v3Only}`);
}

for (const [label, data] of [['Next.js', { ...mockData, isEffect: true }], ['TanStack', { ...mockData, isNextjs: false, isTanStack: true, isEffect: true }]]) {
    for (const file of ['CLAUDE.md.hbs', 'AGENTS.md.hbs']) {
        const out = Handlebars.compile(fs.readFileSync(path.join(rootDir, 'templates', file), 'utf8'))(data);
        assert(out.includes('effect/') && out.includes('runtime.ts'), `${file} (${label}) lists lib/effect/ when Effect is selected`);
    }
}
assert(!Handlebars.compile(claudeTmpl)(mockData).includes('runtime.ts'), 'CLAUDE.md does NOT list lib/effect/ without Effect');

// ============================================
// Test 13: Phased development workflow
// ============================================
console.log('\n🧭 Test 13: Phased development workflow\n');

const renderHbs = (tmpl, data) => Handlebars.compile(tmpl)(data);
const readTemplate = (rel) => fs.readFileSync(path.join(rootDir, 'templates', rel), 'utf8');

assert(WORKFLOW_IDS.join(',') === 'light,gated,none', 'Workflows: light, gated, none');
assert(DEFAULT_WORKFLOW === 'light', 'Default workflow is light');
const wfPrompt = generator.prompts.find(p => p.name === 'workflow');
assert(wfPrompt && wfPrompt.type === 'list' && wfPrompt.default === 'light', 'Wizard has a workflow list prompt defaulting to light');
assert(promptNames.indexOf('workflow') === promptNames.indexOf('isClaudeCode') + 1, 'workflow is asked right after the CLAUDE.md / AGENTS.md question');
assert(wfPrompt.choices.map(c => c.value).join(',') === 'light,gated,none', 'workflow prompt offers light, gated, none');

// Files per workflow
assert(getWorkflowFiles({ workflow: 'none', isClaudeCode: true }).length === 0, 'No workflow files for none');
assert(getWorkflowFiles({}).length === 0, 'No workflow files when unanswered');
const docsOnly = getWorkflowFiles({ workflow: 'light', isClaudeCode: false });
const withSkills = getWorkflowFiles({ workflow: 'gated', isClaudeCode: true });
assert(docsOnly.length === 13 && docsOnly.every(([, out]) => out.startsWith('docs/')), 'AGENTS.md projects get the 13 docs/ files and no skills');
assert(withSkills.length === 18, 'Claude Code projects get docs/ plus 5 skills');
const skillOutputs = withSkills.filter(([, out]) => out.startsWith('.claude/skills/')).map(([, out]) => out);
assert(skillOutputs.join(',') === ['handoff', 'backend-review', 'security-review', 'frontend-review', 'docs-review'].map(n => `.claude/skills/${n}/SKILL.md`).join(','), 'Skills: handoff, backend, security, frontend, docs reviews');
for (const out of ['docs/phases/SPEC_MASTER_CHECKLIST.md', 'docs/phases/SPEC_TEMPLATE.md', 'docs/decisions/ADR_TEMPLATE.md', 'docs/decisions/0001-product-development-workflow.md', 'docs/decisions/0002-the-starting-stack.md', 'docs/reviews/README.md', 'docs/handoffs/README.md', 'docs/spikes/SPIKE_TEMPLATE.md', 'docs/phases/phase-production/SPEC_PRODUCTION_READINESS.md']) {
    assert(withSkills.some(([, o]) => o === out), `Workflow generates ${out}`);
}
assert(withSkills.every(([tmpl]) => fs.existsSync(path.join(rootDir, 'templates', tmpl))), 'Every workflow template exists');
const scaffoldWithWorkflow = getScaffoldFiles({ projectName: 'demo', framework: 'nextjs', workflow: 'light', isClaudeCode: true }, docCommands('npm')).files;
assert(scaffoldWithWorkflow.length === 18, 'getScaffoldFiles includes the workflow files');

// Flags
const wfLight = workflowData('light', { isClaudeCode: true });
const wfGatedAgents = workflowData('gated', { isClaudeCode: false });
assert(wfLight.hasWorkflow && wfLight.isLight && !wfLight.isGated && wfLight.hasSkills, 'light flags');
assert(wfGatedAgents.isGated && !wfGatedAgents.hasSkills, 'gated without Claude Code has no skills');
assert(!workflowData('bogus').hasWorkflow && workflowData(undefined).workflow === 'none', 'Unknown or missing workflow → none');
assert(wfLight.reviewSkills.length === REVIEW_SKILLS.length && wfLight.reviewSkills.every(r => r.when), 'reviewSkills carry a when for the chosen rigor');
assert(workflowData('gated').reviewSkills.find(r => r.id === 'backend-review').when === 'Every sub-phase', 'gated: backend review every sub-phase');

// The gate's scripts
assert(gateScripts({ dev: 'next dev', lint: 'eslint' }, { isNextjs: true, run: 'pnpm' }).typecheck === 'next typegen && tsc --noEmit', 'Next.js typecheck generates route types first');
assert(gateScripts({}, { isNextjs: false, run: 'npm run' }).typecheck === 'tsc --noEmit', 'TanStack typecheck without generate-routes is tsc --noEmit');
assert(gateScripts({ 'generate-routes': 'vite build' }, { isNextjs: false, run: 'bun run' }).typecheck === 'bun run generate-routes && tsc --noEmit', 'TanStack typecheck generates the route tree first (a fresh clone has none)');
assert(gateScripts({ lint: 'eslint', test: 'vitest run' }, { isNextjs: true, run: 'pnpm' }).check === 'pnpm typecheck && pnpm lint && pnpm test', 'check runs typecheck, lint and test when present');
assert(gateScripts({}, { isNextjs: false, run: 'bun run' }).check === 'bun run typecheck', 'check skips missing lint/test scripts');
const kept = gateScripts({ typecheck: 'custom', check: 'custom' }, { isNextjs: true, run: 'npm run' });
assert(Object.keys(kept).length === 0, 'Existing typecheck/check scripts are never replaced');

// Rendering
assert(/^\d{4}-\d{2}-\d{2}$/.test(localDate()) && localDate(new Date(2026, 0, 5, 23, 30)) === '2026-01-05', 'localDate is YYYY-MM-DD in local time');
const dataFor = (answers) => {
    const cmds = docCommands(answers.packageManager || 'npm');
    return buildTemplateData(answers, { projectName: 'demo-app', selectedPackages: selectPackages(answers).map(p => localizePackage(p, cmds)), pm: cmds }, renderHbs);
};
const combos = {
    gatedClaude: { framework: 'nextjs', packageManager: 'pnpm', workflow: 'gated', isClaudeCode: true, zod: true, shadcn: true, database: 'postgres', apiLayer: 'orpc', betterAuth: true, aiSdk: true, paymentProvider: 'stripe', effect: true, testing: 'both', mcp: true, jobs: 'pgboss', uploads: 'r2', posthog: true, sentry: true },
    lightAgentsJobs: { framework: 'tanstack', packageManager: 'yarn', workflow: 'light', isClaudeCode: true, database: 'none', jobs: 'inngest', uploads: 'uploadthing', mcp: true, sentry: true },
    lightAgents: { framework: 'tanstack', packageManager: 'bun', workflow: 'light', isClaudeCode: false, database: 'convex_cloud', testing: 'none' },
    lightClaudeMin: { framework: 'nextjs', packageManager: 'npm', workflow: 'light', isClaudeCode: true, database: 'none', testing: 'vitest' },
    none: { framework: 'nextjs', packageManager: 'npm', workflow: 'none', isClaudeCode: true, database: 'supabase' },
};
const rendered = {};
for (const [name, answers] of Object.entries(combos)) {
    const data = dataFor(answers);
    const docFile = answers.isClaudeCode ? 'CLAUDE.md' : 'AGENTS.md';
    const files = [...getWorkflowFiles(answers), [`${docFile}.hbs`, docFile], ['README.md.hbs', 'README.md']];
    rendered[name] = {};
    for (const [tmpl, out] of files) {
        const text = renderHbs(readTemplate(tmpl), data);
        rendered[name][out] = text;
        const bad = [];
        if (/\{\{|\}\}/.test(text)) bad.push('Handlebars leftover');
        if (/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot);/.test(text)) bad.push('HTML-escaped text');
        if (/\bundefined\b|\[object Object\]/.test(text)) bad.push('undefined');
        if (/\{pm:/.test(text)) bad.push('{pm:*} token');
        if (/\n\n\n/.test(text)) bad.push('triple blank line');
        if (bad.length) assert(false, `${name}: ${out} renders cleanly (${bad.join(', ')})`);
    }
    assert(Object.keys(rendered[name]).length === files.length, `${name}: ${files.length} files render cleanly`);
}
assert(dataFor(combos.gatedClaude).workflowSection.startsWith('## Workflow') && dataFor(combos.gatedClaude).conventionsSection.startsWith('- **One definition per concept'), 'buildTemplateData renders the workflow and conventions sections');
assert(!('workflowSection' in dataFor(combos.none)), 'No workflow section when workflow is none');

const gatedDoc = rendered.gatedClaude['CLAUDE.md'];
const lightAgentsDoc = rendered.lightAgents['AGENTS.md'];
const lightMinDoc = rendered.lightClaudeMin['CLAUDE.md'];
const noneDoc = rendered.none['CLAUDE.md'];
assert(gatedDoc.includes('**Start here:**') && gatedDoc.includes('## Status'), 'CLAUDE.md starts with Start here + Status');
assert(gatedDoc.indexOf('**Start here:**') < gatedDoc.indexOf('## Tech Stack'), 'Start here comes before the tech stack');
assert(gatedDoc.includes('**REVIEW & MEASURE (the gate):** `pnpm check` is green'), 'gated: REVIEW & MEASURE gate with the package manager\'s check');
assert(!gatedDoc.includes('**Reviews:** no formal gates'), 'gated: no light-review paragraph');
assert(lightMinDoc.includes('**Reviews:** no formal gates') && !lightMinDoc.includes('REVIEW & MEASURE'), 'light: reviews on demand, no gate step');
assert(gatedDoc.includes('### Skills (`.claude/skills/`)') && gatedDoc.includes('| `security-review` |'), 'CLAUDE.md lists the skills');
assert(gatedDoc.includes('.claude/skills/   # Review and handoff skills') && gatedDoc.includes('docs/             # Research'), 'CLAUDE.md tree shows docs/ and .claude/skills/');
assert(gatedDoc.includes('- Check (the gate: typecheck, lint, unit tests): `pnpm check`'), 'Next.js + Vitest check label');
assert(gatedDoc.includes('### Spikes (before building anything uncertain)') && gatedDoc.includes('### ADRs (Architecture Decision Records)'), 'Workflow has the Spikes and ADRs sections the docs link to');
assert(gatedDoc.includes('**One definition per concept:**') && gatedDoc.includes('**Schemas:** Zod at every boundary'), 'CLAUDE.md conventions include registries and Zod (when Zod is selected)');
assert(!lightAgentsDoc.includes('**Schemas:** Zod'), 'No Zod convention without Zod');
assert(gatedDoc.indexOf('## Workflow') > gatedDoc.indexOf('## Directory Structure') && gatedDoc.indexOf('## Workflow') < gatedDoc.indexOf('## Code Conventions'), 'Workflow sits between Directory Structure and Code Conventions');
assert(lightAgentsDoc.includes('## Workflow') && lightAgentsDoc.includes('**Start here:**'), 'AGENTS.md gets the workflow too');
assert(!lightAgentsDoc.includes('.claude/skills') && lightAgentsDoc.includes('write `docs/handoffs/HANDOFF_PHASE_<PHASE>_<SLUG>.md`'), 'AGENTS.md: no skills, handoffs written by hand');
assert(lightAgentsDoc.includes('- Check (the gate: typecheck): `bun run check`'), 'TanStack without tests: check label is typecheck only');
assert(lightAgentsDoc.includes('`src/lib/constants.ts`') && lightAgentsDoc.includes('server functions and server routes'), 'AGENTS.md (TanStack) conventions use src/ and server functions');
assert(!noneDoc.includes('## Workflow') && !noneDoc.includes('Start here') && !noneDoc.includes('pnpm check') && !noneDoc.includes('`npm run check`'), 'workflow none: CLAUDE.md has no workflow, Start here or check');

// docs/ files
const gatedFiles = rendered.gatedClaude;
assert(gatedFiles['docs/decisions/0001-product-development-workflow.md'].includes('4. **Gated:**') && gatedFiles['docs/decisions/0001-product-development-workflow.md'].includes('Chosen: correctness'), 'ADR 0001 records the gated choice');
assert(rendered.lightAgents['docs/decisions/0001-product-development-workflow.md'].includes('4. **Light:**') && rendered.lightAgents['docs/decisions/0001-product-development-workflow.md'].includes('`AGENTS.md` → Workflow'), 'ADR 0001 records light + points at AGENTS.md');
const adr2 = gatedFiles['docs/decisions/0002-the-starting-stack.md'];
assert(adr2.includes('Next.js (App Router)') && adr2.includes('**Package manager:** pnpm') && adr2.includes('- Postgres + Drizzle') && adr2.includes('- oRPC'), 'ADR 0002 lists the framework, package manager and selected packages');
assert(adr2.includes(`**Date:** ${localDate()}`), 'ADRs are dated today');
const specTmpl = gatedFiles['docs/phases/SPEC_TEMPLATE.md'];
assert(specTmpl.includes('## Schema changes') && specTmpl.includes('## Query budget') && specTmpl.includes('oRPC procedure and REST route'), 'SPEC_TEMPLATE has schema + query budget with a database and names the API layer');
assert(specTmpl.includes('- [ ] Reviews run and recorded'), 'gated SPEC_TEMPLATE exit checklist includes reviews');
assert(!rendered.lightClaudeMin['docs/phases/SPEC_TEMPLATE.md'].includes('## Schema changes') && !rendered.lightClaudeMin['docs/phases/SPEC_TEMPLATE.md'].includes('Reviews run and recorded'), 'light SPEC_TEMPLATE without a database: no schema section, no review exit item');
assert(rendered.lightAgents['docs/spikes/README.md'].includes('(../../AGENTS.md#spikes-before-building-anything-uncertain)'), 'docs link to the doc file that exists (AGENTS.md)');
assert(gatedFiles['docs/decisions/README.md'].includes('(../../CLAUDE.md#adrs-architecture-decision-records)'), 'decisions README links CLAUDE.md#adrs…');

const skillsJobs = rendered.gatedClaude['.claude/skills/backend-review/SKILL.md'];
assert(skillsJobs.includes('**MCP:**') && skillsJobs.includes('**Background jobs:**') && skillsJobs.includes('only the jobs module imports pg-boss') && skillsJobs.includes('presigned URLs are short-lived'), 'backend-review gains MCP, pg-boss and R2 checklist lines');
const secInn = rendered.lightAgentsJobs['.claude/skills/security-review/SKILL.md'];
assert(secInn.includes('**MCP endpoint:**') && secInn.includes('Inngest endpoint verifies the signing key') && secInn.includes('**Uploads:**') && secInn.includes('**Error tracking (Sentry):**') && !secInn.includes('PostHog'), 'security-review gains MCP, Inngest, uploads and Sentry lines (no PostHog line without PostHog)');
// Skills
for (const [out, text] of Object.entries(gatedFiles).filter(([o]) => o.startsWith('.claude/skills/'))) {
    const skill = out.split('/')[2];
    const fm = text.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
    assert(fm && fm[1] === skill, `${skill}: frontmatter name matches its folder`);
    assert(fm && !fm[2].includes(': ') && !fm[2].startsWith('"') && fm[2].length < 1024, `${skill}: description is a valid plain YAML scalar under 1024 chars`);
}
const backendGated = gatedFiles['.claude/skills/backend-review/SKILL.md'];
assert(backendGated.includes('generated migration') && backendGated.includes('**Effect 4:**') && backendGated.includes('**LLM calls:**') && backendGated.includes('**Payments:**') && backendGated.includes('**Sessions (Better Auth):**'), 'backend-review includes the stack\'s checklist lines (Drizzle, Effect, AI, payments, Better Auth)');
const backendMin = rendered.lightClaudeMin['.claude/skills/backend-review/SKILL.md'];
assert(!backendMin.includes('migration') && !backendMin.includes('**Effect 4:**') && !backendMin.includes('**Payments:**'), 'backend-review leaves out lines for parts the stack lacks');
assert(rendered.lightClaudeMin['.claude/skills/security-review/SKILL.md'].includes('`npm audit`') && gatedFiles['.claude/skills/security-review/SKILL.md'].includes('`pnpm audit`'), 'security-review audits with the chosen package manager');
assert(gatedFiles['.claude/skills/security-review/SKILL.md'].includes('`NEXT_PUBLIC_` prefix') && gatedFiles['.claude/skills/frontend-review/SKILL.md'].includes('**shadcn, one way:**'), 'security/frontend reviews adapt to Next.js and shadcn');
for (const text of Object.values(gatedFiles)) {
    for (const leak of ['treg', 'Ketty', 'Maestro', 'social-listening', 'seo-auditor', '/Users/']) {
        if (text.includes(leak)) assert(false, `Generated workflow files never mention ${leak}`);
    }
}
assert(true, 'Generated workflow files carry no product names or local paths from the source apps');

// Agent files and lint config the scaffolders write
const nextRules = '<!-- BEGIN:nextjs-agent-rules -->\n## This is NOT the Next.js you know\n<!-- END:nextjs-agent-rules -->';
const merged = mergeAgentsMd('# Agent Guidance\n', `${nextRules}\n`);
assert(merged.startsWith(nextRules) && merged.includes('# Agent Guidance'), 'AGENTS.md keeps create-next-app\'s Next.js rules block at the top');
assert(mergeAgentsMd('# Ours\n', null) === '# Ours\n' && mergeAgentsMd('# Ours\n', '# someone else\n') === '# Ours\n', 'AGENTS.md without a Next.js block is just ours');
assert(mergeAgentsMd(merged, `${nextRules}\n`) === merged, 'mergeAgentsMd never adds the block twice');
assert(gatedDoc.includes('@AGENTS.md') && !rendered.lightAgents['AGENTS.md'].includes('@AGENTS.md'), 'CLAUDE.md (Next.js) imports AGENTS.md for Next\'s rules');
assert(!renderHbs(claudeTmpl, { ...mockData, isNextjs: false, isTanStack: true }).includes('@AGENTS.md'), 'CLAUDE.md (TanStack) has no AGENTS.md import');
const cnaEslint = 'export default defineConfig([\n  ...nextVitals,\n  globalIgnores([\n    ".next/**",\n    "next-env.d.ts",\n  ]),\n]);\n';
const withIgnores = addEslintIgnores(cnaEslint);
assert(SHADCN_GENERATED.every(p => withIgnores.includes(`"${p}",`)) && withIgnores.includes('".next/**"'), 'ESLint ignores shadcn\'s generated files, keeping the defaults');
assert(addEslintIgnores(withIgnores) === null, 'Adding the ESLint ignores is idempotent');
assert(addEslintIgnores('export default [];') === null, 'An ESLint config without globalIgnores is left alone');
// shadcn on each framework
const shadcnItem = ALL_ITEMS.find(i => i.id === 'shadcn');
const shadcnFor = (fw) => shadcnItem.commands.filter(c => !c.frameworks || c.frameworks.includes(fw)).map(c => c.dlx.join(' '));
assert(shadcnFor('nextjs').join(' | ') === 'shadcn@latest init -d | shadcn@latest add --all -y', 'shadcn on Next.js: init -d, then add --all');
assert(shadcnFor('tanstack').join(' | ') === 'shadcn@latest init -t start -b base -p nova --no-monorepo -y | shadcn@latest add --all -y', 'shadcn on TanStack Start: the start template (not -d, which means --template=next), no monorepo prompt');
const tanTsconfig = '{\n  // comment\n  "compilerOptions": {\n    "paths": {\n      "#/*": ["./src/*"],\n      "@/*": ["./src/*"]\n    }\n  }\n}\n';
const fixedTs = preferAtAlias(tanTsconfig);
assert(fixedTs && fixedTs.indexOf('"@/*"') < fixedTs.indexOf('"#/*"') && fixedTs.includes('// comment'), 'preferAtAlias moves @/* before #/*, keeping both and the comments');
assert(preferAtAlias(fixedTs) === null && preferAtAlias('{"paths":{"@/*":["./*"]}}') === null, 'preferAtAlias leaves an already-good tsconfig alone');
const unusedReact = 'import * as React from "react"\nimport { ScrollArea as Primitive } from "@base-ui/react/scroll-area"\n\nexport function ScrollArea() { return <Primitive.Root /> }\n';
assert(dropUnusedReactImport(unusedReact) === unusedReact.split('\n').slice(1).join('\n'), 'Drops an unused `import * as React`, leaving the rest');
assert(dropUnusedReactImport('import * as React from "react"\nexport const X = React.forwardRef(() => null)\n') === null, 'Keeps the React import when React is used');
assert(dropUnusedReactImport('import { useState } from "react"\n') === null, 'Ignores files without a namespace React import');
assert(hasNoUnusedLocals('{\n  // c\n  "compilerOptions": { "noUnusedLocals": true }\n}') && !hasNoUnusedLocals('{"compilerOptions":{"strict":true}}'), 'Detects noUnusedLocals in a tsconfig with comments');
assert(ALL_ITEMS.find(i => i.id === 'effect').guidance.includes('node_modules/effect/CLAUDE.md'), 'Effect guidance points at Effect\'s bundled agent guide');

// ============================================
// Test 14: Selection (installs per framework, choices with requirements)
// ============================================
console.log('\n🧩 Test 14: Selection\n');

const cfg = { install: ['a'], installByFramework: { nextjs: ['a-next'], tanstack: ['a-start'] }, devInstall: ['d'], devInstallNextjs: ['d-next'], devInstallByFramework: { tanstack: ['d-start'] }, installWithReactQuery: ['a-rq'] };
const next = resolveConfig(cfg, { framework: 'nextjs', reactQuery: true });
const start = resolveConfig(cfg, { framework: 'tanstack', reactQuery: false });
assert(next.install.join(',') === 'a,a-next,a-rq' && next.devInstall.join(',') === 'd,d-next', 'resolveConfig (Next.js + React Query): framework and React Query installs merged');
assert(start.install.join(',') === 'a,a-start' && start.devInstall.join(',') === 'd,d-start', 'resolveConfig (TanStack): its own installs, no Next-only dev deps');
assert(!('install' in resolveConfig({ name: 'x' }, { framework: 'nextjs' })), 'resolveConfig adds no empty install list');
assert(cfg.install.length === 1, 'resolveConfig does not mutate the shared config');

const sel = selectPackages({ framework: 'nextjs', zod: true, database: 'postgres', testing: 'vitest', apiLayer: 'none' });
assert(sel.some(p => p.id === 'zod') && sel.some(p => p.id === 'database_postgres') && sel.some(p => p.id === 'testing_vitest'), 'selectPackages returns items and list choices with ids');
assert(sel.find(p => p.id === 'testing_vitest').devInstall.includes('vite'), 'selectPackages applies devInstallNextjs (vite for Vitest on Next.js)');
assert(!selectPackages({ framework: 'tanstack', testing: 'vitest' }).find(p => p.id === 'testing_vitest').devInstall.includes('vite'), 'selectPackages leaves vite out on TanStack');
assert(!selectPackages({ framework: 'nextjs', database: 'none' }).some(p => p.id?.startsWith('database_')), 'selectPackages skips "none"');

const reqGroup = { choices: [{ name: 'None', value: 'none' }, { name: 'Needs PG', value: 'pg', requires: (a) => (a.database === 'postgres' ? null : 'needs Postgres') }] };
const plainGroup = { choices: [{ name: 'A', value: 'a' }] };
assert(listChoices(plainGroup) === plainGroup.choices, 'listChoices passes plain choices through');
const reqChoices = listChoices(reqGroup);
assert(typeof reqChoices === 'function', 'listChoices returns a function when a choice has requirements');
assert(reqChoices({ database: 'none' }).find(c => c.value === 'pg').disabled === 'needs Postgres', 'A choice whose requirement fails is disabled with the reason');
assert(!reqChoices({ database: 'postgres' }).find(c => c.value === 'pg').disabled, 'A choice whose requirement holds is selectable');
assert(reqChoices({ database: 'postgres' }).every(c => !('requires' in c)), 'listChoices strips requires before inquirer sees it');

// ============================================
// Test 15: MCP server
// ============================================
console.log('\n🤖 Test 15: MCP server\n');

const mcpItem = ALL_ITEMS.find(i => i.id === 'mcp');
assert(mcpItem && PACKAGE_GROUPS.find(g => g.items?.includes(mcpItem))?.category === 'Agent Surface', 'MCP item exists in Agent Surface');
assert(mcpItem.install.includes('@modelcontextprotocol/server') && !mcpItem.install.includes('@modelcontextprotocol/sdk'), 'MCP uses the v2 SDK (@modelcontextprotocol/server), not v1');
assert(mcpItem.default === false && !mcpItem.frameworks, 'MCP is opt-in and available for both frameworks');
assert(mcpItem.envVars.map(e => e.key).join(',') === 'MCP_API_KEY', 'MCP declares MCP_API_KEY');
const mcpOrpcGuidance = resolveConfig(mcpItem, { framework: 'tanstack', apiLayer: 'orpc' }).guidance;
const mcpPlainGuidance = resolveConfig(mcpItem, { framework: 'nextjs', apiLayer: 'none' }).guidance;
assert(typeof mcpOrpcGuidance === 'string' && mcpOrpcGuidance.includes('`src/server/orpc/router.ts`') && mcpOrpcGuidance.includes('createRouterClient'), 'MCP guidance (oRPC, TanStack): add a procedure, tools come from the router');
assert(mcpPlainGuidance.includes('`server/mcp/tools.ts`') && mcpPlainGuidance.includes('registerTool') && !mcpPlainGuidance.includes('orpc'), 'MCP guidance (no oRPC): hand-written tools');
assert(PACKAGE_GROUPS.indexOf(PACKAGE_GROUPS.find(g => g.items?.includes(mcpItem))) > PACKAGE_GROUPS.indexOf(apiGroup), 'MCP is asked after the API layer (its files depend on it)');

const mcpNextOrpc = outputs({ framework: 'nextjs', apiLayer: 'orpc', mcp: true });
const mcpTanPlain = outputs({ framework: 'tanstack', apiLayer: 'none', mcp: true });
const mcpTrpc = outputs({ framework: 'nextjs', apiLayer: 'trpc', mcp: true });
assert(['server/mcp/handler.ts', 'server/mcp/tools.ts', 'server/mcp/orpc-tools.ts', 'app/api/mcp/route.ts'].every(f => mcpNextOrpc.includes(f)), 'MCP (Next.js + oRPC): handler, router tools and route');
assert(['src/server/mcp/handler.ts', 'src/server/mcp/tools.ts', 'src/routes/api/mcp.ts'].every(f => mcpTanPlain.includes(f)) && !mcpTanPlain.some(f => f.endsWith('orpc-tools.ts')), 'MCP (TanStack, no API layer): standalone tools, no oRPC adapter');
assert(!mcpTrpc.some(f => f.endsWith('orpc-tools.ts')) && mcpTrpc.includes('server/mcp/tools.ts'), 'MCP with tRPC uses standalone tools');
assert(!outputs({ framework: 'nextjs', apiLayer: 'orpc' }).some(f => f.includes('mcp')), 'No MCP files without MCP');
const mcpFiles = getScaffoldFiles({ projectName: 'demo', framework: 'nextjs', apiLayer: 'orpc', mcp: true }, docCommands('npm')).files.filter(([t]) => t.startsWith('mcp/'));
assert(mcpFiles.every(([t]) => fs.existsSync(path.join(rootDir, 'templates', t))), 'Every MCP template exists');
const mcpHandler = renderHbs(readTemplate('mcp/handler.ts.hbs'), { projectName: 'demo-app' });
assert(mcpHandler.includes("new McpServer({ name: 'demo-app'") && mcpHandler.includes('MCP_API_KEY') && mcpHandler.includes('localhostAllowedHostnames'), 'MCP handler names the server, guards with MCP_API_KEY, localhost-only without it');
assert(readTemplate('mcp/tools.orpc.ts.hbs').includes("from '@/server/orpc/router'") && readTemplate('mcp/orpc-tools.ts.hbs').includes('createRouterClient'), 'Router tools call the oRPC router through createRouterClient');
assert(!/:\s*any\b|as any\b|biome-ignore/.test(readTemplate('mcp/orpc-tools.ts.hbs')), 'MCP adapter has no explicit any (eslint-config-next rejects it) and no lint suppressions');
for (const t of ['mcp/handler.ts.hbs', 'mcp/tools.orpc.ts.hbs', 'mcp/orpc-tools.ts.hbs', 'mcp/tools.standalone.ts.hbs', 'mcp/route.nextjs.ts.hbs', 'mcp/route.tanstack.ts.hbs']) {
    assert(!/@modelcontextprotocol\/sdk/.test(readTemplate(t)), `${t} has no v1 SDK imports`);
}
const mcpDoc = renderHbs(claudeTmpl, { ...mockData, isMcp: true, isORPC: true });
assert(mcpDoc.includes('server/mcp/       # MCP endpoint (/api/mcp): tools from the oRPC router'), 'CLAUDE.md tree lists server/mcp/');
assert(!renderHbs(claudeTmpl, mockData).includes('server/mcp/'), 'No server/mcp/ in the tree without MCP');

// ============================================
// Test 16: Analytics & Monitoring (PostHog, Sentry)
// ============================================
console.log('\n📈 Test 16: Analytics & Monitoring\n');

const posthogItem = ALL_ITEMS.find(i => i.id === 'posthog');
const sentryItem = ALL_ITEMS.find(i => i.id === 'sentry');
assert(posthogItem && sentryItem && PACKAGE_GROUPS.find(g => g.items?.includes(posthogItem)) === PACKAGE_GROUPS.find(g => g.items?.includes(sentryItem)), 'PostHog and Sentry are opt-in items in one Analytics & Monitoring group');
assert(!posthogItem.default && !sentryItem.default, 'Both are off by default');
const phNext = resolveConfig(posthogItem, { framework: 'nextjs' });
const phTan = resolveConfig(posthogItem, { framework: 'tanstack', sentry: true });
const seNext = resolveConfig(sentryItem, { framework: 'nextjs', posthog: true });
const seTan = resolveConfig(sentryItem, { framework: 'tanstack' });
assert(phNext.install.join(',') === 'posthog-js,posthog-node' && phTan.install.includes('@posthog/react'), 'PostHog installs per framework (@posthog/react on TanStack)');
assert(seNext.install.join(',') === '@sentry/nextjs' && seTan.install.join(',') === '@sentry/tanstackstart-react', 'Sentry installs its framework SDK');
assert(phNext.envVars.every(e => e.key.startsWith('NEXT_PUBLIC_')) && phTan.envVars.every(e => e.key.startsWith('VITE_')), 'PostHog env vars use the framework\'s public prefix');
assert(seNext.envVars.map(e => e.key).join(',') === 'NEXT_PUBLIC_SENTRY_DSN,SENTRY_ORG,SENTRY_PROJECT,SENTRY_AUTH_TOKEN' && seTan.envVars[0].key === 'VITE_SENTRY_DSN', 'Sentry env vars per framework (public DSN, build-time token)');
assert(!seNext.envVars.find(e => e.key === 'SENTRY_AUTH_TOKEN').key.startsWith('NEXT_PUBLIC_'), 'The Sentry auth token is never client-exposed');
assert(phNext.guidance.includes('instrumentation-client.ts') && phNext.guidance.includes('/ingest') && phTan.guidance.includes('src/client.tsx') && !phTan.guidance.includes('/ingest'), 'PostHog guidance names the right entry file; the /ingest proxy is Next.js only');
assert(phTan.guidance.includes('Sentry owns errors') && !phNext.guidance.includes('Sentry owns errors'), 'PostHog guidance mentions Sentry owning errors only when both are picked');
assert(seNext.guidance.includes('(shared with PostHog)') && seTan.guidance.includes('wrapFetchWithSentry') && seTan.guidance.includes('beta'), 'Sentry guidance per framework');
assert(localizePackage(seNext, docCommands('pnpm')).guidance.includes('pnpm dlx @sentry/wizard@latest'), 'Sentry guidance uses the chosen package manager');

const anNextBoth = outputs({ framework: 'nextjs', posthog: true, sentry: true });
assert(['instrumentation-client.ts', 'lib/posthog/server.ts', 'instrumentation.ts', 'sentry.server.config.ts', 'sentry.edge.config.ts', 'app/global-error.tsx'].every(f => anNextBoth.includes(f)), 'Next.js with both: shared client entry + PostHog server + Sentry files');
assert(anNextBoth.filter(f => f === 'instrumentation-client.ts').length === 1, 'Only one instrumentation-client.ts');
const anTanPh = outputs({ framework: 'tanstack', posthog: true });
assert(anTanPh.includes('src/client.tsx') && anTanPh.includes('src/lib/posthog/server.ts') && !anTanPh.includes('src/server.ts'), 'TanStack PostHog only: client entry + server helper, no Sentry server entry');
const anTanSe = outputs({ framework: 'tanstack', sentry: true });
assert(['src/client.tsx', 'src/instrument.server.ts', 'src/server.ts', 'src/start.ts'].every(f => anTanSe.includes(f)), 'TanStack Sentry: client, server instrumentation, server entry, start middleware');
assert(!outputs({ framework: 'nextjs' }).some(f => f.includes('instrumentation') || f.includes('posthog')), 'No analytics files without analytics');
assert(templatesExist({ framework: 'nextjs', posthog: true, sentry: true }) && templatesExist({ framework: 'tanstack', posthog: true, sentry: true }), 'Every analytics template exists');

for (const fw of ['nextjs', 'tanstack']) {
    for (const [ph, se] of [[true, false], [false, true], [true, true]]) {
        for (const proxy of fw === 'nextjs' && ph ? [true, false] : [false]) {
            const data = { projectName: 'demo', isNextjs: fw === 'nextjs', isTanStack: fw === 'tanstack', isPostHog: ph, isSentry: se, posthogProxy: proxy };
            const files = getScaffoldFiles({ projectName: 'demo', framework: fw, posthog: ph, sentry: se }, docCommands('npm')).files.filter(([t]) => t.startsWith('analytics/'));
            const bad = files.filter(([t]) => { const out = renderHbs(readTemplate(t), data); return /\{\{|\}\}/.test(out) || /&(#x?[0-9a-fA-F]+|amp|lt|gt|quot);/.test(out) || (!ph && /posthog/i.test(out) && !/PostHog/.test(t)) || (!se && /@sentry/.test(out)); });
            assert(bad.length === 0, `Analytics templates render cleanly (${fw}, posthog=${ph}, sentry=${se}${fw === 'nextjs' && ph ? `, proxy=${proxy}` : ''})${bad.length ? ': ' + bad.map(b => b[0]).join(', ') : ''}`);
        }
    }
}
const clientNext = (proxy) => renderHbs(readTemplate('analytics/instrumentation-client.ts.hbs'), { isNextjs: true, isPostHog: true, posthogProxy: proxy });
assert(clientNext(true).includes("api_host: '/ingest'") && clientNext(false).includes('api_host: posthogHost') && !clientNext(false).includes('/ingest'), 'PostHog client uses /ingest only when the rewrite was added');

// Config edits, against the files the scaffolders write
const cnaNextConfig = 'import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {\n  /* config options here */\n  cacheComponents: true,\n};\n\nexport default nextConfig;\n';
const withRewrites = addPostHogRewrites(cnaNextConfig);
assert(withRewrites.includes('/ingest/:path*') && withRewrites.includes('skipTrailingSlashRedirect: true') && withRewrites.includes('cacheComponents: true'), 'addPostHogRewrites adds the /ingest proxy and keeps the config');
assert(addPostHogRewrites(withRewrites) === null && addPostHogRewrites(cnaNextConfig.replace('cacheComponents', 'async rewrites() { return [] },\n  cacheComponents')) === null, 'addPostHogRewrites is idempotent and won\'t merge into existing rewrites');
const withSentry = addWithSentryConfig(withRewrites);
assert(withSentry.includes('import { withSentryConfig } from "@sentry/nextjs/config";') && withSentry.includes('export default withSentryConfig(nextConfig, {') && withSentry.includes('telemetry: false') && withSentry.includes('/ingest/:path*'), 'addWithSentryConfig wraps the export (v11 import path, plugin telemetry off), keeping other edits');
assert(addWithSentryConfig(withSentry) === null && addWithSentryConfig('export default {};') === null, 'addWithSentryConfig is idempotent and needs its anchor');
const tanVite = "import { defineConfig } from 'vite'\nimport { tanstackStart } from '@tanstack/react-start/plugin/vite'\nimport viteReact from '@vitejs/plugin-react'\n\nconst config = defineConfig({\n  resolve: { tsconfigPaths: true },\n  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],\n})\n\nexport default config\n";
const withVite = addSentryVitePlugin(tanVite);
assert(withVite.includes("import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'") && withVite.includes('viteReact(), sentryTanstackStart({ telemetry: false })]'), 'addSentryVitePlugin adds the plugin last');
const multiVite = tanVite.replace('plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],', 'plugins: [\n    devtools(),\n    viteReact({ babel: { plugins: [] } }),\n  ],');
assert(/viteReact\(\{ babel: \{ plugins: \[\] \} \}\),\n    sentryTanstackStart\(\{ telemetry: false \}\),\n  \]/.test(addSentryVitePlugin(multiVite)), 'addSentryVitePlugin handles a multi-line plugins array with nested brackets');
assert(addSentryVitePlugin(withVite) === null, 'addSentryVitePlugin is idempotent');
assert(ignoreSentryBuildPluginEnv('node_modules\n.env\n').endsWith('.env.sentry-build-plugin\n') && ignoreSentryBuildPluginEnv('.env*\n') === null, 'The Sentry token file is git-ignored unless .env* already covers it');
const memFs = (files) => ({ existsSync: (f) => f in files, readFileSync: (f) => files[f], writeFileSync: (f, t) => { files[f] = t; } });
const vfs = { 'next.config.ts': cnaNextConfig };
assert(editFile(memFs(vfs), 'next.config.ts', addPostHogRewrites, '/ingest/:path*') === 'applied' && vfs['next.config.ts'].includes('/ingest'), 'editFile applies an edit');
assert(editFile(memFs(vfs), 'next.config.ts', addPostHogRewrites, '/ingest/:path*') === 'present', 'editFile reports an edit already present');
assert(editFile(memFs({ 'x.ts': 'export default {}' }), 'x.ts', addWithSentryConfig, 'withSentryConfig') === 'no-anchor' && editFile(memFs({}), 'nope.ts', addWithSentryConfig, 'withSentryConfig') === 'missing-file', 'editFile reports a missing anchor or file (for manual steps)');

// ============================================
// Test 17: File uploads (UploadThing, R2)
// ============================================
console.log('\n📁 Test 17: File uploads\n');

const upGroup = PACKAGE_GROUPS.find(g => g.id === 'uploads');
assert(upGroup && upGroup.type === 'list' && upGroup.default === 'none', 'File Uploads is a single choice, off by default');
assert(upGroup.choices.map(c => c.value).join(',') === 'none,uploadthing,r2', 'File Uploads: none, UploadThing, R2');
const upChoices = listChoices(upGroup);
assert(upChoices({ effect: true }).find(c => c.value === 'uploadthing').disabled?.includes('Effect'), 'UploadThing is disabled next to Effect v4 (it bundles Effect 3), with the reason');
assert(!upChoices({ effect: false }).find(c => c.value === 'uploadthing').disabled && !upChoices({ effect: true }).find(c => c.value === 'r2').disabled, 'UploadThing is available without Effect; R2 always');
const utCfg = upGroup.providerConfig.uploadthing;
const r2Cfg = upGroup.providerConfig.r2;
assert(utCfg.install.join(',') === 'uploadthing,@uploadthing/react' && utCfg.envVars.map(e => e.key).join(',') === 'UPLOADTHING_TOKEN', 'UploadThing packages and token');
assert(r2Cfg.install.join(',') === '@aws-sdk/client-s3,@aws-sdk/s3-request-presigner', 'R2 uses the AWS SDK S3 client + presigner');
assert(['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL', 'R2_ENDPOINT'].every(k => r2Cfg.envVars.some(e => e.key === k)), 'R2 env vars (account, key pair, bucket, optional public URL and endpoint)');
assert(resolveConfig(r2Cfg, { framework: 'tanstack' }).guidance.includes('`src/server/storage.ts`') && resolveConfig(utCfg, { framework: 'nextjs' }).guidance.includes('`server/uploadthing.ts`'), 'Upload guidance names the right paths per framework');

const utNext = outputs({ framework: 'nextjs', uploads: 'uploadthing' });
const r2Tan = outputs({ framework: 'tanstack', uploads: 'r2' });
assert(['server/uploadthing.ts', 'lib/uploadthing.ts', 'components/image-upload.tsx', 'app/api/uploadthing/route.ts'].every(f => utNext.includes(f)), 'UploadThing (Next.js): router, client helpers, example component, route');
assert(['src/server/storage.ts', 'src/lib/upload.ts', 'src/components/file-upload.tsx', 'src/routes/api/uploads.ts'].every(f => r2Tan.includes(f)), 'R2 (TanStack): storage module, client helper, example component, server route');
assert(!outputs({ framework: 'nextjs', uploads: 'none' }).some(f => f.includes('upload')), 'No upload files without uploads');
assert(templatesExist({ framework: 'nextjs', uploads: 'uploadthing' }) && templatesExist({ framework: 'tanstack', uploads: 'r2' }) && templatesExist({ framework: 'tanstack', uploads: 'uploadthing' }) && templatesExist({ framework: 'nextjs', uploads: 'r2' }), 'Every upload template exists');
for (const fw of ['nextjs', 'tanstack']) {
    const data = { isNextjs: fw === 'nextjs', isTanStack: fw === 'tanstack' };
    const core = renderHbs(readTemplate('uploads/uploadthing/core.ts.hbs'), data);
    assert(core.includes(fw === 'nextjs' ? "from 'uploadthing/next'" : "type FileRouter, UploadThingError } from 'uploadthing/server'") && !/\{\{/.test(core), `UploadThing router imports the ${fw} adapter`);
    for (const t of ['uploads/uploadthing/image-upload.tsx.hbs', 'uploads/r2/file-upload.tsx.hbs']) {
        assert(renderHbs(readTemplate(t), data).startsWith("'use client'") === (fw === 'nextjs'), `${t}: 'use client' only on Next.js (${fw})`);
    }
}
const storageTmpl = readTemplate('uploads/r2/storage.ts.hbs');
assert(storageTmpl.includes("requestChecksumCalculation: 'WHEN_REQUIRED'") && storageTmpl.includes('signableHeaders') && storageTmpl.includes("region: 'auto'"), 'R2 storage: checksums off for presigned PUTs, type and size signed, region auto');
assert(!/^const .*process\.env/m.test(storageTmpl), 'R2 storage reads env lazily (nothing at import time)');
const globalsCss = '@import "tailwindcss";\n@import "tw-animate-css";\n';
const withUt = addUploadThingStyles(globalsCss);
assert(withUt === '@import "tailwindcss";\n@import "uploadthing/tw/v4";\n@source "../node_modules/@uploadthing/react/dist";\n@import "tw-animate-css";\n', 'UploadThing styles go right after @import "tailwindcss"');
assert(addUploadThingStyles(withUt) === null && addUploadThingStyles("@import 'tailwindcss';\n") !== null && addUploadThingStyles('body {}') === null, 'UploadThing styles: idempotent, either quote style, needs the Tailwind import');

// ============================================
// Test 18: Background jobs (pg-boss, Inngest, Trigger.dev)
// ============================================
console.log('\n⏱️ Test 18: Background jobs\n');

const jobsGroup = PACKAGE_GROUPS.find(g => g.id === 'jobs');
assert(jobsGroup && jobsGroup.type === 'list' && jobsGroup.default === 'none', 'Background Jobs is a single choice, off by default');
assert(jobsGroup.choices.map(c => c.value).join(',') === 'none,pgboss,inngest,trigger', 'Background Jobs: none, pg-boss, Inngest, Trigger.dev');
assert(PACKAGE_GROUPS.indexOf(jobsGroup) > PACKAGE_GROUPS.indexOf(dbGroup), 'Jobs are asked after the database (pg-boss depends on it)');
const jobChoices = listChoices(jobsGroup);
for (const db of ['postgres', 'supabase']) assert(!jobChoices({ database: db }).find(c => c.value === 'pgboss').disabled, `pg-boss is available with ${db}`);
for (const db of ['none', 'sqlite_turso', 'convex_cloud']) assert(jobChoices({ database: db }).find(c => c.value === 'pgboss').disabled?.includes('Postgres'), `pg-boss is disabled with ${db}, saying it needs Postgres`);
assert(!jobChoices({ database: 'none' }).find(c => c.value === 'inngest').disabled && !jobChoices({ database: 'none' }).find(c => c.value === 'trigger').disabled, 'Inngest and Trigger.dev need no database');
const pgbCfg = jobsGroup.providerConfig.pgboss, innCfg = jobsGroup.providerConfig.inngest, trgCfg = jobsGroup.providerConfig.trigger;
assert(pgbCfg.install.includes('pg-boss') && pgbCfg.install.includes('@opentelemetry/api') && pgbCfg.devInstall.includes('tsx'), 'pg-boss installs its required OpenTelemetry peer and tsx for the worker');
assert(!pgbCfg.envVars, 'pg-boss adds no env var (it reuses the database option\'s DATABASE_URL)');
assert(innCfg.install.join(',') === 'inngest' && innCfg.envVars.map(e => e.key).join(',') === 'INNGEST_DEV,INNGEST_EVENT_KEY,INNGEST_SIGNING_KEY', 'Inngest package and env vars');
assert(trgCfg.install.join(',') === '@trigger.dev/sdk' && trgCfg.devInstall.join(',') === 'trigger.dev,@trigger.dev/build' && trgCfg.envVars.map(e => e.key).join(',') === 'TRIGGER_SECRET_KEY,TRIGGER_PROJECT_REF', 'Trigger.dev SDK, CLI + build, env vars');
for (const [cfg, path_] of [[pgbCfg, 'src/server/jobs/index.ts'], [innCfg, 'src/inngest/functions.ts'], [trgCfg, 'src/trigger/']]) {
    assert(resolveConfig(cfg, { framework: 'tanstack' }).guidance.includes(path_), `${cfg.name} guidance names ${path_} on TanStack`);
}
assert(localizePackage(resolveConfig(pgbCfg, { framework: 'nextjs' }), docCommands('pnpm')).guidance.includes('`pnpm worker:dev`'), 'pg-boss guidance uses the chosen package manager');

const pgbNext = outputs({ framework: 'nextjs', jobs: 'pgboss', database: 'postgres' });
assert(['server/jobs/define.ts', 'server/jobs/welcome-email.ts', 'server/jobs/registry.ts', 'server/jobs/index.ts', 'worker.ts'].every(f => pgbNext.includes(f)), 'pg-boss (Next.js): define, example job, registry, the one pg-boss module, worker');
const innTan = outputs({ framework: 'tanstack', jobs: 'inngest' });
assert(['src/inngest/client.ts', 'src/inngest/functions.ts', 'src/routes/api/inngest.ts'].every(f => innTan.includes(f)), 'Inngest (TanStack): client, functions, serve route');
assert(outputs({ framework: 'nextjs', jobs: 'inngest' }).includes('app/api/inngest/route.ts'), 'Inngest (Next.js): app/api/inngest/route.ts');
const trgTan = outputs({ framework: 'tanstack', jobs: 'trigger' });
assert(trgTan.includes('trigger.config.ts') && trgTan.includes('src/trigger/welcome-email.ts'), 'Trigger.dev (TanStack): config at the root, tasks under src/trigger/');
assert(!outputs({ framework: 'nextjs', jobs: 'none' }).some(f => /jobs|inngest|trigger|worker/.test(f)), 'No job files without jobs');
for (const jobs of ['pgboss', 'inngest', 'trigger']) for (const framework of ['nextjs', 'tanstack']) assert(templatesExist({ framework, jobs }), `Every ${jobs} template exists (${framework})`);
const innClient = renderHbs(readTemplate('jobs/inngest/client.ts.hbs'), { projectName: 'demo-app', pm: docCommands('bun') });
assert(innClient.includes("new Inngest({ id: 'demo-app' })") && innClient.includes('`bun run inngest:dev`'), 'Inngest client id is the project name; the dev hint uses the package manager');
assert(renderHbs(readTemplate('jobs/trigger/trigger.config.ts.hbs'), { src: 'src/' }).includes("dirs: ['./src/trigger']") && renderHbs(readTemplate('jobs/trigger/trigger.config.ts.hbs'), { src: '' }).includes("dirs: ['./trigger']"), 'trigger.config.ts points at the framework\'s tasks folder');
assert(renderHbs(readTemplate('jobs/pgboss/worker.ts.hbs'), { pm: docCommands('pnpm') }).includes('`pnpm worker`'), 'The worker comment uses the package manager');
assert(readTemplate('jobs/pgboss/index.ts.hbs').includes("import { PgBoss") && readTemplate('jobs/pgboss/index.ts.hbs').includes('createQueue') && !['define', 'welcome-email', 'registry', 'worker'].some(f => readTemplate(`jobs/pgboss/${f}.ts.hbs`).includes("from 'pg-boss'")), 'Only server/jobs/index.ts imports pg-boss, and it creates queues before use');

const pgbScripts = getScaffoldScripts({ framework: 'tanstack', jobs: 'pgboss' }, { dlx: 'npx --yes' });
assert(pgbScripts.worker === 'tsx --env-file-if-exists=.env.local src/worker.ts' && pgbScripts['worker:dev'].startsWith('tsx watch'), 'pg-boss scripts run the worker with tsx, loading .env.local');
assert(getScaffoldScripts({ framework: 'nextjs', jobs: 'inngest' }, { dlx: 'pnpm dlx' })['inngest:dev'] === 'pnpm dlx inngest-cli@latest dev -u http://localhost:3000/api/inngest', 'Inngest dev script uses the package manager\'s one-off runner');
assert(Object.keys(getScaffoldScripts({ jobs: 'trigger' }, { dlx: 'bunx' })).join(',') === 'trigger:dev,trigger:deploy', 'Trigger.dev scripts: dev and deploy');
assert(Object.keys(getScaffoldScripts({ jobs: 'none' }, { dlx: 'npx' })).length === 0, 'No scripts without jobs');
assert(addGitignoreEntry('node_modules\n', '.trigger', 'Trigger.dev').endsWith('# Trigger.dev\n.trigger\n') && addGitignoreEntry('node_modules\n.trigger\n', '.trigger', 'x') === null, 'addGitignoreEntry appends once');
const jobsDoc = renderHbs(claudeTmpl, { ...mockData, isPgBoss: true });
assert(jobsDoc.includes('server/jobs/      # Background jobs (pg-boss)'), 'CLAUDE.md tree lists server/jobs/ with pg-boss');

// ============================================
// Summary
// ============================================
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
