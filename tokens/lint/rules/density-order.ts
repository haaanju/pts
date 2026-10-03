// pts/density-order: a density token is never larger in the tighter mode than in the looser one, in every theme
// (ADR 0025): compact steps down from relaxed, it never steps up. Where both alias a scale (space/*, dimension/*), the
// tighter one aliases exactly the next smaller step of that scale (NOT_ONE_STEP): not the same step, not two below.
// Why not built-in: Terrazzo lints one permutation at a time and no built-in rule compares a token's value
// across modifier contexts. Options name the modifier and its two contexts, so they are visible in the config.
import type { LintRule } from "@terrazzo/parser";
import { loadResolver, modifierTokens, permutations } from "../../source.ts";

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

// The scale an alias points into: the px tokens of the target's top-level group, smallest first
const scaleOf = (tokens: Record<string, { $value: unknown }>, ref: string) => {
  const group = ref.split(".")[0];
  return Object.keys(tokens)
    .filter((id) => id.startsWith(`${group}.`) && px(tokens[id].$value) !== undefined)
    .sort((x, y) => px(tokens[x].$value)! - px(tokens[y].$value)!);
};

const rule: LintRule<"LARGER" | "NOT_ONE_STEP" | "NOT_PX", Options> = {
  meta: {
    docs: { description: "Density tokens are no larger in the tighter mode than in the looser one." },
    messages: {
      LARGER: "{{label}}: {{id}} is {{tight}}px in {{tighter}} but {{loose}}px in {{looser}}; {{tighter}} must not be larger",
      NOT_ONE_STEP:
        "{{id}} is {{tightRef}} in {{tighter}}, but the step below {{looseRef}} ({{looser}}) is {{below}}; {{tighter}} takes the next smaller step",
      NOT_PX: "{{id}} is not a px dimension, so its density modes can't be compared",
    },
  },
  defaultOptions: { modifier: "density", tighter: "compact", looser: "relaxed" },
  async create({ report, options }) {
    const { modifier, tighter, looser } = options;
    const resolver = await loadResolver();
    const ids = modifierTokens(resolver, modifier);
    const all = permutations(resolver).filter((t) => t.tokens);
    const stepped = new Set<string>(); // report a step once, not per theme and viewport
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
        const [tightRef, looseRef] = [tight.tokens![id].aliasChain?.[0], loose.tokens![id].aliasChain?.[0]];
        if (!tightRef || !looseRef || stepped.has(id)) continue;
        const scale = scaleOf(loose.tokens!, looseRef);
        const below = scale[scale.indexOf(looseRef) - 1];
        if (tightRef !== below) {
          stepped.add(id);
          report({ messageId: "NOT_ONE_STEP", data: { id, tightRef, looseRef, below: below ?? "nothing", tighter, looser } });
        }
      }
    }
  },
};

export default rule;
