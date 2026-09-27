// pts/tier-aliases: semantic tokens alias primitives (CLAUDE.md → Token Rules → Tiers).
// Why not built-in: Terrazzo has no notion of tiers. The tier is the token's folder (primitive/ or semantic/),
// which a merged token no longer knows, so this rule reads the files.
// Options name the documented exceptions, so they are visible in the config.
import type { LintRule } from "@terrazzo/parser";
import { files } from "../source.ts";

type Options = {
  /** semantic groups that may hold raw values (z-index: stacking order has no meaning outside its role) */
  rawValues: string[];
  /** semantic groups that may alias other semantic tokens (text/*: composites of semantic properties) */
  semanticAliases: string[];
};

const ALIAS = /^\{([^}]+)\}$/;

/** Leaves of a value that are not aliases; a color or dimension object counts as one leaf */
const rawLeaves = (value: unknown): unknown[] => {
  if (typeof value === "string") return ALIAS.test(value) ? [] : [value];
  if (Array.isArray(value)) return value.flatMap(rawLeaves);
  if (value && typeof value === "object" && !("colorSpace" in value) && !("unit" in value)) return Object.values(value).flatMap(rawLeaves);
  return [value];
};

const aliasesIn = (value: unknown): string[] => {
  if (typeof value === "string") return [...value.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  if (value && typeof value === "object") return Object.values(value).flatMap(aliasesIn);
  return [];
};

const rule: LintRule<"FOLDER" | "RAW_VALUE" | "SEMANTIC_ALIAS", Options> = {
  meta: {
    docs: { description: "Token files sit in primitive/ or semantic/, and semantic tokens alias primitives." },
    messages: {
      FOLDER: "{{file}}: token files go in primitive/ or semantic/",
      RAW_VALUE: "{{file}}: {{id}} holds a raw value ({{value}}); semantic tokens alias a primitive",
      SEMANTIC_ALIAS: "{{file}}: {{id}} → {{ref}} is a semantic token; semantic tokens alias a primitive",
    },
  },
  defaultOptions: { rawValues: [], semanticAliases: [] },
  create({ report, options }) {
    const all = files();
    const tierOf = new Map(all.flatMap(({ tier, tokens }) => Object.keys(tokens).map((id) => [id, tier] as const)));
    for (const { path: file, tier, tokens } of all) {
      if (tier !== "primitive" && tier !== "semantic") report({ messageId: "FOLDER", data: { file } });
      if (tier !== "semantic") continue;
      for (const [id, token] of Object.entries(tokens)) {
        const group = id.split(".")[0];
        if (!options.rawValues.includes(group)) {
          const [raw] = rawLeaves(token.$value);
          if (raw !== undefined) report({ messageId: "RAW_VALUE", data: { file, id, value: JSON.stringify(raw) } });
        }
        if (!options.semanticAliases.includes(group)) {
          for (const ref of aliasesIn(token.$value)) {
            if (tierOf.get(ref) === "semantic") report({ messageId: "SEMANTIC_ALIAS", data: { file, id, ref: `{${ref}}` } });
          }
        }
      }
    }
  },
};

export default rule;
