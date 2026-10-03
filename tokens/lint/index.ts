// The pts lint plugin (ADR 0021): rules for what Terrazzo's built-in rules can't check. Each rule file says why.
// The rules are configured next to the built-in ones in tokens/terrazzo.config.ts.
import type { Plugin } from "@terrazzo/parser";
import colorHex from "./rules/color-hex.ts";
import componentPairs from "./rules/component-pairs.ts";
import componentStates from "./rules/component-states.ts";
import contrast from "./rules/contrast.ts";
import densityOrder from "./rules/density-order.ts";
import gapOrder from "./rules/gap-order.ts";
import lineHeightGrid from "./rules/line-height-grid.ts";
import minFontSize from "./rules/min-font-size.ts";
import orthogonalModifiers from "./rules/orthogonal-modifiers.ts";
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
      "pts/component-pairs": componentPairs,
      "pts/component-states": componentStates,
      "pts/visible-steps": visibleSteps,
      "pts/density-order": densityOrder,
      "pts/gap-order": gapOrder,
      "pts/min-font-size": minFontSize,
      "pts/type-scale": typeScale,
      "pts/line-height-grid": lineHeightGrid,
      "pts/color-hex": colorHex,
      "pts/tier-aliases": tierAliases,
      "pts/registered-files": registeredFiles,
      "pts/orthogonal-modifiers": orthogonalModifiers,
    }),
  };
}
