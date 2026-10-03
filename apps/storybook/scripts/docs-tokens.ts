// The docs' token data, built by Terrazzo (ADR 0038). The docs never resolve an alias themselves: a Terrazzo plugin
// writes every permutation as Terrazzo's resolver applies it, and a Vite plugin runs that build in memory and serves
// the result as "virtual:pts-tokens". It runs again when a token file changes, so the dev server stays live.
import { fileURLToPath } from "node:url";
import { build, type Plugin as TerrazzoPlugin, type Resolver } from "@terrazzo/parser";
import type { Plugin as VitePlugin } from "vite";
import { files, parseSource, permutations, registered, RESOLVER } from "../../../tokens/source.ts";
import type { DocsTokens, DocsValue } from "../src/tokens-data.ts";

const FILENAME = "docs-tokens.json";
const MODIFIERS = ["theme", "density", "viewport"];

// The order the docs list tokens in: file order, with the density files first, so gap/within and gap/between come
// before the base gap/section, and the viewport files last, so the display steps follow the base text steps.
const LAYERS = ["density", "base", "theme", "viewport"];

export const docsData = (resolver: Resolver): DocsTokens => {
  const sources = files(resolver).sort((a, b) => LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer));
  const tierOf = new Map<string, string>();
  for (const { tier, tokens } of sources) for (const id of Object.keys(tokens)) if (!tierOf.has(id)) tierOf.set(id, tier);

  const values: DocsTokens["values"] = {};
  let first: DocsTokens["tokens"] | undefined;
  for (const { label, input, tokens, error } of permutations(resolver)) {
    if (!tokens) throw new Error(`${label} does not resolve: ${error}`);
    first ??= [...tierOf].map(([id, tier]) => ({ id, type: tokens[id].$type, description: tokens[id].$description, tier }));
    values[MODIFIERS.map((m) => input[m]).join("/")] = Object.fromEntries(
      [...tierOf.keys()].map((id): [string, DocsValue] => [id, { value: tokens[id].$value, alias: tokens[id].aliasChain?.[0] }]),
    );
  }
  return { tokens: first ?? [], values };
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
      // the resolver and every file it lists; a change rebuilds (hotUpdate below)
      for (const path of [RESOLVER, ...registered().map((file) => new URL(file, RESOLVER))]) {
        watched.add(fileURLToPath(path));
        this.addWatchFile(fileURLToPath(path));
      }
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
