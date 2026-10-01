# 0026. Spacing Roles on One Scale

- Status: accepted (amended by 0027)
- Date: 2026-10-01

## What we learned

Spacing had two groups with two naming rules: `space/N` (N ÷ 25 = px, 0–32px) for component-level spacing, and `layout/N` (ordinal steps, 40–64px) for gaps between page regions (ADR 0001, 0002). Every token said how big it was; where to use it lived only in the descriptions. Three things followed:

- **Designers picked sizes, not roles.** `space/400` was "default padding inside components" and "the gap between related elements" at once, so the description had to carry the role.
- **The scale had a hole.** It ran 24, 32 with no 28, while 4px steps held everywhere else up to 32.
- **Density needs a stable scale.** The planned density modes (ADR 0025) make spacing one step tighter in `compact`. Changing `space/400` to 12px there would break its name, which says 16px.

Figma's auto layout and CSS both speak of padding and gap, so those words need no learning.

## Why it matters

- **One scale, `space/*`**, N ÷ 25 = px, the same value in every mode: 0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64px (`space/0` … `space/800`, `space/1000`, `space/1200`, `space/1600`). `space/700` (28px) and the primitive `dimension/28` are new; `layout/*` folds into `space/1000`, `1200`, `1600`.
- **Role tokens on top**, named by what they space, in t-shirt sizes:
  - `padding/xs, sm, md, lg, xl` → `space/100, 200, 300, 400, 600`: inside an element
  - `gap/xs, sm, md, lg, xl` → the same steps: between elements
  - `gap/section/sm, md, lg` → `space/1000, 1200, 1600`: between page regions, the role `layout/*` had
- **Role tokens alias the scale**, not `dimension`, so values come from one place. This is a tier exception like `text/*`: `pts/tier-aliases` takes `semanticAliases: ["text", "padding", "gap"]`.
- **Pick a role first.** `space/*` stays available for cases no role fits; its descriptions say so.
- **Density changes roles, not the scale.** `compact` points `padding/*` and `gap/*` (not `gap/section/*`) at smaller `space` steps, so `space/400` is 16px everywhere. In CSS, a role token in a density block then aliases a `space` variable that never changes, so nothing resolves early at `:root`. ADR 0025 is amended accordingly.
- Inset/stack/inline names (Salesforce, Braid) and component-scoped names (`space/card/padding`) were considered. The first adds vocabulary that neither CSS nor Figma uses; the second belongs to the component tier (ADR 0018).

### Breaking

`layout/*` is removed, so the release is `0.7.0` (ADR 0014). Replace `layout/100`, `200`, `300` with `gap/section/sm`, `md`, `lg` (or `space/1000`, `1200`, `1600` where no role fits).

## Implementation notes

- The docs styles moved from `--layout-*` to `--gap-section-*`; the README and Introduction examples use `--padding-lg`.
- The Spacing docs page shows Padding, Gap, and the Space scale, in that order.
- Without `padding` and `gap` in `semanticAliases`, `npm run check` reports all 13 role tokens.

## Documented in

- `CLAUDE.md` — Token Rules (Tiers, Semantic), Figma names
- `tokens/terrazzo.config.ts` — `pts/tier-aliases` options
