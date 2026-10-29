---
name: figma
description: Rules and procedures for the Figma `pts` file (variables, collections, text and effect styles, specimen pages). Load before reading or changing anything in Figma, and after any token change, since Figma must be brought in line by hand.
---

# Figma

Figma is one consumer of the tokens. The JSON is the source of truth; nothing syncs automatically (the plan is Pro, and the REST variables API is Enterprise only), so after a token change, update the variables and specimens by hand or with a one-off script.

## Access

Each Figma MCP server must be authenticated with the personal account that owns the `pts` file; a work account only has view access. To switch, clear the server's authentication in `/mcp` and reconnect.

Two servers: `figma-console-mcp` makes every change (variables, styles, components, specimens); Figma's own server (`figma`) only reads, to see what an agent gets from a selection, such as the code syntax (ADR 0075). Never write to the file from both.

## Collections

| Collection | Modes | Holds |
|---|---|---|
| `Primitive` | one | every primitive, hidden from pickers |
| `Theme` | `light`, `dark` | the values that change with the theme, plus `always/*` |
| `Semantic` | one | the semantic tokens that don't change with any modifier, including shadow offsets, blurs, and spreads |
| `Density` | `relaxed`, `compact` | the density tokens only: `Spacing/padding/*`, `Spacing/gap/within\|between/*`, `Size/size/control/*`, plus the Figma-only `Spacing/gap/button-inner` |
| `Viewport` | `narrow`, `wide` | the viewport tokens only: `Typography/font-size\|line-height\|letter-spacing/display/*`, plus the Figma-only `Typography/line-height/display/*-px` |
| `Shape` | `soft`, `round` | the shape tokens only: `Border/radius/control` (ADR 0048) and `Border/radius/container` (ADR 0049), plus the Figma-only `Border/radius/control-ring` |
| `Component` | one | the component tokens (`button/*`, `switch/*`), each an alias of a `Theme`, `Density`, `Shape`, or `Semantic` variable, so a component follows the frame's modes. Typography composites (`button/<size>/label`, `switch/label/text`) are the text styles they alias. Plus `button/<size>/label-inset` and `gap-inner`, which hold no token: the code computes them with `calc()` (ADR 0055) |

- `always/*` is the same in both `Theme` modes; it stays in `Theme` so every semantic color is in one collection for designers, while the JSON keeps it in the base set.
- A new modifier is a new collection holding only its tokens, the same principle.
- `radius/control-ring`: the corners of a control's focus ring, `radius/control` plus `focus-ring/offset` and `width` (12px soft, 9999px round), worked out by hand since Figma can't add variables; the CSS outline follows the control's radius on its own. Every `focus-ring` layer in the `Button` and `Button/Icon-button` sets binds it. Recompute it when `radius/control` or the focus ring changes.
- `line-height/display/*-px`: Figma binds line heights as px while the tokens are ratios, so these hold the px line each display step makes (font size × ratio, worked out by hand). The display and heading text styles bind them. `npm run check` can't see Figma: recompute them when a display size or line height changes.

## Variables

- **Names**: `Primitive`, `Theme`, and `Component` variables are named by their token path (`color/neutral/50`, `intent/danger/surface/base`). `Semantic`, `Density`, and `Viewport` variables sit in one folder per docs page, then the token path: `Spacing/` (space, padding, gap), `Typography/` (font-*, line-height, letter-spacing), `Border/` (radius, stroke, focus-ring), `Size/`, `Motion/`, `Layout/` (breakpoint, z-index), `Elevation/` (the shadow parts). A new semantic group goes in the folder of the docs page that shows it.
- **Code syntax**: every variable's WEB code syntax is its CSS custom property, `var(--<token path with dashes>)`, so Dev Mode shows the real name whatever the folder. A Component variable the code computes instead (`button/<size>/label-inset`, `gap-inner`) shows the `calc()` the component uses. The shadow parts and the `*-px` line heights have none, since the CSS emits only the composite and the ratio (`--shadow-sm`, named in the effect style description).
- **ANDROID and iOS code syntax** (ADR 0075): a variable whose token `@pts/android` and `@pts/ios` emit (the semantic colors, spacing and sizes, radius, strokes, and focus ring) shows the property each platform reads. iOS: the static member, `PtsColors.surfaceSubtle`, `PtsSpacing.paddingMd`, `PtsBorder.radiusControl`. Android: the property on the instance an app picks per mode, named as in the README, `colors.surfaceSubtle`, `spacing.paddingMd`, `border.radiusControl`. The other variables have none on these platforms, since no native class holds them.
- **Descriptions**: the same text as the token's `$description`. Every semantic variable has one.
- **Scopes** follow the name: `content/*` and `disabled/content` → text and shape fills plus strokes; a `border` segment → strokes; `always/*` → all; every other color → frame and shape fills.

## Components

- A component set per component, on its own page (`Button`, first after Overview, as in the Storybook sidebar). A related set is named under it (`Button/Icon-button`). Placeholder parts the sets use have their own page (`Icons`, after the component pages). The page's specimen frame mirrors the Storybook page and adds a Preview section: instances in every theme × density, each cell pinning both modes, with the docs Preview's content (labels, rows, states). The cells sit in a row per density and a column per theme (light · relaxed, dark · relaxed, then light · compact, dark · compact), so cells side by side have the same sizes and differ by color only; each button row is centered in its cell, as in the docs. A grid of aligned columns was tried and dropped: the docs' cells are about 480px wide, too narrow for four columns of buttons.
- Beside the specimen frame, a component page has a `.Document/Header` instance, the docs `PageHeader` on a `background` fill (an uppercase eyebrow, the title, a lead; no banner or illustration), then one section per set below it, as wide as the header together. The header component lives in the `Document` section of the Overview page.
- Inside a set's section: rows are `Variant` × `State`, columns `Size` (× `Icon`), with a wider gap between groups and each button centered in its row. A locked `Labels` frame behind the set names each row and column (`text/label-md` for the group, `text/body-sm` with `content/subtle` for the value), inset 64px like the specimen frame. The section fill binds `background`, so it follows the frame's `Theme` mode.
- Every fill, stroke, size, padding, gap, and radius of a component binds a `Component` variable; the focus ring binds `border/focus` and `focus-ring/width` directly, as the code does.
- Properties are what a designer chooses, as the code's attributes and slots are; what follows from a choice is built from layers and variables, never a variant (ADR 0052). The property's type follows what Figma can express, not the code's: a boolean only shows or hides a layer, so a choice that changes colors, such as `disabled`, is a value of the `State` variant. `State` holds the mutually exclusive looks: Rest; Hover and Pressed, previews of `:hover` and `:active` with no attribute; Disabled (`disabled`); Loading (`loading`). Code can set `disabled` and `loading` together, which Figma can't show. A set's description maps each value to the code. Button: `Variant`, `Size`, `State` (Rest, Hover, Pressed, Disabled, Loading); `Start icon` and `End icon` booleans with their instance swaps (`↳ Start icon`, `↳ End icon`); `Focus` a boolean (the ring layer); `Label` a text property. Icon-only buttons are a separate set (`Button/Icon-button`), since a square can't come from a boolean. Switch (ADR 0077): `Checked` (False, True) × `State` (Rest, Hover, Pressed, Disabled); `Label` a boolean with its text (`↳ Label`), `Focus` a boolean. The track's auto layout pads `switch/thumb/inset` and puts the thumb at the start when off and the end when on; on has no stroke, as the code's border is transparent. In the Preview, each instance fills the row and its label is set to Fill, so the track sits at the end as in the docs.
- The icon side pads one step less without a variant: the button pads `padding/icon-side`, a `label` frame around the text adds `button/<size>/label-inset` (`padding/base` − `icon-side`) on both sides, and the gap is `button/<size>/gap-inner` (the button's gap − the inset). The code is built the same way (ADR 0055), so the layers and Dev Mode match it. Recompute `Spacing/gap/button-inner` and the insets when a button gap or padding changes; `pts/icon-side-padding` keeps the gap at least the inset in the tokens.
- Build sets with a script, one variant per call (the bridge times out around 30 s), then combine.
- A paint bound with `setBoundVariableForPaint` keeps the color it was made with as its base, and Figma can render that color instead of the variable's (seen on table chips in both modes). Make the paint with the variable's resolved color (`resolveForConsumer(node)`), then bind it.
- To change an instance's icon from a script, swap the nested icon with `swapComponent`, then bind the glyph fill with `setBoundVariableForPaint`. Setting the instance-swap property instead drops the nested overrides (the glyph's bound content color), and a fill bound or copied onto it afterward can render its raw color in every mode. Check the icons by screenshot in light and dark, not only by their bound variables.

## Styles

- Text and effect styles start their descriptions with the token's usage.
- Text styles bind family, size, weight, and letter spacing. Display and heading styles bind their line height to `line-height/display/*-px`; the other styles set it in px.

## Specimen pages

The pages mirror the Storybook docs: the same pages in the same order, the same token sections with the same titles, paths, and leads. Each side may add explanatory sections of its own (the docs' Rules, Preview, Raised surface, Sans coverage; Figma's Shadow variables). A lead differs only by a platform-specific sentence (bound variables or Figma limits here; CSS usage in the docs). Token paths read with slashes (`surface/subtle`, `→ color/neutral/50`). When a section or lead changes on one side, change the other.

- **One table style**: a header with the token count, the section title with its path, column headers, short token names, token first. The sample sits in the value cell, or after the value where it needs width (type, easing, breakpoints). A contrast badge (AA, Exempt, or Palette's W and B) sits right after the text it qualifies, in the value cell, never in a column of its own: after "on <fill>" on Color, after the hex on Palette (whose VALUE header says what W and B mean), and on its own line under the hex and alias in the Button color tables, where light and dark share a row. Long text stacks rather than overflows: the hex, then `→ alias`, then `lowest on …` with the badge.
- **One frame per page**, pinning its `Theme` mode. A table whose group changes with density or viewport has `TOKEN | <mode> | <mode>` columns, each mode cell (sample and value) pinning its mode. A new modifier adds columns, not frames.
- **Color and Elevation** keep a light and a dark frame, since nearly every row changes with the theme.
- **Text styles**: only styles that change with the viewport (`display-lg`, `display-md`) show a narrow and a wide specimen.
- Page titles use `text/heading-lg`, as in the docs.
- **Static content**: the contrast badges and hex labels are drawn by hand. Redraw them when a value changes.
- **Overview page**: lists the collections with their variable counts and the pages with their modes. Update it when a collection, a variable, or a page changes.

## After a token change

1. Update the variable values (and descriptions, scopes, code syntax for new variables) in the right collection.
2. Recompute `line-height/display/*-px` if a display size or line height changed.
3. Redraw the affected specimens: hex labels, contrast badges, value labels.
4. Update the Overview page counts if variables were added or removed.
5. Record what changed in the ADR's implementation notes, and the current Figma state in `docs/progress.md` only if something is left undone.
