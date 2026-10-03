// The token source as Terrazzo resolves it (ADR 0038): the one place the lint rules, the @pts/web build config, and the
// Storybook docs take tokens from. Terrazzo parses pts.resolver.json and the files it lists, and resolves every alias;
// nothing here resolves one.
//   loadResolver()      Terrazzo's resolver for pts.resolver.json, parsed once
//   parseSource()       a fresh parse with the given plugins, for a build of its own (the Storybook docs)
//   permutations(r)     every theme × density × viewport input with its tokens (resolver.apply)
//   files(r)            each registered file's tokens as written, with its tier (its folder). The trees are Terrazzo's
//                       own copy of the files (resolver.source); a resolved token no longer says which file it came from
//   modifierTokens(r)   the token ids a modifier's contexts define (resolver.apply with that modifier only)
//   registered(), onDisk()  file paths, for pts/registered-files
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, Logger, parse, type Plugin, type Resolver, type TokenNormalizedSet } from "@terrazzo/parser";

const SRC = new URL("./src/", import.meta.url);
export const RESOLVER = new URL("pts.resolver.json", SRC);

type Ref = { $ref: string };
type Tree = Record<string, any>;
export type RawToken = { $type?: string; $value: unknown; $description?: string };
/** layer: the resolver set (base) or modifier (theme, density, viewport) that lists the file */
export type SourceFile = { path: string; tier: string; layer: string; tokens: Record<string, RawToken> };
export type Permutation = { label: string; input: Record<string, string>; tokens?: TokenNormalizedSet; error?: string };

/** Parses the resolver and every file it lists, with a config that holds the given plugins, for Terrazzo's build(). Each call parses again. */
export const parseSource = async (plugins: Plugin[] = [], logger = new Logger({ level: "silent" })) => {
  const config = defineConfig({ tokens: [fileURLToPath(RESOLVER)], plugins }, { logger, cwd: SRC });
  const result = await parse([{ filename: RESOLVER, src: readFileSync(RESOLVER, "utf8") }], { config, logger, skipLint: true });
  return { ...result, config, logger };
};

let cache: Promise<Resolver> | undefined;
/** The resolver, parsed once per process */
export const loadResolver = (): Promise<Resolver> => (cache ??= parseSource().then(({ resolver }) => resolver));

/** Every permutation of the resolver's modifiers, e.g. "theme=dark, density=relaxed, viewport=narrow". A permutation that fails to resolve carries the error instead. */
export const permutations = (resolver: Resolver): Permutation[] =>
  (resolver.listPermutations?.() ?? [{}]).map((input) => {
    const label =
      Object.entries(input)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ") || "default";
    try {
      return { label, input, tokens: resolver.apply(input) };
    } catch (e) {
      return { label, input, error: (e as Error).message };
    }
  });

const flatten = (node: Tree, prefix = "", out: Record<string, RawToken> = {}) => {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const id = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "$value" in value) out[id] = value;
    else if (value && typeof value === "object") flatten(value, id, out);
  }
  return out;
};

// The resolver document as written: only the $ref paths come from here, since Terrazzo's normalized resolver keeps each
// file's tokens but not its name. Both list the sources in the same order.
const resolverDocument = () => JSON.parse(readFileSync(RESOLVER, "utf8"));

/** Registered files with their tier: the first folder, primitive/, semantic/, or component/. In resolver order. */
export const files = (resolver: Resolver): SourceFile[] => {
  const doc = resolverDocument();
  const { sets = {}, modifiers = {} } = resolver.source;
  const pairs: [Ref, string, Tree][] = [
    ...Object.entries(sets).flatMap(([name, set]) =>
      (doc.sets[name].sources as Ref[]).map((ref, i): [Ref, string, Tree] => [ref, name, set.sources[i]]),
    ),
    ...Object.entries(modifiers).flatMap(([name, modifier]) =>
      Object.entries(modifier.contexts).flatMap(([context, trees]) =>
        (doc.modifiers[name].contexts[context] as Ref[]).map((ref, i): [Ref, string, Tree] => [ref, name, trees[i]]),
      ),
    ),
  ];
  const seen = new Set<string>();
  return pairs
    .filter(([{ $ref }]) => !seen.has($ref) && seen.add($ref))
    .map(([{ $ref: path }, layer, tree]) => ({ path, tier: path.split("/")[0], layer, tokens: flatten(tree) }));
};

/** Token ids a modifier's contexts define, e.g. modifierTokens(r, "density") → ["gap.between.lg", …, "size.control.sm"] */
export const modifierTokens = (resolver: Resolver, modifier: string): string[] => {
  const contexts = Object.keys(resolver.source.modifiers?.[modifier]?.contexts ?? {});
  const ids = contexts.flatMap((context) =>
    Object.keys(resolver.apply({ [modifier]: context }, { modifiers: [modifier], sets: [], resolveAliases: false })),
  );
  return [...new Set(ids)];
};

/** Top-level groups of the primitive tier, e.g. ["dimension", "color", …] */
export const primitiveGroups = (resolver: Resolver): string[] => [
  ...new Set(
    files(resolver)
      .filter((f) => f.tier === "primitive")
      .flatMap((f) => Object.keys(f.tokens).map((id) => id.split(".")[0])),
  ),
];

/** Paths (relative to src/) of every file the resolver lists, in sets and in modifier contexts */
export const registered = (): string[] => {
  const doc = resolverDocument();
  const refs: Ref[] = [
    ...Object.values(doc.sets as Record<string, { sources: Ref[] }>).flatMap((s) => s.sources),
    ...Object.values(doc.modifiers as Record<string, { contexts: Record<string, Ref[]> }>).flatMap((m) => Object.values(m.contexts).flat()),
  ];
  return [...new Set(refs.map((r) => r.$ref))];
};

/** Every .tokens.json under src/, registered or not */
export const onDisk = (): string[] => readdirSync(SRC, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".tokens.json"));
