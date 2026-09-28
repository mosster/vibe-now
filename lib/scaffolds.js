/**
 * Source files generated into the new project for list-based choices that need
 * more than a package install (e.g. Vitest config, API layer router + handlers).
 * Templates live in `templates/`; outputs are relative to the project root.
 */

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
 * @returns {{ files: Array<[string, string]>, data: object }} template → output pairs and the data to render them with
 */
export function getScaffoldFiles(answers) {
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
  };

  const files = [];
  if (testing === 'vitest' || testing === 'both') {
    files.push(
      ['vitest/vitest.config.ts.hbs', 'vitest.config.ts'],
      ['vitest/vitest.setup.ts.hbs', 'vitest.setup.ts'],
      ['vitest/example.test.tsx.hbs', `${src}__tests__/example.test.tsx`],
    );
  }
  if (API_SCAFFOLDS[apiLayer]) {
    files.push(...API_SCAFFOLDS[apiLayer]({ isTanStack, src, useReactQuery: data.useReactQuery }));
  }

  return { files, data };
}
