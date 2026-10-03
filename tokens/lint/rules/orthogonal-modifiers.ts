// pts/orthogonal-modifiers: each modifier (theme, density, viewport) defines only the tokens its scope allows, and no
// token is defined by two modifiers (ADR 0038, 0040).
// tokens.css repeats each modifier's tokens in that modifier's own selectors, and those nest in any order
// ([data-theme] inside [data-density] or the other way round). A token two modifiers define would take the value of
// whichever selector is nearer in the page, not the one the resolver's order gives, so the CSS and the docs (which
// take the resolver's) would disagree. Terrazzo's resolver reports this as `orthogonal: false`; this rule names the
// tokens, from what Terrazzo says each modifier defines. The scope (CLAUDE.md → Modifiers) keeps a modifier from
// growing past its role: a size in the theme files, a text size in the density files.
// Why not built-in: no built-in rule looks at the resolver's modifiers.
import type { LintRule } from "@terrazzo/parser";
import { loadResolver, modifierTokens } from "../../source.ts";

type Options = {
  /** what each modifier may define: tokens of these $types, or under these groups (dot paths) */
  scope: Record<string, { types?: string[]; groups?: string[] }>;
};

const rule: LintRule<"OVERLAP" | "OUT_OF_SCOPE", Options> = {
  meta: {
    docs: { description: "Each modifier defines only its scope, and no token is defined by two modifiers." },
    messages: {
      OVERLAP: "{{id}} is defined by both the {{a}} and the {{b}} modifier; a token belongs to one modifier",
      OUT_OF_SCOPE: "{{id}} is defined by the {{modifier}} modifier, which only changes {{scope}}",
    },
  },
  defaultOptions: { scope: {} },
  async create({ report, options }) {
    const resolver = await loadResolver();
    const tokens = resolver.apply({});
    const modifiers = Object.keys(resolver.source.modifiers ?? {}).map((name) => ({ name, ids: modifierTokens(resolver, name) }));
    modifiers.forEach((a, i) => {
      for (const b of modifiers.slice(i + 1)) {
        for (const id of b.ids.filter((id) => a.ids.includes(id))) report({ messageId: "OVERLAP", data: { id, a: a.name, b: b.name } });
      }
    });
    for (const { name, ids } of modifiers) {
      const { types = [], groups = [] } = options.scope[name] ?? {};
      const scope = [...types.map((t) => `${t} tokens`), ...groups.map((g) => `${g.replaceAll(".", "/")}/*`)].join(", ") || "nothing";
      for (const id of ids) {
        const inScope = types.includes(tokens[id]?.$type) || groups.some((g) => id.startsWith(`${g}.`));
        if (!inScope) report({ messageId: "OUT_OF_SCOPE", data: { id, modifier: name, scope } });
      }
    }
  },
};

export default rule;
