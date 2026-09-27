# 0019. Color Layers and Strength Steps

- Status: proposed
- Date: 2026-09-27

## What we learned

ADR 0017 grouped colors by property (`background/`, `content/`, `border/`) and let a content name be either a level (`base`, `muted`) or the name of the background it sits on (`inverse`, `emphasis`, `subtle`). Reading the full list back showed three problems:

- **The same word meant two things.** Outside content, `subtle` and `emphasis` describe strength. Inside intent content they named a pairing: `intent/danger/content/emphasis` was white text for the red fill. Picking "emphasized danger text" gave white on the page (1:1). `npm run check` verifies token pairs, not where a token is used, so it can't catch this. It is the same trap as the old `border/default` (ADR 0017).
- **State words sat inside the semantic names.** `hover` and `pressed` describe how a component reacts, not what a color is.
- **Too many words for strength and nesting.** `subtle`, `muted`, `base`, `canvas`, `surface`, `raised`, `inverse`, and `emphasis` overlapped, and intents nested a second set of property folders, so a designer had to read full names to find a color.

Three systems were compared from their published token files:

| | eBay Evo | Primer | Atlassian |
|---|---|---|---|
| Text levels | `primary, secondary` | `default, muted` | `text, subtle, subtlest` |
| Fill strength | `primary, secondary, tertiary, strong` | `muted, emphasis` | `subtler … boldest` |
| States | isolated in a `state/` group | component tokens | `.hovered`, `.pressed` on every fill |
| Disabled | per property | per property | per property |
| Text on a fill | `on-primary, on-inverse, on-success…` | `onEmphasis, onInverse` | shared `text.inverse` |

The structure was then worked out in the Figma `Theme` collection over several rounds:

- **Material 3 pairs** (`surface` / `on-surface`, `inverse` / `on-inverse`) were tried first. Splitting the page from the things on it then needed `on-background` and `on-surface`, which always had the same values. Material 3 itself later merged `background` into `surface` for that reason, but a single `surface` reads as "everything placed on top of something".
- **Text on the page and on surfaces is one set.** Keeping one `content` group avoids the duplicate, and only text on a flipped fill needs its own name. This is Primer's split: `fgColor-default` / `muted` versus `fgColor-onInverse` / `onEmphasis`.
- **For intents, the soft fill and the strong fill form one ladder.** `on-surface` (the intent's text on the page) passes 4.5:1 on its own soft fill in every role and theme (lowest 5.35), so a separate `on-subtle` isn't needed. The text on the strong fill equals the neutral `content/inverse/base` in every role (white in light, black in dark).
- **Role before property for intents.** Figma scopes already filter a picker by property (fills, text, strokes), so a property folder inside the picker adds nothing; the role is the axis a picker can't filter.

## Why it matters

### Structure

```
background                                  page
surface/       subtle, base, strong, stronger
inverse/       base, strong, stronger
content/       base, subtle
               inverse/{base, subtle}
border/        base, subtle, focus
disabled/      surface, content, border
intent/<danger | warning | success | info | discovery>/
               surface/   subtle, base      (danger also: strong, stronger)
               content/   base, inverse
               border/    base, subtle
utility/       scrim
always/        white, black
```

Grammar: `[intent/<role>/]<surface | content | border>/<step>`, plus the neutral `background`, `inverse/`, `disabled/`, `utility/`, and `always/`.

### Layers

- **`background`** is the page, the bottom layer. It is a single token.
- **`surface/*`** sits on the background: `base` for cards, popovers, and modals (with a shadow; same as the background in light, one step lighter in dark), `subtle` for tinted areas (code blocks, neutral badges, progress tracks, sidebars), and `strong` / `stronger` for the hover and pressed fills of transparent elements (list items, ghost buttons) on the background or a surface.
- **`inverse/*`** is the flipped neutral fill for primary buttons, tooltips, and snackbars.
- An intent's **`surface/*`** is the same ladder in the role's hue: `subtle` for alerts, banners, and soft badges; `base` for strong badges and tags; danger's `base` / `strong` / `stronger` for destructive buttons at rest, hover, and pressed.

### Vocabulary

| Kind | Words |
|---|---|
| Layer | `background`, `surface`, `inverse` |
| Strength | `subtle` < `base` < `strong` < `stronger` |
| Text | `content`: `base`, `subtle`, and `inverse` for text on a flipped fill |
| Line | `border`: `base`, `subtle`, `focus` |
| Group | `intent/<role>/`, `disabled/`, `utility/`, `always/` |

- **Strength steps measure distance from the background** (darker in light, lighter in dark) for `strong` and `stronger`. In the neutral surface group, `base` is the default container surface and `subtle` the tinted one; in light the tinted one is the darker of the two, so `subtle` there means "quieter use", not "closer to the background".
- **No `default`, `canvas`, `raised`, `muted`, `emphasis`, or `on-`.** Each was replaced by a layer or strength word above.
- **`content/inverse` is text on a flipped fill**: on the neutral `inverse/*`, and on an intent's `surface/base`, `strong`, and `stronger`, where the fill is saturated enough that the text flips (white in light, black in dark). `content/strong` was rejected because a strength word would read as "stronger red text" and invite white text on the page. `content/contrast` was rejected because it adds a second word for the same role and can read as "higher-contrast red text".
- **`inverse` stays a neutral layer, not a strength step.** An intent's strong fill behaves like `inverse` (the text flips), but inside an intent it continues the `surface` ladder, so it takes the ladder's names.

### States

- **`hover` / `pressed` become strength steps** (`strong`, `stronger`); their use lives in `$description`. This is a compromise: the steps exist because interaction needs fills stronger than `base`. When the component tier arrives, component tokens alias them (`button/primary/background-hover` → `{inverse.strong}`) and the semantic names stay.
- **`disabled` stays semantic** as its own group: every control uses the same disabled colors whatever its resting fill, and eBay, Primer, and Atlassian all keep it in the semantic tier. It is exempt from contrast.
- **Component-specific states** (`selected`, `checked`) still go to the component tier (ADR 0018).

### Descriptions

Names say what a color is; `$description` says when to use it and which text goes on a fill (`intent/danger/surface/base`: "Strong danger fill for destructive buttons, badges, and tags. Use content/inverse on it."). Every semantic color has one. They were written in the Figma variables first; the token source copies the same text.

### Pairing and contrast

| Content | Sits on | Min |
|---|---|---|
| `content/base`, `subtle` | `background`, `surface/*` | 4.5:1 |
| `content/inverse/*` | `inverse/*` | 4.5:1 |
| intent `content/base` | `background`, `surface/*`, that intent's `surface/subtle` | 4.5:1 |
| intent `content/inverse` | that intent's `surface/base`, `strong`, `stronger` | 4.5:1 |

- UI boundaries at 3:1 against `background` and `surface/*`: `border/base`, `border/focus`, `inverse/*`, intent `border/base`, intent `surface/base`, `strong`, `stronger`.
- Exempt: `disabled/*`, `border/subtle`, intent `border/subtle`, `utility/*`, `always/*`.
- States must be visible: each `base` / `strong` / `stronger` set differs; `surface/strong` / `stronger` differ from `background`, `surface/subtle`, `surface/base`, and `disabled/surface`; an intent's surface steps all differ.
- Checked on the Figma collection: 138 pairs per theme, all passing; lowest text 4.69 (light) / 4.58 (dark), lowest UI 3.22; no invisible states.

### Figma

- Scopes follow the name: `content/*` and `disabled/content` → text fill, shape fill, and stroke (outline icons); `border` in the path → stroke; `always/*` → all fills and strokes; everything else → frame fill and shape fill.
- Content keeps the shape-fill scope because icons are vectors, so a shape's fill picker shows both fills and content colors; scopes can't tell an icon from a shape.

### Breaking

Almost every semantic color is renamed and five are removed, so the next release is `0.4.0` (ADR 0014).

## Implementation notes

Old (0.3.0) → new (58 → 53 tokens; `<r>` is each intent):

| Old | New |
|---|---|
| `background/canvas` | `background` |
| `background/surface/subtle`, `raised` | `surface/subtle`, `surface/base` |
| `background/hover`, `pressed` | `surface/strong`, `stronger` |
| `background/inverse/base`, `hover`, `pressed` | `inverse/base`, `strong`, `stronger` |
| `content/base`, `muted` | `content/base`, `subtle` |
| `content/inverse/base`, `muted` | `content/inverse/base`, `subtle` |
| `border/base`, `subtle`, `focus` | unchanged |
| `background/disabled`, `content/disabled`, `border/disabled` | `disabled/surface`, `content`, `border` |
| `intent/<r>/background/subtle`, `emphasis` | `intent/<r>/surface/subtle`, `base` |
| `intent/danger/background/hover`, `pressed` | `intent/danger/surface/strong`, `stronger` |
| `intent/<r>/content/base` | unchanged |
| `intent/<r>/content/emphasis` | `intent/<r>/content/inverse` |
| `intent/<r>/content/subtle` | removed: use `intent/<r>/content/base` |
| `intent/<r>/border/base`, `subtle` | unchanged |
| `utility/scrim`, `always/white`, `black` | unchanged |

- Value change: text on an intent's soft fill moves from the removed `content/subtle` (light `<hue>.800`, dark `<hue>.200`) to `content/base` (light `<hue>.700`, dark `<hue>.200` for danger and `<hue>.300` for the others). All pairs still pass.
- `generate-color.ts` writes the new names and `$description` (text copied from the Figma variables); `pairs.ts` derives the pairs above (level words `base` / `subtle`, and `inverse` meaning "on a flipped fill").
- Shadows are unaffected. The Storybook docs (`components.tsx`, `Color.mdx`, `docs.css`), `.storybook/theme.ts` comments, CLAUDE.md, and README follow the renames. In `docs.css`, table-row hover should use `surface/strong`.
- Figma: the `Theme` variables already use these names, scopes, and descriptions. The Color specimen still shows 0.3.0 labels, and chips bound to the removed intent text colors lost their binding; redraw it.
- When accepted: ADR 0017 and 0018 get `(amended by 0019)`.

## Documented in

- `CLAUDE.md` — Token Rules (Color, Accessibility), once accepted
