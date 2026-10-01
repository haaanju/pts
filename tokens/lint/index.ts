// The pts lint plugin (ADR 0021): rules for what Terrazzo's built-in rules can't check. Each rule file says why.
// The rules are configured next to the built-in ones in tokens/terrazzo.config.ts.
import type { Plugin } from "@terrazzo/parser";
import colorHex from "./rules/color-hex.ts";
import contrast from "./rules/contrast.ts";
import lineHeightGrid from "./rules/line-height-grid.ts";
import minFontSize from "./rules/min-font-size.ts";
import registeredFiles from "./rules/registered-files.ts";
import themeParity from "./rules/theme-parity.ts";
import tierAliases from "./rules/tier-aliases.ts";
import typeScale from "./rules/type-scale.ts";
import visibleSteps from "./rules/visible-steps.ts";

export default function pts(): Plugin {
  return {
    name: "pts",
    lint: () => ({
      "pts/theme-parity": themeParity,
      "pts/contrast": contrast,
      "pts/visible-steps": visibleSteps,
      "pts/min-font-size": minFontSize,
      "pts/type-scale": typeScale,
      "pts/line-height-grid": lineHeightGrid,
      "pts/color-hex": colorHex,
      "pts/tier-aliases": tierAliases,
      "pts/registered-files": registeredFiles,
    }),
  };
}
