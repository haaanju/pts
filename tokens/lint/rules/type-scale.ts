// pts/type-scale: each font-size zone grows in step order, and neighbouring steps in the contrast zones are at least
// minRatio apart, so stacked levels never differ by an ambiguous amount (ADR 0028). Levels that pair at the same
// size are told apart by weight or color instead. A step may equal its neighbour in one permutation if another sets
// them apart (narrow screens collapse two display steps, ADR 0029); equal in every permutation, it is a duplicate.
// Why not built-in: no built-in rule compares one token's value with another's, and Terrazzo lints one permutation
// only.
import type { LintRule } from "@terrazzo/parser";
import { themes } from "../source.ts";

type Options = {
  /** step names in ascending order */
  order: string[];
  /** zones (font-size.<zone>.*) whose neighbouring steps must be at least minRatio apart */
  contrastZones: string[];
  minRatio: number;
};
type Dimension = { value: number; unit: string };

const rule: LintRule<"UNKNOWN_STEP" | "NOT_ASCENDING" | "TOO_CLOSE" | "DUPLICATE", Options> = {
  meta: {
    docs: { description: "Font sizes grow in step order, and display steps are clearly apart." },
    messages: {
      UNKNOWN_STEP: "{{id}}: font-size steps are font-size.<zone>.<{{order}}>",
      NOT_ASCENDING: "{{label}}: {{a}} ({{sizeA}}px) is larger than {{b}} ({{sizeB}}px)",
      TOO_CLOSE: "{{label}}: {{a}} ({{sizeA}}px) → {{b}} ({{sizeB}}px) is ×{{ratio}}; display steps are at least ×{{min}} apart",
      DUPLICATE: "{{a}} and {{b}} are {{size}}px in every permutation; a step must differ from its neighbour somewhere",
    },
  },
  defaultOptions: { order: ["xs", "sm", "md", "lg", "xl"], contrastZones: ["display"], minRatio: 1.5 },
  async create({ options, report }) {
    // the same problem shows up in every permutation that shares the values: report it once
    const seen = new Set<string>();
    const once = (key: string, send: () => void) => {
      if (!seen.has(key)) {
        seen.add(key);
        send();
      }
    };
    const equal = new Map<string, { a: string; b: string; size: number }>();
    const apart = new Set<string>();

    for (const { label, tokens } of await themes()) {
      if (!tokens) continue; // reported by pts/theme-parity
      const zones = new Map<string, { id: string; rank: number; size: number }[]>();
      for (const [id, token] of Object.entries(tokens)) {
        if (!id.startsWith("font-size.")) continue;
        const [, zone, step, ...rest] = id.split(".");
        const rank = options.order.indexOf(step);
        if (!zone || rank < 0 || rest.length) {
          once(`unknown ${id}`, () => report({ messageId: "UNKNOWN_STEP", data: { id, order: options.order.join(" | ") } }));
          continue;
        }
        zones.set(zone, [...(zones.get(zone) ?? []), { id, rank, size: (token.$value as Dimension).value }]);
      }
      for (const [zone, steps] of zones) {
        steps.sort((x, y) => x.rank - y.rank);
        for (let i = 1; i < steps.length; i++) {
          const [a, b] = [steps[i - 1], steps[i]];
          const pair = `${a.id} ${b.id}`;
          const data = { label, a: a.id, b: b.id, sizeA: a.size, sizeB: b.size };
          if (b.size < a.size) once(`${pair} ${a.size} ${b.size}`, () => report({ messageId: "NOT_ASCENDING", data }));
          else if (b.size === a.size) equal.set(pair, { a: a.id, b: b.id, size: a.size });
          else {
            apart.add(pair);
            if (options.contrastZones.includes(zone) && b.size / a.size < options.minRatio)
              once(`${pair} ${a.size} ${b.size}`, () =>
                report({ messageId: "TOO_CLOSE", data: { ...data, ratio: (b.size / a.size).toFixed(2), min: options.minRatio } }),
              );
          }
        }
      }
    }
    for (const [pair, data] of equal) if (!apart.has(pair)) report({ messageId: "DUPLICATE", data });
  },
};

export default rule;
