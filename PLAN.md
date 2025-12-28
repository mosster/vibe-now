# Custom CLI Wizard Plan (Plop.js + Next.js Stack)

This plan outlines the development of a custom CLI tool using **Plop.js** to automate the scaffolding of a Next.js project. The architecture is designed to be **DRY** and **scalable**, allowing for easy addition of new packages and commands.

## 1. Project Overview
A custom CLI (`vibe-init`) that:
- Prompts for project name.
- Dynamically generates interactive prompts for library selection.
- Orchestrates project creation and dependency installation using a configuration-driven approach.

## 2. Core Dependencies
- **plop**: Generator framework.
- **inquirer**: Interactive prompts.
- **execa**: Process execution.

## 3. Configuration-Driven Architecture (DRY & Scalable)
To keep the CLI easy to amend, we will use a `PACKAGE_CONFIG` array. Adding a new package only requires adding a new entry here. The logic will automatically generate prompts and handle installations based on this array.

Example structure:
```javascript
const PACKAGE_CONFIG = [
  {
    id: 'reactQuery',
    name: 'TanStack React Query',
    install: ['@tanstack/react-query'],
    default: true
  },
  {
    id: 'drizzle',
    name: 'Drizzle ORM + PG',
    install: ['drizzle-orm', 'pg'],
    devInstall: ['drizzle-kit'],
    default: true
  }
];
```

## 4. Implementation Details & Commands

### Base Next.js Setup
- **Command**: `npx create-next-app@latest {{projectName}} --ts --tailwind --app --eslint --import-alias "@/*" --yes`
- *Note*: Usually bundles TS and Tailwind, but specific commands are available if needed.

### Package Specifications
| Category | Commands |
| :--- | :--- |
| **NextJS** | `npx create-next-app@latest` |
| **Tailwind** | `npm install -D tailwindcss postcss autoprefixer` && `npx tailwindcss init -p` |
| **TypeScript** | `npm install -D typescript @types/react @types/node` |
| **React Query**| `npm install @tanstack/react-query` |
| **Zod** | `npm install zod` |
| **Zustand** | `npm install zustand` |
| **ShadCN** | `npx shadcn@latest init -y` && `npx shadcn@latest add --all` |
| **Better-Auth**| `npm install better-auth` |
| **Supabase** | `npm install @supabase/supabase-js` |
| **Drizzle** | `npm install drizzle-orm pg` && `npm install -D drizzle-kit` |

## 5. Implementation Phases

### Phase 1: Environment Setup
- Initialize package and configure `bin` field for global access.
- Install `plop`, `execa`, `inquirer`.

### Phase 2: Configuration Hub
- Define `packages.js` (or inline object) containing all package metadata and commands.

### Phase 3: CLI Entry Point (`index.js`)
- **Dynamic Prompts**: Iterate over config to create user questions.
- **Action Orchestrator**: 
  1. Create base project.
  2. Change directory.
  3. Batch install dependencies based on user selection.
  4. Run initialization scripts (e.g., `shadcn init`).

### Phase 4: Template Injection (Future)
- Use Plop's `modify` action to inject providers into `layout.tsx`.

## 7. Local Development & Deployment

### Local Development
1. **Link the package**: Run `npm link` in the root of the `vibe-cli` directory. This makes the command defined in `bin` (e.g., `vibe-init`) available globally on your machine.
2. **Iterate**: Changes to `index.js` or `lib/packages.js` will reflect immediately when you run the command again.
3. **Test**: Create a temporary folder and run `vibe-init my-test-app` to verify the full flow.

### Deployment to NPM
1. **Login**: `npm login` (if not already logged in).
2. **Versioning**: Update the version in `package.json` (e.g., `npm version patch`).
3. **Publish**: `npm publish --access public`.
4. **Usage**: Anyone can then run it via `npx vibe-init` or install it globally.

## 8. Implementation Progress
- [x] Phase 1: Environment Setup
- [x] Phase 2: Configuration Hub
- [x] Phase 3: CLI Entry Point
- [ ] Phase 4: Template Injection (Future)
