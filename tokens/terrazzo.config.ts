// Token validation (ADR 0021): `tz check` here runs every rule. Lint only; the platform packages have their own
// build configs. Rules come in three blocks, so it's clear who owns each one.
import { defineConfig } from "@terrazzo/cli";
import { RECOMMENDED_CONFIG } from "@terrazzo/parser";
import pts from "./lint/index.ts";
import { primitiveGroups } from "./lint/source.ts";

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
      "core/descriptions": ["error", { ignore: primitiveGroups().map((group) => `${group}.**`) }], // every semantic token
      "core/colorspace": ["error", { colorSpace: "srgb" }],
      "core/max-gamut": ["error", { gamut: "srgb" }],
      "a11y/min-font-size": ["error", { minSizePx: 12 }],
      // Off: a11y/min-contrast checks the default theme only (pts/contrast replaces it);
      //      core/duplicate-values flags every alias target, which is the point of the tiers.

      // 3. Ours (tokens/lint/): what the built-in rules can't check. Each rule file says why.
      "pts/theme-parity": "error",
      "pts/contrast": "error",
      "pts/visible-steps": "error",
      "pts/min-font-size": ["error", { minSizePx: 12 }],
      "pts/color-hex": "error",
      "pts/tier-aliases": ["error", { rawValues: ["z-index", "breakpoint"], semanticAliases: ["text", "padding", "gap"] }],
      "pts/registered-files": "error",
    },
  },
});
