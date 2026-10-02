# 0031. Agent Docs by Scope

- Status: accepted
- Date: 2026-10-02

## What we learned

`CLAUDE.md` had grown to 245 lines (31.6 KB, about 8K tokens), and the SessionStart hook prints `docs/progress.md` (7.4 KB) on top of it, so every session started with about 10K tokens of instructions. Three problems, more than the size itself:

- **Values were written twice.** Token Rules listed the px values of every padding, gap, font size, z-index, and size step. The JSON is the source of those values and `npm run check` enforces their relations, so each value change also meant a hand edit to `CLAUDE.md`, or a stale rule.
- **The same explanation lived in three or four places.** The checks were described in `CLAUDE.md` Commands, `CONTRIBUTING.md`, `README.md`, and each rule file's header; the files per modifier in `CLAUDE.md`, `CONTRIBUTING.md`, and `README.md`. Some had already drifted: `README.md` still named the removed generation scripts and said the checks ran "for both themes", and `CONTRIBUTING.md` promised docs that rebuild from `main`, which wait for the repository to go public (ADR 0020).
- **Task-specific rules were always loaded.** About a quarter of `CLAUDE.md` was Figma (collections, scopes, folder names, code syntax, specimen tables), and another part was Storybook layout rules, read in every session whatever the task. `docs/progress.md` held a release history and the Figma procedures, although it says history belongs in git.

Claude Code loads `.claude/rules/*.md` with a `paths` frontmatter only when files matching it are read, and loads a skill (`.claude/skills/<name>/SKILL.md`) only when its description fits the task. Both live in the repository, so they travel to other machines and cloud sessions like `CLAUDE.md`.

## Why it matters

- **Each fact has one home**, listed in a table at the top of `CLAUDE.md`; elsewhere, link to it:
  - `CLAUDE.md`: the rules every task needs (structure, commands, output, token rules, decisions, continuity, git).
  - `.claude/rules/storybook.md` (`apps/storybook/**`) and `.claude/rules/web.md` (`packages/web/**`): rules for one area, loaded with its files.
  - `.claude/skills/figma/`: the Figma rules and procedures. Figma work isn't tied to a path, so it is a skill, and `CLAUDE.md` says to load it after any token change.
  - `docs/progress.md`: state only.
  - The rule file headers in `tokens/lint/rules/`: what each check enforces and why.
- **`CLAUDE.md` keeps representative values only** (`space/400` = 16px, `text/md` = 16px is the body default, `size/control/md` = 48px), enough to reason without opening a file. The full sets are in the JSON; the relations between them are in the rules and the checks.
- **Human guides stay separate**: `README.md` for using the outputs, `CONTRIBUTING.md` for changing tokens. They link to `CLAUDE.md` and the ADRs for the full rules instead of restating them.

## Implementation notes

- `CLAUDE.md`: 31.6 KB → 16.5 KB. Removed: the full value lists, the per-rule description of `npm run check` (now the rule names, with the headers as reference), the file-by-file structure tree, the Figma and Storybook sections, and the font and build-config details (to `.claude/rules/web.md`). Added: the "Where things are written" table, a Modifiers section gathering theme, density, and viewport, and "After a token change" (Storybook manager hex copies, Figma, version).
- `docs/progress.md`: 7.4 KB → 3.6 KB. The release history and the Figma procedures moved out (git tags, ADRs, the `figma` skill); the Button item is split into sub-items.
- `README.md`: the `@pts/tokens` description, the modes (viewport was missing), and the `npm run check` description fixed; a link to the scoped rules. `CONTRIBUTING.md`: step 6 of the flow, the `<Section>` example (`path` was missing), and a link to the Figma conventions.
- Nothing was dropped: every rule removed from `CLAUDE.md` is in one of the new files, in the JSON, or in a rule file header.

## Documented in

- `CLAUDE.md` — Where things are written
- `README.md` — Decisions and conventions
- `CONTRIBUTING.md` — Token format
