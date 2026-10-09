// Token validation (ADR 0021): `tz check` here runs every rule. Lint only; the platform packages have their own
// build configs. Rules come in three blocks, so it's clear who owns each one.
import { defineConfig } from "@terrazzo/cli";
import { RECOMMENDED_CONFIG } from "@terrazzo/parser";
import pts from "./lint/index.ts";
import { loadResolver, primitiveGroups } from "./source.ts";

const resolver = await loadResolver();
// The semantic properties a text style is made of (CLAUDE.md → Typography)
const TEXT_PROPERTIES = ["font-family", "font-size", "font-weight", "letter-spacing", "line-height"];
// The tokens every intent repeats (CLAUDE.md → Color, ADR 0050). core/required-children pools every token a match
// covers, so one match for all intents would pass while any intent still had the name: one match per intent and part.
const INTENT_SHAPE = { surface: ["subtle", "base", "strong", "stronger"], content: ["base", "inverse"], border: ["base", "subtle"] };
const intents = [...new Set(Object.keys(resolver.apply({})).flatMap((id) => (id.startsWith("intent.") ? [id.split(".")[1]] : [])))];

export default defineConfig({
  tokens: ["./src/pts.resolver.json"],
  plugins: [pts()],
  lint: {
    rules: {
      // 1. Terrazzo's recommended rules (value shapes, core/valid-*). Setting lint.rules replaces them, so spread them first.
      ...RECOMMENDED_CONFIG,
      "core/consistent-naming": ["error", { format: "kebab-case" }], // recommended as a warning; an error blocks CI

      // 2. Terrazzo's built-in rules, turned on. They see the default theme only, which is enough for rules that
      //    don't depend on theme values (names and descriptions match across themes: pts/theme-parity).
      "core/required-type": "error",
      "core/descriptions": ["error", { ignore: primitiveGroups(resolver).map((group) => `${group}.**`) }], // every semantic token
      "core/colorspace": ["error", { colorSpace: "srgb" }],
      "core/max-gamut": ["error", { gamut: "srgb" }],
      "a11y/min-font-size": ["error", { minSizePx: 12 }],
      "core/required-children": [
        "error",
        {
          matches: intents.flatMap((intent) =>
            Object.entries(INTENT_SHAPE).map(([part, requiredTokens]) => ({ match: [`intent.${intent}.${part}.*`], requiredTokens })),
          ),
        },
      ],
      // Off: a11y/min-contrast checks the default theme only (pts/contrast replaces it);
      //      core/duplicate-values flags every alias target, which is the point of the tiers.

      // 3. Ours (tokens/lint/): what the built-in rules can't check. Each rule file says why.
      "pts/theme-parity": ["error", { constant: ["always"] }],
      "pts/contrast": "error",
      "pts/component-pairs": "error",
      "pts/component-states": ["error", { states: ["rest", "hover", "pressed"], transparentRest: ["button.ghost.surface"] }], // Ghost is transparent at rest (ADR 0032)
      "pts/visible-steps": "error",
      "pts/density-order": ["error", { modifier: "density", tighter: "compact", looser: "relaxed" }],
      "pts/gap-order": ["error", { order: ["gap.within", "gap.between", "gap.section"] }],
      "pts/min-font-size": ["error", { minSizePx: 12 }],
      "pts/type-scale": ["error", { order: ["xs", "sm", "md", "lg", "xl"], contrastZones: ["display"], minRatio: 1.5 }],
      "pts/line-height-grid": ["error", { gridPx: 4 }],
      "pts/color-hex": "error",
      "pts/tier-aliases": [
        "error",
        {
          rawValues: ["z-index", "breakpoint", "line-height"],
          roleAliases: { text: TEXT_PROPERTIES, padding: ["space"], gap: ["space"], "radius.control": ["radius"], "radius.container": ["radius"] }, // ADR 0026, 0048, 0049
        },
      ],
      "pts/registered-files": "error",
      "pts/orthogonal-modifiers": [
        "error",
        {
          scope: {
            theme: { types: ["color", "shadow"] },
            density: { groups: ["padding", "gap.within", "gap.between", "size.control"] },
            viewport: { groups: ["font-size.display", "line-height.display", "letter-spacing.display"] },
            shape: { tokens: ["radius.control", "radius.container"] },
          },
        },
      ],
    },
  },
});
