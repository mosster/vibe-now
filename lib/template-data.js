/**
 * The data every generated file renders with: starter files, the workflow's docs/ and skills,
 * README.md, CLAUDE.md / AGENTS.md and .env.example.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { workflowData } from './workflow.js';

const TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates');

/** Today's date as YYYY-MM-DD in the local time zone (toISOString would give UTC's date). */
export function localDate(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * @param {object} answers the wizard's answers
 * @param {{ projectName: string, selectedPackages: object[], pm: object }} context
 *   selectedPackages already localized for the package manager; pm from `docCommands`
 * @param {(template: string, data: object) => string} render Handlebars render (plop.renderString in the CLI)
 */
export function buildTemplateData(answers, { projectName, selectedPackages, pm }, render) {
  const databaseChoice = answers.database || 'none';
  const testingChoice = answers.testing || 'none';
  const isTanStack = answers.framework === 'tanstack';
  const data = {
    projectName,
    selectedPackages,
    pm,
    isClaudeCode: Boolean(answers.isClaudeCode),
    docFile: answers.isClaudeCode ? 'CLAUDE.md' : 'AGENTS.md',
    date: localDate(),
    src: isTanStack ? 'src/' : '',
    isNextjs: !isTanStack,
    isTanStack,
    isEffect: Boolean(answers.effect),
    isSupabase: databaseChoice === 'supabase',
    isPostgres: databaseChoice === 'postgres',
    isConvex: databaseChoice === 'convex_cloud' || databaseChoice === 'convex_self',
    isSQLite: databaseChoice === 'sqlite_turso' || databaseChoice === 'sqlite_self',
    isTurso: databaseChoice === 'sqlite_turso',
    isDrizzle: ['supabase', 'postgres', 'sqlite_turso', 'sqlite_self'].includes(databaseChoice),
    hasDatabase: databaseChoice !== 'none',
    isORPC: answers.apiLayer === 'orpc',
    isTRPC: answers.apiLayer === 'trpc',
    hasApi: answers.apiLayer === 'orpc' || answers.apiLayer === 'trpc',
    isBetterAuth: Boolean(answers.betterAuth),
    hasAi: Boolean(answers.aiSdk || answers.openRouter),
    hasEmail: Boolean(answers.resend),
    hasPayments: Boolean(answers.paymentProvider && answers.paymentProvider !== 'none'),
    hasZod: Boolean(answers.zod),
    hasShadcn: Boolean(answers.shadcn),
    isMcp: Boolean(answers.mcp),
    isPgBoss: answers.jobs === 'pgboss',
    isInngest: answers.jobs === 'inngest',
    isTrigger: answers.jobs === 'trigger',
    hasJobs: Boolean(answers.jobs && answers.jobs !== 'none'),
    isUploadThing: answers.uploads === 'uploadthing',
    isR2: answers.uploads === 'r2',
    hasUploads: Boolean(answers.uploads && answers.uploads !== 'none'),
    isPostHog: Boolean(answers.posthog),
    isSentry: Boolean(answers.sentry),
    isVitest: testingChoice === 'vitest' || testingChoice === 'both',
    isPlaywright: testingChoice === 'playwright' || testingChoice === 'both',
    ...workflowData(answers.workflow, { isClaudeCode: answers.isClaudeCode }),
  };

  // The workflow's sections are rendered once and dropped into CLAUDE.md / AGENTS.md
  if (data.hasWorkflow) {
    const renderSection = (file) =>
      render(fs.readFileSync(path.join(TEMPLATES_DIR, 'workflow', file), 'utf8'), data).trimEnd();
    data.workflowSection = renderSection('WORKFLOW.md.hbs');
    data.conventionsSection = renderSection('CONVENTIONS.md.hbs');
  }
  return data;
}
