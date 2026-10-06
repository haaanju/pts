// pts/visible-steps: the steps of every surface ladder, and hover/pressed against disabled, differ by at least
// ΔE 2 (OKLab, ×100) in every theme, so a step or a state change is actually visible (pairs.ts, ADR 0019, 0045).
// About 2 is the smallest difference most people notice; near white, where the light surfaces sit, even that is faint.
// Why not built-in: it runs per theme, and no built-in rule compares one token's value with another's.
import type { ColorTokenNormalized, LintRule } from "@terrazzo/parser";
import { tokenToColor } from "@terrazzo/token-tools";
import { deltaEOK } from "colorjs.io/fn";
import { distinctBackgrounds } from "../pairs.ts";
import { loadResolver, permutations } from "../../source.ts";

const MIN_DELTA_E = 2;

const rule: LintRule<"TOO_CLOSE"> = {
  meta: {
    docs: { description: "Surface steps and interaction states differ visibly in every theme." },
    messages: { TOO_CLOSE: "{{theme}}: {{a}} and {{b}} differ by ΔE {{de}} (needs {{min}}), so the step is barely visible" },
  },
  defaultOptions: {},
  async create({ report }) {
    for (const { label: theme, tokens } of permutations(await loadResolver())) {
      if (!tokens) continue; // reported by pts/theme-parity
      const color = (id: string) => tokenToColor((tokens[id] as ColorTokenNormalized).$value);
      for (const [a, b] of distinctBackgrounds(Object.keys(tokens))) {
        const de = deltaEOK(color(a), color(b)) * 100;
        if (de < MIN_DELTA_E) report({ messageId: "TOO_CLOSE", data: { theme, a, b, de: de.toFixed(1), min: MIN_DELTA_E } });
      }
    }
  },
};

export default rule;
