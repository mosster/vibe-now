// Draws the README image from a transcript (made by extract.mjs from a real wizard run).
// Usage: node render.mjs <transcript.json> <out.svg>
import fs from 'node:fs';

const [inPath, out] = process.argv.slice(2);
if (!inPath || !out) {
  console.error('Usage: node render.mjs <transcript.json> <out.svg>');
  process.exit(1);
}
const transcript = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const lines = [{ kind: 'cmd', cwd: transcript.cwd, text: transcript.command }, { kind: 'blank' }, ...transcript.lines];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FONT = 13.5;
const LH = 21.5;
const MARGIN = 44;
const WIN_X = MARGIN;
const BAR = 42;
const PAD_X = 26;
// Wide enough for the longest line (monospace glyphs are ~0.61em wide; prompts add "? " and a space)
const longest = Math.max(...lines.map((l) => (l.kind === 'q' ? l.msg.length + l.answer.length + 3 : (l.cwd?.length ?? 0) + (l.text?.length ?? 0) + 3)));
const W = Math.max(1000, Math.ceil(longest * FONT * 0.61 + PAD_X * 2 + MARGIN * 2));
const WIN_W = W - MARGIN * 2;
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
    switch (line.kind) {
      case 'blank':
        return '';
      case 'cmd':
        return `<text x="${x}" y="${y}"><tspan fill="${C.purple}">❯</tspan> <tspan fill="${C.prompt}">${esc(line.cwd)}</tspan> <tspan fill="${C.msg}" font-weight="600">${esc(line.text)}</tspan></text>`;
      case 'q':
        return `<text x="${x}" y="${y}"><tspan fill="${C.green}" font-weight="700">?</tspan> <tspan fill="${C.msg}" font-weight="600">${esc(line.msg)}</tspan> <tspan fill="${line.answer === 'No' ? C.dim : C.cyan}">${esc(line.answer)}</tspan></text>`;
      case 'ok':
        return `<text x="${x}" y="${y}"><tspan fill="${C.green}">✔</tspan> <tspan fill="${C.text}">${esc(line.text)}</tspan></text>`;
      case 'emoji':
        return `<text x="${x}" y="${y}"><tspan>${line.icon}</tspan> <tspan fill="${line.strong ? C.msg : C.text}"${line.strong ? ' font-weight="700"' : ''}>${esc(line.text)}</tspan></text>`;
      case 'plain':
        return `<text x="${x}" y="${y}" fill="${C.cyan}" xml:space="preserve">${esc(line.text)}</text>`;
      default:
        throw new Error(`Unknown line kind: ${line.kind}`);
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
  <desc id="desc">A terminal running ${esc(transcript.command)}: the wizard asks for the framework, package manager, workflow and each part of the stack, then creates the app, installs packages, generates starter files and CLAUDE.md, and prints the next steps.</desc>
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
  <text x="${titleX}" y="${WIN_Y + BAR / 2 + 4.5}" text-anchor="middle" fill="#8b949e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="13" font-weight="500">${esc(transcript.title)}</text>

  <g font-family="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace" font-size="${FONT}" fill="${C.text}">
    ${body}
  </g>
</svg>
`;

fs.writeFileSync(out, svg);
console.log(`${out}: ${W}x${H}, ${Buffer.byteLength(svg)} bytes`);
