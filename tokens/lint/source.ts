// The token source as the pts rules need it (ADR 0021). Terrazzo hands every lint rule the tokens of the
// default theme only, merged from all files, so this module adds the views the built-in rules lack:
//   themes()            every permutation of the resolver's modifiers (theme × density), applied by Terrazzo's
//                       own resolver; the name predates density, each entry carries its full input
//   files()             each registered .tokens.json with its tier (its folder), since a merged token no longer
//                       knows which file it came from
//   modifierTokens()    the token ids a modifier's contexts define (e.g. what density changes)
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, Logger, parse, type TokenNormalizedSet } from "@terrazzo/parser";

const SRC = new URL("../src/", import.meta.url);
const RESOLVER = new URL("pts.resolver.json", SRC);

type Ref = { $ref: string };
export type RawToken = { $type?: string; $value: unknown; $description?: string };
export type SourceFile = { path: string; tier: string; tokens: Record<string, RawToken> };
export type Theme = { label: string; input: Record<string, string>; tokens?: TokenNormalizedSet; error?: string };

const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, SRC), "utf8"));

const flatten = (node: Record<string, any>, prefix = "", out: Record<string, RawToken> = {}) => {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const id = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "$value" in value) out[id] = value;
    else if (value && typeof value === "object") flatten(value, id, out);
  }
  return out;
};

/** Paths (relative to src/) of every file the resolver lists, in sets and in modifier contexts */
export const registered = (): string[] => {
  const resolver = readJson("pts.resolver.json");
  const refs: Ref[] = [
    ...Object.values(resolver.sets as Record<string, { sources: Ref[] }>).flatMap((s) => s.sources),
    ...Object.values(resolver.modifiers as Record<string, { contexts: Record<string, Ref[]> }>).flatMap((m) => Object.values(m.contexts).flat()),
  ];
  return [...new Set(refs.map((r) => r.$ref))];
};

/** Every .tokens.json under src/, registered or not */
export const onDisk = (): string[] => readdirSync(SRC, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".tokens.json"));

/** Registered files with their tier: the first folder, primitive/ or semantic/ */
export const files = (): SourceFile[] => registered().map((path) => ({ path, tier: path.split("/")[0], tokens: flatten(readJson(path)) }));

/** Top-level groups of the primitive tier, e.g. ["dimension", "color", …] */
/** Token ids defined by a modifier's contexts, e.g. modifierTokens("density") → ["padding.xs", …, "size.control.lg"] */
export const modifierTokens = (modifier: string): string[] => {
  const contexts = readJson("pts.resolver.json").modifiers?.[modifier]?.contexts as Record<string, Ref[]> | undefined;
  if (!contexts) return [];
  return [...new Set(Object.values(contexts).flat().flatMap((r) => Object.keys(flatten(readJson(r.$ref)))))];
};

export const primitiveGroups = (): string[] => [
  ...new Set(files().filter((f) => f.tier === "primitive").flatMap((f) => Object.keys(f.tokens).map((id) => id.split(".")[0]))),
];

let themeCache: Promise<Theme[]> | undefined;

/** Every theme permutation of the resolver, e.g. "theme=dark". A theme that fails to resolve carries the error instead. */
export const themes = (): Promise<Theme[]> =>
  (themeCache ??= (async () => {
    const logger = new Logger({ level: "silent" });
    const config = defineConfig({ tokens: [fileURLToPath(RESOLVER)] }, { logger, cwd: SRC });
    const { resolver } = await parse([{ filename: RESOLVER, src: readFileSync(RESOLVER, "utf8") }], { config, logger, skipLint: true });
    return (resolver.listPermutations?.() ?? [{}]).map((input) => {
      const label = Object.entries(input).map(([k, v]) => `${k}=${v}`).join(", ") || "default";
      try {
        return { label, input, tokens: resolver.apply(input) };
      } catch (e) {
        return { label, input, error: (e as Error).message };
      }
    });
  })());
