// pts/theme-parity: every theme resolves, and all themes define the same token names with the same $description. Groups
// named in `constant` (always/*: icons and text on images) also keep the same value in every theme.
// Why not built-in: Terrazzo lints the default theme only, so a broken alias or a missing token in another theme
// passes `tz check`, and core/descriptions never sees another theme's descriptions.
import type { LintRule } from "@terrazzo/parser";
import { loadResolver, permutations } from "../../source.ts";

type Options = {
  /** top-level groups whose values are the same in every permutation, e.g. ["always"] */
  constant: string[];
};

const rule: LintRule<"UNRESOLVED" | "MISSING" | "DESCRIPTION" | "NOT_CONSTANT", Options> = {
  meta: {
    docs: { description: "Every theme resolves and defines the same tokens with the same descriptions." },
    messages: {
      UNRESOLVED: "{{theme}} does not resolve: {{error}}",
      MISSING: "{{id}} is in {{has}} but not in {{lacks}}",
      DESCRIPTION: "{{id}} has a different $description in {{a}} and {{b}}; a description names the role, not the value",
      NOT_CONSTANT: "{{id}} differs between {{a}} and {{b}}; {{group}}/* keeps the same value in every theme",
    },
  },
  defaultOptions: { constant: [] },
  async create({ report, options }) {
    const all = permutations(await loadResolver());
    for (const t of all) if (t.error) report({ messageId: "UNRESOLVED", data: { theme: t.label, error: t.error } });

    const [first, ...rest] = all.filter((t) => t.tokens);
    for (const other of rest) {
      for (const [a, b] of [[first, other], [other, first]]) {
        for (const id of Object.keys(a.tokens!)) if (!b.tokens![id]) report({ messageId: "MISSING", data: { id, has: a.label, lacks: b.label } });
      }
      for (const [id, token] of Object.entries(first.tokens!)) {
        const theirs = other.tokens![id];
        if (theirs && theirs.$description !== token.$description) report({ messageId: "DESCRIPTION", data: { id, a: first.label, b: other.label } });
        const group = id.split(".")[0];
        if (theirs && options.constant.includes(group) && JSON.stringify(theirs.$value) !== JSON.stringify(token.$value))
          report({ messageId: "NOT_CONSTANT", data: { id, a: first.label, b: other.label, group } });
      }
    }
  },
};

export default rule;
