/**
 * The phased development workflow (research → spike → spec → build → review → handoff, with ADRs),
 * as run in the founder's apps: "gated" like Ketty and seo-auditor (independent reviews before every
 * merge), "light" like Maestro and social-listening (reviews on demand, speed to the MVP).
 *
 * Picking one adds a Workflow section to CLAUDE.md / AGENTS.md, a `docs/` skeleton, `typecheck` and
 * `check` scripts, and (Claude Code projects only) review and handoff skills in `.claude/skills/`.
 */

export const WORKFLOWS = {
  light: {
    name: 'Phased, light (reviews on demand, speed to MVP)',
    label: 'light',
  },
  gated: {
    name: 'Phased, gated (independent reviews before every merge)',
    label: 'gated',
  },
  none: {
    name: 'None',
    label: 'none',
  },
};

export const WORKFLOW_IDS = Object.keys(WORKFLOWS);
export const DEFAULT_WORKFLOW = 'light';

/** The review skills generated for Claude Code projects, with when each runs at each rigor. */
export const REVIEW_SKILLS = [
  {
    id: 'backend-review',
    what: 'An independent reviewer reads the server code in full and reproduces each finding',
    light: 'End of a phase, or when asked',
    gated: 'Every sub-phase',
  },
  {
    id: 'security-review',
    what: 'Automated checks (secrets, advisories, the browser boundary), then an independent reviewer attacks each read and write',
    light: 'Before anything is deployed; end of a phase',
    gated: 'Every sub-phase',
  },
  {
    id: 'frontend-review',
    what: 'The app in a real browser at desktop and phone width, light and dark, against a UI and copy checklist',
    light: 'After UI changes, or when asked',
    gated: 'Every sub-phase with UI changes',
  },
  {
    id: 'docs-review',
    what: 'CLAUDE.md, the docs and .env.example checked against the code; every documented command run',
    light: 'End of a phase',
    gated: 'Every sub-phase, before merging',
  },
];

/** `docs/` files: [template under templates/workflow/docs/, output path]. */
const DOC_FILES = [
  'research/README.md',
  'spikes/README.md',
  'spikes/SPIKE_TEMPLATE.md',
  'phases/SPEC_MASTER_CHECKLIST.md',
  'phases/SPEC_TEMPLATE.md',
  'phases/phase-production/SPEC_PRODUCTION_READINESS.md',
  'decisions/README.md',
  'decisions/ADR_TEMPLATE.md',
  'decisions/0001-product-development-workflow.md',
  'decisions/0002-the-starting-stack.md',
  'reviews/README.md',
  'guides/README.md',
  'handoffs/README.md',
];

/**
 * @returns {Array<[string, string]>} template (relative to templates/) → output path, for the chosen workflow
 */
export function getWorkflowFiles({ workflow = 'none', isClaudeCode = false } = {}) {
  if (!workflow || workflow === 'none') return [];
  const files = DOC_FILES.map((file) => [`workflow/docs/${file}.hbs`, `docs/${file}`]);
  if (isClaudeCode) {
    for (const skill of ['handoff', ...REVIEW_SKILLS.map((s) => s.id)]) {
      files.push([`workflow/skills/${skill}.md.hbs`, `.claude/skills/${skill}/SKILL.md`]);
    }
  }
  return files;
}

/** Template data for the workflow sections and files. */
export function workflowData(workflow = 'none', { isClaudeCode = false } = {}) {
  const id = WORKFLOW_IDS.includes(workflow) ? workflow : 'none';
  return {
    workflow: id,
    hasWorkflow: id !== 'none',
    isGated: id === 'gated',
    isLight: id === 'light',
    hasSkills: id !== 'none' && isClaudeCode,
    reviewSkills: REVIEW_SKILLS.map((s) => ({ id: s.id, what: s.what, when: id === 'gated' ? s.gated : s.light })),
  };
}

/**
 * The scripts the workflow's gate runs, added to package.json:
 * `typecheck` (Next.js generates its route types first) and `check` (typecheck, then lint and test when present).
 * Existing scripts are never replaced.
 *
 * @param {Record<string, string>} scripts the project's current scripts
 * @param {{ isNextjs: boolean, run: string }} options
 * @returns {Record<string, string>} the scripts to add
 */
export function gateScripts(scripts = {}, { isNextjs, run }) {
  const added = {};
  if (!scripts.typecheck) {
    // Both frameworks generate route types the code imports; generate them first so a fresh clone typechecks.
    // TanStack Start: its own `generate-routes` script (`vite build`); `tsr generate` would drop Start's types.
    if (isNextjs) added.typecheck = 'next typegen && tsc --noEmit';
    else if (scripts['generate-routes']) added.typecheck = `${run} generate-routes && tsc --noEmit`;
    else added.typecheck = 'tsc --noEmit';
  }
  if (!scripts.check) {
    const steps = ['typecheck', ...['lint', 'test'].filter((name) => scripts[name])];
    added.check = steps.map((name) => `${run} ${name}`).join(' && ');
  }
  return added;
}
