import { readFileSync } from "node:fs";
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";

const RESOLVER = "../../tokens/src/pts.resolver.json";

const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const resolver = readJson(RESOLVER);
type Ref = { $ref: string };
const contextFiles = (modifier: string, context: string) =>
  (resolver.modifiers[modifier].contexts[context] as Ref[]).map(({ $ref }) => readJson(`../../tokens/src/${$ref}`));

// Groups whose values differ by theme, read from the dark context files (e.g. ["color.**", "shadow.**"]).
const themeGroups = [...new Set(contextFiles("theme", "dark").flatMap((file) => Object.keys(file).map((group) => `${group}.**`)))];

// Tokens whose values differ by density or viewport, read from a context file. Listed by id, since their groups
// (gap, size, font-size, line-height, letter-spacing) also hold base tokens (gap.section, font-size.text) that don't
// change.
const ids = (node: Record<string, any>, prefix = ""): string[] =>
  Object.entries(node).flatMap(([key, value]) => {
    if (key.startsWith("$")) return [];
    const id = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === "object" && "$value" in value ? [id] : ids(value, id);
  });
const contextTokens = (modifier: string, context: string) => [...new Set(contextFiles(modifier, context).flatMap((file) => ids(file)))];
const densityTokens = contextTokens("density", "compact");
const viewportTokens = contextTokens("viewport", "wide");

// The width where the wide display sizes start (ADR 0029). Custom properties can't be used in media queries, so the
// query takes the value of breakpoint/md.
const breakpoints = readJson("../../tokens/src/semantic/breakpoint.tokens.json").breakpoint;
const wideFrom = `${breakpoints.md.$value.value}${breakpoints.md.$value.unit}`;

// :root holds every token at the defaults (light, relaxed, narrow). Each modifier's selectors repeat only that
// modifier's tokens, so they nest without resetting each other: a light region inside a compact page stays compact.
// Dark applies when the OS prefers dark (unless data-theme="light" forces light), or with data-theme="dark".
// The viewport is the window, not a choice a subtree makes, so it is a media query on :root with no attribute.
export default defineConfig({
  tokens: [RESOLVER],
  outDir: "./dist/",
  plugins: [
    css({
      filename: "tokens.css",
      legacyHex: true,
      permutations: [
        {
          input: { theme: "light", density: "relaxed", viewport: "narrow" },
          prepare: (contents) => `:root {\n  ${contents}\n}`,
        },
        {
          input: { theme: "light" },
          include: themeGroups,
          prepare: (contents) => `[data-theme="light"] {\n  ${contents}\n}`,
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
        {
          input: { density: "compact" },
          include: densityTokens,
          prepare: (contents) => `[data-density="compact"] {\n  ${contents}\n}`,
        },
        {
          input: { density: "relaxed" },
          include: densityTokens,
          // a relaxed region inside a compact page
          prepare: (contents) => `[data-density="relaxed"] {\n  ${contents}\n}`,
        },
        {
          input: { viewport: "wide" },
          include: viewportTokens,
          prepare: (contents) => `@media (min-width: ${wideFrom}) {\n  :root {\n    ${contents}\n  }\n}`,
        },
      ],
    }),
  ],
});
