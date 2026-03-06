# Vibe Now 🌌

A premium, interactive CLI wizard for scaffolding modern full-stack React applications with a perfectly curated stack. Choose between **Next.js** or **TanStack Start**, pick your database, payments, and tooling — and start building within seconds.

<img width="3680" height="4144" alt="Terminal" src="https://github.com/user-attachments/assets/4a6e97c4-778b-432f-8fe0-46f1193aa543" />

## ✨ Features

- **Framework Choice**: Scaffold with **Next.js** (App Router) or **TanStack Start** (file-based routing, type-safe).
- **Interactive Wizard**: A beautiful CLI experience powered by Plop.js and Inquirer.
- **World-Class Feedback**: Engaged progress tracking with **Ora** spinners for a premium feel.
- **Smart Scaffolding**: Automatically orchestrates `create-next-app` or `@tanstack/cli create` and library-specific initializations (like `shadcn init` and `biome init`).
- **AI Project Support**: Generates **CLAUDE.md** (for Claude Code) or **AGENTS.md** (for Cursor/other AI assistants) tailored to your chosen stack.
- **Auto `.env.example`**: Generates a `.env.example` with all required environment variables grouped by package.
- **Template System**: Powered by Handlebars templates in the `templates/` directory for highly customized project initialization.
- **Safety First**: Project name validation and directory check to prevent accidental overwrites.

## 🛠️ The Curated Stack

### Framework (choose one)
- **Next.js** (App Router, TypeScript, Tailwind CSS v4)
- **TanStack Start** (File-based routing, TypeScript, Tailwind CSS v4)

### Optional Libraries
- **State**: Zustand
- **Validation**: Zod
- **Data Fetching**: TanStack React Query
- **UI & Components**: shadcn/ui, next-themes (Next.js) / tanstack-theme-kit (TanStack)
- **Database (choose one)**: Supabase + Drizzle ORM, Convex (Cloud), or Convex (Self-hosted)
- **Authentication**: Better Auth
- **Email**: Resend
- **Payments (choose one)**: Stripe or Polar.sh
- **AI SDK**: Vercel AI SDK & OpenRouter Provider support
- **Linting & Formatting (choose one)**: ESLint + Prettier or Biome
- **Testing (choose one)**: Vitest + React Testing Library, Playwright, or both
- **UI Helpers**: nuqs (Next.js only), React Hook Form, Day.js, Lodash

---

## 🚀 Quick Start

Launch the wizard without installation:

```bash
npx vibe-now
```

---

## 🛠️ Local Development

Clone the repo to customize the logic or add your own favorite packages.

### 1. Installation
```bash
git clone https://github.com/mosster/vibe-now.git
cd vibe-now
npm install
```

### 2. Linking for Development
To use the `vibe-now` command globally on your machine while developing:
```bash
npm link
```
Now you can run `vibe-now` from any directory!

### 3. Adding New Packages
The CLI uses a group-based configuration for easy maintenance. To add a new library:
1. Open `lib/packages.js`.
2. Find the relevant `PACKAGE_GROUPS` entry or add a new one.

```javascript
{
  category: 'My New Category',
  items: [
    {
      id: 'myPackage',
      name: 'Cool Library',
      install: ['cool-lib-package'],
      default: false
    }
  ]
}
```

### 4. Adding New Templates
The wizard generates `README.md`, `CLAUDE.md` or `AGENTS.md`, and `.env.example` automatically. To add a new template:
1. Create a Handlebars file in the `templates/` directory (e.g., `templates/CONFIG.md.hbs`).
2. Open `plopfile.js`.
3. Locate the `// 3. Generate README and AGENTS files` section.
4. Add your new template read and write logic:

```javascript
const myTmpl = fs.readFileSync(path.join(__dirname, 'templates/CONFIG.md.hbs'), 'utf8');
const renderedMy = plop.renderString(myTmpl, templateData);
fs.writeFileSync(path.join(projectPath, 'CONFIG.md'), renderedMy);
```

---

## 🤖 Prompting Examples for AI

Since most development on this CLI is done using AI assistants (Cursor, Claude, etc.), here are some proven prompts to extend the tool:

### To add a new library:
> "I want to add `lucide-react` to the UI Helpers category. It should be enabled by default. Add it to the configuration in `lib/packages.js` and suggest a good engineering guidance string for the AGENTS.md file."

### To add a new Mutual Exclusive option:
> "Add a new 'Database Driver' category under Database. It should be a single-choice list between 'Postgres (pg)' and 'SQLite (libsql)'. Map this correctly in the `providerConfig` so it installs the right packages."

### To add a new documentation template:
> "Create a new template `templates/ENVIRONMENT.hbs` that lists required .env variables for the selected packages. Then, update `plopfile.js` to render this as `.env.example` in the project root."

### To modify project validation:
> "Update the project name validation in `plopfile.js` to also check if the name is too long (over 100 characters) and return a custom error message."

---

## 📦 Publishing

When you're ready to release a new version:

1. Update version: `npm version patch` (or minor/major)
2. Login: `npm login`
3. Publish: `npm publish --access public`

---

## 📜 License
MIT © [Ed Moss](https://github.com/mosster)
