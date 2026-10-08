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

// The modifiers in resolver order, and the context each defaults to
const modifiers = resolver.source.modifiers ?? {};
const defaults: Record<string, string> = Object.fromEntries(
  Object.entries(modifiers).flatMap(([name, m]) => (m.default ? [[name, m.default]] : [])),
);

// Component tokens that reach a modifier's tokens through their aliases (ADR 0032). A custom property resolves where
// it is declared, so --button-primary-surface-rest: var(--inverse-base) declared on :root keeps the light value inside
// a [data-theme="dark"] subtree; it has to be declared again in that block. (Viewport tokens only change on :root,
// where every alias resolves again, so they need nothing.) Terrazzo records every alias a token goes through
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

// What a modifier's blocks on a subtree repeat: the tokens its contexts define, plus the component tokens that reach them
const repeated = (modifier: string) => {
  const own = modifierTokens(resolver, modifier);
  const targets = new Set(own);
  return [...own, ...componentTokens.filter((id) => reaches(tokens[id], targets))];
};

// The width where the wide display sizes start (ADR 0029). Custom properties can't be used in media queries, so the
// query takes the value of breakpoint/md.
const { value, unit } = tokens["breakpoint.md"].$value as { value: number; unit: string };
const wideFrom = `${value}${unit}`;

const rule = (selector: string) => (contents: string) => `${selector} {\n  ${contents}\n}`;

// Each modifier's blocks, after :root:
//   theme      [data-theme="light"]; dark when the OS prefers dark (unless data-theme="light" forces light), and
//              [data-theme="dark"]
//   viewport   the window, not a choice a subtree makes: a media query on :root from breakpoint/md, with no attribute
//   any other  (density, shape) an attribute that works on any subtree, [data-<modifier>="<context>"] for every
//              context, the default last: a relaxed region inside a compact page, a soft one inside a round page
const modifierBlocks = (name: string): Permutation[] => {
  if (name === "viewport")
    return [
      {
        input: { viewport: "wide" },
        include: modifierTokens(resolver, "viewport"),
        prepare: (contents: string) => `@media (min-width: ${wideFrom}) {\n  :root {\n    ${contents}\n  }\n}`,
      },
    ];
  const include = repeated(name);
  if (name === "theme")
    return [
      { input: { theme: "light" }, include, prepare: rule('[data-theme="light"]') },
      {
        input: { theme: "dark" },
        include,
        prepare: (contents: string) => `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    ${contents}\n  }\n}`,
      },
      { input: { theme: "dark" }, include, prepare: rule('[data-theme="dark"]') },
    ];
  const last = (context: string) => Number(context === defaults[name]);
  const contexts = Object.keys(modifiers[name].contexts).sort((a, b) => last(a) - last(b));
  return contexts.map((context) => ({
    input: { [name]: context },
    include,
    prepare: rule(`[data-${name}="${context}"]`),
  }));
};

// :root holds every token at the defaults (light, relaxed, narrow, soft); then each modifier's blocks, in resolver
// order, repeat only that modifier's tokens, so they nest without resetting each other: a light region inside a
// compact page stays compact. tokens.js and tokens.scss hold references to these CSS variables, not values (ADR 0030),
// so every modifier keeps working through tokens.css.
// A product (products.ts, ADR 0047) fixes some modifiers: every block takes those inputs, and a fixed modifier has no
// blocks of its own. tokens.css fixes none.
const blocks = (fixed: Record<string, string>) => {
  const all: Permutation[] = [
    { input: defaults, prepare: rule(":root") },
    ...Object.keys(modifiers)
      .filter((name) => !fixed[name])
      .flatMap(modifierBlocks),
  ];
  return all.map((block) => ({ ...block, input: { ...block.input, ...fixed } }));
};

// A product's JS holds resolved values, not references (ADR 0047): plugin-js writes one token set per permutation of
// the contexts listed here, one for a modifier the product fixes and all of them for the others.
const contexts = (fixed: Record<string, string>) =>
  Object.fromEntries(Object.entries(modifiers).map(([name, m]) => [name, fixed[name] ? [fixed[name]] : Object.keys(m.contexts)]));

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
