# 0019. Surface and On- Pairs

- Status: proposed
- Date: 2026-09-27

## What we learned

ADR 0017 grouped colors by property (`background/`, `content/`, `border/`) and let a content name be either a level (`base`, `muted`) or the name of the background it sits on (`inverse`, `emphasis`, `subtle`). Reading the full list back showed three problems:

- **The same word meant two things.** Outside content, `subtle` and `emphasis` describe strength. Inside intent content they name a pairing: `intent/danger/content/emphasis` is white text for the red fill, and `content/subtle` (red.800) is darker than `content/base` (red.700). Picking "emphasized danger text" gives white on the canvas (1:1). `npm run check` verifies token pairs, not where a token is used, so it can't catch this. It is the same trap as the old `border/default` (ADR 0017).
- **State words sat inside the semantic names.** `hover`, `pressed`, and `disabled` describe how a component reacts, not what a color is. `content/disabled` also read both as a level and as a pair with `background/disabled`.
- **Too many words for strength.** `subtle`, `muted`, `base`, `canvas`, `surface`, `raised`, `inverse`, and `emphasis` overlapped, and intents nested a second set of property folders.

Three systems were compared from their published token files:

| | eBay Evo | Primer | Atlassian |
|---|---|---|---|
| Text levels | `primary, secondary` | `default, muted` | `text, subtle, subtlest` |
| Fill strength | `primary, secondary, tertiary, strong` | `muted, emphasis` | `subtler … boldest` |
| States | isolated in a `state/` group | component tokens | `.hovered`, `.pressed` on every fill |
| Disabled | per property | per property | per property |
| Text on a fill | `on-primary, on-inverse, on-success…` | `onEmphasis, onInverse` | shared `text.inverse` |

Material 3 goes one step further and names every fill with its content as a pair: `surface` / `on-surface`, `inverse-surface` / `inverse-on-surface`, `primary-container` / `on-primary-container`.

## Why it matters

### Structure

Fills and the content on them are named as pairs. Every content color is `on-<fill>`, so a content name never doubles as a strength word. Borders stay a separate group because a line is neither a fill nor what sits on one.

```
surface/       canvas, subtle, strong, stronger, raised
on-surface/    base, subtle
inverse/       base, strong, stronger
on-inverse/    base, subtle
border/        base, subtle, focus
disabled/      surface, on-surface, border
intent/<danger | warning | success | info | discovery>/
               subtle, on-subtle
               emphasis, on-emphasis      (danger also: emphasis-strong, emphasis-stronger)
               on-surface
               border, border-subtle
utility/       scrim
always/        white, black
```

### Vocabulary

| Role | Words |
|---|---|
| Fill | `surface`, `inverse`, `emphasis` (an intent's strong fill); `canvas` (the page), `raised` (cards, popovers, modals) |
| Strength | `subtle` < `base` < `strong` < `stronger`, measured as distance from the canvas: darker in light, lighter in dark |
| Pair | `on-<fill>`: sits on that fill and on its `strong` / `stronger` |
| Status group | `intent/<role>/`, `disabled/` |
| Other | `border`, `focus`, `utility/scrim`, `always/*` |

- **`canvas` is not `base`.** On `surface/` the canvas is the zero point and `subtle` is one step away from it, the reverse of `subtle < base` elsewhere. It keeps its own name.
- **`muted` is gone.** With pairs carried by `on-`, weaker text is `subtle` like every other weaker variant.
- **`inverse` and `emphasis` stay separate.** `inverse` is the monochrome flipped fill that changes with the theme; `emphasis` is an intent's saturated fill.
- **No `default`.** `on-` returns, reversing ADR 0017: the problem there was `foreground/on-X` saying "on top" twice, while here `on-` is the only thing that marks a pair.

### States

- **`disabled` stays semantic** as its own group, `disabled/{surface, on-surface, border}`. Every control uses the same disabled colors whatever its resting fill, and eBay, Primer, and Atlassian all keep disabled in the semantic tier. It sits beside `intent/`, not inside it: every intent defines the same names, and disabled is exempt from contrast while intents are not.
- **`hover` / `pressed` become strength steps**: `surface/strong`, `stronger`; `inverse/strong`, `stronger`; danger `emphasis-strong`, `emphasis-stronger`. Their use lives in `$description`. This is a compromise: comparatives are used only for these steps, which exist only because interaction states need fills stronger than `base`. When the component tier arrives, component tokens alias them (`button/primary/surface-hover` → `{inverse.strong}`) and the semantic names stay.
- **Component-specific states** (`selected`, `checked`) still go to the component tier (ADR 0018).

### Descriptions

Names say what a color is; `$description` says when to use it (`surface/strong`: "Hover fill for transparent elements such as ghost buttons and list items"). Every semantic color gets a description, and the Figma variable descriptions carry the same text, since `strong` alone doesn't say hover.

### Pairing and contrast

| Content | Sits on | Min |
|---|---|---|
| `on-surface/*`, intent `on-surface` | `surface/*` | 4.5:1 |
| `on-inverse/*` | `inverse/*` | 4.5:1 |
| intent `on-emphasis` | that intent's `emphasis`, `emphasis-strong`, `emphasis-stronger` | 4.5:1 |
| intent `on-subtle` | that intent's `subtle` | 4.5:1 |

- UI boundaries at 3:1 against `surface/*`: `border/base`, `border/focus`, intent `border`, `inverse/*`, intent `emphasis*`.
- Exempt: `disabled/*`, `border/subtle`, intent `border-subtle`, `utility/*`, `always/*`.
- States must be visible: each fill and its `strong` / `stronger` differ, and `surface/strong` / `stronger` differ from `canvas`, `subtle`, `raised`, and `disabled/surface`.
- The pairs come from the names: `on-X` sits on X. No hierarchy list is needed.

### Figma

- Collections, modes, and the `utility/` and `always/` groups are unchanged. Groups follow the new paths, so an intent has no subfolders.
- Scopes are derived from the name: a name starting with `on-` → text fill, shape fill, and stroke (outline icons); `border` in the path → stroke; `always/*` → all; everything else → frame fill and shape fill.
- Compromise: content keeps the shape-fill scope because icons are vectors, so a shape's fill picker shows both fills and content colors. Figma scopes can't tell an icon from a shape.

### Breaking

Every semantic color is renamed except `utility/scrim` and `always/*`, so the next release is `0.4.0` (ADR 0014). Values don't change.

## Implementation notes

Old → new (58 tokens, unchanged count; `<r>` is each intent):

| Old | New |
|---|---|
| `background/canvas` | `surface/canvas` |
| `background/surface/subtle`, `raised` | `surface/subtle`, `raised` |
| `background/hover`, `pressed` | `surface/strong`, `stronger` |
| `background/inverse/base`, `hover`, `pressed` | `inverse/base`, `strong`, `stronger` |
| `content/base`, `muted` | `on-surface/base`, `subtle` |
| `content/inverse/base`, `muted` | `on-inverse/base`, `subtle` |
| `border/base`, `subtle`, `focus` | unchanged |
| `background/disabled`, `content/disabled`, `border/disabled` | `disabled/surface`, `on-surface`, `border` |
| `intent/<r>/background/subtle`, `emphasis` | `intent/<r>/subtle`, `emphasis` |
| `intent/danger/background/hover`, `pressed` | `intent/danger/emphasis-strong`, `emphasis-stronger` |
| `intent/<r>/content/base`, `emphasis`, `subtle` | `intent/<r>/on-surface`, `on-emphasis`, `on-subtle` |
| `intent/<r>/border/base`, `subtle` | `intent/<r>/border`, `border-subtle` |
| `utility/scrim`, `always/white`, `black` | unchanged |

- `generate-color.ts` writes the new names and descriptions; `pairs.ts` derives pairs from `on-` instead of `HIERARCHY`.
- Shadows, the Storybook docs (`components.tsx`, `Color.mdx`), and `.storybook/theme.ts` follow the renames.
- Figma: rename the variables (renaming keeps layer bindings), set scopes by the rule above, copy the descriptions, and redraw the Color specimen.
- When accepted: ADR 0017 and 0018 get `(amended by 0019)`; CLAUDE.md (Token Rules: Color, Accessibility) and README are updated.

## Documented in

- `CLAUDE.md` — Token Rules (Color, Accessibility), once accepted
