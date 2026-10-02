import { readFileSync } from "node:fs";
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import cssInJs from "@terrazzo/plugin-css-in-js";
import sass from "@terrazzo/plugin-sass";

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

// Component tokens that reach a theme or density token through their aliases (ADR 0032). A custom property resolves
// where it is declared, so --button-primary-surface-rest: var(--inverse-base) declared on :root keeps the light value
// inside a [data-theme="dark"] subtree; it has to be declared again in that block. (Viewport tokens only change on
// :root, where every alias resolves again, so they need nothing.)
const sources = (resolver.sets.base.sources as Ref[]).map(({ $ref }) => $ref);
const allRefs = [
  ...sources,
  ...Object.values(resolver.modifiers as Record<string, { contexts: Record<string, Ref[]> }>).flatMap((m) =>
    Object.values(m.contexts).flatMap((refs) => refs.map(({ $ref }) => $ref)),
  ),
];
const values = new Map<string, unknown>();
const collect = (node: Record<string, any>, prefix = "") => {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const id = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "$value" in value) values.set(id, value.$value);
    else if (value && typeof value === "object") collect(value, id);
  }
};
for (const ref of allRefs) collect(readJson(`../../tokens/src/${ref}`));
const aliasesIn = (value: unknown): string[] =>
  typeof value === "string"
    ? [...value.matchAll(/\{([^}]+)\}/g)].map((m) => m[1])
    : value && typeof value === "object"
      ? Object.values(value).flatMap(aliasesIn)
      : [];
const reaches = (id: string, targets: Set<string>): boolean =>
  targets.has(id) || aliasesIn(values.get(id)).some((ref) => reaches(ref, targets));
const componentTokens = sources.filter((ref) => ref.startsWith("component/")).flatMap((ref) => ids(readJson(`../../tokens/src/${ref}`)));
const themeTokens = new Set(contextTokens("theme", "dark"));
const themedComponentTokens = componentTokens.filter((id) => reaches(id, themeTokens));
const denseComponentTokens = componentTokens.filter((id) => reaches(id, new Set(densityTokens)));

// The width where the wide display sizes start (ADR 0029). Custom properties can't be used in media queries, so the
// query takes the value of breakpoint/md.
const breakpoints = readJson("../../tokens/src/semantic/breakpoint.tokens.json").breakpoint;
const wideFrom = `${breakpoints.md.$value.value}${breakpoints.md.$value.unit}`;

// :root holds every token at the defaults (light, relaxed, narrow). Each modifier's selectors repeat only that
// modifier's tokens, so they nest without resetting each other: a light region inside a compact page stays compact.
// Dark applies when the OS prefers dark (unless data-theme="light" forces light), or with data-theme="dark".
// The viewport is the window, not a choice a subtree makes, so it is a media query on :root with no attribute.
// tokens.js and tokens.scss hold references to these CSS variables, not values (ADR 0030), so every modifier keeps
// working through tokens.css.
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
          include: [...themeGroups, ...themedComponentTokens],
          prepare: (contents) => `[data-theme="light"] {\n  ${contents}\n}`,
        },
        {
          input: { theme: "dark" },
          include: [...themeGroups, ...themedComponentTokens],
          prepare: (contents) =>
            `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    ${contents}\n  }\n}`,
        },
        {
          input: { theme: "dark" },
          include: [...themeGroups, ...themedComponentTokens],
          prepare: (contents) => `[data-theme="dark"] {\n  ${contents}\n}`,
        },
        {
          input: { density: "compact" },
          include: [...densityTokens, ...denseComponentTokens],
          prepare: (contents) => `[data-density="compact"] {\n  ${contents}\n}`,
        },
        {
          input: { density: "relaxed" },
          include: [...densityTokens, ...denseComponentTokens],
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
    cssInJs({ filename: "tokens.js" }),
    // After css(): sass reads the CSS variable names css() assigns. Listed before it, the build succeeds with an
    // empty token map.
    sass({ filename: "tokens.scss" }),
  ],
});
