// pts/contrast: every color pair meets WCAG contrast (4.5:1 text, 3:1 UI) in every theme.
// Why not built-in: a11y/min-contrast checks the default theme only and needs every pair listed by hand.
// Here the pairs come from the token names (pairs.ts, ADR 0019), shared with the Storybook contrast badges.
// The ratio is computed the way a11y/min-contrast does it: tokenToColor + contrastWCAG21.
// Pairs exist only for names that follow the color grammar (CLAUDE.md → Color), so a semantic color in no pair that
// isn't exempt (UNCHECKED) is never checked at all: status/error/content/base would ship unchecked.
import type { ColorTokenNormalized, LintRule } from "@terrazzo/parser";
import { tokenToColor } from "@terrazzo/token-tools";
import { contrastWCAG21 } from "colorjs.io/fn";
import { contrastPairs, isExempt } from "../pairs.ts";
import { files, loadResolver, permutations } from "../../source.ts";

const NO_BACKGROUND = " (no background)";

const rule: LintRule<"INSUFFICIENT" | "MISSING" | "UNKNOWN_CONTENT" | "TRANSLUCENT" | "UNCHECKED"> = {
  meta: {
    docs: { description: "Color pairs derived from the names meet WCAG contrast in every theme." },
    messages: {
      INSUFFICIENT: "{{theme}}: {{fg}} on {{bg}} = {{ratio}} (needs {{min}})",
      MISSING: "{{theme}}: {{fg}} is checked against {{bg}}, which does not exist",
      UNKNOWN_CONTENT: "{{fg}} is not a level (base, subtle) or inverse, so there is no background to check it against",
      TRANSLUCENT: "{{theme}}: {{id}} is translucent (alpha {{alpha}}) and cannot be contrast-checked",
      UNCHECKED: "{{id}} is in no contrast pair and not exempt, so nothing checks it; name it by the color grammar (CLAUDE.md → Color)",
    },
  },
  defaultOptions: {},
  async create({ report }) {
    const resolver = await loadResolver();
    const semanticColors = [
      ...new Set(files(resolver).flatMap((f) => (f.tier === "semantic" ? Object.keys(f.tokens).filter((id) => f.tokens[id].$type === "color") : []))),
    ];
    const paired = new Set(contrastPairs(semanticColors).flatMap(([fg, bg]) => [fg, bg]));
    for (const id of semanticColors) if (!paired.has(id) && !isExempt(id)) report({ messageId: "UNCHECKED", data: { id } });

    const unknown = new Set<string>();
    for (const { label: theme, tokens } of permutations(resolver)) {
      if (!tokens) continue; // reported by pts/theme-parity
      for (const [fg, bg, min] of contrastPairs(Object.keys(tokens))) {
        if (bg.endsWith(NO_BACKGROUND)) {
          if (!unknown.has(fg)) report({ messageId: "UNKNOWN_CONTENT", data: { fg } });
          unknown.add(fg);
          continue;
        }
        const [a, b] = [tokens[fg], tokens[bg]] as (ColorTokenNormalized | undefined)[];
        if (!a || !b) {
          report({ messageId: "MISSING", data: { theme, fg, bg } });
          continue;
        }
        const translucent = [a, b].find((t) => (t.$value.alpha ?? 1) < 1);
        if (translucent) {
          report({ messageId: "TRANSLUCENT", data: { theme, id: translucent.id, alpha: translucent.$value.alpha } });
          continue;
        }
        const ratio = contrastWCAG21(tokenToColor(a.$value), tokenToColor(b.$value));
        if (ratio < min) report({ messageId: "INSUFFICIENT", data: { theme, fg, bg, ratio: ratio.toFixed(2), min } });
      }
    }
  },
};

export default rule;
