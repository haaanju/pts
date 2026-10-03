// pts/orthogonal-modifiers: no token is defined by two modifiers (theme, density, viewport) (ADR 0038).
// tokens.css repeats each modifier's tokens in that modifier's own selectors, and those nest in any order
// ([data-theme] inside [data-density] or the other way round). A token two modifiers define would take the value of
// whichever selector is nearer in the page, not the one the resolver's order gives, so the CSS and the docs (which
// take the resolver's) would disagree. Terrazzo's resolver reports this as `orthogonal: false`; this rule names the
// tokens, from what Terrazzo says each modifier defines.
// Why not built-in: no built-in rule looks at the resolver's modifiers.
import type { LintRule } from "@terrazzo/parser";
import { loadResolver, modifierTokens } from "../../source.ts";

const rule: LintRule<"OVERLAP"> = {
  meta: {
    docs: { description: "No token is defined by two modifiers." },
    messages: { OVERLAP: "{{id}} is defined by both the {{a}} and the {{b}} modifier; a token belongs to one modifier" },
  },
  defaultOptions: {},
  async create({ report }) {
    const resolver = await loadResolver();
    const modifiers = Object.keys(resolver.source.modifiers ?? {}).map((name) => ({ name, ids: modifierTokens(resolver, name) }));
    modifiers.forEach((a, i) => {
      for (const b of modifiers.slice(i + 1)) {
        for (const id of b.ids.filter((id) => a.ids.includes(id))) report({ messageId: "OVERLAP", data: { id, a: a.name, b: b.name } });
      }
    });
  },
};

export default rule;
