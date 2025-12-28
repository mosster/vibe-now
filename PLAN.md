# Custom CLI Wizard Plan (Plop.js + Next.js Stack)

This project has been successfully implemented and released as **Vibe Now**.

## 1. Project Overview
A custom CLI (`vibe-now`) that:
- Prompts for project name with validation.
- Dynamically generates interactive prompts group by category.
- Orchestrates project creation and dependency installation using a configuration-driven approach.
- Generates dynamic documentation (AGENTS.md and README.md).

## 2. Core Dependencies
- **plop**: Generator framework.
- **inquirer**: Interactive prompts.
- **execa**: Process execution.
- **ora**: Premium progress spinners.
- **handlebars**: Template engine for file generation.

## 3. Configuration-Driven Architecture (DRY & Scalable)
The CLI uses a `PACKAGE_GROUPS` array in `lib/packages.js`. Adding a new package or category is fully decoupled from the core logic.

## 4. Implementation Details & Commands

### Base Next.js Setup
- **Command**: `npx create-next-app@latest`

### Features Implemented
- **AI SDK**: Vercel AI SDK & OpenRouter.
- **Linters**: ESLint/Prettier and Biome selection.
- **UI & Helpers**: shadcn/ui, nuqs, hook-form, dayjs, lodash.
- **Database**: Supabase & Drizzle ORM.
- **Payments**: Stripe & Polar.sh.
- **Authentication**: Better Auth.

## 5. Implementation Status

- [x] **Phase 1: Environment Setup** - Completed with ESM support and binary linking.
- [x] **Phase 2: Configuration Hub** - Scalable group-based configuration implemented.
- [x] **Phase 3: CLI Entry Point** - `index.js` and `plopfile.js` logic finalized.
- [x] **Phase 4: Premium UI** - **Ora** spinners integrated for all major steps.
- [x] **Phase 5: Smart Validation** - URL-safe project names and empty directory checks.
- [x] **Phase 6: Dynamic Documentation** - Handlebars-based `README.md` and `AGENTS.md` generation.

## 6. Project Structure
```text
vibe-cli/
├── lib/
│   └── packages.js     # Centralized configuration
├── templates/          # HBS templates (README, AGENTS)
├── index.js            # CLI Entry point 
├── plopfile.js         # Plop logic & Action orchestrator
├── package.json
└── README.md
```
