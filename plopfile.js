import { execa } from 'execa';
import path from 'node:path';
import { PACKAGE_CONFIG } from './lib/packages.js';

export default function (plop) {
    plop.setGenerator('next-app', {
        description: 'Scaffold a custom Next.js app',
        prompts: [
            {
                type: 'input',
                name: 'projectName',
                message: 'What is your project name?',
                default: 'my-vibe-app',
            },
            ...PACKAGE_CONFIG.map((pkg) => ({
                type: 'confirm',
                name: pkg.id,
                message: `Include ${pkg.name}?`,
                default: pkg.default,
            })),
        ],
        actions: (data) => {
            const actions = [];
            const projectPath = path.join(process.cwd(), data.projectName);

            // 1. Create Base Next.js App
            actions.push({
                type: 'customSync',
                async action(answers) {
                    console.log(`\n🚀 Creating base Next.js app in ${answers.projectName}...`);
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
                    ], { stdio: 'inherit' });
                    return 'Base Next.js app created';
                },
            });

            // 2. Install selected packages & run commands
            actions.push({
                type: 'customSync',
                async action(answers) {
                    const selectedPackages = PACKAGE_CONFIG.filter(pkg => answers[pkg.id]);

                    if (selectedPackages.length === 0) return 'No additional packages selected';

                    console.log('\n📦 Installing selected packages...');

                    const installCmds = selectedPackages.flatMap(pkg => pkg.install || []);
                    const devInstallCmds = selectedPackages.flatMap(pkg => pkg.devInstall || []);

                    // Run standard installs
                    if (installCmds.length > 0) {
                        console.log(`\n📦 Installing: ${selectedPackages.filter(p => p.install?.length).map(p => p.name).join(', ')}...`);
                        await execa('npm', ['install', ...installCmds], {
                            cwd: projectPath,
                            stdio: 'inherit'
                        });
                    }

                    // Run dev installs
                    if (devInstallCmds.length > 0) {
                        console.log(`\n🛠️  Installing devDependencies: ${selectedPackages.filter(p => p.devInstall?.length).map(p => p.name).join(', ')}...`);
                        await execa('npm', ['install', '-D', ...devInstallCmds], {
                            cwd: projectPath,
                            stdio: 'inherit'
                        });
                    }

                    // Run initialization commands (like shadcn init)
                    for (const pkg of selectedPackages) {
                        if (pkg.commands && pkg.commands.length > 0) {
                            console.log(`\n⚙️  Running initialization for ${pkg.name}...`);
                            for (const cmd of pkg.commands) {
                                const [command, ...args] = cmd.split(' ');
                                await execa(command, args, {
                                    cwd: projectPath,
                                    stdio: 'inherit'
                                });
                            }
                        }
                    }

                    return 'All selected packages installed and initialized';
                },
            });

            actions.push('\n🎉 Setup complete! Next steps:');
            actions.push(`   cd ${data.projectName}`);
            actions.push('   npm run dev\n');

            return actions;
        },
    });

    // Custom action type that waits for the promise
    plop.setActionType('customSync', async (answers, config) => {
        return await config.action(answers);
    });
}
