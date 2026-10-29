# 0077. Switch

- Status: accepted
- Date: 2026-10-30

## Decision

Chosen: a second component fixture, Switch, whose on and off states take the variant slot of the component grammar (`switch/<on | off>/<surface | content | border>/<state>`), with the inverse fill when on, a 48 × 24 track from the `space/*` scale, and a pill in every shape, because it is the first component-specific state (`checked`, ADR 0018) and the one control Android and iOS both have natively, so the component tier can reach all three platforms (ADR 0078).

## What we learned

ADR 0034 adds a component only for a test the tier doesn't have. The candidates were Checkbox (the `checked` state), Input, Card, and a Box or Stack (`docs/progress.md`). Checkbox has no native control on iOS, so the owner asked for one that exists on every platform (2026-10-29):

- **Switch**: chosen. `<input type="checkbox" role="switch">` on the web, Material 3 `Switch` on Android, `Toggle` on iOS. Tests `checked` as Checkbox would. iOS's `Toggle` takes one color, the on fill (`tint`); Android's takes a color per part and state.
- **Card**: the only candidate every platform would draw itself, so every token would show; but it has no state, so it tests no new part of the tier.
- **Text field**: native on all three, but iOS styles little of it, and it brings form and ARIA work that isn't about tokens.

How `checked` fits the grammar `<component>/<variant>/<property>/<state>`:

- **On and off as the variant**: chosen. Every color changes between them, as between Button's variants, so each is a group with its own surface ladder and content. `pts/component-states` and `pts/component-pairs` apply unchanged: each group's `content` must pair with its `surface/*` (breaking the pairing or two states on purpose is reported).
- **A `checked` state word** (`switch/surface/checked-hover`): one more state axis in a rule that has one, for no gain.

The rest, each decided by the owner (2026-10-29):

- **On color**: `inverse/*`, as on a primary button and the iOS accent (ADR 0073). Rejected: `intent/info` (blue) and `intent/success` (green, like iOS's default), whose meanings are a notice and a success, not "on".
- **Label**: before the track, as in a settings row and on both native platforms. Rejected: after it, as a checkbox; and no label, leaving it to the page.
- **Size**: only the web needs one, since Android's and iOS's switches have a fixed size and expose no size to set. A 48 × 24 track and a 16px thumb, 4px from the edge: the middle of the usual 44 × 24 to 52 × 32, a 2:1 track, and the thumb the size of a small icon. No role token holds these, so they come from the `space/*` scale (CLAUDE.md, Spacing: a role first, `space/*` when none fits); `size/icon/*` holds 24 and 16 too, but names icons.
- **Shape**: a pill in every shape (`radius/full`), not `radius/control`. The native switches are always pills, so a soft web switch would be the only one with corners, and a cornered track needs a concentric thumb radius that only `calc()` and a Figma-only variable can hold (the `control-ring` problem).

## Why it matters

### Tokens

`tokens/src/component/switch.tokens.json`, 23 tokens:

```
switch/
  off/        surface/{rest, hover, pressed}, content, border
  on/         surface/{rest, hover, pressed}, content
  disabled/   off/{surface, content, border}, on/{surface, content}
  label/      content, text
  track/      width, height
  thumb/      size, inset
  gap, radius, border-width
```

| Token | Aliases |
|---|---|
| `switch/off/surface/rest`, `hover`, `pressed` | `surface/subtle`, `strong`, `stronger` |
| `switch/off/content` (the thumb) | `content/subtle` |
| `switch/off/border` | `border/base` |
| `switch/on/surface/rest`, `hover`, `pressed` | `inverse/base`, `strong`, `stronger` |
| `switch/on/content` (the thumb) | `content/inverse/base` |
| `switch/disabled/off/surface`, `content`, `border` | `disabled/surface`, `content`, `border` |
| `switch/disabled/on/surface`, `content` | `disabled/content`, `disabled/surface` |
| `switch/label/content`, `text` | `content/base`, `text/body-md` |
| `switch/track/width`, `height` | `space/1200` (48), `space/600` (24) |
| `switch/thumb/size`, `inset` | `space/400` (16), `space/100` (4) |
| `switch/gap` | `gap/within/md` (12, compact 8) |
| `switch/radius` | `radius/full` |
| `switch/border-width` | `stroke/thin` |

- **Off is outlined.** Its track is `surface/subtle`, the same as a card, so `border/base` (3:1, WCAG 1.4.11) shows the control on any layer; the thumb is `content/subtle`, 4.5:1 on every surface step.
- **On is the inverse fill**, a UI boundary at 3:1 on the page and every surface, with a `content/inverse/base` thumb.
- **Disabled keeps on and off apart.** Off keeps its outline; on stays filled, with the disabled colors swapped (`disabled/content` for the track, `disabled/surface` for the thumb), since the thumb's position alone is a weak cue. Disabled colors are exempt from contrast.
- **The label** is `text/body-md` in `content/base`; disabled, it takes `switch/disabled/off/content`.
- **One size in both densities.** The track is 48 × 24, which meets WCAG 2.5.8's 24px minimum target on its own; the label adds to the target. Only the gap to the label follows the density.
- **The thumb sits `inset` from the track's outer edge** and travels `width − size − 2 × inset` (24px) when on.

### Code

`<pts-switch>` in `@pts/components` (`apps/components/src/switch.ts`), exported as `@pts/components/switch.js`.

```html
<pts-switch name="notifications" checked>Notifications</pts-switch>

<!-- shadow root -->
<label>
  <span class="label"><slot></slot></span>
  <span class="track"><input type="checkbox" role="switch" /><span class="thumb"></span></span>
</label>
```

| Attribute | Values | Default |
|---|---|---|
| `checked` | boolean, the starting state | off |
| `disabled` | boolean | off |
| `name`, `value` | the form field; `value` is submitted while on | —, `on` |
| `label` | the accessible name, required when there is no text | — |

- **A real checkbox with `role="switch"` inside a `<label>`.** Space toggles it, the label and the track toggle it on click, and the screen reader announces a switch named by the label's text.
- **Form-associated**, as a checkbox: the form submits `value` while on and nothing while off, and a reset returns to the `checked` attribute.
- **`change`** fires on the host after each toggle by the user, since an input's `change` doesn't cross the shadow root.
- **Disabled stays focusable** (`aria-disabled`); clicks and Space are stopped, so the state never changes and no listener on the host fires.
- **The track's border is reserved when on** (transparent), so on and off have the same box; the thumb moves with `transform` over `motion/duration/fast` and `motion/easing/standard`, instantly under `prefers-reduced-motion`.
- **The label takes the room left**: a switch given a width puts its track at the end, as in a settings row.

## Trade-offs

- **The lint rules needed no change.** On and off as variants is what keeps them unchanged; the new part is the naming, a component-specific state in the variant slot, and the disabled group nested by state.
- **The off thumb is text-colored** (`content/subtle`) rather than a UI color, so it has to meet 4.5:1 where 3:1 would do. Every surface step already gives it that.
- **A hover color on a touch-only platform**: Android and iOS don't use `hover` and `pressed`; their switches animate their own feedback.
- **A pill that ignores the shape modifier**: a product in the round shape and one in the soft shape draw the same switch.

## Implementation notes

- `tokens/src/component/switch.tokens.json`, registered in `sets.base`. Checked: `pts/component-pairs` reports `switch/on/content` aliased to `content/base` (three unpaired fills), `pts/component-states` reports two off states on the same step.
- `@pts/web` repeats the switch colors in the theme blocks and `switch/gap` in the density blocks with no change to the build; `npm test` checks them.
- `apps/components/src/switch.ts`; the package exports `./switch.js`.
- Storybook: `Component/Switch` (Preview, Usage, Playground; Off, On, Disabled, Label, Size, Shape), a Switch card on the Overview, the sidebar order, and JSX types in `elements.d.ts`.
- Checked in Chromium: the track is 48 × 24 and the thumb 16 × 16 at 4px, 24px further when on; clicking the label or the track and Space toggle it and fire `change`; disabled never toggles, never reaches a click listener, and stays focusable; a form submits `n=on` for a checked switch named `n` and nothing for one that's off, and a reset returns each to its attribute; the accessibility tree has `switch "Notifications" [checked]`. `npm run test-a11y`: no violations on the Switch page and stories in light and dark.
- Figma: 22 `switch/*` variables in `Component` (the label's text style is `text/body-md`), aliasing `Theme`, `Density`, and `Semantic` variables, with the token descriptions, scopes by property, and `var(--switch-…)` code syntax. A `Switch` page after Button: the `.Document/Header`, a `Switch` set of 8 variants (`Checked` × `State`; `Label`, `↳ Label`, and `Focus` properties) with a locked `Labels` frame, and a specimen frame mirroring the docs page (Preview in light and dark × relaxed and compact, Off, On, Disabled, Label, Size, Shape) with the docs' hex values and badges. The Overview lists the page and 362 variables (`Component` 57).
- Checked by screenshot in Figma: the track 48 × 24 with the thumb 4px in, at the start off and the end on; the focus ring 2px outside at 2px wide; every cell switching with its Theme and Density mode, the label gap 12 relaxed and 8 compact.

## Documented in

- `CLAUDE.md`: Structure, Component tier
- `.claude/rules/components.md`, `.claude/rules/storybook.md`, the `figma` skill (Components)
- `README.md`: Packages, Usage (Components)
- `docs/how-it-works.md`: Components as fixtures
- `docs/progress.md`: Open questions
