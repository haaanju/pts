// pts/type-scale: each font-size zone grows in step order, and neighbouring steps in the contrast zones are at least
// minRatio apart, so stacked levels never differ by an ambiguous amount (ADR 0028). Levels that pair at the same
// size are told apart by weight or color instead.
// Why not built-in: no built-in rule compares one token's value with another's.
import type { LintRule } from "@terrazzo/parser";

type Options = {
  /** step names in ascending order */
  order: string[];
  /** zones (font-size.<zone>.*) whose neighbouring steps must be at least minRatio apart */
  contrastZones: string[];
  minRatio: number;
};
type Dimension = { value: number; unit: string };

const rule: LintRule<"UNKNOWN_STEP" | "NOT_ASCENDING" | "TOO_CLOSE", Options> = {
  meta: {
    docs: { description: "Font sizes grow in step order, and display steps are clearly apart." },
    messages: {
      UNKNOWN_STEP: "{{id}}: font-size steps are font-size.<zone>.<{{order}}>",
      NOT_ASCENDING: "{{a}} ({{sizeA}}px) is not smaller than {{b}} ({{sizeB}}px)",
      TOO_CLOSE: "{{a}} ({{sizeA}}px) → {{b}} ({{sizeB}}px) is ×{{ratio}}; display steps are at least ×{{min}} apart",
    },
  },
  defaultOptions: { order: ["xs", "sm", "md", "lg", "xl"], contrastZones: ["display"], minRatio: 1.5 },
  create({ tokens, options, report }) {
    const zones = new Map<string, { id: string; rank: number; size: number }[]>();
    for (const [id, token] of Object.entries(tokens)) {
      if (!id.startsWith("font-size.")) continue;
      const [, zone, step, ...rest] = id.split(".");
      const rank = options.order.indexOf(step);
      if (!zone || rank < 0 || rest.length) {
        report({ messageId: "UNKNOWN_STEP", data: { id, order: options.order.join(" | ") } });
        continue;
      }
      zones.set(zone, [...(zones.get(zone) ?? []), { id, rank, size: (token.$value as Dimension).value }]);
    }
    for (const [zone, steps] of zones) {
      steps.sort((x, y) => x.rank - y.rank);
      for (let i = 1; i < steps.length; i++) {
        const [a, b] = [steps[i - 1], steps[i]];
        const data = { a: a.id, b: b.id, sizeA: a.size, sizeB: b.size };
        if (b.size <= a.size) report({ messageId: "NOT_ASCENDING", data });
        else if (options.contrastZones.includes(zone) && b.size / a.size < options.minRatio)
          report({ messageId: "TOO_CLOSE", data: { ...data, ratio: (b.size / a.size).toFixed(2), min: options.minRatio } });
      }
    }
  },
};

export default rule;
