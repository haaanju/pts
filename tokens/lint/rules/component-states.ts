// pts/component-states: in the component tier, a property that changes with state names every state, rest included,
// and its states resolve to different values in every permutation (CLAUDE.md → Component tier, ADR 0032, 0040).
// Options name the states and the documented exceptions: Ghost's fill is transparent at rest, and no transparent
// token exists to alias (ADR 0032), so button/ghost/surface has no rest.
// Why not built-in: Terrazzo has no notion of states. pts/visible-steps checks the semantic ladders, but a component
// can point two states at the same step (hover = rest) and still pass every contrast check.
import type { LintRule } from "@terrazzo/parser";
import { files, loadResolver, permutations } from "../../source.ts";

type Options = {
  /** the state names, e.g. ["rest", "hover", "pressed"] */
  states: string[];
  /** properties transparent at rest, so without a rest token, e.g. ["button.ghost.surface"] */
  transparentRest: string[];
};

const rule: LintRule<"MISSING_STATE" | "SAME_STATE", Options> = {
  meta: {
    docs: { description: "A property that changes with state names every state, and its states differ." },
    messages: {
      MISSING_STATE: "{{file}}: {{property}} changes with state but has no {{state}}; name every state ({{states}})",
      SAME_STATE: "{{label}}: {{a}} and {{b}} resolve to the same value, so the state change is invisible",
    },
  },
  defaultOptions: { states: ["rest", "hover", "pressed"], transparentRest: [] },
  async create({ report, options }) {
    const resolver = await loadResolver();
    // property → the state tokens it has, from the component files
    const properties = new Map<string, { file: string; ids: string[] }>();
    for (const { path: file, tier, tokens } of files(resolver)) {
      if (tier !== "component") continue;
      for (const id of Object.keys(tokens)) {
        const state = id.slice(id.lastIndexOf(".") + 1);
        if (!options.states.includes(state)) continue;
        const property = id.slice(0, id.lastIndexOf("."));
        if (!properties.has(property)) properties.set(property, { file, ids: [] });
        properties.get(property)!.ids.push(id);
      }
    }
    for (const [property, { file, ids }] of properties) {
      for (const state of options.states) {
        if (state === "rest" && options.transparentRest.includes(property)) continue;
        if (!ids.includes(`${property}.${state}`))
          report({ messageId: "MISSING_STATE", data: { file, property, state, states: options.states.join(", ") } });
      }
    }
    const seen = new Set<string>();
    for (const { label, tokens } of permutations(resolver)) {
      if (!tokens) continue; // reported by pts/theme-parity
      for (const { ids } of properties.values()) {
        ids.forEach((a, i) => {
          for (const b of ids.slice(i + 1)) {
            if (!tokens[a] || !tokens[b] || JSON.stringify(tokens[a].$value) !== JSON.stringify(tokens[b].$value) || seen.has(`${a} ${b}`)) continue;
            seen.add(`${a} ${b}`);
            report({ messageId: "SAME_STATE", data: { label, a, b } });
          }
        });
      }
    }
  },
};

export default rule;
