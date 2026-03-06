import { execa } from 'execa';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import { PACKAGE_GROUPS, ALL_ITEMS } from './lib/packages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (plop) {
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
                type: 'confirm',
                name: 'isClaudeCode',
                message: 'Is this a Claude Code project? (generates CLAUDE.md instead of AGENTS.md)',
                default: true,
            },
            ...PACKAGE_GROUPS.flatMap((group) => {
                if (group.type === 'list') {
                    return [{
                        type: 'list',
                        name: group.id,
                        message: `${group.category}:`,
                        choices: group.choices,
                        default: group.default,
                    }];
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
                        if (isTanStack) {
                            await execa('npx', [
                                '@tanstack/cli', 'create',
                                answers.projectName,
                                '--tailwind',
                                '--no-examples',
                                '--no-git',
                                '--no-toolchain',
                            ], {
                                env: { ...process.env, npm_config_legacy_peer_deps: 'true' }
                            });
                        } else {
                            await execa('npx', [
                                'create-next-app@latest',
                                answers.projectName,
                                '--ts',
                                '--tailwind',
                                '--app',
                                '--eslint',
                                '--import-alias',
                                '@/*',
                                '--yes',
                            ], {
                                env: { ...process.env, npm_config_legacy_peer_deps: 'true' }
                            });
                        }
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
                    // Collect standard selections
                    const selectedPackages = ALL_ITEMS.filter(item => answers[item.id]);

                    // Collect list-based selections (e.g. Payments, Database, Linting)
                    const isNextjs = answers.framework === 'nextjs';
                    PACKAGE_GROUPS.filter(g => g.type === 'list').forEach(group => {
                        const choice = answers[group.id];
                        if (choice && choice !== 'none' && group.providerConfig[choice]) {
                            const config = { ...group.providerConfig[choice] };
                            // Merge framework-specific dev dependencies
                            if (isNextjs && config.devInstallNextjs) {
                                config.devInstall = [...(config.devInstall || []), ...config.devInstallNextjs];
                            }
                            config.id = `${group.id}_${choice}`;
                            selectedPackages.push(config);
                        }
                    });

                    if (selectedPackages.length === 0) return 'No additional packages selected';

                    const pkgNames = selectedPackages.map(p => p.name).join(', ');
                    const installSpinner = ora({
                        text: `Installing: ${pkgNames}...`,
                        color: 'magenta',
                    }).start();

                    const installCmds = selectedPackages.flatMap(pkg => pkg.install || []);
                    const devInstallCmds = selectedPackages.flatMap(pkg => pkg.devInstall || []);

                    try {
                        // Standard Installs
                        if (installCmds.length > 0) {
                            await execa('npm', ['install', '--legacy-peer-deps', ...installCmds], {
                                cwd: projectPath,
                                env: { ...process.env, npm_config_legacy_peer_deps: 'true' }
                            });
                        }

                        // Dev Installs
                        if (devInstallCmds.length > 0) {
                            installSpinner.text = 'Installing devDependencies...';
                            await execa('npm', ['install', '-D', '--legacy-peer-deps', ...devInstallCmds], {
                                cwd: projectPath,
                                env: { ...process.env, npm_config_legacy_peer_deps: 'true' }
                            });
                        }
                        installSpinner.succeed('Packages installed successfully!');
                    } catch (error) {
                        installSpinner.fail('Package installation failed');
                        throw error;
                    }

                    // Run initialization commands (like shadcn init)
                    for (const pkg of selectedPackages) {
                        if (pkg.commands && pkg.commands.length > 0) {
                            console.log(`\n✨ Finalizing ${pkg.name}...`);

                            try {
                                for (const cmd of pkg.commands) {
                                    const [command, ...args] = cmd;
                                    // Use 'inherit' so user can see/interact with shadow-style commands
                                    await execa(command, args, {
                                        cwd: projectPath,
                                        stdio: 'inherit',
                                        env: {
                                            ...process.env,
                                            npm_config_legacy_peer_deps: 'true'
                                        }
                                    });
                                }
                            } catch (error) {
                                console.error(`❌ Failed to initialize ${pkg.name}`);
                                throw error;
                            }
                        }
                    }

                    // 3. Generate README and AGENTS files
                    const docSpinner = ora({
                        text: 'Generating custom documentation and agent rules...',
                        color: 'blue',
                    }).start();

                    try {
                        const databaseChoice = answers.database || 'none';
                        const testingChoice = answers.testing || 'none';
                        const isTanStack = answers.framework === 'tanstack';
                        const templateData = {
                            projectName: answers.projectName === '.' ? path.basename(projectPath) : answers.projectName,
                            selectedPackages,
                            isSupabase: databaseChoice === 'supabase',
                            isConvex: databaseChoice === 'convex_cloud' || databaseChoice === 'convex_self',
                            isNextjs: !isTanStack,
                            isTanStack,
                            isVitest: testingChoice === 'vitest' || testingChoice === 'both',
                            isPlaywright: testingChoice === 'playwright' || testingChoice === 'both',
                        };

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
                            fs.writeFileSync(path.join(projectPath, 'AGENTS.md'), renderedAgents);
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
            actions.push(`🚀 Next steps:\n   cd ${data.projectName}\n   npm run dev\n`);

            return actions;
        },
    });

    plop.setActionType('customSync', async (answers, config) => {
        return await config.action(answers);
    });
}
