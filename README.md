# Vibe Now 🌌

A premium, interactive CLI wizard for scaffolding modern Next.js applications with a perfectly curated stack. Stop running manual `npm install` commands and start building within seconds.

<img width="3680" height="4144" alt="Terminal" src="https://github.com/user-attachments/assets/4a6e97c4-778b-432f-8fe0-46f1193aa543" />

## ✨ Features

- **Interactive Wizard**: A beautiful CLI experience powered by Plop.js and Inquirer.
- **World-Class Feedback**: Engaged progress tracking with **Ora** spinners for a premium feel.
- **Smart Scaffolding**: Automatically orchestrates `create-next-app` and library-specific initializations (like `shadcn init` and `biome init`).
- **Dynamic Documentation**: Automatically generates a project-specific `README.md` and a comprehensive `AGENTS.md` to guide AI assistants (Cursor, Claude) on your stack and standards.
- **Template System**: Powered by Handlebars templates in the `templates/` directory for highly customized project initialization.
- **Safety First**: Project name validation and directory check to prevent accidental overwrites.

## 🛠️ The Curated Stack

### Base
- **Framework**: Next.js (App Router, TypeScript, Tailwind CSS v4)

### Optional Libraries
- **State**: Zustand
- **Validation**: Zod
- **Data Fetching**: TanStack React Query
- **UI & Components**: shadcn/ui (Initializes & adds all components automatically)
- **Database & ORM**: Supabase JS client, Drizzle ORM (Postgres + Drizzle Kit)
- **Authentication**: Better Auth
- **Email**: Resend
- **Payments**: Mutually exclusive selection between **Stripe** and **Polar.sh**
- **AI SDK**: Vercel AI SDK & OpenRouter Provider support
- **Linting & Formatting**: Choose between **ESLint + Prettier** or **Biome** (High speed)
- **UI Helpers**: nuqs, React Hook Form, Day.js, Lodash

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
The wizard currently generates `README.md` and `AGENTS.md` automatically. To add a new template:
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

## 📦 Publishing

When you're ready to release a new version:

1. Update version: `npm version patch` (or minor/major)
2. Login: `npm login`
3. Publish: `npm publish --access public`

---

## 📜 License
MIT © [Ed Moss](https://github.com/mosster)
