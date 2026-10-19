// pts/ios-text-style: every semantic text style (text.*) names the iOS text style it follows, one Apple defines, in
// $extensions["io.github.haaanju.pts"].ios.textStyle (ADR 0063, 0066). @pts/ios takes its size from that style, so
// Dynamic Type scales it; a text style without one, or with a name iOS doesn't have, has no size on iOS. Component
// tokens (button.md.label) are left out: native components draw their own text on iOS (ADR 0063).
// Why not built-in: Terrazzo's rules check $value and names, not what a team keeps in $extensions.
import type { LintRule } from "@terrazzo/parser";

type Options = { prefix: string; key: string; styles: string[] };

const rule: LintRule<"MISSING" | "UNKNOWN", Options> = {
  meta: {
    docs: { description: "Every semantic text style names a valid iOS text style." },
    messages: {
      MISSING: "{{id}} names no iOS text style ($extensions.{{key}}.ios.textStyle)",
      UNKNOWN: "{{id}}: {{style}} is not an iOS text style ({{styles}})",
    },
  },
  defaultOptions: { prefix: "text.", key: "io.github.haaanju.pts", styles: [] },
  async create({ tokens, options, report }) {
    for (const [id, token] of Object.entries(tokens)) {
      if (token.$type !== "typography" || !id.startsWith(options.prefix)) continue;
      const ext = token.$extensions as Record<string, { ios?: { textStyle?: unknown } }> | undefined;
      const style = ext?.[options.key]?.ios?.textStyle;
      if (style === undefined) report({ messageId: "MISSING", data: { id, key: options.key } });
      else if (!options.styles.includes(String(style)))
        report({ messageId: "UNKNOWN", data: { id, style: String(style), styles: options.styles.join(", ") } });
    }
  },
};

export default rule;
