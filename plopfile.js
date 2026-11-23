import { execa } from 'execa';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import { PACKAGE_GROUPS } from './lib/packages.js';
import { selectPackages, listChoices } from './lib/selection.js';
import { getScaffoldFiles, getScaffoldScripts } from './lib/scaffolds.js';
import {
    PACKAGE_MANAGERS,
    PACKAGE_MANAGER_IDS,
    getVersion,
    packageManagerChoices,
    defaultPackageManager,
    resolveDlx,
    resolveAdd,
    resolveCommand,
    docCommands,
    localizePackage,
} from './lib/package-managers.js';
import { WORKFLOWS, WORKFLOW_IDS, DEFAULT_WORKFLOW, gateScripts } from './lib/workflow.js';
import { buildTemplateData } from './lib/template-data.js';
import {
    mergeAgentsMd,
    addEslintIgnores,
    preferAtAlias,
    dropUnusedReactImport,
    hasNoUnusedLocals,
    addPostHogRewrites,
    addWithSentryConfig,
    addSentryVitePlugin,
    ignoreSentryBuildPluginEnv,
    addUploadThingStyles,
    addGitignoreEntry,
    editFile,
} from './lib/project-fixes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (plop) {
    // Installed package manager versions (null = not installed), used for the prompt and Yarn 1 vs 2+ handling
    const pmVersions = Object.fromEntries(PACKAGE_MANAGER_IDS.map(id => [id, getVersion(id)]));

    plop.setGenerator('vibe-app', {
        description: 'Scaffold a custom full-stack React app',
        prompts: [
            {
                type: 'input',
                name: 'projectName',
                message: 'What is your project name?',
                default: 'my-vibe-now',
                validate: (input) => {
                    const validName = /^[a-z0-9-_.]+$/.test(input);
                    if (!validName) {
                        return 'Project name must be url-safe (a-z, 0-9, -, _, .)';
                    }
                    if (input === '.' && fs.readdirSync(process.cwd()).length > 0) {
                        return 'Current directory is not empty. Please provide a different project name.';
                    }
                    return true;
                }
            },
            {
                type: 'list',
                name: 'framework',
                message: 'Choose your framework:',
                choices: [
                    { name: 'Next.js (App Router, stable)', value: 'nextjs' },
                    { name: 'TanStack Start (Full-stack, type-safe)', value: 'tanstack' },
                ],
                default: 'nextjs',
            },
            {
                type: 'list',
                name: 'packageManager',
                message: 'Choose your package manager:',
                choices: packageManagerChoices(pmVersions),
                default: defaultPackageManager(pmVersions),
            },
            {
                type: 'confirm',
                name: 'isClaudeCode',
                message: 'Is this a Claude Code project? (generates CLAUDE.md instead of AGENTS.md)',
                default: true,
            },
            {
                type: 'list',
                name: 'workflow',
                message: 'Development workflow (specs, ADRs, reviews, handoffs):',
                choices: WORKFLOW_IDS.map(id => ({ name: WORKFLOWS[id].name, value: id })),
                default: DEFAULT_WORKFLOW,
            },
            ...PACKAGE_GROUPS.flatMap((group) => {
                if (group.type === 'list') {
                    const prompt = {
                        type: 'list',
                        name: group.id,
                        message: `${group.category}:`,
                        choices: listChoices(group),
                        default: group.default,
                    };
                    if (group.when) prompt.when = group.when;
                    return [prompt];
                }
                return group.items.map(item => {
                    const prompt = {
                        type: 'confirm',
                        name: item.id,
                        message: `${group.category}: Include ${item.name}?`,
                        default: item.default,
                    };
                    if (item.frameworks) {
                        prompt.when = (answers) => item.frameworks.includes(answers.framework);
                    }
                    return prompt;
                });
            }),
        ],
        actions: (data) => {
            const actions = [];
            const projectPath = path.join(process.cwd(), data.projectName);
            const pm = data.packageManager || 'npm';
            const pmConfig = PACKAGE_MANAGERS[pm];
            const pmEnv = { ...process.env, ...pmConfig.env };
            const pmDocs = docCommands(pm, pmVersions[pm]);

            // 1. Create Base App (Next.js or TanStack Start)
            actions.push({
                type: 'customSync',
                async action(answers) {
                    const isTanStack = answers.framework === 'tanstack';
                    const label = isTanStack ? 'TanStack Start' : 'Next.js';
                    const spinner = ora({
                        text: `Creating base ${label} app in ${answers.projectName}...`,
                        color: 'cyan',
                    }).start();

                    try {
                        const [command, ...args] = isTanStack
                            ? resolveDlx(pm, [
                                '@tanstack/cli', 'create',
                                answers.projectName,
                                '--tailwind',
                                '--no-examples',
                                '--no-git',
                                '--no-toolchain',
                                '--package-manager', pm,
                            ], pmVersions[pm])
                            : resolveDlx(pm, [
                                'create-next-app@latest',
                                answers.projectName,
                                '--ts',
                                '--tailwind',
                                '--app',
                                '--eslint',
                                '--import-alias',
                                '@/*',
                                pmConfig.nextFlag,
                                '--yes',
                            ], pmVersions[pm]);
                        await execa(command, args, { env: pmEnv });
                        spinner.succeed(`Base ${label} app created!`);
                        return `Base ${label} app created`;
                    } catch (error) {
                        spinner.fail(`Failed to create ${label} app`);
                        throw error;
                    }
                },
            });

            // 2. Install selected packages & run commands
            actions.push({
                type: 'customSync',
                async action(answers) {
                    // Every selected package, with framework- and React Query-specific installs merged in
                    const selectedPackages = selectPackages(answers);

                    if (selectedPackages.length === 0) return 'No additional packages selected';

                    const pkgNames = selectedPackages.map(p => p.name).join(', ');
                    const installSpinner = ora({
                        text: `Installing: ${pkgNames}...`,
                        color: 'magenta',
                    }).start();

                    const installCmds = [...new Set(selectedPackages.flatMap(pkg => pkg.install || []))];
                    const devInstallCmds = [...new Set(selectedPackages.flatMap(pkg => pkg.devInstall || []))];

                    try {
                        // Standard Installs
                        if (installCmds.length > 0) {
                            const [command, ...args] = resolveAdd(pm, installCmds);
                            await execa(command, args, { cwd: projectPath, env: pmEnv });
                        }

                        // Dev Installs
                        if (devInstallCmds.length > 0) {
                            installSpinner.text = 'Installing devDependencies...';
                            const [command, ...args] = resolveAdd(pm, devInstallCmds, { dev: true });
                            await execa(command, args, { cwd: projectPath, env: pmEnv });
                        }
                        installSpinner.succeed('Packages installed successfully!');
                    } catch (error) {
                        installSpinner.fail('Package installation failed');
                        throw error;
                    }

                    // shadcn reads the project's alias from tsconfig; with the TanStack CLI's `#/*` listed
                    // first it can't, and falls back to interactive prompts
                    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
                    if (answers.shadcn && fs.existsSync(tsconfigPath)) {
                        const reordered = preferAtAlias(fs.readFileSync(tsconfigPath, 'utf8'));
                        if (reordered) fs.writeFileSync(tsconfigPath, reordered);
                    }

                    // Run initialization commands (like shadcn init), skipping ones for the other framework
                    for (const pkg of selectedPackages) {
                        const commands = (pkg.commands || []).filter(cmd => !cmd.frameworks || cmd.frameworks.includes(answers.framework));
                        if (commands.length > 0) {
                            console.log(`\n✨ Finalizing ${pkg.name}...`);

                            try {
                                for (const cmd of commands) {
                                    const [command, ...args] = resolveCommand(pm, cmd, pmVersions[pm]);
                                    // Use 'inherit' so user can see/interact with shadow-style commands
                                    await execa(command, args, {
                                        cwd: projectPath,
                                        stdio: 'inherit',
                                        env: pmEnv,
                                    });
                                }
                            } catch (error) {
                                console.error(`❌ Failed to initialize ${pkg.name}`);
                                throw error;
                            }
                        }
                    }

                    // Under `noUnusedLocals` (TanStack's tsconfig), an unused `import * as React` in a generated
                    // shadcn file fails typecheck; drop just that import
                    const uiDir = path.join(projectPath, answers.framework === 'tanstack' ? 'src' : '', 'components', 'ui');
                    if (answers.shadcn && fs.existsSync(uiDir) && fs.existsSync(tsconfigPath) && hasNoUnusedLocals(fs.readFileSync(tsconfigPath, 'utf8'))) {
                        for (const file of fs.readdirSync(uiDir).filter(f => /\.tsx?$/.test(f))) {
                            const filePath = path.join(uiDir, file);
                            const fixed = dropUnusedReactImport(fs.readFileSync(filePath, 'utf8'));
                            if (fixed !== null) fs.writeFileSync(filePath, fixed);
                        }
                    }

                    // shadcn's generated primitives break eslint-config-next's react-hooks rules; they stay
                    // close to upstream (customized in wrappers), so they're left out of lint, not edited
                    const eslintConfigPath = path.join(projectPath, 'eslint.config.mjs');
                    if (answers.shadcn && fs.existsSync(eslintConfigPath)) {
                        const updated = addEslintIgnores(fs.readFileSync(eslintConfigPath, 'utf8'));
                        if (updated) fs.writeFileSync(eslintConfigPath, updated);
                    }

                    // PostHog / Sentry need small edits to the framework's config files; when an anchor isn't
                    // where the scaffolder put it, say what to add by hand instead of guessing
                    const manualSteps = [];
                    const onDisk = (file) => path.join(projectPath, file);
                    let posthogProxy = false;
                    if (answers.framework !== 'tanstack') {
                        if (answers.posthog) {
                            const result = editFile(fs, onDisk('next.config.ts'), addPostHogRewrites, '/ingest/:path*');
                            posthogProxy = result === 'applied' || result === 'present';
                            if (!posthogProxy) manualSteps.push('PostHog: no /ingest reverse proxy was added to next.config.ts (it already has rewrites, or its shape is unexpected); events go straight to NEXT_PUBLIC_POSTHOG_HOST. See PostHog\'s Next.js reverse-proxy docs to add it.');
                        }
                        if (answers.sentry && ['no-anchor', 'missing-file'].includes(editFile(fs, onDisk('next.config.ts'), addWithSentryConfig, 'withSentryConfig'))) {
                            manualSteps.push('Sentry: wrap the export of next.config.ts with withSentryConfig from "@sentry/nextjs/config" (source maps and build-time instrumentation).');
                        }
                    } else if (answers.sentry) {
                        if (['no-anchor', 'missing-file'].includes(editFile(fs, onDisk('vite.config.ts'), addSentryVitePlugin, 'sentryTanstackStart'))) {
                            manualSteps.push("Sentry: add sentryTanstackStart() from '@sentry/tanstackstart-react/vite' as the last plugin in vite.config.ts.");
                        }
                        editFile(fs, onDisk('.gitignore'), ignoreSentryBuildPluginEnv, '.env.sentry-build-plugin');
                    }
                    if (answers.uploads === 'uploadthing') {
                        const stylesheet = answers.framework === 'tanstack' ? 'src/styles.css' : 'app/globals.css';
                        if (['no-anchor', 'missing-file'].includes(editFile(fs, onDisk(stylesheet), addUploadThingStyles, 'uploadthing/tw/v4'))) {
                            manualSteps.push(`UploadThing: add \`@import "uploadthing/tw/v4";\` and \`@source "../node_modules/@uploadthing/react/dist";\` after \`@import "tailwindcss";\` in your global stylesheet.`);
                        }
                    }
                    if (answers.jobs === 'trigger') {
                        editFile(fs, onDisk('.gitignore'), (text) => addGitignoreEntry(text, '.trigger', 'Trigger.dev local build output'), '.trigger');
                    }
                    for (const step of manualSteps) console.warn(`\n⚠️  ${step}`);

                    // Data for every generated file: starter files, docs/, skills, README, CLAUDE.md / AGENTS.md
                    const displayName = answers.projectName === '.' ? path.basename(projectPath) : answers.projectName;
                    const templateData = buildTemplateData(answers, {
                        projectName: displayName,
                        selectedPackages: selectedPackages.map(pkg => localizePackage(pkg, pmDocs)),
                        pm: pmDocs,
                    }, (tmpl, data) => plop.renderString(tmpl, data));
                    templateData.posthogProxy = posthogProxy;

                    // Generate source files for selected options (Vitest config, API layer, workflow docs, ...)
                    const scaffold = getScaffoldFiles({ ...answers, projectName: displayName }, pmDocs);
                    if (scaffold.files.length > 0) {
                        const scaffoldSpinner = ora({
                            text: 'Generating starter files...',
                            color: 'yellow',
                        }).start();

                        try {
                            const written = [];
                            for (const [tmplName, outFile] of scaffold.files) {
                                const outPath = path.join(projectPath, outFile);
                                if (fs.existsSync(outPath)) continue;
                                const tmpl = fs.readFileSync(path.join(__dirname, 'templates', tmplName), 'utf8');
                                fs.mkdirSync(path.dirname(outPath), { recursive: true });
                                fs.writeFileSync(outPath, plop.renderString(tmpl, { ...templateData, ...scaffold.data }));
                                written.push(outFile);
                            }

                            const testingSelection = answers.testing || 'none';
                            if (testingSelection === 'vitest' || testingSelection === 'both') {
                                const pkgJsonPath = path.join(projectPath, 'package.json');
                                const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                                pkgJson.scripts = {
                                    ...pkgJson.scripts,
                                    test: 'vitest run',
                                    'test:watch': 'vitest',
                                };
                                fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
                            }

                            // Scripts the selected options need (job workers, dev servers), never replacing existing ones
                            const optionScripts = getScaffoldScripts(answers, { dlx: resolveDlx(pm, [], pmVersions[pm]).join(' ') });
                            if (Object.keys(optionScripts).length > 0) {
                                const pkgJsonPath = path.join(projectPath, 'package.json');
                                const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                                pkgJson.scripts = { ...optionScripts, ...pkgJson.scripts };
                                fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
                            }

                            // The workflow's gate: `typecheck` and `check` (never replacing existing scripts)
                            if (templateData.hasWorkflow) {
                                const pkgJsonPath = path.join(projectPath, 'package.json');
                                const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                                pkgJson.scripts = {
                                    ...pkgJson.scripts,
                                    ...gateScripts(pkgJson.scripts, { isNextjs: templateData.isNextjs, run: pmDocs.run }),
                                };
                                fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
                            }

                            // TanStack Start's Vite plugin adds new API routes to routeTree.gen.ts on the first dev server run or build.
                            // (`tsr generate` is not used: it drops Start's `Register` typing from the generated tree.)

                            scaffoldSpinner.succeed(`Starter files generated (${written.length} files)`);
                        } catch (error) {
                            scaffoldSpinner.fail('Failed to generate starter files');
                            console.error(error);
                        }
                    }

                    // 3. Generate README and AGENTS files
                    const docSpinner = ora({
                        text: 'Generating custom documentation and agent rules...',
                        color: 'blue',
                    }).start();

                    try {
                        const readmeTmpl = fs.readFileSync(path.join(__dirname, 'templates/README.md.hbs'), 'utf8');
                        const renderedReadme = plop.renderString(readmeTmpl, templateData);
                        fs.writeFileSync(path.join(projectPath, 'README.md'), renderedReadme);

                        if (answers.isClaudeCode) {
                            const claudeTmpl = fs.readFileSync(path.join(__dirname, 'templates/CLAUDE.md.hbs'), 'utf8');
                            const renderedClaude = plop.renderString(claudeTmpl, templateData);
                            fs.writeFileSync(path.join(projectPath, 'CLAUDE.md'), renderedClaude);
                        } else {
                            const agentsTmpl = fs.readFileSync(path.join(__dirname, 'templates/AGENTS.md.hbs'), 'utf8');
                            const renderedAgents = plop.renderString(agentsTmpl, templateData);
                            const agentsPath = path.join(projectPath, 'AGENTS.md');
                            const existing = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, 'utf8') : null;
                            // Keep the Next.js rules block create-next-app wrote (and `next dev` maintains)
                            fs.writeFileSync(agentsPath, mergeAgentsMd(renderedAgents, existing));
                        }

                        // Generate .env.example if any selected packages have envVars
                        const hasEnvVars = selectedPackages.some(p => p.envVars && p.envVars.length > 0);
                        if (hasEnvVars) {
                            const envTmpl = fs.readFileSync(path.join(__dirname, 'templates/env.example.hbs'), 'utf8');
                            const renderedEnv = plop.renderString(envTmpl, templateData);
                            fs.writeFileSync(path.join(projectPath, '.env.example'), renderedEnv);
                        }

                        const docFile = answers.isClaudeCode ? 'CLAUDE.md' : 'AGENTS.md';
                        const envNote = hasEnvVars ? ', .env.example' : '';
                        docSpinner.succeed(`Documentation, ${docFile}${envNote} generated!`);
                    } catch (error) {
                        docSpinner.fail('Failed to generate documentation files');
                        console.error(error);
                    }

                    // 4. Calculate project weight (node_modules size)
                    const statsSpinner = ora({
                        text: 'Calculating project weight...',
                        color: 'green',
                    }).start();

                    try {
                        const { stdout } = await execa('du', ['-sh', 'node_modules'], { cwd: projectPath });
                        const size = stdout.split('\t')[0];
                        statsSpinner.succeed(`Project weight: ${size} (node_modules)`);
                    } catch (error) {
                        statsSpinner.stop();
                        // Fail silently if du is not available
                    }

                    return 'All selected packages installed and initialized';
                },
            });

            actions.push('\n🌌 Vibe Check: COMPLETE. Your stack is ready.');
            actions.push(`🚀 Next steps:\n   cd ${data.projectName}\n   ${pmDocs.run} dev\n`);

            return actions;
        },
    });

    plop.setActionType('customSync', async (answers, config) => {
        return await config.action(answers);
    });
}
