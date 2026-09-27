// pts/visible-steps: the steps of every surface ladder, and hover/pressed against disabled, resolve to different
// colors in every theme, so a step or a state change is actually visible (pairs.ts, ADR 0019).
// Why not built-in: it runs per theme, and no built-in rule compares one token's value with another's.
import type { ColorTokenNormalized, LintRule } from "@terrazzo/parser";
import { distinctBackgrounds } from "../pairs.ts";
import { themes } from "../source.ts";

const key = (t: ColorTokenNormalized) => `${t.$value.colorSpace} ${t.$value.components.join(" ")} ${t.$value.alpha ?? 1}`;

const rule: LintRule<"SAME_COLOR"> = {
  meta: {
    docs: { description: "Surface steps and interaction states resolve to different colors in every theme." },
    messages: { SAME_COLOR: "{{theme}}: {{a}} and {{b}} are the same color, so the step is invisible" },
  },
  defaultOptions: {},
  async create({ report }) {
    for (const { label: theme, tokens } of await themes()) {
      if (!tokens) continue; // reported by pts/theme-parity
      for (const [a, b] of distinctBackgrounds(Object.keys(tokens))) {
        if (key(tokens[a] as ColorTokenNormalized) === key(tokens[b] as ColorTokenNormalized)) report({ messageId: "SAME_COLOR", data: { theme, a, b } });
      }
    }
  },
};

export default rule;
