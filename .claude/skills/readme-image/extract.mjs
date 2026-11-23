// Turns a raw wizard recording (drive.exp's stdout, ANSI codes included) into the transcript
// render.mjs draws. Nothing is typed by hand: prompts, answers and results come from the recording.
//
// Usage: node extract.mjs <raw.txt> <transcript.json> [--cwd "~/code"]
import fs from 'node:fs';

const [rawPath, outPath, ...rest] = process.argv.slice(2);
if (!rawPath || !outPath) {
  console.error('Usage: node extract.mjs <raw.txt> <transcript.json> [--cwd "~/code"]');
  process.exit(1);
}
const opt = (name, fallback) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : fallback;
};

const raw = fs.readFileSync(rawPath, 'utf8');
const strip = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');

// Answered prompts. Inquirer draws each one as: green "?", the bold message, then the answer
// (cyan once chosen; plain while text is typed). It redraws a prompt many times, so keep each
// message's last non-empty answer, in first-seen order.
const answers = new Map();
const prompt = /\x1b\[32m\?\x1b\[39m \x1b\[1m([^\x1b]*)\x1b\[22m\x1b\[0m \x1b\[0m(?:\x1b\[36m)?([^\x1b]*)/g;
for (const [, msg, answer] of raw.matchAll(prompt)) {
  const key = msg.trim();
  if (!answers.has(key)) answers.set(key, '');
  if (answer.trim()) answers.set(key, answer.trim());
}
for (const [msg, answer] of answers) if (!answer) answers.delete(msg);
if (answers.size === 0) throw new Error('No answered prompts found: is this drive.exp stdout with ANSI codes kept?');

// The wizard's own result lines (not the output of tools it runs, like shadcn's sub-steps), in order
const text = strip(raw).replace(/\r\n?/g, '\n');
const RESULTS = [
  ['ok', /✔ (Base .+? app created!)/],
  ['ok', /✔ (Packages installed successfully!)/],
  ['emoji', /(✨) (Finalizing .+?\.\.\.)/g],
  ['ok', /✔ (Starter files generated \(\d+ files?\))/],
  ['ok', /✔ (Documentation, .+? generated!)/],
  ['ok', /✔ (Project weight: \S+ \(node_modules\))/],
];
const found = [];
for (const [kind, re] of RESULTS) {
  const matches = re.global ? [...text.matchAll(re)] : [text.match(re)].filter(Boolean);
  const seen = new Set();
  for (const m of matches) {
    const key = m.slice(1).join(' ');
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ at: m.index, line: kind === 'ok' ? { kind, text: m[1] } : { kind, icon: m[1], text: m[2] } });
  }
}
found.sort((a, b) => a.at - b.at);

// Matched by text: expect mangles 4-byte emoji (🌌, 🚀) in the recording, so their icons come from plopfile.js
const vibe = text.match(/(Vibe Check: [^\n]+)/);
const next = text.match(/Next steps:\s*\n\s*(cd [^\n]+?)\s*\n\s*([^\n]+? dev)\b/);
if (!vibe || !next) throw new Error('The run did not reach "Next steps": did the wizard finish?');

const project = answers.get('What is your project name?');
const pmAnswer = answers.get('Choose your package manager:') ?? 'npm';
const pm = pmAnswer.split(' ')[0].toLowerCase();
const command = { npm: 'npx vibe-now', pnpm: 'pnpm dlx vibe-now', yarn: 'yarn dlx vibe-now', bun: 'bunx vibe-now' }[pm] ?? 'npx vibe-now';

const transcript = {
  title: `vibe-now — ${opt('--cwd', '~/code')}/${project}`,
  cwd: opt('--cwd', '~/code'),
  command,
  lines: [
    ...[...answers].map(([msg, answer]) => ({ kind: 'q', msg, answer })),
    { kind: 'blank' },
    ...found.map((f) => f.line),
    { kind: 'blank' },
    { kind: 'emoji', icon: '🌌', text: vibe[1].trim(), strong: true },
    { kind: 'emoji', icon: '🚀', text: 'Next steps:' },
    { kind: 'plain', text: `   ${next[1]}` },
    { kind: 'plain', text: `   ${next[2]}` },
  ],
};

fs.writeFileSync(outPath, `${JSON.stringify(transcript, null, 2)}\n`);
console.log(`${outPath}: ${answers.size} prompts, ${found.length} result lines`);
