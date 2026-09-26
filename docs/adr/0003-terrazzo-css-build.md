# 0003. Terrazzo CSS Build

- Status: accepted (amended by 0005, 0012)
- Date: 2026-09-25

## What we learned

The token source needed a first platform output to complete one pass of the pipeline (source → build → artifact). Terrazzo reads DTCG natively, including the object form of `dimension` values (`{ "value": 16, "unit": "px" }`) chosen in ADR 0001, and resolves aliases across files without extra configuration.

## Why it matters

- **Each platform output is its own workspace package** (`@pts/css`) depending on `@pts/tokens`. The source package stays free of build tooling, and new platforms follow the same pattern.
- **Aliases are preserved as `var()` references** (`--space-100: var(--dimension-4)`), so the primitive → semantic chain stays visible in the output.

## Implementation notes

- `packages/css/terrazzo.config.ts` lists token files explicitly; new token files must be added there. (Superseded by the resolver entry point, see ADR 0005.)
- Output: `packages/css/dist/tokens.css` (gitignored), variables on `:root`, named from the token path (`space.100` → `--space-100`).
- Primitives are emitted too, because semantic variables reference them. Excluding them would break the `var()` chain.
- `npm run build` at the root builds every workspace that has a `build` script.
- Versions: `@terrazzo/cli` and `@terrazzo/plugin-css` 2.7.x.

## Documented in

- `CLAUDE.md` — Structure and Commands sections
- `packages/css/terrazzo.config.ts`
