// pts/tier-aliases: semantic tokens alias primitives, and component tokens alias semantic tokens
// (CLAUDE.md → Token Rules → Tiers, ADR 0032).
// Why not built-in: Terrazzo has no notion of tiers. The tier is the token's folder (primitive/, semantic/, or
// component/), which a merged token no longer knows, so this rule reads the files.
// Options name the documented exceptions, so they are visible in the config.
import type { LintRule } from "@terrazzo/parser";
import { files } from "../source.ts";

type Options = {
  /** semantic groups that may hold raw values (z-index, breakpoint: stacking order and viewport widths have no meaning outside their role; line-height: a ratio only means something paired with its font size) */
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

const TIERS = ["primitive", "semantic", "component"];

const rule: LintRule<"FOLDER" | "RAW_VALUE" | "SEMANTIC_ALIAS" | "UPWARD_ALIAS" | "COMPONENT_RAW" | "COMPONENT_ALIAS", Options> = {
  meta: {
    docs: { description: "Token files sit in primitive/, semantic/, or component/; semantic tokens alias primitives, component tokens alias semantic tokens." },
    messages: {
      FOLDER: "{{file}}: token files go in primitive/, semantic/, or component/",
      RAW_VALUE: "{{file}}: {{id}} holds a raw value ({{value}}); semantic tokens alias a primitive",
      SEMANTIC_ALIAS: "{{file}}: {{id}} → {{ref}} is a semantic token; semantic tokens alias a primitive",
      UPWARD_ALIAS: "{{file}}: {{id}} → {{ref}} is a component token; tiers alias downward only",
      COMPONENT_RAW: "{{file}}: {{id}} holds a raw value ({{value}}); component tokens alias a semantic token",
      COMPONENT_ALIAS: "{{file}}: {{id}} → {{ref}} is a {{tier}} token; component tokens alias a semantic token",
    },
  },
  defaultOptions: { rawValues: [], semanticAliases: [] },
  create({ report, options }) {
    const all = files();
    const tierOf = new Map(all.flatMap(({ tier, tokens }) => Object.keys(tokens).map((id) => [id, tier] as const)));
    for (const { path: file, tier, tokens } of all) {
      if (!TIERS.includes(tier)) report({ messageId: "FOLDER", data: { file } });
      if (tier === "component") {
        // no exceptions: a value a component needs that no semantic token holds is a missing semantic token
        for (const [id, token] of Object.entries(tokens)) {
          const [raw] = rawLeaves(token.$value);
          if (raw !== undefined) report({ messageId: "COMPONENT_RAW", data: { file, id, value: JSON.stringify(raw) } });
          for (const ref of aliasesIn(token.$value)) {
            const refTier = tierOf.get(ref);
            if (refTier !== "semantic") report({ messageId: "COMPONENT_ALIAS", data: { file, id, ref: `{${ref}}`, tier: refTier ?? "missing" } });
          }
        }
      }
      if (tier !== "semantic") continue;
      for (const [id, token] of Object.entries(tokens)) {
        const group = id.split(".")[0];
        if (!options.rawValues.includes(group)) {
          const [raw] = rawLeaves(token.$value);
          if (raw !== undefined) report({ messageId: "RAW_VALUE", data: { file, id, value: JSON.stringify(raw) } });
        }
        for (const ref of aliasesIn(token.$value)) {
          if (tierOf.get(ref) === "component") report({ messageId: "UPWARD_ALIAS", data: { file, id, ref: `{${ref}}` } });
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
