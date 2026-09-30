/**
 * Validates the CLI configuration without running actual installs.
 * Tests prompt generation, package filtering, template rendering, and env vars.
 */

import { PACKAGE_GROUPS, ALL_ITEMS } from '../lib/packages.js';
import { getScaffoldFiles } from '../lib/scaffolds.js';
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
    assert(Array.isArray(item.install), `${item.id} has install array`);
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

// ============================================
// Test 6: Database group structure
// ============================================
console.log('\n🗄️ Test 6: Database group structure\n');

const dbGroup = PACKAGE_GROUPS.find(g => g.id === 'database');
assert(dbGroup, 'Database group exists');
assert(dbGroup.type === 'list', 'Database is a list-type group');
assert(dbGroup.choices.length === 6, 'Database has 6 choices (none, supabase, convex_cloud, convex_self, sqlite_turso, sqlite_self)');
assert(dbGroup.providerConfig.supabase, 'Supabase provider config exists');
assert(dbGroup.providerConfig.convex_cloud, 'Convex Cloud provider config exists');
assert(dbGroup.providerConfig.convex_self, 'Convex Self-hosted provider config exists');
assert(dbGroup.providerConfig.supabase.devInstall?.includes('drizzle-kit'), 'Supabase includes drizzle-kit as devDep');
assert(!dbGroup.providerConfig.convex_cloud.devInstall, 'Convex Cloud has no devDeps');
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
assert(renderedClaudeVitest.includes('`npm test`'), 'CLAUDE.md lists npm test when Vitest is selected');
assert(testGroup.providerConfig.both.commands?.length > 0, 'Both config has Playwright init commands');

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

const outputs = (answers) => getScaffoldFiles({ projectName: 'demo', ...answers }).files.map(([, out]) => out);
const templatesExist = (answers) => getScaffoldFiles({ projectName: 'demo', ...answers }).files
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
// Summary
// ============================================
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
