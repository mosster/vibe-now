// Builds the README image (.github/assets/wizard.svg). Usage: node scripts/readme-image.mjs .github/assets/wizard.svg
// The transcript below is from a real wizard run (Next.js + pnpm); shadcn's own sub-steps are left out.
import fs from 'node:fs';

const out = process.argv[2];

// [kind, ...parts]. Taken from a real run (Next.js + pnpm).
const Q = (msg, ans) => ['q', msg, ans];
const lines = [
  ['cmd', '~/code', 'pnpm dlx vibe-now'],
  ['blank'],
  Q('What is your project name?', 'my-app'),
  Q('Choose your framework:', 'Next.js (App Router, stable)'),
  Q('Choose your package manager:', 'pnpm (11.17.0)'),
  Q('Is this a Claude Code project? (generates CLAUDE.md instead of AGENTS.md)', 'Yes'),
  Q('Development workflow (specs, ADRs, reviews, handoffs):', 'Phased, light (reviews on demand, speed to MVP)'),
  Q('State Management: Include Zustand?', 'Yes'),
  Q('Validation: Include Zod?', 'Yes'),
  Q('Effect System: Include Effect (effect-ts v4)?', 'No'),
  Q('Data Fetching: Include TanStack React Query?', 'Yes'),
  Q('UI & Components: Include shadcn/ui?', 'Yes'),
  Q('UI & Components: Include next-themes (Dark Mode)?', 'Yes'),
  Q('UI & Components: Include Motion (motion.dev, formerly Framer Motion)?', 'Yes'),
  Q('Authentication: Include Better Auth?', 'Yes'),
  Q('Database (Select One):', 'Postgres + Drizzle ORM (any host: local Docker, Neon, Railway, RDS, ...)'),
  Q('API Layer (Select One):', 'oRPC (type-safe RPC + OpenAPI spec & docs)'),
  Q('Agent Surface: Include MCP server (/api/mcp)?', 'Yes'),
  Q('Email: Include Resend?', 'Yes'),
  Q('Payments (Select One):', 'Stripe (Server + Client SDKs)'),
  Q('AI SDK: Include Vercel AI SDK?', 'Yes'),
  Q('AI SDK: Include OpenRouter AI SDK Provider?', 'No'),
  Q('Background Jobs (Select One):', 'pg-boss (queue in your Postgres, separate worker process)'),
  Q('File Uploads (Select One):', 'Cloudflare R2 (S3 API, direct browser uploads)'),
  Q('Analytics & Monitoring: Include PostHog (product analytics)?', 'Yes'),
  Q('Analytics & Monitoring: Include Sentry (error tracking)?', 'Yes'),
  Q('Linting & Formatting:', 'ESLint + Prettier (Standard)'),
  Q('Testing (Select One):', 'Vitest + React Testing Library (Unit/Component)'),
  Q('UI Helpers: Include nuqs?', 'Yes'),
  Q('UI Helpers: Include React Hook Form?', 'Yes'),
  Q('UI Helpers: Include Day.js?', 'No'),
  Q('UI Helpers: Include Lodash?', 'No'),
  ['blank'],
  ['ok', 'Base Next.js app created!'],
  ['ok', 'Packages installed successfully!'],
  ['emoji', '✨', 'Finalizing shadcn/ui...'],
  ['ok', 'Starter files generated (45 files)'],
  ['ok', 'Documentation, CLAUDE.md, .env.example generated!'],
  ['ok', 'Project weight: 1.3G (node_modules)'],
  ['blank'],
  ['emoji', '🌌', 'Vibe Check: COMPLETE. Your stack is ready.', 'strong'],
  ['emoji', '🚀', 'Next steps:'],
  ['plain', '   cd my-app'],
  ['plain', '   pnpm dev'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FONT = 13.5;
const LH = 21.5;
const W = 1000;
const MARGIN = 44;
const WIN_X = MARGIN;
const WIN_W = W - MARGIN * 2;
const BAR = 42;
const PAD_X = 26;
const PAD_TOP = 30;
const PAD_BOTTOM = 26;
const WIN_Y = MARGIN;
const WIN_H = BAR + PAD_TOP + (lines.length - 1) * LH + PAD_BOTTOM + 6;
const H = Math.ceil(WIN_H + MARGIN * 2);

const C = {
  text: '#d6deeb',
  msg: '#e6edf3',
  dim: '#7d8590',
  green: '#3fb950',
  cyan: '#56d4dd',
  purple: '#c4a7ff',
  prompt: '#7aa2f7',
};

const body = lines
  .map((line, i) => {
    const y = WIN_Y + BAR + PAD_TOP + i * LH;
    const x = WIN_X + PAD_X;
    const [kind, a, b, c] = line;
    switch (kind) {
      case 'blank':
        return '';
      case 'cmd':
        return `<text x="${x}" y="${y}"><tspan fill="${C.purple}">❯</tspan> <tspan fill="${C.prompt}">${esc(a)}</tspan> <tspan fill="${C.msg}" font-weight="600">${esc(b)}</tspan></text>`;
      case 'q':
        return `<text x="${x}" y="${y}"><tspan fill="${C.green}" font-weight="700">?</tspan> <tspan fill="${C.msg}" font-weight="600">${esc(a)}</tspan> <tspan fill="${b === 'No' ? C.dim : C.cyan}">${esc(b)}</tspan></text>`;
      case 'ok':
        return `<text x="${x}" y="${y}"><tspan fill="${C.green}">✔</tspan> <tspan fill="${C.text}">${esc(a)}</tspan></text>`;
      case 'emoji':
        return `<text x="${x}" y="${y}"><tspan>${a}</tspan> <tspan fill="${c ? C.msg : C.text}"${c ? ' font-weight="700"' : ''}>${esc(b)}</tspan></text>`;
      case 'plain':
        return `<text x="${x}" y="${y}" fill="${C.cyan}" xml:space="preserve">${esc(a)}</text>`;
      default:
        throw new Error(kind);
    }
  })
  .filter(Boolean)
  .join('\n    ');

// A quiet starfield on the backdrop (deterministic, so the file only changes when the content does)
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const stars = Array.from({ length: 70 }, () => {
  const x = (rand() * W).toFixed(1);
  const y = (rand() * H).toFixed(1);
  const r = (0.5 + rand() * 1.1).toFixed(2);
  const o = (0.25 + rand() * 0.55).toFixed(2);
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
}).join('');

const titleX = WIN_X + WIN_W / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">vibe-now wizard</title>
  <desc id="desc">A terminal running pnpm dlx vibe-now: the wizard asks for the framework, package manager, workflow and each part of the stack, then creates the app, installs packages, generates starter files and CLAUDE.md, and prints the next steps.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a1640"/>
      <stop offset="0.55" stop-color="#0f1530"/>
      <stop offset="1" stop-color="#0a1f2e"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.1" r="0.7">
      <stop offset="0" stop-color="#7c5cff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#7c5cff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.1" cy="0.95" r="0.6">
      <stop offset="0" stop-color="#22d3ee" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c2230"/>
      <stop offset="1" stop-color="#161b26"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#000" flood-opacity="0.55"/>
    </filter>
    <clipPath id="win"><rect x="${WIN_X}" y="${WIN_Y}" width="${WIN_W}" height="${WIN_H}" rx="14"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" rx="18" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" rx="18" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" rx="18" fill="url(#glow2)"/>
  <g>${stars}</g>

  <g filter="url(#shadow)">
    <rect x="${WIN_X}" y="${WIN_Y}" width="${WIN_W}" height="${WIN_H}" rx="14" fill="#0d1117"/>
  </g>
  <g clip-path="url(#win)">
    <rect x="${WIN_X}" y="${WIN_Y}" width="${WIN_W}" height="${BAR}" fill="url(#bar)"/>
    <line x1="${WIN_X}" y1="${WIN_Y + BAR}" x2="${WIN_X + WIN_W}" y2="${WIN_Y + BAR}" stroke="#262c38"/>
  </g>
  <rect x="${WIN_X + 0.5}" y="${WIN_Y + 0.5}" width="${WIN_W - 1}" height="${WIN_H - 1}" rx="14" fill="none" stroke="#2d3444"/>
  <circle cx="${WIN_X + 22}" cy="${WIN_Y + BAR / 2}" r="6.5" fill="#ff5f57"/>
  <circle cx="${WIN_X + 44}" cy="${WIN_Y + BAR / 2}" r="6.5" fill="#febc2e"/>
  <circle cx="${WIN_X + 66}" cy="${WIN_Y + BAR / 2}" r="6.5" fill="#28c840"/>
  <text x="${titleX}" y="${WIN_Y + BAR / 2 + 4.5}" text-anchor="middle" fill="#8b949e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="13" font-weight="500">vibe-now — ~/code/my-app</text>

  <g font-family="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace" font-size="${FONT}" fill="${C.text}">
    ${body}
  </g>
</svg>
`;

fs.writeFileSync(out, svg);
console.log(`${out}: ${W}x${H}, ${Buffer.byteLength(svg)} bytes`);
