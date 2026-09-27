// Validates the token source for every theme defined in pts.resolver.json:
//   1. every token declares $type
//   2. every alias resolves
//   3. all contexts of a modifier define the same token names
//   4. color pairs meet WCAG contrast (pairs come from the names, see scripts/pairs.ts and ADR 0019)
//   5. steps and states are visible: every step of a surface ladder differs from the others, and the
//      hover/pressed fills for transparent elements differ from a disabled control
//   6. every color's hex matches its components
//   7. every semantic color has a $description
//   8. semantic tokens alias primitives (exceptions: text/* composites alias semantic property tokens,
//      and z-index holds raw values)
//   9. every token file is in pts.resolver.json (an unregistered file is silently left out of the build)
// Exits with code 1 on any failure.
// Exempt from contrast: disabled/* (inactive), border/subtle (decorative), utility/* (outside the
// pairing system; the scrim is translucent), always/* (sits on images, whose colors are unknown).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastPairs, distinctBackgrounds } from "./pairs.ts";

type Token = { $type?: string; $value: unknown; $description?: string };
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

/** leaves of a value that are not aliases (color and dimension objects count as one leaf) */
const rawLeaves = (value: unknown): unknown[] => {
  if (typeof value === "string") return /^\{[^}]+\}$/.test(value) ? [] : [value];
  if (Array.isArray(value)) return value.flatMap(rawLeaves);
  if (value && typeof value === "object" && !("colorSpace" in value) && !("unit" in value)) return Object.values(value).flatMap(rawLeaves);
  return [value];
};

const toHex = (components: number[]) => "#" + components.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");

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

// Source rules, checked per file: tiers come from the folder (primitive/ or semantic/).
const RAW_VALUES_ALLOWED = ["z-index"];
const SEMANTIC_ALIASES_ALLOWED = ["text"];
const refs = [
  ...Object.values(resolver.sets as Record<string, { sources: Ref[] }>).flatMap((s) => s.sources),
  ...Object.values(resolver.modifiers as Record<string, { contexts: Record<string, Ref[]> }>).flatMap((m) => Object.values(m.contexts).flat()),
];
const files = [...new Set(refs.map((r) => r.$ref))].map((file) => ({ file, tier: file.split("/")[0], tokens: flatten(readJson(file)) }));
for (const file of readdirSync(SRC, { recursive: true, encoding: "utf8" })) {
  if (file.endsWith(".tokens.json") && !files.some((f) => f.file === file)) errors.push(`${file} is not in pts.resolver.json, so nothing reads it`);
}
const tierOf: Record<string, string> = Object.fromEntries(files.flatMap(({ tier, tokens }) => Object.keys(tokens).map((id) => [id, tier])));

for (const { file, tier, tokens } of files) {
  if (tier !== "primitive" && tier !== "semantic") errors.push(`${file}: token files go in primitive/ or semantic/`);
  for (const [id, token] of Object.entries(tokens)) {
    const where = `${file}: ${id}`;
    const value = token.$value as { colorSpace?: string; components?: number[]; hex?: string };
    if (token.$type === "color" && value && typeof value === "object" && value.components) {
      const expected = toHex(value.components);
      if (value.hex?.toLowerCase() !== expected) {
        // most edits change the hex (copied from Figma), so say which components match it
        const fromHex = /^#[0-9a-f]{6}$/i.test(value.hex ?? "") ? [1, 3, 5].map((i) => Math.round((parseInt(value.hex!.slice(i, i + 2), 16) / 255) * 10000) / 10000) : undefined;
        errors.push(`${where} has hex ${value.hex}, but its components are ${expected}` + (fromHex ? `; the components for ${value.hex} are [${fromHex.join(", ")}]` : ""));
      }
    }
    if (tier !== "semantic") continue;

    const group = id.split(".")[0];
    if (token.$type === "color" && !token.$description?.trim()) errors.push(`${where} has no $description`);
    if (!RAW_VALUES_ALLOWED.includes(group)) {
      const raw = rawLeaves(token.$value);
      if (raw.length) errors.push(`${where} holds a raw value (${JSON.stringify(raw[0])}); semantic tokens alias a primitive`);
    }
    if (!SEMANTIC_ALIASES_ALLOWED.includes(group)) {
      for (const ref of aliasesIn(token.$value)) {
        if (tierOf[ref] === "semantic") errors.push(`${where} → {${ref}} is a semantic token; semantic tokens alias a primitive`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✔ tokens valid, ${checked} contrast pairs pass`);
