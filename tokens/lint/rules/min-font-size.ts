// pts/min-font-size: every font-size step is at least the text minimum, in every permutation, so the scale offers no
// size too small to read.
// Why not built-in: a11y/min-font-size checks typography composites only, not the dimension tokens they alias, and
// Terrazzo lints the default permutation only (the viewport changes font sizes, ADR 0029).
import type { LintRule } from "@terrazzo/parser";
import { loadResolver, permutations } from "../../source.ts";

type Options = { minSizePx: number };
type Dimension = { value: number; unit: string };

const rule: LintRule<"TOO_SMALL", Options> = {
  meta: {
    docs: { description: "Every font-size step is at least the minimum size for text." },
    messages: { TOO_SMALL: "{{label}}: {{id}} is {{size}}, below the {{min}}px minimum for text" },
  },
  defaultOptions: { minSizePx: 12 },
  async create({ options, report }) {
    const seen = new Set<string>();
    for (const { label, tokens } of permutations(await loadResolver())) {
      if (!tokens) continue; // reported by pts/theme-parity
      for (const [id, token] of Object.entries(tokens)) {
        if (!id.startsWith("font-size.") || token.$type !== "dimension") continue;
        const { value, unit } = token.$value as Dimension;
        const size = `${value}${unit}`;
        // the same value in several permutations is one problem
        if (unit !== "px" || value >= options.minSizePx || seen.has(`${id} ${size}`)) continue;
        seen.add(`${id} ${size}`);
        report({ messageId: "TOO_SMALL", data: { label, id, size, min: options.minSizePx } });
      }
    }
  },
};

export default rule;
