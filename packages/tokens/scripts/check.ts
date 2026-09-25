// Validates the token source for every theme defined in pts.resolver.json:
//   1. every token declares $type
//   2. every alias resolves
//   3. all contexts of a modifier define the same token names
//   4. color pairs meet WCAG contrast (pairs are derived from the naming rules in CLAUDE.md)
// Exits with code 1 on any failure.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Token = { $type?: string; $value: unknown };
type Tokens = Record<string, Token>;
type Ref = { $ref: string };

const SRC = join(dirname(fileURLToPath(import.meta.url)), "../src");
const TEXT = 4.5; // WCAG 1.4.3
const UI = 3; // WCAG 1.4.11
const PAGE = ["default", "subtle"];

const readJson = (file: string) => JSON.parse(readFileSync(join(SRC, file), "utf8"));

const flatten = (node: Record<string, any>, prefix = "", out: Tokens = {}): Tokens => {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const id = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "$value" in value) out[id] = value;
    else if (value && typeof value === "object") flatten(value, id, out);
  }
  return out;
};

const load = (refs: Ref[]): Tokens => Object.assign({}, ...refs.map((r) => flatten(readJson(r.$ref))));

const aliasesIn = (value: unknown): string[] => {
  if (typeof value === "string") return [...value.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  if (value && typeof value === "object" && !Array.isArray(value)) return Object.values(value).flatMap(aliasesIn);
  return [];
};

const resolveHex = (tokens: Tokens, id: string): string => {
  let token = tokens[id];
  while (typeof token.$value === "string") token = tokens[token.$value.slice(1, -1)];
  return (token.$value as { hex: string }).hex;
};

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground token, background token, minimum ratio]
const contrastPairs = (ids: string[]): [string, string, number][] => {
  const names = (group: string) => ids.filter((id) => id.startsWith(`color.${group}.`)).map((id) => id.split(".")[2]);
  const pairs: [string, string, number][] = [];
  for (const name of names("foreground")) {
    const backgrounds = name.startsWith("on-") ? [name.slice(3)] : PAGE;
    for (const bg of backgrounds) pairs.push([`color.foreground.${name}`, `color.background.${bg}`, TEXT]);
  }
  for (const name of names("border").filter((n) => n !== "default")) {
    for (const bg of PAGE) pairs.push([`color.border.${name}`, `color.background.${bg}`, UI]);
  }
  const solid = names("background").filter((n) => ![...PAGE, "inverse"].includes(n) && !n.endsWith("-subtle"));
  for (const name of solid) {
    for (const bg of PAGE) pairs.push([`color.background.${name}`, `color.background.${bg}`, UI]);
  }
  return pairs;
};

const resolver = readJson("pts.resolver.json");
const base = load(Object.values(resolver.sets as Record<string, { sources: Ref[] }>).flatMap((s) => s.sources));
const errors: string[] = [];
let checked = 0;

for (const [modifier, { contexts }] of Object.entries(resolver.modifiers as Record<string, { contexts: Record<string, Ref[]> }>)) {
  const keysets = Object.entries(contexts).map(([ctx, refs]) => [ctx, Object.keys(load(refs)).sort().join()] as const);
  if (new Set(keysets.map(([, keys]) => keys)).size > 1) {
    errors.push(`${modifier}: contexts define different token names (${keysets.map(([c]) => c).join(", ")})`);
  }

  for (const [context, refs] of Object.entries(contexts)) {
    const label = `${modifier}=${context}`;
    const tokens = { ...base, ...load(refs) };
    for (const [id, token] of Object.entries(tokens)) {
      if (!token.$type) errors.push(`${label}: ${id} has no $type`);
      for (const ref of aliasesIn(token.$value)) if (!tokens[ref]) errors.push(`${label}: ${id} → {${ref}} does not resolve`);
    }
    if (errors.length) continue;

    for (const [fg, bg, min] of contrastPairs(Object.keys(tokens))) {
      if (!tokens[fg] || !tokens[bg]) {
        errors.push(`${label}: ${fg} expects ${bg}, which does not exist`);
        continue;
      }
      const ratio = contrast(resolveHex(tokens, fg), resolveHex(tokens, bg));
      checked++;
      if (ratio < min) errors.push(`${label}: ${fg} on ${bg} = ${ratio.toFixed(2)} (needs ${min})`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✔ tokens valid, ${checked} contrast pairs pass`);
