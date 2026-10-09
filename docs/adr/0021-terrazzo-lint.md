# 0021. Terrazzo Lint

- Status: accepted (amended by 0023, 0024, 0038, 0050)
- Date: 2026-09-27

## What we learned

Token validation lived in two places: `tz check` in `packages/web` ran only Terrazzo's recommended rules (value shapes and kebab-case warnings), and `tokens/scripts/check.ts` ran everything else. Terrazzo ships more rules than it turns on, so parts of `check.ts` duplicated work Terrazzo already does, and other built-in rules weren't used at all.

Each built-in rule was turned on against the current tokens (Terrazzo 2.7.1):

| Rule | Result |
|---|---|
| `core/required-type`, `core/consistent-naming`, `core/colorspace` (srgb), `core/max-gamut` (srgb) | Pass |
| `core/descriptions` | Only semantic colors have descriptions; about 87 other semantic tokens don't |
| `a11y/min-font-size` (12px) | `text/caption` is 10px |
| `core/duplicate-values` | Flags every alias target, so it can't be used with a tiered system |
| `a11y/min-contrast` | Checks the light theme only (below) |
| `core/valid-color` | Validates `hex` on its own; doesn't check that it matches `components` |

Three facts about how Terrazzo lints shaped the design:

- **Lint sees one theme.** With a resolver, the parser applies the default input (`theme: light`) and passes those tokens to every rule; a rule has no access to the resolver. Breaking the dark `content/base` left `tz check` passing, while the same break in light failed. Even a broken alias in the dark file passed. A built-in rule can't check anything per theme.
- **Tokens don't know their file.** After the resolver merges the sources, a token's `source.filename` is the resolver, not the `.tokens.json` file it came from, so rules about files (tiers, registration) read the files themselves.
- **Setting `lint.rules` replaces the recommended set** instead of adding to it, so the config spreads `RECOMMENDED_CONFIG` first.

A plugin rule can still reach every theme: the plugin keeps the resolved config from its `config()` hook, parses the resolver itself, and calls `resolver.apply()` for each permutation.

## Why it matters

### Built-in first, our rules for what built-ins can't do

`tz check` in `tokens/` runs all validation. The config lists rules in three blocks, so it's clear who owns each one:

| Block | Rules |
|---|---|
| Terrazzo recommended (`RECOMMENDED_CONFIG`) | `core/valid-*`, `core/consistent-naming` (raised to error) |
| Terrazzo built-in, turned on | `core/required-type`, `core/descriptions` (every semantic token), `core/colorspace` and `core/max-gamut` (srgb), `a11y/min-font-size` (12px) |
| Ours (`pts/*`, `tokens/lint/`) | `pts/theme-parity`, `pts/contrast`, `pts/visible-steps`, `pts/color-hex`, `pts/tier-aliases`, `pts/registered-files` |

A `pts/*` rule exists only where no built-in rule does the job, and its file says why:

| Rule | Why not built-in |
|---|---|
| `pts/theme-parity` | Built-in rules see one theme. Themes must define the same names and the same `$description` (a description names the role, not the value) |
| `pts/contrast` | `a11y/min-contrast` checks the light theme only, and needs every pair listed by hand; ours derives the pairs from the names (`pairs.ts`, shared with the Storybook badges) |
| `pts/visible-steps` | Per theme, and no built-in rule compares steps |
| `pts/color-hex` | `core/valid-color` doesn't compare `hex` with `components` |
| `pts/tier-aliases` | No built-in rule knows about tiers |
| `pts/registered-files` | Terrazzo only reads what the resolver lists; an unlisted file is never seen |

Turned off: `a11y/min-contrast` (replaced by `pts/contrast`) and `core/duplicate-values` (aliases are the point of the tiers).

### Where it lives

```
tokens/
├── terrazzo.config.ts   lint only: no build plugins
└── lint/
    ├── index.ts         the pts plugin: registers the rules
    ├── source.ts        every theme (parses the resolver once, applies each permutation) and every file with its tier
    ├── pairs.ts         contrast pairs (moved from scripts/; Storybook imports it)
    └── rules/           one file per rule
```

Validation belongs to the source, not to an output (ADR 0016). Platform packages keep build-only configs; their `tz build` still runs Terrazzo's recommended value checks. CI runs `npm run check` before the builds.

### Value changes

- Every semantic token gets a `$description`. The Figma variable descriptions follow.
- `text/caption` goes from `font-size/100` (10px) to `font-size/200` (12px), the new minimum. Aspekta is hard to read at 10px, and 11–12px is the usual floor (Primer 12px, Material 11px, Apple 11pt). `font-size/100` stays; removing it would be breaking. Caption and `label-sm` now share a size and differ by weight.

### Commands

`npm run check` runs `tz check` in `tokens/`. `npm run lint` and `tokens/scripts/check.ts` are removed.

## Implementation notes

- `pts/theme-parity` also reports a theme that fails to resolve, which covers the broken dark alias above.
- `pts/contrast` computes ratios the way `a11y/min-contrast` does (`tokenToColor` from `@terrazzo/token-tools`, `contrastWCAG21` from `colorjs.io`). It checks the same 308 pairs as `check.ts` did (154 per theme), with the same lowest ratios: text 4.69 (light) / 4.58 (dark), UI 3.22. A content name that is neither a level nor `inverse` is now reported once, by name.
- The documented tier exceptions are rule options in the config: `pts/tier-aliases` takes `rawValues: ["z-index"]` and `semanticAliases: ["text"]`.
- `core/descriptions` ignores the primitive groups, read from the primitive files (`primitiveGroups()`), so a new semantic group needs descriptions without a config change.
- Rules report with `messageId` and `data`, like the built-in rules, so messages live in each rule's `meta.messages`.
- Verified by breaking each rule on purpose: a broken dark alias, a token missing from dark, a different dark description, a dark-only contrast failure, an unknown content name, a translucent color in a pair, an invisible dark step, a hex mismatch, a raw value and a semantic alias in the semantic tier, an unregistered file, a missing description, a 10px caption, a camelCase name, and a display-p3 color. Each failed `npm run check` with exit code 1 and a message naming the token.
- `@pts/tokens` depends on `@terrazzo/cli`, `@terrazzo/parser`, `@terrazzo/token-tools`, and `colorjs.io`. `packages/web` loses its `lint` script; its `tz build` still runs the recommended rules.

## Documented in

- `CLAUDE.md` — Structure, Commands, Token Rules
- `CONTRIBUTING.md` — What the checks catch
- `README.md` — Development
- `.githooks/pre-commit`, `.github/workflows/ci.yml`
