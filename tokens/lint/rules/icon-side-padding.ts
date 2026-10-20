// pts/icon-side-padding: a component that pads its icon side less (`padding.icon-side` next to `padding.base`, ADR
// 0032) keeps icon-side <= base, and its `gap` at least base - icon-side, in every permutation. The component and the
// Figma set are built the same way (ADR 0055): the sides pad icon-side, the label adds base - icon-side on both sides,
// and the gap between an icon and the label gives that back, so it is gap - (base - icon-side). A negative result is
// invalid CSS that the browser drops without a warning, and a negative Figma spacing.
// Why not built-in: no built-in rule compares tokens with each other, and the relation matters only to this structure.
import type { LintRule } from "@terrazzo/parser";
import { loadResolver, permutations } from "../../source.ts";
import { px } from "../shared.ts";

const rule: LintRule<"SIDE_LARGER" | "GAP_SMALLER"> = {
  meta: {
    docs: { description: "A component's icon side pads no more than its base side, and its gap covers the difference." },
    messages: {
      SIDE_LARGER: "{{label}}: {{prefix}}.padding.icon-side ({{side}}px) is larger than {{prefix}}.padding.base ({{base}}px)",
      GAP_SMALLER:
        "{{label}}: {{prefix}}.gap ({{gap}}px) is smaller than padding.base - padding.icon-side ({{inset}}px), so the gap next to an icon would be negative",
    },
  },
  defaultOptions: {},
  async create({ report }) {
    const resolver = await loadResolver();
    const reported = new Set<string>(); // once per message and component size, not per permutation
    for (const perm of permutations(resolver)) {
      if (!perm.tokens) continue;
      const { label } = perm;
      for (const id of Object.keys(perm.tokens).filter((id) => id.endsWith(".padding.icon-side"))) {
        const prefix = id.slice(0, -".padding.icon-side".length);
        const [side, base, gap] = [id, `${prefix}.padding.base`, `${prefix}.gap`].map((t) => px(perm.tokens![t]?.$value));
        if (side === undefined || base === undefined || gap === undefined) continue;
        if (side > base && !reported.has(`side ${prefix}`)) {
          reported.add(`side ${prefix}`);
          report({ messageId: "SIDE_LARGER", data: { label, prefix, side, base } });
        }
        if (gap < base - side && !reported.has(`gap ${prefix}`)) {
          reported.add(`gap ${prefix}`);
          report({ messageId: "GAP_SMALLER", data: { label, prefix, gap, inset: base - side } });
        }
      }
    }
  },
};

export default rule;
