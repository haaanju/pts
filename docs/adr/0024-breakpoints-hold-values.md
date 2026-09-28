# 0024. Breakpoints Hold Their Values

- Status: accepted
- Date: 2026-09-28

## What we learned

`breakpoint/sm, md, lg, xl` aliased `dimension/640`, `768`, `1024`, and `1280`, following the tier rule that semantic tokens reference primitives. Nothing else used those four primitives. They sat in the dimension scale next to the component sizes (0–64 and `max`), where:

- they offered 640px and up as ordinary dimensions, although a viewport width means nothing outside a breakpoint;
- the Scales specimen in Figma drew their bars past the sample column, so the rows showed no bar at all.

The tier rule already has an exception for this case: `z-index` holds its values directly because stacking order has no meaning outside its role (ADR 0008).

## Why it matters

- **`breakpoint/*` holds its values directly**, `{ "value": 640, "unit": "px" }`, for the same reason as `z-index`: a viewport width has no meaning outside its role. The names and values don't change.
- **`dimension/640`, `768`, `1024`, and `1280` are removed.** The dimension scale is the component scale again: 0–64 plus `max`.
- **The exception is a rule option**, so it stays visible in one place: `pts/tier-aliases` takes `rawValues: ["z-index", "breakpoint"]` (ADR 0021).
- A separate primitive group for viewport widths (`viewport/640`) was considered. It would keep the tier rule without exceptions, but adds a tier step that nothing else uses.

### Breaking

Removing four primitives removes their CSS variables (`--dimension-640` and so on), so the next release is `0.6.0` (ADR 0014). Primitives are not for product code, so the practical impact should be none.

## Implementation notes

- `semantic/breakpoint.tokens.json` holds px objects; `primitive/dimension.tokens.json` loses the four steps.
- Figma: the four variables are deleted from `Primitive`, `Layout/breakpoint/*` holds the values, and the Scales specimen loses the four rows.
- The Storybook Scales lead no longer lists breakpoint among the dimension users; the Layout page is unchanged.

## Documented in

- `CLAUDE.md` — Token Rules (Tiers, Semantic)
- `tokens/terrazzo.config.ts` — `pts/tier-aliases` options
