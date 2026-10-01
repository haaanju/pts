// pts/density-order: a density token is never larger in the tighter mode than in the looser one, in every theme
// (ADR 0025): compact steps down from relaxed, it never steps up.
// Why not built-in: Terrazzo lints one permutation at a time and no built-in rule compares a token's value
// across modifier contexts. Options name the modifier and its two contexts, so they are visible in the config.
import type { LintRule } from "@terrazzo/parser";
import { modifierTokens, themes } from "../source.ts";

type Options = {
  /** the resolver modifier, e.g. "density" */
  modifier: string;
  /** the context that must not be larger, e.g. "compact" */
  tighter: string;
  /** the context it is compared with, e.g. "relaxed" */
  looser: string;
};

const px = (value: unknown) => {
  const v = value as { value?: number; unit?: string } | undefined;
  return v && typeof v.value === "number" && v.unit === "px" ? v.value : undefined;
};

const rule: LintRule<"LARGER" | "NOT_PX", Options> = {
  meta: {
    docs: { description: "Density tokens are no larger in the tighter mode than in the looser one." },
    messages: {
      LARGER: "{{label}}: {{id}} is {{tight}}px in {{tighter}} but {{loose}}px in {{looser}}; {{tighter}} must not be larger",
      NOT_PX: "{{id}} is not a px dimension, so its density modes can't be compared",
    },
  },
  defaultOptions: { modifier: "density", tighter: "compact", looser: "relaxed" },
  async create({ report, options }) {
    const { modifier, tighter, looser } = options;
    const ids = modifierTokens(modifier);
    const all = (await themes()).filter((t) => t.tokens);
    // pair each tighter permutation with the looser one that has the same other inputs (same theme)
    for (const tight of all.filter((t) => t.input[modifier] === tighter)) {
      const others = (t: (typeof all)[number]) => Object.entries(t.input).filter(([k]) => k !== modifier).map(([k, v]) => `${k}=${v}`).join(", ");
      const loose = all.find((t) => t.input[modifier] === looser && others(t) === others(tight));
      if (!loose) continue;
      for (const id of ids) {
        const [a, b] = [px(tight.tokens![id]?.$value), px(loose.tokens![id]?.$value)];
        if (a === undefined || b === undefined) {
          if (tight.tokens![id] && loose.tokens![id]) report({ messageId: "NOT_PX", data: { id } });
          continue;
        }
        if (a > b) report({ messageId: "LARGER", data: { label: others(tight) || "default", id, tight: a, loose: b, tighter, looser } });
      }
    }
  },
};

export default rule;
