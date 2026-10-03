// pts/component-pairs: in every component group with a `content` token and `surface` tokens (button/primary, …; a
// content/<state> pairs with that state's surface),
// the content's semantic token is one pts/contrast checks against each surface's semantic token (ADR 0032).
// Why not built-in: pts/contrast checks semantic pairs by value, derived from the semantic names (pairs.ts). A component
// token adds a pairing of its own: button/primary/content and button/primary/surface/* are drawn together, which no
// semantic name says. This rule makes sure that pairing is one of the checked ones, so the values need no second check.
// Exempt content (disabled/*) is skipped, as pts/contrast skips it.
import type { LintRule } from "@terrazzo/parser";
import { isAlias, parseAlias } from "@terrazzo/token-tools";
import { contrastPairs, isExempt } from "../pairs.ts";
import { files, loadResolver } from "../../source.ts";

const rule: LintRule<"UNPAIRED" | "NOT_ALIAS"> = {
  meta: {
    docs: { description: "A component's content and surfaces alias semantic pairs that pts/contrast checks." },
    messages: {
      UNPAIRED:
        "{{file}}: {{content}} → {{contentRef}} is not checked against {{surface}} → {{surfaceRef}}; alias a pair pts/contrast checks (tokens/lint/pairs.ts)",
      NOT_ALIAS: "{{file}}: {{id}} is not a single alias, so its pairing can't be checked",
    },
  },
  defaultOptions: {},
  async create({ report }) {
    const all = files(await loadResolver());
    const semanticIds = all.filter((f) => f.tier === "semantic").flatMap((f) => Object.keys(f.tokens));
    const checked = new Set(contrastPairs([...new Set(semanticIds)]).map(([fg, bg]) => `${fg} on ${bg}`));

    for (const { path: file, tier, tokens } of all) {
      if (tier !== "component") continue;
      const target = (id: string) => {
        const value = tokens[id].$value;
        const ref = typeof value === "string" && isAlias(value) ? parseAlias(value) : undefined;
        if (!ref) report({ messageId: "NOT_ALIAS", data: { file, id } });
        return ref;
      };
      // content, or content/<state> when the content changes with state too; a state's content pairs with that state's fill
      for (const content of Object.keys(tokens).filter((id) => /\.content(\.[^.]+)?$/.test(id))) {
        const [group, state] = content.split(/\.content\.?/);
        const all = Object.keys(tokens).filter((id) => id === `${group}.surface` || id.startsWith(`${group}.surface.`));
        const surfaces = state && all.includes(`${group}.surface.${state}`) ? [`${group}.surface.${state}`] : all;
        const contentRef = target(content);
        if (!contentRef || isExempt(contentRef)) continue;
        for (const surface of surfaces) {
          const surfaceRef = target(surface);
          if (surfaceRef && !checked.has(`${contentRef} on ${surfaceRef}`)) {
            report({ messageId: "UNPAIRED", data: { file, content, contentRef: `{${contentRef}}`, surface, surfaceRef: `{${surfaceRef}}` } });
          }
        }
      }
    }
  },
};

export default rule;
