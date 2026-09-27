# 0017. Color Names by Property and Intent

- Status: accepted (amended by 0019)
- Date: 2026-09-27

## What we learned

The semantic color names (`color/<property>/<role>[-<emphasis>][-<state>]`, ADR 0005) held up for contrast checking but not for reading or for designing in Figma:

- **`default` carried no meaning, and in one place the wrong one.** `background/default` and `foreground/default` only said "the usual one". `border/default` was the *weak* decorative divider, exempt from contrast, while the 3:1 boundary was `border/strong`. Reaching for "the default border" on an input broke WCAG 1.4.11.
- **`default-hover` / `default-pressed` misdescribed their use.** They are the hover tints of transparent elements (ghost buttons, list items), not states of the page background.
- **The grammar was mixed.** Status roles followed `<role>[-<emphasis>]` (`danger`, `danger-subtle`), while neutral colors used `default` / `subtle` in the role slot. `foreground/on-X` said "foreground" twice.
- **Figma was hard to use.** With property-first grouping, `color/background/` held 31 variables in one flat list, and everything about one status role was spread over three folders.

The structure was worked out in a Figma test collection (`Theme (naming test)` in the `pts` file) through several rounds: a DTCG `$root` for group defaults, Material-style flat nouns, and property-first vs. role-first grouping. An external example grouped each surface next to its content colors, which showed that the split by property was what scattered related colors.

## Why it matters

### Structure

Neutral colors are grouped by property first; status colors by intent first, then by the same three properties. The `color/` prefix is dropped from semantic names, and the primitive palette takes the name `color` instead.

```
background/  canvas, hover, pressed, disabled
             surface/{subtle, raised}
             inverse/{base, hover, pressed}
content/     base, muted, disabled
             inverse/{base, muted}
border/      base, subtle, focus, disabled
utility/     scrim
always/      white, black
intent/<danger | warning | success | info | discovery>/
             background/{emphasis, subtle}, plus hover, pressed (danger only)
             content/{base, emphasis, subtle}
             border/{base, subtle}
```

Grammar: `[intent/<role>/]<background | content | border>/<name>`, plus `utility/*` and `always/*`.

### Naming rules

- **`canvas`** is the page. It is the reference every pairing rule points to, so it has its own name instead of `base`.
- **`base`** is the default of every content and border group, and the resting fill inside a state folder (`background/inverse/base`). No group is called `default`, and no token shares a name with a group, so no DTCG `$root` is needed.
- **`subtle`** is the weaker variant of a fill or a line. **`muted`** is weaker text; content can't use `subtle` for that because content names also mean pairing (below).
- **`hover` / `pressed`** are states of the fill at the same level: `canvas` (for transparent elements on it), `inverse/base`, and `intent/danger/background/emphasis`. Which fills get states is decided in ADR 0018.
- **`disabled`** sits at the same depth in all three properties.
- **`surface/`** holds only surfaces placed on the canvas (`subtle`, `raised`).
- **`inverse`** is the flipped fill. It replaces both the old `background/primary` (primary buttons) and `background/inverse` (tooltips, snackbars), which were one neutral step apart. It has two content levels, since snackbars and tooltips carry primary and secondary text.
- **`emphasis` / `subtle`** are an intent's strong and soft fills.
- **`discovery`** (purple) marks new or explorable things: new-feature badges, onboarding, recommended content, and AI features. It replaces `recommend`, whose meaning was unclear. Atlassian uses the same name for purple.
- **`utility/`** holds colors outside the background/content/border pairing system (the modal scrim now).
- **`always/`** holds colors that are the same in every theme: `always/white` and `always/black`. In CSS they read as `--always-white`, which says what they do; `static` was the other candidate but reads as jargon. The first use is an icon or text on an image with a dark overlay. `content/inverse/base` would turn black in dark, because it follows the theme; the image doesn't.

### Pairing and contrast

Content names are either a **hierarchy word** (`base`, `muted`, `disabled`) or **the name of the background they sit on** (`inverse`, `emphasis`, `subtle`). `npm run check` derives every pair from that:

| Content | Sits on | Min |
|---|---|---|
| `content/base`, `muted`; intent `content/base` | canvas, `surface/*`, `hover`, `pressed` | 4.5:1 |
| `content/inverse/*` | `background/inverse/*` | 4.5:1 |
| intent `content/emphasis` | that intent's `emphasis`, and its `hover`, `pressed` where they exist | 4.5:1 |
| intent `content/subtle` | that intent's `background/subtle` | 4.5:1 |

- UI boundaries at 3:1 against canvas, `surface/*`, `hover`, `pressed`: `border/base`, `border/focus`, intent `border/base`, `background/inverse/*`, intent `emphasis` (and danger's `hover` / `pressed`). `inverse` is now checked because it is the primary button; before, it was a static surface and exempt.
- Exempt: `*/disabled`, `border/subtle` and intent `border/subtle` (decorative), `utility/*` (outside the pairing system; the scrim is translucent), `always/*` (sits on images, whose colors are unknown; pair `always/white` with a dark overlay).
- States must be visible: each fill's `base`/`emphasis`, `hover`, and `pressed` differ, and `background/hover` / `pressed` differ from `canvas`, `surface/*`, and `disabled`.

A prototype of these rules on the test collection passes all 138 pairs per theme with no invisible states. Lowest ratios: text 4.69 (light) / 4.58 (dark), UI 3.22.

### Figma

- Variable scopes follow the property: `background/*` and `utility/*` → frame and shape fills; `always/*` → all fills and strokes; `content/*` → text and shape fills, plus strokes for outline icons; `border/*` → strokes. A picker then shows only the colors that fit.
- Primitive variables should be hidden from pickers (empty scopes); product work uses semantic colors only.
- Scopes are not part of DTCG. A future sync derives them from the property segment.

### Breaking

Every semantic color name changes and the primitive group is renamed, so the release after this lands is `0.3.0` (ADR 0014).

## Implementation notes

Old → new (60 → 58 tokens; `<r>` is each status role, `recommend` becomes `discovery`):

| Old | New |
|---|---|
| `background/default`, `default-hover`, `default-pressed` | `background/canvas`, `hover`, `pressed` |
| `background/subtle`, `raised` | `background/surface/subtle`, `raised` |
| `background/disabled` | `background/disabled` |
| `background/primary`, `-hover`, `-pressed` | `background/inverse/base`, `hover`, `pressed` |
| `background/inverse`, `foreground/on-inverse` | removed (merged into `inverse`) |
| `foreground/on-primary` | `content/inverse/base` |
| — | `content/inverse/muted` (new: light `neutral.500`, dark `neutral.700`) |
| `background/overlay` | `utility/scrim` |
| — | `always/white`, `always/black` (new: `color.white` / `color.black` in both themes) |
| `foreground/default`, `muted`, `disabled` | `content/base`, `muted`, `disabled` |
| `border/strong`, `border/default` | `border/base`, `border/subtle` |
| `border/focus`, `disabled` | unchanged |
| `background/<r>`, `-subtle` | `intent/<r>/background/emphasis`, `subtle` |
| `background/danger-hover`, `-pressed` | `intent/danger/background/hover`, `pressed` |
| `background/<r>-hover`, `-pressed` for warning, success, info, recommend | removed (ADR 0018) |
| `foreground/<r>`, `on-<r>`, `on-<r>-subtle` | `intent/<r>/content/base`, `emphasis`, `subtle` |
| `border/<r>` | `intent/<r>/border/base` |
| — | `intent/<r>/border/subtle` (new: light `<hue>.300`, dark `<hue>.700`) |
| primitive `palette/*` | `color/*` |

- Values are unchanged except: tooltips and snackbars move from the old inverse (`neutral.950` / `white`) to the primary values (`neutral.900` / `neutral.200`), and the new tokens above.
- Code: `generate-color.ts` writes the new names; the primitive file is now `primitive/color.tokens.json`, and `always/*` lives in `semantic/color.tokens.json` in the base set because it doesn't change with the theme. The pairing rules moved to `tokens/scripts/pairs.ts`, which both `check.ts` and the Storybook docs import, so the docs badges can't drift from the check. Shadow tokens alias `color.black-alpha`.
- Verified: the generated tokens match the Figma test collection name for name and value; all 50 renamed CSS variables keep their values; `npm run check` passes 276 pairs (138 per theme) and fails as expected on deliberately broken pairs, invisible states, a content name with no background, and a translucent pair.
- Figma: apply the new names and scopes to the real `Theme` collection; the `Primitive` collection already uses `color/*`.

## Documented in

- `CLAUDE.md` — Structure, Commands, Token Rules (Primitives, Color, Accessibility), Token Docs
- `README.md` — Tokens, Usage, Accessibility
