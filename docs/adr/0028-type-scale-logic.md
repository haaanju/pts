# 0028. Type Scale Logic

- Status: accepted (amended by 0029)
- Date: 2026-10-01

## What we learned

The type scale had no stated logic. The sizes (12, 14, 16, 18, 20, 24, 32, 40, 48) were picked by hand; ADR 0004 only named them (`font-size/400` = 16px). Neighbouring steps differed by ×1.11 to ×1.33, so a title and a subtitle stacked together often differed by an amount that reads as a mistake rather than a hierarchy. Three shared line-height ratios produced lines off the 4px grid (24 × 1.2 = 28.8px, 14 × 1.2 = 16.8px), and px letter spacing didn't scale with size (−1px is invisible at large sizes).

The direction is bold and high-contrast: levels stacked together differ clearly or not at all.

## Why it matters

- **The rule: levels stacked together are the same size or clearly apart.** A difference under about ×1.2 reads as an error; ×1.5 or more reads as intent. Same-size pairs are told apart by weight or color (`text/heading-sm` 20px bold over `text/body-lg` 20px regular).
- **Two zones, named by what they're for**:
  - `font-size/text/xs, sm, md, lg` = 12, 14, 16, 20px: reading and UI. Close together, since UI needs fine steps; 18px is gone because it sat ×1.1 from both neighbours.
  - `font-size/display/sm, md, lg, xl` = 24, 40, 64, 104px: headings and display, about ×1.6 apart (16 × 1.6ⁿ, rounded to the 4px grid). Picked over ×1.5 (more steps, softer) and ×2 (three steps). A fifth step (168px) was left out until something needs it.
  - T-shirt names replace the ordinal numbers: with four steps per zone the reason for numbers (ADR 0004: ten steps) is gone, and the zone in the name marks where the ×1.6 contrast starts. Every name changes, so no old name silently gets a new value.
- **Every heading and display style is bold (700).** Size carries the hierarchy, so weight only separates headings from body text. 800 and 900 were compared on the real font and dropped: at 64px and up, 700 is already heavy. `font-weight/semibold` stays as a token for emphasis and future controls, though no text style uses it.
- **Line height pairs with font size, on the 4px grid.** `line-height/<zone>/<step>` matches `font-size/<zone>/<step>`: 12/16, 14/20, 16/24, 20/28, 24/28, 40/44, 64/64, 104/104. Large text gets tighter leading (down to 1.0), whole-pixel lines make component heights predictable (a 14/20 label plus 14px padding is the 48px `size/control/md`), and Figma text styles use the same px. This is what Material 3, Carbon, and Tailwind do.
- **Line heights hold their values; `ratio/*` is removed.** DTCG line heights are unitless, so 20px on 14px text is 1.428571…, which `ratio/N` (N = value × 100) can't name. The ratio only means something paired with its font size, the reason ADR 0024 gives for `z-index` and `breakpoint`. Each `$description` states the px line.
- **Letter spacing pairs with the display steps.** About −0.01em to −0.025em, growing with size, stored as px since DTCG dimensions have no em: −0.25, −0.5, −1.25, −2.5px. Text sizes use `letter-spacing/normal` (0); `wide` stays for uppercase labels.
- **No responsive sizes yet.** On small screens, consumers use the next smaller display or heading style. A viewport modifier (like density) or fluid `clamp()` sizes (a custom output plugin) were considered and deferred. *Amended by ADR 0029: a `viewport` modifier steps the two largest display sizes down on narrow screens.*

### Breaking

Every `font-size`, `line-height`, and `letter-spacing` name changes except `letter-spacing/normal` and `wide`, and the text styles change size (MINOR bump, ADR 0014):

| Before | After |
|---|---|
| `font-size/200, 300, 400` (12, 14, 16) | `font-size/text/xs, sm, md` |
| `font-size/500` (18) | removed |
| `font-size/600` (20) | `font-size/text/lg` |
| `font-size/700` (24) | `font-size/display/sm` |
| `font-size/800, 900, 1000` (32, 40, 48) | `font-size/display/md, lg, xl` = 40, 64, 104 |
| `line-height/tight, normal, loose` | `line-height/<zone>/<step>` |
| `letter-spacing/tighter, tight` | `letter-spacing/display/*` |
| `ratio/120, 150, 175` | removed |

| Style | Before | After |
|---|---|---|
| `display-lg` | 48 bold | 104 bold |
| `display-md` | 40 bold | 64 bold |
| `heading-lg` | 32 bold | 40 bold |
| `heading-md` | 24 semibold | 24 bold |
| `heading-sm` | 20 semibold | 20 bold |
| `body-lg` | 18 | 20 |

Every style's line height moves to its grid value.

## Implementation notes

- Primitives: `dimension/104`; `tracking/neg-25`, `neg-125`, `neg-250`; `ratio` removed.
- `pts/type-scale` (new): font sizes grow in step order within each zone, and neighbouring `display` steps are at least ×1.5 apart. Verified by setting `display/md` to 32px.
- `pts/line-height-grid` (new): every font-size step has a line height of the same name, size × line height is a multiple of 4px, and every `text/*` style takes the line height paired with its size. Verified with a 1.5 ratio on 14px text and a mismatched style.
- `pts/tier-aliases`: `line-height` joins `rawValues`.
- Docs: the page title and the Introduction numbers move from `text/display-*` to `text/heading-lg` (40px), since display styles are now hero sizes.

## Documented in

- `CLAUDE.md` — Token Rules (Primitives, Semantic, Tiers), Commands (`pts/*` rules)
- `CONTRIBUTING.md` — what the checks catch
- Storybook and the Figma specimen — Typography (font size, line height, letter spacing leads), Scales (Ratio removed)
- `docs/adr/0004-typography-tokens.md`, `0011`, `0023` — amended by this ADR
