/**
 * Validates the CLI configuration without running actual installs.
 * Tests prompt generation, package filtering, template rendering, and env vars.
 */

import { PACKAGE_GROUPS, ALL_ITEMS } from '../lib/packages.js';
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
assert(testGroup.providerConfig.vitest.devInstallNextjs?.includes('@vitejs/plugin-react'), 'Vitest has Next.js-specific @vitejs/plugin-react');
assert(testGroup.providerConfig.playwright.devInstall?.includes('@playwright/test'), 'Playwright config includes @playwright/test');
assert(testGroup.providerConfig.playwright.commands?.length > 0, 'Playwright has init commands');
assert(testGroup.providerConfig.both.devInstall?.includes('vitest'), 'Both config includes vitest');
assert(testGroup.providerConfig.both.devInstall?.includes('@playwright/test'), 'Both config includes @playwright/test');
assert(testGroup.providerConfig.both.devInstallNextjs?.includes('@vitejs/plugin-react'), 'Both has Next.js-specific @vitejs/plugin-react');
assert(testGroup.providerConfig.both.commands?.length > 0, 'Both config has Playwright init commands');

// ============================================
// Summary
// ============================================
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
