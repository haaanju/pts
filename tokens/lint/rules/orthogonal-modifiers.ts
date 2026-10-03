// pts/orthogonal-modifiers: no token is defined by two modifiers (theme, density, viewport) (ADR 0038).
// tokens.css repeats each modifier's tokens in that modifier's own selectors, and those nest in any order
// ([data-theme] inside [data-density] or the other way round). A token two modifiers define would take the value of
// whichever selector is nearer in the page, not the one the resolver's order gives, so the CSS and the docs (which
// take the resolver's) would disagree. Terrazzo's resolver says whether its modifiers are orthogonal; this rule names
// the tokens.
// Why not built-in: no built-in rule looks at the resolver's modifiers.
import type { LintRule } from "@terrazzo/parser";
import { loadResolver, modifierTokens } from "../../source.ts";

const rule: LintRule<"OVERLAP" | "NOT_ORTHOGONAL"> = {
  meta: {
    docs: { description: "No token is defined by two modifiers." },
    messages: {
      OVERLAP: "{{id}} is defined by both the {{a}} and the {{b}} modifier; a token belongs to one modifier",
      NOT_ORTHOGONAL: "Terrazzo reports the resolver's modifiers as not orthogonal",
    },
  },
  defaultOptions: {},
  async create({ report }) {
    const resolver = await loadResolver();
    const modifiers = Object.keys(resolver.source.modifiers ?? {});
    let found = false;
    modifiers.forEach((a, i) => {
      const ids = new Set(modifierTokens(resolver, a));
      for (const b of modifiers.slice(i + 1)) {
        for (const id of modifierTokens(resolver, b).filter((id) => ids.has(id))) {
          found = true;
          report({ messageId: "OVERLAP", data: { id, a, b } });
        }
      }
    });
    if (!resolver.orthogonal && !found) report({ messageId: "NOT_ORTHOGONAL" });
  },
};

export default rule;
