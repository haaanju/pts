// Validates the token source for every theme defined in pts.resolver.json:
//   1. every token declares $type
//   2. every alias resolves
//   3. all contexts of a modifier define the same token names
//   4. color pairs meet WCAG contrast (pairs are derived from the naming rules in CLAUDE.md, ADR 0017)
//   5. interaction states are visible: every fill's hover/pressed differ from it and from each other,
//      and background/hover and pressed differ from every surface they can sit on and from disabled
// Exits with code 1 on any failure.
// Exempt from contrast: */disabled (inactive), border/subtle (decorative), utility/* (outside the
// pairing system; the scrim is translucent), always/* (sits on images, whose colors are unknown).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastPairs, distinctBackgrounds } from "./pairs.ts";

type Token = { $type?: string; $value: unknown };
type Tokens = Record<string, Token>;
type Ref = { $ref: string };

const SRC = join(dirname(fileURLToPath(import.meta.url)), "../src");
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
  const { hex, alpha = 1 } = token.$value as { hex: string; alpha?: number };
  // contrast is only defined here for opaque colors; translucent ones depend on what is underneath
  if (alpha < 1) throw new Error(`${id} is translucent (alpha ${alpha}) and cannot be contrast-checked`);
  return hex;
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

    for (const [a, b] of distinctBackgrounds(Object.keys(tokens))) {
      if (resolveHex(tokens, a) === resolveHex(tokens, b)) errors.push(`${label}: ${a} and ${b} are the same color, so the state is invisible`);
    }

    for (const [fg, bg, min] of contrastPairs(Object.keys(tokens))) {
      if (!tokens[fg] || !tokens[bg]) {
        errors.push(`${label}: ${fg} expects ${bg}, which does not exist`);
        continue;
      }
      try {
        const ratio = contrast(resolveHex(tokens, fg), resolveHex(tokens, bg));
        checked++;
        if (ratio < min) errors.push(`${label}: ${fg} on ${bg} = ${ratio.toFixed(2)} (needs ${min})`);
      } catch (e) {
        errors.push(`${label}: ${(e as Error).message}`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✔ tokens valid, ${checked} contrast pairs pass`);
