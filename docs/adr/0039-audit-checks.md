# 0039. Checks from the Pipeline Audit

- Status: accepted
- Date: 2026-10-03

## What we learned

An outside audit by another vendor's coding agent asked three questions about `main` at `885c096`. Which documented rules does nothing enforce? Where do the docs contradict the code? What can ship wrong while every check passes? Its findings were checked against the current code. Most held. The ones this ADR acts on:

- **A color outside the grammar is never contrast-checked.** `contrastPairs()` derives pairs from names, so `status.error.content.base` gets no pair: called with `status.error.*`, it returns `[]`. `pts/contrast` reported unknown `content` names, but not unknown groups.
- **`always/*` could change with the theme.** The rules compared names and descriptions across themes, not values.
- **Build success is not an output contract.** CI built `@pts/web`, but nothing read what the build wrote:
  - `sass()` listed before `css()` builds an empty token map without an error (ADR 0030).
  - A dark block that misses a component token builds fine.
  - A third theme context in the resolver builds fine, with no CSS for it.
  - The `@pts/web` config itself wasn't type-checked.
- **Five statements in the docs contradicted the code:**
  - "No token aliases a density token yet": the Button's do.
  - "Every project rule checks every permutation": the rules about names and files don't.
  - "Translucent colors are exempt": exemptions are by name, and a translucent color in a pair is an error.
  - "Semantic tokens alias primitives": `padding`, `gap`, and `text` alias semantic tokens.
  - "Files are compared": resolved permutations are.

## Why it matters

- **`pts/contrast` reports a semantic color in no pair that isn't exempt** (`UNCHECKED`). The pairs stay derived from the names. A color the names don't cover is now an error rather than a silent gap.
- **`pts/theme-parity` keeps `constant` groups the same in every permutation.** The config lists `always`.
- **`packages/web/test/output.test.ts` checks `dist/` against Terrazzo's resolver**, not a snapshot, so token changes need no test change:
  - `:root` declares every token. A whole-token alias references its target, which shows the right permutation filled the block.
  - Every context of every modifier has its block. Each block declares every token the context changes and none that another modifier changes, since that would reset the other modifier inside the subtree.
  - "Changes" depends on where the block applies. A block on a subtree (`[data-theme]`, `[data-density]`) must repeat every token whose resolved value differs, aliases included. A block on `:root` (the viewport media query) only needs tokens whose own declaration differs, since aliases resolve again there.
  - `tokens.js`, `tokens.d.ts`, and `tokens.scss` hold every token.
- **`npm test` builds `@pts/web` first** (`pretest`), so it always tests fresh output. `@pts/web` gets a `typecheck`.
- **The docs were corrected** where the audit found them wrong, including `.claude/rules/web.md`, which still described the build reading token files (before ADR 0038).

## Trade-offs

- **The output test knows the selectors.** The map from a modifier context to its selector (`[data-<modifier>="<context>"]`, the dark media query, the `wide` breakpoint) is a copy of the config's decisions. A new context fails until both the config and the test handle it, which is the point. A renamed selector also means a test edit.
- **Values are checked through references, not computed.** A raw value in a modifier block (no alias) is checked for presence, not for its exact CSS.
- **The output test resolves the tokens again**, about a second.

## Implementation notes

- `tokens/lint/rules/contrast.ts`: `UNCHECKED`, over the semantic color ids from `files()`.
- `tokens/lint/rules/theme-parity.ts`: option `constant`, `NOT_CONSTANT`.
- `tokens/lint/rules.test.ts`: a case for each new message.
- `packages/web`: `test/output.test.ts`, `tsconfig.json`, scripts `pretest`, `test`, and `typecheck`, and devDependencies `typescript` and `@types/node`.
- Verified by breaking the build three ways. Each made the test fail with the token or block it names:
  - `sass()` before `css()`: `tokens.scss lacks "always.black"`.
  - Component tokens left out of a dark block: `lacks --button-danger-content`.
  - A third theme context: `no block for theme=hc`.

## Not acted on here

Kept in `docs/progress.md` as next steps:

- The changeset's bump checked against removed or renamed tokens.
- Component state completeness and distinctness.
- Modifier scope, compact one step down, and role alias targets.
- Release ordering after the full CI.
- Docs coverage of every group.
- Manager hex copies.
- Smaller value rules (numeric names, heading weights, z-index order, dark shadow alpha).
- Color direction, together with the `visible-steps` threshold.

Left to people:

- What a description means.
- Button interaction tests: components are token fixtures (ADR 0034).
- Process records (ADRs, handoff notes).
- Figma, which is deferred in `CLAUDE.md`.

## Documented in

- `CLAUDE.md` — Commands, Output
- `.claude/rules/web.md` — Build
- `docs/how-it-works.md` — Checks as code, Accessibility
- `README.md`, `CONTRIBUTING.md` — the checks
