# 0033. Button md Label and Icon

- Status: accepted
- Date: 2026-10-03

## What we learned

ADR 0032 gave the default `md` button the 14px `text/label-md` and the 16px `size/icon/sm`, the same as `sm`, and kept the 16px `text/label-lg` and 24px `size/icon/md` for `lg`. The 14px label came from ADR 0028, which assumed "a 14/20 label in the 48px control"; ADR 0032 kept it without comparing sizes.

Seen in Figma, the md label reads small:

- **It is smaller than the body text around it.** `text/md` (16px) is the body default, so the default button's label was one step below the text next to it.
- **It is small for the height.** 48px is a large button in other systems: Material 3 puts a 14px label in a 40px button, iOS a 17pt label in a 44–50pt one. 14 in 48 is 29% of the height; 16 is 33%.
- **A 16px icon next to 16px text reads small**, and `size/icon/*` has no step between 16 and 24.

## Why it matters

- **`button/md/label` aliases `text/label-lg` (16px) and `button/md/icon` aliases `size/icon/md` (24px).** `sm` keeps 14px and 16px.
- **md and lg now differ by height only** (48 / 56, compact 40 / 48): they already shared `padding/xl` and the gap. `lg` stays for prominent actions and touch-first layouts, and to match `size/control/lg` inputs and selects.
- **`text/label-md` is for small controls** (sm buttons, tabs, menu items) and `text/label-lg` for default and large ones; their descriptions say so.
- **A fix, not a breaking change** (ADR 0014): no token is renamed or removed, and each still means the same thing; the md button gets wider by about 2px per label character and 8px per icon.

## Implementation notes

- `component/button.tokens.json`: `button/md/label` → `{text.label-lg}`, `button/md/icon` → `{size.icon.md}`.
- `semantic/typography.tokens.json`: the descriptions of `text/label-md`, `text/label-lg`, `font-size/text/sm`, and `font-size/text/md`.
- `<pts-button>` reads `var(--button-md-*)`, so the code needs no change; the loading spinner of an md button grows to 24px with the icon.
- Figma: `button/md/icon` aliases `Size/size/icon/md`, the md variants of `Button` use the `text/label-lg` style, and the md spinners are re-centered (an absolute layer keeps its position when its size variable changes); the Medium table on the Button page and the descriptions match.

## Documented in

- `docs/adr/0032-button.md` — Sizes (amended)
- `tokens/src/component/button.tokens.json`, `tokens/src/semantic/typography.tokens.json` — descriptions
