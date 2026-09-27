// pts/theme-parity: every theme resolves, and all themes define the same token names with the same $description.
// Why not built-in: Terrazzo lints the default theme only, so a broken alias or a missing token in another theme
// passes `tz check`, and core/descriptions never sees another theme's descriptions.
import type { LintRule } from "@terrazzo/parser";
import { themes } from "../source.ts";

const rule: LintRule<"UNRESOLVED" | "MISSING" | "DESCRIPTION"> = {
  meta: {
    docs: { description: "Every theme resolves and defines the same tokens with the same descriptions." },
    messages: {
      UNRESOLVED: "{{theme}} does not resolve: {{error}}",
      MISSING: "{{id}} is in {{has}} but not in {{lacks}}",
      DESCRIPTION: "{{id}} has a different $description in {{a}} and {{b}}; a description names the role, not the value",
    },
  },
  defaultOptions: {},
  async create({ report }) {
    const all = await themes();
    for (const t of all) if (t.error) report({ messageId: "UNRESOLVED", data: { theme: t.label, error: t.error } });

    const [first, ...rest] = all.filter((t) => t.tokens);
    for (const other of rest) {
      for (const [a, b] of [[first, other], [other, first]]) {
        for (const id of Object.keys(a.tokens!)) if (!b.tokens![id]) report({ messageId: "MISSING", data: { id, has: a.label, lacks: b.label } });
      }
      for (const [id, token] of Object.entries(first.tokens!)) {
        const theirs = other.tokens![id];
        if (theirs && theirs.$description !== token.$description) report({ messageId: "DESCRIPTION", data: { id, a: first.label, b: other.label } });
      }
    }
  },
};

export default rule;
