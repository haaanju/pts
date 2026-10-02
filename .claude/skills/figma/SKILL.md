---
name: figma
description: Rules and procedures for the Figma `pts` file (variables, collections, text and effect styles, specimen pages). Load before reading or changing anything in Figma, and after any token change, since Figma must be brought in line by hand.
---

# Figma

Figma is one consumer of the tokens. The JSON is the source of truth; nothing syncs automatically (the plan is Pro, and the REST variables API is Enterprise only), so after a token change, update the variables and specimens by hand or with a one-off script.

## Access

The Figma MCP must be authenticated with the personal account that owns the `pts` file; a work account only has view access. To switch, clear the figma server's authentication in `/mcp` and reconnect.

## Collections

| Collection | Modes | Holds |
|---|---|---|
| `Primitive` | one | every primitive, hidden from pickers |
| `Theme` | `light`, `dark` | the values that change with the theme, plus `always/*` |
| `Semantic` | one | the semantic tokens that don't change with any modifier, including shadow offsets, blurs, and spreads |
| `Density` | `relaxed`, `compact` | the density tokens only: `Spacing/padding/*`, `Spacing/gap/within\|between/*`, `Size/size/control/*` |
| `Viewport` | `narrow`, `wide` | the viewport tokens only: `Typography/font-size\|line-height\|letter-spacing/display/*`, plus the Figma-only `Typography/line-height/display/*-px` |

- `always/*` is the same in both `Theme` modes; it stays in `Theme` so every semantic color is in one collection for designers, while the JSON keeps it in the base set.
- A new modifier is a new collection holding only its tokens, the same principle.
- `line-height/display/*-px`: Figma binds line heights as px while the tokens are ratios, so these hold the px line each display step makes (font size × ratio, worked out by hand). The display and heading text styles bind them. `npm run check` can't see Figma: recompute them when a display size or line height changes.

## Variables

- **Names**: `Primitive` and `Theme` variables are named by their token path (`color/neutral/50`, `intent/danger/surface/base`). `Semantic`, `Density`, and `Viewport` variables sit in one folder per docs page, then the token path: `Spacing/` (space, padding, gap), `Typography/` (font-*, line-height, letter-spacing), `Border/` (radius, stroke, focus-ring), `Size/`, `Motion/`, `Layout/` (breakpoint, z-index), `Elevation/` (the shadow parts). A new semantic group goes in the folder of the docs page that shows it.
- **Code syntax**: every variable's WEB code syntax is its CSS custom property, `var(--<token path with dashes>)`, so Dev Mode shows the real name whatever the folder. The shadow parts and the `*-px` line heights have none, since the CSS emits only the composite and the ratio (`--shadow-sm`, named in the effect style description).
- **Descriptions**: the same text as the token's `$description`. Every semantic variable has one.
- **Scopes** follow the name: `content/*` and `disabled/content` → text and shape fills plus strokes; a `border` segment → strokes; `always/*` → all; every other color → frame and shape fills.

## Styles

- Text and effect styles start their descriptions with the token's usage.
- Text styles bind family, size, weight, and letter spacing. Display and heading styles bind their line height to `line-height/display/*-px`; the other styles set it in px.

## Specimen pages

The pages mirror the Storybook docs: the same pages in the same order, the same token sections with the same titles, paths, and leads. Each side may add explanatory sections of its own (the docs' Rules, Preview, Raised surface, Sans coverage; Figma's Shadow variables). A lead differs only by a platform-specific sentence (bound variables or Figma limits here; CSS usage in the docs). Token paths read with slashes (`surface/subtle`, `→ color/neutral/50`). When a section or lead changes on one side, change the other.

- **One table style**: a header with the token count, the section title with its path, column headers, short token names, token first. The sample sits in the value cell, or after the value where it needs width (type, easing, breakpoints). Color and Palette add a contrast column.
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
