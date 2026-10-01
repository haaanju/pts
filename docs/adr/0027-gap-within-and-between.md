# 0027. Gaps Within and Between Groups

- Status: accepted
- Date: 2026-10-01

## What we learned

ADR 0026 named the component-level gaps by size, `gap/xs` … `gap/xl` (4, 8, 12, 16, 24px). The size names hid the distinction that matters when laying out a component: whether a gap holds items together or sets groups apart. With a 16px base, the intended system is:

- 0.25, 0.5, 0.75, 1 × 16 (4, 8, 12, 16px) to space the items of one group
- 1.25, 1.5, 2 × 16 (20, 24, 32px) to separate groups

`gap/lg` (16) and `gap/xl` (24) sat next to each other with nothing marking that the second one crosses into separation, and 20 and 32px had no gap token at all. The `space` scale already had every value: `space/N` ÷ 400 is the multiple of 16px (`space/500` = 1.25).

## Why it matters

- **`gap/*` splits by what the gap does**:
  - `gap/within/xs, sm, md, lg` → `space/100, 200, 300, 400` (4–16px): spaces the items of one group
  - `gap/between/sm, md, lg` → `space/500, 600, 800` (20, 24, 32px): separates groups
  - `gap/section/sm, md, lg` → unchanged (40, 48, 64px): separates page regions
- **Every `within` gap is smaller than every `between` gap**, so proximity alone shows the grouping (the Gestalt law of proximity a layout relies on).
- **`padding/*` is unchanged.** Padding sits inside an element, so holding together and setting apart don't apply.
- Keeping the size names and adding `gap/2xl`, `3xl` was considered; it fills the values but leaves the boundary between grouping and separation to the docs.

### Breaking

`gap/xs, sm, md, lg, xl` are renamed, so the release is a MINOR bump (ADR 0014):

| Before | After |
|---|---|
| `gap/xs, sm, md, lg` | `gap/within/xs, sm, md, lg` (same values) |
| `gap/xl` (24px) | `gap/between/md` (same value) |
| — | `gap/between/sm` (20px), `gap/between/lg` (32px), new |

## Implementation notes

- Density (ADR 0025) changes `gap/within/*` and `gap/between/*`, not `gap/section/*`.
- `pts/tier-aliases` needs no change: `semanticAliases: ["gap"]` covers the nested groups.

## Documented in

- `CLAUDE.md` — Token Rules (Semantic)
- Storybook and the Figma specimen — Spacing, Gap section lead
