# 0032. Button

- Status: proposed
- Date: 2026-10-02

The spec for the first component, written before the Figma component and the code, one question at a time. This draft settles the variants, sizes, anatomy, states, and tokens; the rest of the spec is listed under Open and is added here as it is decided. The ADR becomes `accepted` once the code ships.

## What we learned

The variants were meant to come from existing semantic tokens only, since Button is the first test of the color ladders (ADR 0019). The first suggestion was Primary (`inverse/*`), a filled Secondary (`surface/subtle` → `strong` → `stronger`), Ghost (transparent → `surface/strong` → `stronger`), and Danger (`intent/danger/surface/*`). Checked against the token values, the filled Secondary fails twice:

- **It disappears on surfaces.** Cards, popovers, and modals are `surface/subtle`, so a Secondary on them has the same fill as its container at rest and shows only its label.
- **It looks disabled.** `disabled/surface` has the same value as `surface/subtle` in both themes (light `neutral.50`, dark `neutral.900`).

Three other shapes were weighed:

- **Fill plus a `border/subtle` outline** (Primer's default button): the fill shows on the page, the outline on a surface. No new token.
- **Outline only** (transparent with `border/subtle`): looks the same on every layer, but is Ghost with a border, and loses the tint that sets it apart from Ghost on the page.
- **A fill one step stronger** (`surface/strong` at rest): visible everywhere, but pressed would need a fourth step below `stronger`, and Secondary at rest would be the same color as Ghost on hover.

For intents, every role already has `surface/base`, `strong`, and `stronger` (ADR 0019), so any of them could have a button with no new token. Only destructive actions need one now.

For sizes, `size/control/*` already sets a shared height for buttons, inputs, and selects (32, 48, 56; compact 28, 40, 48), and `progress.md` asked whether `padding/*` needs a split because buttons pad asymmetrically. They don't need vertical padding at all: the height comes from `size/control/*` and the label is centered in it, as ADR 0028 already assumed (a 14/20 label in the 48px control). Only the horizontal padding is left, and the existing `padding/*` steps fit it, shrinking with density like every other padding. The labels were the gap: `text/label-sm` (12px) and `label-md` (14px) exist, but nothing larger. Three spreads of horizontal padding were compared by the width of a "Cancel" button:

- **12 · 16 · 24** (one `padding/*` step per size): the rule is simplest, but a 48px md button is about 77px wide and reads squat.
- **12 · 24 · 24**: md becomes about 93 × 48, the proportion of Material 3's default button (24px sides); lg is set apart by its height and its larger label.
- **16 · 24 · 32**: lg's 32px is past `padding/xl` and would need a new token.

For the anatomy, an icon reads heavier than text, so with the same padding on both sides the icon side looks wider; Material 3 pads the icon side less. A pill radius was set aside because buttons share their row with inputs and selects, which read better with the same corners. Truncating a long label with an ellipsis hides what the button does, so a label is never cut.

For states, two loading shapes were compared: a spinner replacing the content at the same width, and a spinner in the leading icon slot with the label kept. The second shows what is happening but widens a button that had no icon, more so if the label changes to "Saving…". For disabled, the HTML `disabled` attribute is simplest but takes the button out of the tab order, so keyboard and screen-reader users can't find it or learn why it is off.

For tokens, every value in this spec is already a semantic token (only `text/label-lg` is new), so component tokens add names, not values. Using semantic tokens directly, with the variant and state switching done by private CSS variables on the button element, needs no change to the build, lint, or Figma collections; Atlassian works that way, with no component tokens. The component tier was chosen anyway, as ADR 0018 planned: it gives code and Figma one place that says what a button uses, lets a later product change Button without touching the semantic tier, and this project exists to learn the full primitive → semantic → component pipeline. Its costs are below.

## Why it matters

### Variants

Four variants, all from existing semantic tokens:

| Variant | Rest | Hover | Pressed | Content | Border |
|---|---|---|---|---|---|
| Primary | `inverse/base` | `inverse/strong` | `inverse/stronger` | `content/inverse/base` | none |
| Secondary | `surface/subtle` | `surface/strong` | `surface/stronger` | `content/base` | `border/subtle` at `stroke/thin` |
| Ghost | transparent | `surface/strong` | `surface/stronger` | `content/base` | none |
| Danger | `intent/danger/surface/base` | `intent/danger/surface/strong` | `intent/danger/surface/stronger` | `intent/danger/content/inverse` | none |

- **Primary** is the main action of a view, at most one per group. **Secondary** is every other action next to it. **Ghost** is for low-emphasis and repeated actions (toolbars, table rows, a dismiss button). **Danger** is for destructive actions (delete, remove), usually confirmed.
- **Secondary is filled and outlined.** On the page the fill sets it apart; on a surface the outline does.
- **Danger is the only intent button.** A pressable warning, success, info, or discovery button is added when a control needs one; it needs no new token, and adding a variant is not breaking (ADR 0014). This is ADR 0018's rule that a fill gets pressable states only when a component uses it, applied to the component.
- **Every variant has the same box.** Variants without a border reserve `stroke/thin` as a transparent border, so heights and widths match side by side.

### Sizes

Three sizes, one per `size/control/*` step, so a button sits in a row with an input or select of the same size. `md` is the default.

| Size | Height (relaxed / compact) | Horizontal padding | Label | Icon | Icon–label gap |
|---|---|---|---|---|---|
| `sm` | `size/control/sm` (32 / 28) | `padding/md` (12 / 8) | `text/label-md` (14px) | `size/icon/sm` (16) | `gap/within/sm` (8 / 4) |
| `md` | `size/control/md` (48 / 40) | `padding/xl` (24 / 20) | `text/label-md` (14px) | `size/icon/sm` (16) | `gap/within/sm` (8 / 4) |
| `lg` | `size/control/lg` (56 / 48) | `padding/xl` (24 / 20) | `text/label-lg` (16px, new) | `size/icon/md` (24) | `gap/within/sm` (8 / 4) |

- **Height is fixed, not padded.** The button's height is the control height and the content is centered in it; there is no vertical padding. Text that wraps is not supported: a label stays on one line.
- **Horizontal padding uses `padding/*` unchanged**, so `padding/*` needs no split. md and lg share `padding/xl`; lg is larger by height and label.
- **`sm` keeps a 14px label.** 12px is the minimum for text (ADR 0023) and looks cramped in a button; `text/label-sm` stays for badges, tags, and other elements smaller than a control.
- **`text/label-lg` is a new text style**: `font-size/text/md` (16px), `font-weight/medium`, `line-height/text/md`, `letter-spacing/normal`, the same shape as `label-md` one step up. Adding it is not breaking (ADR 0014).
- **Density shrinks height, padding, and gap together**, since all three are density tokens (ADR 0025); label and icon sizes stay.

### Anatomy

```
[padding] [leading icon] [gap] [label] [gap] [trailing icon] [padding]
```

- **Icon slots**: leading (what the action does: `+ Add`), trailing (direction or a menu: `Next →`, `Options ▾`), both at once, or icon-only. Icon size and gap are in Sizes.
- **Icon-only** is a square of `size/control/*` with the icon centered, and must have an accessible name (`aria-label` in code, the layer name in Figma), since nothing visible names it.
- **The icon side pads one `padding/*` step less**: `sm` `padding/sm` (8 / 4) instead of `padding/md`; `md` and `lg` `padding/lg` (16 / 12) instead of `padding/xl`. The side without an icon keeps the size's padding. No new token.
- **Radius**: `radius/md` (8px) at every size, the radius inputs and selects are meant to share, so a row of controls has the same corners.
- **Width**: the content's width by default. A full-width option fills the container and keeps the content centered (a bottom call to action on a phone).
- **Long labels are never cut.** The label stays on one line, with no wrapping and no ellipsis; the button grows to fit, and a layout that can't fit it changes the layout or the label. Icons never shrink.

### States

Rest, hover, and pressed are in the variant table. The others:

| State | Look | Focusable | Responds to hover and press | Accessibility |
|---|---|---|---|---|
| Focus | an outline in `border/focus`, `focus-ring/width` wide at `focus-ring/offset`, on keyboard focus only (`:focus-visible`) | — | — | — |
| Disabled | content `disabled/content`; fill `disabled/surface`, except Ghost, which stays transparent; Secondary's outline `disabled/border` | yes | no | `aria-disabled="true"` |
| Loading | the variant's colors; a spinner replaces the content | yes | no | `aria-busy="true"`; the label stays the accessible name |

- **Disabled stays focusable.** It uses `aria-disabled` instead of the HTML `disabled` attribute, which removes the button from the tab order. A keyboard or screen-reader user then still finds the button and can be told why it is unavailable (a tooltip or nearby text), and focus doesn't jump when a button becomes disabled. Code blocks the click itself. This is what Primer and Atlassian do.
- **Loading keeps the width.** The label and icons stay in place but invisible, and a spinner is centered over them, so the button doesn't resize and the layout doesn't move when loading starts or ends. The spinner is the size of the button's icon (`size/icon/sm`, or `md` for `lg`) in the variant's content color. Loading keeps the variant's colors, since the action is under way, not unavailable; like disabled, it stays focusable and ignores clicks.
- **The spinner keeps turning under `prefers-reduced-motion`**: it is the only sign that something is happening (WCAG 2.3.3 exempts essential motion).
- **State changes animate** fill, border, and content colors over `motion/duration/fast` with `motion/easing/standard`, and switch instantly under `prefers-reduced-motion`.
- **No selected or toggle state.** A button that stays on (Bold in a toolbar, a favorite) is a different component, a toggle button or a segmented control, decided with its own component tokens (ADR 0018). Button only triggers an action.

### Component tokens

Button starts the component tier: `tokens/src/component/button.tokens.json`, 39 tokens that alias semantic tokens only. Code and Figma use `button/*`; the semantic names above say what each one points to.

```
button/
  primary/     surface/{rest, hover, pressed}, content
  secondary/   surface/{rest, hover, pressed}, content, border
  ghost/       surface/{hover, pressed}, content
  danger/      surface/{rest, hover, pressed}, content
  disabled/    surface, content, border
  sm|md|lg/    height, padding/{base, icon-side}, gap, icon, label
  radius, border-width
```

| Token | Aliases |
|---|---|
| `button/primary/surface/rest`, `hover`, `pressed` | `inverse/base`, `strong`, `stronger` |
| `button/primary/content` | `content/inverse/base` |
| `button/secondary/surface/rest`, `hover`, `pressed` | `surface/subtle`, `strong`, `stronger` |
| `button/secondary/content` | `content/base` |
| `button/secondary/border` | `border/subtle` |
| `button/ghost/surface/hover`, `pressed` | `surface/strong`, `stronger` |
| `button/ghost/content` | `content/base` |
| `button/danger/surface/rest`, `hover`, `pressed` | `intent/danger/surface/base`, `strong`, `stronger` |
| `button/danger/content` | `intent/danger/content/inverse` |
| `button/disabled/surface`, `content`, `border` | `disabled/surface`, `content`, `border` |
| `button/<size>/height` | `size/control/<size>` |
| `button/sm/padding/base`, `icon-side` | `padding/md`, `padding/sm` |
| `button/md/padding/base`, `icon-side` and `button/lg/…` | `padding/xl`, `padding/lg` |
| `button/<size>/gap` | `gap/within/sm` |
| `button/sm/icon`, `md/icon`, `lg/icon` | `size/icon/sm`, `sm`, `md` |
| `button/sm/label`, `md/label`, `lg/label` | `text/label-md`, `label-md`, `label-lg` |
| `button/radius` | `radius/md` |
| `button/border-width` | `stroke/thin` |

- **Grammar**: `button/<variant>/<property>/<state>`, with the semantic property words `surface`, `content`, `border`. A property that changes with state names every state, `rest` included, since a DTCG token can't also be a group; one that doesn't is a single token (`content`). State words (`rest`, `hover`, `pressed`) appear only in this tier (ADR 0019).
- **Ghost has no `surface/rest`**: it is transparent at rest, and there is no transparent token to alias. The button's fill is transparent unless a token sets it.
- **Disabled is one shared group.** Every variant uses the same disabled colors; the spec above says which parts each variant draws (Ghost no fill, Secondary keeps its outline).
- **Not in the tier**: the focus ring (`border/focus`, `focus-ring/*`) and motion (`motion/*`) are the same for every focusable or animated element, so Button uses them directly.
- **Tier rule**: a component token aliases a semantic token, never a primitive or a raw value, as semantic tokens alias primitives (`pts/tier-aliases`).

#### What the tier needs

- **CSS resolution.** A custom property resolves where it is declared, so a `button/*` token declared on `:root` keeps the light, relaxed value inside a `[data-theme="dark"]` or `[data-density="compact"]` subtree (ADR 0025). The build repeats every component token that aliases a theme or density token in those blocks.
- **Contrast.** The semantic pairs are checked by value; what is new is that a button's content and fills must point to a pair that is checked. A lint rule verifies, for each variant, that `content` aliases a semantic content token whose paired backgrounds (`tokens/lint/pairs.ts`) include every `surface/*` the variant aliases (for Ghost, the hover and pressed fills, which sit on the page or a surface).
- **Docs and Figma**: a Component group in Storybook, above Semantic; a `Component` collection in Figma whose variables alias the `Theme`, `Density`, and `Semantic` variables, which the Figma component binds.

### Contrast

Every pair a variant uses is one `npm run check` already derives (`tokens/lint/pairs.ts`), in both themes:

- `content/base` on `background` and `surface/*` (Secondary, Ghost); `content/inverse/base` on `inverse/*` (Primary); `intent/danger/content/inverse` on the danger `surface/base`, `strong`, and `stronger` (Danger), all at 4.5:1.
- `inverse/*` and the danger `surface/base`, `strong`, `stronger` at 3:1 against `background` and `surface/*`, so Primary and Danger read as controls on any layer.
- `surface/strong` and `stronger` differ from `background`, `surface/subtle`, and `disabled/surface` (`pts/visible-steps`), so hover and pressed show on the page and on a surface.

### Trade-offs

- **Secondary's outline is decorative.** `border/subtle` is exempt from contrast. WCAG 1.4.11 does not require a visible boundary for a button identified by its label, and Ghost has none at all; the outline only places the button on a surface.
- **A disabled Secondary differs from a resting one by its text only**, since `disabled/surface` = `surface/subtle` and `disabled/border` = `border/subtle` in both themes. Disabled controls are exempt from contrast, and the dimmed label carries the state.
- **Secondary and Ghost share their hover and pressed fills.** Both are neutral; they differ at rest.

## Open

Decided next, in this order, and added above:

- **Code**: CSS classes or React, where it lives (ADR 0016 roles), and whether props take tokens by category (`tokens.d.ts` types every value as `string`, ADR 0030).
- **Figma**: the component, checked in both themes and densities before the code.

## Implementation notes

- No token, code, or Figma change yet.
- Order: the tokens first (`text/label-lg`, `button/*`, the build and lint changes under What the tier needs, the Storybook page, `CLAUDE.md` Tiers), then the Figma component bound to them, then the code. Adding tokens is not breaking (ADR 0014).
- With the tokens: add `text/label-lg` to `semantic/typography.tokens.json`, and narrow `text/label-sm`'s description from "Labels on small controls, badges, and tags" to badges, tags, and elements smaller than a control, since `sm` buttons use `label-md`.

## Documented in

- `docs/progress.md` — In flight
