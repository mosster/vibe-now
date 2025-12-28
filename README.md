# Vibe CLI 🚀

A premium, interactive CLI wizard for scaffolding modern Next.js applications with a perfectly curated stack. Stop running manual `npm install` commands and start vibing.

## ✨ Features

- **Interactive Wizard**: A beautiful CLI experience powered by Plop.js and Inquirer.
- **Smart Scaffolding**: Automatically runs `create-next-app` under the hood.
- **Curated Stack**:
  - **Framework**: Next.js (App Router, TypeScript, Tailwind CSS)
  - **State Management**: Zustand
  - **Data Fetching**: TanStack React Query
  - **Validation**: Zod
  - **UI/Components**: shadcn/ui (with auto-initialization and component pre-loading)
  - **Backend/ORM**: Supabase (JS Client) & Drizzle ORM (with Postgres support)
  - **Authentication**: Better Auth
- **Scalable Architecture**: Easy-to-extend configuration for adding your own favorite libraries.
- **DRY & Batch Focused**: Installs all selected dependencies in a single pass to save time.

---

## 🚀 Quick Start

You don't even need to install it to try it out:

```bash
npx vibe-init
```

---

## 🛠️ Local Development

If you want to clone this repo and customize it for your own workflow:

### 1. Installation
```bash
git clone https://github.com/your-username/vibe-cli.git
cd vibe-cli
npm install
```

### 2. Linking for Global Use
To use the `vibe-init` command globally on your machine while developing:
```bash
npm link
```

Now you can run `vibe-init` from any directory!

### 3. Adding New Packages
The CLI is built with a "Configuration-First" approach. To add a new library to the wizard:
1. Open `lib/packages.js`.
2. Add a new object to the `PACKAGE_CONFIG` array:
   ```javascript
   {
     id: 'lucide',
     name: 'Lucide React Icons',
     install: ['lucide-react'],
     default: true
   }
   ```
The wizard will automatically handle the prompts and installation logic.

---

## 📦 Publishing to NPM

### 1. Prepare for Release
Ensure your `package.json` has a unique name and the correct version.
```bash
npm version patch
```

### 2. Login & Publish
```bash
npm login
npm publish --access public
```

---

## 📜 License
MIT © [Your Name/Organization]
