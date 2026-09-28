// pts/min-font-size: every font-size step is at least the text minimum, so the scale offers no size too small to read.
// Why not built-in: a11y/min-font-size checks typography composites only, not the dimension tokens they alias.
import type { LintRule } from "@terrazzo/parser";

type Options = { minSizePx: number };
type Dimension = { value: number; unit: string };

const rule: LintRule<"TOO_SMALL", Options> = {
  meta: {
    docs: { description: "Every font-size step is at least the minimum size for text." },
    messages: { TOO_SMALL: "{{id}} is {{size}}, below the {{min}}px minimum for text" },
  },
  defaultOptions: { minSizePx: 12 },
  create({ tokens, options, report }) {
    for (const [id, token] of Object.entries(tokens)) {
      if (!id.startsWith("font-size.") || token.$type !== "dimension") continue;
      const { value, unit } = token.$value as Dimension;
      if (unit === "px" && value < options.minSizePx) report({ messageId: "TOO_SMALL", data: { id, size: `${value}${unit}`, min: options.minSizePx } });
    }
  },
};

export default rule;
