/**
 * Source files generated into the new project for list-based choices that need
 * more than a package install (e.g. Vitest config, API layer router + handlers).
 * Templates live in `templates/`; outputs are relative to the project root.
 */

import { getWorkflowFiles } from './workflow.js';

const UPLOAD_SCAFFOLDS = {
  uploadthing: ({ isTanStack, src }) => [
    ['uploads/uploadthing/core.ts.hbs', `${src}server/uploadthing.ts`],
    ['uploads/uploadthing/client.ts.hbs', `${src}lib/uploadthing.ts`],
    ['uploads/uploadthing/image-upload.tsx.hbs', `${src}components/image-upload.tsx`],
    isTanStack
      ? ['uploads/uploadthing/route.tanstack.ts.hbs', 'src/routes/api/uploadthing.ts']
      : ['uploads/uploadthing/route.nextjs.ts.hbs', 'app/api/uploadthing/route.ts'],
  ],
  r2: ({ isTanStack, src }) => [
    ['uploads/r2/storage.ts.hbs', `${src}server/storage.ts`],
    ['uploads/r2/upload.ts.hbs', `${src}lib/upload.ts`],
    ['uploads/r2/file-upload.tsx.hbs', `${src}components/file-upload.tsx`],
    isTanStack
      ? ['uploads/r2/route.tanstack.ts.hbs', 'src/routes/api/uploads.ts']
      : ['uploads/r2/route.nextjs.ts.hbs', 'app/api/uploads/route.ts'],
  ],
};

const JOB_SCAFFOLDS = {
  pgboss: ({ src }) => [
    ['jobs/pgboss/define.ts.hbs', `${src}server/jobs/define.ts`],
    ['jobs/pgboss/welcome-email.ts.hbs', `${src}server/jobs/welcome-email.ts`],
    ['jobs/pgboss/registry.ts.hbs', `${src}server/jobs/registry.ts`],
    ['jobs/pgboss/index.ts.hbs', `${src}server/jobs/index.ts`],
    ['jobs/pgboss/worker.ts.hbs', `${src}worker.ts`],
  ],
  inngest: ({ isTanStack, src }) => [
    ['jobs/inngest/client.ts.hbs', `${src}inngest/client.ts`],
    ['jobs/inngest/functions.ts.hbs', `${src}inngest/functions.ts`],
    isTanStack
      ? ['jobs/inngest/route.tanstack.ts.hbs', 'src/routes/api/inngest.ts']
      : ['jobs/inngest/route.nextjs.ts.hbs', 'app/api/inngest/route.ts'],
  ],
  trigger: ({ src }) => [
    ['jobs/trigger/trigger.config.ts.hbs', 'trigger.config.ts'],
    ['jobs/trigger/welcome-email.ts.hbs', `${src}trigger/welcome-email.ts`],
  ],
};

/**
 * package.json scripts the selected options need (added only where the project has no script by
 * that name). `dlx` is the package manager's one-off runner, e.g. `npx --yes` or `pnpm dlx`.
 */
export function getScaffoldScripts(answers, { dlx }) {
  const src = answers.framework === 'tanstack' ? 'src/' : '';
  switch (answers.jobs) {
    case 'pgboss':
      return {
        worker: `tsx --env-file-if-exists=.env.local ${src}worker.ts`,
        'worker:dev': `tsx watch --env-file-if-exists=.env.local ${src}worker.ts`,
      };
    case 'inngest':
      return { 'inngest:dev': `${dlx} inngest-cli@latest dev -u http://localhost:3000/api/inngest` };
    case 'trigger':
      return { 'trigger:dev': 'trigger dev', 'trigger:deploy': 'trigger deploy' };
    default:
      return {};
  }
}

const API_SCAFFOLDS = {
  orpc: ({ isTanStack, src }) => [
    ['api/orpc/router.ts.hbs', `${src}server/orpc/router.ts`],
    ['api/orpc/handlers.ts.hbs', `${src}server/orpc/handlers.ts`],
    ['api/orpc/client.ts.hbs', `${src}lib/orpc.ts`],
    ...(isTanStack
      ? [
          ['api/orpc/route-rpc.tanstack.ts.hbs', 'src/routes/api/rpc.$.ts'],
          ['api/orpc/route-openapi.tanstack.ts.hbs', 'src/routes/api/v1.$.ts'],
        ]
      : [
          ['api/orpc/route-rpc.nextjs.ts.hbs', 'app/api/rpc/[[...rest]]/route.ts'],
          ['api/orpc/route-openapi.nextjs.ts.hbs', 'app/api/v1/[[...rest]]/route.ts'],
        ]),
  ],
  trpc: ({ isTanStack, src, useReactQuery }) => [
    ['api/trpc/init.ts.hbs', `${src}server/trpc/init.ts`],
    ['api/trpc/router.ts.hbs', `${src}server/trpc/router.ts`],
    ['api/trpc/handler.ts.hbs', `${src}server/trpc/handler.ts`],
    ['api/trpc/client.ts.hbs', `${src}lib/trpc/client.ts`],
    ...(useReactQuery ? [['api/trpc/react.ts.hbs', `${src}lib/trpc/react.ts`]] : []),
    isTanStack
      ? ['api/trpc/route.tanstack.ts.hbs', 'src/routes/api/trpc.$.ts']
      : ['api/trpc/route.nextjs.ts.hbs', 'app/api/trpc/[trpc]/route.ts'],
  ],
};

/**
 * @param {object} answers wizard answers
 * @param {{ run: string, exec: string }} commands package-manager command prefixes (see `docCommands` in lib/package-managers.js)
 * @returns {{ files: Array<[string, string]>, data: object }} template → output pairs and the data to render them with
 */
export function getScaffoldFiles(answers, commands) {
  const isTanStack = answers.framework === 'tanstack';
  const src = isTanStack ? 'src/' : '';
  const testing = answers.testing || 'none';
  const apiLayer = answers.apiLayer || 'none';
  const data = {
    projectName: answers.projectName,
    isNextjs: !isTanStack,
    isTanStack,
    isPlaywright: testing === 'playwright' || testing === 'both',
    useReactQuery: Boolean(answers.reactQuery),
    pm: commands,
  };

  const files = [];
  if (testing === 'vitest' || testing === 'both') {
    files.push(
      ['vitest/vitest.config.ts.hbs', 'vitest.config.ts'],
      ['vitest/vitest.setup.ts.hbs', 'vitest.setup.ts'],
      ['vitest/example.test.tsx.hbs', `${src}__tests__/example.test.tsx`],
    );
  }
  if (answers.mcp) {
    // Tools come from the oRPC router when oRPC is the API layer; otherwise one hand-written example tool
    const fromRouter = apiLayer === 'orpc';
    files.push(
      ['mcp/handler.ts.hbs', `${src}server/mcp/handler.ts`],
      [fromRouter ? 'mcp/tools.orpc.ts.hbs' : 'mcp/tools.standalone.ts.hbs', `${src}server/mcp/tools.ts`],
      ...(fromRouter ? [['mcp/orpc-tools.ts.hbs', `${src}server/mcp/orpc-tools.ts`]] : []),
      isTanStack
        ? ['mcp/route.tanstack.ts.hbs', 'src/routes/api/mcp.ts']
        : ['mcp/route.nextjs.ts.hbs', 'app/api/mcp/route.ts'],
    );
  }
  if (answers.posthog || answers.sentry) {
    // One browser entry for both SDKs: Next.js loads instrumentation-client.ts, TanStack Start src/client.tsx
    files.push(isTanStack
      ? ['analytics/client.tanstack.tsx.hbs', 'src/client.tsx']
      : ['analytics/instrumentation-client.ts.hbs', 'instrumentation-client.ts']);
  }
  if (answers.posthog) {
    files.push(['analytics/posthog/server.ts.hbs', `${src}lib/posthog/server.ts`]);
  }
  if (answers.sentry) {
    files.push(...(isTanStack
      ? [
          ['analytics/sentry/instrument.server.ts.hbs', 'src/instrument.server.ts'],
          ['analytics/sentry/server.tanstack.ts.hbs', 'src/server.ts'],
          ['analytics/sentry/start.tanstack.ts.hbs', 'src/start.ts'],
        ]
      : [
          ['analytics/sentry/instrumentation.ts.hbs', 'instrumentation.ts'],
          ['analytics/sentry/sentry.server.config.ts.hbs', 'sentry.server.config.ts'],
          ['analytics/sentry/sentry.edge.config.ts.hbs', 'sentry.edge.config.ts'],
          ['analytics/sentry/global-error.tsx.hbs', 'app/global-error.tsx'],
        ]));
  }
  if (JOB_SCAFFOLDS[answers.jobs]) {
    files.push(...JOB_SCAFFOLDS[answers.jobs]({ isTanStack, src }));
  }
  if (UPLOAD_SCAFFOLDS[answers.uploads]) {
    files.push(...UPLOAD_SCAFFOLDS[answers.uploads]({ isTanStack, src }));
  }
  if (answers.effect) {
    files.push(
      ['effect/greeter.ts.hbs', `${src}lib/effect/greeter.ts`],
      ['effect/runtime.ts.hbs', `${src}lib/effect/runtime.ts`],
    );
  }
  if (API_SCAFFOLDS[apiLayer]) {
    files.push(...API_SCAFFOLDS[apiLayer]({ isTanStack, src, useReactQuery: data.useReactQuery }));
  }
  // The phased workflow's docs/ skeleton, plus review and handoff skills for Claude Code projects
  files.push(...getWorkflowFiles({ workflow: answers.workflow, isClaudeCode: Boolean(answers.isClaudeCode) }));

  return { files, data };
}
