// pts/gap-order: every gap in a family is smaller than every gap in the next family, in every permutation
// (ADR 0027): gaps within a group < gaps between groups < gaps between page regions, so proximity alone shows
// the grouping. Density changes the first two families, so the order has to hold in compact as well.
// Why not built-in: no built-in rule compares one group of tokens with another, and Terrazzo lints one
// permutation only.
import type { LintRule } from "@terrazzo/parser";
import { themes } from "../source.ts";

type Options = {
  /** token groups from the smallest family to the largest, e.g. ["gap.within", "gap.between", "gap.section"] */
  order: string[];
};

const px = (value: unknown) => {
  const v = value as { value?: number; unit?: string } | undefined;
  return v && typeof v.value === "number" && v.unit === "px" ? v.value : undefined;
};

const rule: LintRule<"OVERLAP", Options> = {
  meta: {
    docs: { description: "Each gap family is entirely smaller than the next." },
    messages: { OVERLAP: "{{label}}: {{big}} ({{bigPx}}px) is not smaller than {{small}} ({{smallPx}}px)" },
  },
  defaultOptions: { order: [] },
  async create({ report, options }) {
    for (const { label, tokens } of await themes()) {
      if (!tokens) continue; // reported by pts/theme-parity
      const family = (prefix: string) =>
        Object.keys(tokens)
          .filter((id) => id.startsWith(`${prefix}.`))
          .map((id) => ({ id, px: px(tokens[id].$value) }))
          .filter((t): t is { id: string; px: number } => t.px !== undefined);
      for (let i = 0; i + 1 < options.order.length; i++) {
        const lower = family(options.order[i]);
        const upper = family(options.order[i + 1]);
        if (!lower.length || !upper.length) continue;
        const biggest = lower.reduce((a, b) => (b.px > a.px ? b : a));
        const smallest = upper.reduce((a, b) => (b.px < a.px ? b : a));
        if (biggest.px >= smallest.px) report({ messageId: "OVERLAP", data: { label, big: biggest.id, bigPx: biggest.px, small: smallest.id, smallPx: smallest.px } });
      }
    }
  },
};

export default rule;
