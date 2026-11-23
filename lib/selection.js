/**
 * Turning the wizard's answers into the packages to install and the prompts to show.
 * One place, so the CLI and the tests resolve a selection the same way.
 */

import { PACKAGE_GROUPS, ALL_ITEMS } from './packages.js';

/**
 * A package config with its conditional installs merged in for these answers:
 * - `installByFramework` / `devInstallByFramework`: `{ nextjs: [...], tanstack: [...] }`
 * - `devInstallNextjs`: dev dependencies only Next.js needs (kept for existing configs)
 * - `installWithReactQuery`: integrations added when TanStack React Query is selected
 * - `envVarsByFramework`: env vars whose names differ per framework (`NEXT_PUBLIC_*` vs `VITE_*`)
 * - `guidance` as a function of the answers, resolved to a string
 */
export function resolveConfig(config, answers) {
  const framework = answers.framework === 'tanstack' ? 'tanstack' : 'nextjs';
  const install = [
    ...(config.install || []),
    ...(config.installByFramework?.[framework] || []),
    ...(answers.reactQuery ? config.installWithReactQuery || [] : []),
  ];
  const devInstall = [
    ...(config.devInstall || []),
    ...(framework === 'nextjs' ? config.devInstallNextjs || [] : []),
    ...(config.devInstallByFramework?.[framework] || []),
  ];
  return {
    ...config,
    // Guidance may depend on other answers (e.g. MCP tools come from the oRPC router when oRPC is picked)
    ...(typeof config.guidance === 'function' && { guidance: config.guidance(answers) }),
    ...(config.envVarsByFramework && { envVars: [...(config.envVars || []), ...(config.envVarsByFramework[framework] || [])] }),
    ...(install.length > 0 && { install }),
    ...(devInstall.length > 0 && { devInstall }),
  };
}

/** Every package config the answers select: confirmed items, then each list group's choice. */
export function selectPackages(answers) {
  const selected = ALL_ITEMS.filter((item) => answers[item.id]).map((item) => resolveConfig(item, answers));
  for (const group of PACKAGE_GROUPS.filter((g) => g.type === 'list')) {
    const choice = answers[group.id];
    if (choice && choice !== 'none' && group.providerConfig[choice]) {
      selected.push({ ...resolveConfig(group.providerConfig[choice], answers), id: `${group.id}_${choice}` });
    }
  }
  return selected;
}

/**
 * A list group's choices for the prompt. A choice may declare `requires(answers)`, returning a
 * reason string when it can't be picked (shown disabled with that reason) or nothing when it can.
 */
export function listChoices(group) {
  if (!group.choices.some((c) => c.requires)) return group.choices;
  return (answers) =>
    group.choices.map(({ requires, ...choice }) => {
      const reason = requires?.(answers);
      return reason ? { ...choice, disabled: reason } : choice;
    });
}
