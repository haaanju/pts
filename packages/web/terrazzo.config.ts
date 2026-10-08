import { fileURLToPath } from "node:url";
import { defineConfig } from "@terrazzo/cli";
import type { TokenNormalized } from "@terrazzo/parser";
import css, { type Permutation } from "@terrazzo/plugin-css";
import cssInJs from "@terrazzo/plugin-css-in-js";
import js from "@terrazzo/plugin-js";
import sass from "@terrazzo/plugin-sass";
import { files, loadResolver, modifierTokens, RESOLVER } from "../../tokens/source.ts";
import { products } from "./products.ts";

// Which tokens each modifier block repeats, asked of Terrazzo's resolver for the same files the build reads (ADR 0038).
const resolver = await loadResolver();
const tokens = resolver.apply({});

// Tokens whose values differ by theme, density, or viewport: the ones each modifier's contexts define.
const themeTokens = modifierTokens(resolver, "theme");
const densityTokens = modifierTokens(resolver, "density");
const viewportTokens = modifierTokens(resolver, "viewport");

// Component tokens that reach a theme or density token through their aliases (ADR 0032). A custom property resolves
// where it is declared, so --button-primary-surface-rest: var(--inverse-base) declared on :root keeps the light value
// inside a [data-theme="dark"] subtree; it has to be declared again in that block. (Viewport tokens only change on
// :root, where every alias resolves again, so they need nothing.) Terrazzo records every alias a token goes through
// (aliasChain), and for a composite the token each property aliases (partialAliasOf).
const leaves = (value: unknown): string[] =>
  typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value).flatMap(leaves) : [];
// aliasChain is the whole chain; a composite's properties each alias a token whose own chain is followed in turn
const reaches = (token: TokenNormalized | undefined, targets: Set<string>): boolean =>
  !!token &&
  (targets.has(token.id) ||
    (token.aliasChain ?? []).some((id) => targets.has(id)) ||
    leaves(token.partialAliasOf).some((id) => reaches(tokens[id], targets)));
const componentTokens = files(resolver)
  .filter((file) => file.tier === "component")
  .flatMap((file) => Object.keys(file.tokens));
const themeSet = new Set(themeTokens);
const densitySet = new Set(densityTokens);
const themedComponentTokens = componentTokens.filter((id) => reaches(tokens[id], themeSet));
const denseComponentTokens = componentTokens.filter((id) => reaches(tokens[id], densitySet));

// The width where the wide display sizes start (ADR 0029). Custom properties can't be used in media queries, so the
// query takes the value of breakpoint/md.
const { value, unit } = tokens["breakpoint.md"].$value as { value: number; unit: string };
const wideFrom = `${value}${unit}`;

// :root holds every token at the defaults (light, relaxed, narrow). Each modifier's selectors repeat only that
// modifier's tokens, so they nest without resetting each other: a light region inside a compact page stays compact.
// Dark applies when the OS prefers dark (unless data-theme="light" forces light), or with data-theme="dark".
// The viewport is the window, not a choice a subtree makes, so it is a media query on :root with no attribute.
// tokens.js and tokens.scss hold references to these CSS variables, not values (ADR 0030), so every modifier keeps
// working through tokens.css.
// A product (products.ts, ADR 0047) fixes some modifiers: every block takes those inputs, and a fixed modifier has no
// blocks of its own. tokens.css fixes none.
const blocks = (fixed: Record<string, string>) => {
  const all: Permutation[] = [
    {
      input: { theme: "light", density: "relaxed", viewport: "narrow" },
      prepare: (contents: string) => `:root {\n  ${contents}\n}`,
    },
    ...(fixed.theme
      ? []
      : [
          {
            input: { theme: "light" },
            include: [...themeTokens, ...themedComponentTokens],
            prepare: (contents: string) => `[data-theme="light"] {\n  ${contents}\n}`,
          },
          {
            input: { theme: "dark" },
            include: [...themeTokens, ...themedComponentTokens],
            prepare: (contents: string) =>
              `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    ${contents}\n  }\n}`,
          },
          {
            input: { theme: "dark" },
            include: [...themeTokens, ...themedComponentTokens],
            prepare: (contents: string) => `[data-theme="dark"] {\n  ${contents}\n}`,
          },
        ]),
    ...(fixed.density
      ? []
      : [
          {
            input: { density: "compact" },
            include: [...densityTokens, ...denseComponentTokens],
            prepare: (contents: string) => `[data-density="compact"] {\n  ${contents}\n}`,
          },
          {
            input: { density: "relaxed" },
            include: [...densityTokens, ...denseComponentTokens],
            // a relaxed region inside a compact page
            prepare: (contents: string) => `[data-density="relaxed"] {\n  ${contents}\n}`,
          },
        ]),
    ...(fixed.viewport
      ? []
      : [
          {
            input: { viewport: "wide" },
            include: viewportTokens,
            prepare: (contents: string) => `@media (min-width: ${wideFrom}) {\n  :root {\n    ${contents}\n  }\n}`,
          },
        ]),
  ];
  return all.map((block) => ({ ...block, input: { ...block.input, ...fixed } }));
};

// A product's JS holds resolved values, not references (ADR 0047): plugin-js writes one token set per permutation of
// the contexts listed here, one for a modifier the product fixes and all of them for the others.
const contexts = (fixed: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(resolver.source.modifiers ?? {}).map(([name, m]) => [name, fixed[name] ? [fixed[name]] : Object.keys(m.contexts)]),
  );

export default defineConfig({
  tokens: [fileURLToPath(RESOLVER)],
  outDir: "./dist/",
  plugins: [
    css({ filename: "tokens.css", legacyHex: true, permutations: blocks({}) }),
    cssInJs({ filename: "tokens.js" }),
    // After css(): sass reads the CSS variable names css() assigns. Listed before it, the build succeeds with an
    // empty token map.
    sass({ filename: "tokens.scss" }),
    // Each product (products.ts, ADR 0047). Every css() instance also stores its :root values as the default ones;
    // cssInJs() and sass() read only the variable names from them, the same in every instance, so the order is free.
    ...Object.entries(products).flatMap(([name, fixed]) => [
      css({ filename: `products/${name}.css`, legacyHex: true, permutations: blocks(fixed) }),
      js({ filename: `products/${name}.js`, contexts: contexts(fixed), properties: ["$type", "$value"] }),
    ]),
  ],
});
