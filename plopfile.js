import { execa } from 'execa';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import { PACKAGE_GROUPS, ALL_ITEMS } from './lib/packages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (plop) {
    plop.setGenerator('next-app', {
        description: 'Scaffold a custom Next.js app',
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
                return group.items.map(item => ({
                    type: 'confirm',
                    name: item.id,
                    message: `${group.category}: Include ${item.name}?`,
                    default: item.default,
                }));
            }),
        ],
        actions: (data) => {
            const actions = [];
            const projectPath = path.join(process.cwd(), data.projectName);

            // 1. Create Base Next.js App
            actions.push({
                type: 'customSync',
                async action(answers) {
                    const spinner = ora({
                        text: `Creating base Next.js app in ${answers.projectName}...`,
                        color: 'cyan',
                    }).start();

                    try {
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
                        ]);
                        spinner.succeed('Base Next.js app created!');
                        return 'Base Next.js app created';
                    } catch (error) {
                        spinner.fail('Failed to create Next.js app');
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

                    // Collect list-based selections (e.g. Payments)
                    PACKAGE_GROUPS.filter(g => g.type === 'list').forEach(group => {
                        const choice = answers[group.id];
                        if (choice && choice !== 'none' && group.providerConfig[choice]) {
                            selectedPackages.push({
                                ...group.providerConfig[choice],
                                id: `${group.id}_${choice}` // unique internal id
                            });
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
                            await execa('npm', ['install', '--legacy-peer-deps', ...installCmds], { cwd: projectPath });
                        }

                        // Dev Installs
                        if (devInstallCmds.length > 0) {
                            installSpinner.text = 'Installing devDependencies...';
                            await execa('npm', ['install', '-D', '--legacy-peer-deps', ...devInstallCmds], { cwd: projectPath });
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
                                        stdio: 'inherit'
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
                        const templateData = {
                            projectName: answers.projectName === '.' ? path.basename(projectPath) : answers.projectName,
                            selectedPackages
                        };

                        const readmeTmpl = fs.readFileSync(path.join(__dirname, 'templates/README.md.hbs'), 'utf8');
                        const agentsTmpl = fs.readFileSync(path.join(__dirname, 'templates/AGENTS.md.hbs'), 'utf8');

                        const renderedReadme = plop.renderString(readmeTmpl, templateData);
                        const renderedAgents = plop.renderString(agentsTmpl, templateData);

                        fs.writeFileSync(path.join(projectPath, 'README.md'), renderedReadme);
                        fs.writeFileSync(path.join(projectPath, 'AGENTS.md'), renderedAgents);

                        docSpinner.succeed('Documentation and AGENTS.md generated!');
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
