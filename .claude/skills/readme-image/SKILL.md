---
name: readme-image
description: Regenerate the README's wizard image (.github/assets/wizard.svg) from a real run of the vibe-now wizard. Use after adding, renaming or removing wizard prompts or options, after changing the wizard's output, or when asked to update or refresh the README image or screenshot.
---

# README wizard image

The README shows `.github/assets/wizard.svg`: a terminal window with a full wizard run. It is drawn from a **real run**, never typed by hand, so it can't drift from what the CLI does. Three steps, each a script in this folder:

1. `drive.exp` runs the real wizard in a pseudo-terminal and answers its prompts.
2. `extract.mjs` turns the recording into `.github/assets/wizard.transcript.json`: every prompt with its answer, then the wizard's own result lines.
3. `render.mjs` draws the SVG from the transcript.

You need `expect` (`/usr/bin/expect` on macOS), network access (it really installs packages), and Chrome for the preview.

## 1. Pick the showcase selection

Default: **Next.js + pnpm**, with most features on, so the image doubles as a feature list. When the CLI gains an option, turn it on here so it shows up. The current recipe:

```bash
UA="pnpm/11.0.0 npm/? node/v22 darwin arm64"   # makes pnpm the default package manager
LISTS="Database=1;API Layer=1;Payments=1;Background Jobs=1;File Uploads=2;Testing=1"
CONFIRMS="Better Auth=y;MCP=y;Resend=y;Vercel AI SDK=y;PostHog=y;Sentry=y;Motion=y;nuqs=y"
```

- **LISTS** entries are `substring of the prompt=arrow presses from the default`. Negative numbers go up. Disabled choices (for example pg-boss without Postgres) are skipped by the arrows, so don't count them.
- **CONFIRMS** entries are `substring=y|n`. Prompts that match nothing take their default.
- Check the defaults and choice order before you count:

  ```bash
  node -e "import('./lib/packages.js').then(({PACKAGE_GROUPS})=>{for(const g of PACKAGE_GROUPS){if(g.type==='list')console.log('LIST',g.category,'default=',g.default,g.choices.map(c=>c.value).join(','));else for(const i of g.items)console.log('CONF',g.category,i.name,'default=',i.default)}})"
  ```

## 2. Record a run

Use an empty directory **outside the repo** (the scratchpad), and name the project `my-app`:

```bash
SKILL=$PWD/.claude/skills/readme-image
RUN=<scratch>/readme-run && mkdir -p $RUN
WORKDIR=$RUN NAME=my-app UA="$UA" LISTS="$LISTS" CONFIRMS="$CONFIRMS" \
  expect $SKILL/drive.exp > $RUN/raw.txt 2> $RUN/progress.txt
```

It takes several minutes, so run it in the background. When it's done, `progress.txt` must end with `DONE: reached Next steps`, `EOF` and `EXIT 0`. It lists each prompt the driver answered: check each answer is the one you meant.

Optional but worthwhile: run `pnpm check` in `$RUN/my-app`. The image shows this stack working, so make sure it does.

## 3. Extract the transcript

```bash
node $SKILL/extract.mjs $RUN/raw.txt .github/assets/wizard.transcript.json
```

It prints how many prompts and result lines it found. Read the JSON:
- every prompt is there, once, with the answer you chose;
- the result lines are there in order: base app, packages, ✨ Finalizing…, starter files, documentation, project weight;
- the next steps match the package manager.

Don't edit answers by hand. If something is wrong, fix the recipe and record again.

## 4. Render and look at it

```bash
node $SKILL/render.mjs .github/assets/wizard.transcript.json .github/assets/wizard.svg
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1100,1300 --screenshot=<scratch>/preview.png "file://$PWD/.github/assets/wizard.svg"
```

Open the PNG and check:
- no line runs past the window (the width grows to fit the longest line);
- the emoji render;
- "No" answers are dimmed and the rest are cyan.

The README already points at `.github/assets/wizard.svg`. If the image now shows something new, update the `alt` text in `README.md` to match. Commit the SVG and the transcript together, and only when asked.

## When the CLI changes

- **New or renamed prompts:** nothing to change here. The extractor reads any inquirer prompt.
- **New or changed success messages** (an `ora` `succeed` in `plopfile.js`): update `RESULTS` in `extract.mjs`. It keeps only the wizard's own lines and drops the output of tools it runs, such as shadcn's sub-steps.
- **New sub-prompts from a tool the wizard runs:** add a pattern to `drive.exp`, as for shadcn's "Would you like to use TypeScript".
- **Default project name changed:** the driver types the name when it sees `(my-vibe-now)`. Update that pattern.

## Gotchas

- expect mangles 4-byte emoji (🌌, 🚀) in the recording. `extract.mjs` matches those lines by their text and uses the icons from `plopfile.js`.
- Inquirer redraws prompts many times. The driver answers each prompt once, keyed by its text, and the extractor keeps each prompt's last answer.
- The SVG uses system fonts (`ui-monospace`, Menlo, Consolas), because GitHub shows README SVGs as images, which can't load web fonts.
