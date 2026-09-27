# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.3.0`: semantic colors renamed by property and intent (ADR 0017), interaction states only on pressable fills (ADR 0018). The Figma `Theme` collection uses the same names and scopes; primitives are hidden from pickers.
- `main` is stable. CI and the pre-commit hook run check, lint, and typecheck.
- Figma `pts` file: every specimen page uses one table style (header with token count, section title with its path such as `space/*`, column headers, short token names; Color adds a contrast column). Every frame pins its Theme mode. Specimens are drawn by hand, so the contrast badges and hex values are static text: redraw them when values change.

## In flight

- `feature/color-surface-pairs`: ADR 0019 (proposed, `docs/adr/0019-color-layers-and-strength-steps.md`): `background` / `surface` / `inverse` layers, one `content` group with `content/inverse` for text on flipped fills, `subtle` < `base` < `strong` < `stronger` steps instead of hover/pressed, a `disabled/` group, and intents as `intent/<role>/{surface, content, border}`. 58 → 53 tokens. No token or code changes yet.
  1. Done: the Figma `Theme` variables match the ADR (names, scopes, descriptions) and pass 138 pairs per theme. The descriptions were written there first; copy the same text into `$description` in step 2.
  2. Code: `generate-color.ts` (names, `$description`), `pairs.ts` (the ADR's pairing table), docs, then accept the ADR and update CLAUDE.md, README, and ADR 0017/0018 status.
  3. Redraw the Figma Color specimen (labels are 0.3.0; chips for the removed intent `content/subtle` lost their binding), then release `0.4.0`.
- The Figma MCP must be authenticated with the personal account that owns the `pts` file; a work account only has view access. To switch, clear the figma server's authentication in `/mcp` and reconnect.

## Next

Candidates, in the recommended order (not decided yet):

1. First component (Button), after ADR 0019 lands: validates `inverse` and its `strong`/`stronger` steps, danger `surface/base`/`strong`/`stronger`, the focus ring, disabled, and control height, and starts the component tier (ADR 0018).
2. JS/TS and SCSS outputs in `@pts/web`: Terrazzo plugins in `packages/web/terrazzo.config.ts` plus subpath exports. Smallest, but nothing consumes them yet.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android).

## Open questions

- Which of the candidates above comes first.
