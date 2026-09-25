import { readFileSync } from "node:fs";
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";

const RESOLVER = "../tokens/src/pts.resolver.json";

// Groups whose values differ by theme, read from the theme contexts in the resolver
// (e.g. ["color.**", "shadow.**"]). Only these are repeated in the dark blocks.
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const themeGroups = [
  ...new Set(
    (readJson(RESOLVER).modifiers.theme.contexts.dark as { $ref: string }[]).flatMap(({ $ref }) =>
      Object.keys(readJson(`../tokens/src/${$ref}`)).map((group) => `${group}.**`),
    ),
  ),
];

// Dark theme applies when the OS prefers dark (unless data-theme="light" forces light),
// or when data-theme="dark" is set explicitly.
export default defineConfig({
  tokens: [RESOLVER],
  outDir: "./dist/",
  plugins: [
    css({
      filename: "tokens.css",
      legacyHex: true,
      permutations: [
        {
          input: { theme: "light" },
          prepare: (contents) => `:root {\n  ${contents}\n}`,
        },
        {
          input: { theme: "dark" },
          include: themeGroups,
          prepare: (contents) =>
            `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    ${contents}\n  }\n}`,
        },
        {
          input: { theme: "dark" },
          include: themeGroups,
          prepare: (contents) => `[data-theme="dark"] {\n  ${contents}\n}`,
        },
      ],
    }),
  ],
});
