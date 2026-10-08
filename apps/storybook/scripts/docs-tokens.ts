// The docs' token data, built by Terrazzo (ADR 0038). The docs never resolve an alias themselves: a Terrazzo plugin
// writes every permutation as Terrazzo's resolver applies it, and a Vite plugin runs that build in memory and serves
// the result as "virtual:pts-tokens". It runs again when a token file changes, so the dev server stays live.
import { fileURLToPath } from "node:url";
import { build, type Plugin as TerrazzoPlugin, type Resolver } from "@terrazzo/parser";
import { normalizePath, type Plugin as VitePlugin } from "vite";
import { files, parseSource, permutations, registered, RESOLVER } from "../../../tokens/source.ts";
import type { DocsToken, DocsTokens, DocsValue } from "../src/tokens-data.ts";

const FILENAME = "docs-tokens.json";
const MODIFIERS = ["theme", "density", "viewport", "shape"];

// The order the docs list tokens in: file order, with the density and shape files first, so gap/within and gap/between
// come before the base gap/section and radius/control before the radius scale (role tokens first, like the Spacing
// page), and the viewport files last, so the display steps follow the base text steps.
const LAYERS = ["density", "shape", "base", "theme", "viewport"];

export const docsData = (resolver: Resolver): DocsTokens => {
  const rank = (layer: string) => {
    if (!LAYERS.includes(layer)) throw new Error(`docs-tokens.ts: add the ${layer} layer to LAYERS to place its files`);
    return LAYERS.indexOf(layer);
  };
  const sources = files(resolver).sort((a, b) => rank(a.layer) - rank(b.layer));
  const tierOf = new Map<string, string>();
  for (const { tier, tokens } of sources) for (const id of Object.keys(tokens)) if (!tierOf.has(id)) tierOf.set(id, tier);

  const meta = new Map<string, DocsToken>();
  const values: DocsTokens["values"] = {};
  for (const { label, input, tokens, error } of permutations(resolver)) {
    if (!tokens) throw new Error(`${label} does not resolve: ${error}`);
    const unknown = Object.keys(input).find((m) => !MODIFIERS.includes(m));
    if (unknown) throw new Error(`docs-tokens.ts: add the ${unknown} modifier to MODIFIERS to key its permutations`);
    // a token one context lacks (pts/theme-parity reports it) is left out of that permutation only
    const present = [...tierOf].filter(([id]) => tokens[id]);
    for (const [id, tier] of present) if (!meta.has(id)) meta.set(id, { id, type: tokens[id].$type, description: tokens[id].$description, tier });
    values[MODIFIERS.map((m) => input[m]).join("/")] = Object.fromEntries(
      present.map(([id]): [string, DocsValue] => [id, { value: tokens[id].$value, alias: tokens[id].aliasChain?.[0] }]),
    );
  }
  return { tokens: [...tierOf.keys()].flatMap((id) => meta.get(id) ?? []), values };
};

/** Terrazzo plugin: writes docs-tokens.json */
export const docsTokens = (): TerrazzoPlugin => ({
  name: "pts-docs-tokens",
  build({ resolver, outputFile }) {
    outputFile(FILENAME, JSON.stringify(docsData(resolver)));
  },
});

/** Vite plugin: runs the Terrazzo build above in memory and serves its output as "virtual:pts-tokens" */
export const tokensModule = (): VitePlugin => {
  const id = "virtual:pts-tokens";
  const resolved = `\0${id}`;
  const watched = new Set<string>();
  return {
    name: "pts-tokens",
    resolveId: (source) => (source === id ? resolved : undefined),
    async load(source) {
      if (source !== resolved) return;
      // the resolver and every file it lists; a change rebuilds (hotUpdate below). The resolver first, so a resolver that
      // doesn't parse is still watched and fixing it rebuilds. Vite compares posix paths (normalizePath).
      const watch = (url: URL) => {
        const path = normalizePath(fileURLToPath(url));
        watched.add(path);
        this.addWatchFile(path);
      };
      watch(RESOLVER);
      for (const file of registered()) watch(new URL(file, RESOLVER));
      const { tokens, resolver, sources, config, logger } = await parseSource([docsTokens()]);
      const { outputFiles } = await build(tokens, { resolver, sources, config, logger });
      const output = outputFiles.find((file) => file.filename === FILENAME);
      if (!output) throw new Error(`The Terrazzo build wrote no ${FILENAME}`);
      return `export default ${output.contents}`;
    },
    // Vite watches the files above but doesn't tie them to a virtual module, so invalidate it here; the update then
    // travels up to the pages that import it
    hotUpdate({ file }) {
      if (!watched.has(file)) return;
      const module = this.environment.moduleGraph.getModuleById(resolved);
      if (!module) return;
      this.environment.moduleGraph.invalidateModule(module);
      return [module];
    },
  };
};
